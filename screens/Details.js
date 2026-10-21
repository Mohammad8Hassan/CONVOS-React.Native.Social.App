import { useEffect, useState } from 'react';
import { StyleSheet, View, Modal, ActivityIndicator, Keyboard } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import * as Clipboard from 'expo-clipboard';
import * as Notifications from 'expo-notifications';
import { confirm } from '../shared/confirm';
import { notify } from '../shared/notify';
import { sendPush } from '../services/notifications';
import * as conversations from '../services/conversations';
import useConversationParticipants from '../hooks/useConversationParticipants';
import useConversationComments from '../hooks/useConversationComments';
import ConversationCard from '../components/details/ConversationCard';
import ParticipantsModal from '../components/details/ParticipantsModal';
import CommentsList from '../components/details/CommentsList';
import CommentBox from '../components/details/CommentBox';
import QRCodeModal from '../shared/QRCodeModal';

export default function Details({ route, navigation }) {

  const { id, photoUrl } = route.params;

  // while this conversation is open, don't show notifications that belong to it
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => ({
      shouldShowBanner: (id == notification.request.content.data.convID )? false : true,
      shouldShowList: (id == notification.request.content.data.convID )? false : true,
      shouldPlaySound: (id == notification.request.content.data.convID )? false : true,
      shouldSetBadge: (id == notification.request.content.data.convID )? false : true,
    }),
  });

  const db = getFirestore();
  const user = getAuth().currentUser;

  const [expanded, setExpanded] = useState(true);

  const insets = useSafeAreaInsets();

  // leaving by any route (back arrow, hardware back, being removed) must not leave the keyboard up
  useEffect(() => () => Keyboard.dismiss(), []);
  const [modalOpen, setModalOpen] = useState(false);
  const [working, setWorking] = useState(false);
  const [qr, setQr] = useState(null); // { title, caption, value } of the QR code being shown

  const { post, allParticipants, participantsIDs, data, num, convAuthor, myMuted } =
    useConversationParticipants({ id, navigation });

  const { allComments, commentsIndicator, unreadMessages, scrollView, scrollNow, onScroll, onLayout, onContentSizeChange } =
    useConversationComments({ id, allParticipants });

  const postComment = async (theComment) => {
    if(scrollView.current) scrollView.current.scrollToEnd();

    await conversations.addComment(db, user, id, theComment);

    updateUnread(theComment);
  }

  // everyone who is not in the conversation right now gets +1 unread and a push notification
  const updateUnread = (theComment) => {
    const bump = (person) => conversations.incrementUnread(db, person.ID, id)
      .catch(err => console.warn('unread +1 failed for', person.ID, err.code, err.message));

    (participantsIDs || []).forEach(person => {
      if(person.lastEnter && person.lastExit)
      {
        if(person.lastEnter < person.lastExit){
          bump(person);
        }
      }
      else if(!person.lastEnter && !person.lastExit) {
        bump(person);
      }
    })

    // push only to active participants who didn't turn message notifications off or mute this conversation
    const tokens = [...new Set((participantsIDs || [])
      .filter(p => p.token && !p.removed && p.notify !== false && p.muted !== true)
      .map(p => p.token))];

    if(tokens.length > 0) sendPushNotification(tokens, post.title, theComment);
  }

  const toggleMute = async () => {
    try {
      await conversations.setMuted(db, user, id, !myMuted);
      notify(myMuted ? 'Notifications on for this conversation' : 'Conversation muted');
    } catch(err) {
      console.log(err);
      notify('Could not change the setting');
    }
  }

  async function sendPushNotification(expoPushToken, title, body) {
    const message = {
      to: expoPushToken,
      sound: 'default',
      title: title,
      body: user.displayName + ': ' + body,
      data: { convID: id, routeName: route.name,  },
      channelId: 'Conversations',
    };

    await sendPush(message);
  }

  // runs a slow write behind a blocking spinner; always lowers it, and reports a failure
  const withSpinner = async (action, errorMessage) => {
    setWorking(true);
    try {
      await action();
    } catch(err) {
      console.log(err);
      notify(errorMessage);
    } finally {
      setWorking(false);
    }
  }

  const confirmDeleteComment = (commentId) => {
    confirm('Delete Message?', 'Are you sure you want to delete this Message?',
      () => withSpinner(() => conversations.deleteComment(db, id, commentId), 'Could not delete the message'))
  }

  const confirmDeleteConversation = () => {
    confirm('Delete Conversation?', 'Are you sure you want to delete this conversation?',
      () => withSpinner(() => conversations.deleteConversation(db, user, id), 'Could not delete the conversation'))
  }

  const confirmRemoveUser = (userID, name) => {
    confirm('Remove User?', 'Are you sure you want to remove ' + name + ' from this conversation?',
      () => withSpinner(() => conversations.removeParticipant(db, id, userID, name), 'Could not remove ' + name))
  }

  const copyToClipboard = async (text, message) => {
    await Clipboard.setStringAsync(text);
    notify(message);
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{flex:1, backgroundColor:'#613a5f'}}>
      { post &&
        <View style={{flex:1, backgroundColor:'#faf7fc'}}>
          <ParticipantsModal
            visible={modalOpen} onClose={() => setModalOpen(false)}
            num={num} user={user} photoUrl={photoUrl || user.photoURL}
            data={data} extraData={participantsIDs} convAuthorId={convAuthor.current.id}
            onRemoveUser={confirmRemoveUser}
            onCopyUserId={(uid) => copyToClipboard(uid, 'user ID copied')}
            onCopyMyId={() => copyToClipboard(user.uid, 'ID copied')}
            onShowUserQr={(uid, name) => setQr({ title: 'User ID', caption: name, value: uid })}
            onShowMyQr={() => setQr({ title: 'My ID', caption: user.displayName, value: user.uid })}
          />

          <QRCodeModal
            visible={!!qr} onClose={() => setQr(null)}
            title={qr ? qr.title : ''} caption={qr ? qr.caption : ''} value={qr ? qr.value : ''}
            onCopy={() => qr && copyToClipboard(qr.value, qr.title + ' copied')}
          />

          <Modal visible={working} transparent animationType='fade' onRequestClose={() => {}}>
            <View style={styles.spinnerBackdrop}>
              <ActivityIndicator size={70} color='#d4c86e' />
            </View>
          </Modal>

          <ConversationCard
            post={post} id={id} user={user} convAuthor={convAuthor.current}
            expanded={expanded} onToggleExpanded={() => setExpanded(!expanded)}
            onBack={() => { Keyboard.dismiss(); navigation.goBack(); }}
            onCopyId={() => copyToClipboard(id, 'conversation ID copied')}
            onShowQr={() => setQr({ title: 'Conversation ID', caption: post.title, value: id })}
            muted={myMuted} onToggleMute={toggleMute}
            onViewInfo={() => setModalOpen(true)}
            onDelete={confirmDeleteConversation}
          />

          {/* react-native-keyboard-controller's version, because RN's own left the box under the keyboard with
              Android's edge-to-edge drawing. It still pads by the keyboard height without the navigation bar
              (measured: height 330, bar 48, keyboard really 377 from the bottom), hence the offset. */}
          <KeyboardAvoidingView style={styles.container} behavior='padding' keyboardVerticalOffset={insets.bottom}>
            <View style={{flex:1}}>
              <CommentsList
                comments={allComments} loading={commentsIndicator} participants={allParticipants}
                userID={user.uid} onDeleteComment={confirmDeleteComment}
                scrollRef={scrollView} onScroll={onScroll} onLayout={onLayout} onContentSizeChange={onContentSizeChange}
              />

              <CommentBox onSend={postComment} unreadMessages={unreadMessages} onScrollDown={scrollNow} />
            </View>
          </KeyboardAvoidingView>
        </View>
      }
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor:'#faf7fc'
  },
  spinnerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
