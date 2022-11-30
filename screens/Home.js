import { useState, useEffect, useCallback, useRef} from 'react';
import { StyleSheet, Text, View, Button, FlatList, TouchableOpacity, ImageBackground, Modal,
  KeyboardAvoidingView, ScrollView, Alert, Image, TouchableWithoutFeedback, TextInput, Pressable, ToastAndroid,
  ActivityIndicator, } from 'react-native';
import { globalStyles } from '../shared/globalStyles';
import Card from '../shared/Card';
import { MaterialIcons } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import Form from '../shared/Form';
import { getFirestore, addDoc, collection, serverTimestamp, onSnapshot, query, orderBy,
   doc, deleteDoc, setDoc, Timestamp, updateDoc, getDoc, getDocs } from 'firebase/firestore'
import { getAuth } from 'firebase/auth';
import { Menu, MenuOptions, MenuOption, MenuTrigger, } from 'react-native-popup-menu';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import avatar from '../assets/Imgs/avatar.png';
import { useIsFocused } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import _, { set } from 'lodash';
import * as FileSystem from "expo-file-system";

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

  const db = getFirestore();
  const storage = getStorage();
  const defaultImg = Image.resolveAssetSource(avatar).uri;
  const user = getAuth().currentUser;

  const focused = useIsFocused();
  const authors = useRef({});
  const flag = useRef('first render');

  useEffect(() => {
    const focusTasks = async () => {
      if(focused) enterConversation.cancel();
      
      setModalVisible(false);
      setShowPassword(false);
      setPassword('');
      setResponse(null);
      

      // if(flag.current != 'first render' && focused) {
      //   const colRef = collection(db, 'Users', user.uid, 'My Conversations');
      //   const q = query(colRef, orderBy('lastAccessed', 'desc'));
      //   const convs = await getDocs(q);
      //   setConversations(prev => {
      //     prev = [];
          
      //     for(let conv of convs.docs) {
      //       const empty = conv.data().dateCreated === null ? Timestamp.now() : conv.data().dateCreated;
      //       prev.push({id: conv.id, ...conv.data(), 
      //         dateCreated: empty.toDate(),
      //         uri: authors.current[conv.data().authorID+'Photo'], 
      //         author: authors.current[conv.data().authorID+'Name']});
      //     }
      //     return [...prev];
      //   });
      // }
    }

    focusTasks();
    
  }, [focused])

  // useEffect(() => {
  //   console.log('display conversations: ', conversations)
  // }, [conversations])

  useEffect(() => {
    const colRef = collection(db, 'Users', user.uid, 'My Conversations');
    const q = query(colRef, orderBy('lastAccessed'));
    let result = [];
    // let authors = {};

    const unsubscribe1 = onSnapshot(q, async snapShot => {
      for(let change of snapShot.docChanges()) {
        if(change.type === 'added') {
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
        else if(change.type === 'removed') {
          const index = result.map(e => e.id).indexOf(change.doc.id);
          result.splice(index,1);
        }
        else if(change.type === 'modified') {
          const index = result.map(e => e.id).indexOf(change.doc.id);
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
    }
  }, [])


  async function findImageInCache(uri) {
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

  async function cacheImage(uri, cacheUri, callback) {
    // console.log('will download');
    try {
      const downloadImage = FileSystem.createDownloadResumable(
        uri,
        cacheUri,
        {},
        callback
      );
      const downloaded = await downloadImage.downloadAsync();
      return {
        cached: true,
        err: false,
        path: downloaded.uri,
      };
    } catch (error) {
      return {
        cached: false,
        err: true,
        msg: error,
      };
    }
  }

  async function prepareImg(photo, photoExtension) {
    const newUri = /[^=]*$/.exec(photo)[0];
    const cacheFileUri = `${FileSystem.cacheDirectory}${newUri}.${photoExtension}`;
    const isNew = await findImageInCache(cacheFileUri);
    if (isNew.exists) {
      // console.log("cached!");
      return cacheFileUri;
    } else {
      let cached = await cacheImage(photo, cacheFileUri, () => {});
      if (cached.cached) {
        // console.log("cached new!");
        return cached.path;
      } else {
        // console.log("Couldn't load Image!");
        // console.log(cached.msg)
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
    await updateDoc(doc(db, 'Conversations', id, 'Participants', user.uid), {
      removed: true,
    });

    await addDoc(collection(db, 'Conversations', id, 'Comments'), {
      comment: 'left',
      author: user.displayName,
      authorID: user.uid,
      timeStamp: serverTimestamp(),
      system: true,
    })

    await deleteDoc(doc(db, 'Users', user.uid, 'My Conversations', id));
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
    console.log('before: ', "'" + convID + "'");
    convID = convID.replace(/\s/g,'');
    console.log('after: ', "'" + convID + "'");

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
    
        const checkBan = await getDoc(doc(db, 'Conversations', convID, 'Banned Users', user.uid));
        if(checkBan.exists()) {
          console.log('BANNED!');
          setResponse('unable to join Conversation');
          setShowIndicator(false);
          return;
        }
        
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

        await addDoc(collection(db, 'Conversations', convID, 'Comments'), {
          comment: 'joined',
          author: user.displayName,
          authorID: user.uid,
          timeStamp: serverTimestamp(),
          system: true,
        })

        await setDoc(doc(db, 'Users', user.uid, 'My Conversations', convID), {
          authorID: convRef.data().authorID,
          title: convRef.data().title,
          body: convRef.data().body,
          dateCreated: serverTimestamp()
        })
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
          dateCreated: serverTimestamp()
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

    ToastAndroid.show('ID copied', ToastAndroid.SHORT);
  }

  const enterConversation = useCallback(_.debounce((id) => {
    navigation.push('Details', { id });
  }, 2000, {'leading':true, 'trailing':false}), [])

  return (
    <SafeAreaView style={{flex:1}}>
      <View style={{...globalStyles.container, backgroundColor:'#806b96'}}>
        
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

        <View style={{elevation:15, backgroundColor:'#613a5f'}}>
          <View style={styles.homeHeader}>
            {/* <Ionicons name='chevron-back-circle' size={27} color="white" /> */}
            <Text style={{fontSize:19, color:'white', fontFamily:'Solway-Regular', marginLeft:10}}>Conversations</Text>
          </View>
          
          {/* Page Contents */}

          <View style={{backgroundColor:'#613a5f', padding:5, flexDirection:'row', alignItems:'center',}}>
            <Image source={{uri: user.photoURL}} style={{height:40, width:40, borderRadius:50, borderColor:'#bab806', borderWidth:1}} />
            <View style={{marginHorizontal:4, flex:5}}>
              <Text style={{color:'#bab806', fontSize:18}}>{ user.displayName }</Text>
              <Text style={{color: '#bfbfb0'}}>{ user.uid }</Text>
            </View>
            <Pressable
              onPress={copyToClipboard}
              style={({ pressed }) => [
                {opacity: pressed ? 0.5: 1}, styles.copyID
              ]}
            >
              <View style={{flexDirection:'row', alignItems:'center',}}>
                {/* <Text style={{color:"#806b96", fontSize: 15, marginRight:3}}>Copy ID</Text> */}
                <MaterialIcons name='file-copy' size={17} color='#806b96' />
              </View>
            </Pressable>
          </View>
        </View>

        <View style={{flexDirection:'row', padding:10,}}>
          <TouchableOpacity onPress={() => {setShowIndicator(false); setModalVisible(true)}} style={styles.joinConv}>
              <Text style={{color:'white', fontSize:16, marginRight:5, fontFamily:'Solway-Regular'}}>Join</Text>
              <Ionicons name='arrow-redo-outline' size={20} color='white' />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('New Conversation')} style={styles.newConv}>
              <Text style={{color:'white', fontSize:16, marginRight:5, fontFamily:'Solway-Regular'}}>New</Text>
              <MaterialIcons name='add' size={20} color='white' />
          </TouchableOpacity>
        </View>

        <View style={{flex: 1}}>
          {conversationsIndicator? (
            <ActivityIndicator size={80} color='#613a5f' animating={conversationsIndicator} style={{flex:1}} />
          ) : (
            <FlatList data={conversations} renderItem={({ item }) => (
              <TouchableOpacity onPress={() => enterConversation(item.id)} style={styles.item}>
                <Card>
                  <View style={styles.content}>
                    <View style={styles.header}>
                      <Text style={styles.titleText} numberOfLines={1}>{ item.title }</Text>
                        <Menu>
                          <MenuTrigger>
                            <MaterialIcons name='more-horiz' size={24} color="grey"/>
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
                    <Text style={styles.body} numberOfLines={2}>{ item.body }</Text>
                  </View>
                 
                  <View style={styles.createdViewContainer}>
                    <View style={styles.createdView}>
                      {item.author == user.displayName? (
                          <Text style={styles.createdAuthor}>{ user.displayName }</Text>
                        ) : (
                          <Text style={styles.createdAuthor}>{ item.author }</Text>
                        )
                      }
                      {/* <Text style={styles.createdTime}>{ item.dateCreated.toDateString()}</Text> */}
                    </View>
                    {item.author == user.displayName? (
                        <Image source={{uri: user.photoURL}} style={styles.pic} />
                      ) : (
                        <Image source={{uri: item.uri}} style={styles.pic} />
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
    fontSize: 20,
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
    elevation: 15,
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