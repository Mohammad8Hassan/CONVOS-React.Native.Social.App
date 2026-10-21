import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, Pressable, Linking, AppState } from 'react-native';
import * as Notifications from 'expo-notifications';
import SettingsScreenLayout from '../components/settings/SettingsScreenLayout';
import { SettingsCard, SwitchRow } from '../components/settings/SettingsCard';
import useUserSettings from '../hooks/useUserSettings';

// Which kinds of push notifications I get. Senders read these from my user document and skip me when a
// category is off (the push is sent from their phone), so a change applies to pushes sent after it.
// Muting a single conversation is in that conversation's menu.
export default function NotificationSettings({ navigation }) {
  const { settings, loaded, update } = useUserSettings();
  const [systemAllowed, setSystemAllowed] = useState(true);

  const checkSystem = useCallback(() => {
    Notifications.getPermissionsAsync()
      .then(res => setSystemAllowed(res.granted))
      .catch(err => console.log(err));
  }, [])

  // coming back from the phone's settings re-checks
  useEffect(() => {
    checkSystem();
    const sub = AppState.addEventListener('change', state => { if(state === 'active') checkSystem(); });
    return () => sub.remove();
  }, [])

  return (
    <SettingsScreenLayout title='Notifications' onBack={() => navigation.goBack()}>
      { !systemAllowed &&
        <Pressable onPress={() => Linking.openSettings()} style={({ pressed }) => [{opacity: pressed ? 0.6 : 1}, styles.warning]}>
          <Text style={styles.warningTitle}>Notifications are turned off for CONVOS on this phone</Text>
          <Text style={styles.warningText}>Tap to open the phone settings and allow them.</Text>
        </Pressable>
      }

      <SettingsCard title='NOTIFY ME ABOUT'>
        <SwitchRow label='Messages' hint='New messages in your conversations'
          value={settings.notifyConversations} disabled={!loaded} onChange={v => update('notifyConversations', v)} />
        <SwitchRow label='Friend requests' hint='When someone asks to be your friend'
          value={settings.notifyFriends} disabled={!loaded} onChange={v => update('notifyFriends', v)} />
        <SwitchRow label='Invites' hint='When you are invited to a conversation'
          value={settings.notifyInvites} disabled={!loaded} onChange={v => update('notifyInvites', v)} />
      </SettingsCard>

      <Text style={styles.note}>
        To silence one conversation only, open it and choose "Mute notifications" in its menu.
      </Text>
    </SettingsScreenLayout>
  );
}

const styles = StyleSheet.create({
  warning: { backgroundColor: '#ffe9ef', marginHorizontal: 12, marginTop: 18, padding: 14, borderRadius: 14 },
  warningTitle: { color: '#853259', fontWeight: '700', fontSize: 14 },
  warningText: { color: '#853259', fontSize: 13, marginTop: 2 },
  note: { color: '#8d8296', fontSize: 13, marginHorizontal: 20, marginTop: 14 },
});
