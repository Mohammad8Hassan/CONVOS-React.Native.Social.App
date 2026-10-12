import { useEffect, useRef, useState } from 'react';
import { getFirestore, collection, onSnapshot, query, orderBy, Timestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getUserProfile } from '../shared/userProfile';

// REFACTOR NOTE: this replaces three ~35 line onSnapshot blocks that sat in the body of
// screens/Friends.js (Sent Requests, Received Requests, Friends). They were identical apart from
// the collection, the sort field, the timestamp field and a filter, so there is one `listen`
// helper now. Also removed ~40 lines of commented-out older versions of the same loops.
// The "num" states (sentRequestsNum, ...) are no longer separate useStates; they are list.length.
//
// Each list item is { id, Namee, Photoo, ...docData, <dateField>: Date }, same as before.
const listen = (db, uid, { collectionName, orderField, timeField, dateField, filter }, onResult) => {
  const q = query(collection(db, 'Users', uid, collectionName), orderBy(orderField));

  return onSnapshot(q, async snapShot => {
    let result = [];

    await Promise.all(snapShot.docs.map(async change => {
      if (filter && !filter(change.data())) return;

      const date = change.data()[timeField] === null ? Timestamp.now() : change.data()[timeField];
      // REFACTOR NOTE: used to read info.data().Photo / .Name straight from getDoc, which crashed
      // (or rejected) when the user doc was not readable yet (offline on cold start). Falls back
      // to the name stored on the request/friend doc itself and no photo.
      const profile = await getUserProfile(db, change.id);

      result.push({ id: change.id, Namee: profile ? profile.Name : change.data().Name, Photoo: profile ? profile.photo : null, ...change.data(), [dateField]: date.toDate() });
    }))

    onResult(result);
  }, error => { console.log(error) })
}

// `onFirstFriendsLoad` runs once, the first time the friends list arrives (the screen uses it
// to select the "friends" tab).
export default function useFriendsData(onFirstFriendsLoad) {
  const db = getFirestore();
  const user = getAuth().currentUser;

  const [sentRequests, setSentRequests] = useState(null);
  const [receivedRequests, setReceivedRequests] = useState(null);
  const [friends, setFriends] = useState(null);
  const [listIndicator, setListIndicator] = useState(true);

  const firstRender = useRef(true);

  useEffect(() => {
    const unsubscribeSent = listen(db, user.uid,
      { collectionName: 'Sent Requests', orderField: 'timestamp', timeField: 'timestamp', dateField: 'dateSent' },
      setSentRequests);

    const unsubscribeReceived = listen(db, user.uid,
      { collectionName: 'Received Requests', orderField: 'timestamp', timeField: 'timestamp', dateField: 'dateReceived',
        filter: data => data.ignored === false },
      setReceivedRequests);

    const unsubscribeFriends = listen(db, user.uid,
      { collectionName: 'Friends', orderField: 'Name', timeField: 'since', dateField: 'since' },
      result => {
        setFriends(result);
        setListIndicator(false);

        if (firstRender.current) {
          onFirstFriendsLoad && onFirstFriendsLoad();
          firstRender.current = false;
        }
      });

    return () => {
      unsubscribeSent();
      unsubscribeReceived();
      unsubscribeFriends();
    }
  }, [])

  return {
    friends, friendsNum: friends ? friends.length : 0,
    receivedRequests, receivedRequestsNum: receivedRequests ? receivedRequests.length : 0,
    sentRequests, sentRequestsNum: sentRequests ? sentRequests.length : 0,
    listIndicator,
  };
}
