import { useState } from 'react';
import { StyleSheet, View, KeyboardAvoidingView, Platform } from 'react-native';
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

// REFACTOR NOTE: this screen used to be 1209 lines with 22 useStates, the participants/comments
// listeners and the whole UI in one function. It now only wires things together; the pieces moved to:
//   hooks/useConversationParticipants.js   conversation + participants listeners, push tokens
//   hooks/useConversationComments.js       comments listener, scroll + unread counter
//   services/conversations.js              the Firestore writes (comment, remove user, delete, unread)
//   components/details/*                   ConversationCard, ParticipantsModal, CommentsList, CommentBox
//   shared/notify.js                       the Android toast / iOS alert helper
// Dropped as dead: states friends, uri, data(selector), areFriends, notFriends, caretName, isAvailable
// (always true; its "Conversation not available" view could never show), `defaultImg`, `storage`,
// the unused firebase/storage imports, and the old commented-out code.
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
  const [modalOpen, setModalOpen] = useState(false);

  const { post, allParticipants, participantsIDs, data, num, convAuthor, tokensArray } =
    useConversationParticipants({ id, navigation });

  const { allComments, commentsIndicator, unreadMessages, scrollView, scrollNow, onScroll, onContentSizeChange } =
    useConversationComments({ id, allParticipants });

  const postComment = async (theComment) => {
    if(scrollView.current) scrollView.current.scrollToEnd();

    await conversations.addComment(db, user, id, theComment);

    updateUnread(theComment);
  }

  // everyone who is not in the conversation right now gets +1 unread and a push notification
  const updateUnread = (theComment) => {
    (participantsIDs || []).forEach(person => {
      if(person.lastEnter && person.lastExit)
      {
        if(person.lastEnter < person.lastExit){
          conversations.incrementUnread(db, person.ID, id);
        }
      }
      else if(!person.lastEnter && !person.lastExit) {
        conversations.incrementUnread(db, person.ID, id);
      }
    })

    sendPushNotification(tokensArray.current, post.title, theComment);
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

  const confirmDeleteComment = (commentId) => {
    confirm('Delete Message?', 'Are you sure you want to delete this Message?', () => conversations.deleteComment(db, id, commentId))
  }

  const confirmDeleteConversation = () => {
    confirm('Delete Conversation?', 'Are you sure you want to delete this conversation?', () => conversations.deleteConversation(db, user, id))
  }

  const confirmRemoveUser = (userID, name) => {
    confirm('Remove User?', 'Are you sure you want to remove ' + name + ' from this conversation?', () => conversations.removeParticipant(db, id, userID, name))
  }

  const copyToClipboard = async (text, message) => {
    await Clipboard.setStringAsync(text);
    notify(message);
  }

  return (
    <SafeAreaView style={{flex:1, backgroundColor:'#613a5f'}}>
      { post &&
        <>
          <ParticipantsModal
            visible={modalOpen} onClose={() => setModalOpen(false)}
            num={num} user={user} photoUrl={photoUrl || user.photoURL}
            data={data} extraData={participantsIDs} convAuthorId={convAuthor.current.id}
            onRemoveUser={confirmRemoveUser}
            onCopyUserId={(uid) => copyToClipboard(uid, 'user ID copied')}
            onCopyMyId={() => copyToClipboard(user.uid, 'ID copied')}
          />

          <ConversationCard
            post={post} id={id} user={user} convAuthor={convAuthor.current}
            expanded={expanded} onToggleExpanded={() => setExpanded(!expanded)}
            onBack={() => navigation.goBack()}
            onCopyId={() => copyToClipboard(id, 'conversation ID copied')}
            onViewInfo={() => setModalOpen(true)}
            onDelete={confirmDeleteConversation}
          />

          <KeyboardAvoidingView style={styles.container} behavior={Platform.OS==='ios'? 'height' : null}>
            <View style={{flex:1}}>
              <CommentsList
                comments={allComments} loading={commentsIndicator} participants={allParticipants}
                userID={user.uid} onDeleteComment={confirmDeleteComment}
                scrollRef={scrollView} onScroll={onScroll} onContentSizeChange={onContentSizeChange}
              />

              <CommentBox onSend={postComment} unreadMessages={unreadMessages} onScrollDown={scrollNow} />
            </View>
          </KeyboardAvoidingView>
        </>
      }
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor:'white'
  },
});
