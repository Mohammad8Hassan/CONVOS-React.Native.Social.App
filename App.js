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
import Settings from './screens/Settings';
import NewConv from './screens/NewConv';
import EditProfile from './screens/EditProfile';
import { StyleSheet, Text, View, Button, TouchableOpacity, StatusBar} from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as SplashScreen from 'expo-splash-screen';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { initializeApp, getApps, getApp } from "firebase/app";
import { onAuthStateChanged, getAuth, signOut } from 'firebase/auth';
import { MaterialIcons } from '@expo/vector-icons';
import { SimpleLineIcons } from '@expo/vector-icons';
import { MenuProvider } from 'react-native-popup-menu';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { FontAwesome} from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context';
import ChangeEmail from './screens/ChangeEmail';
import Friends from './screens/Friends';
import Invites from './screens/Invites';
import ErrorScreen from './screens/ErrorScreen';
import * as NavigationBar from 'expo-navigation-bar';

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
      <HomeStack.Screen name="My Conversations" component={Home} />
      <HomeStack.Screen name="Details" component={Details} />
      <HomeStack.Screen name="New Conversation" component={NewConv} />
      <HomeStack.Screen name="Error" component={ErrorScreen} />
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
            ? '#e374b5'
            : '#f2f2f2';
        } else if(route.name == 'Settings') {
          iconName = 'settings'
          iconColor = focused
            ? '#f55fd2'
            : '#f2f2f2';
        } else if (route.name == 'Friends') {
          iconName = 'people'
          iconColor = focused
            ? '#f55fd2'
            : '#f2f2f2';
        } else if (route.name == 'Invites') {
          iconName = 'envelope-letter'
          iconColor = focused
            ? '#f55fd2'
            : '#f2f2f2';
        }

        return <SimpleLineIcons name={iconName} size={27} color={iconColor} />;
      },
      tabBarStyle: {backgroundColor: '#745f8a', elevation:15, borderTopWidth:0},
      tabBarActiveTintColor: '#f55fd2',
      tabBarInactiveTintColor: '#f2f2f2',
      headerShown: false,
      tabBarHideOnKeyboard: true,
      // tabBarShowLabel:false
    })}>
      <Tabs.Screen name="Home" component={HomeStackScreens}/>
      <Tabs.Screen name="Invites" component={Invites} />
      <Tabs.Screen name="Friends" component={Friends} />
      <Tabs.Screen name="Settings" component={SettingsScreens} />
    </Tabs.Navigator>
  )
}
// need to change stack name!
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

// function getHeaderTitles(route) {
//   const routeName = getFocusedRouteNameFromRoute(route) ?? 'Home';

//   switch(routeName) {
//     case 'Home':
//       return 'Home';
//     case 'Details':
//       return 'Details';
//   }
// }


// component

export default function App() {
  const [isFontsLoaded, setFontsLoaded] = useState(false);
  const [isSignedin, setIsSignedin] = useState(null);


  useEffect(() => {
    async function prepare() {
      try {
        await SplashScreen.preventAutoHideAsync();

        await Font.loadAsync({
          'Kanit-Light': require('./assets/fonts/Kanit-ExtraLight.ttf'),
          'Solway-Regular': require('./assets/fonts/Solway-Regular.ttf'),
          'Solway-Bold': require('./assets/fonts/Solway-Bold.ttf'),
        });

        
      } catch (e) {
        console.warn(e);
      } finally {
        setFontsLoaded(true);
        
      }
    } 

    prepare();

    NavigationBar.setBackgroundColorAsync("#613a5f");

    getAuth().onAuthStateChanged(user => {
      if(user) {
        setIsSignedin(true);
      } else {
        setIsSignedin(false);
      }
    })

    
  }, []);

  useEffect(() => {
    if(isFontsLoaded && isSignedin != null) {
      SplashScreen.hideAsync();
    }
  }, [isFontsLoaded, isSignedin])

  if(!isFontsLoaded || isSignedin == null){
    return null;
  }

  return (
    <MenuProvider backHandler={true}>
      
      <StatusBar
        animated={true}
        backgroundColor="#613a5f" 
      />

      <NavigationContainer>
        <MainStack.Navigator screenOptions={() => ({ headerShown: false,})}>
          { (isSignedin == false || isSignedin == null) ? (
            <>
              <MainStack.Screen name="Login" component={Login} />
              <MainStack.Screen name="Register" component={Register} />
            </>
          ) : (
            <MainStack.Screen name="Tab" component={TabScreens} />
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
