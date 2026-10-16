import { doc, getDoc } from 'firebase/firestore';
import { loadImage } from './imageCache';

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// REFACTOR NOTE: screens used to do `const info = await getDoc(doc(db,'Users',id));` followed by
// `loadImage(info.data().Photo, ...)` and `info.data().Name` with no checks. On a cold start the
// network is often not up yet, so Firestore answers from an empty cache (`data()` is undefined ->
// "Cannot read property 'Photo' of undefined") or throws "Failed to get document because the
// client is offline." Both ended up as uncaught promise rejections.
// This returns { ...userDocData, photo: <local image uri> }, or null when the user can't be read,
// so callers can fall back instead of crashing.
//
// It now retries (default 2 more times, 0.8s then 1.6s apart) when the read fails, the doc looks
// missing, or the photo could not be downloaded: those are usually a network that is not up yet, and
// before this a single miss left a participant without name/photo for the whole session. After the
// last attempt it returns what it has (the profile with `photo` undefined) rather than nothing.
export const getUserProfile = async (db, uid, { retries = 2 } = {}) => {
  let partial = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0) await wait(attempt * 800);

    try {
      const snap = await getDoc(doc(db, 'Users', uid));
      if (!snap.exists()) continue;

      const data = snap.data();
      const photo = await loadImage(data.Photo, data.photoExtension);
      if (photo) return { ...data, photo };

      partial = { ...data, photo: undefined };
    } catch (err) {
      console.log('getUserProfile failed for', uid, err);
    }
  }

  return partial;
}
