import { useEffect, useRef, useState } from 'react';
import { getFirestore, collection, onSnapshot, query, orderBy, Timestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getUserProfile } from '../shared/userProfile';

const listen = (db, uid, { collectionName, orderField, timeField, dateField, filter }, onResult) => {
  const q = query(collection(db, 'Users', uid, collectionName), orderBy(orderField));

  return onSnapshot(q, async snapShot => {
    let result = [];

    await Promise.all(snapShot.docs.map(async change => {
      if (filter && !filter(change.data())) return;

      const date = change.data()[timeField] === null ? Timestamp.now() : change.data()[timeField];
      const profile = await getUserProfile(db, change.id);

      result.push({ id: change.id, Namee: profile ? profile.Name : change.data().Name, Photoo: profile ? profile.photo : null, ...change.data(), [dateField]: date.toDate() });
    }))

    onResult(result);
  }, error => { console.log(error) })
}

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
