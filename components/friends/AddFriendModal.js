import { useState } from 'react';
import { StyleSheet, Text, View, Image, ScrollView, Modal, TextInput, Pressable,
  TouchableWithoutFeedback, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import QRScannerModal from '../../shared/QRScannerModal';

// REFACTOR NOTE: this is the "add a friend by ID" modal and its `renderButton()` that used to sit
// in screens/Friends.js (~170 lines of JSX + the 12 styles only it used). The search state lives in
// hooks/useFriendSearch; the screen passes it in as `search` and passes the button actions.
// `connection` says what the searched user is to me: 'blocked' | 'friend' | 'sent' | 'received' | 'new'.

function ActionButton({ label, onPress, style, textColor = 'white' }) {
  return (
    <Pressable
      onPress={onPress}
      style={onPress ? ({ pressed }) => [{opacity: pressed ? 0.5: 1}, style] : style}
    >
      <View style={{flexDirection:'row', alignItems:'center'}}>
        <Text style={{color: textColor, fontSize: 16,}}>{label}</Text>
      </View>
    </Pressable>
  )
}

function ConnectionButtons({ connection, searchedID, showIndicator, onUnblock, onCancel, onApprove, onIgnore, onSend, onBlock }) {
  if (showIndicator) {
    return (
      <View style={styles.indicator}>
        <ActivityIndicator size={40} color='#613a5f' animating={showIndicator} />
      </View>
    )
  }

  switch (connection) {
    case 'blocked':
      return <ActionButton label='Unblock' textColor='#806b96' style={styles.btnUnblock} onPress={() => onUnblock(searchedID)} />;
    case 'friend':
      return <ActionButton label='on your friends list.' style={styles.btnGrey} />;
    case 'sent':
      return (
        <View style={{flexDirection:'row', justifyContent:'space-between'}}>
          <ActionButton label='waiting for approval..' style={styles.btnGrey} />
          <ActionButton label='cancel' style={styles.searchCancel} onPress={() => onCancel(searchedID)} />
        </View>
      )
    case 'received':
      return (
        <View style={{flexDirection:'row', flex:2, justifyContent:'space-between'}}>
          <ActionButton label='approve' style={styles.searchApprove} onPress={() => onApprove(searchedID)} />
          <ActionButton label='ignore' style={styles.searchIgnore} onPress={onIgnore} />
          <ActionButton label='Block' style={styles.btnBlock} onPress={() => onBlock(searchedID)} />
        </View>
      )
    case 'closed':
      return <ActionButton label='Block' style={styles.btnBlock} onPress={() => onBlock(searchedID)} />;
    case 'new':
      return (
        <View style={{flexDirection:'row', flex:2, justifyContent:'space-between'}}>
          <ActionButton label='Send friend request' style={styles.btn} onPress={onSend} />
          <ActionButton label='Block' style={styles.btnBlock} onPress={() => onBlock(searchedID)} />
        </View>
      )
    default:
      return null;
  }
}

export default function AddFriendModal({ visible, onClose, search, showIndicator, ...actions }) {
  const { searchedID, setSearchedID, found, caption, url, emailResult, searchIndicator } = search;
  const [scanning, setScanning] = useState(false);

  return (
    <Modal visible={visible} animationType='fade' transparent={true} onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.outerView}>
          <ScrollView contentContainerStyle={{justifyContent:'center',}}>
          <TouchableWithoutFeedback>
          <View style={styles.innerView}>
            <TextInput placeholder='User ID' value={searchedID} onChangeText={text => setSearchedID(text)} style={styles.inputP}/>

            <Pressable
              onPress={() => setScanning(true)}
              style={({ pressed }) => [{opacity: pressed ? 0.5: 1}, styles.scan]}
            >
              <MaterialIcons name='qr-code-scanner' size={20} color='#613a5f' />
              <Text style={{color:'#613a5f', fontSize:15, marginLeft:6}}>Scan QR code</Text>
            </Pressable>

            <QRScannerModal visible={scanning} onClose={() => setScanning(false)} hint="Scan your friend's ID QR code"
              onScanned={(text) => { setSearchedID(text); search.search(text); }} />

            {/* Middle View */}

            {found &&
              <View style={{margin:15, marginTop:50, marginBottom:50,}}>
                <Text style={{color:'#64deb1', fontSize:18, marginBottom:8}}>{caption}</Text>

                <View style={{flexDirection:'row', alignItems:'center', backgroundColor:'#8d8299', justifyContent:'center', paddingHorizontal:5}}>
                  {url && <Image source={{uri: url}} style={{height:50, width:50, borderRadius:50,}} />}
                  <View style={{flex:1, paddingVertical:10, alignItems:'center', marginRight:10}}>
                    <Text style={{fontSize:18, color:'white'}}>{ emailResult }</Text>
                  </View>
                </View>

                <View style={{flexDirection:'row', alignItems:'center', marginTop:10, flex:1, justifyContent:'center'}}>
                  <ConnectionButtons connection={search.connection} searchedID={searchedID}
                    showIndicator={showIndicator} onIgnore={onClose} {...actions} />
                </View>

              </View>
            }
            {searchIndicator? (
              <ActivityIndicator animating={searchIndicator} color='#d4c86e' size={40} style={{alignSelf:'center', marginTop:20}} />
            ) : (
              <Pressable
                onPress={() => search.search()}
                style={({ pressed }) => [
                  {opacity: pressed ? 0.5: 1}, styles.changeEmail
                ]}
              >
                <View style={{flexDirection:'row', alignItems:'center',}}>
                  <Text style={{color:"#806b96", fontSize: 16,}}>Search</Text>
                </View>
              </Pressable>
            )
            }
          </View>
          </TouchableWithoutFeedback>
          </ScrollView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  )
}

const shadow = {
  elevation:10,
  shadowOffset: {width:0, height:3},
  shadowOpacity: 0.3,
  shadowRadius: 5,
};

const styles = StyleSheet.create({
  outerView: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent:'center'
  },
  innerView: {
    backgroundColor: '#806b96',
    borderRadius: 24,
    alignItems:'stretch',
    flex: 1,
    justifyContent:'center',
    paddingVertical: 10,
    elevation: 15,
    opacity:1,
    margin: 20,
    marginVertical: 80
  },
  inputP:{
    backgroundColor: 'white',
    fontSize: 20,
    padding: 6,
    borderTopRightRadius: 18,
    borderBottomRightRadius: 18,
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
    elevation:8,
    marginHorizontal: 15,
    textAlign:'center',
    paddingLeft:2
  },
  changeEmail: {
    padding: 8,
    backgroundColor: '#d4c86e',
    alignItems: 'center',
    borderRadius:20,
    elevation:10,
    marginHorizontal: 15,
    marginTop: 20,
    shadowOffset: {width:0, height:3},
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  scan: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    backgroundColor: '#d4c86e',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginTop: 12,
  },
  btnUnblock: { flex:2, padding: 8, backgroundColor: '#d4c86e', alignItems: 'center', borderRadius:20, ...shadow },
  btn: { flex:2, padding: 8, backgroundColor: '#1da877', alignItems: 'center', borderRadius:20, ...shadow },
  btnGrey: { flex:2, padding: 8, backgroundColor: '#c7c7c7', alignItems: 'center', borderRadius:20, ...shadow },
  btnBlock: { flex:1, paddingVertical: 8, backgroundColor: '#e3325e', alignItems: 'center', borderRadius:20, marginLeft:10, ...shadow },
  searchIgnore: { flex:1, padding: 8, backgroundColor: '#c7aa52', alignItems: 'center', borderRadius:20, marginLeft:10, ...shadow },
  searchCancel: { flex:1, backgroundColor: '#853259', alignItems: 'center', justifyContent:'center', borderRadius:20, marginLeft:10, ...shadow },
  searchApprove: { flex:1, padding: 8, backgroundColor: '#1da877', alignItems: 'center', borderRadius:20, ...shadow },
  indicator: {
    alignItems:'center'
  },
});
