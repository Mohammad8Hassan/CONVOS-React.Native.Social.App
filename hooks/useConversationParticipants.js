import { useEffect, useRef, useState } from 'react';
import { getFirestore, collection, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getUserProfile } from '../shared/userProfile';
import { markConversationOpened, markParticipantEnter, markParticipantExit } from '../services/conversations';
import { wantsPush } from '../services/notifications';

export default function useConversationParticipants({ id, navigation }) {
  const db = getFirestore();
  const user = getAuth().currentUser;

  const [post, setPost] = useState(null);
  const [allParticipants, setAllParticipants] = useState(null);
  const [participantsIDs, setParticipantsIDs] = useState(null);
  const [data, setData] = useState(null);
  const [num, setNum] = useState(0);
  const [myMuted, setMyMuted] = useState(false); // I muted this conversation's pushes

  const mount = useRef(false);
  const unsubscribeParticipants = useRef();
  const tokensArray = useRef([]);
  const convAuthor = useRef({ id: '', uri: null, name: '' });

  useEffect(() => {
    mount.current = true;

    markConversationOpened(db, user, id);

    const onListenError = (error) => {
      console.log(error);
      if(error && error.code == 'permission-denied' && mount.current)
        navigation.replace('Error');
    }

    const listenToParticipants = () => {
      let participants = {};
      let participantsID = [];

      const publish = () => {
        if(!mount.current) return;
        setAllParticipants({...participants});
        setParticipantsIDs(participantsID);
        setData([...participantsID]);
        setNum(participantsID.length + 1);
      }

      const retryTimers = new Set();
      const retryProfile = (uid, attempt = 1) => {
        if(attempt > 4) return;

        const timer = setTimeout(async () => {
          retryTimers.delete(timer);
          if(!mount.current) return;

          const profile = await getUserProfile(db, uid, { retries: 0 });
          if(!mount.current) return;
          if(!profile || !profile.photo) return retryProfile(uid, attempt + 1);

          participants[uid + 'Name'] = profile.Name;
          participants[uid + 'Photo'] = profile.photo;

          const index = participantsID.findIndex(e => e.id == uid);
          if(index != -1) participantsID[index] = {...participantsID[index], name: profile.Name, photo: profile.photo};

          if(convAuthor.current.id == uid) convAuthor.current = { id: uid, uri: profile.photo, name: profile.Name };

          publish();
        }, attempt * 3000);
        retryTimers.add(timer);
      }

      const addToken = (token) => {
        if(token && !tokensArray.current.find(e => e == token))
          tokensArray.current.push(token);
      }

      // add the participant, or replace the entry if it is already in the list (never twice)
      const upsert = (entry) => {
        const index = participantsID.findIndex(e => e.id == entry.id);
        if(index == -1) participantsID.push(entry);
        else participantsID[index] = entry;
      }

      const handleAdded = async (change) => {
        const participant = change.doc.data();

        participants[change.doc.id + 'REM'] = participant.removed;

        const profile = await getUserProfile(db, change.doc.id);

        const name = profile ? profile.Name : participant.Name;
        const photo = profile ? profile.photo : null;
        const token = profile && profile.ExpoPushToken ? profile.ExpoPushToken : null;

        if(!profile || !profile.photo) retryProfile(change.doc.id);

        if(participant.Admin) {
          convAuthor.current = { id: change.doc.id, uri: photo, name: name };
        }

        if (change.doc.id != user.uid && !participant.removed)
          upsert({...participant, id: change.doc.id, photo: photo, name: name, removed: participant.removed, token: token,
            notify: wantsPush(profile, 'notifyConversations')});

        participants[change.doc.id + 'Name'] = name;
        participants[change.doc.id + 'Photo'] = photo;
        participants[change.doc.id + 'ID'] = change.doc.id;

        if(change.doc.id != user.uid && !participant.removed)
          addToken(token);
      }

      const handleRemoved = (change) => {
        if(change.doc.id == user.uid) {
          navigation.replace('Error');
          return;
        }

        const index = participantsID.map(e => e.id).indexOf(change.doc.id);

        if(index != -1) {
          if(participantsID[index].token) {
            const index2 = tokensArray.current.indexOf(participantsID[index].token);
            if(index2 != -1) tokensArray.current.splice(index2, 1);
          }
          participantsID.splice(index, 1);
        }

        participants[change.doc.id + 'REM'] = true;
      }

      const handleReEntered = async (change) => {
        const profile = await getUserProfile(db, change.doc.id);
        const token = profile ? profile.ExpoPushToken : undefined;

        if(change.doc.id != user.uid) addToken(token);

        if (change.doc.id != user.uid && !change.doc.data().removed) {
          upsert({...change.doc.data(), id: change.doc.id,
            photo: participants[change.doc.id + 'Photo'], name: participants[change.doc.id + 'Name'],
            removed: change.doc.data().removed, token: token, notify: wantsPush(profile, 'notifyConversations')});
        }

        participants[change.doc.id + 'REM'] = false;
      }

      const handleUpdated = async (change) => {
        const index = participantsID.map(e => e.id).indexOf(change.doc.id);
        if(index == -1) return;

        participantsID[index].muted = change.doc.data().muted === true;
        participantsID[index].lastEnter = change.doc.data().lastEnter;
        participantsID[index].lastExit = change.doc.data().lastExit;

        if(!participantsID[index].token) {
          const profile = await getUserProfile(db, change.doc.id);
          if(profile && profile.ExpoPushToken && change.doc.id != user.uid) {
            addToken(profile.ExpoPushToken);
            participantsID[index].token = profile.ExpoPushToken;
          }
        }
      }

      const unsubscribe = onSnapshot(collection(db, 'Conversations', id, 'Participants'), async snapShot => {
        const me = snapShot.docs.find(d => d.id == user.uid);
        if(me && mount.current) setMyMuted(me.data().muted === true);

        await Promise.all(snapShot.docChanges().map(async change => {
          if(change.type === 'added') {
            await handleAdded(change);
          }
          else if(change.type === 'modified' && (change.doc.data().removed !== participants[change.doc.id + 'REM'])) {
            if(change.doc.data().removed == true)
              handleRemoved(change);
            else if(change.doc.data().removed == false)
              await handleReEntered(change);
          }
          else if(change.type == 'modified') {
            await handleUpdated(change);
          }
        }))

        publish();
      }, onListenError);

      return () => {
        unsubscribe();
        retryTimers.forEach(clearTimeout);
        retryTimers.clear();
      };
    }

    // get conv data, make sure it still exists, make sure i'm a participant, make sure component still mounted
    const unsubscribe = onSnapshot(doc(db, 'Conversations', id), async snapShot => {
      if(!snapShot.data()) {
        navigation.replace('Error');
        return;
      }

      let checkExist;
      try {
        checkExist = await getDoc(doc(db, 'Conversations', id, 'Participants', user.uid))
      } catch(err) {
        console.log(err);
        return;
      }
      if(!(checkExist.exists() && checkExist.data().removed == false)) {
        navigation.replace('Error');
        return;
      }

      if(!mount.current) return;

      setPost(snapShot.data());

      markParticipantEnter(db, user, id)
        .then(() => {
          if(!mount.current) return;
          if(unsubscribeParticipants.current) unsubscribeParticipants.current();
          unsubscribeParticipants.current = listenToParticipants();
        })
        .catch(err => {console.log("nothing to update")})
    }, onListenError)

    return () => {
      mount.current = false;
      markParticipantExit(db, user, id).catch(err => {console.log('nothing here too')})
      unsubscribe();
      if(unsubscribeParticipants.current) unsubscribeParticipants.current();
    }
  }, [])

  return { post, allParticipants, participantsIDs, data, num, convAuthor, tokensArray, myMuted };
}
