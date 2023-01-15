import { StyleSheet, Text, View, Image, ScrollView, TouchableOpacity, Modal, TextInput,
  Pressable, TouchableWithoutFeedback, ToastAndroid, Keyboard, FlatList, 
   Alert, RefreshControl, Switch, ActivityIndicator, SafeAreaView, Platform } from 'react-native';
import { useEffect, useState, useCallback, useRef } from 'react'
// import { SafeAreaView } from 'react-native-safe-area-context';
import Form from '../shared/Form';
import { getAuth } from 'firebase/auth';
import { Ionicons } from '@expo/vector-icons'
import { addDoc, serverTimestamp, setDoc, getFirestore, getDocs, 
  collection, doc, getDoc, query, where, orderBy, Timestamp } from 'firebase/firestore';
import * as yup from 'yup';
import { Formik } from 'formik';
import * as FileSystem from "expo-file-system";

const reviewSchema = yup.object({
  title: yup.string()
    .required()
    .max(30)
    .min(1),
  body: yup.string()
    .required()
    .max(300)
    .min(1),
});

const wait = (timeout) => {
  return new Promise(resolve => setTimeout(resolve, timeout));
}

// component
export default function NewConv({ navigation }) {
  const db = getFirestore();
  const user = getAuth().currentUser;

  const [refreshing, setRefreshing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selector, setSelector] = useState('friends')
  const [title, setTitle] = useState('Invite Friends');
  const [num, setNum] = useState(0);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [selectedFriendsNum, setSelectedFriendsNum] = useState(0);
  const [selectedOthers, setSelectedOthers] = useState([]);
  const [selectedOthersNum, setSelectedOthersNum] = useState(0);
  const [Friends, setFriends] = useState([]);
  const [Others, setOthers] = useState([]);
  const [Data, setData] = useState(null);
  const [displaySelected, setDisplaySelected] = useState([]);
  const [displayNames, setDisplayNames] = useState([]);
  const [email, setEmail] = useState('');
  const [searchID, setSearchID] = useState('');
  const [searchStatus, setSearchStatus] = useState(null);
  const [hasPassword, setHasPassword] = useState(false);
  const [activeIndicator, setActiveIndicator] = useState(false);
  const [addIndicator, setAddIndicator] = useState(false);

  const searchName = useRef('');

  useEffect(() => {
    let friends = [];
    const friendsCollection = collection(db, 'Users', user.uid, 'Friends');

    getDocs(friendsCollection)
      .then(res => {
        res.forEach(async dok => {
          const info = await getDoc(doc(db, 'Users', dok.id));
          const Photo = await prepareImg(info.data().Photo, info.data().photoExtension);

          friends.push({...dok.data(), name: info.data().Name, photo: Photo})
        })
      })
      .catch(err => console.log(err))

    setFriends(friends);
    console.log("RAN AGAIN!!")

    return () => {
      
    }
  }, [])

  useEffect(() => {
    selectFriends();
  }, [Friends])
  
  useEffect(() => {
    setNum(selectedFriendsNum);
  }, [selectedFriendsNum])

  useEffect(() => {
    setNum(selectedOthersNum);
  }, [selectedOthersNum])

  useEffect(() => {
    setData(selectedOthers);
  }, [selectedOthers])

  const toggleSwitch = () => {
    setHasPassword(prev => !prev);
  }

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    wait(800).then(() => setRefreshing(false));
    
  }, []);

  const addConversation = (values) => {
    addDoc(collection(db, 'Conversations'), {
      title: values.title,
      body: values.body,
      password: values.password,
      hasPassword: hasPassword,
      author: user.displayName,
      authorID: user.uid,
      authorEmail: user.email,
      dateCreated: Timestamp.now(),
    })
    .then(ref => {
      setDoc(doc(db, 'Users', user.uid, 'My Conversations', ref.id), {
        authorID: user.uid,
        title: values.title,
        body: values.body,
        dateCreated: Timestamp.now(),
        lastAccessed: Timestamp.now(),
      });

      selectedFriends.forEach(person => {
        const convRef = doc(db, 'Users', person.ID, 'Friends Invites', ref.id);
        setDoc(convRef, {
          title: values.title,
          body: values.body,
          author: user.displayName,
          authorID: user.uid,
          timeStamp: Timestamp.now(),
        })
      })
  
      selectedOthers.forEach(person => {
        const convRef = doc(db, 'Users', person.ID, 'Other Invites', ref.id);
        setDoc(convRef, {
          title: values.title,
          body: values.body,
          author: user.displayName,
          authorID: user.uid,
          timeStamp: Timestamp.now(),
        })
      })

      setDoc(doc(db, 'Conversations', ref.id, 'Participants', user.uid), {
        Name: user.displayName,
        ID: user.uid,
        Admin: true,
        removed: false
      });

      addDoc(collection(db, 'Conversations', ref.id, 'Comments'), {
        comment: 'joined',
        author: user.displayName,
        authorID: user.uid,
        timeStamp: Timestamp.now(),
        system: true,
      })

      if(Platform.OS === 'android')
        ToastAndroid.show('Conversation Created', ToastAndroid.SHORT);
      navigation.popToTop();
    })

  };

  const selectFriends = () => {
    setData(Friends);
    setSelector('friends'); 
    setTitle('Invite Friends - '); 
    setNum(selectedFriendsNum);
  }

  const selectOthers = () => {
    setData(selectedOthers); 
    setSelector('others'); 
    setTitle('Invite others - '); 
    setNum(selectedOthersNum);
    setSearchStatus(null);
  }

  const addFriend = (id) => {

    const ID = id;
    const index = Friends.map(e => e.ID).indexOf(id);

    setSelectedFriends((prev) => {
      prev.push(Friends[index]);
      return [...prev];
    });

    setDisplaySelected(prev => {
      prev.push(Friends[index]);
      return [...prev];
    });

    setSelectedFriendsNum(prev => {
      const i = prev+1;
      return i;
    });

    console.log('friends added ', selectedFriendsNum);
  }

  const removePerson = (id) => {
    const ID = id;

    if(selector=='friends'){
      removeFriend(ID);
    }
    else{
      removeOther(ID);
    }
  }

  const removeFriend = (id) => {
    const index = selectedFriends.map(e => e.ID).indexOf(id);
    const index2 = displaySelected.map(e => e.ID).indexOf(id);

    setSelectedFriends(prev => {
      prev.splice(index, 1);
      return [...prev];
    });

    setDisplaySelected(prev => {
      prev.splice(index2, 1);
      return [...prev];
    })

    setSelectedFriendsNum(prev => {
      return prev -= 1;
    });

    console.log('friends removed ', selectedFriendsNum);
  }
  
  const addOther = async (searchID) => {
    setAddIndicator(true);
    setSearchStatus('');
    Keyboard.dismiss();
    searchName.current = null;
    
    searchID = searchID.replace(/\s/g,'');

    if(searchID.trim().length === 0) {
      setSearchStatus('No users found!');
      setAddIndicator(false);
      return;
    }

    if(searchID == user.uid) {
      console.log('adding myself!');
      setSearchStatus("You are already participating as the admin.");
      setAddIndicator(false);
      return;
    }
    const friendCheck = Friends.find(e => e.ID === searchID);
    if(friendCheck) {
      console.log('on ur friends list!');
      searchName.current = friendCheck.Name;
      setSearchStatus(' is on your friends list, you can add them from the friends tab.');
      setAddIndicator(false);
      return;
    }

    const checkBlocked = await getDoc(doc(db, "Users", searchID, 'Blocked', user.uid));
    if(checkBlocked.exists()) {
      setSearchStatus('No users found!');
      setAddIndicator(false);
      return;
    }

    const obj = selectedOthers.find(e => e.ID === searchID);
    console.log(obj);

    if(obj){
      console.log('already exists');
      setSearchStatus(' is already added!');
      searchName.current = obj.Name;
      setAddIndicator(false);
    }
    else {
      const colRef = collection(db, 'Users');
      const q = query(colRef, where('ID', '==', searchID));
      getDocs(q)
        .then(res => {
          if(res.docs[0].exists()){
            setSelectedOthers(prev => {
              prev.push({...res.docs[0].data(), name:res.docs[0].data().Name, photo:res.docs[0].data().Photo});
              return [...prev];
            })
            setSelectedOthersNum(prev => {return prev += 1;})

            setDisplaySelected(prev => {
              prev.push({...res.docs[0].data(), name:res.docs[0].data().Name, photo:res.docs[0].data().Photo});
              return [...prev];
            });
            setAddIndicator(false);
          }
          else throw 'No users found'
        })
        .catch(err => {
          console.log(err);
          setSearchStatus('No users found!');
          setAddIndicator(false);
        })
    }
    
  }

  const removeOther = (id) => {
    const index2 = selectedOthers.map(e => e.ID).indexOf(id);

    setSelectedOthers(prev => {
      prev.splice(index2, 1);
      return [...prev];
    })

    setSelectedOthersNum(prev => {
      return prev -= 1;
    });

    const index3 = displaySelected.map(e => e.ID).indexOf(id);
    setDisplaySelected(prev => {
      prev.splice(index3, 1);
      return [...prev];
    })

    setSearchStatus(null);

    console.log('other removed ', selectedOthersNum);
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

  return (
    <SafeAreaView style={{flex: 1, backgroundColor:'#613a5f'}}>
      <View style={{flex:1, backgroundColor:'#806b96'}} >
      <View style={styles.homeHeader}>
        <Pressable 
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [
            {opacity: pressed ? 0.5: 1},
          ]}
          >
          <Ionicons name='chevron-back-circle' size={27} color="white" />
        </Pressable>
        <Text style={{flex:1, fontSize:19, color:'white', fontFamily:'Solway-Regular', marginLeft:10}}>New Conversation</Text>
      </View>

      {/* Modal */}
      <Modal visible={modalOpen} animationType='slide' onRequestClose={() => setModalOpen(false)}>
        <SafeAreaView style={{flex:1, backgroundColor:'#613a5f'}}>
          <View style={{flex:1, backgroundColor:'#806b96'}}>
          <View style={styles.homeHeader}>
            <Pressable 
              onPress={() => setModalOpen(false)}
              style={({ pressed }) => [
                {opacity: pressed ? 0.5: 1},
              ]}
              >
              <Ionicons name='chevron-back-circle' size={27} color="white" />
            </Pressable>
            <Text style={{fontSize:18, color:'white', fontFamily:'Solway-Regular', marginLeft:10}}>Invite Participants</Text>
          </View>

          {/* Selectors  */}
          <View style={{flexDirection:'row', justifyContent:'space-around', marginVertical:15, marginHorizontal:20, paddingVertical:5}}>
            <Pressable
              onPress={selectFriends}
              style={({ pressed }) => [
                {opacity: pressed ? 0.5: 1}, styles.friendsOp, {backgroundColor: (selector=='friends')? '#3d243c': 'grey', marginRight:10}
              ]}
            >
              <View style={{flexDirection:'row', alignItems:'center',}}>
                <Text style={{color:"white", fontSize: 19,}}>Friends</Text>
              </View>
            </Pressable>
            <Pressable
              onPress={selectOthers}
              style={({ pressed }) => [
                {opacity: pressed ? 0.5: 1}, styles.friendsOp, {backgroundColor: (selector=='others')? '#3d243c': 'grey'}
              ]}
            >
              <View style={{flexDirection:'row', alignItems:'center',}}>
                <Text style={{color:"white", fontSize: 19,}}>Others</Text>
              </View>
            </Pressable>
          </View>
          
          {/* titles  */}
          <View style={{flexDirection:'row', justifyContent:'space-between'}}>
            <Text style={{fontFamily:'Solway-Regular', fontSize:20, color:'white', marginLeft:15, marginBottom:10}}>{ title }</Text>
            <View style={{flexDirection:'row', alignItems:'center', marginRight:15, marginBottom:10}}>
              <Text style={{fontFamily:'Solway-Regular', fontSize:20, color:'white',}}>Selected: </Text>
              <Text style={{fontFamily:'Solway-Regular', fontSize:20, color:'#f55fd2',}}>{ num }</Text>
            </View>
          </View>
          
          {(selector=='others') &&
            <View style={{backgroundColor:'#8c7699', elevation:15, marginHorizontal:15, padding:10, marginBottom:15, shadowOffset: {width:0, height:5}, shadowOpacity: 0.3, shadowRadius: 5,}}>
              <TextInput placeholder='User ID' value={searchID} onChangeText={text => setSearchID(text)} style={styles.inputP}/> 
              {searchStatus? (
                <Text style={{marginTop:8, fontSize:18, alignSelf:'center', color:'white', fontStyle:'italic'}}>
                  <Text style={{fontSize:18, color:'#d4c86e', fontStyle:'normal'}}>{ searchName.current }</Text>
                  { searchStatus }
                </Text>
              ) : null }

              {addIndicator? (
                <ActivityIndicator size={50} color='#1da877' animating={addIndicator} style={{alignSelf:'center', marginTop:10}}/>
              ) : (
                <Pressable
                  onPress={() => addOther(searchID)}
                  style={({ pressed }) => [
                    {opacity: pressed ? 0.5: 1}, styles.addOther,
                  ]}
                >
                  <View style={{flexDirection:'row', alignItems:'center',}}>
                    <Text style={{color:"white", fontSize: 19,}}>Add</Text>
                  </View>
                </Pressable>
              )}
            </View>
          }

          {/* Lists #8d8299 {backgroundColor: (selector=='others')? '#1f1f1f': 'grey'} */}
          <View style={{flex:1}}>
            <FlatList data={Data} extraData={[selectedFriends, selectedOthers]} renderItem={({item}) => (
              <View style={[styles.item, {backgroundColor: (selectedFriends.find(e => e.ID === item.ID))? '#853271': '#8d8299'}]}>
                <Image source={{uri: item.photo}} style={{height:40, width:40, borderRadius:50}} />
                <Text style={{flex:1, color:'white', fontSize:18, marginLeft:10, marginRight:5}}>{ item.name }</Text>
              
                {(selectedFriends.find(e => e.ID === item.ID) || selectedOthers.find(e => e.ID === item.ID)) ? (
                    <Pressable
                      onPress={() => removePerson(item.ID)}
                      style={({ pressed }) => [
                        {opacity: pressed ? 0.5: 1}, styles.remove
                      ]}
                    >
                      <View style={{flexDirection:'row', alignItems:'center',}}>
                        <Text style={{color:"white", fontSize: 16,}}>remove</Text>
                      </View>
                    </Pressable>
                ) : (
                      <>
                        {(selector=='friends') &&
                          <Pressable
                            onPress={() => addFriend(item.ID)}
                            style={({ pressed }) => [
                              {opacity: pressed ? 0.5: 1}, styles.add,
                            ]}
                          >
                            <View style={{flexDirection:'row', alignItems:'center',}}>
                              <Text style={{color:"white", fontSize: 16,}}>add</Text>
                            </View>
                          </Pressable>
                        }
                      </>
                )}
            </View>
            )} />
          </View>

          <Pressable
            onPress={() => setModalOpen(false)}
            style={({ pressed }) => [
              {opacity: pressed ? 0.5: 1}, styles.confirm,
            ]}
          >
            <View style={{flexDirection:'row', alignItems:'center',}}>
              <Text style={{color:"#574866", fontSize: 18,}}>ADD PARTICIPANTS</Text>
            </View>
          </Pressable>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Page Contents */}
      <View style={{flex: 1, padding:10,}}>
        <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh}
        progressBackgroundColor={'white'} />}
        >
          <Formik
            initialValues={{title: '', body: '', password: ''}}
            onSubmit={(values) => {setActiveIndicator(true); addConversation(values)}}
            validationSchema={reviewSchema}
          >
            {props => (
              <View style={{alignItems:'flex-start', flex:1,}}>
                <Text style={{fontSize:22, color:'#ede9f2', marginLeft:10, marginBottom:5, fontFamily:'Solway-Regular'}}>Title</Text>
                <TextInput
                  style={styles.input}
                  placeholder='Title'
                  onChangeText={props.handleChange('title')}
                  value={props.values.title}
                />
                { props.touched.title && <Text style={styles.errorText}>{props.errors.title}</Text> }

                <Text style={{fontSize:22, color:'#ede9f2', marginLeft:10, marginBottom:5, marginTop:10, fontFamily:'Solway-Regular'}}>Body</Text>
                <TextInput
                  style={styles.inputBody}
                  placeholder='Body'
                  onChangeText={props.handleChange('body')}
                  value={props.values.body}
                  textAlignVertical= 'top'
                  multiline 
                />
                { props.touched.body && <Text style={styles.errorText}>{props.errors.body}</Text> }

                {/* participants */}
                <TouchableOpacity style={styles.participants} onPress={() => setModalOpen(true)}>
                  <View style={{flexDirection:'row', alignItems:'center'}}>
                    <Text style={{fontSize:22, color:'#574866', marginRight:30, fontFamily:'Solway-Regular'}}>Participants</Text>
                    {displaySelected.length != 0 ? (
                      <View style={{flex:1,}} onStartShouldSetResponder={()=>true}>
                        <ScrollView horizontal>
                          {displaySelected.map(item => {
                            return(
                              <View key={item.ID}>
                                <Image source={{uri: item.photo}} style={{height:40, width:40, borderRadius:50}} />
                              </View>
                            )
                          })}
                        </ScrollView>
                      </View>
                    ): null}
                  </View>
                  <View style={{flexDirection:'row', marginTop:5, flexWrap:'wrap'}}>
                    {displaySelected.map(item => {
                      return(
                        <View key={item.ID}>
                          <Text style={{fontSize:15, marginRight:8, color:'black'}}>{ item.name }</Text>
                        </View>
                      )
                    })}
                  </View>
                </TouchableOpacity>

                <View style={{flexDirection:'row', marginTop:20, alignItems:'center'}}>
                  <Text style={{fontSize:22, color:'#ede9f2', marginLeft:10, marginRight:5, fontFamily:'Solway-Regular'}}>Password</Text>
                  <Switch 
                    onValueChange={toggleSwitch}
                    value={hasPassword}

                  />
                </View>
                {hasPassword ? (
                    <TextInput
                      style={[styles.input, {marginTop:10}]}
                      placeholder='Password'
                      onChangeText={props.handleChange('password')}
                      value={props.values.password}
                    />
                  ) : null 
                }

                {activeIndicator? (
                    <ActivityIndicator size={50} color='#1da877' animating={activeIndicator} style={styles.buttonSubmitAI}/>
                  ) : (
                    <Pressable  
                      onPress={props.handleSubmit}
                      style={({ pressed }) => [
                        {opacity: pressed ? 0.5: 1}, styles.buttonSubmit
                      ]}
                    >
                      <Text style={{color:'white', fontSize:18,}}>Create</Text>
                    </Pressable>
                  )   
                }
                
              </View>
            )}
          </Formik>
        </ScrollView>
      </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  homeHeader: {
    flexDirection: 'row',  
    alignItems:'center',
    backgroundColor: '#613a5f',
    padding: 10,
    elevation: 15
  },
  input: {
    marginBottom: 10,
    borderWidth: 2,
    fontSize: 18,
    padding: 6,
    paddingLeft:8,
    borderColor:"#574866",
    backgroundColor: '#ede9f2',
    alignSelf:'stretch',
    marginRight: 50,
    borderRadius:10,
  },
  errorText: {
    color: '#ff9cc3',
    fontWeight: 'bold',
    marginBottom: 3,
    marginLeft:10
  },
  inputBody: {
    height: 200,
    marginBottom: 10,
    borderWidth: 2,
    fontSize: 18,
    padding: 8,
    paddingLeft:8,
    borderColor:"#574866",
    backgroundColor: '#ede9f2',
    alignSelf:'stretch',
    marginRight: 50,
    borderRadius:10,
  },
  buttonSubmit: {
    backgroundColor: '#1da877',
    padding: 10,
    borderRadius: 20,
    elevation: 8,
    marginBottom: 20,
    marginTop: 20,
    alignSelf:'stretch',
    alignItems:'center',
    marginHorizontal:30,
    shadowOffset: {width:0, height:5},
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  buttonSubmitAI: {
    alignSelf:'center',
    marginBottom: 20,
    marginTop: 20,
  },
  participants: {
    backgroundColor:'#cebce0', 
    alignSelf:'stretch', 
    marginHorizontal:3,
    padding:5,
    marginTop:15,
    borderRadius:5,
    paddingLeft:10,
  },
  friendsOp: {
    padding: 8,
    backgroundColor: 'grey',
    alignItems: 'center',
    borderRadius:15,
    flex:1
  },
  addOther: {
    padding: 8,
    backgroundColor: '#1da877',
    alignItems: 'center',
    borderRadius:20,
    marginTop:10,
    marginHorizontal:100,
    elevation:10,
    shadowOffset: {width:0, height:5},
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  add: {
    backgroundColor:'#1da877',
    alignItems: 'center',
    borderRadius:20,
    paddingHorizontal: 15,
    paddingVertical:5,
    marginLeft:'auto',
    elevation:10,
    shadowOffset: {width:0, height:5},
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  remove: {
    backgroundColor:'#9e8f37',
    alignItems: 'center',
    borderRadius:20,
    paddingHorizontal: 15,
    paddingVertical:5,
    marginLeft:'auto',
    elevation:10,
    shadowOffset: {width:0, height:5},
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  item: {
    flexDirection:'row',
    alignItems:'center',
    padding:4, 
    borderRadius:20, 
    marginHorizontal:10,
    marginBottom:10
  },
  confirm: {
    backgroundColor:'white',
    alignItems: 'center',
    borderRadius:20,
    paddingHorizontal: 15,
    paddingVertical:10,
    elevation:10,
    marginVertical:20,
    marginHorizontal:30,
    shadowOffset: {width:0, height:5},
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  inputP:{
    backgroundColor: 'white',
    fontSize: 20,
    padding: 6,
    borderRadius:10,
    elevation:8,
    textAlign:'center',
    paddingLeft:2
  },
})