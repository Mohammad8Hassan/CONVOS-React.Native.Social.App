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
import ByMe from './screens/ByMe';
import Conversations from './screens/Conversations';
import Settings from './screens/Settings';
import Private from './screens/Private';
import NewConv from './screens/NewConv';
import EditProfile from './screens/EditProfile';
import { StyleSheet, Text, View, Button, TouchableOpacity, StatusBar} from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as SplashScreen from 'expo-splash-screen';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { initializeApp, getApps, getApp } from "firebase/app";
import { onAuthStateChanged, getAuth, signOut } from 'firebase/auth';
import { MaterialIcons } from '@expo/vector-icons';
import { MenuProvider } from 'react-native-popup-menu';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { FontAwesome} from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context';
import ChangeEmail from './screens/ChangeEmail';
import Friends from './screens/Friends';
import Invites from './screens/Invites';

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

const ByMeStack = createNativeStackNavigator();

const ConversationsStack = createNativeStackNavigator();

const Tabs = createBottomTabNavigator()

function HomeStackScreens() {
  return(
    <HomeStack.Navigator screenOptions={() => ({ 
      headerShown: false,
      })}>
      <HomeStack.Screen name="Public Conversations" component={Home} options={({ navigation }) => ({
        headerRight: () => <Button title="Log Out" onPress={() => {
          signOut(getAuth())
            .then(() => {
              console.log('signed out')
            })
            .catch(error => {
              console.log(error)
            })
        }}/>,
        headerLeft: () => 
          <TouchableOpacity>
            <MaterialIcons name='menu' size={25} color='black' 
            onPress={() => navigation.dispatch(DrawerActions.toggleDrawer)} style={styles.menu} />
          </TouchableOpacity>
        })}/>
      <HomeStack.Screen name="Details" component={Details} />
      <HomeStack.Screen name="New Conversation" component={NewConv} />
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
      <Drawer.Screen name="Feed" component={TabScreens}/>
      <Drawer.Screen name="About" component={About} />
      {/* <Drawer.Screen name="Tabs" component={TabScreens} /> */}
    </Drawer.Navigator>
  );
}

function TabScreens() {
  return(
    <Tabs.Navigator screenOptions={({route}) => ({
      tabBarIcon: ({focused}) => {
        let iconName;
        let iconColor;

        if(route.name =='Home'){
          iconName = 'home'
          iconColor = focused
            ? 'black'
            : '#f2f2f2';
        } else if(route.name == 'By Me') {
          iconName = focused
            ? 'user'
            : 'user';
          iconColor = focused
            ? '#f55fd2'
            : '#f2f2f2';
        } else if(route.name == 'Conversations') {
          iconName = focused
            ? 'comments'
            : 'comments';
          iconColor = focused
            ? '#f55fd2'
            : '#f2f2f2';
        } else if(route.name == 'Settings') {
          iconName = focused
            ? 'gear'
            : 'gear';
          iconColor = focused
            ? '#f55fd2'
            : '#f2f2f2';
        } else if (route.name == 'Friends') {
          iconName = 'users'
          iconColor = focused
            ? '#f55fd2'
            : '#f2f2f2';
        } else if (route.name == 'Invites') {
          iconName = 'envelope'
          iconColor = focused
            ? '#f55fd2'
            : '#f2f2f2';
        }

        return <FontAwesome name={iconName} size={30} color={iconColor} />;
      },
      tabBarStyle: {backgroundColor: '#806b96', elevation:15},
      tabBarActiveTintColor: '#f55fd2',
      tabBarInactiveTintColor: '#f2f2f2',
      headerShown: false,
      tabBarHideOnKeyboard: true,
      tabBarShowLabel:false
    })}>
      <Tabs.Screen name="Home" component={HomeStackScreens}/>
      <Tabs.Screen name="Invites" component={Invites} />
      <Tabs.Screen name="Friends" component={Friends} />
      {/* <Tabs.Screen name="By Me" component={ByMeScreens}/>
      <Tabs.Screen name="Conversations" component={ConversationsStackScreens}/> */}
      <Tabs.Screen name="Settings" component={SettingsScreens} />
    </Tabs.Navigator>
  )
}

function ByMeScreens() {
  return(
    <ByMeStack.Navigator screenOptions={() => ({ 
      headerShown: false,
      })}>
      <ByMeStack.Screen name="By me" component={ByMe} options={({ navigation }) => ({
        headerRight: () => <Button title="Log Out" onPress={() => {
          signOut(getAuth())
            .then(() => {
              console.log('signed out')
            })
            .catch(error => {
              console.log(error)
            })
        }}/>,
        headerLeft: () => 
          <TouchableOpacity>
            <MaterialIcons name='menu' size={25} color='black' 
            onPress={() => navigation.dispatch(DrawerActions.toggleDrawer)} style={styles.menu} />
          </TouchableOpacity>
        })}/>
      <ByMeStack.Screen name="Details" component={Details} />
    </ByMeStack.Navigator>
  );
}

function ConversationsStackScreens() {
  return(
    <ByMeStack.Navigator screenOptions={() => ({ 
      headerShown: false,
      })}>
      <ByMeStack.Screen name="Active Conversations" component={Conversations} options={({ navigation }) => ({
        headerRight: () => <Button title="Log Out" onPress={() => {
          signOut(getAuth())
            .then(() => {
              console.log('signed out')
            })
            .catch(error => {
              console.log(error)
            })
        }}/>,
        headerLeft: () => 
          <TouchableOpacity>
            <MaterialIcons name='menu' size={25} color='black' 
            onPress={() => navigation.dispatch(DrawerActions.toggleDrawer)} style={styles.menu} />
          </TouchableOpacity>
        })}/>
      <ByMeStack.Screen name="Details" component={Details} />
    </ByMeStack.Navigator>
  );
}

function SettingsScreens() {
  return(
    <ByMeStack.Navigator screenOptions={() => ({ 
      headerShown: false,
      })}>
      <ByMeStack.Screen name="Overview" component={Settings} />
      <ByMeStack.Screen name="Edit Profile" component={EditProfile} />
      <ByMeStack.Screen name="Change Email" component={ChangeEmail} />
    </ByMeStack.Navigator>
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
      <StatusBar
        animated={true}
        backgroundColor="#613a5f" 
      />
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
