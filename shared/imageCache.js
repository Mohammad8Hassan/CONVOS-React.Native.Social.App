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

const cacheImage = async (uri, cacheUri) => {
  try {
    const createDownload = FileSystem.createDownloadResumable(
      uri,
      cacheUri,
    );
    const downloadImage = await createDownload.downloadAsync();
    return {
      cached: true,
      err: false,
      path: downloadImage.uri,
    };
  }
  catch (error) {
    return {
      cached: false,
      err: true,
      msg: error,
    };
  }
}

// Returns a local file uri for a remote photo, downloading it into the cache dir if needed.
// Returns undefined when the download fails.
export const loadImage = async (photo, photoExtension) => {
  const newUri = /[^=]*$/.exec(photo)[0];
  const cacheFileUri = `${FileSystem.cacheDirectory}${newUri}.${photoExtension}`;
  const isNew = await checkCache(cacheFileUri);
  if (isNew.exists) {
    return cacheFileUri;
  } else {
    let cached = await cacheImage(photo, cacheFileUri);
    if (cached.cached) {
      return cached.path;
    } else {
      console.log("Couldn't load Image!");
      console.log(cached.msg)
    }
  }
}
