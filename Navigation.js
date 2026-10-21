import { StyleSheet, Text, View, StatusBar } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { DrawerActions, NavigationContainer, createNavigationContainerRef, getFocusedRouteNameFromRoute } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import Home from './screens/Home'
import Details from './screens/Details'
import Login from './screens/Login'
import Register from './screens/Register'
import Settings from './screens/Settings';
import NewConv from './screens/NewConv';
import EditProfile from './screens/EditProfile';
import NotificationSettings from './screens/NotificationSettings';
import PrivacySettings from './screens/PrivacySettings';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SimpleLineIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Friends from './screens/Friends';
import Invites from './screens/Invites';
import ErrorScreen from './screens/ErrorScreen';
import Verify from './screens/Verify';
import Network from './screens/Network';
import { useSelector } from 'react-redux';
import { MenuProvider } from 'react-native-popup-menu';
import NetInfo from '@react-native-community/netinfo';

// REFACTOR NOTE: Tabs / HomeStack / ByMeStack / MainStack used to be created inside the Navigation
// component, and TabScreens / SettingsScreens / HomeStackScreens were declared inside it too.
// That made React see brand-new navigator and component types on every render (theme change,
// network change...), remounting the whole tab tree and its screens. They are now module-level.
const Tabs = createBottomTabNavigator()
const HomeStack = createNativeStackNavigator();
const ByMeStack = createNativeStackNavigator();
const MainStack = createNativeStackNavigator();
const navigationRef = createNavigationContainerRef();

function SettingsScreens() {
  return(
    <ByMeStack.Navigator screenOptions={() => ({ 
      headerShown: false,
      })}>
      <ByMeStack.Screen name="Overview" component={Settings} />
      <ByMeStack.Screen name="Edit Profile" component={EditProfile} />
      <ByMeStack.Screen name="Notifications" component={NotificationSettings} />
      <ByMeStack.Screen name="Privacy" component={PrivacySettings} />
    </ByMeStack.Navigator>
  );
}

function HomeStackScreens() {
  return(
    <HomeStack.Navigator screenOptions={() => ({ 
      headerShown: false,
      })}>
      <HomeStack.Screen name="My Conversations" component={Home} />
      <HomeStack.Screen name="Details" component={Details} getId={({ params }) => params.id} />
      <HomeStack.Screen name="New Conversation" component={NewConv} />
      <HomeStack.Screen name="Error" component={ErrorScreen} />
    </HomeStack.Navigator>
  );
}

// REFACTOR NOTE: reads its own theme colors now (they used to come from Navigation's closure).
function TabScreens() {
  const tabColor = useSelector(state => state.theme.tabColor);
  const iconDefaultColor = useSelector(state => state.theme.iconColor);
  const iconActiveColor = useSelector(state => state.theme.iconActiveColor);

  return(
    <Tabs.Navigator screenOptions={({route}) => ({
      tabBarIcon: ({focused}) => {
        let iconName;
        let iconColor;

        if(route.name =='Home'){
          iconName = 'home'
          iconColor = focused
            ? iconActiveColor
            : iconDefaultColor;
        } else if(route.name == 'Settings') {
          iconName = 'settings'
          iconColor = focused
            ? iconActiveColor
            : iconDefaultColor;
        } else if (route.name == 'Friends') {
          iconName = 'people'
          iconColor = focused
            ? iconActiveColor
            : iconDefaultColor;
        } else if (route.name == 'Invites') {
          iconName = 'envelope-letter'
          iconColor = focused
            ? iconActiveColor
            : iconDefaultColor;
        }

        return <SimpleLineIcons name={iconName} size={27} color={iconColor} />;
      },
      tabBarStyle: {backgroundColor: tabColor, elevation:15, borderTopWidth:0,
       display: (getFocusedRouteNameFromRoute(route) == 'Details' || getFocusedRouteNameFromRoute(route) == 'New Conversation'
       || getFocusedRouteNameFromRoute(route) == 'Error' || getFocusedRouteNameFromRoute(route) == 'Edit Profile')
       ? 'none' : 'flex'},
      tabBarActiveTintColor: iconActiveColor,
      tabBarInactiveTintColor: iconDefaultColor,
      headerShown: false,
      tabBarHideOnKeyboard: true,
      // tabBarShowLabel:false
      lazy: false
    })}>
      <Tabs.Screen name="Home" component={HomeStackScreens}/>
      <Tabs.Screen name="Invites" component={Invites} options={{tabBarBadge: null}}/>
      <Tabs.Screen name="Friends" component={Friends} />
      <Tabs.Screen name="Settings" component={SettingsScreens} />
    </Tabs.Navigator>
  )
}

export default function Navigation(props) {
  const statusBarColor = useSelector(state => state.theme.statusBarColor);
  const statusBarContent = useSelector(state => state.theme.statusBarContent);
  const refresh = useSelector(state => state.theme.refresh);

  const [networkStatus, setNetworkStatus] = useState(true);
  const [navReady, setNavReady] = useState(false);
  const [pending, setPending] = useState(null); // where a tapped push wants to go, waiting for the Tab screens

  // a tap on a conversation push (also the one that cold-started the app) -> remember which conversation
  const lastResponse = Notifications.useLastNotificationResponse();
  const handledResponse = useRef(null);

  useEffect(() => {
    if(!lastResponse || lastResponse.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;

    const key = lastResponse.notification.request.identifier;
    if(handledResponse.current === key) return;
    handledResponse.current = key;

    const data = lastResponse.notification.request.content.data;
    if(data?.convID) setPending({ type: 'conversation', id: data.convID });
    else if(data?.type === 'friendRequest') setPending({ type: 'friendRequest' });
  }, [lastResponse])

  // ...and open the conversation / the received friend requests once the user is signed in, verified and the navigator exists
  useEffect(() => {
    if(!pending || !navReady || !networkStatus || !props.isSignedin || !props.isVerified) return;

    if(pending.type === 'conversation') {
      navigationRef.navigate('Tab', {
        screen: 'Home',
        params: { screen: 'Details', params: { id: pending.id } },
      });
    } else {
      navigationRef.navigate('Tab', { screen: 'Friends', params: { section: 'received' } });
    }
    setPending(null);
  }, [pending, navReady, networkStatus, props.isSignedin, props.isVerified])

  useEffect(() => {
    if(refresh != null){
      props.setIsVerified(refresh);
    }
      
  }, [refresh])

  // REFACTOR NOTE: the three console.log calls here (and the one in the `refresh` effect above) printed on every
  // network/theme change; removed. Also dropped the unused `keyValue` / `iconColor` selectors from this component.
  useEffect(() => {
    const networkListener = NetInfo.addEventListener(state => {
      setNetworkStatus(state.isInternetReachable);
    })

    return () => {
      networkListener();
    }
  }, [])

  return (
    <MenuProvider backHandler={true}>  
      <StatusBar
        animated={true}
        backgroundColor= {statusBarColor} 
        barStyle= {statusBarContent}
      />

      <NavigationContainer ref={navigationRef} onReady={() => setNavReady(true)}>
        <MainStack.Navigator screenOptions={() => ({ headerShown: false,})}>
          {networkStatus? (
            <>
              { (props.isSignedin == false || props.isSignedin == null) ? 
              
              (
                <>
                  <MainStack.Screen name="Login" component={Login} />
                  <MainStack.Screen name="Register" component={Register} />
                </>
              ) 
              : 
              (
                <>
                  {(props.isVerified) ? 
                  (
                    <MainStack.Screen name="Tab" component={TabScreens} />
                  )
                  :
                  (
                    <MainStack.Screen name="Verify" component={Verify} />
                  )
                  }
                </>
                
              )

              }
            </>
          ) : (
            <MainStack.Screen name='Network' component={Network} />
          )}
          
        </MainStack.Navigator>
      </NavigationContainer>

    </MenuProvider>
  )
}

const styles = StyleSheet.create({})