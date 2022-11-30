import { useEffect, useState, useRef, useCallback } from 'react';
import { StyleSheet, Text, View, Button, ImageBackground, Image, KeyboardAvoidingView,
  TextInput, ScrollView, FlatList, Modal, Alert, Pressable, Keyboard, ToastAndroid, ActivityIndicator
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import { Foundation } from '@expo/vector-icons';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { getFirestore, addDoc, collection, serverTimestamp, onSnapshot, query, orderBy, doc, 
  deleteDoc, Timestamp, setDoc, getDoc, getDocs, updateDoc } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { Entypo } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context';
import avatar from '../assets/Imgs/avatar.png';
import CachableImage from '../shared/CachableImage';
import RenderComment from '../shared/RenderComment';
import RenderOthersComment from '../shared/RenderOthersComment';
import * as FileSystem from "expo-file-system";
import * as Clipboard from 'expo-clipboard';
import { Menu, MenuOptions, MenuOption, MenuTrigger, MenuProvider, } from 'react-native-popup-menu';
import SystemMessage from '../shared/SystemMessage';
import ErrorScreen from './ErrorScreen';

export default function Details({ route, navigation }) {

  const { id } = route.params;
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
    const tab = navigation.getParent();
    tab.setOptions({
      tabBarStyle: {display: 'none'}
    });
    
    
    updateDoc(doc(db, 'Users', user.uid, 'My Conversations', id), {
      lastAccessed: Timestamp.now(),
    });

    const unsubscribe = onSnapshot(doc(db, 'Conversations', id), snapShot => {
      if(snapShot.data()) {

        if(mount.current) {
          setPost(snapShot.data());
      
          setIsAvailable(true);
        }
        
        // getDoc(doc(db, 'Users', snapShot.data().authorID))
        //   .then(author => {
        //     setUri(author.data().Photo);
        //   })
      }
      else {
        // setIsAvailable(false);
        navigation.replace('Error');
      }
    }, error => {console.log(error)})
    

    let participants = {};
    let participantsID = [];

    const participantsRef = collection(db, 'Conversations', id, 'Participants');
    
    const unsubscribe3 =  onSnapshot(participantsRef, async snapShot => {
      
      await Promise.all(snapShot.docChanges().map(async change => {

        if(change.type === 'added') {
          const info = await getDoc(doc(db, 'Users', change.doc.id));

          const photo = await prepareImg(info.data().Photo, info.data().photoExtension);

          if(change.doc.data().Admin) {
            convAuthorID.current = change.doc.id;
            convAuthorUri.current = photo;
            convAuthorName.current = info.data().Name;
          }

          if (change.doc.id != user.uid)
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
            // await addDoc(collection(db, 'Conversations', id, 'Comments'), {
            //   comment: 'removed',
            //   author: change.doc.data().Name,
            //   authorID: change.doc.id,
            //   timeStamp: serverTimestamp(),
            //   system: true,
            // })

            const index = participantsID.map(e => e.id).indexOf(change.doc.id);
            participantsID[index].removed = true;
  
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
            
            if(change.doc.id == user.uid) {
              // setIsAvailable(false);
              navigation.replace('Error');
            }
          }
          else if(change.doc.data().removed == false) {
            const index = participantsID.map(e => e.id).indexOf(change.doc.id);
            participantsID[index].removed = false;
  
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
        setNum(participantsID.length);
      }
      
    }, error => {console.log(error)});

    

    return () => {
      tab.setOptions({
        tabBarStyle: {display: 'flex', backgroundColor: '#745f8a'}
      });
      mount.current = false;
      unsubscribe();
      unsubscribe3();
      unsubscribe2.current != undefined? unsubscribe2.current() : null;
    }

  }, [])

  // useEffect(() => {
  //   const colRef = collection(db, 'Conversations', id, 'Comments');
  //   const q = query(colRef, orderBy('timeStamp'));
    
  //   const unsubscribe2 = onSnapshot(q, async snapShot => {
  //     let comments = allComments;
  //     console.log('allComments.length ', allComments.length);
  //     console.log('comments.length ', comments.length);
  //     if(allComments.length != 0) {
  //       console.log('ran comments listener!');
  //       for (const change of snapShot.docChanges()) {
  //         if(change.type === 'added') {
  //           console.log('comment change happened: ', change.doc.data().comment);
  //           const empty = change.doc.data().timeStamp === null ? Timestamp.now() : change.doc.data().timeStamp;
  
  //           comments.push({id: change.doc.id, ...change.doc.data(), timeStamp: empty, 
  //             uri: allParticipants[change.doc.data().authorID+'Photo'], 
  //             Name: allParticipants[change.doc.data().authorID+'Name']
  //           });
  //         }
  //         else if(change.type === 'removed') {
  //           const index = comments.map(e => e.id).indexOf(change.doc.id);
  //           comments.splice(index,1);
  //         }
  //       }

  //       setAllComments(prev => {
  //         prev = comments;
  //         return [...prev];
  //       });

  //     }
  //   })

  //   return () => {
  //     unsubscribe2();
  //   }
  // })

  // useEffect(() => {
  //   const loadComments = async () => {
  //     if(allComments.length == 0) {
  //       let commentDocs = [];
  //       const colRef = collection(db, 'Conversations', id, 'Comments');
  //       const q = query(colRef, orderBy('timeStamp'));
  
  //       const comments = await getDocs(q);
  
  //       for (const commentDoc of comments.docs) {
  //         const empty = commentDoc.data().timeStamp === null ? Timestamp.now() : commentDoc.data().timeStamp;
  
  //         commentDocs.push({id: commentDoc.id, ...commentDoc.data(), timeStamp: empty, 
  //           uri: allParticipants[commentDoc.data().authorID+'Photo'], 
  //           Name: allParticipants[commentDoc.data().authorID+'Name']
  //         });
  //       }
  
  //       setAllComments(commentDocs);
  //     }
  //   }
    
  //   loadComments();
  // }, [allParticipants])

  // useEffect(() => {
  //   if((participantsIDs != null && friendsFlag.current == 'first render' || addedFlag.)) {
  //     loadFriends();
  //   }
  // }, [participantsIDs])

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
          console.log('comment added: ', change.doc.data().comment);
          const empty = change.doc.data().timeStamp === null ? Timestamp.now() : change.doc.data().timeStamp;

          comments.push({id: change.doc.id, ...change.doc.data(), timeStamp: empty, 
            uri: allParticipants[change.doc.data().authorID+'Photo'], 
            Name: allParticipants[change.doc.data().authorID+'Name'],
            removed: allParticipants[change.doc.data().authorID+'REM'],
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

  // const loadFriends = useCallback(() => {
  //   const friendsRef = collection(db, 'Users', user.uid, 'Friends');

  //   const unsubscribe4 = onSnapshot(friendsRef, async snapShot => {
  //     // console.log('initial arrayAreFriends: ', arrayAreFriends);
  //     // console.log('initial arrayNotFriends: ', arrayNotFriends);

  //     let arrayFriends = friends;
  //     let arrayAreFriends = areFriends;
  //     let arrayNotFriends = notFriends;
      
  //     for (const change of snapShot.docChanges()) {
  //       // console.log(change.doc.data().Name);
  //       let participant = participantsIDs.find(e => e.id === change.doc.data().ID);
  //       if(participant) {
  //         if(change.type === 'added') {
  //           arrayFriends.push(change.doc.data());
  //           arrayAreFriends.push(participant);

  //           if(arrayNotFriends.find(e => e.id === change.doc.data().ID)) {
  //             // console.log('exists not friend');
  //             const index = arrayNotFriends.map(e => e.id).indexOf(change.doc.id);
  //             arrayNotFriends.splice(index,1);
  //             // console.log('removed from arrayNotFriends: ', arrayNotFriends);
  //           }
  //         }
  //         else if(change.type === 'removed') {
  //           // console.log('removed');
  //           // if(!arrayNotFriends.find(e => e.id === change.doc.data().ID))
  //           arrayNotFriends.push(participant);

  //           if(arrayAreFriends.find(e => e.id === change.doc.data().ID)) {
  //             // console.log('exists friend');
  //             const index = arrayAreFriends.map(e => e.id).indexOf(change.doc.id);
  //             arrayAreFriends.splice(index,1);
  //             // console.log('removed from arrayAreFriends: ', arrayAreFriends);

  //             const index2 = arrayFriends.map(e => e.ID).indexOf(change.doc.id);
  //             arrayFriends.splice(index2,1);
  //           } 
  //         }
  //       }
        
  //       // console.log('arrayFriends: ', arrayFriends);
        
  //     }
        
  //     if(friendsFlag.current == 'first render') {
  //       // console.log('friendsFlag ', friendsFlag.current);
  //       // console.log('participantsIDS: ', participantsIDs);
  //       for (const participant of participantsIDs) {
  //         if(!(arrayFriends.find(e => e.ID === participant['id']) || participant['id'] == user.uid)) {
            
  //           arrayNotFriends.push(participant);
  //         }
  //       }
  //     }
      

  //     // console.log('final arrayAreFriends: ', arrayAreFriends);
  //     // console.log('final arrayNotFriends: ', arrayNotFriends);

  //     if(mount.current) {
  //       setFriends(arrayFriends);
  //       setAreFriends(arrayAreFriends);
  //       setNotFriends(arrayNotFriends);

  //       if(friendsFlag.current != 'first render') {
  //         friendsFlag.current = 'rendered';
  //         setData(prev => {
  //           return [...prev];
  //         })
  //       }
        
  //     }
  //     else {
  //       return () => {
  //         unsubscribe4();
  //         console.log('RETURNED Friends!!');
  //       }
  //     }
      
  //   }, error => {console.log(error)})

  // }, [participantsIDs, areFriends, notFriends, friends])

  const initialScroll = () => {
    if(commentsFlag.current == 'first render') {
      scrollView.current.scrollToEnd({animated:false});
      commentsFlag.current = 'rendered';
    }
  }

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
    console.log('will download');
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
      console.log("cached!");
      return cacheFileUri;
    } else {
      let cached = await cacheImage(photo, cacheFileUri, () => {});
      if (cached.cached) {
        console.log("cached new!");
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

  const showAlertUser = (id, name) => {
    Alert.alert(
      'Delete Comment?',
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

    deleteDoc(doc(db, 'Users', userID, 'My Conversations', id));
  }

  const postComment = async () => {
    const theComment = comment;
    if(comment == '') return;

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

  const renderComment = () => {
    for(const comment of allComments) {
      return (
        <View style={styles.listItem} key={comment.id}>
          <View style={styles.commentView} >
            <View style={styles.commentViewInner}>
              <Text style={styles.theComment} selectable>{comment.comment}</Text>
              <View style={styles.commentDetails}>
                <Text style={styles.author} selectable>{ comment.author }</Text>
                <Text style={styles.commentDate}>  •  {comment.timeStamp.toDate().toDateString()}</Text>
              </View>
            </View>
          </View>
          <CachableImage source={{uri: comment.uri}} cacheKey={ comment.cache } 
          style={{width:35, height:35, borderRadius:60, marginLeft:3, borderColor:'#613a5f', borderWidth:1, position:'absolute'}} 
          isNew={comment.isNew} xt={ comment.xt }/>
          <View style={styles.delete} >
            {(getAuth().currentUser.uid == comment.authorID) && <MaterialIcons name='delete' color='grey' size={25} onPress={() => showAlert(comment.id)}/>}
          </View>
          {/* <RenderComment comment={comment} userID={getAuth().currentUser.uid} alert={showAlert} /> */}
        </View>
      )
    }
  }

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(id);

    ToastAndroid.show('conversation id copied', ToastAndroid.SHORT);
  }

  const selectFriends = () => {
    // console.log(areFriends);
    setData(areFriends);
    setSelector('friends');
    setNum(areFriends.length);
  }

  const selectOthers = () => {
    // console.log(notFriends);
    setData(notFriends); 
    setSelector('others'); 
    setNum(notFriends.length);
  }

  const selectAll = () => {
    setData(participantsIDs);
    setSelector('all');
    setNum(participantsIDs.length);
  }


  return (
    <SafeAreaView style={{flex:1}}>
      { isAvailable == true ? (
        <>
          { post &&
            <>
              {/* modal */}
              <Modal visible={modalOpen} animationType='slide' onRequestClose={() => setModalOpen(false)}>
                <MenuProvider skipInstanceCheck style={{flex:1}}>
                  <View style={{flex:1, backgroundColor:'#806b96'}}>
                    <View style={styles.homeHeader}></View>
   
                    <Text style={{marginVertical:4, marginLeft:8, fontSize:18, color:'white', backgroundColor:'#8d8299', alignSelf:'flex-start', paddingHorizontal:3, fontWeight:'bold'}}>Participants  { num }</Text>

                    <View style={styles.itemUser}>
                      <View style={{flexDirection:'row', alignItems:'center', backgroundColor:'#8d8299', padding:4, borderRadius:20,}}>
                        <Image source={{uri: user.photoURL}} style={{height:40, width:40, borderRadius:50, borderColor:'#4ebbed'}} />
                        <Text style={{fontSize:18, marginLeft:10, color:'white'}}>{ user.displayName }</Text>
                        <Text style={{fontSize:15, marginLeft:'auto', color:'white', fontStyle:'italic', marginRight:5}}>(you)</Text>
                      </View>
                    </View>

                    <View style={{flex:1, marginTop:5, padding:4}}>
                      <FlatList data={data} extraData={participantsIDs} renderItem={({ item }) => (
                        <View style={styles.item}>

                          <View style={{flexDirection:'row', alignItems:'center', backgroundColor:'#8d8299', padding:4, borderRadius:20, opacity: (item.removed == true)? 0.5 : 1}}>
                            <Image source={{uri: item.photo}} style={{height:40, width:40, borderRadius:50, borderColor:'#4ebbed'}} />
                            <Text style={{fontSize:18, marginLeft:10, color:'white'}}>{ item.name }</Text>
                            {(item.removed == false) && 
                              <Menu style={styles.menu}>
                              <MenuTrigger>
                                <MaterialIcons name='more-horiz' size={20} color='white'  />
                              </MenuTrigger>
                              <MenuOptions>
                                {user.uid == convAuthorID.current? (
                                  <MenuOption onSelect={() => showAlertUser(item.id, item.name)}>
                                   <Text style={{color: "red", fontSize: 18, margin: 5}}>Remove</Text>
                                  </MenuOption>
                                ):null}
                                
                                <MenuOption onSelect={() => showAlert(item.id, item.name)}>
                                  <Text style={{fontSize: 18, margin: 5}}>Add to friends</Text>
                                </MenuOption>
                                
                              </MenuOptions>
                            </Menu>
                            }
                            
                          </View>

                        </View>
                      )} />
                    </View>
                  </View>
                </MenuProvider>
              </Modal>

              {/* topic card */}
              <View style={{zIndex:999}}>
                {expanded ? (
                  <View style={styles.card}>
                    <View style={styles.cardContent}>
                      {/* <Text style={{color:'grey'}}>Title</Text> */}
                      <Text style={{borderBottomColor:'#e6e6e6', borderBottomWidth:1, fontSize:15, color:'grey', paddingBottom:3}} selectable>{ post.title }</Text>
                      
                      <ScrollView style={{maxHeight:200}}>
                        <Text style={{marginTop:10, fontSize:18, marginHorizontal:8}} selectable>{ post.body }</Text>
                      </ScrollView>

                      <View style={styles.createdView}>
                        {/* <Text style={{fontSize: 13}}>By: </Text> */}
                        <Image source={{uri: convAuthorUri.current}} style={{width:25, height:25, borderRadius:60, borderColor:'#613a5f', borderWidth:1, marginRight:5}} />
                        <Text style={styles.createdAuthor} selectable>{ convAuthorName.current }</Text>
                        <Text style={styles.createdTime} selectable>{post.dateCreated.toDate().toDateString()}</Text>
                      </View>
                    </View>
                    <View style={{flexDirection:'row', justifyContent:'flex-end', alignItems:'center', marginHorizontal:3,}}>
                      <View style={{alignItems:'flex-end', flex:5, marginRight:6}}>
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
                        <MenuTrigger>
                          <View style={{backgroundColor: '#d4c86e', alignItems:'center', borderRadius:20}}>
                            <MaterialIcons name='more-horiz' size={22} color='#806b96' />
                          </View>
                        </MenuTrigger>
                        <MenuOptions>
                          <MenuOption onSelect={() => setModalOpen(true)}>
                            <Text style={{color: "#613a5f", fontSize: 18, margin: 5}}>View Participants</Text>
                          </MenuOption>
                          <MenuOption onSelect={() => showAlert(item.id)}>
                            <Text style={{color: "#613a5f", fontSize: 18, margin: 5}}>Invite Participant</Text>
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
                ) : (
                  <>
                  <View style={styles.card}>
                    <Text style={{fontSize:18, marginBottom:10, marginLeft:5, marginTop:5}} numberOfLines={2}>{ post.body }</Text>
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
              <KeyboardAvoidingView style={styles.container}  >
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
    padding:5,
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
    marginTop: 10,
    alignItems:'center',
  },
  createdAuthor: {
    fontSize: 13,
    color: '#a1a333',
  },
  createdTime: {
    fontSize: 13,
    color:'grey',
    marginLeft: 'auto'
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
    borderRadius:20,
    position:'absolute',
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
})