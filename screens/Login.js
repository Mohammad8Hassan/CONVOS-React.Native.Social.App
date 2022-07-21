import { useState } from 'react'
import { 
  StyleSheet, Text, View, Button, KeyboardAvoidingView, TouchableOpacity,
  Pressable
} from 'react-native'
import { TextInput } from 'react-native-gesture-handler'
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth'
import { MaterialIcons } from '@expo/vector-icons'


export default function Login({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');


  const HandleLogin = () => {
    signInWithEmailAndPassword(getAuth(), email, password)
      .then(credentials => {
        const user = credentials.user;
        console.log("step 2");
        console.log(user.email)
      })
      .catch(error => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log(errorCode, errorMessage);
      });
  }

  return (
    <KeyboardAvoidingView style={styles.container}>
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

      
      {/* <TouchableOpacity style={styles.login} onPress={HandleLogin}>
        <Text style={{color:"white", fontSize: 18}}>Login</Text>
      </TouchableOpacity > */}

      <Pressable  
        onPress={HandleLogin}
        style={({ pressed }) => [
          {opacity: pressed ? 0.5: 1}, styles.login
        ]}
        >
        <Text style={{color:"white", fontSize: 18}}>Login</Text>
      </Pressable>


      <View style={{flexDirection: 'row'}}>
      <Text style={{color:"black", fontSize: 16, marginBottom: 10, marginRight: 5}}>Forget you password?</Text>
      <Text style={{color: '#a8a628', fontSize:16}}>Click Here!</Text>
      </View>

      <View style={{flexDirection: 'row', marginTop: 100}}>
      <Text style={styles.signUp}>Don't have an account?</Text>
      <Text style={{color: '#a8a628', fontSize:18}} onPress={() => navigation.navigate('Register')}>Register Here!</Text>
      </View>

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:{
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 180
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
    backgroundColor: 'green',
    width: 200,
    alignItems: 'center',
    borderRadius: 50,
    elevation: 8
  },
  signUp: {
    fontSize: 18,
    marginRight: 5
  }
})