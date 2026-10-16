import { StyleSheet, Text, View, Pressable, Alert, ToastAndroid, Platform,
  Modal, TouchableWithoutFeedback, KeyboardAvoidingView, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
//import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { getAuth, signOut, sendEmailVerification, EmailAuthProvider, reauthenticateWithCredential,
  updateEmail } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setRefresh } from '../features/themeSlice';
import { getDoc, getFirestore, doc, updateDoc} from 'firebase/firestore';
import { useRef } from 'react';

export default function Verify({ navigation }) {

  const dispatch = useDispatch();
  const db = getFirestore();
  const user = getAuth().currentUser;
  const mounted = useRef(false);

  const [userInfo, setUserInfo] = useState({});
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailIndicator, setEmailIndicator] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    mounted.current = true;

    getDoc(doc(db, 'Users', getAuth().currentUser.uid))
      .then(res => {
        if(mounted.current == true)
          setUserInfo(res.data())
      })
    
    return () => {
      mounted.current = false;
    }
  }, [])


  const resendEMail = () => {
    sendEmailVerification(getAuth().currentUser)
    .then(()=> {
      if(Platform.OS === 'android')
        ToastAndroid.show('Email re-sent', ToastAndroid.LONG);
      else {
        Alert.alert(
          'Email re-sent',
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
      if(Platform.OS === 'android')
        ToastAndroid.show(error.message, ToastAndroid.LONG);
      else {
        Alert.alert(
          error.message,
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
  }

  const changeEmail = () => {
    setEmailIndicator(true);

    const newEmailString = newEmail.trimEnd().trimStart();

    const cred = EmailAuthProvider.credential(user.email, password);

    reauthenticateWithCredential(user, cred)
      .then(() => {
        updateEmail(user, newEmailString)
          .then(() => {
            updateDoc(doc(db, 'Users', user.uid), {
              email: newEmailString,
              changingEmail: true,
            });

            sendEmailVerification(user)
              .then(() => {
                console.log('email updated');
                setModalVisible(false);
                setEmailIndicator(false);
                
                if(Platform.OS === 'android')
                  ToastAndroid.show('verification email sent', ToastAndroid.SHORT);
                else {
                  Alert.alert(
                    'verification email sent',
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
            
          })
          .catch(error => {
            console.log(error);
            setEmailIndicator(false);
            if(Platform.OS === 'android')
              ToastAndroid.show(error.message, ToastAndroid.SHORT);
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
      })
      .catch(error => {
        console.log(error);
        setEmailIndicator(false);
        if(Platform.OS === 'android')
          ToastAndroid.show(error.message, ToastAndroid.SHORT);
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
    <SafeAreaView style={{flex:1, backgroundColor:'#613a5f'}}>
      <View style={{flex:1, backgroundColor:'#ebebeb'}}>
      
      {/* Modal */}

      <Modal visible={modalVisible} animationType='fade' transparent={true}
        onRequestClose={() => {setModalVisible(false)}}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <KeyboardAvoidingView style={styles.outerView} behavior={Platform.OS==='ios'? 'height' : null}>
            <TouchableWithoutFeedback >
              <View style={styles.innerView}>
                <TextInput placeholder='enter your new email..' value={newEmail} onChangeText={text => setNewEmail(text)} style={styles.inputP}/> 
                <TextInput placeholder='re-enter your password' value={password} onChangeText={text => setPassword(text)} style={styles.inputP} secureTextEntry/> 
                {emailIndicator? (
                  <ActivityIndicator size={50} color='#1da877' animating={emailIndicator} style={{alignSelf:'center'}}/>
                ) : (
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
                )}
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>

        </TouchableWithoutFeedback>
      </Modal>
        <View style={styles.na}>
          <View style={styles.naHeader}>
            <MaterialIcons name='mark-email-unread' color='#853259' size={40} />
            <Text style={{color:'#853259', fontSize:20, fontFamily:'Solway-Bold'}}>Verify Your Email</Text>
          </View>
          <View style={styles.naBody}>
            <Text style={{fontSize:18, color:'#853259', fontFamily:'Solway-Regular'}}>An email has been sent to{"\n"} 
              <Text style={{color:'#858319'}}>{ getAuth().currentUser.email }{"\n"}</Text>
              click 
              the link in the email to complete your registration.</Text>

            
            <View style={{flexDirection:"row", alignSelf:'flex-start', marginTop:20}}>
              <Text style={{fontSize:16, color:'#853259', fontFamily:'Solway-Regular',}}>Didn't get it?</Text>

              <Pressable  
                onPress={resendEMail}
                style={({ pressed }) => [
                  {opacity: pressed ? 0.5: 1},
                ]}
              >
                <Text style={{color:'#858319'}}>  RESEND EMAIL</Text>
              </Pressable>
            </View>
          </View>
        </View>

        <View style={{flex:1}}>
          <Pressable  
            onPress={async () => {
              await getAuth().currentUser.reload()
              dispatch(setRefresh(getAuth().currentUser.emailVerified));
            }}
            style={({ pressed }) => [
              {opacity: pressed ? 0.5: 1}, styles.refresh
            ]}
          >
            <View style={{flexDirection:'row', alignItems:'center'}}>
              <MaterialIcons name='refresh' color='white' size={25} />
              <Text style={{color:"white", fontSize: 20, marginLeft:8,}}>Refresh</Text>
            </View>
          </Pressable>

          {userInfo.changingEmail ? (
            <Pressable  
              onPress={() => setModalVisible(true)}
              style={({ pressed }) => [
                {opacity: pressed ? 0.5: 1}, styles.refresh
              ]}
            >
              <View style={{flexDirection:'row', alignItems:'center'}}>
                <MaterialIcons name='email' color='white' size={25} />
                <Text style={{color:"white", fontSize: 20, marginLeft:8,}}>Change Email</Text>
              </View>
            </Pressable>
          ) : null}
          

          <Pressable  
            onPress={() => {
              signOut(getAuth())
                .then(() => console.log("signed out"))
                .catch(e => console.log(e))
            }}
            style={({ pressed }) => [
              {opacity: pressed ? 0.5: 1}, styles.out
            ]}
          >
            <View style={{flexDirection:'row', alignItems:'center'}}>
              <MaterialIcons name='power-settings-new' color='white' size={25} />
              <Text style={{color:"white", fontSize: 20, marginLeft:8,}}>Sign Out</Text>
            </View>
          </Pressable>
        </View>

      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  na: {
    marginHorizontal:20,
    paddingHorizontal:10,
    alignItems: 'center',
    flex:1,
    justifyContent:'center',
  },
  naHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:'space-around',
    // backgroundColor:'yellow',
    paddingRight:30
  },
  naBody: {
    justifyContent:'center',
    marginTop:10,
    alignItems: 'center',
    // backgroundColor:'yellow',
    paddingHorizontal:10
  },
  out: {
    padding: 10,
    backgroundColor: '#853259',
    alignItems: 'center',
    alignSelf:'stretch',
    marginHorizontal:80,
    marginTop:10,
    marginBottom:20,
    borderRadius: 25,
    shadowOffset: {width:0, height:3},
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation:8
  },
  refresh: {
    padding: 10,
    backgroundColor: '#a8a628',
    alignItems: 'center',
    alignSelf:'stretch',
    marginBottom:20,
    marginHorizontal:80,
    borderRadius: 25,
    shadowOffset: {width:0, height:3},
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation:8
  },
  changeEmailInside: {
    padding: 10,
    backgroundColor: '#1da877',
    alignItems: 'center',
    marginHorizontal:50,
    borderRadius:15,
    elevation:8,
    shadowOffset: {width:0, height:5},
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  outerView: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)'
  },
  innerView: {
    backgroundColor: '#806b96',
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
})