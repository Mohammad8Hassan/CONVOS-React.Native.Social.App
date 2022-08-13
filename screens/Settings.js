import { useEffect, useState } from 'react'
import { StyleSheet, Text, View, Image, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { getAuth, signOut } from 'firebase/auth';
import { MaterialIcons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';

export default function Settings({ navigation }) {
  const [profilePic, setProfilePic] = useState(null);
  const [userName, setUserName] = useState(null);
  const [email, setEmail] = useState(null);

  const focused = useIsFocused();

  useEffect(() => {
    const user = getAuth().currentUser;

    setProfilePic(user.photoURL);
    setUserName(user.displayName);
    setEmail(user.email);
  }, [focused])

  return (
    <SafeAreaView style={{flex:1,}}>
      <View style={styles.homeHeader}>
        <Text style={{fontSize:18, color:'white'}}>Settings</Text>
      </View>
      
      <View style={styles.container}>

        <View style={styles.header}>
          <View>
            <Image source={{uri: profilePic}} style={{width:120, height:120, borderRadius:100, borderWidth:2, borderColor:'#806b96'}}/>
          </View>
          
          <View style={styles.userInfo}>
            <Text style={{color:'#201d21', fontSize:20, marginBottom:10}} numberOfLines={1}>{userName}</Text>
            <Text style={{color:'#201d21', fontSize:20, marginBottom:10}} numberOfLines={1}>{email}</Text>
            <Pressable  
                onPress={() => navigation.navigate("Edit Profile")}
                style={({ pressed }) => [
                {opacity: pressed ? 0.5: 1}, styles.edit
              ]}
            >
              <View style={{flexDirection:'row', alignItems:'center'}}>
                <MaterialIcons name='edit' color='#806b96' size={25} />
                <Text style={{color:"#806b96", fontSize: 20, marginLeft:8}}>Edit</Text>
              </View>
            </Pressable>
          </View>
        </View>

        <View>
          <Text style={{color:"white", fontSize: 20, marginTop:20, marginLeft: 10}}>Settings</Text>
        </View>

        <View style={{marginHorizontal:3, backgroundColor:'#dad1e3', paddingVertical:5, marginTop:20, flex:1, elevation:8}}>
          <Text style={{color:'#201d21', fontSize:18, backgroundColor:'white', padding:5, opacity:0.7}}>Appearance</Text>
        </View>
        
        <View>
          <Text style={{color:"white", fontSize: 20, marginTop:20, marginLeft: 10}}>Version</Text>
        </View>

        <View style={{marginHorizontal:3, backgroundColor:'#dad1e3', padding:5, marginTop:20, marginBottom:20, elevation:8}}>
          <Text>0.2</Text>
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
    backgroundColor: '#524d57',
    padding: 10
  },
  container: {
    flex: 1,
    backgroundColor:'#806b96',
    
  },
  header: {
    flexDirection: 'row',
    margin: 5,
    backgroundColor: '#d46ebc',
    padding: 10,
  },
  userInfo: {
    marginLeft: 40,
    flexShrink:1
  },
  edit: {
    padding: 10,
    backgroundColor: '#d4c86e',
    width: 150,
    alignItems: 'center',
    borderRadius:10
  },
  out: {
    padding: 10,
    backgroundColor: 'red',
    width: 150,
    alignItems: 'center',
    alignSelf:'center',
    marginTop:'auto',
    marginBottom:40,
    borderRadius: 25
  },
})