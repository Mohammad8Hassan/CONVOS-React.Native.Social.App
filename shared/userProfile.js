import { doc, getDoc } from 'firebase/firestore';
import { loadImage } from './imageCache';

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Safe read of another user's profile. Returns { ...userDocData, photo: <local image uri> }, or null when the
// user can't be read, so callers can fall back instead of crashing. On a cold start the network is often not up
// yet (Firestore answers from an empty cache or throws "client is offline"), so it retries when the read fails,
// the doc looks missing or the photo could not be downloaded (0.8s then 1.6s apart by default).
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
