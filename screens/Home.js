import { useState, useEffect, useCallback, useRef} from 'react';
import { StyleSheet, Text, View, Button, FlatList, TouchableOpacity, ImageBackground, Modal,
  KeyboardAvoidingView, ScrollView, Alert, Image, TouchableWithoutFeedback, TextInput, Pressable, ToastAndroid,
  ActivityIndicator, SafeAreaView, Platform, RefreshControl} from 'react-native';
import Card from '../shared/Card';
import { MaterialIcons } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import { Entypo } from '@expo/vector-icons';
import Form from '../shared/Form';
import { getFirestore, addDoc, collection, serverTimestamp, onSnapshot, query, orderBy,
   doc, deleteDoc, setDoc, Timestamp, updateDoc, getDoc, getDocs } from 'firebase/firestore'
import { getAuth } from 'firebase/auth';
import { Menu, MenuOptions, MenuOption, MenuTrigger, } from 'react-native-popup-menu';
// import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import _ from 'lodash';
import * as FileSystem from "expo-file-system";
import { useDispatch, useSelector } from 'react-redux';
import { setNewKey } from '../features/themeSlice';

// component
export default function Home({ navigation }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [convID, setConvID] = useState('');
  const [response, setResponse] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [showIndicator, setShowIndicator] = useState(false);
  const [conversationsIndicator, setConversationsIndicator] = useState(true);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const db = getFirestore();
  const user = getAuth().currentUser;
  
  //redux store
  const dispatch = useDispatch();
  const { mainColor, backgroundColor, tabColor, iconColor,
    iconActiveColor, conAuthorBarColor, convAuthorTextColor, homeConvTitleColor,
    homeConvBodyColor, topButtonsColors, userNameColor, userIDColor, actionColor, actionInsideColor,
    headerTextColor, convAuthorPic, topButtonsBar
  } = useSelector(state => state.theme);

  const focused = useIsFocused();
  const authors = useRef({});
  const flag = useRef('first render');

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    dispatch(setNewKey());
  }, [])
  

  useEffect(() => {
    const focusTasks = async () => {
      if(focused) enterConversation.cancel();
      
      setModalVisible(false);
      setShowPassword(false);
      setPassword('');
      setResponse(null);
      
    }

    focusTasks();
    
  }, [focused])


  useEffect(() => {
    const colRef = collection(db, 'Users', user.uid, 'My Conversations');
    const q = query(colRef, orderBy('lastAccessed'));
    let result = [];
    // let authors = {};

    const unsubscribeUser = onSnapshot(doc(db, 'Users', user.uid), async snapShot => {
      const photo = await loadImage(snapShot.data().Photo, snapShot.data().photoExtension);
      setPhotoUrl(photo);
    }, error => {console.log(error)})

    const unsubscribe1 = onSnapshot(q, async snapShot => {
      for(let change of snapShot.docChanges()) {
        if(change.type === 'added') {
          console.log("triggered added: ", change.doc.data());
          if(authors.current[change.doc.data().authorID+'ID'] == undefined) {
            const info = await getDoc(doc(db, 'Users', change.doc.data().authorID));

            const photo = await loadImage(info.data().Photo, info.data().photoExtension);

            authors.current[info.id + 'Name'] = info.data().Name;
            authors.current[info.id + 'Photo'] = photo;
            authors.current[info.id + 'ID'] = info.id;
          }

          const empty = change.doc.data().dateCreated === null ? Timestamp.now() : change.doc.data().dateCreated;
          
          result.unshift({id: change.doc.id, ...change.doc.data(), dateCreated: empty.toDate(), 
            uri: authors.current[change.doc.data().authorID+'Photo'], 
            author: authors.current[change.doc.data().authorID+'Name']});
        }
  
        //if deleted:
        else if(change.type === 'removed') {
          console.log("triggered removed: ", change.doc.id);
          const index = result.map(e => e.id).indexOf(change.doc.id);
          result.splice(index,1);
        }
  
        //if modified:
        else if(change.type === 'modified') {
          console.log("triggered modified: ", change.doc.data());
          const index = result.map(e => e.id).indexOf(change.doc.id);
          if(index == -1) return;
          result.splice(index,1);

          if(authors.current[change.doc.data().authorID+'ID'] == undefined) {
            const info = await getDoc(doc(db, 'Users', change.doc.data().authorID));

            const photo = await prepareImg(info.data().Photo, info.data().photoExtension);

            authors.current[info.id + 'Name'] = info.data().Name;
            authors.current[info.id + 'Photo'] = photo;
            authors.current[info.id + 'ID'] = info.id;
          }

          const empty = change.doc.data().dateCreated === null ? Timestamp.now() : change.doc.data().dateCreated;
          
          result.unshift({id: change.doc.id, ...change.doc.data(), dateCreated: empty.toDate(), 
            uri: authors.current[change.doc.data().authorID+'Photo'], 
            author: authors.current[change.doc.data().authorID+'Name']});
        }
        
      }
      
      // console.log('result: ', result);
      setConversations(prev => {prev = result; return[...prev]});
      setConversationsIndicator(false);
      flag.current = 'rendered';
    }, error => {console.log(error)})
    
    return () => {
      unsubscribe1();
      unsubscribeUser();
    }
  }, [])


  const checkCache = async (uri) => {
    try {
      let info = await FileSystem.getInfoAsync(uri);
      return { ...info, err: false };
    } catch (error) {
      return {
        exists: false,
        err: true,
        msg: error,
      };
    }
  }

  const cacheImage = async (uri, cacheUri) => {
    // console.log('will download');
    try {
      const createDownload = FileSystem.createDownloadResumable(
        uri,
        cacheUri,
      );
      const downloadImage = await createDownload.downloadAsync();
      return {
        cached: true,
        err: false,
        path: downloadImage.uri,
      };
    } 
    catch (error) {
      return {
        cached: false,
        err: true,
        msg: error,
      };
    }
  }

  const loadImage = async (photo, photoExtension) => {
    const newUri = /[^=]*$/.exec(photo)[0];
    const cacheFileUri = `${FileSystem.cacheDirectory}${newUri}.${photoExtension}`;
    const isNew = await checkCache(cacheFileUri);
    if (isNew.exists) {
      // console.log("cached!");
      return cacheFileUri;
    } else {
      let cached = await cacheImage(photo, cacheFileUri);
      if (cached.cached) {
        // console.log("cached new!");
        return cached.path;
      } else {
        console.log("Couldn't load Image!");
        console.log(cached.msg)
      }
    }
  }

  const deletePost = (id) => {
    deleteDoc(doc(db, 'Users', user.uid, 'My Conversations', id));
    deleteDoc(doc(db, 'Conversations', id));
    
  }

  const showAlert = (id) => {
    Alert.alert(
      'Delete Conversation?',
      'Are you sure you want to delete this conversation?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: "confirm",
          onPress: () => deletePost(id)
        }
      ],
      {
        cancelable: true
      }
    )
  }

  const leaveConversations = async (id) => {
    const checkExist = await getDoc(doc(db, 'Conversations', id, 'Participants', user.uid));
    if(checkExist.data().removed == true) {
      await deleteDoc(doc(db, 'Users', user.uid, 'My Conversations', id));
    }
    else {
      updateDoc(doc(db, 'Conversations', id, 'Participants', user.uid), {
        removed: true,
      });
  
      addDoc(collection(db, 'Conversations', id, 'Comments'), {
        comment: 'left',
        author: user.displayName,
        authorID: user.uid,
        timeStamp: serverTimestamp(),
        system: true,
      })
  
      deleteDoc(doc(db, 'Users', user.uid, 'My Conversations', id));
    }
  }

  const showAlertLeave = (id) => {
    Alert.alert(
      'Leave Conversation?',
      'Are you sure you want to leave this conversation?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: "confirm",
          onPress: () => leaveConversations(id)
        }
      ],
      {
        cancelable: true
      }
    )
  }

  const clickOut = () => {
    setModalVisible(false);
    setConvID('');
    setResponse(null);
    setShowPassword(false);
    setPassword('');
  }

  const joinConversation = async (convID) => {
    setShowIndicator(true);
    setResponse(null);
    
    convID = convID.replace(/\s/g,'');

    const convRef = await getDoc(doc(db, 'Conversations', convID));
    if(showPassword == false) {
      console.log('11111');
      if(convID == '') {
        setShowIndicator(false);
        setResponse('No conversations found!');
        return;
      }
      
      if(convRef.exists()) {
        console.log('22222');
        const checkExist = await getDoc(doc(db, 'Conversations', convID, 'Participants', user.uid));
        if(checkExist.exists() && checkExist.data().removed == false) {
          console.log('already joined!');
          navigation.navigate('Details', { id: convID });
          return;
        }
    
        // const checkBan = await getDoc(doc(db, 'Conversations', convID, 'Banned Users', user.uid));
        // if(checkBan.exists()) {
        //   console.log('BANNED!');
        //   setResponse('unable to join Conversation');
        //   setShowIndicator(false);
        //   return;
        // }
        
        if(convRef.data().password) {
          console.log('enter password');
          setShowPassword(true);
          setShowIndicator(false);
          return;
        }
  
        await setDoc(doc(db, 'Conversations', convID, 'Participants', user.uid), {
          ID: user.uid,
          Name: user.displayName,
          Admin: false,
          removed: false,
        })

        addDoc(collection(db, 'Conversations', convID, 'Comments'), {
          comment: 'joined',
          author: user.displayName,
          authorID: user.uid,
          timeStamp: serverTimestamp(),
          system: true,
          Name2: user.displayName,
          uri2: user.photoURL,
          removed2: false,
        })

        if(!conversations.find(e => e.id == convID)) {
          await setDoc(doc(db, 'Users', user.uid, 'My Conversations', convID), {
            authorID: convRef.data().authorID,
            title: convRef.data().title,
            body: convRef.data().body,
            dateCreated: Timestamp.now(),
            lastAccessed: Timestamp.now(),
          })
        }
        
        console.log('enter 1 ..');
        navigation.navigate('Details', { id: convID });
      } 
      else {
        console.log('33333');
        setShowIndicator(false);
        setResponse('No conversations found!');
      }
    }
    else {
      console.log('44444');
      if(password == convRef.data().password) {
        await setDoc(doc(db, 'Conversations', convID, 'Participants', user.uid), {
          ID: user.uid,
          Name: user.displayName,
          Admin: false,
          removed: false,
        })

        await setDoc(doc(db, 'Users', user.uid, 'My Conversations', convID), {
          authorID: convRef.data().authorID,
          title: convRef.data().title,
          body: convRef.data().body,
          dateCreated: Timestamp.now(),
          lastAccessed: Timestamp.now(),
        })
        console.log('enter 2 ..');
        navigation.navigate('Details', { id: convID });
      }
      else {
        console.log('wrong password!');
        setShowIndicator(false);
        setResponse('Incorrect Password!');
        return;
      }
    }
  }

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(user.uid);
    if(Platform.OS === 'android')
      ToastAndroid.show('ID copied', ToastAndroid.SHORT);
    else {
      Alert.alert(
        'ID Copied to clipboard',
        '',
        [
          {
            text: 'Ok',
            style: 'ok'
          },
        ],
        {
          cancelable: true
        }
      )
    }
  }

  const enterConversation = useCallback(_.debounce((id) => {
    navigation.push('Details', { id });
  }, 2000, {'leading':true, 'trailing':false}), [])

  const enter2 = (id) => {
    navigation.navigate('Details', { id });
  }

  return (
    <SafeAreaView style={{flex:1, backgroundColor:mainColor}}>
      <View style={{flex:1, backgroundColor:backgroundColor}}>
        
        <Modal visible={modalVisible} animationType='fade' transparent={true}
          onRequestClose={clickOut}
        >
          <TouchableWithoutFeedback onPress={clickOut}>
            <View style={styles.outerView}>
              <TouchableWithoutFeedback>
              <View style={styles.innerView}>
                <TextInput placeholder='Conversation ID' value={convID} onChangeText={text => setConvID(text)} style={styles.inputP}/> 
                {showPassword && 
                  <View>
                    <TextInput placeholder='Password' value={password} onChangeText={text => setPassword(text)} style={styles.inputP} secureTextEntry /> 
                  </View>
                }
                {response && <Text style={{color:'white', fontSize:17, marginHorizontal:15, alignSelf:'center'}}>{ response }</Text> }
                {showIndicator==false? (
                    <Pressable
                      onPress={() => joinConversation(convID)}
                      style={({ pressed }) => [
                        {opacity: pressed ? 0.5: 1}, styles.changeEmail
                      ]}
                    >
                      <View style={{flexDirection:'row', alignItems:'center',}}>
                        <Text style={{color:"#806b96", fontSize: 16,}}>Join</Text>
                      </View>
                    </Pressable>
                  ) : (
                    <View style={styles.indicator}>
                      <ActivityIndicator size={40} color='#613a5f' animating={showIndicator} />
                    </View>
                  )
                }
              </View>
              </TouchableWithoutFeedback>

            </View>
          </TouchableWithoutFeedback>
        </Modal>

        <View style={{elevation:15, backgroundColor:mainColor}}>
          <View style={[styles.homeHeader, {backgroundColor:mainColor}]}>
            <Text style={{fontSize:19, color:headerTextColor, fontFamily:'Solway-Regular', marginLeft:10}}>Conversations</Text>
          </View>
          
          {/* Page Contents */}
          
          <View style={{backgroundColor:mainColor, padding:5, flexDirection:'row', alignItems:'center',}}>
            <Image source={{uri: photoUrl}} style={{height:40, width:40, borderRadius:50, borderColor:userNameColor, borderWidth:1}} />
            <View style={{marginHorizontal:4, flex:5}}>
              <Text style={{color:userNameColor, fontSize:18,}}>{ user.displayName }</Text>
              <Text style={{color: userIDColor, fontSize:Platform.OS=='android'?13:12}}>{ user.uid }</Text>
            </View>
            <Pressable
              onPress={copyToClipboard}
              style={({ pressed }) => [
                {opacity: pressed ? 0.5: 1}, styles.copyID, {backgroundColor:actionColor}
              ]}
            >
              <View style={{flexDirection:'row', alignItems:'center',}}>
                <MaterialIcons name='file-copy' size={17} color={actionInsideColor} />
              </View>
            </Pressable>
          </View>
        </View>

        <View style={{flexDirection:'row', padding:10, backgroundColor:backgroundColor}}>
          <TouchableOpacity onPress={() => {setShowIndicator(false); setModalVisible(true)}} style={[styles.joinConv, {borderColor:topButtonsColors}]}>
              <Text style={{color:topButtonsColors, fontSize:16, marginRight:5, fontFamily:'Solway-Regular'}}>Join</Text>
              <Ionicons name='arrow-redo-outline' size={20} color={topButtonsColors} />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('New Conversation')} style={[styles.newConv, {borderColor:topButtonsColors}]}>
              <Text style={{color:topButtonsColors, fontSize:16, marginRight:5, fontFamily:'Solway-Regular'}}>New</Text>
              <Entypo name='new-message' size={20} color={topButtonsColors} />
          </TouchableOpacity>
        </View>

        {(conversations.length == 0 && !conversationsIndicator)? (
          <TouchableOpacity onPress={() => navigation.navigate('New Conversation')} style={[styles.newMid, {borderColor:topButtonsColors}]}>
           <Entypo name='new-message' size={80} color={topButtonsColors} style={{opacity:0.5, marginBottom:10}}/>
           <Text style={{color:topButtonsColors, fontSize:18, fontFamily:'Solway-Regular', opacity:0.5}}>
              Click to create a new conversation
            </Text>
          </TouchableOpacity>
        ) : null}

        <View style={{flex: 1}}>
          {conversationsIndicator? (
            <ActivityIndicator size={80} color={mainColor} animating={conversationsIndicator} style={{flex:1}} />
          ) : (
            <FlatList data={conversations} refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#613a5f']} />
            } renderItem={({ item }) => (
              <TouchableOpacity onPress={() => enter2(item.id)} style={styles.item}>
                <Card>
                  <View style={styles.content}>
                    <View style={styles.header}>
                      <Text style={[styles.titleText, {color:homeConvTitleColor}]} numberOfLines={1}>{ item.title }</Text>
                        <Menu>
                          <MenuTrigger>
                            <MaterialIcons name='more-horiz' size={24} color="grey" style={{padding:3}}/>
                          </MenuTrigger>
                          <MenuOptions>
                            {user.uid == item.authorID ? (
                              <MenuOption onSelect={() => showAlert(item.id)}>
                                <Text style={{color: "red", fontSize: 18, margin: 5}}>Delete Conversation</Text>
                              </MenuOption>
                            ) : null
                            }
                            {item.authorID != user.uid ? (
                              <MenuOption onSelect={() => showAlertLeave(item.id)}>
                                <Text style={{color: "red", fontSize: 18, margin: 5}}>Leave Conversation</Text>
                              </MenuOption>
                            ) : null
                            }
                          </MenuOptions>
                        </Menu>
                    </View>
                    <Text style={[styles.body, {color:homeConvBodyColor}]} numberOfLines={2}>{ item.body }</Text>
                  </View>
                 
                  <View style={styles.createdViewContainer}>
                    <View style={[styles.createdView, {backgroundColor:conAuthorBarColor}]}>
                      {item.author == user.displayName? (
                          <Text style={[styles.createdAuthor, {color:convAuthorTextColor}]} numberOfLines={1}>{ user.displayName }</Text>
                        ) : (
                          <Text style={[styles.createdAuthor, {color:convAuthorTextColor}]} numberOfLines={1}>{ item.author }</Text>
                        )
                      }
                      {/* <Text style={styles.createdTime}>{ item.dateCreated.toDateString()}</Text> */}
                    </View>
                    {item.author == user.displayName? (
                        <Image source={{uri: photoUrl}} style={[styles.pic, {borderColor:null}]} />
                      ) : (
                        <Image source={{uri: item.uri}} style={[styles.pic, {borderColor:null}]} />
                      )
                    }
                  </View>
  
                </Card>
              </TouchableOpacity>
            )}/>
          )}
          
        </View>
        
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  modalClose: {
    marginTop: 20,
    marginBottom: 0,
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#d5ccd9',
  },
  modalBody: {
    flex: 1,
    alignItems: 'center',
    alignItems: 'stretch',
    margin: 20,
    paddingTop: 20,
  },
  content:{
    marginHorizontal: 13,
    marginTop: 10,
  },
  createdView: {
    flexDirection: 'row',
    flex: 1,
    marginTop:'auto',
    backgroundColor: '#cebce0',
    padding: 10,
    marginHorizontal: 0
  },
  joinConv: {
    marginRight:10,
    marginLeft:'auto',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f2f2f2',
    padding: 10,
    borderRadius: 10,
    flexDirection: 'row',
    borderStyle: 'dashed'
  },
  newConv: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f2f2f2',
    padding: 10,
    borderRadius: 10,
    flexDirection: 'row',
    borderStyle: 'dashed'
  },
  newMid: {
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f2f2f2',
    padding: 10,
    paddingVertical:30,
    borderRadius: 10,
    borderStyle: 'dashed',
    alignSelf:'center',
    marginTop:100,
    opacity:0.5
  },
  homeHeader: {
    flexDirection: 'row',
    alignItems:'center',
    backgroundColor: '#613a5f',
    padding: 5
  },
  titleText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 50
  },
  createdAuthor: {
    fontSize: 15,
    color: '#545303',
    marginLeft: 55,
  },
  createdTime: {
    fontSize: 15,
    marginLeft: 'auto'
  },
  body: {
    marginTop: 10,
    fontSize: 17,
  },
  header: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  item: {
    marginHorizontal: 10,
    marginBottom: 20,
    backgroundColor:'white',
    elevation: 8,
    shadowOffset: {width:0, height:5},
    shadowOpacity: 0.3,
    shadowRadius: 5,
    borderRadius:5
  },
  pic: {
    width: 50,
    height: 50,
    borderRadius: 60,
    position:'absolute',
    marginLeft:3,
    borderColor: '#51445e',
    borderWidth:1.5
  },
  createdViewContainer: {
    flexDirection:'row', 
    alignItems:'center', 
    marginTop: 15,
  },
  outerView: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent:'center'
  },
  innerView: {
    backgroundColor: '#806b96',
    alignItems:'stretch',
    flex: 1,
    justifyContent:'center',
    paddingVertical: 10,
    elevation: 15,
    opacity:1,
    margin: 20,
    marginVertical: 80
  },
  inputP:{
    backgroundColor: 'white',
    fontSize: 20,
    padding: 6,
    borderTopRightRadius: 18,
    borderBottomRightRadius: 18,
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
    elevation:8,
    marginHorizontal: 15,
    textAlign:'center',
    paddingLeft:2,
    marginBottom:20
  },
  changeEmail: {
    padding: 8,
    backgroundColor: '#d4c86e',
    alignItems: 'center',
    borderRadius:20,
    elevation:10,
    marginHorizontal: 15,
    marginTop: 20
  },
  copyID: {
    padding: 5,
    backgroundColor: '#d4c86e',
    alignItems: 'center',
    borderRadius:20,
    flex: 1,
  },
  indicator: {
    alignItems:'center'
  }
});