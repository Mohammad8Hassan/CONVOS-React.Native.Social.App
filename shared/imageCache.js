import * as FileSystem from 'expo-file-system/legacy';

// REFACTOR NOTE: checkCache / cacheImage / loadImage used to be copy-pasted inside
// Details, EditProfile, Friends, Home, Invites, NewConv and Settings (7 identical copies).
// They now live here once; screens just `import { loadImage } from '../shared/imageCache'`.

const checkCache = async (uri) => {
  try {
    let info = await FileSystem.getInfoAsync(uri);
    return { ...info, err: false };
  } catch (error) {
    return {
      exists: false,
      err: true,
      msg: error,
    };
  }
}

// Downloads to a temporary file and moves it into place only when the download finished with a 200, so
// an interrupted or failed download can't leave a partial/HTML file that later counts as "cached".
const cacheImage = async (uri, cacheUri) => {
  const tmpUri = cacheUri + '.tmp';
  try {
    const createDownload = FileSystem.createDownloadResumable(uri, tmpUri);
    const downloadImage = await createDownload.downloadAsync();
    if (!downloadImage || downloadImage.status !== 200) {
      await FileSystem.deleteAsync(tmpUri, { idempotent: true });
      return { cached: false, err: true, msg: 'download failed, status ' + (downloadImage && downloadImage.status) };
    }
    await FileSystem.deleteAsync(cacheUri, { idempotent: true });
    await FileSystem.moveAsync({ from: tmpUri, to: cacheUri });
    return {
      cached: true,
      err: false,
      path: cacheUri,
    };
  }
  catch (error) {
    FileSystem.deleteAsync(tmpUri, { idempotent: true }).catch(() => {});
    return {
      cached: false,
      err: true,
      msg: error,
    };
  }
}

// Downloads in flight, by cache path. Several people in one conversation often share a photo (everybody
// starts with the same default avatar), and parallel downloads of the same file into the same path
// corrupted each other: some of them failed and the avatar/name never showed. Now they share one download.
const inFlight = new Map();

const fetchToCache = async (photo, cacheFileUri) => {
  const isNew = await checkCache(cacheFileUri);
  if (isNew.exists) {
    return cacheFileUri;
  }

  let cached = await cacheImage(photo, cacheFileUri);
  if (cached.cached) {
    return cached.path;
  }

  console.log("Couldn't load Image!");
  console.log(cached.msg)
}

// Returns a local file uri for a remote photo, downloading it into the cache dir if needed.
// Returns undefined when the download fails.
export const loadImage = async (photo, photoExtension) => {
  const newUri = /[^=]*$/.exec(photo)[0];
  const cacheFileUri = `${FileSystem.cacheDirectory}${newUri}.${photoExtension}`;

  if (!inFlight.has(cacheFileUri)) {
    const job = fetchToCache(photo, cacheFileUri).finally(() => inFlight.delete(cacheFileUri));
    inFlight.set(cacheFileUri, job);
  }
  return inFlight.get(cacheFileUri);
}
