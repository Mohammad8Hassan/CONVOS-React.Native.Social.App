import { StyleSheet, Text, View, StatusBar } from 'react-native'
import React, { useEffect } from 'react'
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
import ChangeEmail from './screens/ChangeEmail';
import Friends from './screens/Friends';
import Invites from './screens/Invites';
import ErrorScreen from './screens/ErrorScreen';
import Verify from './screens/Verify';
import { useSelector } from 'react-redux';
import { MenuProvider } from 'react-native-popup-menu';


export default function Navigation(props) {
  const tabColor = useSelector(state => state.theme.tabColor);
  const statusBarColor = useSelector(state => state.theme.statusBarColor);
  const statusBarContent = useSelector(state => state.theme.statusBarContent);
  const iconDefaultColor = useSelector(state => state.theme.iconColor);
  const iconActiveColor = useSelector(state => state.theme.iconActiveColor);
  const keyValue = useSelector(state => state.theme.key);
  const refresh = useSelector(state => state.theme.refresh);

  const Tabs = createBottomTabNavigator()
  const HomeStack = createNativeStackNavigator();
  const ByMeStack = createNativeStackNavigator();
  const MainStack = createNativeStackNavigator();

  useEffect(() => {
    if(refresh != null){
      console.log('refresh: ', refresh);
      props.setIsVerified(refresh);
    }
      
  }, [refresh])

  function TabScreens() {
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

  return (
    <MenuProvider backHandler={true}>  
      <StatusBar
        animated={true}
        backgroundColor= {statusBarColor} 
        barStyle= {statusBarContent}
      />

      <NavigationContainer>
        <MainStack.Navigator screenOptions={() => ({ headerShown: false,})}>
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
        </MainStack.Navigator>
      </NavigationContainer>

    </MenuProvider>
  )
}

const styles = StyleSheet.create({})