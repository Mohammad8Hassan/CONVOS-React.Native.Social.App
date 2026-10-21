import { StyleSheet, Text, View, Pressable, ToastAndroid, Platform, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useRef } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons'
import { sendPush } from '../services/notifications';
import { createConversation } from '../services/conversations';
import { notify } from '../shared/notify';
import useAsyncAction from '../shared/useAsyncAction';
import useInvitees from '../hooks/useInvitees';
import InviteModal from '../components/newconv/InviteModal';
import ConversationForm from '../components/newconv/ConversationForm';

const draftKey = (uid) => 'draft:newConversation:' + uid;

export default function NewConv({ navigation }) {
  const db = getFirestore();
  const user = getAuth().currentUser;

  const [modalOpen, setModalOpen] = useState(false);
  const [activeIndicator, setActiveIndicator] = useState(false);
  const [initialDraft, setInitialDraft] = useState(null); // null until the stored draft was read

  const invitees = useInvitees();

  const current = useRef({ title: '', body: '', password: '', hasPassword: false });
  const selectedCount = useRef(0);
  selectedCount.current = invitees.selected.length;
  const leaving = useRef(false); // set when leaving is allowed (created, or the user chose to discard)
  const saveTimer = useRef(null);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(draftKey(user.uid))
      .then(raw => {
        const draft = raw ? JSON.parse(raw) : {};
        if(!active) return;
        if(draft.title || draft.body) notify('Draft restored');
        setInitialDraft(draft);
      })
      .catch(err => { console.log(err); if(active) setInitialDraft({}); })
    return () => { active = false; clearTimeout(saveTimer.current); }
  }, [])

  const hasText = () => current.current.title.trim() != '' || current.current.body.trim() != '';
  const isDirty = () => hasText() || current.current.password != '' || selectedCount.current > 0;

  const saveDraft = () => {
    clearTimeout(saveTimer.current);
    const { title, body, hasPassword } = current.current;
    const write = hasText()
      ? AsyncStorage.setItem(draftKey(user.uid), JSON.stringify({ title, body, hasPassword }))
      : AsyncStorage.removeItem(draftKey(user.uid));
    return write.catch(err => console.log(err));
  }
  const clearDraft = () => { clearTimeout(saveTimer.current); return AsyncStorage.removeItem(draftKey(user.uid)).catch(err => console.log(err)); }

  const onDraftChange = (values) => {
    current.current = values;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(saveDraft, 500);
  }

  useEffect(() => navigation.addListener('beforeRemove', (e) => {
    if(leaving.current || !isDirty()) return;

    e.preventDefault();
    const leave = (action) => { leaving.current = true; navigation.dispatch(e.data.action); };

    const buttons = [{ text: 'Keep editing', style: 'cancel' }];
    if(hasText()) {
      buttons.push({ text: 'Save draft & leave', onPress: async () => { await saveDraft(); leave(); } });
    }
    buttons.push({ text: 'Discard', style: 'destructive', onPress: async () => { await clearDraft(); leave(); } });

    Alert.alert('Leave without creating?', hasText()
      ? 'Your conversation has not been created. Save what you typed as a draft?'
      : 'Your conversation has not been created. The people you selected will be lost.', buttons);
  }), [navigation])

  const addConversation = async (values, hasPassword) => {
    setActiveIndicator(true);

    try {
      const { tokens } = await createConversation(db, user, values, hasPassword,
        invitees.selectedFriends, invitees.selectedOthers);

      leaving.current = true;
      clearDraft();

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

  // ref-guarded: a fast double tap on Create used to start two creations before the spinner showed
  const [submit] = useAsyncAction(addConversation);

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

        { initialDraft ? (
          <ConversationForm
            selected={invitees.selected} submitting={activeIndicator}
            onOpenParticipants={() => setModalOpen(true)} onSubmit={submit}
            initialDraft={initialDraft} onDraftChange={onDraftChange}
          />
        ) : (
          <ActivityIndicator size={50} color='#d4c86e' style={{marginTop: 40}} />
        )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  homeHeader: {
    flexDirection: 'row',
    alignItems:'center',
    backgroundColor: '#613a5f',
    paddingVertical: 12,
    paddingHorizontal: 10,
    paddingBottom: 16,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
  },
});
