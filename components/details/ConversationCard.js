import { StyleSheet, Text, View, Image, ScrollView, Pressable, Platform } from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { Menu, MenuOptions, MenuOption, MenuTrigger } from 'react-native-popup-menu';

// REFACTOR NOTE: this was the "topic card" block of screens/Details.js: an expanded card (title, body,
// author, id, menu) or a collapsed one (one line of the body + id + menu), plus the caret button.
// The two menus are the same thing now. Differences from the old code:
//  - collapsed menu: "View Participants" and "Delete Post" called `showAlert(item.id)` where `item`
//    didn't exist (ReferenceError when tapped). They now open the participants / delete the conversation,
//    exactly like the expanded menu.
//  - the caret icon name is derived from `expanded` (it was a separate state kept in sync by an effect).
export default function ConversationCard({
  post, id, user, convAuthor, expanded, onToggleExpanded, onBack, onCopyId, onShowQr, onViewInfo, onDelete, muted, onToggleMute,
}) {
  const isAuthor = post.authorID == user.uid;

  const menu = (collapsed) => (
    <Menu style={styles.more}>
      <MenuTrigger style={collapsed ? {backgroundColor: '#d4c86e', alignItems:'center', borderRadius:20} : undefined}>
        {collapsed ? (
          <MaterialIcons name='more-horiz' size={22} color='#806b96' />
        ) : (
          <View style={{backgroundColor: '#d4c86e', alignItems:'center', borderRadius:20}}>
            <MaterialIcons name='more-horiz' size={22} color='#806b96' />
          </View>
        )}
      </MenuTrigger>
      <MenuOptions>
        <MenuOption onSelect={onViewInfo}>
          <Text style={{color: "#613a5f", fontSize: 18, margin: 5}}>{collapsed ? 'View Participants' : 'View Info'}</Text>
        </MenuOption>
        <MenuOption onSelect={onToggleMute}>
          <Text style={{color: "#613a5f", fontSize: 18, margin: 5}}>{muted ? 'Unmute notifications' : 'Mute notifications'}</Text>
        </MenuOption>
        { isAuthor &&
          <MenuOption onSelect={onDelete}>
            <Text style={{color: "red", fontSize: 18, margin: 5}}>{collapsed ? 'Delete Post' : 'Delete Conversation'}</Text>
          </MenuOption>
        }
      </MenuOptions>
    </Menu>
  )

  return (
    <View style={{zIndex:999}}>
      {expanded ? (
        <View style={styles.card}>
          <View style={styles.cardContent}>
            <View style={{flexDirection:'row'}}>
              <Pressable
                onPress={onBack}
                style={({ pressed }) => [
                  {opacity: pressed ? 0.5: 1}, {alignSelf:'flex-end'}
                ]}
                >
                <Ionicons name='chevron-back-circle' size={29} color="#d4c86e" />
              </Pressable>
              <Text style={{alignSelf:'center', flex:1, borderBottomColor:'#e6e6e6', borderBottomWidth:1, fontSize:Platform.OS==='android'?16:14, fontWeight:'600', marginHorizontal:8, color:'#613a5f', paddingBottom:3, marginLeft:3, marginRight:20}} selectable>{ post.title }</Text>
            </View>

            <ScrollView style={{maxHeight:200}}>
              <Text style={{fontFamily: 'Poppins-Light', marginTop:5, fontSize:Platform.OS==='android'?18:16, marginHorizontal:8}} selectable>{ post.body }</Text>
            </ScrollView>

            <View style={styles.createdView}>
              <Image source={{uri: convAuthor.uri}} style={{width:25, height:25, borderRadius:60, borderColor:'#613a5f', borderWidth:1, marginRight:5}} />
              <Text style={styles.createdAuthor} selectable>{ convAuthor.name }</Text>
              <View style={styles.createdTime}>
                <Text style={styles.createdTimeText} selectable>{post.dateCreated.toDate().toDateString()}</Text>
              </View>
            </View>
          </View>
          <View style={{flexDirection:'row', justifyContent:'flex-end', alignItems:'center', marginHorizontal:3,}}>
            <View style={{alignItems:'flex-end', flex:5, marginRight:6}}>
              <Text style={{color: 'grey', fontSize:11}} >{ id }</Text>
            </View>
            <Pressable
              onPress={onShowQr}
              style={({ pressed }) => [
                {opacity: pressed ? 0.5: 1}, styles.copyID, {marginRight: 6}
              ]}
            >
              <View style={{flexDirection:'row', alignItems:'center',}}>
                <MaterialIcons name='qr-code' size={16} color='#806b96' />
              </View>
            </Pressable>
            <Pressable
              onPress={onCopyId}
              style={({ pressed }) => [
                {opacity: pressed ? 0.5: 1}, styles.copyID
              ]}
            >
              <View style={{flexDirection:'row', alignItems:'center',}}>
                <MaterialIcons name='file-copy' size={16} color='#806b96' />
              </View>
            </Pressable>

            {menu(false)}
          </View>
        </View>
      ) : (
        <View style={styles.card}>
          <View style={{flexDirection:'row', alignItems:'center', marginBottom:10}}>
            <Pressable
              onPress={onBack}
              style={({ pressed }) => [
                {opacity: pressed ? 0.5: 1},
              ]}
              >
              <Ionicons name='chevron-back-circle' size={29} color="#d4c86e" />
            </Pressable>
            <Text style={{flex:1, fontSize:18, marginLeft:5, }} numberOfLines={1}>{ post.body }</Text>
          </View>
          <View style={{flexDirection:'row', justifyContent:'flex-end', alignItems:'center', marginHorizontal:3}}>
            <View style={{alignItems:'flex-end', flex:5, marginRight:4}}>
              <Text style={{color: 'grey'}} >{ id }</Text>
            </View>
            <Pressable
              onPress={onShowQr}
              style={({ pressed }) => [
                {opacity: pressed ? 0.5: 1}, styles.copyID, {marginRight: 6}
              ]}
            >
              <View style={{flexDirection:'row', alignItems:'center',}}>
                <MaterialIcons name='qr-code' size={16} color='#806b96' />
              </View>
            </Pressable>
            <Pressable
              onPress={onCopyId}
              style={({ pressed }) => [
                {opacity: pressed ? 0.5: 1}, styles.copyID
              ]}
            >
              <View style={{flexDirection:'row', alignItems:'center',}}>
                <MaterialIcons name='file-copy' size={16} color='#806b96' />
              </View>
            </Pressable>

            {menu(true)}
          </View>
        </View>
      )}

      <Pressable
        onPress={onToggleExpanded}
        style={({ pressed }) => [
          {opacity: pressed ? 0.5: 1}, styles.caretContainer
        ]}
      >
        <Ionicons name={expanded ? 'caret-up' : 'caret-down'} size={25} style={styles.caret} />
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  card:{
    backgroundColor:'#fff',
    elevation: 8,
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 6,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
    shadowOffset: {width:0, height:3},
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  cardContent:{
    paddingHorizontal:3,
    borderRadius:10,
  },
  createdView: {
    flexDirection: 'row',
    marginTop: 5,
    alignItems:'center',
  },
  createdAuthor: {
    flex: 5,
    fontSize: 12,
    color: '#a1a333',
  },
  createdTime: {
    flex: 2.5,
    alignItems:'flex-end',
  },
  createdTimeText: {
    fontSize: 11,
    color:'grey',
  },
  copyID: {
    padding: 3,
    backgroundColor: '#d4c86e',
    alignItems: 'center',
    borderRadius:20,
    flex: 1,
  },
  more: {
    alignItems: 'stretch',
    borderRadius:20,
    marginLeft: 7,
    flex:1.5,
  },
  caret: {
    color: '#613a5f',
    backgroundColor:'#d4c86e',
    padding: 1,
    borderRadius:10,
    position:'absolute',
    overflow:'hidden'
  },
  caretContainer: {
    marginLeft:15,
    justifyContent:'center'
  },
});
