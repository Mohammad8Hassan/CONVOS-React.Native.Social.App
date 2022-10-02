import React, { useEffect, useRef, useState } from "react";
import { Alert, Image, View, ActivityIndicator } from "react-native";
import * as FileSystem from "expo-file-system";
import { getStorage, ref, getDownloadURL, getMetadata } from 'firebase/storage'
import { updateDoc, getFirestore, doc, getDoc,  } from 'firebase/firestore';



// function getImgXtension(uri) {
//   var basename = uri.split(/[\\/]/).pop();
//   return /[.]/.exec(basename) ? /[^.]+$/.exec(basename) : undefined;
// }

async function findImageInCache(uri) {
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


async function cacheImage(uri, cacheUri, callback) {
  console.log('uri to download from: ', uri);
  try {
    const downloadImage = FileSystem.createDownloadResumable(
      uri,
      cacheUri,
      {},
      callback
    );
    // console.log(downloadImage.uri);
    const downloaded = await downloadImage.downloadAsync();
    return {
      cached: true,
      err: false,
      path: downloaded.uri,
    };
  } catch (error) {
    return {
      cached: false,
      err: true,
      msg: error,
    };
  }
}

export default function CachableImage(props) {
  const {
    source: { uri },
    cacheKey,
    style,
    id,
    xt
  } = props;

  const isMounted = useRef(true);
  const [imgUri, setUri] = useState("");
  const storage = getStorage();
  const db = getFirestore();

  useEffect(() => {
    async function loadImg() {
      // const xt = await getDoc(doc(db, 'Users', id));

      const cacheFileUri = `${FileSystem.cacheDirectory}${cacheKey}.${xt}`;
      console.log(cacheFileUri);

      let imgXistsInCache = await findImageInCache(cacheFileUri);
      if (imgXistsInCache.exists) {
        console.log("cached!");
        setUri(cacheFileUri);
      } else {
        let cached = await cacheImage(uri, cacheFileUri, () => {});
        if (cached.cached) {
          console.log("cached new!");
          setUri(cached.path);
        } else {
          Alert.alert(`Couldn't load Image!`);
          // console.log(cached.msg)
        }
      }
    }

    loadImg();

    return () => (isMounted.current = false);
  }, []);


  return (
    <>
      {imgUri ? (
        <Image source={{ uri: imgUri }} style={style} />
      ) : (
        <View
          style={{ ...style, alignItems: "center", justifyContent: "center", backgroundColor:'#613a5f' }}
        >
          <ActivityIndicator size={33} />
        </View>
      )}
    </>
  );
};
