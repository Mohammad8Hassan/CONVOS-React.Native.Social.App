import { doc, collection, addDoc, setDoc, updateDoc, deleteDoc, serverTimestamp, Timestamp, increment } from 'firebase/firestore';

// REFACTOR NOTE: these writes used to be inline in screens/Details.js, next to the UI code that
// triggers them. Same documents and fields as before; the screen only decides *when* to call them.

export const markConversationOpened = (db, user, id) =>
  updateDoc(doc(db, 'Users', user.uid, 'My Conversations', id), {
    lastAccessed: Timestamp.now(),
    unread: 0
  });

export const markParticipantEnter = (db, user, id) =>
  updateDoc(doc(db, 'Conversations', id, 'Participants', user.uid), {
    lastEnter: Timestamp.now(),
  });

export const markParticipantExit = (db, user, id) =>
  updateDoc(doc(db, 'Conversations', id, 'Participants', user.uid), {
    lastExit: Timestamp.now(),
  });

export const addComment = (db, user, id, text) =>
  addDoc(collection(db, 'Conversations', id, 'Comments'), {
    comment: text,
    author: user.displayName,
    authorID: user.uid,
    timeStamp: Timestamp.now(),
    system: false
  });

export const deleteComment = (db, id, commentId) =>
  deleteDoc(doc(db, 'Conversations', id, 'Comments', commentId));

// marks the participant as removed and leaves a "removed" system message in the conversation
export const removeParticipant = (db, id, userID, name) => {
  addDoc(collection(db, 'Conversations', id, 'Comments'), {
    comment: 'removed',
    author: name,
    authorID: userID,
    timeStamp: serverTimestamp(),
    system: true,
  });

  updateDoc(doc(db, 'Conversations', id, 'Participants', userID), {
    removed: true,
  });
}

export const deleteConversation = (db, user, id) => {
  deleteDoc(doc(db, 'Users', user.uid, 'My Conversations', id));
  deleteDoc(doc(db, 'Conversations', id));
}

export const incrementUnread = (db, personID, id) =>
  updateDoc(doc(db, 'Users', personID, 'My Conversations', id), {
    unread: increment(1)
  });

// REFACTOR NOTE: this was `addConversation` inside screens/NewConv.js. It creates the conversation, my
// entry in "My Conversations", an invite for every invited friend / other person, the admin participant
// and the "joined" system comment. It returns the new id and the push tokens of the invited people
// (the screen sends the notification). Same documents and fields as before.
// `friends` / `others` are arrays of user objects with at least `ID` (and optionally `ExpoPushToken`).
export const createConversation = async (db, user, values, hasPassword, friends, others) => {
  const ref = await addDoc(collection(db, 'Conversations'), {
    title: values.title,
    body: values.body,
    password: values.password,
    hasPassword: hasPassword,
    author: user.displayName,
    authorID: user.uid,
    authorEmail: user.email,
    dateCreated: Timestamp.now(),
  });

  setDoc(doc(db, 'Users', user.uid, 'My Conversations', ref.id), {
    authorID: user.uid,
    title: values.title,
    body: values.body,
    dateCreated: Timestamp.now(),
    lastAccessed: Timestamp.now(),
    unread: 0
  });

  const tokens = [];

  const invite = (people, inviteCollection) => {
    people.forEach(person => {
      setDoc(doc(db, 'Users', person.ID, inviteCollection, ref.id), {
        title: values.title,
        body: values.body,
        author: user.displayName,
        authorID: user.uid,
        timeStamp: Timestamp.now(),
      });

      if(person.ExpoPushToken !== undefined) {
        tokens.push(person.ExpoPushToken);
      } else {
        console.log("no token found");
      }
    })
  }

  invite(friends, 'Friends Invites');
  invite(others, 'Other Invites');

  setDoc(doc(db, 'Conversations', ref.id, 'Participants', user.uid), {
    Name: user.displayName,
    ID: user.uid,
    Admin: true,
    removed: false
  });

  addDoc(collection(db, 'Conversations', ref.id, 'Comments'), {
    comment: 'joined',
    author: user.displayName,
    authorID: user.uid,
    timeStamp: Timestamp.now(),
    system: true,
  });

  return { id: ref.id, tokens };
}
