import { StyleSheet, Text, View, Pressable, SafeAreaView, Alert, ToastAndroid, Platform } from 'react-native';
//import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { getAuth, signOut, sendEmailVerification } from 'firebase/auth';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setRefresh } from '../features/themeSlice';

export default function Verify({ navigation }) {

  const dispatch = useDispatch();
  
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


  return (
    <SafeAreaView style={{flex:1, backgroundColor:'#613a5f'}}>
      <View style={{flex:1, backgroundColor:'#ebebeb'}}>
        
        <View style={styles.na}>
          <View style={styles.naHeader}>
            <MaterialIcons name='mark-email-unread' color='#853259' size={40} style={{flex:1, paddingLeft:8}}/>
            <Text style={{flex:6, color:'#853259', fontSize:20, fontFamily:'Solway-Bold'}}>Verify Your Email</Text>
          </View>
          <View style={styles.naBody}>
            <Text style={{fontSize:18, color:'#853259', fontFamily:'Solway-Regular'}}>An email has been sent to 
              <Text style={{color:'#858319'}}> { getAuth().currentUser.email }</Text>
              , click 
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
  },
  naBody: {
    justifyContent:'center',
    marginTop:10,
    alignItems: 'center'
  },
  out: {
    padding: 10,
    backgroundColor: '#853259',
    width: 150,
    alignItems: 'center',
    alignSelf:'center',
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
    width: 150,
    alignItems: 'center',
    alignSelf:'center',
    marginBottom:20,
    borderRadius: 25,
    shadowOffset: {width:0, height:3},
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation:8
  },
})