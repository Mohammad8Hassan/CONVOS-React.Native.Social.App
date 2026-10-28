import { useRef, useState } from 'react'
import { 
  StyleSheet, Text, View, Button, KeyboardAvoidingView, TouchableOpacity,
  Pressable, ScrollView, Modal, ActivityIndicator, ToastAndroid, Alert, Platform
} from 'react-native'
import { TextInput } from 'react-native-gesture-handler'
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail,
  setPersistence } from 'firebase/auth';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AuthLayout from '../shared/AuthLayout';
import AuthInput from '../shared/AuthInput';
import BusyButton from '../shared/BusyButton';
import { friendlyAuthError } from '../shared/authError';



export default function Login({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const [showIndicator, setShowIndicator] = useState(false);

  const emailToReset = useRef('');

  const handleLogin = async (email, password) => {

    email = email.replace(/\s/g,'');

    return signInWithEmailAndPassword(getAuth(), email, password)
      .then(credentials => {
        const user = credentials.user;
        console.log("step 2");
        console.log(user.email);
        
        if(Platform.OS === 'android')
          ToastAndroid.show("Logged in Successfully", ToastAndroid.SHORT);
        else {
          Alert.alert(
            'Logged in Successfully',
            '',
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
      })
      .catch(error => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log(errorCode, errorMessage);
        
        if(Platform.OS === 'android')
          ToastAndroid.show(friendlyAuthError(error), ToastAndroid.LONG);
        else {
          Alert.alert(
            'Error',
            friendlyAuthError(error),
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
      });
  }

  // const HandleLogin = () => {
  //   signInWithEmailAndPassword(getAuth(), email, password)
  //     .then(credentials => {
  //       const user = credentials.user;
  //       console.log("step 2");
  //       console.log(user.email)
  //     })
  //     .catch(error => {
  //       const errorCode = error.code;
  //       const errorMessage = error.message;
  //       console.log(errorCode, errorMessage);
  //     });
  // }

  const sendResetEmail = () => {
    setShowIndicator(true);
    console.log(emailToReset.current);

    sendPasswordResetEmail(getAuth(), emailToReset.current)
      .then(() => {
        console.log('email sent');
        setModalVisible(false);
        setShowIndicator(false);
        
        if(Platform.OS === 'android')
          ToastAndroid.show('reset email sent', ToastAndroid.LONG);
        else {
          Alert.alert(
            'reset email sent',
            '',
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
      })
      .catch(error => {
        console.log('email send error', error.message);
        setModalVisible(false);
        setShowIndicator(false);
        
        if(Platform.OS === 'android')
          ToastAndroid.show(friendlyAuthError(error), ToastAndroid.LONG);
        else {
          Alert.alert(
            'Error',
            friendlyAuthError(error),
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
      })
  }

  return (
    <AuthLayout title='Welcome back' subtitle='Sign in to pick up your conversations'>
      <AuthInput icon='email' placeholder='Email' value={email} onChangeText={setEmail}
        keyboardType='email-address' autoCapitalize='none' autoCorrect={false} />
      <AuthInput icon='lock' placeholder='Password' value={password} onChangeText={setPassword} secureTextEntry autoCapitalize='none' />

      <Pressable onPress={() => setModalVisible(true)} style={{alignSelf:'flex-end', marginTop:10}} hitSlop={8}>
        <Text style={styles.link}>Forgot password?</Text>
      </Pressable>

      <BusyButton
        onPress={() => handleLogin(email, password)}
        style={({ pressed }) => [{opacity: pressed ? 0.7: 1}, styles.login]}
      >
        <Text style={styles.loginText}>Log in</Text>
      </BusyButton>

      <View style={styles.footerRow}>
        <Text style={styles.footerText}>New here? </Text>
        <Text style={styles.link} onPress={() => navigation.navigate('Register')}>Create an account</Text>
      </View>

      <Modal visible={modalVisible} animationType='fade' transparent={true}
        onRequestClose={() => {setModalVisible(false)}}
      >
        <KeyboardAvoidingView style={styles.outerView} behavior={Platform.OS==='ios'? 'height' : 'padding'}>
            <View style={[styles.innerView, {paddingBottom: 10 + insets.bottom}]}>
              <TextInput placeholder='enter your email' onChangeText={text => emailToReset.current = text} style={styles.inputP}/> 
              {showIndicator? (
                <ActivityIndicator size={50} color='#1da877' animating={showIndicator} style={styles.buttonSubmitAI}/>
                ) : (
                  <Pressable  
                    onPress={sendResetEmail}
                    style={({ pressed }) => [
                      {opacity: pressed ? 0.5: 1}, styles.changeEmailInside
                    ]}
                  >
                    <View style={{flexDirection:'row', alignItems:'center'}}>
                      <Text style={{color:"white", fontSize: 16,}}>Send Reset Email</Text>
                    </View>
                  </Pressable>
                )
              }
            </View>
        </KeyboardAvoidingView>
      </Modal>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  container:{
    flex: 1,
  },
  scrollContainer: {
    alignItems: 'center',
    paddingTop: 150
  },
  homeHeader: {
    flexDirection: 'row', 
    justifyContent:'space-between', 
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
    marginBottom: 12,
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
    color:'#613a5f',
    fontFamily:'Solway-Regular'
  },
  changeEmailInside: {
    padding: 10,
    backgroundColor: '#1da877',
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
    backgroundColor: '#613a5f',
    borderRadius: 24,
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
  buttonSubmitAI: {
    alignSelf:'center',
    marginBottom: 20,
    marginTop: 20,
  },
})