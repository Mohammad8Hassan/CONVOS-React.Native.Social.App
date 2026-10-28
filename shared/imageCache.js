import * as FileSystem from 'expo-file-system/legacy';

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

export const loadImage = async (photo, photoExtension) => {
  const newUri = /[^=]*$/.exec(photo)[0];
  const cacheFileUri = `${FileSystem.cacheDirectory}${newUri}.${photoExtension}`;

  if (!inFlight.has(cacheFileUri)) {
    const job = fetchToCache(photo, cacheFileUri).finally(() => inFlight.delete(cacheFileUri));
    inFlight.set(cacheFileUri, job);
  }
  return inFlight.get(cacheFileUri);
}
