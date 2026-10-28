import { useState } from 'react';
import { StyleSheet, Text, View, Image, Modal, TextInput, Pressable, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import QRScannerModal from '../../shared/QRScannerModal';

export default function InviteModal({
  visible, onClose, friends, selected, onAddFriend, onRemove, search,
}) {
  const [selector, setSelector] = useState('friends');
  const [searchID, setSearchID] = useState('');
  const [scanning, setScanning] = useState(false);

  const selectedFriends = selected.filter(e => e.kind == 'friend');
  const selectedOthers = selected.filter(e => e.kind == 'other');

  const data = selector == 'friends' ? friends : selectedOthers;
  const num = selector == 'friends' ? selectedFriends.length : selectedOthers.length;
  const title = selector == 'friends' ? 'Invite Friends - ' : 'Invite others - ';

  const selectTab = (tab) => {
    setSelector(tab);
    if(tab == 'others') search.onClear();
  }

  return (
    <Modal visible={visible} animationType='slide' onRequestClose={onClose}>
      <SafeAreaView style={{flex:1, backgroundColor:'#613a5f'}}>
        <View style={{flex:1, backgroundColor:'#806b96'}}>
        <View style={styles.homeHeader}>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [
              {opacity: pressed ? 0.5: 1},
            ]}
            >
            <Ionicons name='chevron-back-circle' size={27} color="white" />
          </Pressable>
          <Text style={{fontSize:18, color:'white', fontFamily:'Solway-Regular', marginLeft:10}}>Invite Participants</Text>
        </View>

        {/* Selectors  */}
        <View style={{flexDirection:'row', justifyContent:'space-around', marginVertical:15, marginHorizontal:20, paddingVertical:5}}>
          <Pressable
            onPress={() => selectTab('friends')}
            style={({ pressed }) => [
              {opacity: pressed ? 0.5: 1}, styles.friendsOp, {backgroundColor: (selector=='friends')? '#3d243c': 'grey', marginRight:10}
            ]}
          >
            <View style={{flexDirection:'row', alignItems:'center',}}>
              <Text style={{color:"white", fontSize: 19,}}>Friends</Text>
            </View>
          </Pressable>
          <Pressable
            onPress={() => selectTab('others')}
            style={({ pressed }) => [
              {opacity: pressed ? 0.5: 1}, styles.friendsOp, {backgroundColor: (selector=='others')? '#3d243c': 'grey'}
            ]}
          >
            <View style={{flexDirection:'row', alignItems:'center',}}>
              <Text style={{color:"white", fontSize: 19,}}>Others</Text>
            </View>
          </Pressable>
        </View>

        {/* titles  */}
        <View style={{flexDirection:'row', justifyContent:'space-between'}}>
          <Text style={{fontFamily:'Solway-Regular', fontSize:20, color:'white', marginLeft:15, marginBottom:10}}>{ title }</Text>
          <View style={{flexDirection:'row', alignItems:'center', marginRight:15, marginBottom:10}}>
            <Text style={{fontFamily:'Solway-Regular', fontSize:20, color:'white',}}>Selected: </Text>
            <Text style={{fontFamily:'Solway-Regular', fontSize:20, color:'#f55fd2',}}>{ num }</Text>
          </View>
        </View>

        {/* search by ID (others tab) */}
        {(selector=='others') &&
          <View style={{backgroundColor:'#8c7699', elevation:15, marginHorizontal:15, padding:10, marginBottom:15, shadowOffset: {width:0, height:5}, shadowOpacity: 0.3, shadowRadius: 5,}}>
            <TextInput placeholder='User ID' value={searchID} onChangeText={text => setSearchID(text)} style={styles.inputP}/>
            <Pressable
              onPress={() => setScanning(true)}
              style={({ pressed }) => [{opacity: pressed ? 0.5: 1}, styles.scan]}
            >
              <MaterialIcons name='qr-code-scanner' size={20} color='#613a5f' />
              <Text style={{color:'#613a5f', fontSize:15, marginLeft:6}}>Scan QR code</Text>
            </Pressable>
            <QRScannerModal visible={scanning} onClose={() => setScanning(false)} hint="Scan the person's ID QR code"
              onScanned={(text) => { setSearchID(text); search.onAdd(text); }} />
            {search.status? (
              <Text style={{marginTop:8, fontSize:18, alignSelf:'center', color:'white', fontStyle:'italic'}}>
                <Text style={{fontSize:18, color:'#d4c86e', fontStyle:'normal'}}>{ search.name }</Text>
                { search.status }
              </Text>
            ) : null }

            {search.searching? (
              <ActivityIndicator size={50} color='#1da877' animating={search.searching} style={{alignSelf:'center', marginTop:10}}/>
            ) : (
              <Pressable
                onPress={() => search.onAdd(searchID)}
                style={({ pressed }) => [
                  {opacity: pressed ? 0.5: 1}, styles.addOther,
                ]}
              >
                <View style={{flexDirection:'row', alignItems:'center',}}>
                  <Text style={{color:"white", fontSize: 19,}}>Add</Text>
                </View>
              </Pressable>
            )}
          </View>
        }

        {/* list */}
        <View style={{flex:1}}>
          <FlatList data={data} extraData={selected} keyExtractor={item => item.ID} renderItem={({item}) => {
            const isSelected = selected.find(e => e.ID === item.ID);
            const isSelectedFriend = selectedFriends.find(e => e.ID === item.ID);

            return (
              <View style={[styles.item, {backgroundColor: isSelectedFriend? '#853271': '#8d8299'}]}>
                <Image source={{uri: item.photo}} style={{height:40, width:40, borderRadius:50}} />
                <Text style={{flex:1, color:'white', fontSize:18, marginLeft:10, marginRight:5}}>{ item.name }</Text>

                {isSelected ? (
                  <Pressable
                    onPress={() => onRemove(item.ID)}
                    style={({ pressed }) => [
                      {opacity: pressed ? 0.5: 1}, styles.remove
                    ]}
                  >
                    <View style={{flexDirection:'row', alignItems:'center',}}>
                      <Text style={{color:"white", fontSize: 16,}}>remove</Text>
                    </View>
                  </Pressable>
                ) : (selector=='friends') && (
                  <Pressable
                    onPress={() => onAddFriend(item.ID)}
                    style={({ pressed }) => [
                      {opacity: pressed ? 0.5: 1}, styles.add,
                    ]}
                  >
                    <View style={{flexDirection:'row', alignItems:'center',}}>
                      <Text style={{color:"white", fontSize: 16,}}>add</Text>
                    </View>
                  </Pressable>
                )}
              </View>
            )
          }} />
        </View>

        <Pressable
          onPress={onClose}
          style={({ pressed }) => [
            {opacity: pressed ? 0.5: 1}, styles.confirm,
          ]}
        >
          <View style={{flexDirection:'row', alignItems:'center',}}>
            <Text style={{color:"#574866", fontSize: 18,}}>ADD PARTICIPANTS</Text>
          </View>
        </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  scan: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    backgroundColor: '#d4c86e',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginTop: 4,
  },
  homeHeader: {
    flexDirection: 'row',
    alignItems:'center',
    backgroundColor: '#613a5f',
    padding: 10,
    elevation: 15
  },
  friendsOp: {
    padding: 8,
    backgroundColor: 'grey',
    alignItems: 'center',
    borderRadius:15,
    flex:1
  },
  addOther: {
    padding: 8,
    backgroundColor: '#1da877',
    alignItems: 'center',
    borderRadius:20,
    marginTop:10,
    marginHorizontal:100,
    elevation:10,
    shadowOffset: {width:0, height:5},
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  add: {
    backgroundColor:'#1da877',
    alignItems: 'center',
    borderRadius:20,
    paddingHorizontal: 15,
    paddingVertical:5,
    marginLeft:'auto',
    elevation:10,
    shadowOffset: {width:0, height:5},
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  remove: {
    backgroundColor:'#9e8f37',
    alignItems: 'center',
    borderRadius:20,
    paddingHorizontal: 15,
    paddingVertical:5,
    marginLeft:'auto',
    elevation:10,
    shadowOffset: {width:0, height:5},
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  item: {
    flexDirection:'row',
    alignItems:'center',
    padding:4,
    borderRadius:20,
    marginHorizontal:10,
    marginBottom:10
  },
  confirm: {
    backgroundColor:'white',
    alignItems: 'center',
    borderRadius:20,
    paddingHorizontal: 15,
    paddingVertical:10,
    elevation:10,
    marginVertical:20,
    marginHorizontal:30,
    shadowOffset: {width:0, height:5},
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  inputP:{
    backgroundColor: 'white',
    fontSize: 20,
    padding: 6,
    borderRadius:10,
    elevation:8,
    textAlign:'center',
    paddingLeft:2
  },
});
