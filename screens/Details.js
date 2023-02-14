import { useEffect, useState, useRef, useCallback } from 'react';
import { StyleSheet, Text, View, Button, ImageBackground, Image, KeyboardAvoidingView,
  TextInput, ScrollView, FlatList, Modal, Alert, Pressable, Keyboard, ToastAndroid, ActivityIndicator,
  SafeAreaView, Platform
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import { Foundation } from '@expo/vector-icons';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { getFirestore, addDoc, collection, serverTimestamp, onSnapshot, query, orderBy, doc, 
  deleteDoc, Timestamp, setDoc, getDoc, getDocs, updateDoc } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { Entypo } from '@expo/vector-icons'
// import { SafeAreaView } from 'react-native-safe-area-context';
import avatar from '../assets/Imgs/avatar.png';
import RenderComment from '../shared/RenderComment';
import RenderOthersComment from '../shared/RenderOthersComment';
import * as FileSystem from "expo-file-system";
import * as Clipboard from 'expo-clipboard';
import { Menu, MenuOptions, MenuOption, MenuTrigger, MenuProvider, } from 'react-native-popup-menu';
import SystemMessage from '../shared/SystemMessage';
import ErrorScreen from './ErrorScreen';


export default function Details({ route, navigation }) {

  const { id, photoUrl } = route.params;
  const scrollView = useRef(null);
  const [comment, setComment] = useState('');
  const [allComments, setAllComments] = useState([]);
  const [post, setPost] = useState(null);
  const [isAvailable, setIsAvailable] = useState(true);
  const [allParticipants, setAllParticipants] = useState(null);
  const [expanded, setExpanded] = useState(true);
  const [caretName, setCaretName] = useState('caret-up');
  const [uri, setUri] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [friends, setFriends] = useState([]);
  const [participantsIDs, setParticipantsIDs] = useState(null);
  const [data, setData] = useState(null);
  const [selector, setSelector] = useState('all');
  const [num, setNum] = useState(0);
  const [areFriends, setAreFriends] = useState([]);
  const [notFriends, setNotFriends] = useState([]);
  // const [commentsFlag, setCommentsFlag] = useState('first render');
  // const [friendsFlag, setFriendsFlag] = useState('first render');
  const [commentsIndicator, setCommentsIndicator] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // const refreshComments = useRef(false);

  const db = getFirestore();
  const storage = getStorage();
  const defaultImg = Image.resolveAssetSource(avatar).uri;
  const user = getAuth().currentUser;
  const mount = useRef(false);
  const friendsFlag = useRef('first render');
  const commentsFlag = useRef('first render');
  const unsubscribe2 = useRef();
  const yPosition = useRef(null);

  const convAuthorID = useRef('');
  const convAuthorUri = useRef(null);
  const convAuthorName = useRef('');


  useEffect(() => {
    mount.current = true;
    
    updateDoc(doc(db, 'Users', user.uid, 'My Conversations', id), {
      lastAccessed: Timestamp.now(),
    });

    const unsubscribe = onSnapshot(doc(db, 'Conversations', id), async snapShot => {
      if(snapShot.data()) {
        const checkExist = await getDoc(doc(db, 'Conversations', id, 'Participants', user.uid))
        if(checkExist.exists() && checkExist.data().removed == false) {
          if(mount.current) {
            setPost(snapShot.data());
        
            setIsAvailable(true);
          }
        }
        else {
          // deleteDoc(doc(db, 'Users', user.uid, 'My Conversations', id))
          //   .then(res => console.log('removed')).catch(err => console.log(err))
          navigation.replace('Error');
        }
        
        
        // getDoc(doc(db, 'Users', snapShot.data().authorID))
        //   .then(author => {
        //     setUri(author.data().Photo);
        //   })
      }
      else {
        // setIsAvailable(false);
        // deleteDoc(doc(db, 'Users', user.uid, 'My Conversations', id))
        //   .then(res => console.log('removed')).catch(err => console.log(err))
        navigation.replace('Error');
      }
    }, error => {console.log(error)})
    

    let participants = {};
    let participantsID = [];

    const participantsRef = collection(db, 'Conversations', id, 'Participants');
    
    const unsubscribe3 =  onSnapshot(participantsRef, async snapShot => {
      
      await Promise.all(snapShot.docChanges().map(async change => {

        if(change.type === 'added') {
          console.log('participant added: ', change.doc.data());
          const info = await getDoc(doc(db, 'Users', change.doc.id));

          const photo = await loadImage(info.data().Photo, info.data().photoExtension);

          if(change.doc.data().Admin) {
            convAuthorID.current = change.doc.id;
            convAuthorUri.current = photo;
            convAuthorName.current = info.data().Name;
          }

          if (change.doc.id != user.uid && !change.doc.data().removed)
          participantsID.push({id: change.doc.id, photo: photo, name: info.data().Name, removed: change.doc.data().removed});

          participants[change.doc.id + 'Name'] = info.data().Name;
          participants[change.doc.id + 'Photo'] = photo;
          participants[change.doc.id + 'ID'] = change.doc.id;
          participants[change.doc.id + 'REM'] = change.doc.data().removed;

          // console.log('1participants: ', participants);
          // console.log('1participantsID: ', participantsID);
        }
        else if(change.type === 'modified') {
          if(change.doc.data().removed == true) {
            if(change.doc.id == user.uid) {
              navigation.replace('Error');
            }
            else {
              // console.log('participantsID: ', participantsID);
              const index = participantsID.map(e => e.id).indexOf(change.doc.id);
              // console.log('index: ', index);
              // participantsID[index].removed = true;
              // console.log('participantsID[index]: ', participantsID[index])
              participantsID.splice(index, 1);
    
              participants[change.doc.id + 'REM'] = true;
  
              if(mount.current) {
                setAllComments(prev => {
                  prev.forEach(comment => {
                    if(comment['authorID'] == change.doc.id) {
                      comment['removed'] = true;
                    }
                  })
                  
                  return [...prev];
                })
              }
            }

          }
          else if(change.doc.data().removed == false) {
            // const index = participantsID.map(e => e.id).indexOf(change.doc.id);
            // participantsID[index].removed = false;
            if (change.doc.id != user.uid && !change.doc.data().removed)
            participantsID.push({id: change.doc.id, 
              photo: participants[change.doc.id + 'Photo'], name: participants[change.doc.id + 'Name'], 
              removed: change.doc.data().removed});

            participants[change.doc.id + 'REM'] = false;

            if(mount.current) {
              setAllComments(prev => {
                prev.forEach(comment => {
                  if(comment['authorID'] == change.doc.id) {
                    comment['removed'] = false;
                  }
                })
                
                return [...prev];
              })
            }
            
          }
          
        }

        
      }))
      
      if(mount.current) {
        setAllParticipants(participants);
        setParticipantsIDs(participantsID);
        setData(prev => {prev = participantsID; return [...prev]});
        setSelector('all');
        setNum(participantsID.length + 1);
      }
      
    }, error => {console.log(error)});

    

    return () => {
      mount.current = false;
      unsubscribe();
      unsubscribe3();
      unsubscribe2.current != undefined? unsubscribe2.current() : null;
    }

  }, [])

  useEffect(() => {
    if((allParticipants != null && commentsFlag.current == 'first render')) {
      console.log('ConvAuthorID: ', convAuthorID.current);
      loadComments();
    }
  }, [allParticipants])

  useEffect(() => {
    if(expanded){
      setCaretName('caret-up');
    }
    else {
      setCaretName('caret-down');
    }
  }, [expanded])

  const loadComments = useCallback(() => {
    console.log('called - ', mount.current);
    const colRef = collection(db, 'Conversations', id, 'Comments');
    const q = query(colRef, orderBy('timeStamp'));
    
    unsubscribe2.current = onSnapshot(q, async snapShot => {
      
      let comments = allComments;
      console.log(user.displayName)

      for (const change of snapShot.docChanges()) {
        if(change.type === 'added') {
          // console.log('comment added: ', change.doc.data().comment);
          // console.log('comment object: ', change.doc.data());
          const empty = change.doc.data().timeStamp === null ? Timestamp.now() : change.doc.data().timeStamp;

          comments.push({id: change.doc.id, ...change.doc.data(), timeStamp: empty, 
            uri: allParticipants[change.doc.data().authorID+'Photo']==undefined?change.doc.data().uri2:allParticipants[change.doc.data().authorID+'Photo'], 
            Name: allParticipants[change.doc.data().authorID+'Name']==undefined?change.doc.data().Name2:allParticipants[change.doc.data().authorID+'Name'],
            removed: allParticipants[change.doc.data().authorID+'REM']==undefined?change.doc.data().removed2:allParticipants[change.doc.data().authorID+'REM'],
            system: change.doc.data().system == undefined? false : change.doc.data().system,
          });
        }
        else if(change.type === 'removed') {
          const index = comments.map(e => e.id).indexOf(change.doc.id);
          comments.splice(index,1);
        }
      }

      if(mount.current) {
        setAllComments(prev => {
          prev = comments;
          return [...prev];
        });
        setCommentsIndicator(false);
      }
      else {
        unsubscribe2.current();
        console.log('else unsub...');
      }
    }, error => {console.log(error)})
    
  }, [allParticipants])


  const initialScroll = () => {
    if(commentsFlag.current == 'first render') {
      scrollView.current.scrollToEnd({animated:false});
      commentsFlag.current = 'rendered';
    }
  }

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

  const showAlert = (id) => {
    Alert.alert(
      'Delete Message?',
      'Are you sure you want to delete this Message?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: "confirm",
          onPress: () => deleteComment(id)
        }
      ],
      {
        cancelable: true
      }
    )
  }

  const showAlertConversation = () => {
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
          onPress: () => deleteConversation()
        }
      ],
      {
        cancelable: true
      }
    )
  }

  const deleteConversation = () => {
    deleteDoc(doc(db, 'Users', user.uid, 'My Conversations', id));
    deleteDoc(doc(db, 'Conversations', id));
  }

  const showAlertUser = (id, name) => {
    Alert.alert(
      'Remove User?',
      'Are you sure you want to remove ' + name + ' from this conversation?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: "confirm",
          onPress: () => removeUser(id, name)
        }
      ],
      {
        cancelable: true
      }
    )
  }

  const removeUser = async (userID, name) => {
    console.log('participantsIDs: ', participantsIDs);
    console.log('allParticipants: ', allParticipants);

    addDoc(collection(db, 'Conversations', id, 'Comments'), {
      comment: 'removed',
      author: name,
      authorID: userID,
      timeStamp: serverTimestamp(),
      system: true,
    })
    
    updateDoc(doc(db, 'Conversations', id, 'Participants', userID), {
      removed: true,
    });

    // deleteDoc(doc(db, 'Users', userID, 'My Conversations', id));
  }

  const postComment = async () => {
    let theComment = comment;
    if(theComment.trim().length === 0) return;

    console.log('b4 trim: ', theComment);
    theComment = theComment.trimEnd().trimStart();
    console.log('after trim: ', theComment);

    scrollView.current.scrollToEnd();
    setComment('');
    
    await addDoc(collection(db, 'Conversations', id, 'Comments'), {
      comment: theComment,
      author: user.displayName,
      authorID: user.uid,
      timeStamp: Timestamp.now(),
      system: false
    })
  }

  const deleteComment = (commentId) => {
    deleteDoc(doc(db, "Conversations", id, "Comments", commentId));
  }

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(id);

    if(Platform.OS === 'android')
      ToastAndroid.show('conversation ID copied', ToastAndroid.SHORT);
    else {
      Alert.alert(
        'conversation ID copied',
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

  const copyUserToClipboard = async (id) => {
    await Clipboard.setStringAsync(id);

    if(Platform.OS === 'android')
      ToastAndroid.show('user ID copied', ToastAndroid.SHORT);
    else {
      Alert.alert(
        'user ID copied',
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

  const copyMineClipboard = async () => {
    await Clipboard.setStringAsync(user.uid);

    if(Platform.OS === 'android')
      ToastAndroid.show('ID copied', ToastAndroid.SHORT);
    else {
      Alert.alert(
        'ID copied',
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


  return (
    <SafeAreaView style={{flex:1, backgroundColor:'#613a5f'}}>
      { isAvailable == true ? (
        <>
          { post &&
            <>
              {/* modal */}
              <Modal visible={modalOpen} animationType='slide' onRequestClose={() => setModalOpen(false)}>
                <MenuProvider skipInstanceCheck style={{flex:1}}>
                  <SafeAreaView style={{flex:1, backgroundColor:'#613a5f'}}>
                    <View style={{flex:1, backgroundColor:'#806b96'}} >
                    <View style={styles.homeHeader}>
                      <Pressable 
                        onPress={() => setModalOpen(false)}
                        style={({ pressed }) => [
                          {opacity: pressed ? 0.5: 1},
                        ]}
                        >
                        <Ionicons name='chevron-back-circle' size={27} color="white" />
                      </Pressable>
                      <Text style={{flex:1, fontSize:19, color:'white', fontFamily:'Solway-Regular', marginLeft:10}}>Participants  { num }</Text>
                    </View>
   
                    {/* <Text style={{marginVertical:4, marginLeft:8, fontSize:18, color:'white', backgroundColor:'#8d8299', alignSelf:'flex-start', paddingHorizontal:3, fontWeight:'bold'}}>Participants  { num }</Text> */}

                    <View style={styles.itemUser}>
                      <View style={{flexDirection:'row', alignItems:'center', backgroundColor:'#8d8299', padding:4, borderRadius:20,}}>
                        <Image source={{uri: photoUrl}} style={{height:40, width:40, borderRadius:50, borderColor:'#4ebbed'}} />
                        
                        <View style={{marginLeft:10, flex:1,}}>
                          <Text style={{ fontSize:18,  color:'white'}}>{ user.displayName } 
                            <Text style={{fontSize:15, color:'white', fontStyle:'italic',}}>  (you)</Text>
                          </Text>

                          <Text style={{fontSize:13, color:'white', opacity:0.6, fontStyle:'italic'}}>{ user.uid }</Text>
                        </View>
                        
                        <Menu style={styles.menu}>
                          <MenuTrigger>
                            <MaterialIcons name='more-horiz' size={20} color='white' style={{padding:8}} />
                          </MenuTrigger>
                          <MenuOptions>
                            <MenuOption onSelect={() => copyMineClipboard()}>
                              <Text style={{fontSize: 18, margin: 5}}>copy ID</Text>
                            </MenuOption>
                          </MenuOptions>
                        </Menu>
                      </View>
                    </View>

                    <View style={{flex:1, marginTop:5, padding:4}}>
                      <FlatList data={data} extraData={participantsIDs} renderItem={({ item }) => (
                        <View style={styles.item}>

                          <View style={{flexDirection:'row', alignItems:'center', backgroundColor:'#8d8299', padding:4, borderRadius:20, opacity: (item.removed == true)? 0.5 : 1}}>
                            <Image source={{uri: item.photo}} style={{height:40, width:40, borderRadius:50, borderColor:'#4ebbed'}} />
                            
                            <View style={{alignItems:'center', flex:1, marginHorizontal:8}}>
                              {item.id == convAuthorID.current? (
                                <Text style={{fontSize:18, color:'white'}}>{ item.name }
                                  <Text style={{fontSize:16, color:'#613a5f', fontStyle:'italic'}}>  (Author)</Text> 
                                </Text>
                                
                              ) : (
                                <Text style={{fontSize:18, color:'white'}}>{ item.name }</Text>
                              )}
                              

                              <Text style={{fontSize:13, color:'white', opacity:0.6, fontStyle:'italic'}}>{ item.id }</Text>
                            </View>

                            {(item.removed == false) && 
                              <Menu style={styles.menu}>
                              <MenuTrigger>
                                <MaterialIcons name='more-horiz' size={20} color='white' style={{padding:8}}  />
                              </MenuTrigger>
                              <MenuOptions>
                                {user.uid == convAuthorID.current ? (
                                  <MenuOption onSelect={() => showAlertUser(item.id, item.name)}>
                                    <Text style={{color: "#b00535", fontSize: 18, margin: 5}}>remove</Text>
                                  </MenuOption>
                                ) : null}
                                
                                <MenuOption onSelect={() => copyUserToClipboard(item.id)}>
                                  <Text style={{fontSize: 18, margin: 5}}>copy ID</Text>
                                </MenuOption>
                              </MenuOptions>
                            </Menu>
                            }
                            
                          </View>

                        </View>
                      )} />
                    </View>

                    {post.hasPassword? (
                        <View style={{backgroundColor:'#8c7699', elevation:15, marginBottom:20, paddingVertical:8, marginTop:15, shadowOffset: {width:0, height:5}, shadowOpacity: 0.3, shadowRadius: 3,}}>
                        <View>
                          <Text style={{fontFamily:'Solway-Regular', color:"white", fontSize: 20, marginLeft: 10, marginBottom:10}}>Password</Text>
                        </View>

                        {showPassword? (
                          <View style={styles.header}>
                            <Text style={{fontFamily:'Solway-Regular', color:"white", fontSize: 20, marginLeft: 10, marginRight:20}}>{ post.password }</Text>
                            <Pressable  
                              onPress={() => setShowPassword(false)}
                              style={({ pressed }) => [
                                {opacity: pressed ? 0.5: 1}
                              ]}
                            >
                              <Entypo name='eye-with-line' size={30} color={'#613a5f'} />
                            </Pressable>
                          </View>
                        ) : (
                          <View style={styles.header}>
                            <Text style={{fontFamily:'Solway-Regular', color:"white", fontSize: 20, marginLeft: 10, marginRight:20}}>{'\u2022'.repeat(post.password.length)}</Text>
                            <Pressable  
                              onPress={() => setShowPassword(true)}
                              style={({ pressed }) => [
                                {opacity: pressed ? 0.5: 1}
                              ]}
                            >
                              <Entypo name='eye' size={30} color={'#613a5f'} />
                            </Pressable>
                            
                          </View>
                        )}
                        
                      </View>
                    ) : null}
                    
                    </View>
                  </SafeAreaView>
                </MenuProvider>
              </Modal>

              {/* topic card */}
              <View style={{zIndex:999}}>
                {expanded ? (
                  <View style={styles.card}>
                    <View style={styles.cardContent}>
                      <View style={{flexDirection:'row'}}>
                        <Pressable 
                          onPress={() => navigation.goBack()}
                          style={({ pressed }) => [
                            {opacity: pressed ? 0.5: 1}, {alignSelf:'flex-end'}
                          ]}
                          >
                          <Ionicons name='chevron-back-circle' size={29} color="#d4c86e" />
                        </Pressable>
                        <Text style={{alignSelf:'center', flex:1, borderBottomColor:'#e6e6e6', borderBottomWidth:1, fontSize:Platform.OS==='android'?15:13, marginHorizontal:8, color:'grey', paddingBottom:3, marginLeft:3, marginRight:20}} selectable>{ post.title }</Text>
                      </View>

                      <ScrollView style={{maxHeight:200}}>
                        <Text style={{fontFamily: 'Poppins-Light', marginTop:5, fontSize:Platform.OS==='android'?18:16, marginHorizontal:8}} selectable>{ post.body }</Text>
                      </ScrollView>

                      <View style={styles.createdView}>
                        <Image source={{uri: convAuthorUri.current}} style={{width:25, height:25, borderRadius:60, borderColor:'#613a5f', borderWidth:1, marginRight:5}} />
                        <Text style={styles.createdAuthor} selectable>{ convAuthorName.current }</Text>
                        <View style={styles.createdTime}>
                          <Text style={styles.createdTimeText} selectable>{post.dateCreated.toDate().toDateString()}</Text>
                        </View>
                      </View>
                    </View>
                    <View style={{flexDirection:'row', justifyContent:'flex-end', alignItems:'center', marginHorizontal:3,}}>
                      <View style={{alignItems:'flex-end', flex:5, marginRight:6}}>
                        <Text style={{color: 'grey', fontSize:11}} >{ id }</Text>
                      </View>
                      <Pressable
                        onPress={copyToClipboard}
                        style={({ pressed }) => [
                          {opacity: pressed ? 0.5: 1}, styles.copyID
                        ]}
                      >
                        <View style={{flexDirection:'row', alignItems:'center',}}>
                          <MaterialIcons name='file-copy' size={16} color='#806b96' />
                        </View>
                      </Pressable>

                      <Menu style={styles.more}>
                        <MenuTrigger>
                          <View style={{backgroundColor: '#d4c86e', alignItems:'center', borderRadius:20}}>
                            <MaterialIcons name='more-horiz' size={22} color='#806b96' />
                          </View>
                        </MenuTrigger>
                        <MenuOptions>
                          <MenuOption onSelect={() => setModalOpen(true)}>
                            <Text style={{color: "#613a5f", fontSize: 18, margin: 5}}>View Info</Text>
                          </MenuOption>
                          {/* <MenuOption onSelect={() => showAlert(item.id)}>
                            <Text style={{color: "#613a5f", fontSize: 18, margin: 5}}>Invite Participant</Text>
                          </MenuOption> */}
                          { (post.authorID == user.uid) &&
                            <MenuOption onSelect={() => showAlertConversation()}>
                            <Text style={{color: "red", fontSize: 18, margin: 5}}>Delete Conversation</Text>
                            </MenuOption>
                          }
                          
                        </MenuOptions>
                      </Menu>
                    </View>
                </View>
                ) : (
                  <>
                  <View style={styles.card}>
                    <View style={{flexDirection:'row', alignItems:'center', marginBottom:10}}>
                      <Pressable 
                        onPress={() => navigation.goBack()}
                        style={({ pressed }) => [
                          {opacity: pressed ? 0.5: 1}, 
                        ]}
                        >
                        <Ionicons name='chevron-back-circle' size={29} color="#d4c86e" />
                      </Pressable>
                      <Text style={{flex:1, fontSize:18, marginLeft:5, }} numberOfLines={1}>{ post.body }</Text>
                    </View>
                    <View style={{flexDirection:'row', justifyContent:'flex-end', alignItems:'center', marginHorizontal:3}}>
                      <View style={{alignItems:'flex-end', flex:5, marginRight:4}}>
                        <Text style={{color: 'grey'}} >{ id }</Text>
                      </View>
                      <Pressable
                        onPress={copyToClipboard}
                        style={({ pressed }) => [
                          {opacity: pressed ? 0.5: 1}, styles.copyID
                        ]}
                      >
                        <View style={{flexDirection:'row', alignItems:'center',}}>
                          <MaterialIcons name='file-copy' size={16} color='#806b96' />
                        </View>
                      </Pressable>

                      <Menu style={styles.more}>
                        <MenuTrigger style={{backgroundColor: '#d4c86e', alignItems:'center', borderRadius:20}}>
                          <MaterialIcons name='more-horiz' size={22} color='#806b96' />
                        </MenuTrigger>
                        <MenuOptions>
                          <MenuOption onSelect={() => showAlert(item.id)}>
                            <Text style={{color: "#613a5f", fontSize: 18, margin: 5}}>View Participants</Text>
                          </MenuOption>
                          { (post.authorID == user.uid) &&
                            <MenuOption onSelect={() => showAlert(item.id)}>
                            <Text style={{color: "red", fontSize: 18, margin: 5}}>Delete Post</Text>
                            </MenuOption>
                          }
                        </MenuOptions>
                      </Menu>
                    </View>
                  </View>
                </>
                )
                }
                
                <Pressable
                  onPress={() => setExpanded(!expanded)}
                  style={({ pressed }) => [
                    {opacity: pressed ? 0.5: 1}, styles.caretContainer
                  ]}
                >
                  <Ionicons name={caretName} size={25} style={styles.caret} />
                </Pressable>

              </View>

              {/* comments */}
              <KeyboardAvoidingView style={styles.container} behavior={Platform.OS==='ios'? 'height' : null}>
                <View style={{flex:1}}>
                  {commentsIndicator? (
                    <ActivityIndicator size={80} color='#d4c86e' animating={commentsIndicator} style={{flex:1}} />
                  ) : (
                    <ScrollView ref={scrollView} onContentSizeChange={(w, h) => initialScroll()}>
                      <View style={styles.listContainer}>
                        {
                          allComments.map(comment => {
                            return (
                              <View style={styles.listItem} key={comment.id}>
                                {comment.system ? (
                                  <SystemMessage comment={comment} />
                                ) : (
                                  <>
                                    {(comment.authorID == user.uid) ? (
                                      <RenderComment comment={comment} userID={getAuth().currentUser.uid} alert={showAlert} />
                                    ) : (
                                      <RenderOthersComment comment={comment} userID={getAuth().currentUser.uid} alert={showAlert} />
                                    )
                                    }
                                  </>
                                )}
                                
                              </View>
                            )
                          })
                        }
                      </View>
                    </ScrollView>
                  )}
                  
                  <View style={styles.commentBox}>
                    <TextInput
                      style={styles.comment}
                      placeholder='Message...'
                      onChangeText={(value) => setComment(value)}
                      value={comment}
                      multiline
                    />

                    <View style={styles.buttonGroup}>
                      <Pressable
                        onPress={postComment}
                        style={({ pressed }) => [
                          {opacity: pressed ? 0.5: 1}, styles.buttonPost,
                        ]}
                      >
                        <View style={{backgroundColor:'#613a5f', borderRadius:20, padding:6, paddingLeft:8}}>
                          <MaterialIcons name='arrow-forward-ios' size={25} color='white' />
                        </View>
                      </Pressable>
                    </View>
                  </View>

                </View>
              </KeyboardAvoidingView>
            </>
          }
        </>
        ) : (
          <View style={styles.na}>
            <View style={styles.naHeader}>
              <MaterialIcons name='warning' color='#8b8c41' size={40}/>
              <Text style={{color:'#8b8c41', fontSize:20, marginLeft:10, fontWeight:'bold'}}>Conversation not available</Text>
            </View>
            <View style={styles.naBody}>
              <Text style={{fontSize:18, color:'#8b8c41'}}>It may have been deleted, or you are no longer a participant</Text>
            </View>
          </View>
        )
      }
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // paddingHorizontal: 5,
    backgroundColor:'white'
  },
  card:{
    backgroundColor:'#fff',
    elevation: 8,
    padding:3,
    shadowOffset: {width:0, height:3},
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  na: {
    marginHorizontal:40,
    marginTop: 50,
    alignItems: 'center'
  },
  naHeader: {
    flexDirection: 'row',
    marginRight: 40,
    alignItems: 'center'
  },
  cardContent:{
    // marginHorizontal:10,
    paddingHorizontal:3,
    borderRadius:10,
  },
  commentBox: {
    backgroundColor: '#613a5f',
    paddingVertical:3,
    flexDirection:'row'
  },
  comment: {
    backgroundColor: 'white',
    color: 'black',
    padding: 5,
    paddingLeft: 15,
    flex:4,
    fontSize: 18,
    borderColor: '#613a5f',
    borderWidth: 1,
    alignSelf:'flex-end',
    borderRadius:20,
    marginLeft:5
  },
  buttonGroup: {
    flexDirection: 'row',
    flex:1
  },
  write: {
    flexDirection:'row',
    justifyContent:'center',
    padding:10,
    alignSelf:'center',
    borderWidth: 1,
    borderColor:'grey',
    borderStyle:'dashed',
    borderRadius:10,
    alignItems:'center',
    marginTop: 20,
    marginBottom: 50
  },
  buttonPost: {
    flex:1,
    justifyContent:'center',
    alignItems:'center',
    // borderColor: '#adab1a',
    // borderWidth: 2,
  },
  buttonCancel: {
    backgroundColor: '#E374A0',
    padding: 10,
    justifyContent:'center',
    alignItems:'center',
  },
  listContainer: {
    marginTop:14,
    marginHorizontal:4
  },
  listItem: {
    flex: 1,
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  pic: {
    height: 35,
    width: 35,
    borderRadius: 60,
    marginLeft:3,
    borderColor: '#613a5f',
    borderWidth:1,
    position: 'absolute'
  },
  commentView: {
    backgroundColor: 'pink',
    padding: 10,
    marginRight: 50,
    marginLeft: 20,
    borderRadius: 17,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // borderColor:'#745f8a',
    // borderWidth:1
  },
  commentViewInner: {
    marginLeft: 15
  },
  delete: {
    opacity: 0.5,
    marginLeft: 'auto',
  },
  theComment: {
    fontSize: 17,
    fontFamily: 'Kanit-Light'
  },
  commentDetails: {
    flexDirection: 'row',
    marginTop: 5,
    alignItems: 'center'
  },
  author: {
    color: '#3380a3',
    fontSize: 15
  },
  commentDate: {
    color: 'grey'
  },
  addContainer: {
    borderBottomColor: '#a6a6a6',
    borderBottomWidth: 1,
    marginBottom: 20,
    marginHorizontal: 100,
    marginTop: 8
  },
  homeHeader: {
    flexDirection: 'row', 
    justifyContent:'space-between', 
    alignItems:'center',
    backgroundColor: '#613a5f',
    padding: 10,
    elevation: 15
  },
  createdView: {
    flexDirection: 'row',
    marginTop: 5,
    alignItems:'center',
  },
  createdAuthor: {
    flex: 5,
    fontSize: 12,
    color: '#a1a333',
  },
  createdTime: {
    flex: 2.5,
    alignItems:'flex-end',
  },
  createdTimeText: {
    fontSize: 11,
    color:'grey',
  },
  copyID: {
    padding: 3,
    backgroundColor: '#d4c86e',
    alignItems: 'center',
    borderRadius:20,
    flex: 1,
  },
  more: {
    alignItems: 'stretch',
    borderRadius:20,
    marginLeft: 7,
    flex:1.5,
  },
  caret: {
    color: '#613a5f',
    backgroundColor:'#d4c86e',
    padding: 1,
    borderRadius:10,
    position:'absolute',
    overflow:'hidden'
  },
  caretContainer: {
    marginLeft:15,
    justifyContent:'center'
  },
  item: {
    flex:1, 
    marginBottom:10, 
    padding: 4,
    backgroundColor:'#8d8299',
    marginHorizontal:3
  },
  itemUser: {
    marginTop: 5,
    marginBottom:10, 
    padding: 4,
    backgroundColor:'#8d8299',
  },
  friendsOp: {
    padding: 8,
    backgroundColor: 'grey',
    alignItems: 'center',
    borderRadius:20,
  },
  menu: {
    alignItems: 'center',
    marginRight:10,
    marginLeft:'auto'
  },
  header: {
    flexDirection: 'row',
    marginHorizontal: 15,
    alignItems: 'center'
  },
})