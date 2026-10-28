import { doc, getDoc } from 'firebase/firestore';
import { loadImage } from './imageCache';

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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
