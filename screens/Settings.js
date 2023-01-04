import { useEffect, useState } from 'react'
import { StyleSheet, Text, View, Image, Pressable, ToastAndroid, SafeAreaView,
Alert } from 'react-native'
// import { SafeAreaView } from 'react-native-safe-area-context'
import { getAuth, signOut } from 'firebase/auth';
import { MaterialIcons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';

export default function Settings({ navigation }) {
  const [profilePic, setProfilePic] = useState(null);
  const [userName, setUserName] = useState(null);
  const [email, setEmail] = useState(null);
  const [ID, setID] = useState(null);

  const focused = useIsFocused();
  const user = getAuth().currentUser;

  useEffect(() => {
    const tab = navigation.getParent();
    const user = getAuth().currentUser;

    setProfilePic(user.photoURL);
    setUserName(user.displayName);
    setEmail(user.email);
    setID(user.uid);


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

  return (
    <SafeAreaView style={{flex:1, backgroundColor:'#613a5f'}}>
      <View style={styles.homeHeader}>
        <Text style={{fontSize:19, color:'white', fontFamily:'Solway-Regular', marginLeft:10}}>Settings</Text>
      </View>
      
      <View style={styles.container}>

        <View style={{backgroundColor:'#613a5f',}}>
          <View style={styles.header}> 
            <Image source={{uri: profilePic}} style={{width:100, height:100, borderRadius:100, borderWidth:2, borderColor:'#bab806'}}/>
            
            <View style={styles.userInfo}>
              <Text style={{color:'#bab806', fontSize:20, marginBottom:10}} numberOfLines={1}>{userName}</Text>
              
              
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
            <Text style={{color:'#bfbfb0', fontSize:16, marginLeft:5, flex:5}} numberOfLines={1}>{ID}</Text>
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

        <View>
          <Text style={{color:"white", fontSize: 20, marginTop:20, marginLeft: 10}}>Settings (work in progress)</Text>
        </View>

        <View style={{marginHorizontal:3, backgroundColor:'#dad1e3', paddingVertical:5, marginVertical:20, flex:1, elevation:8}}>
          <Text style={{color:'#201d21', fontSize:18, backgroundColor:'white', padding:5, opacity:0.7}}>Appearance</Text>
        </View>
        
        {/* <View>
          <Text style={{color:"white", fontSize: 20, marginTop:20, marginLeft: 10}}>Version</Text>
        </View>

        <View style={{marginHorizontal:3, backgroundColor:'#dad1e3', padding:5, marginTop:20, marginBottom:20, elevation:8}}>
          <Text>0.2</Text>
        </View> */}

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