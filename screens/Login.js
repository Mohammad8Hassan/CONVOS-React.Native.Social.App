import { useRef, useState, useCallback } from 'react'
import { 
  StyleSheet, Text, View, Button, KeyboardAvoidingView, TouchableOpacity,
  Pressable, ScrollView, Modal, ActivityIndicator, ToastAndroid, Alert
} from 'react-native'
import { TextInput } from 'react-native-gesture-handler'
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail,
  setPersistence } from 'firebase/auth';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import _ from 'lodash';



export default function Login({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [showIndicator, setShowIndicator] = useState(false);

  const emailToReset = useRef('');

  const handleLogin = useCallback(_.debounce(() => {

    signInWithEmailAndPassword(getAuth(), email, password)
      .then(credentials => {
        const user = credentials.user;
        console.log("step 2");
        console.log(user.email);
        
        if(Platform.OS === 'android')
          ToastAndroid.show("Logged in Successfully", ToastAndroid.LONG);
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
      });
  }, 3000, {'leading':true, 'trailing':false}), [email, password])

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
      })
  }

  return (
    <SafeAreaView style={{flex: 1, backgroundColor:'#613a5f'}}>
      <View style={{flex:1, backgroundColor:'#ebebeb'}}>

      <View style={styles.homeHeader}>
        <Text style={{fontSize:19, color:'white', fontFamily:'Solway-Regular', marginLeft:10}}>Login</Text>
      </View>

      <Modal visible={modalVisible} animationType='fade' transparent={true}
        onRequestClose={() => {setModalVisible(false)}}
      >
        <KeyboardAvoidingView style={styles.outerView} behavior={Platform.OS==='ios'? 'height' : null}>
            <View style={styles.innerView}>
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

      <KeyboardAvoidingView style={styles.container}>
          <ScrollView  contentContainerStyle={styles.scrollContainer}>
          
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

            <Pressable  
              onPress={handleLogin}
              style={({ pressed }) => [
                {opacity: pressed ? 0.5: 1}, styles.login
              ]}
              >
              <Text style={{fontFamily:'Solway-Regular', color:"white", fontSize: 18}}>Login</Text>
            </Pressable>


            <View style={{marginTop:20}}>
              <Text style={{fontFamily:'Solway-Regular', color:"#613a5f", fontSize: 16, marginBottom: 10, marginRight: 5}}>
                Forget you password?{' '}
                <Text style={{fontFamily:'Solway-Bold', color: '#a8a628', fontSize:16}} onPress={() => setModalVisible(true)}>Click Here!</Text>
                </Text>
            </View>

            <View style={{marginTop: 50, marginHorizontal:25, }}>
              <Text style={styles.signUp}>
                Don't have an account? {' '}
                <Text style={{fontFamily:'Solway-Bold', color: '#a8a628', fontSize:18}} onPress={() => navigation.navigate('Register')}>Register Here!</Text>
              </Text>
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
        </View>
    </SafeAreaView>
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
    elevation: 8
  
  },
  icons: {
    backgroundColor: 'white',
    marginLeft: 10
  },
  login: {
    padding: 10,
    margin: 20,
    backgroundColor: '#1da877',
    width: 200,
    alignItems: 'center',
    borderRadius: 50,
    elevation: 8
  },
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