import { StyleSheet, Text, View, Image, ScrollView, TouchableOpacity, Modal, TextInput,
  Pressable, TouchableWithoutFeedback, ToastAndroid, Keyboard, FlatList,
   Alert, RefreshControl, Switch } from 'react-native';
import { useEffect, useState, useCallback } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context';
import Form from '../shared/Form';
import { getAuth } from 'firebase/auth';
import { addDoc, serverTimestamp, setDoc, getFirestore, getDocs, collection, doc, getDoc, query, where, orderBy } from 'firebase/firestore';
import * as yup from 'yup';
import { Formik } from 'formik';

const reviewSchema = yup.object({
  title: yup.string()
    .required()
    .min(1),
  body: yup.string()
    .required()
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
  const [searchStatus, setSearchStatus] = useState(null);
  const [hasPassword, setHasPassword] = useState(false);

  useEffect(() => {
    const tab = navigation.getParent();
    tab.setOptions({
      tabBarStyle: {display: 'none'}
    });

    let friends = [];
    const friendsCollection = collection(db, 'Users', user.uid, 'Friends');

    getDocs(friendsCollection)
      .then(res => {
        res.forEach(doc => {
          friends.push({...doc.data()})
        })
      })
      .catch(err => console.log(err))

    setFriends(friends);
    console.log("RAN AGAIN!!")

    return () => {
      tab.setOptions({
        tabBarStyle: {display: 'flex', backgroundColor: '#745f8a'}
      });
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
      dateCreated: serverTimestamp(),
    })
    .then(ref => {
      setDoc(doc(db, 'Users', user.uid, 'My Conversations', ref.id), {
        authorID: user.uid,
        title: values.title,
        body: values.body,
        dateCreated: serverTimestamp()
      });

      selectedFriends.forEach(person => {
        const convRef = doc(db, 'Users', person.ID, 'Friends Invites', ref.id);
        setDoc(convRef, {
          title: values.title,
          body: values.body,
          author: user.displayName,
          authorID: user.uid,
          timeStamp: serverTimestamp(),
        })
      })
  
      selectedOthers.forEach(person => {
        const convRef = doc(db, 'Users', person.ID, 'Other Invites', ref.id);
        setDoc(convRef, {
          title: values.title,
          author: user.displayName,
          authorID: user.uid,
          timeStamp: serverTimestamp(),
        })
      })

      setDoc(doc(db, 'Conversations', ref.id, 'Participants', user.uid), {
        Name: user.displayName,
        ID: user.uid,
        removed: false
      });

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
  
  const addOther = () => {
    Keyboard.dismiss();
    const obj = selectedOthers.find(e => e.email === email);
    console.log(obj);

    if(obj){
      console.log('already exists');
      setSearchStatus(obj.firstName + ' ' + obj.lasttName + ' is already added!');
    }
    else {
      const colRef = collection(db, 'Users');
      const q = query(colRef, where('email', '==', email));
      getDocs(q)
        .then(res => {
          if(res.docs[0].exists()){
            setSelectedOthers(prev => {
              prev.push({...res.docs[0].data()});
              return [...prev];
            })
            setSelectedOthersNum(prev => {return prev += 1;})

            setDisplaySelected(prev => {
              prev.push({...res.docs[0].data()});
              return [...prev];
            });
          }
          else throw 'No users found'
        })
        .catch(err => {
          console.log(err);
          setSearchStatus('No users found!');
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

  

  return (
    <SafeAreaView style={{flex: 1, backgroundColor:'#806b96'}}>
      <View style={styles.homeHeader}>
        <Text style={{fontSize:18, color:'white'}}>New Conversation</Text>
      </View>

      {/* Modal */}

      <Modal visible={modalOpen} animationType='slide' onRequestClose={() => setModalOpen(false)}>
        <View style={{flex:1, backgroundColor:'#806b96'}}>
          <View style={styles.homeHeader}>
            <Text style={{fontSize:18, color:'white'}}>Invite Participants</Text>
          </View>

          {/* Selectors  */}
          <View style={{flexDirection:'row', justifyContent:'space-around', marginVertical:15, marginHorizontal:20, paddingVertical:5}}>
            <Pressable
              onPress={selectFriends}
              style={({ pressed }) => [
                {opacity: pressed ? 0.5: 1}, styles.friendsOp, {backgroundColor: (selector=='friends')? '#1f1f1f': 'grey'}
              ]}
            >
              <View style={{flexDirection:'row', alignItems:'center',}}>
                <Text style={{color:"white", fontSize: 19,}}>Friends</Text>
              </View>
            </Pressable>
            <Pressable
              onPress={selectOthers}
              style={({ pressed }) => [
                {opacity: pressed ? 0.5: 1}, styles.friendsOp, {backgroundColor: (selector=='others')? '#1f1f1f': 'grey'}
              ]}
            >
              <View style={{flexDirection:'row', alignItems:'center',}}>
                <Text style={{color:"white", fontSize: 19,}}>Others</Text>
              </View>
            </Pressable>
          </View>
          
          {/* titles  */}
          <View style={{flexDirection:'row', justifyContent:'space-between'}}>
            <Text style={{fontSize:20, color:'white', marginLeft:15, marginBottom:10}}>{ title }</Text>
            <View style={{flexDirection:'row', alignItems:'center', marginRight:15, marginBottom:10}}>
              <Text style={{fontSize:20, color:'white',}}>Selected: </Text>
              <Text style={{fontSize:20, color:'#f55fd2',}}>{ num }</Text>
            </View>
          </View>
          
          {(selector=='others') &&
            <View style={{backgroundColor:'#ababab', marginHorizontal:15, padding:10, marginBottom:15}}>
              <TextInput placeholder='Email' value={email} onChangeText={text => setEmail(text)} style={styles.inputP}/> 
              {searchStatus && <Text style={{marginTop:8, fontSize:18, alignSelf:'center', color:'#2c2433'}}>{ searchStatus }</Text>}
              <Pressable
                onPress={addOther}
                style={({ pressed }) => [
                  {opacity: pressed ? 0.5: 1}, styles.addOther,
                ]}
              >
                <View style={{flexDirection:'row', alignItems:'center',}}>
                  <Text style={{color:"white", fontSize: 19,}}>ADD</Text>
                </View>
              </Pressable>
            </View>
          }

          {/* Lists #8d8299 {backgroundColor: (selector=='others')? '#1f1f1f': 'grey'} */}
          <View style={{flex:1}}>
            <FlatList data={Data} extraData={[selectedFriends, selectedOthers]} renderItem={({item}) => (
              <View style={[styles.item, {backgroundColor: (selectedFriends.find(e => e.ID === item.ID))? '#853271': '#8d8299'}]}>
                <Image source={{uri: item.Photo}} style={{height:40, width:40, borderRadius:50}} />
                <Text style={{color:'white', fontSize:18, marginLeft:10}}>{ item.Name }</Text>
              
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
      </Modal>

      {/* Page Contents */}

      <View style={{flex: 1, padding:10,}}>
        <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh}
        progressBackgroundColor={'white'} />}
        >
          <Formik
            initialValues={{title: '', body: '', password: ''}}
            onSubmit={(values) => addConversation(values)}
            validationSchema={reviewSchema}
          >
            {props => (
              <View style={{alignItems:'flex-start', flex:1,}}>
                <Text style={{fontSize:22, color:'#ede9f2', marginLeft:10, marginBottom:5}}>Title</Text>
                <TextInput
                  style={styles.input}
                  placeholder='Title'
                  onChangeText={props.handleChange('title')}
                  value={props.values.title}
                />
                { props.touched.title && <Text style={styles.errorText}>{props.errors.title}</Text> }

                <Text style={{fontSize:22, color:'#ede9f2', marginLeft:10, marginBottom:5, marginTop:10}}>Body</Text>
                <TextInput
                  style={styles.inputBody}
                  placeholder='Body'
                  onChangeText={props.handleChange('body')}
                  value={props.values.body}
                  textAlignVertical= 'top'
                  multiline 
                />
                { props.touched.body && <Text style={styles.errorText}>{props.errors.body}</Text> }

                <TouchableOpacity style={styles.participants} onPress={() => setModalOpen(true)}>
                  <View style={{flexDirection:'row', alignItems:'center'}}>
                    <Text style={{fontSize:22, color:'#574866', marginRight:30}}>Participants</Text>
                    <View style={{flexDirection:'row'}}>
                      {displaySelected.map(item => {
                        return(
                          <View key={item.ID}>
                            <Image source={{uri: item.Photo}} style={{height:40, width:40, borderRadius:50}} />
                          </View>
                        )
                      })}
                    </View>
                  </View>
                  <View style={{flexDirection:'row', marginTop:5}}>
                    {displaySelected.map(item => {
                      return(
                        <View key={item.ID}>
                          <Text style={{fontSize:15, marginRight:8, color:'black'}}>{ item.Name }</Text>
                        </View>
                      )
                    })}
                  </View>
                </TouchableOpacity>

                <View style={{flexDirection:'row', marginTop:5, alignItems:'center'}}>
                  <Text style={{fontSize:22, color:'#ede9f2', marginLeft:10, marginRight:5}}>Password</Text>
                  <Switch 
                    onValueChange={toggleSwitch}
                    value={hasPassword}

                  />
                </View>
                {hasPassword && 
                  <TextInput
                    style={styles.input}
                    placeholder='Password'
                    onChangeText={props.handleChange('password')}
                    value={props.values.password}
                  />
                }
                <TouchableOpacity style={styles.buttonSubmit} onPress={props.handleSubmit}>
                  <Text style={{color:'white', fontSize:18,}}>Create</Text>
                </TouchableOpacity>
              </View>
            )}
          </Formik>
        </ScrollView>
      </View>
      
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  homeHeader: {
    flexDirection: 'row', 
    justifyContent:'space-between', 
    alignItems:'center',
    backgroundColor: '#613a5f',
    padding: 10,
    elevation: 15
  },
  input: {
    marginBottom: 10,
    borderWidth: 2,
    fontSize: 18,
    padding: 10,
    borderColor:"#574866",
    backgroundColor: '#ede9f2',
    alignSelf:'stretch',
    marginRight: 50,
    borderRadius:20
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
    padding: 10,
    borderColor:"#574866",
    backgroundColor: '#ede9f2',
    alignSelf:'stretch',
    marginRight: 50,
    borderRadius:20,
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
    marginHorizontal:30
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
    borderRadius:20,
    flex:1
  },
  addOther: {
    padding: 8,
    backgroundColor: 'green',
    alignItems: 'center',
    borderRadius:20,
    marginTop:10,
    marginHorizontal:100,
    elevation:10
  },
  add: {
    backgroundColor:'green',
    alignItems: 'center',
    borderRadius:20,
    paddingHorizontal: 15,
    paddingVertical:5,
    marginLeft:'auto',
    elevation:10
  },
  remove: {
    backgroundColor:'#9e8f37',
    alignItems: 'center',
    borderRadius:20,
    paddingHorizontal: 15,
    paddingVertical:5,
    marginLeft:'auto',
    elevation:10
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
    marginHorizontal:30
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