import { initializeApp, getApps, getApp } from "firebase/app";


const firebaseConfig = {
  apiKey: "AIzaSyBzFP5s0WoP9MKd8Dk13QTDwNln7UXOoOs",
  authDomain: "pilot-react-native.firebaseapp.com",
  projectId: "pilot-react-native",
  storageBucket: "pilot-react-native.appspot.com",
  messagingSenderId: "1030234902351",
  appId: "1:1030234902351:web:dcaa3f5ddfb33b95b87f3a"
};

// Initialize Firebase
let app;
if(getApps.length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp
}
