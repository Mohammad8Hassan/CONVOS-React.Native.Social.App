import { Alert } from 'react-native';

export const confirm = (title, message, onConfirm, confirmText = 'confirm') => {
  Alert.alert(
    title,
    message,
    [
      {
        text: 'Cancel',
        style: 'cancel'
      },
      {
        text: confirmText,
        onPress: onConfirm
      }
    ],
    {
      cancelable: true
    }
  )
}
