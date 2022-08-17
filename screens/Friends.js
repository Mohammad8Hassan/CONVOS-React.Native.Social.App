import { StyleSheet, Text, View, Image, ScrollView, TouchableOpacity, Modal, TextInput,
   Pressable, TouchableWithoutFeedback, ToastAndroid, Keyboard } from 'react-native';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { getFirestore, addDoc, collection, serverTimestamp, onSnapshot, query, orderBy, doc, 
  deleteDoc, Timestamp, setDoc, getDocs, where } from 'firebase/firestore'
import { getAuth } from 'firebase/auth';

export default function Friends() {

  const db = getFirestore();
  const user = getAuth().currentUser;

  const [email, setEmail] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [emailResult, setEmailResult] = useState('');
  const [url, setUrl] = useState(null);
  const [found, setFound] = useState(false);

  const searchEmail = () => {
    Keyboard.dismiss();
    const colRef = collection(db, 'Users');
    const q = query(colRef, where('email', '==', email));
    getDocs(q)
      .then(res => {
        setEmailResult(res.docs[0].data().firstName + " " + res.docs[0].data().lasttName);
        setUrl(res.docs[0].data().photoURL);
        setFound(true);
      })
      .catch(err => {
        console.log(err);
        setEmailResult('no users found!')
      })
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
          timestamp: serverTimestamp()
        });
        setModalVisible(false);
        ToastAndroid.show('Request Sent.', ToastAndroid.SHORT);
      })
      .catch(err => {
        console.log(err);
      })
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
                  <View style={{margin:10, marginTop:50, marginBottom:50}}>

                    <View style={{flexDirection:'row', alignItems:'center', backgroundColor:'#8d8299',}}>
                      <Image source={{uri: url}} style={{height:50, width:50, borderRadius:50, marginLeft:30}} />
                      <Text style={{fontSize:18, color:'white', marginLeft:30}}>{ emailResult }</Text>
                    </View>

                    <View style={{flexDirection:'row', alignItems:'center', marginTop:10}}>
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
      

      <View style={{flex:1, padding:20}}>

        <View style={{alignItems:'flex-end', margin:20}}>
          <TouchableOpacity onPress={() => setModalVisible(true)}>
            <MaterialIcons name='person-add' size={30} color="white"/>
          </TouchableOpacity>
        </View>

        <View style={{flex:1}}>
          <Text style={{color:"white", fontSize:30}}>My Friends</Text>

          <ScrollView>
            <View>
              
            </View>
          </ScrollView>
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
    paddingVertical: 10,
    elevation: 15,
    opacity:1,
    margin: 20
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
    marginHorizontal: 25,
    textAlign:'center',
    paddingLeft:2
  },
  changeEmail: {
    padding: 8,
    backgroundColor: '#d4c86e',
    alignItems: 'center',
    borderRadius:20,
    elevation:10,
    marginHorizontal: 10,
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
  btnBlock: {
    flex:1,
    padding: 8,
    backgroundColor: 'red',
    alignItems: 'center',
    borderRadius:20,
    elevation:10,
    marginLeft:15
    
  },
})