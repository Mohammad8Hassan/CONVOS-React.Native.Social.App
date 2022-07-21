import 'react-native-gesture-handler';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { DrawerActions, NavigationContainer } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import * as Font from 'expo-font';
import Home from './screens/Home'
import Details from './screens/Details'
import About from './screens/About'
import Login from './screens/Login'
import Register from './screens/Register'
import { StyleSheet, Text, View, Button } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as SplashScreen from 'expo-splash-screen';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { initializeApp, getApps, getApp } from "firebase/app";
import { onAuthStateChanged, getAuth, signOut } from 'firebase/auth';
import { MaterialIcons } from '@expo/vector-icons';
import { MenuProvider } from 'react-native-popup-menu';

const firebaseConfig = {
  apiKey: "AIzaSyBzFP5s0WoP9MKd8Dk13QTDwNln7UXOoOs",
  authDomain: "pilot-react-native.firebaseapp.com",
  projectId: "pilot-react-native",
  storageBucket: "pilot-react-native.appspot.com",
  messagingSenderId: "1030234902351",
  appId: "1:1030234902351:web:dcaa3f5ddfb33b95b87f3a"
};

// Initialize Firebase
initializeApp(firebaseConfig);


const Drawer = createDrawerNavigator();

const HomeStack = createNativeStackNavigator();

const MainStack = createNativeStackNavigator();

function HomeStackScreens() {
  return(
    <HomeStack.Navigator>
      <HomeStack.Screen name="Home" component={Home} options={({ navigation }) => ({
        headerRight: () => <Button title="Log Out" onPress={() => {
          signOut(getAuth())
            .then(() => {
              console.log('signed out')
            })
            .catch(error => {
              console.log(error)
            })
        }}/>,
        headerLeft: () => <MaterialIcons name='menu' size={25} color='black' 
        onPress={() => navigation.dispatch(DrawerActions.toggleDrawer)} style={styles.menu} />
        })}/>
      <HomeStack.Screen name="Details" component={Details} />
    </HomeStack.Navigator>
  );
}

function DrawerScreens() {
  return(
    <Drawer.Navigator screenOptions={() => ({ 
      headerShown: false,
      })}>
      {/* <Drawer.Screen name="HomeScreens" component={HomeStackScreens} options={({ route, navigation }) => ({
        headerTitle: getHeaderTitles(route),
        headerRight: () => <Button onPress={navigation.goBack} title="X" />,
        })} /> */}
      <Drawer.Screen name="HomeScreens" component={HomeStackScreens}/>
      <Drawer.Screen name="About" component={About} />
    </Drawer.Navigator>
  );
}


function getHeaderTitles(route) {
  const routeName = getFocusedRouteNameFromRoute(route) ?? 'Home';

  switch(routeName) {
    case 'Home':
      return 'Home';
    case 'Details':
      return 'Details';
  }
}


// component

export default function App() {
  const [isFontsLoaded, setFontsLoaded] = useState(false);
  const [isSignedin, setIsSignedin] = useState(false);

  // useEffect hook
  useEffect(() => {
    async function prepare() {
      try {
        await SplashScreen.preventAutoHideAsync();

        await Font.loadAsync({
          'Kanit-Light': require('./assets/fonts/Kanit-ExtraLight.ttf')
        });

        
      } catch (e) {
        console.warn(e);
      } finally {
        setFontsLoaded(true);
        await SplashScreen.hideAsync();
      }
    } 

    prepare();

    const unsubscribe = getAuth().onAuthStateChanged(user => {
      if(user) {
        setIsSignedin(true);
      } else {
        setIsSignedin(false);
      }
    })

    return unsubscribe;
  }, []);

  if(!isFontsLoaded){
    return null;
  }

  return (
    <MenuProvider>
      <NavigationContainer>
        <MainStack.Navigator screenOptions={() => ({ headerShown: false,})}>
          { isSignedin == false ? (
            <>
              <MainStack.Screen name="Login" component={Login} />
              <MainStack.Screen name="Register" component={Register} />
            </>
          ) : (
            <MainStack.Screen name="Drawer" component={DrawerScreens} />
          )
          }
        </MainStack.Navigator>
      </NavigationContainer>
    </MenuProvider>
  );

}

const styles = StyleSheet.create({
  menu: {
    marginRight: 20,

  },

})
