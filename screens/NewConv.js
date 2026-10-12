import { StyleSheet, Text, View, Pressable, ToastAndroid, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react'
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons'
import { sendPush } from '../services/notifications';
import { createConversation } from '../services/conversations';
import { notify } from '../shared/notify';
import useInvitees from '../hooks/useInvitees';
import InviteModal from '../components/newconv/InviteModal';
import ConversationForm from '../components/newconv/ConversationForm';

// REFACTOR NOTE: this screen used to be 857 lines with 21 useStates (5 of them parallel copies of the
// selected people). It now only wires things together:
//   hooks/useInvitees.js                    friends list, selected people, search-by-ID
//   services/conversations.js               createConversation (all the Firestore writes)
//   components/newconv/InviteModal.js       the "Invite Participants" modal
//   components/newconv/ConversationForm.js  title / body / password form
// Dropped as dead: states `email`, `Others`, `Data`, `title`, `num`, `selector`, the counters, the refs
// `searchName` / `passwordValue`, and ~40 lines of commented-out code. Creating now also handles a
// failure (before, a failed write left the spinner on forever).
export default function NewConv({ navigation }) {
  const db = getFirestore();
  const user = getAuth().currentUser;

  const [modalOpen, setModalOpen] = useState(false);
  const [activeIndicator, setActiveIndicator] = useState(false);

  const invitees = useInvitees();

  const addConversation = async (values, hasPassword) => {
    setActiveIndicator(true);

    try {
      const { tokens } = await createConversation(db, user, values, hasPassword,
        invitees.selectedFriends, invitees.selectedOthers);

      if(tokens.length > 0)
        sendInviteNotification(tokens, values.title);

      if(Platform.OS === 'android')
        ToastAndroid.show('Conversation Created', ToastAndroid.SHORT);
      navigation.popToTop();
    } catch(err) {
      console.log(err);
      setActiveIndicator(false);
      notify('Could not create the conversation');
    }
  }

  async function sendInviteNotification(expoPushToken, title) {
    const message = {
      to: expoPushToken,
      sound: 'default',
      title: title,
      body: 'You were invited to a conversation by ' + user.displayName,
      data: { someData: 'goes here' },
      channelId: 'Invites'
    };

    await sendPush(message);
  }

  return (
    <SafeAreaView style={{flex: 1, backgroundColor:'#613a5f'}}>
      <View style={{flex:1, backgroundColor:'#806b96'}} >
        <View style={styles.homeHeader}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [
              {opacity: pressed ? 0.5: 1},
            ]}
            >
            <Ionicons name='chevron-back-circle' size={27} color="white" />
          </Pressable>
          <Text style={{flex:1, fontSize:19, color:'white', fontFamily:'Solway-Regular', marginLeft:10}}>New Conversation</Text>
        </View>

        <InviteModal
          visible={modalOpen} onClose={() => setModalOpen(false)}
          friends={invitees.friends} selected={invitees.selected}
          onAddFriend={invitees.addFriend} onRemove={invitees.removeSelected}
          search={{
            status: invitees.searchStatus, name: invitees.searchName, searching: invitees.searching,
            onAdd: invitees.addOther, onClear: invitees.clearSearchStatus,
          }}
        />

        <ConversationForm
          selected={invitees.selected} submitting={activeIndicator}
          onOpenParticipants={() => setModalOpen(true)} onSubmit={addConversation}
        />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  homeHeader: {
    flexDirection: 'row',
    alignItems:'center',
    backgroundColor: '#613a5f',
    padding: 10,
    elevation: 15
  },
});
