import { useState, useEffect} from 'react';
import { StyleSheet, Text, View, Button, FlatList, TouchableOpacity, ImageBackground, Modal,
  KeyboardAvoidingView, ScrollView, Alert, Image, TouchableWithoutFeedback, TextInput, Pressable
} from 'react-native';
import { globalStyles } from '../shared/globalStyles';
import Card from '../shared/Card';
import { MaterialIcons } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import Form from '../shared/Form';
import { getFirestore, addDoc, collection, serverTimestamp, onSnapshot, query, orderBy,
   doc, deleteDoc, setDoc, Timestamp, where, documentId, getDoc } from 'firebase/firestore'
import { getAuth } from 'firebase/auth';
import { Menu, MenuOptions, MenuOption, MenuTrigger, } from 'react-native-popup-menu';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import avatar from '../assets/Imgs/avatar.png';
import { useIsFocused } from '@react-navigation/native';

// component
export default function Home({ navigation }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [convID, setConvID] = useState('');
  const [response, setResponse] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');

  const db = getFirestore();
  const storage = getStorage();
  const defaultImg = Image.resolveAssetSource(avatar).uri;
  const user = getAuth().currentUser;

  const focused = useIsFocused();

  useEffect(() => {
    setModalVisible(false);
    setShowPassword(false);
    setResponse('');
  }, [focused])

  useEffect(() => {
    const colRef = collection(db, 'Users', user.uid, 'My Conversations');
    // onSnapshot(colRef, snapShot => {
    //   var myConvs = ['1'];
    //   for(const doc of snapShot.docs) {
    //     myConvs.push(doc.id);
    //   }
      
      // const allConvsRef = collection(db, 'Conversations');
      // const q = query(allConvsRef, where(documentId(), 'in', myConvs));
      
    onSnapshot(colRef, async snapShot => {
      let result = [];
      
      for (const conv of snapShot.docs) {
        const author = await getDoc(doc(db, 'Users', conv.data().authorID))
        const empty = conv.data().dateCreated === null ? Timestamp.now() : conv.data().dateCreated;
        const refc = ref(storage, 'Profile Photos/' + conv.data().authorID);
        let url_Temp = null;
        try{
          url_Temp = await getDownloadURL(refc);
        }
        catch{
          url_Temp = defaultImg;
        }

        result.push({id: conv.id, ...conv.data(), dateCreated: empty.toDate(), uri: url_Temp, author: author.data().Name});
      }
      
      // console.log(result);
      setConversations(result);
    })
    
  }, [])

  const deletePost = (id) => {
    deleteDoc(doc(db, 'Posts', id));
  }

  const showAlert = (id) => {
    Alert.alert(
      'Delete Post?',
      'Are you sure you want to delete this post?',
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

  const addReview = (review) => {
    setModalOpen(false);

    addDoc(collection(db, 'Posts'), {
      title: review.title,
      body: review.body,
      author: getAuth().currentUser.displayName,
      authorID: getAuth().currentUser.uid,
      authorEmail: getAuth().currentUser.email,
      dateCreated: serverTimestamp(),
    })
  };

  const clickOut = () => {
    setModalVisible(false);
    setConvID('');
  }

  const joinConversation = async () => {
    if(showPassword == false) {
      const checkExist = await getDoc(doc(db, 'Conversations', convID, 'Participants', user.uid));
      if(checkExist.exists()) {
        console.log('already joined!');
        navigation.navigate('Details', { id: convID });
      }
  
      const checkBan = await getDoc(doc(db, 'Conversations', convID, 'Banned Users', user.uid));
      if(checkBan.exists()) {
        console.log('BANNED!');
        setResponse('unable to join Conversation');
        return;
      }
  
      const passCheck = await getDoc(doc(db, 'Conversations', convID));
      if(passCheck.data().password) {
        console.log('enter password');
        setShowPassword(true);
        return;
      }

      await setDoc(doc(db, 'Conversations', convID, 'Participants', user.uid), {
        ID: user.uid,
        Name: user.displayName
      })
      const getConvInfo = await getDoc(doc(db, 'Conversations', convID));
      await setDoc(doc(db, 'Users', user.uid, 'My Conversations', convID), {
        authorID: getConvInfo.data().authorID,
        title: getConvInfo.data().title,
        body: getConvInfo.data().body,
        dateCreated: serverTimestamp()
      })
      console.log('enter 1 ..');
      navigation.navigate('Details', { id: convID });
    }
    else {
      const passCheck = await getDoc(doc(db, 'Conversations', convID));
      if(password == passCheck.data().password) {
        await setDoc(doc(db, 'Conversations', convID, 'Participants', user.uid), {
          ID: user.uid,
          Name: user.displayName
        })
        const getConvInfo = await getDoc(doc(db, 'Conversations', convID));
        await setDoc(doc(db, 'Users', user.uid, 'My Conversations', convID), {
          authorID: getConvInfo.data().authorID,
          title: getConvInfo.data().title,
          body: getConvInfo.data().body,
          dateCreated: serverTimestamp()
        })
        console.log('enter 2 ..');
        navigation.navigate('Details', { id: convID });
      }
      else {
        console.log('wrong password!');
        setResponse('Incorrect Password!');
        return;
      }
    }
  }


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
                    <Text style={{color:'white', fontSize:17, marginHorizontal:15, alignSelf:'center'}}>{ response }</Text>
                  </View>
                }
                <Pressable
                  onPress={joinConversation}
                  style={({ pressed }) => [
                    {opacity: pressed ? 0.5: 1}, styles.changeEmail
                  ]}
                >
                  <View style={{flexDirection:'row', alignItems:'center',}}>
                    <Text style={{color:"#806b96", fontSize: 16,}}>Join</Text>
                  </View>
                </Pressable>

              </View>
              </TouchableWithoutFeedback>

            </View>
          </TouchableWithoutFeedback>
        </Modal>

        <View style={{elevation:15, backgroundColor:'#613a5f'}}>
          <View style={styles.homeHeader}>
            {/* <Ionicons name='chevron-back-circle' size={27} color="white" /> */}
            <Text style={{fontSize:19, color:'white',}}>Conversations</Text>
          </View>
          
          {/* Page Contents */}

          <View style={{backgroundColor:'#613a5f', padding:5, flexDirection:'row', alignItems:'center',}}>
            <Image source={{uri: user.photoURL}} style={{height:50, width:50, borderRadius:50, borderColor:'#bab806', borderWidth:1}} />
            <View style={{marginHorizontal:4}}>
              <Text style={{color:'#bab806', fontSize:18}}>{ user.displayName }</Text>
              <Text style={{color: '#bfbfb0'}}>{ user.uid }</Text>
            </View>
            <Pressable
              style={({ pressed }) => [
                {opacity: pressed ? 0.5: 1}, styles.copyID
              ]}
            >
              <View style={{flexDirection:'row', alignItems:'center',}}>
                <Text style={{color:"#806b96", fontSize: 15, marginRight:3}}>Copy ID</Text>
                <MaterialIcons name='file-copy' size={17} color='#806b96' />
              </View>
            </Pressable>
          </View>
        </View>

        <View style={{flexDirection:'row', padding:10,}}>
          <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.joinConv}>
              <Text style={{color:'white', fontSize:16, marginRight:5}}>Join</Text>
              <Ionicons name='arrow-redo-outline' size={20} color='white' />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('New Conversation')} style={styles.newConv}>
              <Text style={{color:'white', fontSize:16, marginRight:5}}>New</Text>
              <MaterialIcons name='add' size={20} color='white' />
          </TouchableOpacity>
        </View>

        <View style={{flex: 1}}>
          <FlatList data={conversations} renderItem={({ item }) => (
            <TouchableOpacity onPress={() => navigation.push('Details', { id: item.id })} style={styles.item}>
              <Card>
                <View style={styles.content}>
                  <View style={styles.header}>
                    <Text style={globalStyles.titleText}>{ item.title }</Text>
                    
                    {(getAuth().currentUser.uid == item.authorID) &&
                      <Menu>
                        <MenuTrigger>
                          <MaterialIcons name='more-horiz' size={24} color="grey"/>
                        </MenuTrigger>
                        <MenuOptions>
                          <MenuOption onSelect={() => showAlert(item.authorID)}>
                            <Text style={{color: "red", fontSize: 18, margin: 5}}>Delete Post</Text>
                          </MenuOption>
                        </MenuOptions>
                      </Menu>
                    }
                    
                  </View>
                  <Text style={styles.body} numberOfLines={2}>{ item.body }</Text>
                </View>
               
                <View style={styles.createdViewContainer}>
                  <View style={styles.createdView}>
                    <Text style={styles.createdAuthor}>{ item.author }</Text>
                    <Text style={styles.createdTime}>{ item.dateCreated.toDateString()}</Text>
                  </View>
                  <Image source={{uri: item.uri}} style={styles.pic} />
                </View>

              </Card>
            </TouchableOpacity>
          )}/>
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
    marginHorizontal: 18,
    marginTop: 20,
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
    padding: 10
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
    marginTop: 15,
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
    // backgroundColor:'red', 
    alignItems:'center', 
    marginTop: 20,
    // paddingVertical:10
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
    padding: 8,
    backgroundColor: '#d4c86e',
    alignItems: 'center',
    borderRadius:20,
    marginLeft: 'auto'
  },
});