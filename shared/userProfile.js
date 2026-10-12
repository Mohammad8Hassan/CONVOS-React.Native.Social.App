import { doc, getDoc } from 'firebase/firestore';
import { loadImage } from './imageCache';

// REFACTOR NOTE: screens used to do `const info = await getDoc(doc(db,'Users',id));` followed by
// `loadImage(info.data().Photo, ...)` and `info.data().Name` with no checks. On a cold start the
// network is often not up yet, so Firestore answers from an empty cache (`data()` is undefined ->
// "Cannot read property 'Photo' of undefined") or throws "Failed to get document because the
// client is offline." Both ended up as uncaught promise rejections.
// This returns { ...userDocData, photo: <local image uri> }, or null when the user can't be read,
// so callers can fall back instead of crashing.
export const getUserProfile = async (db, uid) => {
  try {
    const snap = await getDoc(doc(db, 'Users', uid));
    if (!snap.exists()) return null;

    const data = snap.data();
    const photo = await loadImage(data.Photo, data.photoExtension);
    return { ...data, photo };
  } catch (err) {
    console.log('getUserProfile failed for', uid, err);
    return null;
  }
}
