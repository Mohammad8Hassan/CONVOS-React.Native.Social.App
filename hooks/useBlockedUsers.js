import { useCallback, useEffect, useState } from 'react';
import { getFirestore, collection, onSnapshot } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getUserProfile } from '../shared/userProfile';
import { unblockUser } from '../services/friends';

// People on my block list ( Users/{me}/Blocked ) with their name and photo. A blocked person whose profile
// can't be read is still listed (by ID) so they can be unblocked.
export default function useBlockedUsers() {
  const db = getFirestore();
  const user = getAuth().currentUser;

  const [blocked, setBlocked] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const unsubscribe = onSnapshot(collection(db, 'Users', user.uid, 'Blocked'), async snap => {
      const list = await Promise.all(snap.docs.map(async d => {
        const profile = await getUserProfile(db, d.id, { retries: 1 });
        return { id: d.id, name: profile ? profile.Name : null, photo: profile ? profile.photo : null };
      }));

      if(!active) return;
      setBlocked(list.sort((a, b) => (a.name || a.id).localeCompare(b.name || b.id)));
      setLoading(false);
    }, err => { console.log(err); if(active) setLoading(false); });

    return () => { active = false; unsubscribe(); };
  }, [])

  const unblock = useCallback((id) => unblockUser(db, user, id), [])

  return { blocked, loading, unblock };
}
