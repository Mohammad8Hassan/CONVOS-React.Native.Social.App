import { useState } from 'react'
import { 
  StyleSheet, Text, View, Button, KeyboardAvoidingView, TouchableOpacity,
  Pressable
} from 'react-native'
import { TextInput } from 'react-native-gesture-handler'
import avatar from '../assets/Imgs/avatar.png'
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { MaterialIcons } from '@expo/vector-icons'
import { getFirestore, addDoc, collection, serverTimestamp, onSnapshot, query, orderBy, doc, deleteDoc, setDoc } from 'firebase/firestore'

export default function Register({ navigation }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirestName] = useState('');
    const [lasttName, setlastName] = useState('');
  
    const db = getFirestore();
    const storage = getStorage();
  
    const HandleRegister = async () => {
      try{
        const credentials = await createUserWithEmailAndPassword(getAuth(), email, password)
        const refc = ref(storage, 'Profile Photos/avatar.png');
        const url = await getDownloadURL(refc);
        
        await updateProfile(credentials.user, {
          displayName: firstName + ' ' + lasttName,
          photoURL: url,
        });

        console.log(credentials.user);

        await setDoc(doc(db, 'Users', getAuth().currentUser.uid), {
          Name: firstName + ' ' + lasttName,
          ID: getAuth().currentUser.uid,
          email: credentials.user.email,
          Photo: getAuth().currentUser.photoURL,
          photoExtension: '.png',
          dateRegistered: serverTimestamp(),
        })
      }
      catch(error){
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log(errorCode, errorMessage);
      }
      
    }


    // const HandleRegisterOLD = () => {
    //   createUserWithEmailAndPassword(getAuth(), email, password)
    //     .then(credentials => {
    //       const refc = ref(storage, 'Profile Photos/' + credentials.user.uid);
    //       const img = avatar;
    //       const bytes = await img.blob();
    //       await uploadBytes(refc, bytes)
    //         .then(snapShot => {
    //           console.log(snapShot.metadata.fullPath);
    //         })

    //       updateProfile(credentials.user, {
    //         displayName: firstName + ' ' + lasttName,
    //         photoURL: "gs://pilot-react-native.appspot.com/Profile Photos/avatar.png"
    //       });

          // setDoc(doc(db, 'Users', getAuth().currentUser.uid), {
          //   firstName: firstName,
          //   lasttName: lasttName,
          //   ID: getAuth().currentUser.uid,
          //   email: credentials.user.email,
          //   dateRegistered: serverTimestamp(),
          // })
    //     })
    //     .catch(error => {
    //       const errorCode = error.code;
    //       const errorMessage = error.message;
    //       console.log(errorCode, errorMessage);
    //     });
    // }
  
  
    return (
      <KeyboardAvoidingView style={styles.container}>
        <View style={styles.inputContainer}>
          <MaterialIcons name='email' color='grey' size={30} style={styles.icons}/>
          <TextInput placeholder='email' value={email} onChangeText={text => setEmail(text)} style={styles.input}/>
        </View>
        <Text>{email}</Text>
  
        <View style={styles.inputContainer}>
          <MaterialIcons name='lock' color='grey' size={30} style={styles.icons}/>
          <TextInput placeholder='password' value={password} onChangeText={text => setPassword(text)} secureTextEntry style={styles.input}/>
        </View>
        <Text>{password}</Text>

        <View style={styles.inputContainer}>
          <MaterialIcons name='person' color='grey' size={30} style={styles.icons}/>
          <TextInput placeholder='first name' value={firstName} onChangeText={text => setFirestName(text)} style={styles.input}/>
        </View>
        <Text>{firstName}</Text>

        <View style={styles.inputContainer}>
          <MaterialIcons name='person' color='grey' size={30} style={styles.icons}/>
          <TextInput placeholder='last name' value={lasttName} onChangeText={text => setlastName(text)} style={styles.input}/>
        </View>
        <Text>{lasttName}</Text>
  
        
        {/* <TouchableOpacity style={styles.login} onPress={HandleLogin}>
          <Text style={{color:"white", fontSize: 18}}>Login</Text>
        </TouchableOpacity > */}
  
        <Pressable  
          onPress={HandleRegister}
          style={({ pressed }) => [
            {opacity: pressed ? 0.5: 1}, styles.login
          ]}
          >
          <Text style={{color:"white", fontSize: 18}}>Register</Text>
        </Pressable>
  
  
        <View style={{flexDirection: 'row', marginTop: 100}}>
        <Text style={{color:"black", fontSize: 18, marginBottom: 10, marginRight: 5}}>Already have an account?</Text>
        <Text style={{color: '#a8a628', fontSize:18}} onPress={() => navigation.popToTop()}>Login!</Text>
        </View>

      </KeyboardAvoidingView>
    );
  }
  
  const styles = StyleSheet.create({
    container:{
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 180
    },
    input:{
      backgroundColor: 'white',
      fontSize: 20,
      padding: 8,
      borderTopRightRadius: 25,
      borderBottomEndRadius: 25,
      flex: 1,
    },
    inputContainer: {
      flexDirection: 'row',
      alignSelf: 'stretch',
      marginHorizontal:40,
      alignItems: 'center',
      backgroundColor: 'white',
      borderRadius: 20,
      overflow: 'hidden',
      elevation: 8
    
    },
    icons: {
      backgroundColor: 'white',
      marginLeft: 10
    },
    login: {
      padding: 10,
      margin: 20,
      backgroundColor: 'blue',
      width: 200,
      alignItems: 'center',
      borderRadius: 50,
      elevation: 8
    },
    signUp: {
      fontSize: 18,
      marginTop: 100
    }
  })