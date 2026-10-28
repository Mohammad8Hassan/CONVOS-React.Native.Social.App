import { useCallback, useEffect, useRef, useState } from 'react';
import { getFirestore, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { notify } from '../shared/notify';

export const DEFAULT_SETTINGS = {
  notifyConversations: true, // pushes for new messages
  notifyFriends: true,       // pushes for friend requests
  notifyInvites: true,       // pushes for conversation invites
  friendRequests: 'everyone', // 'everyone' | 'nobody'
};

export default function useUserSettings() {
  const db = getFirestore();
  const user = getAuth().currentUser;

  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  const current = useRef(settings);
  current.current = settings;

  useEffect(() => {
    return onSnapshot(doc(db, 'Users', user.uid), snap => {
      const saved = snap.exists() && snap.data().settings ? snap.data().settings : {};
      setSettings({ ...DEFAULT_SETTINGS, ...saved });
      setLoaded(true);
    }, err => { console.log(err); setLoaded(true); });
  }, [])

  const update = useCallback(async (key, value) => {
    const previous = current.current[key];
    setSettings(s => ({ ...s, [key]: value }));
    try {
      await updateDoc(doc(db, 'Users', user.uid), { ['settings.' + key]: value });
    } catch (err) {
      console.log(err);
      setSettings(s => ({ ...s, [key]: previous }));
      notify('Could not save the setting');
    }
  }, [])

  return { settings, loaded, update };
}
