import { useState, useEffect, useCallback, useRef} from 'react';
import { StyleSheet, Text, View, Button, FlatList, TouchableOpacity, ImageBackground, Modal,
  KeyboardAvoidingView, ScrollView, Alert, Image, TouchableWithoutFeedback, TextInput, Pressable, ToastAndroid,
  ActivityIndicator, Platform, RefreshControl} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import { notify } from '../shared/notify';
import { createNotificationsChannels, registerForPushNotificationsAsync } from '../services/notifications';
import { getUserProfile } from '../shared/userProfile';
import { joinConversation as joinConversationOnServer, joinErrorMessage } from '../services/conversations';
import QRCodeModal from '../shared/QRCodeModal';
import QRScannerModal from '../shared/QRScannerModal';
import useAsyncAction from '../shared/useAsyncAction';




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
  const [qrVisible, setQrVisible] = useState(false);
  const [scanVisible, setScanVisible] = useState(false);

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


  const deletePost = async (id) => {
    setDeleting(true);

    // the spinner modal blocks the screen, so it must always come down (it used to stay up forever if a
    // read or delete failed)
    try {
      const [allMessages, allPartis] = await Promise.all([
        getDocs(collection(db, 'Conversations', id, 'Comments')),
        getDocs(collection(db, 'Conversations', id, 'Participants'))
      ])

      await Promise.all([
        ...allMessages.docs.map(message => deleteDoc(message.ref)),
        ...allPartis.docs.map(person => deleteDoc(person.ref)),
        deleteDoc(doc(db, 'Users', user.uid, 'My Conversations', id))
      ])

      await deleteDoc(doc(db, 'Conversations', id))
    } catch(err) {
      console.log(err);
      notify('Could not delete the conversation');
    } finally {
      setDeleting(false);
    }
  }

  const showAlert = (id) => {
    confirm('Delete Conversation?', 'Are you sure you want to delete this conversation?', () => deletePost(id))
  }

  const leaveConversations = async (id) => {
    setDeleting(true);

    try {
      const checkExist = await getDoc(doc(db, 'Conversations', id, 'Participants', user.uid));

      if(!checkExist.exists() || checkExist.data().removed == true) {
        await deleteDoc(doc(db, 'Users', user.uid, 'My Conversations', id));
      }
      else {
        await Promise.all([
          updateDoc(doc(db, 'Conversations', id, 'Participants', user.uid), {
            removed: true,
          }),

          addDoc(collection(db, 'Conversations', id, 'Comments'), {
            comment: 'left',
            author: user.displayName,
            authorID: user.uid,
            timeStamp: serverTimestamp(),
            system: true,
          }),

          deleteDoc(doc(db, 'Users', user.uid, 'My Conversations', id)),
        ])
      }
    } catch(err) {
      console.log(err);
      notify('Could not leave the conversation');
    } finally {
      setDeleting(false);
    }
  }

  const showAlertLeave = (id) => {
    confirm('Leave Conversation?', 'Are you sure you want to leave this conversation?', () => leaveConversations(id))
  }

  const clickOut = () => {
    setModalVisible(false);
    setConvID('');
    setResponse(null);
    setShowPassword(false);
    setPassword('');
  }

  const [joinGuarded] = useAsyncAction((id) => joinConversation(id));

  const joinConversation = async (convID) => {
    setShowIndicator(true);
    setResponse(null);

    convID = convID.replace(/\s/g,'');

    if(convID == '') {
      setShowIndicator(false);
      setResponse('No conversations found!');
      return;
    }

    try {
      await joinConversationOnServer(convID, showPassword ? password : undefined);
      navigation.navigate('Details', { id: convID });
    } catch(err) {
      if(err.details && err.details.reason == 'password-required' && !showPassword) {
        setShowPassword(true);
        setShowIndicator(false);
        return;
      }

      console.log(err);
      setShowIndicator(false);
      setResponse(joinErrorMessage(err));
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

  // leading-edge debounce: a double tap on a card used to navigate twice
  const enter2 = useCallback(_.debounce((id) => {
    navigation.navigate('Details', { id, photoUrl });
  }, 1000, {'leading':true, 'trailing':false}), [photoUrl])

  return (
    <SafeAreaView style={{flex:1, backgroundColor:mainColor}}>
      <View style={{flex:1, backgroundColor:backgroundColor}}>
        
        <Modal visible={deleting} animationType='fade' transparent={true} onRequestClose={null}>
          <View style={styles.outerView}>
            <TouchableWithoutFeedback>
              <View style={styles.innerView2}>
                <ActivityIndicator size={80} color='#d4c86e' animating={true} style={{flex:1}}/>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </Modal>


        <QRCodeModal visible={qrVisible} onClose={() => setQrVisible(false)} title='My ID' caption={user.displayName}
          value={user.uid} onCopy={copyToClipboard} />

        <QRScannerModal visible={scanVisible} onClose={() => setScanVisible(false)}
          hint='Scan the conversation QR code' onScanned={(text) => setConvID(text)} />

        <Modal visible={modalVisible} animationType='fade' transparent={true}
          onRequestClose={clickOut}
        >
          <TouchableWithoutFeedback onPress={clickOut}>
            <View style={styles.outerView}>
              <TouchableWithoutFeedback>
              <View style={styles.innerView}>
                <TextInput placeholder='Conversation ID' value={convID} onChangeText={text => setConvID(text)} style={styles.inputP}/> 
                <Pressable
                  onPress={() => setScanVisible(true)}
                  style={({ pressed }) => [{opacity: pressed ? 0.5: 1}, styles.scanButton]}
                >
                  <MaterialIcons name='qr-code-scanner' size={20} color='#613a5f' />
                  <Text style={{color:'#613a5f', fontSize:15, marginLeft:6}}>Scan QR code</Text>
                </Pressable>
                {showPassword && 
                  <View>
                    <TextInput placeholder='Password' value={password} onChangeText={text => setPassword(text)} style={styles.inputP} secureTextEntry /> 
                  </View>
                }
                {response && <Text style={{color:'white', fontSize:17, marginHorizontal:15, alignSelf:'center'}}>{ response }</Text> }
                {showIndicator==false? (
                    <Pressable
                      onPress={() => joinGuarded(convID)}
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

        <View style={{backgroundColor:mainColor, borderBottomLeftRadius:26, borderBottomRightRadius:26, paddingBottom:10, overflow:'hidden'}}>
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
              onPress={() => setQrVisible(true)}
              style={({ pressed }) => [
                {opacity: pressed ? 0.5: 1}, styles.copyID, {backgroundColor:actionColor, marginRight:6}
              ]}
            >
              <View style={{flexDirection:'row', alignItems:'center',}}>
                <MaterialIcons name='qr-code' size={17} color={actionInsideColor} />
              </View>
            </Pressable>
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

        <View style={{flexDirection:'row', padding:10, paddingTop:14}}>
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
                <FlatList data={conversations} keyExtractor={(item) => item.id} contentContainerStyle={{paddingTop:6}} refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#613a5f']} />
                } renderItem={({ item }) => (
                  <TouchableOpacity onPress={() => enter2(item.id)} activeOpacity={0.8} style={styles.item}>
                    <View style={styles.cardInner}>
                      <View style={[styles.band, {backgroundColor:conAuthorBarColor}]}>
                        <Text style={[styles.titleText, {color:convAuthorTextColor}]} numberOfLines={1}>{ item.title }</Text>
                        {item.unread == 0 || item.unread == undefined? null : (
                          <View style={styles.badge}>
                            <Text style={{color:'white', fontSize:13, fontWeight:'700'}}>{item.unread}</Text>
                          </View>
                        )}
                        <Menu>
                          <MenuTrigger>
                            <MaterialIcons name='more-horiz' size={24} color={convAuthorTextColor} style={{padding:3}}/>
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

                      <Text style={[styles.body, {color:homeConvBodyColor}]} numberOfLines={3}>{ item.body }</Text>

                      <View style={styles.footer}>
                        <Image source={{uri: item.authorID == user.uid ? photoUrl : item.uri}} style={styles.pic} />
                        <Text style={styles.createdAuthor} numberOfLines={1}>
                          { item.authorID == user.uid ? user.displayName : item.author }
                        </Text>
                      </View>
                    </View>
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
    alignItems: 'stretch',
    margin: 20,
    paddingTop: 20,
  },
  content:{
    marginHorizontal: 12,
    marginTop: 12,
  },
  createdView: {
    flexDirection: 'row',
    flex: 1,
    marginTop:'auto',
    paddingVertical: 8,
    alignItems: 'center',
  },
  titleBar: {
    flex: 1,
    marginRight: 8,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 18,
  },
  joinConv: {
    marginRight:10,
    marginLeft:'auto',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#f2f2f2',
    paddingVertical: 9,
    paddingHorizontal: 18,
    borderRadius: 25,
    flexDirection: 'row',
  },
  newConv: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#f2f2f2',
    paddingVertical: 9,
    paddingHorizontal: 18,
    borderRadius: 25,
    flexDirection: 'row',
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
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  createdAuthor: {
    fontSize: 12,
    fontWeight: '500',
    color: '#7d7287',
    marginLeft: 8,
    flex: 1,
  },
  createdTime: {
    fontSize: 15,
    marginLeft: 'auto'
  },
  body: {
    marginTop: 8,
    marginHorizontal: 14,
    fontSize: 14,
    lineHeight: 19,
    opacity: 0.8,
  },
  header: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems:'center'
  },
  item: {
    marginHorizontal: 12,
    marginBottom: 12,
    backgroundColor:'white',
    elevation: 5,
    shadowOffset: {width:0, height:3},
    shadowOpacity: 0.2,
    shadowRadius: 6,
    borderRadius: 18,
  },
  band: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingLeft: 14,
    paddingRight: 8,
  },
  badge: {
    backgroundColor:'#e655aa', alignItems:'center', justifyContent:'center',
    borderRadius:12, minWidth:24, height:24, paddingHorizontal:7, marginRight:6,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginHorizontal: 14,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e3dce8',
  },
  cardInner: {
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: 'white',
    paddingBottom: 8,
  },
  pic: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderColor: '#613a5f',
    borderWidth: 1.5,
    backgroundColor: '#d9cfe0',
  },
  createdViewContainer: {
    flexDirection:'row', 
    alignItems:'center', 
    marginTop: 12,
    marginHorizontal: 9,
  },
  outerView: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent:'center'
  },
  innerView: {
    backgroundColor: '#806b96',
    borderRadius: 24,
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
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    backgroundColor: '#d4c86e',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginTop: -8,
  },
});