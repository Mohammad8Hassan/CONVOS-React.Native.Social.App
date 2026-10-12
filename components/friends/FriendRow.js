import { StyleSheet, Text, View, Image, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Menu, MenuOptions, MenuOption, MenuTrigger } from 'react-native-popup-menu';
import { useSelector } from 'react-redux';

// REFACTOR NOTE: this was the `renderItem` of the FlatList inside `renderList` in screens/Friends.js
// (~75 lines of JSX that closed over the screen's state). `selector` decides which actions the
// row shows: 'friends' -> menu, 'received' -> approve/ignore, 'sent' -> cancel.
export default function FriendRow({ item, selector, onCopyId, onRemove, onBlock, onApprove, onIgnore, onCancel }) {
  const friendBackground = useSelector(state => state.theme.friendBackground);

  return (
    <View style={[styles.item, {backgroundColor: (selector=='friends'? 'none': friendBackground)}]}>

      <View style={{flexDirection:'row', alignItems:'center', backgroundColor:friendBackground, padding:4, borderRadius:20}}>
        <Image source={{uri: item.Photoo}} style={{height:40, width:40, borderRadius:40,}} />
        <View style={{flex:1, marginLeft:10, marginRight:3, alignItems:'center', }}>
          <Text style={{color:'white', fontSize:18,}} selectable>{ item.Namee }</Text>
          <Text style={{color:'#d1d1d1', fontSize:13, fontStyle:'italic'}} numberOfLines={1} > {item.id} </Text>
        </View>

        {(selector == 'friends') &&
          <Pressable
            style={({ pressed }) => [
              {opacity: pressed ? 0.5: 1}, styles.menu
            ]}
          >
            <Menu>
              <MenuTrigger>
                <MaterialIcons name='more-horiz' size={20} color='white'  />
              </MenuTrigger>
              <MenuOptions>
                <MenuOption onSelect={() => onCopyId(item.ID)}>
                  <Text style={{color: "#613a5f", fontSize: 18, margin: 5}}>Copy ID</Text>
                </MenuOption>
                <MenuOption onSelect={() => onRemove(item.ID, item.Name)}>
                  <Text style={{color: "red", fontSize: 18, margin: 5}}>Remove friend</Text>
                </MenuOption>
                <MenuOption onSelect={() => onBlock(item.ID, item.Name)}>
                  <Text style={{color: "red", fontSize: 18, margin: 5}}>Block</Text>
                </MenuOption>
              </MenuOptions>
            </Menu>
          </Pressable>
        }
      </View>

      {(selector == 'received') &&
        <View style={{flexDirection:'row', marginBottom:5, marginTop:5, marginRight:5, justifyContent:'flex-end', alignItems:'center'}}>
          <Pressable
            onPress={() => onApprove(item.ID)}
            style={({ pressed }) => [
              {opacity: pressed ? 0.5: 1}, styles.approve
            ]}
          >
            <View style={{flexDirection:'row', alignItems:'center',}}>
              <Text style={{color:"white", fontSize: 16,}}>approve</Text>
            </View>
          </Pressable>

          <Pressable
            onPress={() => onIgnore(item.ID)}
            style={({ pressed }) => [
              {opacity: pressed ? 0.5: 1}, styles.delete
            ]}
          >
            <View style={{flexDirection:'row', alignItems:'center',}}>
              <Text style={{color:"white", fontSize: 16,}}>ignore</Text>
            </View>
          </Pressable>
        </View>
      }
      {(selector=='sent') &&
        <Pressable
          onPress={() => onCancel(item.ID)}
          style={({ pressed }) => [
            {opacity: pressed ? 0.5: 1}, styles.cancel
          ]}
        >
          <View style={{flexDirection:'row', alignItems:'center',}}>
            <Text style={{color:"white", fontSize: 16,}}>cancel</Text>
          </View>
        </Pressable>
      }
    </View>
  )
}

const styles = StyleSheet.create({
  item: {
    flex:1,
    marginBottom:10,
    padding: 4,
    elevation:8
  },
  menu: {
    alignItems: 'center',
    marginRight:10,
    marginLeft:'auto'
  },
  approve: {
    padding: 8,
    backgroundColor: '#1da877',
    alignItems: 'center',
    borderRadius:20,
    elevation:10,
    marginLeft:10,
    shadowOffset: {width:0, height:3},
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  delete: {
    padding: 8,
    backgroundColor: '#c7aa52',
    alignItems: 'center',
    borderRadius:20,
    elevation:10,
    marginLeft:10,
    shadowOffset: {width:0, height:3},
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  cancel: {
    padding: 8,
    backgroundColor: '#853259',
    alignItems: 'center',
    borderRadius:20,
    elevation:10,
    marginRight:5,
    marginLeft:'auto',
    marginBottom:5,
    marginTop:5,
    shadowOffset: {width:0, height:3},
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
});
