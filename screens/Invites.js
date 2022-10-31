import { StyleSheet, Text, View, Image, ScrollView, TouchableOpacity, Modal, TextInput,
  Pressable, TouchableWithoutFeedback, ToastAndroid, Keyboard, FlatList, Alert } from 'react-native';
import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { getFirestore, addDoc, collection, serverTimestamp, onSnapshot, query, orderBy, doc, 
 deleteDoc, Timestamp, setDoc, getDocs, where, getDoc, updateDoc } from 'firebase/firestore'
import { getAuth } from 'firebase/auth';
import avatar from '../assets/Imgs/avatar.png';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Menu, MenuOptions, MenuOption, MenuTrigger, } from 'react-native-popup-menu';

export default function Friends({ navigation }) {

 const db = getFirestore();
 const storage = getStorage();
 const user = getAuth().currentUser;
 const defaultImg = Image.resolveAssetSource(avatar).uri;

 const [FriendsInvites, setFriendsInvites] = useState(null);
 const [FriendsInvitesNum, setFriendsInvitesNum] = useState(0);
 const [OthersInvites, setOthersInvites] = useState(null);
 const [OthersInvitesNum, setOthersInvitesNum] = useState(0);
 const [Data, setData] = useState(null);
 const [selector, setSelector] = useState('');
 const [title, setTitle] = useState('');
 const [num, setNum] = useState(0);

 useEffect(() => {

   // Friends Invites
   const colRef3 = collection(db, 'Users', user.uid, 'Friends Invites');
   const q3 = query(colRef3, orderBy('timeStamp'));
   onSnapshot(q3, async snapShot => {
     let result = [];
     let num = 0;

     for (const dok of snapShot.docs) {
      const empty = dok.data().timeStamp === null ? Timestamp.now() : dok.data().timeStamp;
      var user = null;
      try{
        user = await getDoc(doc(db, 'Users', dok.data().authorID));
      }
      catch(err){
        console.log(err);
      }
      
      console.log(empty);
      result.push({...dok.data(), ID: dok.id, timeStamp: empty.toDate(), Name: user.data().Name, Photo: user.data().Photo});
      num++;
     }
     console.log(result);
     setSelector('friends');
     setFriendsInvites(result);
     setFriendsInvitesNum(num);
     setTitle('Invites - ')
     setData(result);
   })

   // Others Invites
   const colRef2 = collection(db, 'Users', user.uid, 'Others Invites');
   const q2 = query(colRef2, orderBy('dateCreated'));
   onSnapshot(q2, async snapShot => {
     let result = [];
     let num = 0;

     for (const dok of snapShot.docs) {
       const empty = dok.data().timeStamp === null ? Timestamp.now() : dok.data().timeStamp;
       const user = await getDoc(doc(db, 'Users', dok.data().authorID));

       result.push({...dok.data(), ID: dok.id,  timeStamp: empty.toDate(), name: user.data().Name, uri: user.data().Photo});
       num++;
     }

     setOthersInvites(result);
     setOthersInvitesNum(num);
   })
 }, [])


 useEffect(() => {
   setNum(FriendsInvitesNum)
 }, [FriendsInvitesNum])


 const approveRequest = (id) => {
   getDoc(doc(db, 'Users', id))
     .then(res => {
       deleteDoc(doc(db, 'Users', id, 'Sent Requests', user.uid))

       deleteDoc(doc(db, 'Users', user.uid, 'Received Requests', id))

       setDoc(doc(db, 'Users', user.uid, 'Friends', id), {
         Name: res.data().firstName + ' ' + res.data().lasttName,
         ID: res.data().ID,
         Email: res.data().email,
         Photo: res.data().photoURL,
         since: serverTimestamp()
       });

       setDoc(doc(db, 'Users', id, 'Friends', user.uid), {
         Name: user.displayName,
         ID: user.uid,
         Email: user.email,
         Photo: user.photoURL,
         since: serverTimestamp()
       });
     })
     .catch(err => {
       console.log(err);
     })

   setModalVisible(false);
   ToastAndroid.show('Added Sucessfully', ToastAndroid.SHORT);
 }

 const removeFriend = (id) => {
   console.log(id);

   deleteDoc(doc(db, 'Users', id, 'Friends', user.uid));

   deleteDoc(doc(db, 'Users', user.uid, 'Friends', id));
 }

 const selectFriends = () => {
  setData(FriendsInvites); 
  setSelector('friends'); 
  setTitle('Invites - '); 
  setNum(FriendsInvitesNum)
 }

 const selectOthers = () => {
  setData(OthersInvites); 
  setSelector('others'); 
  setTitle('Invites - '); 
  setNum(OthersInvitesNum)
 }


 const showAlert = (id, person) => {
   console.log(id);
   const ID = id;
   Alert.alert(
     'Remove Friend?',
     'Are you sure you want to remove ' + person + ' from your friends list?',
     [
       {
         text: 'Cancel',
         style: 'cancel'
       },
       {
         text: "confirm",
         onPress: () => removeFriend(ID)
       }
     ],
     {
       cancelable: true
     }
   )
 }

 const joinFriendConversation = (id, title, body, authorID) => {
  setDoc(doc(db, 'Conversations', id, 'Participants', user.uid), {
    Name: user.displayName,
    ID: user.uid,
    removed: false,
  });

  deleteDoc(doc(db, 'Users', user.uid, 'Friends Invites', id));

  setDoc(doc(db, 'Users', user.uid, 'My Conversations', id), {
    authorID: authorID,
    title: title,
    body: body,
    dateCreated: serverTimestamp()
  });

  ToastAndroid.show('Joined Conversation', ToastAndroid.SHORT);

  navigation.navigate('Details', { id });
 }

 const deleteFriendInvite = (id) => {
  deleteDoc(doc(db, 'Users', user.uid, 'Friends Invites', id));
 }


 const joinOtherConversation = (id) => {
  setDoc(doc(db, 'Conversations', id, 'Participants', user.uid), {
    Name: user.displayName,
    ID: user.uid,
    removed: false,
  });

  deleteDoc(doc(db, 'Users', user.uid, 'Others Invites', id));

  setDoc(doc(db, 'Users', user.uid, 'My Conversations', id), {
    dateCreated: serverTimestamp()
  });

  ToastAndroid.show('Joined Conversation', ToastAndroid.SHORT);

  navigation.navigate('Details', { id });
 }

 const deleteOtherInvite = (id) => {
  deleteDoc(doc(db, 'Users', user.uid, 'Others Invites', id));
 }

 const renderList = (data, listTitle, listNum) => {
  return(
    <View style={{flex:1, marginBottom:20}}>
      <View style={{flexDirection: 'row', backgroundColor:'#745f8a', alignItems:'center', paddingLeft:8}}>
        <Text style={{color:"white", fontSize:25}}>{ listTitle }</Text>
        <Text style={{color:'white', fontSize:25, marginLeft:5}}>{ listNum }</Text>
      </View>

      <View style={{flex:1, marginTop:5, padding:4}}>
        <FlatList data={data} renderItem={({ item }) => (
          <View style={styles.item}>

            <View style={{margin:15}}>
              <Text style={{color:'white', fontSize:20, padding:5, backgroundColor:'#613a5f'}}>{ item.title }</Text>
            </View>

            <View style={{flexDirection:'row', alignItems:'center', marginHorizontal:8}}>
              <Image source={{uri: item.Photo}} style={{height:30, width:30, borderRadius:50}} />
              <Text style={{color:'white', fontSize:15, marginLeft:10}}>{ item.Name }</Text>
              <Text style={{color:'white', fontSize:11, marginLeft:'auto'}}>{ item.timeStamp.toDateString() }</Text>
            </View>

            <View style={{flexDirection:'row', marginTop:5, padding:10, backgroundColor:'#613a5f', justifyContent:'flex-end', alignItems:'center'}}>
              <Pressable
                onPress={() => joinResponse(item.ID, item.title, item.body, item.authorID)}
                style={({ pressed }) => [
                  {opacity: pressed ? 0.5: 1}, styles.join
                ]}
              >
                <View style={{flexDirection:'row', alignItems:'center',}}>
                  <Text style={{color:"white", fontSize: 16,}}>Join</Text>
                </View>
              </Pressable>
              <Pressable
                onPress={() => deleteResponse(item.ID)}
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
      </View>
    </View>
  )
 }

 const joinResponse = (id, title, body, authorID) => {
  if(selector=='friends'){
    joinFriendConversation(id, title, body, authorID);
  }
  else {
    joinOtherConversation(id);
  }
 }

 const deleteResponse = (id) => {
  if(selector=='friends'){
    deleteFriendInvite(id);
  }
  else {
    deleteOtherInvite(id);
  }
 }

 return (
   <SafeAreaView style={{flex: 1, backgroundColor:'#806b96'}}>
     <View style={styles.homeHeader}>
       <Text style={{fontSize:19, color:'white'}}>Invites</Text>
     </View>

     
     {/* Page Contents */}

     <View style={{flex:1, padding:10, paddingBottom:20}}>

       {/* selectors */}

       <View style={{flexDirection:'row', alignItems:'center', marginBottom:20, marginHorizontal:20, justifyContent:'space-around',paddingTop:10}}>
          <View style={{alignItems:'flex-end', paddingTop:12, paddingRight:3}}>
           <Pressable
             onPress={selectFriends}
             style={({ pressed }) => [
               {opacity: pressed ? 0.5: 1}, styles.friendsOp, {backgroundColor: (selector=='friends')? '#1f1f1f': 'grey'}
             ]}
           >
             <View style={{flexDirection:'row', alignItems:'center',}}>
               <Text style={{color:"white", fontSize: 16,}}>Friends Invites</Text>
             </View>
           </Pressable>
           { (FriendsInvitesNum > 0) && <Text style={styles.badge}>{ FriendsInvitesNum }</Text> }
          </View>

         <View style={{alignItems:'flex-end', paddingTop:12, paddingRight:3}}>
           <Pressable
             onPress={selectOthers}
             style={({ pressed }) => [
               {opacity: pressed ? 0.5: 1}, styles.friendsOp, {backgroundColor: (selector=='others')? '#1f1f1f': 'grey'}
             ]}
           >
             <View style={{flexDirection:'row', alignItems:'center',}}>
               <Text style={{color:"white", fontSize: 16,}}>Others Invites</Text>
             </View>
           </Pressable>
           { (OthersInvitesNum > 0) && <Text style={styles.badge}>{ OthersInvitesNum }</Text> }
         </View>
       </View>
       
       {/* Lists */}

       {(selector=='friends') && renderList(FriendsInvites, 'Invites - ', FriendsInvitesNum)}

       {(selector=='others') && renderList(OthersInvites, 'Invites - ', OthersInvitesNum)}
       
     </View>
   </SafeAreaView>
 )
}

const styles = StyleSheet.create({
 homeHeader: {
   flexDirection: 'row', 
   alignItems:'center',
   backgroundColor: '#613a5f',
   padding: 15,
   elevation:15
 },
 join: {
   padding: 4,
   backgroundColor: 'green',
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
   borderRadius:20,
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
   borderRadius:100
 }
})