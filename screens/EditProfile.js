import { useEffect, useState,} from 'react'
import { StyleSheet, Text, View, Image, Pressable, TextInput, KeyboardAvoidingView,
   ScrollView, Modal, ToastAndroid, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { getAuth, signOut, reauthenticateWithCredential, updateProfile, EmailAuthProvider,
  updateEmail } from 'firebase/auth';
import { MaterialIcons } from '@expo/vector-icons';
import { getStorage, ref, uploadBytes, getDownloadURL, getMetadata } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import { useIsFocused } from '@react-navigation/native';
import { updateDoc, getFirestore, doc,  } from 'firebase/firestore';


export default function EditProfile({ navigation }) {
  const [userName, setUserName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  const [indicator, setIndicator] = useState(false);

  const db = getFirestore();
  const storage = getStorage();
  const user = getAuth().currentUser;

  const focused = useIsFocused();

  useEffect(() => {
    const tab = navigation.getParent();
    tab.setOptions({
      tabBarStyle: {display: 'none'}
    });

    // setProfilePic(user.photoURL);
    // setUserName(user.displayName);
    // setEmail(user.email);
    // setUserId(user.uid);

    return () => {
      tab.setOptions({
        tabBarStyle: {display: 'flex', backgroundColor: '#745f8a'}
      });
    }
  }, [])

  // useEffect(() => {
  //   setEmail(user.email);
  // }, [focused])

  useEffect(() => {
    setFirstName(userName.substring(0, userName.indexOf(' ')));
    setLastName(userName.substring(userName.indexOf(' ') + 1));
  }, [userName])


  const changePhoto = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1
    });

    if(!result.cancelled) {
      setIndicator(true);
      const refc = ref(storage, 'Profile Photos/' + user.uid)
      const img = await fetch(result.uri);
      const bytes = await img.blob();
      
      await uploadBytes(refc, bytes);
      
      const url_Temp = await getDownloadURL(refc);
      const meta = await getMetadata(refc);
      
      await updateProfile(user, {
        photoURL: url_Temp,
      });

      await updateDoc(doc(db, 'Users', user.uid), {
        Photo: url_Temp,
        photoExtension: meta.contentType.split('/')[1],
      })

      setIndicator(false);
    };
  }

  const changeName = async () => {
    updateProfile(user, {
      displayName: firstName + ' ' + lastName,
    });

    updateDoc(doc(db, 'Users', user.uid), {
      Name: firstName + ' ' + lastName,
    })

    setUserName(firstName + ' ' + lastName);

    ToastAndroid.show('Name changed successfuly', ToastAndroid.SHORT);
  }

  const changeEmail = () => {
    const cred = EmailAuthProvider.credential(user.email, password);

    reauthenticateWithCredential(user, cred)
      .then(() => {
        updateEmail(user, newEmail)
          .then(() => {
            updateDoc(doc(db, 'Users', user.uid), {
              email: newEmail,
            });
            console.log('email updated');
            setModalVisible(false);
            ToastAndroid.show('email updated successfully', ToastAndroid.SHORT);
          })
          .catch(error => {
            console.log(error);
            ToastAndroid.show(error.message, ToastAndroid.LONG);
          })
      })
      .catch(error => {
        console.log(error);
        ToastAndroid.show(error.message, ToastAndroid.LONG);
      })
    
  }
  

{/* Template */}  

  return (
    <SafeAreaView style={{flex:1, backgroundColor:'red',}}>
      <KeyboardAvoidingView style={{flex:1, backgroundColor:'blue',}}>
        <ScrollView contentContainerStyle={{ flexGrow: 1}}>
          
          <View style={styles.homeHeader}>
            <Text style={{fontSize:19, color:'white', fontFamily:'Solway-Regular', marginLeft:10}}>Edit Profile</Text>
          </View>

          {/* MODAL */}

          <Modal visible={modalVisible} animationType='fade' transparent={true}
            onRequestClose={() => {setModalVisible(false)}}
          >
            <View style={styles.outerView}>

              
                {/* <View>
                  <Text style={{color:"white", fontSize: 20, marginTop:20, marginLeft: 10}}>New Email</Text>
                </View> */}

                <View style={styles.innerView}>
                  <TextInput placeholder='enter your new email..' value={newEmail} onChangeText={text => setNewEmail(text)} style={styles.inputP}/> 
                  <TextInput placeholder='re-enter your password' value={password} onChangeText={text => setPassword(text)} style={styles.inputP}/> 
                  <Pressable  
                    onPress={changeEmail}
                    style={({ pressed }) => [
                      {opacity: pressed ? 0.5: 1}, styles.changeEmailInside
                    ]}
                  >
                    <View style={{flexDirection:'row', alignItems:'center'}}>
                      <Text style={{color:"white", fontSize: 16,}}>Apply</Text>
                    </View>
                  </Pressable>
                </View>
              

            </View>
          </Modal>
      
          {/* CONTAINER */}

          <View style={styles.container}>

            {/* profile picture  */}
            <View style={{backgroundColor:'#8c7699', elevation:15, marginBottom:20, paddingVertical:8, marginTop:15}}>
              <View>
                <Text style={{color:"white", fontSize: 20, marginLeft: 10, marginBottom:10}}>Profile Picture</Text>
              </View>

              <View style={styles.header}>
                <View style={styles.ppContainer}>
                  {!indicator? (
                    <Image source={{uri: user.photoURL}} style={{width:120, height:120, borderRadius:100, borderWidth:2, borderColor:'#806b96',}}/>
                  ) : (
                    <ActivityIndicator size={80} color='#613a5f' animating={indicator} style={{width:120, height:120, borderRadius:100, borderWidth:2, borderColor:'#806b96',}} />
                  )}
                </View>
                
                <View style={styles.userInfo}>
                  <Pressable  
                      onPress={changePhoto}
                      style={({ pressed }) => [
                      {opacity: pressed ? 0.5: 1}, styles.edit
                    ]}
                  >
                    <View style={{flexDirection:'row', alignItems:'center'}}>
                      <Text style={{color:"#806b96", fontSize: 20,}}>Change</Text>
                    </View>
                  </Pressable>
                </View>

              </View>
            </View>

            {/* Name  */}
            <View style={{backgroundColor:'#8c7699', elevation:15, marginBottom:20, paddingVertical:8 }}>
              <View style={{flexDirection:'row',}}>
                <Text style={{color:"white", fontSize: 20, marginLeft: 10, flex:1}}>Name</Text>
                <Text style={{color:"#d4c86e", fontSize: 20, fontWeight:'bold', flex:3,}}>{ user.displayName }</Text>
              </View>

              <View style={{paddingVertical:5, marginTop:10, paddingRight:5}}>
                <View style={{flexDirection:'row', alignItems:'center', paddingHorizontal:8}}>
                  <Text style={{color:'white', fontSize:16, marginRight:5, flex:1}}> First Name </Text>
                  <TextInput placeholder='first name' value={firstName} onChangeText={text => setFirstName(text)} style={styles.input}/> 
                </View>

                <View style={{flexDirection:'row', alignItems:'center', paddingHorizontal:8}}>
                  <Text style={{color:'white', fontSize:16, marginRight:5, flex:1}}> Last Name </Text>
                  <TextInput placeholder='last name' value={lastName} onChangeText={text => setLastName(text)} style={styles.input}/> 
                </View>

                <Pressable  
                  onPress={changeName}
                  style={({ pressed }) => [
                    {opacity: pressed ? 0.5: 1}, styles.apply
                  ]}
                >
                  <View style={{flexDirection:'row', alignItems:'center'}}>
                    <Text style={{color:"white", fontSize: 20,}}>Apply</Text>
                  </View>
                </Pressable>
                
              </View>
            </View>

            {/* Email  */}
            <View style={{backgroundColor:'#8c7699', elevation:15, marginBottom:15, paddingVertical:10 }}>
              <View>
                <Text style={{color:"white", fontSize: 20, marginLeft: 10}}>Email</Text>
              </View>

              <View style={{flexDirection:'row', justifyContent:'space-between', marginRight:8, alignItems:'center'}}> 
                <Text style={styles.inputE}>
                  { user.email }
                </Text>
                <Pressable  
                  onPress={() => setModalVisible(true)}
                  style={({ pressed }) => [
                    {opacity: pressed ? 0.5: 1}, styles.changeEmail
                  ]}
                >
                  <View style={{flexDirection:'row', alignItems:'center'}}>
                    <Text style={{color:"#806b96", fontSize: 16,}}>Change</Text>
                  </View>
                </Pressable>
              </View>
            </View>

            
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
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
    elevation:15
  },
  container: {
    flex: 1,
    backgroundColor:'#806b96',
  },
  header: {
    flexDirection: 'row',
    marginHorizontal: 15,
    alignItems: 'center'
  },
  userInfo: {
    flex:1,
    alignItems:'flex-start'
  },
  ppContainer: {
    flex:1,
    alignItems:'center'
  },
  edit: {
    padding: 10,
    backgroundColor: '#d4c86e',
    width: 150,
    alignItems: 'center',
    borderRadius:10,
    elevation:8
  },
  input:{
    backgroundColor: 'white',
    fontSize: 20,
    padding: 4,
    paddingLeft: 10,
    borderRadius: 5,
    flex: 3,
    marginTop: 5,
    elevation:8
  },
  inputE:{
    fontSize: 20,
    padding: 4,
    paddingLeft: 10,
    borderTopRightRadius: 18,
    borderBottomRightRadius: 18,
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
    marginLeft: 6,
    marginTop: 5,
    flex:4,
    color: 'white',
    fontWeight:'bold'
  },
  changeEmail: {
    padding: 8,
    flex:1,
    backgroundColor: '#d4c86e',
    alignItems: 'center',
    borderRadius:10,
    elevation:10,
    marginRight:8
  },
  changeEmailInside: {
    padding: 10,
    backgroundColor: '#7c9e42',
    alignItems: 'center',
    marginHorizontal:50,
    borderRadius:15,
    elevation:8,
  },
  apply: {
    padding: 10,
    backgroundColor: '#7c9e42',
    alignItems: 'center',
    marginTop:15,
    borderRadius: 15,
    marginRight:8,
    elevation:8,
    alignSelf:'stretch',
    marginLeft:120
  },
  outerView: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)'
  },
  innerView: {
    backgroundColor: '#806b96',
    alignItems:'stretch',
    paddingVertical: 10,
    elevation: 15,
    opacity:1,
    marginTop:'auto'
  },
  inputP:{
    backgroundColor: 'white',
    fontSize: 20,
    padding: 6,
    paddingLeft: 10,
    borderRadius:5,
    elevation:8,
    marginHorizontal: 25,
    marginBottom: 10
  },
})