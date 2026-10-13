import { StyleSheet, Text, View, Image, ScrollView, TouchableOpacity, Modal, TextInput,
  Pressable, TouchableWithoutFeedback, ToastAndroid, Keyboard, FlatList, Alert, ActivityIndicator,
  RefreshControl, Platform} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState, useCallback, useRef } from 'react';
//import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Entypo } from '@expo/vector-icons';
import { getFirestore, addDoc, collection, serverTimestamp, onSnapshot, query, orderBy, doc, 
 deleteDoc, Timestamp, setDoc, getDocs, where, getDoc, updateDoc, initializeFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth';
import avatar from '../assets/Imgs/avatar.png';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Menu, MenuOptions, MenuOption, MenuTrigger, } from 'react-native-popup-menu';
import _ from 'lodash';
import { useIsFocused } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { setNewKey } from '../features/themeSlice';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { getApp } from 'firebase/app';
import * as Device from 'expo-device';
import { loadImage } from '../shared/imageCache';
import { confirm } from '../shared/confirm';
import { getUserProfile } from '../shared/userProfile';
import { joinConversation as joinConversationOnServer, joinErrorMessage } from '../services/conversations';

export default function Friends({ navigation }) {

 const AdID = (!Device.isDevice || __DEV__)? TestIds.BANNER : "ca-app-pub-4623463929646643/6389070912";

 const db = getFirestore();

//  const db = initializeFirestore(getApp(), {experimentalForceLongPolling: true, useFetchStreams:false});

 const storage = getStorage();
 const user = getAuth().currentUser;
 const defaultImg = Image.resolveAssetSource(avatar).uri;
 const focused = useIsFocused();
 const totatlNum = useRef(0);
 const flagFriends = useRef('...');
 const flagOthers = useRef('...');
 const myData = useRef({});

 const [FriendsInvites, setFriendsInvites] = useState(null);
 const [FriendsInvitesNum, setFriendsInvitesNum] = useState(0);
 const [OthersInvites, setOthersInvites] = useState(null);
 const [OthersInvitesNum, setOthersInvitesNum] = useState(0);
 const [Data, setData] = useState(null);
 const [selector, setSelector] = useState('');
 const [title, setTitle] = useState('');
 const [num, setNum] = useState(0);
 const [listIndicator, setListIndicator] = useState(true);
 const [refreshing, setRefreshing] = useState(false);

 //redux store
 const dispatch = useDispatch();
 const { mainColor, backgroundColor, tabColor, iconColor,
    iconActiveColor, conAuthorBarColor, convAuthorTextColor, homeConvTitleColor,
    homeConvBodyColor, topButtonsColors, userNameColor, userIDColor, actionColor, actionInsideColor,
    headerTextColor, convAuthorPic, topButtonsBar, titleBackground, inviteBackground, inviteAuthor, inviteDate,
    titleColor, selectorColor, inviteAuthBar, inviteTitleBar
  } = useSelector(state => state.theme);

 useEffect(() => {
  if(focused)
    joinResponse.cancel();
 }, [focused])
 
 useEffect(() => {
  getDoc(doc(db, "Users", user.uid))
    .then(res => {
      myData.current = res.data();
    })
    // REFACTOR NOTE: had no .catch, so "client is offline" on a cold start was an uncaught promise rejection.
    .catch(err => {
      console.log(err);
    })

   // Friends Invites
   const colRef3 = collection(db, 'Users', user.uid, 'Friends Invites');
   const q3 = query(colRef3, orderBy('timeStamp'));
   const unsubscribe1 = onSnapshot(q3, async snapShot => {
     let result = [];
     let num = 0;

     for (const dok of snapShot.docs) {
      const empty = dok.data().timeStamp === null ? Timestamp.now() : dok.data().timeStamp;
      // REFACTOR NOTE: the old try/catch swallowed the read error but then used `info.data().Name`
      // outside it, so a failed/missing user doc still crashed. getUserProfile returns null instead.
      const profile = await getUserProfile(db, dok.data().authorID);

      result.unshift({...dok.data(), ID: dok.id, timeStamp: empty.toDate(), Name: profile ? profile.Name : '', Photo: profile ? profile.photo : null});
      num++;
     }
    //  console.log(result);
     setSelector('friends');
     setFriendsInvites(result);
     setFriendsInvitesNum(num);
     flagFriends.current = 'done';
     setTitle('Friends Conversations Invites - ')
     setData(result);
     setListIndicator(false);
   }, error => {console.log(error)})

   // Others Invites
   const colRef2 = collection(db, 'Users', user.uid, 'Other Invites');
   const q2 = query(colRef2, orderBy('timeStamp'));
   const unsubscribe2 = onSnapshot(q2, async snapShot => {
     let result = [];
     let num = 0;
    
     for (const dok of snapShot.docs) {
       const empty = dok.data().timeStamp === null ? Timestamp.now() : dok.data().timeStamp;
       // REFACTOR NOTE: same unguarded getDoc + info.data() as above, now via getUserProfile.
       const profile = await getUserProfile(db, dok.data().authorID);

       result.unshift({...dok.data(), ID: dok.id,  timeStamp: empty.toDate(), Name: profile ? profile.Name : '', Photo: profile ? profile.photo : null});
       num++;
     }

     setOthersInvites(result);
     setOthersInvitesNum(num);
     flagOthers.current = 'done';
   }, error => {console.log(error)})

   return () => {
    unsubscribe1();
    unsubscribe2();
   }
 }, [])


 useEffect(() => {
   setNum(FriendsInvitesNum)
 }, [FriendsInvitesNum])


 useEffect(() => {
  if(flagFriends.current == 'done' && flagOthers.current == 'done') {
    totatlNum.current = FriendsInvitesNum + OthersInvitesNum;
    //dispatch(incrementByValue(totatlNum.current));
    navigation.setOptions({
      tabBarBadge: totatlNum.current == 0? null : totatlNum.current
    })
  }
  
 }, [FriendsInvitesNum, OthersInvitesNum])

 const onRefresh = useCallback(() => {
  setRefreshing(true);
  dispatch(setNewKey());
}, [])

 const selectFriends = () => {
  setData(FriendsInvites); 
  setSelector('friends'); 
  setTitle('Friends Conversations Invites - '); 
  setNum(FriendsInvitesNum)
 }

 const selectOthers = () => {
  console.log('OtherInvites ', OthersInvites);
  setData(OthersInvites); 
  setSelector('others'); 
  setTitle('Others Conversations Invites - '); 
  setNum(OthersInvitesNum)
 }

// REFACTOR NOTE: joinFriendConversation and joinOtherConversation used to write the participant, "My
 // Conversations" and "joined" comment documents from the phone (~55 lines each, almost identical).
 // Both are now one call to the joinConversation Cloud Function, which accepts the invite (instead of
 // the conversation password) and removes it.
 const joinFromInvite = async (id, inviteCollection) => {
  try {
    await joinConversationOnServer(id);

    if(Platform.OS === 'android')
      ToastAndroid.show('Joined Conversation', ToastAndroid.SHORT);

    // REFACTOR NOTE: was navigation.navigate('Details', { id }). Details lives in the Home tab's stack and this
    // screen is a sibling tab; React Navigation 7 (the Expo upgrade moved from 6) no longer finds screens
    // inside another tab's navigator, so the join worked but opening the conversation threw "NAVIGATE ...
    // was not handled by any navigator". The parent tab is named explicitly now.
    navigation.navigate('Home', { screen: 'Details', params: { id } });
  }
  catch(err) {
    console.log(err);

    let message = joinErrorMessage(err);
    // only delete the invite when the server says the *conversation* is gone: a plain "not-found" can
    // also mean the function itself could not be reached (wrong region / not deployed)
    if(err.code == 'functions/not-found' && err.details && err.details.reason == 'conversation-not-found') {
      message = 'Conversation no longer exist';
      deleteDoc(doc(db, 'Users', user.uid, inviteCollection, id));
    }
    else if(err.code == 'functions/failed-precondition') {
      message = 'This invite is no longer valid. Ask for the conversation password to join.';
    }

    Alert.alert('Error', message, [{ text: 'Close', style: 'cancel' }], { cancelable: true });
  }
 }

 const joinFriendConversation = (id) => joinFromInvite(id, 'Friends Invites');

 const AlertDeleteFriend = (id) => {
  console.log(id);
  const ID = id;
  // REFACTOR NOTE: this used to be an inline Alert.alert(...) with Cancel + "confirm" buttons (~16 lines); now uses confirm().
  confirm('Delete Invite?', '', () => deleteFriendInvite(ID))
}

const AlertDeleteOther = (id) => {
  console.log(id);
  const ID = id;
  // REFACTOR NOTE: this used to be an inline Alert.alert(...) with Cancel + "confirm" buttons (~16 lines); now uses confirm().
  confirm('Delete Invite?', '', () => deleteOtherInvite(ID))
}

 const deleteFriendInvite = (id) => {
  //need confirm....
  deleteDoc(doc(db, 'Users', user.uid, 'Friends Invites', id));
 }

  // REFACTOR NOTE: checkCache / cacheImage / loadImage used to be defined right here (~54 lines,
  // identical copy in 7 screens). They are now imported from ../shared/imageCache.

 const joinOtherConversation = (id) => joinFromInvite(id, 'Other Invites');

 const deleteOtherInvite = (id) => {
  // REFACTOR NOTE: this used the collection name 'Others Invites' (typo); the real one is 'Other Invites',
  // so dismissing an "others" invite never deleted anything.
  deleteDoc(doc(db, 'Users', user.uid, 'Other Invites', id));
 }

 const renderList = (data, listTitle, listNum) => {
  return(
    <View style={{flex:1, marginBottom:20}}>
      <View style={{flexDirection: 'row', backgroundColor:titleBackground, alignItems:'center', paddingLeft:8}}>
        <Text style={{color:titleColor, fontSize:19, fontFamily:'Solway-Regular'}}>{ listTitle }</Text>
        <Text style={{color:iconActiveColor, fontSize:19, marginLeft:5, fontFamily:'Solway-Regular'}}>{ listNum }</Text>
      </View>

      <View style={{flex:1, marginTop:5, padding:4}}>
        {(data.length == 0)? (
          <View style={[styles.newMid, {borderColor:topButtonsColors}]}>
          <Entypo name='inbox' size={80} color={topButtonsColors} style={{opacity:0.5, marginBottom:10}}/>
          <Text style={{color:topButtonsColors, fontSize:18, fontFamily:'Solway-Regular', opacity:0.5}}>
              Invites to conversations will appear here
            </Text>
          </View>
        )
        : 
        (
          <FlatList data={data} removeClippedSubviews={false} refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#613a5f']} />
          } renderItem={({ item }) => (
            <View style={[styles.item, {backgroundColor:inviteBackground}]}>

              <View style={{margin:15}}>
                <Text style={{color:'white', fontSize:20, padding:5, backgroundColor:inviteTitleBar}} numberOfLines={2} selectable>{ item.title }</Text>
              </View>

              <View style={{flexDirection:'row', alignItems:'center', marginHorizontal:8}}>
                <Image source={{uri: item.Photo}} style={{height:30, width:30, borderRadius:50}} />
                <Text style={{flex:1, color:inviteAuthor, fontSize:15, marginLeft:10, marginRight:5}} selectable>{ item.Name }</Text>
                <Text style={{color:inviteDate, fontSize:11, marginLeft:'auto'}} selectable>{ item.timeStamp.toDateString() }</Text>
              </View>

              <View style={{flexDirection:'row', marginTop:5, padding:10, backgroundColor:inviteAuthBar, justifyContent:'flex-end', alignItems:'center'}}>
                <Pressable
                  onPress={() => joinResponse(item.ID, item.title, item.body, item.authorID, selector)}
                  style={({ pressed }) => [
                    {opacity: pressed ? 0.5: 1}, styles.join
                  ]}
                >
                  <View style={{flexDirection:'row', alignItems:'center',}}>
                    <Text style={{color:"white", fontSize: 16,}}>Join</Text>
                  </View>
                </Pressable>
                <Pressable
                  onPress={() => deleteResponse(item.ID, selector)}
                  style={({ pressed }) => [
                    {opacity: pressed ? 0.5: 1}, styles.delete
                  ]}
                >
                  <View style={{flexDirection:'row', alignItems:'center',}}>
                    <Text style={{color:"white", fontSize: 16,}}>Delete</Text>
                  </View>
                </Pressable>
              </View>
            </View>
          )} />
        )}
      </View>
    </View>
  )
 }

 const joinResponse = useCallback(_.debounce((id, title, body, authorID, selectorValue) => {
  if(selectorValue=='friends'){
    joinFriendConversation(id, title, body, authorID);
  }
  else {
    joinOtherConversation(id, title, body, authorID);
  }
 }, 2000, {'leading':true, 'trailing':false}), [])

 const deleteResponse = (id, selectorValue) => {
  if(selectorValue=='friends'){
    AlertDeleteFriend(id);
  }
  else {
    AlertDeleteOther(id);
  }
 }

 return (
   <SafeAreaView style={{flex: 1, backgroundColor:'#613a5f'}}> 
    <View style={{flex:1, backgroundColor: backgroundColor}} >
     
     <View style={styles.homeHeader}>
       <Text style={{fontSize:19, color:'white', fontFamily:'Solway-Regular', marginLeft:10}}>Invites</Text>
     </View>

      
      {/* Page Contents */}
      {listIndicator? ( <ActivityIndicator size={80} color='#613a5f' animating={listIndicator} style={{flex:1}} /> ) : (
        <View style={{flex:1, padding:10, paddingBottom:20}}>
        
        {/* selectors */}
        <View style={{flexDirection:'row', alignItems:'center', marginBottom:20, justifyContent:'space-between', paddingTop:10}}>
          <View style={{flex:1, alignItems:'flex-end', paddingTop:12, paddingRight:3, marginRight:3}}>
            <Pressable
              onPress={selectFriends}
              style={({ pressed }) => [
                {opacity: pressed ? 0.5: 1}, styles.friendsOp, {backgroundColor: (selector=='friends')? selectorColor : 'grey'}
              ]}
            >
              <View style={{flexDirection:'row', alignItems:'center',}}>
                <Text style={{color:"white", fontSize: 16,}}>From Friends</Text>
              </View>
            </Pressable>
            { (FriendsInvitesNum > 0) && <Text style={styles.badge}>{ FriendsInvitesNum }</Text> }
          </View>

          <View style={{flex:1, alignItems:'flex-end', paddingTop:12, paddingRight:3}}>
            <Pressable
              onPress={selectOthers}
              style={({ pressed }) => [
                {opacity: pressed ? 0.5: 1}, styles.friendsOp, {backgroundColor: (selector=='others')? selectorColor : 'grey'}
              ]}
            >
              <View style={{flexDirection:'row', alignItems:'center',}}>
                <Text style={{color:"white", fontSize: 16,}}>From Others</Text>
              </View>
            </Pressable>
            { (OthersInvitesNum > 0) && <Text style={styles.badge}>{ OthersInvitesNum }</Text> }
          </View>
        </View>
        
        {/* Lists */}

        {(selector=='friends') && renderList(FriendsInvites, title, FriendsInvitesNum)}

        {(selector=='others') && renderList(OthersInvites, title, OthersInvitesNum)} 

      </View>
      )}

      <BannerAd unitId={AdID} size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{requestNonPersonalizedAdsOnly:true}} 
      />
    </View>
   </SafeAreaView>
 )
}

const styles = StyleSheet.create({
 homeHeader: {
   flexDirection: 'row', 
   alignItems:'center',
   backgroundColor: '#613a5f',
   padding: 5,
   elevation:15
 },
 join: {
   padding: 4,
   backgroundColor: '#1da877',
   alignItems: 'center',
   borderRadius:20,
   elevation:3,
   marginLeft:100,
   marginRight:10,
   flex:1
 },
 delete: {
   backgroundColor: '#ad103c',
   padding: 4,
   alignItems: 'center',
   borderRadius:20,
   elevation:3,
   flex:1
 },
 friendsOp: {
   padding: 8,
   backgroundColor: 'grey',
   alignItems: 'center',
   borderRadius:13,
   alignSelf:'stretch'
 },
 item: {
   flex:1, 
   marginBottom:15,
   backgroundColor:'#8d8299',
   elevation:5,
   borderColor:'#613a5f',
   borderWidth:2
 },
 badge:{
   backgroundColor:'#f55fd2', 
   position:'absolute',
   paddingVertical: 2,
   paddingHorizontal: 5,
   borderRadius:8,
   overflow:'hidden'
 },
 newMid: {
  alignItems: 'center',
  borderWidth: 1,
  borderColor: '#f2f2f2',
  padding: 10,
  paddingVertical:30,
  borderRadius: 10,
  borderStyle: 'dashed',
  alignSelf:'center',
  marginTop:100,
  opacity:0.5
},
})