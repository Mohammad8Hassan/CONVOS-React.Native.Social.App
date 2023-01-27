import { useState, useCallback } from 'react'
import { 
  StyleSheet, Text, View, Button, KeyboardAvoidingView, TouchableOpacity,
  Pressable, ScrollView, TextInput, ToastAndroid, Platform, Alert
} from 'react-native'
import avatar from '../assets/Imgs/avatar.png'
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { getAuth, createUserWithEmailAndPassword, sendEmailVerification, updateProfile } from 'firebase/auth'
import { MaterialIcons } from '@expo/vector-icons'
import { Ionicons } from '@expo/vector-icons'
import { getFirestore, addDoc, collection, serverTimestamp, onSnapshot, query, orderBy, doc, deleteDoc, setDoc } from 'firebase/firestore'
import { SafeAreaView } from 'react-native-safe-area-context';
import _ from 'lodash';

export default function Register({ navigation }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirestName] = useState('');
    const [lasttName, setlastName] = useState('');
  
    const db = getFirestore();
    const storage = getStorage();
    const downloadUrl = 'https://firebasestorage.googleapis.com/v0/b/convos-app-1.appspot.com/o/avatar.png?alt=media&token=b4652957-e5dc-43b1-8c92-ff6f317611de';
    
    const handleRegister = useCallback(_.debounce(async (email, password) => {
      email = email.replace(/\s/g,'');
      const name = firstName.trimEnd().trimStart() + ' ' + lasttName.trimEnd().trimStart();

      try{
        const credentials = await createUserWithEmailAndPassword(getAuth(), email, password)
        if(Platform.OS === 'android')
          ToastAndroid.show("Registered Successfully", ToastAndroid.LONG);

        await updateProfile(credentials.user, {
          displayName: name,
          photoURL: downloadUrl,
        });

        sendEmailVerification(credentials.user).then(()=> console.log('email sent!'))

        console.log(credentials.user);

        setDoc(doc(db, 'Users', getAuth().currentUser.uid), {
          Name: name,
          ID: getAuth().currentUser.uid,
          email: credentials.user.email,
          Photo: downloadUrl,
          photoExtension: '.png',
          dateRegistered: serverTimestamp(),
          changingEmail: false,
        })
      }
      catch(error){
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log(errorCode, errorMessage);

        if(Platform.OS === 'android')
          ToastAndroid.show(error.message, ToastAndroid.LONG);
        else {
          Alert.alert(
            'Error',
            error.message,
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
    }, 3000, {'leading':true, 'trailing':false}), [email, password, firstName, lasttName])

    const HandleRegister = async () => {
      try{
        const credentials = await createUserWithEmailAndPassword(getAuth(), email, password)
        
        await updateProfile(credentials.user, {
          displayName: firstName + ' ' + lasttName,
          photoURL: downloadUrl,
        });

        console.log(credentials.user);

        await setDoc(doc(db, 'Users', getAuth().currentUser.uid), {
          Name: firstName + ' ' + lasttName,
          ID: getAuth().currentUser.uid,
          email: credentials.user.email,
          Photo: downloadUrl,
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
      <SafeAreaView style={{flex: 1, backgroundColor:'#613a5f'}}>
        <View style={{flex:1, backgroundColor:'#ebebeb'}}>
        <View style={styles.homeHeader}>
          <Pressable 
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [
              {opacity: pressed ? 0.5: 1},
            ]}
            >
            <Ionicons name='chevron-back-circle' size={27} color="white" />
          </Pressable>
          <Text style={{flex:1, fontSize:19, color:'white', fontFamily:'Solway-Regular', marginLeft:10}}>Create a new account</Text>
        </View>
        
        <ScrollView style={{flex: 1,}} contentContainerStyle={{paddingTop:100}}>
          <KeyboardAvoidingView style={styles.container}>
            <View style={styles.inputContainer}>
              <MaterialIcons name='email' color='grey' size={30} style={styles.icons}/>
              <TextInput placeholder='email' value={email} onChangeText={text => setEmail(text)} style={styles.input}/>
            </View>
      
            <View style={styles.inputContainer}>
              <MaterialIcons name='lock' color='grey' size={30} style={styles.icons}/>
              <TextInput placeholder='password' value={password} onChangeText={text => setPassword(text)} secureTextEntry style={styles.input}/>
            </View>

            <View style={styles.inputContainer}>
              <MaterialIcons name='person' color='grey' size={30} style={styles.icons}/>
              <TextInput placeholder='first name' value={firstName} onChangeText={text => setFirestName(text)} style={styles.input}/>
            </View>

            <View style={styles.inputContainer}>
              <MaterialIcons name='person' color='grey' size={30} style={styles.icons}/>
              <TextInput placeholder='last name' value={lasttName} onChangeText={text => setlastName(text)} style={styles.input}/>
            </View>
    
      
            <Pressable  
              onPress={() => handleRegister(email, password)}
              style={({ pressed }) => [
                {opacity: pressed ? 0.5: 1}, styles.login
              ]}
              >
              <Text style={{fontFamily:'Solway-Regular', color:"white", fontSize: 18}}>Register</Text>
            </Pressable>
      
      
            <View style={{flexDirection: 'row', marginTop:20}}>
              <Text style={{fontFamily:'Solway-Regular', color:"#613a5f", fontSize: 18, marginBottom: 10, marginRight: 5}}>Already have an account?</Text>
              <Text style={{fontFamily:'Solway-Bold', color: '#a8a628', fontSize:18}} onPress={() => navigation.popToTop()}>Login!</Text>
            </View>

          </KeyboardAvoidingView>
        </ScrollView>
        </View>
      </SafeAreaView>
    );
  }
  
  const styles = StyleSheet.create({
    container:{
      flex: 1,
      alignItems: 'center',
      justifyContent:'center',
    },
    homeHeader: {
      flexDirection: 'row',  
      alignItems:'center',
      backgroundColor: '#613a5f',
      padding: 10,
      elevation: 15
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
      elevation: 8,
      marginBottom: 15
    },
    icons: {
      backgroundColor: 'white',
      marginLeft: 10
    },
    login: {
      padding: 10,
      margin: 20,
      backgroundColor: '#45376e',
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