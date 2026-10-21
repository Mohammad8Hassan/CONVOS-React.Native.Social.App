import { useState } from 'react';
import { Keyboard } from 'react-native';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { loadImage } from '../shared/imageCache';
import { isBlockedBy } from '../services/friends';

// REFACTOR NOTE: this is the "search a user by ID" flow that used to be `searchEmail` in
// screens/Friends.js: a 4-level nested getDoc().then().catch() chain that repeated the same
// five state setters in every branch (+ 7 separate useStates in the screen). It is now a flat
// async function that works out the result first and sets state once.
// A failed read in one of the "is friend / sent / received" checks is still treated as
// "no" and falls through to the next check, as the old `.catch` chain did.
const existsOrFalse = async (ref) => {
  try { return (await getDoc(ref)).exists(); } catch (err) { console.log('search check failed', err); return false; }
}

export default function useFriendSearch() {
  const db = getFirestore();
  const user = getAuth().currentUser;

  const [searchedID, setSearchedID] = useState('');
  const [found, setFound] = useState(false);
  const [emailResult, setEmailResult] = useState('');
  const [caption, setCaption] = useState('');
  const [url, setUrl] = useState(null);
  const [connection, setConnection] = useState('');
  const [searchIndicator, setSearchIndicator] = useState(false);

  const reset = () => {
    setEmailResult('');
    setFound(false);
    setSearchedID('');
    setCaption('');
    setConnection('');
    setUrl(null);
  }

  const show = ({ name, photo = null, caption = '', connection = '' }) => {
    setEmailResult(name);
    setUrl(photo);
    setCaption(caption);
    setConnection(connection);
    setFound(true);
    setSearchIndicator(false);
  }

  // `scannedID` is passed when the ID comes from a QR scan: the state set by the scan has not been applied yet
  const search = async (scannedID) => {
    Keyboard.dismiss();
    setSearchIndicator(true);
    setUrl(null);
    setConnection('');
    setEmailResult('');
    setCaption('');

    // like before, only the lookup uses the whitespace-stripped ID; `searchedID` state keeps what was typed
    const id = (typeof scannedID === 'string' ? scannedID : searchedID).replace(/\s/g, '');

    if (id.trim().length === 0) return show({ name: 'no users found!' });
    if (id == user.uid) return show({ name: "Sorry, you can't add yourself!" });

    try {
      if (await isBlockedBy(db, id, user.uid)) return show({ name: 'no users found!' });

      const res = await getDoc(doc(db, 'Users', id));
      if (!res.exists()) throw 'no user found throw';

      const name = res.data().Name;
      const photo = await loadImage(res.data().Photo, res.data().photoExtension);

      if (await isBlockedBy(db, user.uid, id))
        return show({ name, photo, caption: 'You blocked ' + name, connection: 'blocked' });

      if (await existsOrFalse(doc(db, 'Users', user.uid, 'Friends', res.id)))
        return show({ name, photo, caption: 'You are already friends with ' + name, connection: 'friend' });

      if (await existsOrFalse(doc(db, 'Users', user.uid, 'Sent Requests', res.id)))
        return show({ name, photo, caption: 'You have already sent a friend request to ' + name, connection: 'sent' });

      if (await existsOrFalse(doc(db, 'Users', user.uid, 'Received Requests', res.id)))
        return show({ name, photo, caption: name + ' sent you a friend request!', connection: 'received' });

      if (res.data().settings && res.data().settings.friendRequests === 'nobody')
        return show({ name, photo, caption: name + ' is not accepting friend requests', connection: 'closed' });

      show({ name, photo, connection: 'new' });
    } catch (err) {
      console.log('search catch', err);
      show({ name: 'no users found! ID is case sensitive' });
    }
  }

  return {
    searchedID, setSearchedID, found, emailResult, caption, url, connection, searchIndicator,
    search, reset,
  };
}
