import { useEffect, useRef, useState } from 'react';
import { getFirestore, collection, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getUserProfile } from '../shared/userProfile';
import { markConversationOpened, markParticipantEnter, markParticipantExit } from '../services/conversations';

// REFACTOR NOTE: this is the first `useEffect` of screens/Details.js, which was a ~170 line
// onSnapshot -> getDoc -> updateDoc -> onSnapshot pyramid with the "participant added /
// removed / re-entered / just modified" cases inline. It is now split into four named handlers
// below; the behaviour of each case is the same except for the fixes listed at the bottom.
//
// Fixes made while moving it (all were latent bugs):
//  - every change to the conversation doc used to attach ANOTHER participants listener without
//    detaching the previous one; the previous one is now unsubscribed first.
//  - `info.data()` was read unguarded (crashed on a cold start / offline); uses getUserProfile.
//  - the "just modified" case indexed `participantsID[-1]` for people not in the list (e.g. yourself).
//  - `participantsID[index].token` was a statement with no assignment; it now stores the token.
//
// Returns:
//  post              the conversation doc data (null until loaded)
//  allParticipants   map like { <uid>Name, <uid>Photo, <uid>ID, <uid>REM } (null until loaded)
//  participantsIDs   array of the other participants { id, name, photo, token, removed, lastEnter, lastExit, ... }
//  data              copy of participantsIDs, used as FlatList data
//  num               participants count (others + me)
//  convAuthor        ref: { id, uri, name } of the conversation author (the Admin participant)
//  tokensArray       ref: push tokens of the other active participants
export default function useConversationParticipants({ id, navigation }) {
  const db = getFirestore();
  const user = getAuth().currentUser;

  const [post, setPost] = useState(null);
  const [allParticipants, setAllParticipants] = useState(null);
  const [participantsIDs, setParticipantsIDs] = useState(null);
  const [data, setData] = useState(null);
  const [num, setNum] = useState(0);

  const mount = useRef(false);
  const unsubscribeParticipants = useRef();
  const tokensArray = useRef([]);
  const convAuthor = useRef({ id: '', uri: null, name: '' });

  useEffect(() => {
    mount.current = true;

    markConversationOpened(db, user, id);

    // listens to the participants of the conversation. `participants` / `participantsID` are
    // mutated in place across snapshots (as before) and published to state at the end of each one.
    const listenToParticipants = () => {
      let participants = {};
      let participantsID = [];

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

        // REFACTOR NOTE: REM used to be set only after the awaits below. A "modified" change for the same
        // person (e.g. they entered the conversation) arriving while the photo was still downloading saw
        // REM undefined, took the "re-entered" path and pushed them a second time -> duplicate key + a
        // participant listed twice. It is now set before awaiting, and pushes go through upsert().
        participants[change.doc.id + 'REM'] = participant.removed;

        const profile = await getUserProfile(db, change.doc.id);

        const name = profile ? profile.Name : participant.Name;
        const photo = profile ? profile.photo : null;
        const token = profile && profile.ExpoPushToken ? profile.ExpoPushToken : null;

        if(participant.Admin) {
          convAuthor.current = { id: change.doc.id, uri: photo, name: name };
        }

        if (change.doc.id != user.uid && !participant.removed)
          upsert({...participant, id: change.doc.id, photo: photo, name: name, removed: participant.removed, token: token});

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
            removed: change.doc.data().removed, token: token});
        }

        participants[change.doc.id + 'REM'] = false;
      }

      // someone entered/exited: keep their lastEnter/lastExit in sync (used to decide who gets "unread")
      const handleUpdated = async (change) => {
        const index = participantsID.map(e => e.id).indexOf(change.doc.id);
        if(index == -1) return;

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

      return onSnapshot(collection(db, 'Conversations', id, 'Participants'), async snapShot => {
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

        if(mount.current) {
          setAllParticipants({...participants});
          setParticipantsIDs(participantsID);
          setData([...participantsID]);
          setNum(participantsID.length + 1);
        }
      }, error => {console.log(error)});
    }

    // get conv data, make sure it still exists, make sure i'm a participant, make sure component still mounted
    const unsubscribe = onSnapshot(doc(db, 'Conversations', id), async snapShot => {
      if(!snapShot.data()) {
        navigation.replace('Error');
        return;
      }

      // REFACTOR NOTE: this getDoc could throw ("client is offline" on a cold start) and nothing caught it.
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
          if(!mount.current) return; // unmounted while the update was in flight: don't attach a listener nobody detaches
          // REFACTOR NOTE: previous listener is detached first (it used to leak, see top of file)
          if(unsubscribeParticipants.current) unsubscribeParticipants.current();
          unsubscribeParticipants.current = listenToParticipants();
        })
        .catch(err => {console.log("nothing to update")})
    }, error => {console.log(error)})

    return () => {
      mount.current = false;
      markParticipantExit(db, user, id).catch(err => {console.log('nothing here too')})
      unsubscribe();
      if(unsubscribeParticipants.current) unsubscribeParticipants.current();
    }
  }, [])

  return { post, allParticipants, participantsIDs, data, num, convAuthor, tokensArray };
}
