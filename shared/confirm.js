import { Alert } from 'react-native';

// REFACTOR NOTE: every "Are you sure?" dialog used to be an inline ~16 line
// Alert.alert(title, message, [{Cancel}, {confirm, onPress}], {cancelable: true}) block
// repeated in Conversations, Details, EditProfile, Friends, Home and Invites.
// Now: confirm('Delete Post?', 'Are you sure...', () => deletePost(id)).
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
