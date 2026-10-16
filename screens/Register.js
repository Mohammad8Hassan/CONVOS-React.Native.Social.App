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
import AuthLayout from '../shared/AuthLayout';
import AuthInput from '../shared/AuthInput';

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

        await Promise.all([
          updateProfile(credentials.user, {
            displayName: name,
            photoURL: downloadUrl,
          }),


        ]) 

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

    
  
    return (
      <AuthLayout compact title='Create your account' subtitle='It only takes a minute' onBack={() => navigation.goBack()}>
        <AuthInput icon='person' placeholder='First name' value={firstName} onChangeText={setFirestName} />
        <AuthInput icon='person-outline' placeholder='Last name' value={lasttName} onChangeText={setlastName} />
        <AuthInput icon='email' placeholder='Email' value={email} onChangeText={setEmail}
          keyboardType='email-address' autoCapitalize='none' autoCorrect={false} />
        <AuthInput icon='lock' placeholder='Password' value={password} onChangeText={setPassword} secureTextEntry autoCapitalize='none' />

        <Pressable
          onPress={() => handleRegister(email, password)}
          style={({ pressed }) => [{opacity: pressed ? 0.7: 1}, styles.login]}
        >
          <Text style={styles.loginText}>Sign up</Text>
        </Pressable>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Text style={styles.link} onPress={() => navigation.popToTop()}>Log in</Text>
        </View>
      </AuthLayout>
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
      paddingVertical: 12,
      paddingHorizontal: 10,
      paddingBottom: 16,
      borderBottomLeftRadius: 26,
      borderBottomRightRadius: 26
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
      paddingVertical: 14,
      marginTop: 22,
      backgroundColor: '#613a5f',
      alignItems: 'center',
      borderRadius: 28,
      elevation: 4,
    },
    loginText: { color: 'white', fontSize: 17, fontWeight: '700', letterSpacing: 0.5 },
    link: { color: '#961570', fontSize: 14, fontWeight: '700' },
    footerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 28 },
    footerText: { color: '#8d8296', fontSize: 14 },

    signUp: {
      fontSize: 18,
      marginTop: 100
    }
  })