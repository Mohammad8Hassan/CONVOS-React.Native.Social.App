import { StyleSheet, Text, View, TextInput, Pressable,  } from 'react-native'
import { useState } from 'react'
import { EmailAuthProvider, getAuth, reauthenticateWithCredential, updateEmail } from 'firebase/auth';

export default function ChangeEmail() {
  const [isSignedin, setIsSignedin] = useState(false);
  const [email, setEmail] = useState(null);
  const [password, setPassword] = useState('');

  const user = getAuth().currentUser;

  const authenticateUser = () => {
    const cred = EmailAuthProvider.credential(user.email, password);

    reauthenticateWithCredential(user, cred)
      .then(() => {
        console.log('verified');
        setIsSignedin(true);
      })
      .catch(error => {
        console.log(error);
      })
  }

  const changeEmail = () => {
    const cred = EmailAuthProvider.credential(user.email, password);

    reauthenticateWithCredential(user, cred)
      .then(() => {
        updateEmail(user, email)
          .then(() => {
            console.log('email updated');
          })
          .catch(error => {
            console.log(error);
          })
      })
      .catch(error => {
        console.log(error);
      })
    
  }

  return (
    <View style={{flex:1}}>
      <View style={styles.homeHeader}>
        <Text style={{fontSize:18, color:'white'}}>Change Email</Text>
      </View>

      { isSignedin == true ? (
          
            <View style={styles.container}>
              <View>
                <Text style={{color:"white", fontSize: 20, marginTop:20, marginLeft: 10}}>New Email</Text>
              </View>

              <View style={{alignItems:'stretch', marginTop:10}}>
                <TextInput placeholder='enter your new email..' value={email} onChangeText={text => setEmail(text)} style={styles.inputE}/> 
                <Pressable  
                  onPress={changeEmail}
                  style={({ pressed }) => [
                    {opacity: pressed ? 0.5: 1}, styles.changeEmail
                  ]}
                >
                  <View style={{flexDirection:'row', alignItems:'center'}}>
                    <Text style={{color:"#806b96", fontSize: 16,}}>Change</Text>
                  </View>
                </Pressable>
              </View>
            </View>
          
        ) : (
          <View style={styles.container}>
            <View>
              <Text style={{color:"white", fontSize: 20, marginTop:20, marginLeft: 10}}>Enter Your Password</Text>
            </View>

            <View style={{alignItems:'stretch', marginTop:10}}>
              <TextInput placeholder='password..' value={password} onChangeText={text => setPassword(text)} style={styles.inputP} secureTextEntry/> 
              <Pressable  
                onPress={authenticateUser}
                style={({ pressed }) => [
                  {opacity: pressed ? 0.5: 1}, styles.changeEmail
                ]}
              >
                <View style={{flexDirection:'row', alignItems:'center'}}>
                  <Text style={{color:"#806b96", fontSize: 16,}}>Confirm</Text>
                </View>
              </Pressable>
            </View>
          </View>
          
        )
      }
    </View>
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
  changeEmail: {
    padding: 8,
    backgroundColor: '#d4c86e',
    alignItems: 'center',
    borderRadius:20,
    elevation:8,
    marginHorizontal:150,
    marginTop: 20
  },
  inputE:{
    backgroundColor: 'white',
    fontSize: 20,
    padding: 6,
    paddingLeft: 10,
    borderTopRightRadius: 18,
    borderBottomRightRadius: 18,
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
    elevation:8,
    marginHorizontal: 15
  },
  inputP:{
    backgroundColor: 'white',
    fontSize: 20,
    padding: 6,
    paddingLeft: 10,
    borderTopRightRadius: 18,
    borderBottomRightRadius: 18,
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
    elevation:8,
    marginHorizontal: 15
  },
})