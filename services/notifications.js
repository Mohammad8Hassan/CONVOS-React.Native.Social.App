import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

// REFACTOR NOTE: this file collects push-notification code that used to live inside screens:
//  - createNotificationsChannels / registerForPushNotificationsAsync were at the top of Home.js
//  - the `fetch('https://exp.host/--/api/v2/push/send', ...)` call was copy-pasted in
//    Details (sendPushNotification), Friends (sendFriendNotification) and NewConv (sendInviteNotification).
// Those screen functions still exist but now only build the message and call sendPush().

export const createNotificationsChannels = async () => {
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('Conversations', {
      name: 'Conversations',
      importance: Notifications.AndroidImportance.MAX,
      enableVibrate: false,
      lightColor: '#FF231F7C',
    });

    Notifications.setNotificationChannelAsync('Friends', {
      name: 'Friends',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });

    Notifications.setNotificationChannelAsync('Invites', {
      name: 'Invites',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }
}

export async function registerForPushNotificationsAsync() {
  let token;
  if (Device.isDevice) {

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return;
    }

    const appConfig = require('../app.json');
    const projectId = appConfig?.expo?.extra?.eas?.projectId;
    token = (await Notifications.getExpoPushTokenAsync({
      projectId
    })).data;

  } else {
    // alert('Must use physical device for Push Notifications');
    return "noDevice";
  }

  return token;
}

// Can use this function OR use Expo's Push Notification Tool from: https://expo.dev/notifications
export async function sendPush(message) {
  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });
}
