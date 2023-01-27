import { useEffect, useState } from 'react'
import { StyleSheet, Text, View, Image, Pressable, ToastAndroid, SafeAreaView,
Alert, Switch, Platform } from 'react-native'
// import { SafeAreaView } from 'react-native-safe-area-context'
import { getAuth, signOut } from 'firebase/auth';
import { MaterialIcons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from "expo-file-system";
import { onSnapshot, doc, getFirestore } from 'firebase/firestore';
import { useDispatch, useSelector } from 'react-redux';
import { setLightTheme, setDarkTheme } from '../features/themeSlice';
import * as NavigationBar from 'expo-navigation-bar';

export default function Settings({ navigation }) {
  const [photoUrl, setPhotoUrl] = useState(null);
  const [updater, setUpdater] = useState(false);

  const user = getAuth().currentUser;
  const db = getFirestore();
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

  const checkCache = async (uri) => {
    try {
      let info = await FileSystem.getInfoAsync(uri);
      return { ...info, err: false };
    } catch (error) {
      return {
        exists: false,
        err: true,
        msg: error,
      };
    }
  }

  const cacheImage = async (uri, cacheUri) => {
    // console.log('will download');
    try {
      const createDownload = FileSystem.createDownloadResumable(
        uri,
        cacheUri,
      );
      const downloadImage = await createDownload.downloadAsync();
      return {
        cached: true,
        err: false,
        path: downloadImage.uri,
      };
    } 
    catch (error) {
      return {
        cached: false,
        err: true,
        msg: error,
      };
    }
  }

  const loadImage = async (photo, photoExtension) => {
    const newUri = /[^=]*$/.exec(photo)[0];
    const cacheFileUri = `${FileSystem.cacheDirectory}${newUri}.${photoExtension}`;
    const isNew = await checkCache(cacheFileUri);
    if (isNew.exists) {
      // console.log("cached!");
      return cacheFileUri;
    } else {
      let cached = await cacheImage(photo, cacheFileUri);
      if (cached.cached) {
        // console.log("cached new!");
        return cached.path;
      } else {
        console.log("Couldn't load Image!");
        console.log(cached.msg)
      }
    }
  }

  const toggleSwitch = () => {
    if(theme) {
      if(Platform.OS === 'android') {
        NavigationBar.setBackgroundColorAsync("#613a5f");
        NavigationBar.setButtonStyleAsync('light');
      }
      dispatch(setDarkTheme());
    }
    else {
      if(Platform.OS === 'android') {
        NavigationBar.setBackgroundColorAsync("white");
        NavigationBar.setButtonStyleAsync('dark');
      }
      dispatch(setLightTheme());
    }
  }

  return (
    <SafeAreaView style={{flex:1, backgroundColor:mainColor}}>
      <View style={[styles.homeHeader, {backgroundColor:mainColor}]}>
        <Text style={{fontSize:19, color:'white', fontFamily:'Solway-Regular', marginLeft:10}}>Settings</Text>
      </View>
      
      <View style={[styles.container, {backgroundColor:backgroundColor}]}>

        <View style={{backgroundColor:mainColor}}>
          <View style={[styles.header, {backgroundColor:mainColor}]}> 
            <Image source={{uri: photoUrl}} style={{width:100, height:100, borderRadius:100, borderWidth:2, borderColor:'#bab806'}}/>
            
            <View style={styles.userInfo}>
              <Text style={{color:'#bab806', fontSize:20, marginBottom:10}} numberOfLines={1}>{user.displayName}</Text>
              
              
              <Pressable  
                  onPress={() => navigation.navigate("Edit Profile")}
                  style={({ pressed }) => [
                  {opacity: pressed ? 0.5: 1}, styles.edit
                ]}
              >
                <View style={{flexDirection:'row', alignItems:'center'}}>
                  <MaterialIcons name='edit' color='#806b96' size={25} />
                  <Text style={{color:"#806b96", fontSize: 18, marginLeft:8}}>Edit Account</Text>
                </View>
              </Pressable>
            </View>
          </View>
          <View style={{flexDirection:'row', alignItems:'center', marginBottom:10, paddingHorizontal:5}}>
            <Text style={{color:'#bfbfb0', fontSize:Platform.OS==='android'?15:13, marginLeft:5, flex:5}} numberOfLines={1}>{user.uid}</Text>
            <Pressable
              onPress={copyToClipboard}
              style={({ pressed }) => [
                {opacity: pressed ? 0.5: 1}, styles.copyID
              ]}
            >
              <View style={{flexDirection:'row', alignItems:'center',}}>
                {/* <Text style={{color:"#806b96", fontSize: 15, marginRight:3}}>Copy ID</Text> */}
                <MaterialIcons name='file-copy' size={17} color='#806b96' />
              </View>
            </Pressable>
          </View>
        </View>

        {/* <View>
          <Text style={{color:titleColor, fontSize: 20, marginTop:20, marginLeft: 10}}>Settings (work in progress)</Text>
        </View> */}

        <View style={{marginHorizontal:3, backgroundColor:optionsBackground, paddingVertical:5, marginVertical:20, flex:1, elevation:8}}>
          <Text style={{color:optionsColor, fontSize:18, backgroundColor:optionsBar, padding:5,}}>Theme</Text>
          
          <View style={{flexDirection:'row', alignItems:'center', backgroundColor:optionsBar, paddingHorizontal:5, padding:Platform.OS=='ios'?5:null}}>
            <Text style={{color:optionsColor, fontSize:16,}}>Default</Text>
            <Switch value={theme} onValueChange={toggleSwitch} trackColor={{true:'#613a5f'}} style={{ marginHorizontal:Platform.OS=='ios'?8:null}}/>
            <Text style={{color:optionsColor, fontSize:16,}}>Light</Text>
          </View>
        </View>
        
        

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

    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  homeHeader: {
    flexDirection: 'row', 
    justifyContent:'space-between', 
    alignItems:'center',
    backgroundColor: '#613a5f',
    padding: 5
  },
  container: {
    flex: 1,
    backgroundColor:'#806b96',
    
  },
  header: {
    flexDirection: 'row',
    backgroundColor: '#613a5f',
    padding: 10,
  },
  userInfo: {
    marginLeft: 20,
    flexShrink:1,
    flex:1,
  },
  edit: {
    padding: 8,
    backgroundColor: '#d4c86e',
    alignItems: 'center',
    borderRadius:10
  },
  out: {
    padding: 10,
    backgroundColor: '#853259',
    width: 150,
    alignItems: 'center',
    alignSelf:'center',
    marginTop:'auto',
    marginBottom:20,
    borderRadius: 25,
    shadowOffset: {width:0, height:3},
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation:8
  },
  copyID: {
    padding: 5,
    backgroundColor: '#d4c86e',
    alignItems: 'center',
    borderRadius:20,
    flex:1
  },
})