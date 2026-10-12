import { doc, getDoc, setDoc, deleteDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

// REFACTOR NOTE: these Firestore reads/writes used to be written inline in screens/Friends.js,
// mixed with UI calls (setShowIndicator, toasts, modal state). The screen now only calls these
// and handles the UI part. Behaviour and document shapes are unchanged (including the
// `res.data().email` lower-case field, which looks like a typo for `Email` but was already that way).
// NOTE: the setDoc/deleteDoc promises are intentionally not awaited by most callers - they only
// resolve once the server acknowledges, which would hang the UI while offline.

// does `ownerId` have `userId` on their block list?
export const isBlockedBy = async (db, ownerId, userId) => {
  const snap = await getDoc(doc(db, 'Users', ownerId, 'Blocked', userId));
  return snap.exists();
}

// writes both sides of a friend request; returns the promise of the receiver-side write
// (used to trigger the push notification once the receiver's doc exists).
export const writeFriendRequest = (db, user, targetId, target) => {
  const received = setDoc(doc(db, 'Users', targetId, 'Received Requests', user.uid), {
    ID: user.uid,
    Name: user.displayName,
    Email: user.email,
    Photo: user.photoURL,
    ignored: false,
    timestamp: serverTimestamp()
  });

  setDoc(doc(db, 'Users', user.uid, 'Sent Requests', targetId), {
    ID: target.ID,
    Name: target.Name,
    Email: target.email,
    Photo: target.Photo,
    timestamp: serverTimestamp()
  });

  return received;
}

export const cancelFriendRequest = (db, user, id) => {
  deleteDoc(doc(db, 'Users', id, 'Received Requests', user.uid));
  deleteDoc(doc(db, 'Users', user.uid, 'Sent Requests', id));
}

export const ignoreFriendRequest = (db, user, id) => {
  updateDoc(doc(db, 'Users', user.uid, 'Received Requests', id), {
    ignored: true,
  });
}

// returns false when the request no longer exists, true when the approval was started
export const approveFriendRequest = async (db, user, id) => {
  const requestCheck = await getDoc(doc(db, 'Users', user.uid, 'Received Requests', id));
  if (!requestCheck.exists()) return false;

  getDoc(doc(db, 'Users', id))
    .then(res => {
      deleteDoc(doc(db, 'Users', id, 'Sent Requests', user.uid));
      deleteDoc(doc(db, 'Users', user.uid, 'Received Requests', id));

      setDoc(doc(db, 'Users', user.uid, 'Friends', id), {
        Name: res.data().Name,
        ID: res.data().ID,
        Email: res.data().email,
        Photo: res.data().Photo,
        since: serverTimestamp()
      });

      setDoc(doc(db, 'Users', id, 'Friends', user.uid), {
        Name: user.displayName,
        ID: user.uid,
        Email: user.email,
        Photo: user.photoURL,
        since: serverTimestamp()
      });
    })
    .catch(err => {
      console.log(err);
    });

  return true;
}

export const removeFriend = (db, user, id) => {
  deleteDoc(doc(db, 'Users', id, 'Friends', user.uid));
  deleteDoc(doc(db, 'Users', user.uid, 'Friends', id));
}

// block someone who is on the friends list (also removes the friendship)
export const blockFriend = (db, user, id) => {
  setDoc(doc(db, 'Users', user.uid, 'Blocked', id), { ID: id });
  removeFriend(db, user, id);
}

// block someone who is not a friend (also drops any pending requests with them)
export const blockUser = (db, user, id) => {
  setDoc(doc(db, 'Users', user.uid, 'Blocked', id), { ID: id });

  getDoc(doc(db, 'Users', user.uid, 'Received Requests', id))
    .then(res => {
      if (res.exists()) deleteDoc(doc(db, 'Users', user.uid, 'Received Requests', id));
    });

  getDoc(doc(db, 'Users', user.uid, 'Sent Requests', id))
    .then(res => {
      if (res.exists()) deleteDoc(doc(db, 'Users', user.uid, 'Sent Requests', id));
    });
}

export const unblockUser = (db, user, id) =>
  deleteDoc(doc(db, 'Users', user.uid, 'Blocked', id));
