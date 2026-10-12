import { Alert, Platform, ToastAndroid } from 'react-native';

// REFACTOR NOTE: this Android-toast / iOS-alert pair used to be written out inline
// (`if(Platform.OS === 'android') ToastAndroid.show(...) else Alert.alert(msg, '', [{text:'Ok'}], ...)`)
// about 6 times in Friends.js alone, and again in other screens. Friends now calls notify('...').
export const notify = (message) => {
  if (Platform.OS === 'android')
    ToastAndroid.show(message, ToastAndroid.SHORT);
  else
    Alert.alert(message, '', [{ text: 'Ok' }], { cancelable: true });
}
