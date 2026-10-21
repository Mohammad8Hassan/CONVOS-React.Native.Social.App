import { useEffect, useState } from 'react';
import { Keyboard } from 'react-native';
import { getFirestore, collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getUserProfile } from '../shared/userProfile';

// "Who do I invite" logic of the new-conversation screen. There is one ordered list, `selected`, where every
// entry looks like { ...userDoc, name, photo, kind: 'friend' | 'other' }; the friends/others lists and the
// counts are derived from it.
export default function useInvitees() {
  const db = getFirestore();
  const user = getAuth().currentUser;

  const [friends, setFriends] = useState([]);
  const [selected, setSelected] = useState([]);
  const [searchStatus, setSearchStatus] = useState(null);
  const [searchName, setSearchName] = useState(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const res = await getDocs(collection(db, 'Users', user.uid, 'Friends'));
        const list = await Promise.all(res.docs.map(async dok => {
          const profile = await getUserProfile(db, dok.id);
          return profile ? {...profile, name: profile.Name} : null;
        }));

        if(active) setFriends(list.filter(Boolean));
      } catch(err) {
        console.log(err);
      }
    }
    load();

    return () => { active = false; }
  }, [])

  const selectedFriends = selected.filter(e => e.kind == 'friend');
  const selectedOthers = selected.filter(e => e.kind == 'other');

  const addFriend = (id) => {
    const friend = friends.find(e => e.ID === id);
    if(!friend) return;

    setSelected(prev => prev.find(e => e.ID === id) ? prev : [...prev, {...friend, kind: 'friend'}]);
  }

  const removeSelected = (id) => {
    const person = selected.find(e => e.ID === id);
    if(person && person.kind == 'other') setSearchStatus(null);

    setSelected(prev => prev.filter(e => e.ID !== id));
  }

  const clearSearchStatus = () => setSearchStatus(null);

  // look a user up by ID and add them as an "other" invitee
  const addOther = async (rawID) => {
    setSearching(true);
    setSearchStatus('');
    Keyboard.dismiss();
    setSearchName(null);

    const finish = (status, name = null) => {
      setSearchStatus(status);
      setSearchName(name);
      setSearching(false);
    }

    const searchID = rawID.replace(/\s/g,'');

    if(searchID.trim().length === 0)
      return finish('No users found!');

    if(searchID == user.uid)
      return finish("You are already participating as the admin.");

    const friend = friends.find(e => e.ID === searchID);
    if(friend)
      return finish(' is on your friends list, you can add them from the friends tab.', friend.Name);

    try {
      const checkBlocked = await getDoc(doc(db, "Users", searchID, 'Blocked', user.uid));
      if(checkBlocked.exists())
        return finish('No users found!');

      const already = selectedOthers.find(e => e.ID === searchID);
      if(already)
        return finish(' is already added!', already.Name);

      const res = await getDoc(doc(db, 'Users', searchID));
      if(!res.exists())
        return finish('No users found!');

      const data = res.data();
      setSelected(prev => [...prev, {...data, name: data.Name, photo: data.Photo, kind: 'other'}]);
      setSearching(false);
    } catch(err) {
      console.log(err);
      finish('No users found!');
    }
  }

  return {
    friends, selected, selectedFriends, selectedOthers,
    addFriend, addOther, removeSelected,
    searchStatus, searchName, searching, clearSearchStatus,
  };
}
