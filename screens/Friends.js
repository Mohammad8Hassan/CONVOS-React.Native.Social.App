import { StyleSheet, Text, View, Image, ScrollView, TouchableOpacity, Modal, TextInput,
    Pressable, TouchableWithoutFeedback, ToastAndroid, Keyboard, FlatList, Alert, 
    ActivityIndicator, SafeAreaView, Cli, Platform } from 'react-native';
import { useEffect, useState, useCallback, useRef } from 'react';
// import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { FontAwesome5 } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { getFirestore, addDoc, collection, serverTimestamp, onSnapshot, query, orderBy, doc, 
  deleteDoc, Timestamp, setDoc, getDocs, where, getDoc, updateDoc } from 'firebase/firestore'
import { getAuth } from 'firebase/auth';
import avatar from '../assets/Imgs/avatar.png';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Menu, MenuOptions, MenuOption, MenuTrigger, } from 'react-native-popup-menu';
import _ from 'lodash';
import * as FileSystem from "expo-file-system";
import { useDispatch, useSelector } from 'react-redux';


export default function Friends({ navigation }) {

  const db = getFirestore();
  const storage = getStorage();
  const user = getAuth().currentUser;
  const defaultImg = Image.resolveAssetSource(avatar).uri;

  const [email, setEmail] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [emailResult, setEmailResult] = useState('');
  const [url, setUrl] = useState(null);
  const [found, setFound] = useState(false);
  const [connection, setConnection] = useState('');
  const [caption, setCaption] = useState('');
  const [sentRequests, setSentRequests] = useState(null);
  const [sentRequestsNum, setSentRequestsNum] = useState(0);
  const [receivedRequests, setReceivedRequests] = useState(null);
  const [receivedRequestsNum, setReceivedRequestsNum] = useState(0);
  const [Friends, setFriends] = useState(null);
  const [FriendsNum, setFriendsNum] = useState(0);
  const [searchedID, setSearchedID] = useState('');
  const [Data, setData] = useState(null);
  const [selector, setSelector] = useState('');
  const [title, setTitle] = useState('');
  const [num, setNum] = useState(0);
  const [showIndicator, setShowIndicator] = useState(false);
  const [listIndicator, setListIndicator] = useState(true);
  const [searchIndicator, setSearchIndicator] = useState(false);

  const firstRender = useRef(true);
  const recFlag = useRef('...');
  const senFlag = useRef('...');
  const total = useRef(0);

  //redux store
  const { mainColor, backgroundColor, tabColor, iconColor,
    iconActiveColor, conAuthorBarColor, convAuthorTextColor, homeConvTitleColor,
    homeConvBodyColor, topButtonsColors, userNameColor, userIDColor, actionColor, actionInsideColor,
    headerTextColor, convAuthorPic, topButtonsBar, titleBackground, inviteBackground, inviteAuthor, inviteDate,
    titleColor, selectorColor, addButton, addButtonInside, friendBackground
  } = useSelector(state => state.theme);

  useEffect(() => {
    // Sent Requests
    const colRef = collection(db, 'Users', user.uid, 'Sent Requests');
    const q = query(colRef, orderBy('timestamp'));
    const unsubscribe1 = onSnapshot(q, async snapShot => {
      let result = [];
      let num = 0;

      await Promise.all(snapShot.docs.map(async change => {
        const empty = change.data().timestamp === null ? Timestamp.now() : change.data().timestamp;

        const info = await getDoc(doc(db, 'Users', change.id));

        const photo = await prepareImg(info.data().Photo, info.data().photoExtension);

        result.push({id: change.id, Namee: info.data().Name, Photoo: photo, ...change.data(), dateSent: empty.toDate()});
        num++;
      }))

      // for (const doc of snapShot.docs) {
      //   const empty = doc.data().timestamp === null ? Timestamp.now() : doc.data().timestamp;

      //   result.push({id: doc.id, ...doc.data(), dateSent: empty.toDate()});
      //   num++;
      // }

      setSentRequestsNum(num);
      setSentRequests(result);
      senFlag.current = 'done';
    }, error => {console.log(error)})
    
    // Received Requests
    const colRef2 = collection(db, 'Users', user.uid, 'Received Requests');
    const q2 = query(colRef2, orderBy('timestamp'));
    const unsubscribe2 = onSnapshot(q2, async snapShot => {
      let result = [];
      let num = 0;

      await Promise.all(snapShot.docs.map(async change => {
        if(change.data().ignored === false) {
          const empty = change.data().timestamp === null ? Timestamp.now() : change.data().timestamp;

          const info = await getDoc(doc(db, 'Users', change.id));

          const photo = await prepareImg(info.data().Photo, info.data().photoExtension);

          result.push({id: change.id, Namee: info.data().Name, Photoo: photo, ...change.data(), dateReceived: empty.toDate()});
          num++;
        }
      }))

      // for (const doc of snapShot.docs) {
      //   if(doc.data().ignored == false) {
      //     const empty = doc.data().timestamp === null ? Timestamp.now() : doc.data().timestamp;
          
      //     result.push({id: doc.id, ...doc.data(), dateReceived: empty.toDate()});
      //     num++;
      //   }
      // }
      // console.log("ran here");
      setReceivedRequests(result);
      setReceivedRequestsNum(num);
      recFlag.current = 'done';
    }, error => {console.log(error)})

    // Friends List
    const colRef3 = collection(db, 'Users', user.uid, 'Friends');
    const q3 = query(colRef3, orderBy('Name'));
    const unsubscribe3 = onSnapshot(q3, async snapShot => {
      let result = [];
      let num = 0;

      await Promise.all(snapShot.docs.map(async change => {
        const empty = change.data().since === null ? Timestamp.now() : change.data().since;

        const info = await getDoc(doc(db, 'Users', change.id));

        const photo = await prepareImg(info.data().Photo, info.data().photoExtension);

        result.push({id: change.id, Namee: info.data().Name, Photoo: photo, ...change.data(), since: empty.toDate()});
        num++;
      }))
      
      // for (const doc of snapShot.docs) {
      //   const empty = doc.data().since === null ? Timestamp.now() : doc.data().since;

      //   const info = await getDoc(doc(db, 'User', doc.id));

      //   const photo = await prepareImg(info.data().Photo, info.data().photoExtension);

      //   result.push({id: doc.id, photo: photo, ...doc.data(), since: empty.toDate()});
      //   num++;
      // }
      
      
      setFriends(result);
      setFriendsNum(num);
      setListIndicator(false);
      
      if(firstRender.current){
        setSelector('friends');
        firstRender.current = false;
      }
    }, error => {console.log(error)})

    return () => {
      unsubscribe1();
      unsubscribe2();
      unsubscribe3();
    }
  }, [])

  useEffect(() => {
    setNum(FriendsNum)
  }, [FriendsNum])

  useEffect(() => {
    // if(recFlag.current == 'done' && senFlag.current == 'done') {
      
    // }
    total.current = receivedRequestsNum + sentRequestsNum;
      //dispatch(incrementByValue(totatlNum.current));
      navigation.setOptions({
        tabBarBadge: total.current == 0? null : total.current
      })
    
   }, [receivedRequestsNum, sentRequestsNum])

  const searchEmail = async (searchedID) => {
    Keyboard.dismiss();
    setSearchIndicator(true);
    setUrl(null);
    setConnection('');
    setEmailResult('')
    setCaption('')

    searchedID = searchedID.replace(/\s/g,'');

    if(searchedID.trim().length === 0) {
      setEmailResult("no users found!");
      setFound(true);
      setSearchIndicator(false);
      return;
    }

    if(searchedID == user.uid){
      setEmailResult("Sorry, you can't add yourself!");
      setFound(true);
      setSearchIndicator(false);
      return;
    }

    const blockCheck = await getDoc(doc(db, 'Users', searchedID, 'Blocked', user.uid));
    if(blockCheck.exists()) {
      setEmailResult("no users found!");
      setFound(true);
      setSearchIndicator(false);
      return;
    }

    
    const docRef = doc(db, 'Users', searchedID);
    getDoc(docRef)
      .then(async res => {
        if(res.exists()) {
        
        const photo = await prepareImg(res.data().Photo, res.data().photoExtension);

        const myBlockCheck = await getDoc(doc(db, 'Users', user.uid, 'Blocked', searchedID));
        if(myBlockCheck.exists()) {
          setEmailResult(res.data().Name);
          setUrl(photo);
          setCaption('You blocked ' + res.data().Name);
          setConnection('blocked');
          setFound(true);
          setSearchIndicator(false);
          return;
        }
  
        getDoc(doc(db, 'Users', user.uid, 'Friends', res.id))
          .then(doc => {
      
            if(doc.exists()) {
              setEmailResult(res.data().Name);
              setUrl(photo);
              setCaption('You are already friends with ' + res.data().Name);
              setConnection('friend');
              setFound(true);
              setSearchIndicator(false);
            }
            else throw 'friend throw'
          })
          .catch(err => {
            console.log('friends catch', err);
            getDoc(doc(db, 'Users', user.uid, 'Sent Requests', res.id))
              .then(doc => {
                if(doc.exists()) {
                  setEmailResult(res.data().Name);
                  setUrl(photo);
                  setCaption('You have already sent a friend request to ' + res.data().Name);
                  setConnection('sent');
                  setFound(true);
                  setSearchIndicator(false);
                }
                else throw 'sent throw'
              })
              .catch(err => {
                console.log('sent catch', err);
                getDoc(doc(db, 'Users', user.uid, 'Received Requests', res.id))
                  .then(doc => {
                    if(doc.exists()) {
                      setEmailResult(res.data().Name);
                      setUrl(photo);
                      setCaption(res.data().Name + ' sent you a friend request!');
                      setConnection('received');
                      setFound(true);
                      setSearchIndicator(false);
                    }
                    else throw 'received throw'
                  })
                  .catch(err => {
                    console.log('received catch', err);
                    setEmailResult(res.data().Name);
                    setUrl(photo);
                    setConnection('new');
                    setFound(true);
                    setSearchIndicator(false);
                  })
              })
          })
        }
        else throw 'no user found throw'
      })
      .catch(err => {
        console.log('search catch', err);
        setEmailResult('no users found! ID is case sensitive');
        setFound(true);
        setSearchIndicator(false);
      })

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

  function renderButton() {
    if(!showIndicator) {
      console.log(connection);
      if (connection == 'blocked') {
        return(
          <Pressable
            onPress={() => unblockUser(searchedID)}
            style={styles.btnUnblock}
          >
            <View style={{flexDirection:'row', alignItems:'center'}}>
              <Text style={{color:"#806b96", fontSize: 16,}}>Unblock</Text>
            </View>
          </Pressable>
        )
      }
      else if (connection == 'friend') {
        return(
          <Pressable
            style={styles.btnGrey}
          >
            <View style={{flexDirection:'row', alignItems:'center'}}>
              <Text style={{color:"white", fontSize: 16,}}>on your friends list.</Text>
            </View>
          </Pressable>
        )
      }
      else if (connection == 'sent') {
        return(
          <View style={{flexDirection:'row', justifyContent:'space-between'}}>
            <Pressable
              style={styles.btnGrey}
            >
              <View style={{flexDirection:'row', alignItems:'center'}}>
                <Text style={{color:"white", fontSize: 16,}}>waiting for approval..</Text>
              </View>
            </Pressable>
            <Pressable  
              onPress={() => cancelRequest(searchedID)}
              style={({ pressed }) => [
                {opacity: pressed ? 0.5: 1}, styles.searchCancel
              ]}
            >
              <View style={{flexDirection:'row', alignItems:'center'}}>
                <Text style={{color:"white", fontSize: 16,}}>cancel</Text>
              </View>
            </Pressable>
          </View>
        )
      }
      else if (connection == 'received') {
        return(
          <View style={{flexDirection:'row', flex:2, justifyContent:'space-between'}}>
            <Pressable  
              onPress={() => approveRequest(searchedID)}
              style={({ pressed }) => [
                {opacity: pressed ? 0.5: 1}, styles.searchApprove
              ]}
            >
              <View style={{flexDirection:'row', alignItems:'center'}}>
                <Text style={{color:"white", fontSize: 16,}}>approve</Text>
              </View>
            </Pressable>
            <Pressable  
              onPress={clickOut}
              style={({ pressed }) => [
                {opacity: pressed ? 0.5: 1}, styles.searchIgnore
              ]}
            >
              <View style={{flexDirection:'row', alignItems:'center'}}>
                <Text style={{color:"white", fontSize: 16,}}>ignore</Text>
              </View>
            </Pressable>
            <Pressable  
              onPress={() => blockUser(searchedID)}
              style={({ pressed }) => [
                {opacity: pressed ? 0.5: 1}, styles.btnBlock
              ]}
            >
              <View style={{flexDirection:'row', alignItems:'center',}}>
                <Text style={{color:"white", fontSize: 16,}}>Block</Text>
              </View>
            </Pressable>
          </View>
        )
      }
      else if (connection == 'new') {
        return(
          <View style={{flexDirection:'row', flex:2, justifyContent:'space-between'}}>
            <Pressable  
              onPress={sendRequest}
              style={({ pressed }) => [
                {opacity: pressed ? 0.5: 1}, styles.btn
              ]}
            >
              <View style={{flexDirection:'row', alignItems:'center'}}>
                <Text style={{color:"white", fontSize: 16,}}>Send friend request</Text>
              </View>
            </Pressable>
            <Pressable  
              onPress={() => {blockUser(searchedID)}}
              style={({ pressed }) => [
                {opacity: pressed ? 0.5: 1}, styles.btnBlock
              ]}
            >
              <View style={{flexDirection:'row', alignItems:'center',}}>
                <Text style={{color:"white", fontSize: 16,}}>Block</Text>
              </View>
            </Pressable>
          </View>
        )
      }
    }
    else {
      return(
        <View style={styles.indicator}>
          <ActivityIndicator size={40} color='#613a5f' animating={showIndicator} />
        </View>
      )
    }
    
  }

  const clickOut = () => {
    setShowIndicator(true);
    setModalVisible(false);
    setEmailResult('');
    setFound(false);
    setEmail('');
    setSearchedID('');
    setCaption('');
    setConnection('');
    setUrl(null);
  }

  const sendRequest = async () => {
    setShowIndicator(true);

    const blockCheck = await getDoc(doc(db, 'Users', searchedID, 'Blocked', user.uid))
    if(blockCheck.exists()) {
      Alert.alert(
        'error! request could not be sent!',
        '',
        [
          {
            text: 'Dismess',
            style: 'cancel'
          }
        ],
        {
          cancelable: true
        }
      )
      clickOut();
      return;
    }

    const docRef = doc(db, 'Users', searchedID);
    console.log('searchedID: ', searchedID);
    getDoc(docRef)
      .then(res => {
        setDoc(doc(db, 'Users', searchedID, 'Received Requests', user.uid), {
          ID: user.uid,
          Name: user.displayName,
          Email: user.email,
          Photo: user.photoURL,
          ignored: false,
          timestamp: serverTimestamp()
        });

        setDoc(doc(db, 'Users', user.uid, 'Sent Requests', searchedID), {
          ID: res.data().ID,
          Name: res.data().Name,
          Email: res.data().email,
          Photo: res.data().Photo,
          timestamp: serverTimestamp()
        })

        setModalVisible(false);
        if(Platform.OS === 'android')
          ToastAndroid.show('Request Sent.', ToastAndroid.SHORT);
        setSelector('sent');
        clickOut();
      })
      .catch(err => {
        console.log(err);
      })
  }

  const cancelRequest = useCallback(_.debounce((id) => {
    setShowIndicator(true);
    deleteDoc(doc(db, 'Users', id, 'Received Requests', user.uid))

    deleteDoc(doc(db, 'Users', user.uid, 'Sent Requests', id))

    clickOut()
   }, 800, {'leading':true, 'trailing':false}), [])

  // const cancelRequest = (id) => {
  //   setShowIndicator(true);
  //   deleteDoc(doc(db, 'Users', id, 'Received Requests', user.uid))

  //   deleteDoc(doc(db, 'Users', user.uid, 'Sent Requests', id))

  //   clickOut()
  // }

  const ignoreRequest = useCallback(_.debounce((id) => {
    updateDoc(doc(db, 'Users', user.uid, 'Received Requests', id), {
      ignored: true,
    })
   }, 800, {'leading':true, 'trailing':false}), [])
  
  //  const ignoreRequest = (id) => {
  //   updateDoc(doc(db, 'Users', user.uid, 'Received Requests', id), {
  //     ignored: true,
  //   })
  // }

  const approveRequest = useCallback(_.debounce(async (id) => {
    setShowIndicator(true);
    const requestCheck = await getDoc(doc(db, 'Users', user.uid, 'Received Requests', id));
    if(requestCheck.exists()) {
      getDoc(doc(db, 'Users', id))
        .then(res => {
          deleteDoc(doc(db, 'Users', id, 'Sent Requests', user.uid))

          deleteDoc(doc(db, 'Users', user.uid, 'Received Requests', id))

          setDoc(doc(db, 'Users', user.uid, 'Friends', id), {
            Name: res.data().Name,
            ID: res.data().ID,
            Email: res.data().email,
            Photo: res.data().Photo,
            since: serverTimestamp()
          });

          setDoc(doc(db, 'Users', id, 'Friends', user.uid), {
            Name: user.displayName,
            ID: user.uid,
            Email: user.email,
            Photo: user.photoURL,
            since: serverTimestamp()
          });
        })
        .catch(err => {
          console.log(err);
        })

      setModalVisible(false);
      
      if(Platform.OS === 'android')
        ToastAndroid.show('Added Sucessfully', ToastAndroid.SHORT);
      else {
        Alert.alert(
          'Added Sucessfully',
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
    else {
      Alert.alert(
        'Error',
        'Friend request could not be found!',
        [
          {
            text: 'Close',
            style: 'cancel'
          },
        ],
        {
          cancelable: true
        }
      )
    }
   }, 800, {'leading':true, 'trailing':false}), [])

  // const approveRequest = async (id) => {
  //   setShowIndicator(true);
  //   const requestCheck = await getDoc(doc(db, 'Users', user.uid, 'Received Requests', id));
  //   if(requestCheck.exists()) {
  //     getDoc(doc(db, 'Users', id))
  //       .then(res => {
  //         deleteDoc(doc(db, 'Users', id, 'Sent Requests', user.uid))

  //         deleteDoc(doc(db, 'Users', user.uid, 'Received Requests', id))

  //         setDoc(doc(db, 'Users', user.uid, 'Friends', id), {
  //           Name: res.data().Name,
  //           ID: res.data().ID,
  //           Email: res.data().email,
  //           Photo: res.data().Photo,
  //           since: serverTimestamp()
  //         });

  //         setDoc(doc(db, 'Users', id, 'Friends', user.uid), {
  //           Name: user.displayName,
  //           ID: user.uid,
  //           Email: user.email,
  //           Photo: user.photoURL,
  //           since: serverTimestamp()
  //         });
  //       })
  //       .catch(err => {
  //         console.log(err);
  //       })

  //     setModalVisible(false);
  //     ToastAndroid.show('Added Sucessfully', ToastAndroid.SHORT);
  //   }
  //   else {
  //     Alert.alert(
  //       'Error',
  //       'Friend request could not be found!',
  //       [
  //         {
  //           text: 'Close',
  //           style: 'cancel'
  //         },
  //       ],
  //       {
  //         cancelable: true
  //       }
  //     )
  //   }
  // }

  const removeFriend = (id) => {
    console.log(id);

    deleteDoc(doc(db, 'Users', id, 'Friends', user.uid));

    deleteDoc(doc(db, 'Users', user.uid, 'Friends', id));

    if(Platform.OS === 'android')
      ToastAndroid.show('Removed Sucessfully', ToastAndroid.SHORT);
      else {
        Alert.alert(
          'Removed Sucessfully',
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

  const blockFriend = (id) => {
    setDoc(doc(db, 'Users', user.uid, 'Blocked', id), {
      ID: id
    })

    removeFriend(id);

    if(Platform.OS === 'android')
      ToastAndroid.show('User Blocked', ToastAndroid.SHORT);
    else {
      Alert.alert(
        'User Blocked',
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

  const blockUser = (id) => {
    setShowIndicator(true);

    setDoc(doc(db, 'Users', user.uid, 'Blocked', id), {
      ID: id
    });

    getDoc(doc(db, 'Users', user.uid, "Received Requests", id))
      .then(res => {
        console.log(res.data());
        if(res.exists()) {
          console.log('deleting received requests');
          deleteDoc(doc(db, 'Users', user.uid, "Received Requests", id));
        }
      })
    
    getDoc(doc(db, 'Users', user.uid, "Sent Requests", id))
      .then(res => {
        if(res.exists()) {
          deleteDoc(doc(db, 'Users', user.uid, "Sent Requests", id));
        }
      })
    
    clickOut();

    if(Platform.OS === 'android')
      ToastAndroid.show('User Blocked', ToastAndroid.SHORT);
      else {
        Alert.alert(
          'User Blocked',
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

  const unblockUser = async (id) => {
    setShowIndicator(true);

    await deleteDoc(doc(db, 'Users', user.uid, 'Blocked', id))

    clickOut();
    
    if(Platform.OS === 'android')
      ToastAndroid.show('User Unblocked', ToastAndroid.SHORT);
    else {
      Alert.alert(
        'User Unblocked',
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

  const showAlert = (id, person) => {
    console.log(id);
    const ID = id;
    Alert.alert(
      'Remove Friend?',
      'Are you sure you want to remove ' + person + ' from your friends list?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: "confirm",
          onPress: () => removeFriend(ID)
        }
      ],
      {
        cancelable: true
      }
    )
  }

  const showAlertBlock = (id, person) => {
    console.log(id);
    const ID = id;
    Alert.alert(
      'Block User?',
      'Are you sure you want to block ' + person + "? They will be removed from your friends list and they won't be able to send you friend requests.",
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: "confirm",
          onPress: () => blockFriend(ID)
        }
      ],
      {
        cancelable: true
      }
    )
  }

  const copyToClipboard = async (id) => {
    await Clipboard.setStringAsync(id);
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

  const renderList = (data, listTitle, listNum) => {
    return(
      <View style={{flex:1, marginBottom:20}}>
        <View style={{flexDirection: 'row', backgroundColor:titleBackground, alignItems:'center', paddingLeft:8}}>
          <Text style={{color:titleColor, fontSize:19, fontFamily:'Solway-Regular'}}>{ listTitle }</Text>
          <Text style={{color:iconActiveColor, fontSize:19, marginLeft:5}}>{ listNum }</Text>
        </View>

        
          <View style={{flex:1, marginTop:5, padding:4}}>
            <FlatList data={data} removeClippedSubviews={false} renderItem={({ item }) => (
              <View style={[styles.item, {backgroundColor: (selector=='friends'? 'none': friendBackground)}]}>

                <View style={{flexDirection:'row', alignItems:'center', backgroundColor:friendBackground, padding:4, borderRadius:20}}>
                  <Image source={{uri: item.Photoo}} style={{height:40, width:40, borderRadius:40,}} />
                  <View style={{flex:1, marginLeft:10, marginRight:3, alignItems:'center', }}>
                    <Text style={{color:'white', fontSize:18,}} selectable>{ item.Namee }</Text>
                    <Text style={{color:'#d1d1d1', fontSize:13, fontStyle:'italic'}} numberOfLines={1} > {item.id} </Text>
                  </View>

                  {(selector == 'friends') && 
                    <Pressable
                      style={({ pressed }) => [
                        {opacity: pressed ? 0.5: 1}, styles.menu
                      ]}
                    >
                      <Menu>
                        <MenuTrigger>
                          <MaterialIcons name='more-horiz' size={20} color='white'  />
                        </MenuTrigger>
                        <MenuOptions>
                          <MenuOption onSelect={() => copyToClipboard(item.ID)}>
                            <Text style={{color: "#613a5f", fontSize: 18, margin: 5}}>Copy ID</Text>
                          </MenuOption>
                          <MenuOption onSelect={() => showAlert(item.ID, item.Name)}>
                            <Text style={{color: "red", fontSize: 18, margin: 5}}>Remove friend</Text>
                          </MenuOption>
                          <MenuOption onSelect={() => showAlertBlock(item.ID, item.Name)}>
                            <Text style={{color: "red", fontSize: 18, margin: 5}}>Block</Text>
                          </MenuOption>
                        </MenuOptions>
                      </Menu>
                    </Pressable>
                  }
                </View>

                {(selector == 'received') && 
                  <View style={{flexDirection:'row', marginBottom:5, marginTop:5, marginRight:5, justifyContent:'flex-end', alignItems:'center'}}>
                    <Pressable
                      onPress={() => approveRequest(item.ID)}
                      style={({ pressed }) => [
                        {opacity: pressed ? 0.5: 1}, styles.approve
                      ]}
                    >
                      <View style={{flexDirection:'row', alignItems:'center',}}>
                        <Text style={{color:"white", fontSize: 16,}}>approve</Text>
                      </View>
                    </Pressable>

                    <Pressable
                      onPress={() => ignoreRequest(item.ID)}
                      style={({ pressed }) => [
                        {opacity: pressed ? 0.5: 1}, styles.delete
                      ]}
                    >
                      <View style={{flexDirection:'row', alignItems:'center',}}>
                        <Text style={{color:"white", fontSize: 16,}}>ignore</Text>
                      </View>
                    </Pressable>
                  </View>
                }
                {(selector=='sent') && 
                  <Pressable
                    onPress={() => cancelRequest(item.ID)}
                    style={({ pressed }) => [
                      {opacity: pressed ? 0.5: 1}, styles.cancel
                    ]}
                  >
                    <View style={{flexDirection:'row', alignItems:'center',}}>
                      <Text style={{color:"white", fontSize: 16,}}>cancel</Text>
                    </View>
                  </Pressable>
                }
              </View>
            )} />
          </View>
        
      </View>
    )
  }


  return (
    <SafeAreaView style={{flex: 1, backgroundColor:'#613a5f'}}> 
      <View style={{flex:1, backgroundColor:backgroundColor}} >
      <View style={styles.homeHeader}>
        <Text style={{fontSize:19, color:'white', fontFamily:'Solway-Regular', marginLeft:10}}>Friends</Text>
      </View>

        <Modal visible={modalVisible} animationType='fade' transparent={true}
          onRequestClose={clickOut}
        >
          <TouchableWithoutFeedback onPress={clickOut}>
            <View style={styles.outerView}>
              <ScrollView contentContainerStyle={{justifyContent:'center',}}>
              <TouchableWithoutFeedback>
              <View style={styles.innerView}>
                <TextInput placeholder='User ID' value={searchedID} onChangeText={text => setSearchedID(text)} style={styles.inputP}/> 
                
                {/* Middle View */}

                {found && 
                  <View style={{margin:15, marginTop:50, marginBottom:50,}}>
                    <Text style={{color:'#64deb1', fontSize:18, marginBottom:8}}>{caption}</Text>

                    <View style={{flexDirection:'row', alignItems:'center', backgroundColor:'#8d8299', justifyContent:'center', paddingHorizontal:5}}>
                      {url && <Image source={{uri: url}} style={{height:50, width:50, borderRadius:50,}} />}
                      <View style={{flex:1, paddingVertical:10, alignItems:'center', marginRight:10}}>
                        <Text style={{fontSize:18, color:'white'}}>{ emailResult }</Text>
                      </View>
                    </View>

                    <View style={{flexDirection:'row', alignItems:'center', marginTop:10, flex:1, justifyContent:'center'}}>
                      {renderButton()}
                    </View>

                  </View>
                }
                {searchIndicator? (
                  <ActivityIndicator animating={searchIndicator} color='#d4c86e' size={40} style={{alignSelf:'center', marginTop:20}} />
                ) : (
                  <Pressable  
                    onPress={() => searchEmail(searchedID)}
                    style={({ pressed }) => [
                      {opacity: pressed ? 0.5: 1}, styles.changeEmail
                    ]}
                  >
                    <View style={{flexDirection:'row', alignItems:'center',}}>
                      <Text style={{color:"#806b96", fontSize: 16,}}>Search</Text>
                    </View>
                  </Pressable>
                )
                }
              </View>
              </TouchableWithoutFeedback>
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      
      {/* Page Contents */}
      
      {listIndicator? ( <ActivityIndicator size={80} color='#613a5f' animating={listIndicator} style={{flex:1}} /> ) : (
        <View style={{flex:1, padding:10, paddingBottom:20}}>

        {/* Selectors */}

        <View style={{flexDirection:'row', alignItems:'center', marginBottom:20, justifyContent:'space-between', paddingTop:10,}}>
          <View style={{paddingTop:12, flex: (selector=='friends')? 2 : 1, marginRight:10}}>
            <Pressable
              onPress={() => {setSelector('friends'); setTitle('Friends - '); setNum(FriendsNum)}}
              style={({ pressed }) => [
                {opacity: pressed ? 0.5: 1}, styles.friendsOp, {backgroundColor: (selector=='friends')? selectorColor: 'grey'}
              ]}
            >
              <View style={{flexDirection:'row', alignItems:'center',}}>
                {/* <FontAwesome5 name='user-friends' size={27} color='white' /> */}
                <Text style={{color:"white", fontSize: 16,}} adjustsFontSizeToFit numberOfLines={2}>Friends List</Text>
              </View>
            </Pressable>
          </View>

          <View style={{paddingTop:12, flex: (selector=='received')? 2 : 1}}>
            <Pressable
              onPress={() => {setSelector('received'); setTitle('Received Requests - '); setNum(receivedRequestsNum)}}
              style={({ pressed }) => [
                {opacity: pressed ? 0.5: 1}, styles.friendsOp, {backgroundColor: (selector=='received')? selectorColor: 'grey'}
              ]}
            >
              <View style={{flexDirection:'row', alignItems:'center',}}>
                {/* <MaterialCommunityIcons name='email-receive-outline' size={30} color='white' /> */}
                <Text style={{color:"white", fontSize: 16,}} adjustsFontSizeToFit numberOfLines={2}>Received Requests</Text>
              </View>
            </Pressable>
            { (receivedRequestsNum > 0) && <Text style={styles.badge}>{ receivedRequestsNum }</Text> }
          </View>
          
          <View style={{paddingTop:12, flex: (selector=='sent')? 2 : 1, marginLeft:10}}>
            <Pressable
              onPress={() => {setSelector('sent'); setTitle('Sent Requests - '); setNum(sentRequestsNum)}}
              style={({ pressed }) => [
                {opacity: pressed ? 0.5: 1}, styles.friendsOp, {backgroundColor: (selector=='sent')? selectorColor: 'grey'}
              ]}
            >
              <View style={{flexDirection:'row', alignItems:'center',}}>
                {/* <MaterialCommunityIcons name='email-fast-outline' size={30} color='white' /> */}
                <Text style={{color:"white", fontSize: 16,}} adjustsFontSizeToFit numberOfLines={2}>Sent Requests</Text>
              </View>
            </Pressable>
            { (sentRequestsNum > 0) && <Text style={styles.badge}>{ sentRequestsNum }</Text> }
          </View>
        </View>
        
        {/* Lists */}
        
        {(selector == 'friends' && !listIndicator)? ( renderList(Friends, 'Friends - ', FriendsNum) ): null}

        {(selector == 'received' && !listIndicator)? ( renderList(receivedRequests, 'Received Friend Requests - ', receivedRequestsNum) ) : null}

        {(selector == 'sent' && !listIndicator)? ( renderList(sentRequests, 'Sent Friend Requests - ', sentRequestsNum) ) : null}

        <View style={{alignItems:'flex-end', }}>
          <TouchableOpacity onPress={() => {setShowIndicator(false); setModalVisible(true)}} style={[styles.addbtn, {backgroundColor:addButton}]}>
            <MaterialIcons name='person-add' size={33} color={addButtonInside}/>
          </TouchableOpacity>
        </View>
        
      </View>
      )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  homeHeader: {
    flexDirection: 'row', 
    alignItems:'center',
    backgroundColor: '#613a5f',
    padding: 5,
    elevation:15
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
    paddingLeft:2
  },
  changeEmail: {
    padding: 8,
    backgroundColor: '#d4c86e',
    alignItems: 'center',
    borderRadius:20,
    elevation:10,
    marginHorizontal: 15,
    marginTop: 20,
    shadowOffset: {width:0, height:3},
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  btnUnblock: {
    flex:2,
    padding: 8,
    backgroundColor: '#d4c86e',
    alignItems: 'center',
    borderRadius:20,
    elevation:10,
    shadowOffset: {width:0, height:3},
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  btn: {
    flex:2,
    padding: 8,
    backgroundColor: '#1da877',
    alignItems: 'center',
    borderRadius:20,
    elevation:10,
    shadowOffset: {width:0, height:3},
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  btnGrey: {
    flex:2,
    padding: 8,
    backgroundColor: '#c7c7c7',
    alignItems: 'center',
    borderRadius:20,
    elevation:10,
    shadowOffset: {width:0, height:3},
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  btnBlock: {
    flex:1,
    paddingVertical: 8,
    backgroundColor: '#e3325e',
    alignItems: 'center',
    borderRadius:20,
    elevation:10,
    marginLeft:10,
    shadowOffset: {width:0, height:3},
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  approve: {
    padding: 8,
    backgroundColor: '#1da877',
    alignItems: 'center',
    borderRadius:20,
    elevation:10,
    marginLeft:10,
    shadowOffset: {width:0, height:3},
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  delete: {
    padding: 8,
    backgroundColor: '#c7aa52',
    alignItems: 'center',
    borderRadius:20,
    elevation:10,
    marginLeft:10,
    shadowOffset: {width:0, height:3},
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  cancel: {
    padding: 8,
    backgroundColor: '#853259',
    alignItems: 'center',
    borderRadius:20,
    elevation:10,
    marginRight:5,
    marginLeft:'auto',
    marginBottom:5,
    marginTop:5,
    shadowOffset: {width:0, height:3},
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  menu: {
    alignItems: 'center',
    marginRight:10,
    marginLeft:'auto'
  },
  searchIgnore: {
    flex:1,
    padding: 8,
    backgroundColor: '#c7aa52',
    alignItems: 'center',
    borderRadius:20,
    elevation:10,
    marginLeft:10,
    shadowOffset: {width:0, height:3},
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  searchCancel: {
    flex:1,
    backgroundColor: '#853259',
    alignItems: 'center',
    justifyContent:'center',
    borderRadius:20,
    elevation:10,
    marginLeft:10,
    shadowOffset: {width:0, height:3},
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  searchApprove: {
    flex:1,
    padding: 8,
    backgroundColor: '#1da877',
    alignItems: 'center',
    borderRadius:20,
    elevation:10,
    shadowOffset: {width:0, height:3},
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  friendsOp: {
    padding: 8,
    backgroundColor: 'grey',
    alignItems: 'center',
    borderRadius:15,
  },
  item: {
    flex:1, 
    marginBottom:10, 
    padding: 4,
    elevation:8
  },
  addbtn: { 
    backgroundColor:'white',
    paddingHorizontal:20,
    paddingVertical:5,
    borderRadius:17,
    alignItems:'center',
    justifyContent:'center',
    flexDirection:'row',
    shadowOffset: {width:0, height:3},
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation:8
  },
  badge:{
    backgroundColor:'#f55fd2', 
    position:'absolute',
    paddingVertical: 2,
    paddingHorizontal: 5,
    borderRadius:8,
    elevation:20,
    overflow:'hidden',
    alignSelf:'flex-end'
  },
  indicator: {
    alignItems:'center'
  }
})