import { Alert, Platform, ToastAndroid } from 'react-native';

export const notify = (message) => {
  if (Platform.OS === 'android')
    ToastAndroid.show(message, ToastAndroid.SHORT);
  else
    Alert.alert(message, '', [{ text: 'Ok' }], { cancelable: true });
}
