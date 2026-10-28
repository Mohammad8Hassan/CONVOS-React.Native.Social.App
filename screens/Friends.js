import { StyleSheet, Text, View, TouchableOpacity, ToastAndroid, Alert, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { getFirestore, doc, getDoc } from 'firebase/firestore'
import { getAuth } from 'firebase/auth';
import _ from 'lodash';
import { useDispatch, useSelector } from 'react-redux';
import { setNewKey } from '../features/themeSlice';
import * as Device from 'expo-device';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { confirm } from '../shared/confirm';
import { notify } from '../shared/notify';
import { sendPush, wantsPush } from '../services/notifications';
import * as friendsService from '../services/friends';
import useFriendsData from '../hooks/useFriendsData';
import useFriendSearch from '../hooks/useFriendSearch';
import FriendsTabs from '../components/friends/FriendsTabs';
import FriendList from '../components/friends/FriendList';
import AddFriendModal from '../components/friends/AddFriendModal';

export default function Friends({ navigation, route }) {

  const AdID = (!Device.isDevice || __DEV__)? TestIds.BANNER : "ca-app-pub-4623463929646643/6113738748";

  const db = getFirestore();
  const user = getAuth().currentUser;

  const [modalVisible, setModalVisible] = useState(false);
  const [selector, setSelector] = useState('');
  const [showIndicator, setShowIndicator] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  //redux store
  const dispatch = useDispatch();
  const { backgroundColor, addButton, addButtonInside } = useSelector(state => state.theme);

  const {
    friends, friendsNum, receivedRequests, receivedRequestsNum, sentRequests, sentRequestsNum, listIndicator
  } = useFriendsData(() => setSelector(prev => prev || 'friends'));

  const search = useFriendSearch();

  const requestedSection = route.params?.section;
  useEffect(() => {
    if(!requestedSection) return;
    setSelector(requestedSection);
    navigation.setParams({ section: undefined });
  }, [requestedSection])

  // tab badge = pending received + sent requests
  useEffect(() => {
    const total = receivedRequestsNum + sentRequestsNum;
    navigation.setOptions({
      tabBarBadge: total == 0? null : total
    })
  }, [receivedRequestsNum, sentRequestsNum])

  async function sendFriendNotification(expoPushToken) {
    const message = {
      to: expoPushToken,
      sound: 'default',
      title: 'Friend Request',
      body: user.displayName + ' sent you a friend request.',
      data: { type: 'friendRequest' },
      channelId: 'Friends'
    };

    await sendPush(message);
  }

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    dispatch(setNewKey());
  }, [])

  const openModal = () => {
    setShowIndicator(false);
    setModalVisible(true);
  }

  const clickOut = () => {
    setShowIndicator(true);
    setModalVisible(false);
    search.reset();
  }

  const sendRequest = async () => {
    setShowIndicator(true);
    const searchedID = search.searchedID;

    if(await friendsService.isBlockedBy(db, searchedID, user.uid)) {
      Alert.alert(
        'error! request could not be sent!',
        '',
        [{ text: 'Dismess', style: 'cancel' }],
        { cancelable: true }
      )
      clickOut();
      return;
    }

    getDoc(doc(db, 'Users', searchedID))
      .then(res => {
        friendsService.writeFriendRequest(db, user, searchedID, res.data())
          .then(() => {
            if(res.data().ExpoPushToken !== undefined && wantsPush(res.data(), 'notifyFriends'))
              sendFriendNotification(res.data().ExpoPushToken)
          })

        setModalVisible(false);
        if(Platform.OS === 'android')
          ToastAndroid.show('Request Sent.', ToastAndroid.SHORT);
        setSelector('sent');
        clickOut();
      })
      .catch(err => {
        console.log(err);
        setShowIndicator(false);
        notify('Could not send the request. Check your connection and try again.');
      })
  }

  const debounced = (fn) => _.debounce(fn, 800, {'leading':true, 'trailing':false});

  const cancelRequest = useMemo(() => debounced((id) => {
    setShowIndicator(true);
    friendsService.cancelFriendRequest(db, user, id);
    clickOut()
  }), [])

  const ignoreRequest = useMemo(() => debounced((id) => {
    friendsService.ignoreFriendRequest(db, user, id);
  }), [])

  const approveRequest = useMemo(() => debounced(async (id) => {
    setShowIndicator(true);
    const started = await friendsService.approveFriendRequest(db, user, id);

    if(started) {
      setModalVisible(false);
      notify('Added Sucessfully');
    }
    else {
      Alert.alert(
        'Error',
        'Friend request could not be found!',
        [{ text: 'Close', style: 'cancel' }],
        { cancelable: true }
      )
    }
  }), [])

  const removeFriend = (id) => {
    friendsService.removeFriend(db, user, id);
    notify('Removed Sucessfully');
  }

  const blockFriend = (id) => {
    friendsService.blockFriend(db, user, id);
    notify('Removed Sucessfully');
    notify('User Blocked');
  }

  const blockUser = (id) => {
    setShowIndicator(true);
    friendsService.blockUser(db, user, id);
    clickOut();
    notify('User Blocked');
  }

  const unblockUser = async (id) => {
    setShowIndicator(true);
    await friendsService.unblockUser(db, user, id);
    clickOut();
    notify('User Unblocked');
  }

  const confirmRemove = (id, person) => {
    confirm('Remove Friend?', 'Are you sure you want to remove ' + person + ' from your friends list?', () => removeFriend(id))
  }

  const confirmBlock = (id, person) => {
    confirm('Block User?', 'Are you sure you want to block ' + person + "? They will be removed from your friends list and they won't be able to send you friend requests.", () => blockFriend(id))
  }

  const copyToClipboard = async (id) => {
    await Clipboard.setStringAsync(id);
    notify('ID copied');
  }

  const rowActions = {
    onCopyId: copyToClipboard, onRemove: confirmRemove, onBlock: confirmBlock,
    onApprove: approveRequest, onIgnore: ignoreRequest, onCancel: cancelRequest,
  };

  const renderList = (data, listTitle, listNum) => (
    <FriendList data={data || []} listTitle={listTitle} listNum={listNum} selector={selector}
      refreshing={refreshing} onRefresh={onRefresh} onAddFriend={openModal} {...rowActions} />
  )

  return (
    <SafeAreaView style={{flex: 1, backgroundColor:'#613a5f'}}>
      <View style={{flex:1, backgroundColor:backgroundColor}} >
      <View style={styles.homeHeader}>
        <Text style={{fontSize:19, color:'white', fontFamily:'Solway-Regular', marginLeft:10}}>Friends</Text>
      </View>

        <AddFriendModal visible={modalVisible} onClose={clickOut} search={search} showIndicator={showIndicator}
          onUnblock={unblockUser} onCancel={cancelRequest} onApprove={approveRequest}
          onSend={sendRequest} onBlock={blockUser} />

      {/* Page Contents */}

      {listIndicator? ( <ActivityIndicator size={80} color='#613a5f' animating={listIndicator} style={{flex:1}} /> ) : (
        <>
          <View style={{flex:1, paddingHorizontal:12, paddingBottom:12}}>

            <FriendsTabs selector={selector} onSelect={setSelector}
              receivedRequestsNum={receivedRequestsNum} sentRequestsNum={sentRequestsNum} />

            {/* Lists */}

            {selector == 'friends' && renderList(friends, 'Friends - ', friendsNum)}

            {selector == 'received' && renderList(receivedRequests, 'Received Friend Requests - ', receivedRequestsNum)}

            {selector == 'sent' && renderList(sentRequests, 'Sent Friend Requests - ', sentRequestsNum)}

            <View style={styles.fabWrap} pointerEvents='box-none'>
              <TouchableOpacity onPress={openModal} style={[styles.addbtn, {backgroundColor:addButton}]}>
                <MaterialIcons name='person-add' size={26} color={addButtonInside}/>
              </TouchableOpacity>
            </View>
          </View>
          <BannerAd unitId={AdID} size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
            requestOptions={{requestNonPersonalizedAdsOnly:true}}
          />
        </>
      )}
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
  addbtn: {
    backgroundColor:'white',
    width:56,
    height:56,
    borderRadius:28,
    alignItems:'center',
    justifyContent:'center',
    elevation:6
  },
  fabWrap: {
    position:'absolute',
    right:6,
    bottom:6,
  },
});
