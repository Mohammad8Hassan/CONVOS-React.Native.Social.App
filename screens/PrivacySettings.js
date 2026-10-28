import { StyleSheet, Text, View, Image, ActivityIndicator } from 'react-native';
import SettingsScreenLayout from '../components/settings/SettingsScreenLayout';
import { SettingsCard, ChoiceRow } from '../components/settings/SettingsCard';
import BusyButton from '../shared/BusyButton';
import { confirm } from '../shared/confirm';
import { notify } from '../shared/notify';
import useUserSettings from '../hooks/useUserSettings';
import useBlockedUsers from '../hooks/useBlockedUsers';

export default function PrivacySettings({ navigation }) {
  const { settings, loaded, update } = useUserSettings();
  const { blocked, loading, unblock } = useBlockedUsers();

  const askUnblock = (person) => {
    confirm('Unblock ' + (person.name || 'this user') + '?',
      'They will be able to send you friend requests again.',
      async () => {
        try {
          await unblock(person.id);
          notify('User Unblocked');
        } catch(err) {
          console.log(err);
          notify('Could not unblock');
        }
      }, 'unblock')
  }

  return (
    <SettingsScreenLayout title='Privacy & blocking' onBack={() => navigation.goBack()}>
      <SettingsCard title='WHO CAN SEND ME FRIEND REQUESTS'>
        <ChoiceRow label='Everyone' hint='Anyone who has your ID'
          selected={settings.friendRequests !== 'nobody'} onPress={() => loaded && update('friendRequests', 'everyone')} />
        <ChoiceRow label='Nobody' hint='You can still send requests yourself and approve ones you already received'
          selected={settings.friendRequests === 'nobody'} onPress={() => loaded && update('friendRequests', 'nobody')} />
      </SettingsCard>

      <SettingsCard title={'BLOCKED USERS' + (blocked.length ? ' - ' + blocked.length : '')}>
        { loading ? (
          <ActivityIndicator color='#613a5f' style={{marginVertical: 10}} />
        ) : blocked.length == 0 ? (
          <Text style={styles.empty}>You have not blocked anyone.</Text>
        ) : blocked.map(person => (
          <View key={person.id} style={styles.person}>
            <Image source={{uri: person.photo}} style={styles.pic} />
            <View style={{flex: 1, marginHorizontal: 10}}>
              <Text style={{color: '#5f5368', fontSize: 16}} numberOfLines={1}>{ person.name || 'Unknown user' }</Text>
              <Text style={{color: '#8d8296', fontSize: 11}} numberOfLines={1}>{ person.id }</Text>
            </View>
            <BusyButton onPress={() => askUnblock(person)} style={styles.unblock} spinnerColor='#613a5f'>
              <Text style={{color: '#613a5f', fontWeight: '600'}}>Unblock</Text>
            </BusyButton>
          </View>
        ))}
      </SettingsCard>
    </SettingsScreenLayout>
  );
}

const styles = StyleSheet.create({
  empty: { color: '#8d8296', fontSize: 14, paddingVertical: 6 },
  person: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  pic: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#d9cfe0' },
  unblock: { backgroundColor: '#d4c86e', paddingVertical: 6, paddingHorizontal: 14, borderRadius: 16, minWidth: 80, alignItems: 'center' },
});
