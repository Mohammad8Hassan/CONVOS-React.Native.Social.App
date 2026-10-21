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

 const joinFromInvite = async (id, inviteCollection) => {
  try {
    await joinConversationOnServer(id);

    if(Platform.OS === 'android')
      ToastAndroid.show('Joined Conversation', ToastAndroid.SHORT);

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
  confirm('Delete Invite?', '', () => deleteFriendInvite(ID))
}

const AlertDeleteOther = (id) => {
  console.log(id);
  const ID = id;
  confirm('Delete Invite?', '', () => deleteOtherInvite(ID))
}

 const deleteFriendInvite = (id) => {
  //need confirm....
  deleteDoc(doc(db, 'Users', user.uid, 'Friends Invites', id));
 }

 const joinOtherConversation = (id) => joinFromInvite(id, 'Other Invites');

 const deleteOtherInvite = (id) => {
  deleteDoc(doc(db, 'Users', user.uid, 'Other Invites', id));
 }

 const renderList = (data, listTitle, listNum) => {
  return(
    <View style={{flex:1, marginBottom:20}}>
      <View style={{flexDirection: 'row', alignItems:'center', paddingLeft:6, marginBottom:8}}>
        <Text style={{color:titleColor, fontSize:15, fontWeight:'600'}}>{ listTitle.replace(/ - $/, '') }</Text>
        <Text style={{color:iconActiveColor, fontSize:15, fontWeight:'700', marginLeft:8}}>{ listNum }</Text>
      </View>

      <View style={{flex:1}}>
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
          <FlatList data={data} keyExtractor={(item) => item.ID || item.id} removeClippedSubviews={false} refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#613a5f']} />
          } renderItem={({ item }) => (
            <View style={styles.item}>

              <View style={[styles.band, {backgroundColor:inviteTitleBar}]}>
                <Text style={{color:'white', fontSize:18, fontWeight:'700'}} numberOfLines={2} selectable>{ item.title }</Text>
              </View>

              <View style={styles.footer}>
                <Image source={{uri: item.Photo}} style={styles.pic} />
                <Text style={{flex:1, color:'#5f5368', fontSize:12, fontWeight:'500', marginLeft:8}} numberOfLines={1} selectable>{ item.Name }</Text>
                <Text style={{color:'#8d8296', fontSize:11}} selectable>{ item.timeStamp.toDateString() }</Text>
              </View>

              <View style={styles.actions}>
                <Pressable
                  onPress={() => deleteResponse(item.ID, selector)}
                  style={({ pressed }) => [
                    {opacity: pressed ? 0.5: 1}, styles.delete
                  ]}
                >
                  <Text style={{color:"white", fontSize: 14, fontWeight:'600'}}>Delete</Text>
                </Pressable>
                <Pressable
                  onPress={() => joinResponse(item.ID, item.title, item.body, item.authorID, selector)}
                  style={({ pressed }) => [
                    {opacity: pressed ? 0.5: 1}, styles.join
                  ]}
                >
                  <Text style={{color:"white", fontSize: 14, fontWeight:'600'}}>Join</Text>
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
        <View style={{flex:1, paddingHorizontal:12, paddingBottom:12}}>
        
        {/* selectors */}
        <View style={styles.track}>
          <Pressable
            onPress={selectFriends}
            style={({ pressed }) => [
              {opacity: pressed ? 0.7: 1}, styles.friendsOp, (selector=='friends') && {backgroundColor: selectorColor}
            ]}
          >
            <Text style={styles.tabLabel}>From Friends</Text>
            { (FriendsInvitesNum > 0) && <Text style={styles.badge}>{ FriendsInvitesNum }</Text> }
          </Pressable>

          <Pressable
            onPress={selectOthers}
            style={({ pressed }) => [
              {opacity: pressed ? 0.7: 1}, styles.friendsOp, (selector=='others') && {backgroundColor: selectorColor}
            ]}
          >
            <Text style={styles.tabLabel}>From Others</Text>
            { (OthersInvitesNum > 0) && <Text style={styles.badge}>{ OthersInvitesNum }</Text> }
          </Pressable>
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
   paddingVertical: 10,
   paddingBottom: 16,
   borderBottomLeftRadius: 26,
   borderBottomRightRadius: 26,
 },
 track: {
   flexDirection: 'row',
   backgroundColor: 'rgba(48,22,47,0.28)',
   borderRadius: 24,
   padding: 4,
   marginTop: 14,
   marginBottom: 10,
 },
 friendsOp: {
   flex: 1,
   paddingVertical: 9,
   borderRadius: 20,
   alignItems: 'center',
   justifyContent: 'center',
   flexDirection: 'row',
 },
 tabLabel: {
   color: 'white',
   fontSize: 15,
   fontWeight: '600',
 },
 item: {
   marginBottom: 12,
   backgroundColor: 'white',
   borderRadius: 18,
   overflow: 'hidden',
   elevation: 5,
 },
 band: {
   paddingVertical: 10,
   paddingHorizontal: 14,
 },
 footer: {
   flexDirection: 'row',
   alignItems: 'center',
   marginTop: 10,
   marginHorizontal: 14,
 },
 pic: {
   width: 30,
   height: 30,
   borderRadius: 15,
   borderWidth: 1.5,
   borderColor: '#613a5f',
   backgroundColor: '#d9cfe0',
 },
 actions: {
   flexDirection: 'row',
   justifyContent: 'flex-end',
   alignItems: 'center',
   padding: 10,
   paddingTop: 8,
 },
 join: {
   paddingVertical: 7,
   paddingHorizontal: 22,
   backgroundColor: '#1da877',
   alignItems: 'center',
   borderRadius: 18,
   marginLeft: 10,
 },
 delete: {
   paddingVertical: 7,
   paddingHorizontal: 18,
   backgroundColor: '#ad103c',
   alignItems: 'center',
   borderRadius: 18,
 },
 badge:{
   backgroundColor:'#f55fd2',
   color: 'white',
   fontSize: 11,
   fontWeight: '700',
   marginLeft: 6,
   paddingVertical: 1,
   paddingHorizontal: 6,
   borderRadius: 9,
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