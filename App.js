import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useEffect, useRef, useState } from 'react';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { initializeApp, getApps, getApp } from "firebase/app";
import { onAuthStateChanged, getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { enableScreens } from 'react-native-screens';
import AsyncStorage from '@react-native-async-storage/async-storage';
import store from './store';
import { Provider } from 'react-redux';
import Navigation from './Navigation';
import MobileAds, { MaxAdContentRating } from 'react-native-google-mobile-ads';
import { initializeFirestore } from 'firebase/firestore';

// REFACTOR NOTE: ~150 console.log calls were scattered across the screens and ran in release builds too.
// Instead of editing each one, console.log is now a no-op outside development. console.warn/error are untouched.
if (!__DEV__) {
  console.log = () => {};
}

const firebaseConfig = {
  apiKey: "AIzaSyABRLZgFavsNeL1TrQ0YsvyIEDxn3I3fWY",
  authDomain: "convos-app-1.firebaseapp.com",
  projectId: "convos-app-1",
  storageBucket: "convos-app-1.appspot.com",
  messagingSenderId: "645757565742",
  appId: "1:645757565742:web:33124f6013d32a349558bf"
};

// Initialize Firebase
!getApps().length? initializeAuth(initializeApp(firebaseConfig), {persistence: getReactNativePersistence(AsyncStorage)}): getApp();

MobileAds().setRequestConfiguration({
  maxAdContentRating: MaxAdContentRating.PG,
})
  .then(() => {
    MobileAds().initialize()
      .then(() => console.log("mobile ads initialized"))
  })
  .catch(err => {
    console.log("ad config failed: ", err);
  })

if( __DEV__){
  initializeFirestore(getApp(), {experimentalForceLongPolling: true, useFetchStreams:false});
}


export default function App() {
  const [isFontsLoaded, setFontsLoaded] = useState(false);
  const [isSignedin, setIsSignedin] = useState(null);
  const [isVerified, setIsVerified] = useState(false);

  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    enableScreens(false);

    async function prepare() {
      try {
        await SplashScreen.preventAutoHideAsync();

        await Font.loadAsync({
          'Kanit-Light': require('./assets/fonts/Kanit-ExtraLight.ttf'),
          'Solway-Regular': require('./assets/fonts/Solway-Regular.ttf'),
          'Solway-Bold': require('./assets/fonts/Solway-Bold.ttf'),
          'Poppins-Regular': require('./assets/fonts/Poppins-Regular.ttf'),
          'Poppins-Italic': require('./assets/fonts/Poppins-Italic.ttf'),
          'Poppins-Bold': require('./assets/fonts/Poppins-Bold.ttf'),
          'Poppins-Light': require('./assets/fonts/Poppins-Light.ttf'),
          'Poppins-LightItalic': require('./assets/fonts/Poppins-LightItalic.ttf'),
          'Poppins-ThinItalic': require('./assets/fonts/Poppins-ThinItalic.ttf'),
        });

        
      } catch (e) {
        console.warn(e);
      } finally {
        setFontsLoaded(true);
        
      }
    } 

    prepare();

    getAuth().onAuthStateChanged(async user => {
      if(user) {
        if(user.emailVerified) {
          setIsSignedin(true);
          setIsVerified(true);
        }
        else {
          setIsSignedin(true);
          setIsVerified(false);
        }
      } else {
        setIsSignedin(false);
      }
    })

    return () => {
      mounted.current = false;
      console.log('app unmounted');
    }
  }, []);

  useEffect(() => {
    if(isFontsLoaded && isSignedin != null) {
      if(mounted.current)
        SplashScreen.hideAsync();
    }
  }, [isFontsLoaded, isSignedin])

  if(!isFontsLoaded || isSignedin == null){
    return null;
  }

  return (
    <GestureHandlerRootView style={{flex:1}}>
      <Provider store={store} >
        <Navigation isSignedin={isSignedin} isVerified={isVerified} setIsVerified={setIsVerified}/>
      </Provider>
    </GestureHandlerRootView>
  );

}

