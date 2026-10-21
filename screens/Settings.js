import { useEffect, useState, useCallback } from 'react'
import { StyleSheet, Text, View, Image, Pressable, ToastAndroid, Alert, Switch, Platform } from 'react-native'

import { SafeAreaView } from 'react-native-safe-area-context';// import { SafeAreaView } from 'react-native-safe-area-context'
import { getAuth, signOut } from 'firebase/auth';
import { MaterialIcons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import { onSnapshot, doc, getFirestore, initializeFirestore, updateDoc } from 'firebase/firestore';
import { useDispatch, useSelector } from 'react-redux';
import { setLightTheme, setDarkTheme } from '../features/themeSlice';
import * as NavigationBar from 'expo-navigation-bar';
import { getApp } from 'firebase/app';
import _ from 'lodash';
import { loadImage } from '../shared/imageCache';
import QRCodeModal from '../shared/QRCodeModal';


export default function Settings({ navigation }) {
  const [photoUrl, setPhotoUrl] = useState(null);
  const [updater, setUpdater] = useState(false);
  const [qrVisible, setQrVisible] = useState(false);

  const user = getAuth().currentUser;
  const db = getFirestore();

  // const db = initializeFirestore(getApp(), {experimentalForceLongPolling: true, useFetchStreams:false});
  const focused = useIsFocused();

  const dispatch = useDispatch();
  
  //redux store
  const { mainColor, backgroundColor, tabColor, iconColor,
    iconActiveColor, conAuthorBarColor, convAuthorTextColor, homeConvTitleColor,
    homeConvBodyColor, topButtonsColors, userNameColor, userIDColor, actionColor, actionInsideColor,
    headerTextColor, convAuthorPic, topButtonsBar, titleBackground, inviteBackground, inviteAuthor, inviteDate,
    titleColor, selectorColor, addButton, addButtonInside, friendBackground, optionsBackground, optionsColor,
    optionsBar, theme
  } = useSelector(state => state.theme);

  useEffect(() => {
    const unsubscribeUser = onSnapshot(doc(db, 'Users', user.uid), async snapShot => {
      if(!snapShot.exists()) return;
      const photo = await loadImage(snapShot.data().Photo, snapShot.data().photoExtension);
      setPhotoUrl(photo);
    }, error => {console.log(error)})

    return () => {
      unsubscribeUser();
    }
  }, [])

  useEffect(() => {
    setUpdater(prev => {return !prev});
  }, [focused])

  
  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(user.uid);
    if(Platform.OS === 'android')
    ToastAndroid.show('ID copied', ToastAndroid.SHORT);
    else {
      Alert.alert(
        'ID Copied to clipboard',
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

  const toggleSwitch = () => {
    if(theme) {
      if(Platform.OS === 'android') {
        NavigationBar.setStyle('dark');
      }
      dispatch(setDarkTheme());
    }
    else {
      if(Platform.OS === 'android') {
        NavigationBar.setStyle('light');
      }
      dispatch(setLightTheme());
    }
  }

  const LogOut = useCallback(_.debounce(() => {

    updateDoc(doc(db, 'Users', user.uid), {
      ExpoPushToken: null
    })
    .then(() => {
      signOut(getAuth())
      .then(() => console.log("signed out"))
      .catch(e => console.log(e))
    })

  }, 3000, {"leading": true, "trailing": false}), [])


  return (
    <SafeAreaView style={{flex:1, backgroundColor:mainColor}}>
      <View style={[styles.container, {backgroundColor:backgroundColor}]}>
        <QRCodeModal visible={qrVisible} onClose={() => setQrVisible(false)} title='My ID' caption={user.displayName}
          value={user.uid} onCopy={copyToClipboard} />

        <View style={[styles.top, {backgroundColor:mainColor}]}>
          <View style={styles.homeHeader}>
            <Text style={{fontSize:19, color:'white', fontFamily:'Solway-Regular', marginLeft:10}}>Settings</Text>
          </View>

          <View style={styles.header}>
            <Image source={{uri: photoUrl}} style={{width:84, height:84, borderRadius:42, borderWidth:2.5, borderColor:'#d4c86e'}}/>

            <View style={styles.userInfo}>
              <Text style={{color:'white', fontSize:20, fontWeight:'700', marginBottom:4}} numberOfLines={1}>{user.displayName}</Text>
              <View style={{flexDirection:'row', alignItems:'center', marginBottom:10}}>
                <Text style={{color:'#cfc6d6', fontSize:12, flex:1}} numberOfLines={1}>{user.uid}</Text>
                <Pressable
                  onPress={() => setQrVisible(true)}
                  style={({ pressed }) => [
                    {opacity: pressed ? 0.5: 1}, styles.copyID, {marginRight: 6}
                  ]}
                >
                  <MaterialIcons name='qr-code' size={15} color='#613a5f' />
                </Pressable>
                <Pressable
                  onPress={copyToClipboard}
                  style={({ pressed }) => [
                    {opacity: pressed ? 0.5: 1}, styles.copyID
                  ]}
                >
                  <MaterialIcons name='file-copy' size={15} color='#613a5f' />
                </Pressable>
              </View>

              <Pressable
                  onPress={() => navigation.navigate("Edit Profile")}
                  style={({ pressed }) => [
                  {opacity: pressed ? 0.5: 1}, styles.edit
                ]}
              >
                <MaterialIcons name='edit' color='#613a5f' size={18} />
                <Text style={{color:"#613a5f", fontSize: 15, fontWeight:'600', marginLeft:6}}>Edit Account</Text>
              </Pressable>
            </View>
          </View>
        </View>

        <View style={[styles.optionsCard, {backgroundColor:'white'}]}>
          <Text style={{color:iconActiveColor, fontSize:13, fontWeight:'700', letterSpacing:0.5, marginBottom:8}}>THEME</Text>

          <View style={{flexDirection:'row', alignItems:'center'}}>
            <Text style={{color:'#5f5368', fontSize:16}}>Default</Text>
            <Switch value={theme} onValueChange={toggleSwitch} trackColor={{true:'#613a5f'}} style={{ marginHorizontal:Platform.OS=='ios'?8:6}}/>
            <Text style={{color:'#5f5368', fontSize:16}}>Light</Text>
          </View>
        </View>

        <View style={[styles.optionsCard, {backgroundColor:'white', paddingVertical: 6}]}>
          {[['Notifications', 'notifications', 'Notifications'], ['Privacy', 'lock', 'Privacy & blocking']].map(([route, icon, label]) => (
            <Pressable
              key={route}
              onPress={() => navigation.navigate(route)}
              style={({ pressed }) => [{opacity: pressed ? 0.5: 1, flexDirection:'row', alignItems:'center', paddingVertical: 12}]}
            >
              <MaterialIcons name={icon} size={22} color={iconActiveColor} />
              <Text style={{flex:1, color:'#5f5368', fontSize:16, marginLeft:12}}>{ label }</Text>
              <MaterialIcons name='chevron-right' size={22} color='#b9a9c4' />
            </Pressable>
          ))}
        </View>

        <Pressable
          onPress={LogOut}
          style={({ pressed }) => [
            {opacity: pressed ? 0.5: 1}, styles.out
           ]}
        >
          <MaterialIcons name='power-settings-new' color='white' size={22} />
          <Text style={{color:"white", fontSize: 17, fontWeight:'600', marginLeft:8,}}>Sign Out</Text>
        </Pressable>
      </View>

    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  top: {
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    overflow: 'hidden',
    paddingBottom: 18,
  },
  homeHeader: {
    flexDirection: 'row',
    alignItems:'center',
    paddingVertical: 10,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 6,
  },
  userInfo: {
    marginLeft: 16,
    flexShrink:1,
    flex:1,
  },
  edit: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: '#d4c86e',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 20,
  },
  optionsCard: {
    marginHorizontal: 12,
    marginTop: 18,
    padding: 16,
    borderRadius: 18,
    elevation: 3,
  },
  out: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 28,
    backgroundColor: '#853259',
    alignItems: 'center',
    alignSelf:'center',
    marginTop:'auto',
    marginBottom:20,
    borderRadius: 25,
    elevation:4
  },
  copyID: {
    padding: 5,
    marginLeft: 8,
    backgroundColor: '#d4c86e',
    alignItems: 'center',
    borderRadius:14,
  },
})
