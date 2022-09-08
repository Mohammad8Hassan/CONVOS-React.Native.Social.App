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
  const [Data, setData] = useState(null);
  const [selector, setSelector] = useState('');
  const [title, setTitle] = useState('');
  const [num, setNum] = useState(0);

  useEffect(() => {
    // Sent Requests
    const colRef = collection(db, 'Users', user.uid, 'Sent Requests');
    const q = query(colRef, orderBy('timestamp'));
    onSnapshot(q, async snapShot => {
      let result = [];
      let num = 0;

      for (const doc of snapShot.docs) {
        const empty = doc.data().timestamp === null ? Timestamp.now() : doc.data().timestamp;
        // const refc = ref(storage, 'Profile Photos/' + doc.data().receiverID);
        // const url_Temp = await getDownloadURL(refc);
        // url_Temp == null ? defaultImg : url_Temp;

        result.push({id: doc.id, ...doc.data(), dateSent: empty.toDate()});
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
      let num = 0;

      for (const doc of snapShot.docs) {
        if(doc.data().ignored == false) {
          // var url_temp = null;
          const empty = doc.data().timestamp === null ? Timestamp.now() : doc.data().timestamp;
          // const refc = ref(storage, 'Profile Photos/' + doc.data().senderID);
          // const url_Temp = await getDownloadURL(refc);
          // getDownloadURL(refc)
          //   .then(res => {
          //     url_temp = res;
          //   })
          //   .catch(() => {
          //     console.log(defaultImg);
          //     url_temp = defaultImg;
          //   })
          // url_Temp == null ? defaultImg : url_Temp;
          
          result.push({id: doc.id, ...doc.data(), dateReceived: empty.toDate()});
          num++;
        }
      }
      
      console.log('result', result);
      setReceivedRequests(result);
      setReceivedRequestsNum(num);
      console.log('receivedRequests', receivedRequests);
    })

    // Friends List
    const colRef3 = collection(db, 'Users', user.uid, 'Friends');
    const q3 = query(colRef3, orderBy('Name'));
    onSnapshot(q3, async snapShot => {
      let result = [];
      let num = 0;

      for (const doc of snapShot.docs) {
        const empty = doc.data().since === null ? Timestamp.now() : doc.data().since;
        // const refc = ref(storage, 'Profile Photos/' + doc.data().receiverID);
        // const url_Temp = await getDownloadURL(refc);
        // url_Temp == null ? defaultImg : url_Temp;

        result.push({...doc.data(), since: empty.toDate()});
        num++;
      }
      
      console.log('friends result', result);
      setSelector('friends');
      setFriends(result);
      setFriendsNum(num);
      setTitle('Friends - ')
      setData(result);
    })
  }, [])

  useEffect(() => {
    setNum(FriendsNum)
  }, [FriendsNum])

  const searchEmail = () => {
    Keyboard.dismiss();

    const colRef = collection(db, 'Users');
    const q = query(colRef, where('email', '==', email));

    getDocs(q)
      .then(res => {
        let id = res.docs[0].data().ID;
        setSearchedID(id);
        let userName = res.docs[0].data().firstName + " " + res.docs[0].data().lasttName;
        setEmailResult(res.docs[0].data().firstName + " " + res.docs[0].data().lasttName);
        setUrl(res.docs[0].data().photoURL);
  
        getDoc(doc(db, 'Users', user.uid, 'Friends', id))
          .then(doc => {
      
            if(doc.exists()) {
              setCaption('You are already friends with ' + userName);
              setConnection('friend');
        
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
        setEmailResult('no users found!');
        setFound(true);
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
    setCaption('');
    setConnection('');
    setUrl('');
  }

  const sendRequest = () => {
    const colRef = collection(db, 'Users');
    const q = query(colRef, where('email', '==', email));
    getDocs(q)
      .then(res => {
        setDoc(doc(db, 'Users', res.docs[0].data().ID, 'Received Requests', user.uid), {
          ID: user.uid,
          Name: user.displayName,
          Email: user.email,
          Photo: user.photoURL,
          ignored: false,
          timestamp: serverTimestamp()
        });

        setDoc(doc(db, 'Users', user.uid, 'Sent Requests', res.docs[0].data().ID), {
          ID: res.docs[0].data().ID,
          Name: res.docs[0].data().firstName + ' ' + res.docs[0].data().lasttName,
          Email: res.docs[0].data().email,
          Photo: res.docs[0].data().photoURL,
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
          Name: res.data().firstName + ' ' + res.data().lasttName,
          ID: res.data().ID,
          Email: res.data().email,
          Photo: res.data().photoURL,
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
          onRequestClose={clickOut}
        >
          <TouchableWithoutFeedback onPress={clickOut}>
            <View style={styles.outerView}>
              <TouchableWithoutFeedback>
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

                      { (connection != '') &&
                        <Pressable  
                        
                          style={({ pressed }) => [
                            {opacity: pressed ? 0.5: 1}, styles.btnBlock
                          ]}
                        >
                          <View style={{flexDirection:'row', alignItems:'center',}}>
                            <Text style={{color:"white", fontSize: 16,}}>Block</Text>
                          </View>
                        </Pressable>
                      }
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
              </TouchableWithoutFeedback>

            </View>
          </TouchableWithoutFeedback>
        </Modal>
      
      {/* Page Contents */}

      <View style={{flex:1, padding:10, paddingBottom:20}}>

        {/* selectors */}

        <View style={{flexDirection:'row', alignItems:'center', marginVertical:20, justifyContent:'space-between',paddingTop:10}}>
          <View style={{alignItems:'flex-end', paddingTop:12, paddingRight:10}}>
            <Pressable
              onPress={() => {setData(Friends); setSelector('friends'); setTitle('Friends - '); setNum(FriendsNum)}}
              style={({ pressed }) => [
                {opacity: pressed ? 0.5: 1}, styles.friendsOp, {backgroundColor: (selector=='friends')? '#1f1f1f': 'grey'}
              ]}
            >
              <View style={{flexDirection:'row', alignItems:'center',}}>
                <Text style={{color:"white", fontSize: 16,}}>Friends</Text>
              </View>
            </Pressable>
          </View>

          <View style={{alignItems:'flex-end', paddingTop:12, paddingRight:3}}>
            <Pressable
              onPress={() => {setData(receivedRequests); setSelector('received'); setTitle('Received Requests - '); setNum(receivedRequestsNum)}}
              style={({ pressed }) => [
                {opacity: pressed ? 0.5: 1}, styles.friendsOp, {backgroundColor: (selector=='received')? '#1f1f1f': 'grey'}
              ]}
            >
              <View style={{flexDirection:'row', alignItems:'center',}}>
                <Text style={{color:"white", fontSize: 16,}}>Received Requests</Text>
              </View>
            </Pressable>
            { (receivedRequestsNum > 0) && <Text style={styles.badge}>{ receivedRequestsNum }</Text> }
          </View>
          
          <View style={{alignItems:'flex-end', paddingTop:12, paddingRight:3}}>
            <Pressable
              onPress={() => {setData(sentRequests); setSelector('sent'); setTitle('Sent Requests - '); setNum(sentRequestsNum)}}
              style={({ pressed }) => [
                {opacity: pressed ? 0.5: 1}, styles.friendsOp, {backgroundColor: (selector=='sent')? '#1f1f1f': 'grey'}
              ]}
            >
              <View style={{flexDirection:'row', alignItems:'center',}}>
                <Text style={{color:"white", fontSize: 16,}}>Sent Requests</Text>
              </View>
            </Pressable>
            { (sentRequestsNum > 0) && <Text style={styles.badge}>{ sentRequestsNum }</Text> }
          </View>
        </View>
        
        {/* Titles */}

        <View style={{flex:1, marginBottom:20}}>
          <View style={{flexDirection: 'row'}}>
            <Text style={{color:"white", fontSize:25}}>{ title }</Text>
            <Text style={{color:'white', fontSize:25, marginLeft:5}}>{ num }</Text>
          </View>

          {/* Main List */}

          {Friends && 
            <View style={{flex:1, marginTop:5, padding:4}}>
              <FlatList data={Data} renderItem={({ item }) => (
                <View style={[styles.item, {backgroundColor: (selector=='friends'? 'none': '#8d8299')}]}>

                  <View style={{flexDirection:'row', alignItems:'center', backgroundColor:'#8d8299', padding:4, borderRadius:20}}>
                    <Image source={{uri: item.Photo}} style={{height:40, width:40, borderRadius:50}} />
                    <Text style={{color:'white', fontSize:18, marginLeft:10}}>{ item.Name }</Text>
                    
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
                            <MenuOption onSelect={() => showAlert(item.ID, item.Name)}>
                              <Text style={{color: "red", fontSize: 18, margin: 5}}>Remove friend</Text>
                            </MenuOption>
                          </MenuOptions>
                        </Menu>
                      </Pressable>
                    }
                  </View>

                  {(selector == 'received') && 
                    <View style={{flexDirection:'row', marginBottom:5, marginTop:3, marginRight:5, justifyContent:'flex-end', alignItems:'center'}}>
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
          }
        </View>

        <View style={{alignItems:'stretch'}}>
          <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addbtn}>
            <Text style={{fontSize:16, marginRight:8}}>add friend</Text>
            <MaterialIcons name='person-add' size={30} color="#574866"/>
          </TouchableOpacity>
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
    marginRight:5,
    marginLeft:'auto',
    marginBottom:5
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
  },
  friendsOp: {
    padding: 8,
    backgroundColor: 'grey',
    alignItems: 'center',
    borderRadius:20,
  },
  item: {
    flex:1, 
    marginBottom:10, 
    padding: 4
  },
  addbtn: {
    marginLeft:200, 
    backgroundColor:'white',
    padding:5,
    borderRadius:20,
    alignItems:'center',
    justifyContent:'center',
    flexDirection:'row',
    elevation:8
  },
  badge:{
    backgroundColor:'#f55fd2', 
    position:'absolute',
    paddingVertical: 2,
    paddingHorizontal: 5,
    borderRadius:100
  }
})