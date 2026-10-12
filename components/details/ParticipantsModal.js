import { useState } from 'react';
import { StyleSheet, Text, View, Image, FlatList, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons, Entypo } from '@expo/vector-icons';
import { Menu, MenuOptions, MenuOption, MenuTrigger, MenuProvider } from 'react-native-popup-menu';

// REFACTOR NOTE: this was the `<Modal>` block (~130 lines) at the top of the render in screens/Details.js,
// together with the `showPassword` state (only this modal used it) and the styles only it used.
// `convAuthorId` is the uid of the conversation author: they see "remove" on other participants.
export default function ParticipantsModal({
  visible, onClose, post, num, user, photoUrl, data, extraData, convAuthorId,
  onRemoveUser, onCopyUserId, onCopyMyId,
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <Modal visible={visible} animationType='slide' onRequestClose={onClose}>
      <MenuProvider skipInstanceCheck style={{flex:1}}>
        <SafeAreaView style={{flex:1, backgroundColor:'#613a5f'}}>
          <View style={{flex:1, backgroundColor:'#806b96'}} >
          <View style={styles.homeHeader}>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                {opacity: pressed ? 0.5: 1},
              ]}
              >
              <Ionicons name='chevron-back-circle' size={27} color="white" />
            </Pressable>
            <Text style={{flex:1, fontSize:19, color:'white', fontFamily:'Solway-Regular', marginLeft:10}}>Participants  { num }</Text>
          </View>

          {/* me */}
          <View style={styles.itemUser}>
            <View style={{flexDirection:'row', alignItems:'center', backgroundColor:'#8d8299', padding:4, borderRadius:20,}}>
              <Image source={{uri: photoUrl}} style={{height:40, width:40, borderRadius:50, borderColor:'#4ebbed'}} />

              <View style={{marginLeft:10, flex:1,}}>
                <Text style={{ fontSize:18,  color:'white'}}>{ user.displayName }
                  <Text style={{fontSize:15, color:'white', fontStyle:'italic',}}>  (you)</Text>
                </Text>

                <Text style={{fontSize:13, color:'white', opacity:0.6, fontStyle:'italic'}}>{ user.uid }</Text>
              </View>

              <Menu style={styles.menu}>
                <MenuTrigger>
                  <MaterialIcons name='more-horiz' size={20} color='white' style={{padding:8}} />
                </MenuTrigger>
                <MenuOptions>
                  <MenuOption onSelect={onCopyMyId}>
                    <Text style={{fontSize: 18, margin: 5}}>copy ID</Text>
                  </MenuOption>
                </MenuOptions>
              </Menu>
            </View>
          </View>

          {/* others */}
          <View style={{flex:1, marginTop:5, padding:4}}>
            <FlatList data={data} extraData={extraData} renderItem={({ item }) => (
              <View style={styles.item}>

                <View style={{flexDirection:'row', alignItems:'center', backgroundColor:'#8d8299', padding:4, borderRadius:20, opacity: (item.removed == true)? 0.5 : 1}}>
                  <Image source={{uri: item.photo}} style={{height:40, width:40, borderRadius:50, borderColor:'#4ebbed'}} />

                  <View style={{alignItems:'center', flex:1, marginHorizontal:8}}>
                    <Text style={{fontSize:18, color:'white'}}>{ item.name }
                      {item.id == convAuthorId && (
                        <Text style={{fontSize:16, color:'#613a5f', fontStyle:'italic'}}>  (Author)</Text>
                      )}
                    </Text>

                    <Text style={{fontSize:13, color:'white', opacity:0.6, fontStyle:'italic'}}>{ item.id }</Text>
                  </View>

                  {(item.removed == false) &&
                    <Menu style={styles.menu}>
                      <MenuTrigger>
                        <MaterialIcons name='more-horiz' size={20} color='white' style={{padding:8}}  />
                      </MenuTrigger>
                      <MenuOptions>
                        {user.uid == convAuthorId ? (
                          <MenuOption onSelect={() => onRemoveUser(item.id, item.name)}>
                            <Text style={{color: "#b00535", fontSize: 18, margin: 5}}>remove</Text>
                          </MenuOption>
                        ) : null}

                        <MenuOption onSelect={() => onCopyUserId(item.id)}>
                          <Text style={{fontSize: 18, margin: 5}}>copy ID</Text>
                        </MenuOption>
                      </MenuOptions>
                    </Menu>
                  }
                </View>

              </View>
            )} />
          </View>

          {/* password (only for password protected conversations) */}
          {post.hasPassword ? (
            <View style={{backgroundColor:'#8c7699', elevation:15, marginBottom:20, paddingVertical:8, marginTop:15, shadowOffset: {width:0, height:5}, shadowOpacity: 0.3, shadowRadius: 3,}}>
              <View>
                <Text style={{fontFamily:'Solway-Regular', color:"white", fontSize: 20, marginLeft: 10, marginBottom:10}}>Password</Text>
              </View>

              <View style={styles.header}>
                <Text style={{fontFamily:'Solway-Regular', color:"white", fontSize: 20, marginLeft: 10, marginRight:20}}>
                  { showPassword ? post.password : '•'.repeat(post.password.length) }
                </Text>
                <Pressable
                  onPress={() => setShowPassword(!showPassword)}
                  style={({ pressed }) => [
                    {opacity: pressed ? 0.5: 1}
                  ]}
                >
                  <Entypo name={showPassword ? 'eye-with-line' : 'eye'} size={30} color={'#613a5f'} />
                </Pressable>
              </View>
            </View>
          ) : null}

          </View>
        </SafeAreaView>
      </MenuProvider>
    </Modal>
  )
}

const styles = StyleSheet.create({
  homeHeader: {
    flexDirection: 'row',
    justifyContent:'space-between',
    alignItems:'center',
    backgroundColor: '#613a5f',
    padding: 10,
    elevation: 15
  },
  item: {
    flex:1,
    marginBottom:10,
    padding: 4,
    backgroundColor:'#8d8299',
    marginHorizontal:3
  },
  itemUser: {
    marginTop: 5,
    marginBottom:10,
    padding: 4,
    backgroundColor:'#8d8299',
  },
  menu: {
    alignItems: 'center',
    marginRight:10,
    marginLeft:'auto'
  },
  header: {
    flexDirection: 'row',
    marginHorizontal: 15,
    alignItems: 'center'
  },
});
