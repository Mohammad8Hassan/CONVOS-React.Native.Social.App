import { StyleSheet, Text, View, StatusBar } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { DrawerActions, NavigationContainer, getFocusedRouteNameFromRoute } from '@react-navigation/native';
import Home from './screens/Home'
import Details from './screens/Details'
import Login from './screens/Login'
import Register from './screens/Register'
import Settings from './screens/Settings';
import NewConv from './screens/NewConv';
import EditProfile from './screens/EditProfile';
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

function SettingsScreens() {
  return(
    <ByMeStack.Navigator screenOptions={() => ({ 
      headerShown: false,
      })}>
      <ByMeStack.Screen name="Overview" component={Settings} />
      <ByMeStack.Screen name="Edit Profile" component={EditProfile} />
    </ByMeStack.Navigator>
  );
}

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

      <NavigationContainer>
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