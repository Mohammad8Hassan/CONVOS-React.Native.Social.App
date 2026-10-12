import { useState, useEffect, useCallback, useRef} from 'react';
import { StyleSheet, Text, View, Button, FlatList, TouchableOpacity, ImageBackground, Modal,
  KeyboardAvoidingView, ScrollView, Alert, Image, TouchableWithoutFeedback, TextInput, Pressable, ToastAndroid,
  ActivityIndicator, Platform, RefreshControl} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Card from '../shared/Card';
import { MaterialIcons } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import { Entypo } from '@expo/vector-icons';
import { getFirestore, addDoc, collection, serverTimestamp, onSnapshot, query, orderBy,
   doc, deleteDoc, setDoc, Timestamp, updateDoc, getDoc, getDocs, initializeFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth';
import { Menu, MenuOptions, MenuOption, MenuTrigger, } from 'react-native-popup-menu';
// import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import _ from 'lodash';
import { useDispatch, useSelector } from 'react-redux';
import { setNewKey } from '../features/themeSlice';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { getApp } from 'firebase/app';
import { loadImage } from '../shared/imageCache';
import { confirm } from '../shared/confirm';
import { createNotificationsChannels, registerForPushNotificationsAsync } from '../services/notifications';
import { getUserProfile } from '../shared/userProfile';



// REFACTOR NOTE: createNotificationsChannels and registerForPushNotificationsAsync used to be defined here;
// they now live in ../services/notifications.


// component
export default function Home({ route, navigation }) {

  Notifications.setNotificationHandler({
    handleNotification: async (notification) => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });

  const AdID = (!Device.isDevice || __DEV__)? TestIds.BANNER : "ca-app-pub-4623463929646643/1541905082";
  
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
  const [expoPushToken, setExpoPushToken] = useState('');
  const [deleting, setDeleting] = useState(false);

  const db = getFirestore();

  // const db = initializeFirestore(getApp(), {experimentalForceLongPolling: true, useFetchStreams:false});
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
  const myData = useRef({});
  const unsubscribeUser = useRef();
  const mounted = useRef(false);

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
    mounted.current = true;

    const colRef = collection(db, 'Users', user.uid, 'My Conversations');
    const q = query(colRef, orderBy('lastAccessed'));
    let result = [];
    // let authors = {};

    createNotificationsChannels();
    
    registerForPushNotificationsAsync()
      .then(async token => {
        if(token == 'noDevice') {
          await updateDoc(doc(db, 'Users', user.uid), {
            ExpoPushToken: null
          })
        }
        else {
          await updateDoc(doc(db, 'Users', user.uid), {
            ExpoPushToken: token
          })
        }
   
        // user data listener
        unsubscribeUser.current = onSnapshot(doc(db, 'Users', user.uid), async snapShot => {
          if(!snapShot.exists()) {
            console.log("Users doc missing for current user:", user.uid);
            return;
          }
          const photo = await loadImage(snapShot.data().Photo, snapShot.data().photoExtension);
          
          if(mounted) setPhotoUrl(photo);

          myData.current = snapShot.data();
        }, error => {console.log(error)})
      });

    // my conversations listener
    const unsubscribe1 = onSnapshot(q, async snapShot => {
      for(let change of snapShot.docChanges()) {
        if(change.type === 'added') {
          // console.log("triggered added: ", change.doc.data());
          if(authors.current[change.doc.data().authorID+'ID'] == undefined) {
            // REFACTOR NOTE: used to be getDoc + `if(!info.exists()) continue;`. getDoc itself can throw
            // ("client is offline" on a cold start), which rejected the whole listener callback and
            // dropped every conversation after it. getUserProfile returns null for both cases; the
            // conversation is now still listed (author blank, not cached so it is retried later).
            const authorID = change.doc.data().authorID;
            const profile = await getUserProfile(db, authorID);

            if(profile) {
              authors.current[authorID + 'Name'] = profile.Name;
              authors.current[authorID + 'Photo'] = profile.photo;
              authors.current[authorID + 'ID'] = authorID;
            }
            else {
              console.log("Users doc missing/unreadable for conversation author:", authorID);
            }
          }

          const empty = change.doc.data().dateCreated === null ? Timestamp.now() : change.doc.data().dateCreated;
          
          result.unshift({id: change.doc.id, ...change.doc.data(), dateCreated: empty.toDate(), 
            uri: authors.current[change.doc.data().authorID+'Photo'], 
            author: authors.current[change.doc.data().authorID+'Name']});
        }
  
        //if deleted:
        else if(change.type === 'removed') {
          // console.log("triggered removed: ", change.doc.id);
          const index = result.map(e => e.id).indexOf(change.doc.id);
          result.splice(index,1);
        }
  
        //if modified:
        else if(change.type === 'modified') {
          // console.log("triggered modified: ", change.doc.data());
          const index = result.map(e => e.id).indexOf(change.doc.id);
          if(index == -1) return;
          result.splice(index,1);

          if(authors.current[change.doc.data().authorID+'ID'] == undefined) {
            // REFACTOR NOTE: this used to call `prepareImg`, which was never defined (ReferenceError when an
            // uncached author appeared), and then read info.data() unguarded. Now getUserProfile (-> loadImage).
            const authorID = change.doc.data().authorID;
            const profile = await getUserProfile(db, authorID);

            if(profile) {
              authors.current[authorID + 'Name'] = profile.Name;
              authors.current[authorID + 'Photo'] = profile.photo;
              authors.current[authorID + 'ID'] = authorID;
            }
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
      unsubscribeUser.current();
    }
  }, [])

  useEffect(() => {
    let count = 0;

    for(let x of conversations) {
      if(x.unread !== undefined) count += x.unread;
    }

    navigation.getParent().setOptions({
      tabBarBadge: count == 0? null : count
    })
  }, [conversations])


  // REFACTOR NOTE: checkCache / cacheImage / loadImage used to be defined right here (~54 lines,
  // identical copy in 7 screens). They are now imported from ../shared/imageCache.

  const deletePost = async (id) => {
    setDeleting(true);

    const [allMessages, allPartis] = await Promise.all([
      getDocs(collection(db, 'Conversations', id, 'Comments')),
      getDocs(collection(db, 'Conversations', id, 'Participants'))
    ])
    

    await Promise.all([
      allMessages.docs.map(async message => {
        deleteDoc(message.ref);
      }),

      allPartis.docs.map(async person => {
        deleteDoc(person.ref);
      }),

      deleteDoc(doc(db, 'Users', user.uid, 'My Conversations', id))
    ])

    deleteDoc(doc(db, 'Conversations', id))

    setDeleting(false);
  }

  const showAlert = (id) => {
    // REFACTOR NOTE: this used to be an inline Alert.alert(...) with Cancel + "confirm" buttons (~16 lines); now uses confirm().
    confirm('Delete Conversation?', 'Are you sure you want to delete this conversation?', () => deletePost(id))
  }

  const leaveConversations = async (id) => {
    const checkExist = await getDoc(doc(db, 'Conversations', id, 'Participants', user.uid));

    if(!checkExist.exists() || checkExist.data().removed == true) {
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
    // REFACTOR NOTE: this used to be an inline Alert.alert(...) with Cancel + "confirm" buttons (~16 lines); now uses confirm().
    confirm('Leave Conversation?', 'Are you sure you want to leave this conversation?', () => leaveConversations(id))
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
        
        if(convRef.data().hasPassword) {
          console.log('enter password');
          setShowPassword(true);
          setShowIndicator(false);
          return;
        }

        const [friendInvited, otherInvited] = await Promise.all([
          getDoc(doc(db, 'Users', user.uid, 'Friends Invites', convID)),
          getDoc(doc(db, 'Users', user.uid, 'Other Invites', convID))
        ])
        
        if(friendInvited.exists()){
          deleteDoc(doc(db, 'Users', user.uid, 'Friends Invites', convID));
        }
        if(otherInvited.exists()){
          deleteDoc(doc(db, 'Users', user.uid, 'Other Invites', convID));
        }
  
        await setDoc(doc(db, 'Conversations', convID, 'Participants', user.uid), {
          ID: user.uid,
          Name: user.displayName,
          Admin: false,
          removed: false,
          lastEnter: Timestamp.now(),
          lastExit: Timestamp.now(),
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
            unread: 0
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
          lastEnter: Timestamp.now(),
          lastExit: Timestamp.now(),
        })

        await setDoc(doc(db, 'Users', user.uid, 'My Conversations', convID), {
          authorID: convRef.data().authorID,
          title: convRef.data().title,
          body: convRef.data().body,
          dateCreated: Timestamp.now(),
          lastAccessed: Timestamp.now(),
          unread: 0
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
    navigation.navigate('Details', { id, photoUrl });
  }

  return (
    <SafeAreaView style={{flex:1, backgroundColor:mainColor}}>
      <View style={{flex:1, backgroundColor:backgroundColor,}}>
        
        <Modal visible={deleting} animationType='fade' transparent={true} onRequestClose={null}>
          <View style={styles.outerView}>
            <TouchableWithoutFeedback>
              <View style={styles.innerView2}>
                <ActivityIndicator size={80} color='#d4c86e' animating={true} style={{flex:1}}/>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </Modal>


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
          <View style={[styles.newMid, {borderColor:topButtonsColors}]}>
            <Text style={{color:topButtonsColors, fontSize:18, fontFamily:'Solway-Regular', opacity:0.5}}>
              {/* Welcome, {user.displayName} 😃{'\n'}{'\n'} */}

              You can join, or create a new conversation.{'\n'}{'\n'}
              Or go to 'Friends' tab below to add your friends
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('New Conversation')} style={{alignItems:'center', marginTop:10}}>
           <Entypo name='new-message' size={80} color={topButtonsColors} style={{opacity:0.5, marginBottom:10}}/>
           <Text style={{color:topButtonsColors, fontSize:18, fontFamily:'Solway-Regular', opacity:0.5}}>
              Click to create a new conversation
            </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{flex: 1}}>
            {conversationsIndicator? (
              <ActivityIndicator size={80} color={mainColor} animating={conversationsIndicator} style={{flex:1}} />
            ) : (
              <>
                <FlatList data={conversations} refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#613a5f']} />
                } renderItem={({ item }) => (
                  <TouchableOpacity onPress={() => enter2(item.id)} style={styles.item}>
                    <Card>
                      <View style={styles.content}>
                        <View style={styles.header}>
                            <Text style={[styles.titleText, {color:homeConvTitleColor}]} numberOfLines={1}>{ item.title }</Text>
                            {item.unread == 0 || item.unread == undefined? null : (
                              <View style={{elevation:8, backgroundColor:'#e655aa', alignItems:'center', justifyContent:'center', borderRadius:50, padding:5, marginRight:5}}>
                                <Text style={{color:'white', fontSize:17}}> {item.unread} </Text>
                              </View>
                            )}
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
                          {item.authorID == user.uid? (
                              <Text style={[styles.createdAuthor, {color:convAuthorTextColor}]} numberOfLines={1}>{ user.displayName }</Text>
                            ) : (
                              <Text style={[styles.createdAuthor, {color:convAuthorTextColor}]} numberOfLines={1}>{ item.author }</Text>
                            )
                          }
                          {/* <Text style={styles.createdTime}>{ item.dateCreated.toDateString()}</Text> */}
                        </View>
                        {item.authorID == user.uid? (
                            <Image source={{uri: photoUrl}} style={[styles.pic, {borderColor:null}]} />
                          ) : (
                            <Image source={{uri: item.uri}} style={[styles.pic, {borderColor:null}]} />
                          )
                        }
                      </View>
      
                    </Card>
                  </TouchableOpacity>
                )}/>

                <BannerAd unitId={AdID} size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
                  requestOptions={{requestNonPersonalizedAdsOnly:true}} 
                />
              </>
            )} 
          </View>
        )}

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
    padding: 15,
    paddingVertical:30,
    borderRadius: 10,
    borderStyle: 'dashed',
    alignSelf:'center',
    opacity:0.8,
    marginHorizontal:15,
    marginVertical:50,
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
    justifyContent: 'space-between',
    alignItems:'center'
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
  innerView2: {
    alignItems:'center',
    justifyContent:'center',
    padding: 10,
    elevation: 15,
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