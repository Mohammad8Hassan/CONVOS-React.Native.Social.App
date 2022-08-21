import { StyleSheet, Text, View, Image, ScrollView, TouchableOpacity, Modal, TextInput,
   Pressable, TouchableWithoutFeedback, ToastAndroid, Keyboard, FlatList, Alert } from 'react-native';
import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { getFirestore, addDoc, collection, serverTimestamp, onSnapshot, query, orderBy, doc, 
  deleteDoc, Timestamp, setDoc, getDocs, where, getDoc, updateDoc } from 'firebase/firestore'
import { getAuth } from 'firebase/auth';
import avatar from '../assets/Imgs/avatar.png';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Menu, MenuOptions, MenuOption, MenuTrigger, } from 'react-native-popup-menu';

export default function Friends() {

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


  useEffect(() => {
    // Sent Requests
    const colRef = collection(db, 'Users', user.uid, 'Sent Requests');
    const q = query(colRef, orderBy('timestamp'));
    onSnapshot(q, async snapShot => {
      let result = [];
      let num = 0;

      for (const doc of snapShot.docs) {
        const empty = doc.data().timestamp === null ? Timestamp.now() : doc.data().timestamp;
        const refc = ref(storage, 'Profile Photos/' + doc.data().receiverID);
        const url_Temp = await getDownloadURL(refc);
        url_Temp == null ? defaultImg : url_Temp;

        result.push({id: doc.id, ...doc.data(), dateSent: empty.toDate(), uri: url_Temp});
        num++;
      }

      setSentRequestsNum(num);
      console.log('result', result);
      setSentRequests(result);
      console.log('sentRequests', sentRequests);
    })
    
    // Received Requests
    const colRef2 = collection(db, 'Users', user.uid, 'Received Requests');
    const q2 = query(colRef2, orderBy('timestamp'));
    onSnapshot(q2, async snapShot => {
      let result = [];

      for (const doc of snapShot.docs) {
        if(doc.data().ignored == false) {
          const empty = doc.data().timestamp === null ? Timestamp.now() : doc.data().timestamp;
          const refc = ref(storage, 'Profile Photos/' + doc.data().senderID);
          const url_Temp = await getDownloadURL(refc);
          url_Temp == null ? defaultImg : url_Temp;

          result.push({id: doc.id, ...doc.data(), dateReceived: empty.toDate(), uri: url_Temp});
        }
      }
      
      console.log('result', result);
      setReceivedRequests(result);
      console.log('receivedRequests', receivedRequests);
    })

    // Friends List
    const colRef3 = collection(db, 'Users', user.uid, 'Friends');
    const q3 = query(colRef3, orderBy('friendName'));
    onSnapshot(q3, async snapShot => {
      let result = [];

      for (const doc of snapShot.docs) {
        const empty = doc.data().since === null ? Timestamp.now() : doc.data().since;
        // const refc = ref(storage, 'Profile Photos/' + doc.data().receiverID);
        // const url_Temp = await getDownloadURL(refc);
        // url_Temp == null ? defaultImg : url_Temp;

        result.push({...doc.data(), since: empty.toDate()});
      }
      
      console.log('result', result);
      setFriends(result);
    })
  }, [])



  const searchEmail = () => {
    Keyboard.dismiss();
    console.log('1111');
    const colRef = collection(db, 'Users');
    console.log('2');
    const q = query(colRef, where('email', '==', email));
    console.log('3');
    getDocs(q)
      .then(res => {
        console.log('4');
        let id = res.docs[0].data().ID;
        setSearchedID(id);
        let userName = res.docs[0].data().firstName + " " + res.docs[0].data().lasttName;
        console.log(id);
        setEmailResult(res.docs[0].data().firstName + " " + res.docs[0].data().lasttName);
        console.log('5');
        setUrl(res.docs[0].data().photoURL);
        console.log('6');
        getDoc(doc(db, 'Users', user.uid, 'Friends', id))
          .then(doc => {
            console.log('7');
            if(doc.exists()) {
              setCaption('You are already friends with ' + userName);
              setConnection('friend');
              console.log('8');
              setFound(true);
            }
            else throw 'friend throw'
          })
          .catch(err => {
            console.log('friends catch', err);
            getDoc(doc(db, 'Users', user.uid, 'Sent Requests', id))
              .then(doc => {
                if(doc.exists()) {
                  setCaption('You have already sent a friend request to ' + userName);
                  setConnection('sent');
                  setFound(true);
                }
                else throw 'sent throw'
              })
              .catch(err => {
                console.log('sent catch', err);
                getDoc(doc(db, 'Users', user.uid, 'Received Requests', id))
                  .then(doc => {
                    if(doc.exists()) {
                      setCaption(userName + ' sent you a friend request!');
                      setConnection('received');
                      setFound(true);
                    }
                    else throw 'received throw'
                  })
                  .catch(err => {
                    console.log('received catch', err);
                    setConnection('new');
                    setFound(true);
                  })
              })
          })


      })
      .catch(err => {
        console.log('search catch', err);
        setEmailResult('no users found!')
      })

    
  }

  function renderButton() {
    console.log(connection);
    if (connection == 'friend') {
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
        <Pressable
          style={styles.btnGrey}
        >
          <View style={{flexDirection:'row', alignItems:'center'}}>
            <Text style={{color:"white", fontSize: 16,}}>waiting for approval..</Text>
          </View>
        </Pressable>
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
        </View>
      )
    }
    else if (connection == 'new') {
      return(
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
      )
    }
  }


  const clickOut = () => {
    setModalVisible(false);
    setEmailResult('');
    setFound(false);
    setEmail('');
  }

  const sendRequest = () => {
    const colRef = collection(db, 'Users');
    const q = query(colRef, where('email', '==', email));
    getDocs(q)
      .then(res => {
        setDoc(doc(db, 'Users', res.docs[0].data().ID, 'Received Requests', user.uid), {
          senderID: user.uid,
          senderName: user.displayName,
          senderEmail: user.email,
          senderPhoto: user.photoURL,
          ignored: false,
          timestamp: serverTimestamp()
        });

        setDoc(doc(db, 'Users', user.uid, 'Sent Requests', res.docs[0].data().ID), {
          receiverID: res.docs[0].data().ID,
          receiverName: res.docs[0].data().firstName + ' ' + res.docs[0].data().lasttName,
          receiverEmail: res.docs[0].data().email,
          receiverPhoto: res.docs[0].data().photoURL,
          timestamp: serverTimestamp()
        })

        setModalVisible(false);
        ToastAndroid.show('Request Sent.', ToastAndroid.SHORT);
      })
      .catch(err => {
        console.log(err);
      })
  }

  const cancelRequest = (id) => {
    deleteDoc(doc(db, 'Users', id, 'Received Requests', user.uid))

    deleteDoc(doc(db, 'Users', user.uid, 'Sent Requests', id))
  }

  const deleteRequest = (id) => {
    deleteDoc(doc(db, 'Users', id, 'Received Requests', user.uid))

    deleteDoc(doc(db, 'Users', user.uid, 'Sent Requests', id))
  }

  const ignoreRequest = (id) => {
    updateDoc(doc(db, 'Users', user.uid, 'Received Requests', id), {
      ignored: true,
    })
  }

  const approveRequest = (id) => {
    getDoc(doc(db, 'Users', id))
      .then(res => {
        deleteDoc(doc(db, 'Users', id, 'Sent Requests', user.uid))

        deleteDoc(doc(db, 'Users', user.uid, 'Received Requests', id))

        setDoc(doc(db, 'Users', user.uid, 'Friends', id), {
          friendName: res.data().firstName + ' ' + res.data().lasttName,
          friendID: res.data().ID,
          friendEmail: res.data().email,
          friendPhoto: res.data().photoURL,
          since: serverTimestamp()
        });

        setDoc(doc(db, 'Users', id, 'Friends', user.uid), {
          friendName: user.displayName,
          friendID: user.uid,
          friendEmail: user.email,
          friendPhoto: user.photoURL,
          since: serverTimestamp()
        });
      })
      .catch(err => {
        console.log(err);
      })

    setModalVisible(false);
    ToastAndroid.show('Added Sucessfully', ToastAndroid.SHORT);
  }

  const removeFriend = (id) => {
    console.log(id);

    deleteDoc(doc(db, 'Users', id, 'Friends', user.uid));

    deleteDoc(doc(db, 'Users', user.uid, 'Friends', id));
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

  return (
    <SafeAreaView style={{flex: 1, backgroundColor:'#806b96'}}>
      <View style={styles.homeHeader}>
        <Text style={{fontSize:18, color:'white'}}>Friends</Text>
      </View>

        <Modal visible={modalVisible} animationType='fade' transparent={true}
          onRequestClose={() => {setModalVisible(false)}}
        >
          <TouchableWithoutFeedback onPress={clickOut}>
            <View style={styles.outerView}>

              <View style={styles.innerView}>
                <TextInput placeholder='Email' value={email} onChangeText={text => setEmail(text)} style={styles.inputP}/> 
                
                {/* Middle View */}

                {found && 
                  <View style={{margin:15, marginTop:50, marginBottom:50,}}>
                    <Text style={{color:'#64deb1', fontSize:18, marginBottom:8}}>{caption}</Text>

                    <View style={{flexDirection:'row', alignItems:'center', backgroundColor:'#8d8299',}}>
                      <Image source={{uri: url}} style={{height:50, width:50, borderRadius:50, marginLeft:30}} />
                      <Text style={{fontSize:18, color:'white', marginLeft:30}}>{ emailResult }</Text>
                    </View>

                    <View style={{flexDirection:'row', alignItems:'center', marginTop:10}}>
                      {renderButton()}

                      <Pressable  
                        
                        style={({ pressed }) => [
                          {opacity: pressed ? 0.5: 1}, styles.btnBlock
                        ]}
                      >
                        <View style={{flexDirection:'row', alignItems:'center',}}>
                          <Text style={{color:"white", fontSize: 16,}}>Block</Text>
                        </View>
                      </Pressable>
                  
                    </View>

                  </View>
                }
                <Pressable  
                  onPress={searchEmail}
                  style={({ pressed }) => [
                    {opacity: pressed ? 0.5: 1}, styles.changeEmail
                  ]}
                >
                  <View style={{flexDirection:'row', alignItems:'center',}}>
                    <Text style={{color:"#806b96", fontSize: 16,}}>Search</Text>
                  </View>
                </Pressable>
              </View>
              

            </View>
          </TouchableWithoutFeedback>
        </Modal>
      
      {/* Page Contents */}

      <View style={{flex:1, padding:20}}>

        <View style={{alignItems:'flex-end', margin:20}}>
          <TouchableOpacity onPress={() => setModalVisible(true)}>
            <MaterialIcons name='person-add' size={30} color="white"/>
          </TouchableOpacity>
        </View>
        
        {/* Received Requests */}

        <View style={{flex:1, marginBottom:20}}>
          <Text style={{color:"white", fontSize:25}}>Received Requests</Text>
          
          {receivedRequests && 
            <View style={{flex:1, padding:4}}>
              <FlatList data={receivedRequests} renderItem={({ item }) => (
                <View style={{flex:1, backgroundColor:'#8d8299', borderRadius:10}}>

                  <View style={{flexDirection:'row', alignItems:'center', backgroundColor:'#8d8299', padding:4, borderRadius:20}}>
                    <Image source={{uri: item.uri}} style={{height:40, width:40, borderRadius:50}} />
                    <Text style={{color:'white', fontSize:18, marginLeft:10}}>{ item.senderName }</Text>
                  </View>
                  <View style={{flexDirection:'row', padding:10, justifyContent:'flex-end'}}>
                      <Pressable
                        onPress={() => approveRequest(item.senderID)}
                        style={({ pressed }) => [
                          {opacity: pressed ? 0.5: 1}, styles.approve
                        ]}
                      >
                        <View style={{flexDirection:'row', alignItems:'center',}}>
                          <Text style={{color:"white", fontSize: 16,}}>approve</Text>
                        </View>
                      </Pressable>

                      <Pressable
                        onPress={() => ignoreRequest(item.senderID)}
                        style={({ pressed }) => [
                          {opacity: pressed ? 0.5: 1}, styles.delete
                        ]}
                      >
                        <View style={{flexDirection:'row', alignItems:'center',}}>
                          <Text style={{color:"white", fontSize: 16,}}>ignore</Text>
                        </View>
                      </Pressable>
                    </View>
                </View>
              )} />
            </View>
          }
        </View>


        {/* Friends List */}

        <View style={{flex:1, marginBottom:20}}>
          <Text style={{color:"white", fontSize:25}}>Friends</Text>
          
          {sentRequests && 
            <View style={{flex:1, marginTop:5, padding:4}}>
              <FlatList data={Friends} renderItem={({ item }) => (
                <View style={{flex:1}}>

                  <View style={{flexDirection:'row', alignItems:'center', backgroundColor:'#8d8299', padding:4, borderRadius:20}}>
                    <Image source={{uri: item.friendPhoto}} style={{height:40, width:40, borderRadius:50}} />
                    <Text style={{color:'white', fontSize:18, marginLeft:10}}>{ item.friendName }</Text>

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
                          <MenuOption onSelect={() => showAlert(item.friendID, item.friendName)}>
                            <Text style={{color: "red", fontSize: 18, margin: 5}}>Remove friend</Text>
                          </MenuOption>
                        </MenuOptions>
                      </Menu>
                    </Pressable>
                  </View>

                </View>
              )} />
            </View>
          }
        </View>


        {/* Sent Requests */}

        <View style={{flex:1, marginBottom:20}}>
          <Text style={{color:"white", fontSize:25}}>Sent Requests</Text>
          
          {sentRequests && 
            <View style={{flex:1, marginTop:5, padding:4}}>
              <FlatList data={sentRequests} renderItem={({ item }) => (
                <View style={{flex:1}}>

                  <View style={{flexDirection:'row', alignItems:'center', backgroundColor:'#8d8299', padding:4, borderRadius:20}}>
                    <Image source={{uri: item.uri}} style={{height:40, width:40, borderRadius:50}} />
                    <Text style={{color:'white', fontSize:18, marginLeft:10}}>{ item.receiverName }</Text>

                    <Pressable
                      onPress={() => cancelRequest(item.receiverID)}
                      style={({ pressed }) => [
                        {opacity: pressed ? 0.5: 1}, styles.cancel
                      ]}
                    >
                      <View style={{flexDirection:'row', alignItems:'center',}}>
                        <Text style={{color:"white", fontSize: 16,}}>cancel</Text>
                      </View>
                    </Pressable>
                  </View>

                </View>
              )} />
            </View>
          }
        </View>



      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  homeHeader: {
    flexDirection: 'row', 
    justifyContent:'center', 
    alignItems:'center',
    backgroundColor: '#524d57',
    padding: 10
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
    marginTop: 20
  },
  btn: {
    flex:2,
    padding: 8,
    backgroundColor: 'green',
    alignItems: 'center',
    borderRadius:20,
    elevation:10,
  },
  btnGrey: {
    flex:2,
    padding: 8,
    backgroundColor: '#c7c7c7',
    alignItems: 'center',
    borderRadius:20,
    elevation:10,
  },
  btnBlock: {
    flex:1,
    paddingVertical: 8,
    backgroundColor: 'red',
    alignItems: 'center',
    borderRadius:20,
    elevation:10,
    marginLeft:10
  },
  approve: {
    padding: 8,
    backgroundColor: 'green',
    alignItems: 'center',
    borderRadius:20,
    elevation:10,
    marginLeft:10,
  },
  delete: {
    padding: 8,
    backgroundColor: '#c7aa52',
    alignItems: 'center',
    borderRadius:20,
    elevation:10,
    marginLeft:10
  },
  cancel: {
    padding: 8,
    backgroundColor: 'red',
    alignItems: 'center',
    borderRadius:20,
    elevation:10,
    marginLeft:'auto'
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
  },
  searchApprove: {
    flex:1,
    padding: 8,
    backgroundColor: 'green',
    alignItems: 'center',
    borderRadius:20,
    elevation:10,
  }
})