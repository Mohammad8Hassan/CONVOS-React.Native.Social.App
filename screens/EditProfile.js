import { useEffect, useRef, useState,} from 'react'
import { StyleSheet, Text, View, Image, Pressable, TextInput, KeyboardAvoidingView,
   ScrollView, Modal, ToastAndroid, ActivityIndicator, Alert, 
   TouchableWithoutFeedback, Platform } from 'react-native'

import { SafeAreaView } from 'react-native-safe-area-context';//import { SafeAreaView } from 'react-native-safe-area-context'
import { getAuth, signOut, reauthenticateWithCredential, updateProfile, EmailAuthProvider,
  updateEmail, sendEmailVerification, sendPasswordResetEmail } from 'firebase/auth';
import { MaterialIcons } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import { getStorage, ref, uploadBytes, getDownloadURL, getMetadata, } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import { useIsFocused } from '@react-navigation/native';
import { updateDoc, getFirestore, doc,  onSnapshot} from 'firebase/firestore';
import { useDispatch } from 'react-redux';
import { setRefresh } from '../features/themeSlice';
import { loadImage } from '../shared/imageCache';
import { confirm } from '../shared/confirm';


export default function EditProfile({ navigation }) {
  const [userName, setUserName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalPassword, setModalPassword] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  const [indicator, setIndicator] = useState(false);
  const [emailIndicator, setEmailIndicator] = useState(false);
  const [passwordIndicator, setPasswordIndicator] = useState(false);
  const [nameIndicator, setNameIndicator] = useState(false);
  const [photoUrl, setPhotoUrl] = useState(null);

  const db = getFirestore();
  const storage = getStorage();
  const user = getAuth().currentUser;
  const dispatch = useDispatch();
  const currentPassword = useRef('');
  const downloadUrl = 'https://firebasestorage.googleapis.com/v0/b/convos-app-1.appspot.com/o/avatar.png?alt=media&token=b4652957-e5dc-43b1-8c92-ff6f317611de';

  useEffect(() => {
    const unsubscribeUser = onSnapshot(doc(db, 'Users', user.uid), async snapShot => {
      // REFACTOR NOTE: no guard here before - on a cold start with no network the first snapshot comes
      // from an empty cache, data() is undefined and `.Photo` threw "Cannot read property 'Photo' of undefined".
      if(!snapShot.exists()) return;
      const photo = await loadImage(snapShot.data().Photo, snapShot.data().photoExtension);
      setPhotoUrl(photo);
    }, error => {console.log(error)})

    return () => {
      unsubscribeUser();
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
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1
    });

    if(!result.cancelled) {
      setIndicator(true);
      setPhotoUrl(null);
      const refc = ref(storage, 'Profile Photos/' + user.uid)
      const img = await fetch(result.uri);
      const bytes = await img.blob();
      
      await uploadBytes(refc, bytes);
      
      const [url_Temp, meta] = await Promise.all([
         getDownloadURL(refc),
         getMetadata(refc)
      ])

      await Promise.all([
        updateProfile(user, {
          photoURL: url_Temp,
        }),
        updateDoc(doc(db, 'Users', user.uid), {
          Photo: url_Temp,
          photoExtension: meta.contentType.split('/')[1],
        })
      ])
      
      setIndicator(false);
    };
  }

  const removePhoto = async () => {
    setIndicator(true);

    await Promise.all([
      updateProfile(user, {
        photoURL: downloadUrl
      }),
      updateDoc(doc(db, 'Users', user.uid), {
        Photo: downloadUrl,
        photoExtension: '.png',
      })
    ])
    
    setIndicator(false);
  }

  const changeName = async () => {
    setNameIndicator(true);

    const newName = firstName.trimStart().trimEnd() + ' ' + lastName.trimStart().trimEnd();

    await Promise.all([
      updateProfile(user, {
        displayName: newName,
      }),

      updateDoc(doc(db, 'Users', user.uid), {
        Name: newName,
      })
    ])
    
    setUserName(newName);

    setNameIndicator(false);
    
    if(Platform.OS === 'android')
      ToastAndroid.show('Name changed successfuly', ToastAndroid.SHORT);
    else {
      Alert.alert(
        'Name changed successfuly',
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
              .then(async () => {
                console.log('email updated');
                await getAuth().currentUser.reload()
                dispatch(setRefresh(getAuth().currentUser.emailVerified));

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
  
  const showAlertEmail = () => {
    // REFACTOR NOTE: this used to be an inline Alert.alert(...) with Cancel + "proceed" buttons (~16 lines); now uses confirm().
    confirm('Change Email?', 'You will not be able to access your account until you verify the new email address', () => setModalVisible(true), 'proceed')
  }

  const showAlertRemove = () => {
    // REFACTOR NOTE: this used to be an inline Alert.alert(...) with Cancel + "confirm" buttons (~16 lines); now uses confirm().
    confirm('Remove your profile picture?', '', () => removePhoto())
  }

  // REFACTOR NOTE: checkCache / cacheImage / loadImage used to be defined right here (~54 lines,
  // identical copy in 7 screens). They are now imported from ../shared/imageCache.

  const changePassword = () => {
    setPasswordIndicator(true);

    const cred = EmailAuthProvider.credential(user.email, currentPassword.current);

    reauthenticateWithCredential(user, cred)
      .then(() => {
        sendPasswordResetEmail(getAuth(), user.email)
          .then(res => {
            setModalPassword(false);
            setPasswordIndicator(false);

            if(Platform.OS === 'android')
              ToastAndroid.show('password reset email sent', ToastAndroid.SHORT);
            else {
              Alert.alert(
                'password reset email sent',
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
            console.log(error);
            setPasswordIndicator(false);
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
        setPasswordIndicator(false);
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

{/* Template */}  

  return (
    <SafeAreaView style={{flex:1, backgroundColor:'#613a5f',}}>
      <KeyboardAvoidingView style={{flex:1, backgroundColor:'#613a5f',}} behavior={Platform.OS==='ios'? 'height' : null}>
        <ScrollView contentContainerStyle={{ flexGrow: 1}}>
          
          <View style={styles.homeHeader}>
            <Pressable 
              onPress={() => navigation.goBack()}
              style={({ pressed }) => [
                {opacity: pressed ? 0.5: 1},
              ]}
              >
              <Ionicons name='chevron-back-circle' size={27} color="white" />
            </Pressable>
            <Text style={{flex:1, fontSize:19, color:'white', fontFamily:'Solway-Regular', marginLeft:10}}>Edit Profile</Text>
          </View>

          {/* MODAL */}

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
      
          {/* MODAL Password*/}

          <Modal visible={modalPassword} animationType='fade' transparent={true}
            onRequestClose={() => {setModalPassword(false)}}
          >
            <TouchableWithoutFeedback onPress={() => setModalPassword(false)}>
              <KeyboardAvoidingView style={styles.outerView} behavior={Platform.OS==='ios'? 'height' : null}>
                <TouchableWithoutFeedback >
                  <View style={styles.innerView}>
                    <Text style={{color:'white', fontSize:17, marginHorizontal:10, alignSelf:'center', marginBottom:10}}>
                      A password reset email will be sent to{"\n"}
                      <Text style={{color:'#d4c86e'}}>{user.email} {"\n"}</Text>
                      click the link in the email to change your password
                    </Text>
                    <TextInput placeholder='enter your current password' onChangeText={text => currentPassword.current=text} style={styles.inputP} secureTextEntry/> 
                    {passwordIndicator? (
                      <ActivityIndicator size={50} color='#1da877' animating={passwordIndicator} style={{alignSelf:'center'}}/>
                    ) : (
                      <Pressable  
                        onPress={changePassword}
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
          {/* CONTAINER */}

          <View style={styles.container}>

            {/* profile picture  */}
            <View style={{backgroundColor:'#8c7699', elevation:15, marginBottom:20, paddingVertical:8, marginTop:15, shadowOffset: {width:0, height:5}, shadowOpacity: 0.3, shadowRadius: 3,}}>
              <View>
                <Text style={{fontFamily:'Solway-Regular', color:"white", fontSize: 20, marginLeft: 10, marginBottom:10}}>Profile Picture</Text>
              </View>

              <View style={styles.header}>
                <View style={styles.ppContainer}>
                  {!indicator? (
                    <Image source={{uri: photoUrl}} style={{width:120, height:120, borderRadius:100, borderWidth:2, borderColor:'#806b96', marginBottom:8}}/>
                  ) : (
                    <ActivityIndicator size={80} color='#613a5f' animating={indicator} style={{width:120, height:120, borderRadius:100, borderWidth:2, borderColor:'#806b96', marginBottom:8}} />
                  )}
                </View>
                
                {indicator? null : (
                  <View style={styles.userInfo}>
                    <Pressable  
                        onPress={changePhoto}
                        style={({ pressed }) => [
                        {opacity: pressed ? 0.5: 1, marginBottom:10}, styles.edit
                      ]}
                    >
                      <View style={{flexDirection:'row', alignItems:'center'}}>
                        <Text style={{color:"#806b96", fontSize: 20,}}>Change</Text>
                      </View>
                    </Pressable>
                    {user.photoURL == downloadUrl? null : (
                      <Pressable  
                          onPress={showAlertRemove}
                          style={({ pressed }) => [
                          {opacity: pressed ? 0.5: 1}, styles.edit
                        ]}
                      >
                        <View style={{flexDirection:'row', alignItems:'center'}}>
                          <Text style={{color:"#ad103c", fontSize: 20,}}>Remove</Text>
                        </View>
                      </Pressable>
                    )}
                    
                  </View>
                )}
              </View>
            </View>

            {/* Name  */}
            <View style={{backgroundColor:'#8c7699', elevation:15, marginBottom:20, paddingVertical:8, marginTop:15, shadowOffset: {width:0, height:5}, shadowOpacity: 0.3, shadowRadius: 3, }}>
              <View style={{flexDirection:'row',}}>
                <Text style={{fontFamily:'Solway-Regular', color:"white", fontSize: 20, marginLeft: 10, flex:1}}>Name</Text>
                <Text style={{fontFamily:'Solway-Bold', color:"#d4c86e", fontSize: 20, flex:3,}}>{ user.displayName }</Text>
              </View>

              <View style={{paddingVertical:5, marginTop:10, paddingRight:5}}>
                <View style={{flexDirection:'row', alignItems:'center', paddingHorizontal:8}}>
                  <TextInput placeholder='first name' value={firstName} onChangeText={text => setFirstName(text)} style={styles.input}/> 
                </View>

                <View style={{flexDirection:'row', alignItems:'center', paddingHorizontal:8}}>
                  <TextInput placeholder='last name' value={lastName} onChangeText={text => setLastName(text)} style={styles.input}/> 
                </View>

                {nameIndicator? (
                  <ActivityIndicator size={50} color='#1da877' animating={nameIndicator} style={{alignSelf:'center', marginTop:15}}/>
                ) : (
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
                )}
                
              </View>
            </View>

            {/* Email  */}
            <View style={{backgroundColor:'#8c7699', elevation:15, marginBottom:15, paddingVertical:10, marginTop:15, shadowOffset: {width:0, height:5}, shadowOpacity: 0.3, shadowRadius: 3, }}>
              <View>
                <Text style={{fontFamily:'Solway-Regular', color:"white", fontSize: 20, marginLeft: 10}}>Email</Text>
              </View>

              <View style={{marginRight:8,}}> 
                <Text style={styles.inputE}>
                  { user.email }
                </Text>
                <Pressable  
                  onPress={() => showAlertEmail()}
                  style={({ pressed }) => [
                    {opacity: pressed ? 0.5: 1}, styles.changeEmail
                  ]}
                >
                  <View style={{flexDirection:'row', alignItems:'center'}}>
                    <Text style={{color:"#806b96", fontSize: 18,}}>Change Email</Text>
                  </View>
                </Pressable>
              </View>
            </View>

            {/* Password  */}
            <View style={{backgroundColor:'#8c7699', elevation:15, marginBottom:15, paddingVertical:10, marginTop:15, shadowOffset: {width:0, height:5}, shadowOpacity: 0.3, shadowRadius: 3, }}>
              <View>
                <Text style={{fontFamily:'Solway-Regular', color:"white", fontSize: 20, marginLeft: 10}}>Password</Text>
              </View>

              <View style={{alignItems:'center'}}> 
                <Pressable  
                  onPress={() => setModalPassword(true)}
                  style={({ pressed }) => [
                    {opacity: pressed ? 0.5: 1}, styles.changePassword
                  ]}
                >
                  <View style={{flexDirection:'row', alignItems:'center'}}>
                    <Text style={{color:"#806b96", fontSize: 18,}}>Change Password</Text>
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
    elevation:8,
    shadowOffset: {width:0, height:5},
    shadowOpacity: 0.3,
    shadowRadius: 5,
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
    padding: 10,
    flex:1,
    backgroundColor: '#d4c86e',
    alignItems: 'center',
    borderRadius:10,
    elevation:10,
    alignSelf:'stretch',
    marginHorizontal: 50,
    shadowOffset: {width:0, height:5},
    shadowOpacity: 0.3,
    shadowRadius: 5,
    marginTop:10,
  },
  changePassword: {
    padding: 10,
    flex:1,
    backgroundColor: '#d4c86e',
    alignItems: 'center',
    borderRadius:10,
    elevation:10,
    alignSelf:'stretch',
    marginHorizontal: 50,
    shadowOffset: {width:0, height:5},
    shadowOpacity: 0.3,
    shadowRadius: 5,
    marginTop:10,
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
  apply: {
    padding: 10,
    backgroundColor: '#1da877',
    alignItems: 'center',
    marginTop:15,
    borderRadius: 15,
    elevation:8,
    alignSelf:'stretch',
    marginHorizontal: 50,
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