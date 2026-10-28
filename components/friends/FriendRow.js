import { StyleSheet, Text, View, Image, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Menu, MenuOptions, MenuOption, MenuTrigger } from 'react-native-popup-menu';

export default function FriendRow({ item, selector, onCopyId, onRemove, onBlock, onApprove, onIgnore, onCancel }) {
  return (
    <View style={styles.item}>

      <View style={{flexDirection:'row', alignItems:'center'}}>
        <Image source={{uri: item.Photoo}} style={styles.avatar} />
        <View style={{flex:1, marginLeft:12, marginRight:3}}>
          <Text style={{color:'#2b2230', fontSize:16, fontWeight:'600'}} selectable numberOfLines={1}>{ item.Namee }</Text>
          <Text style={{color:'#8d8296', fontSize:12}} numberOfLines={1}>{item.id}</Text>
        </View>

        {(selector == 'friends') &&
          <Pressable
            style={({ pressed }) => [
              {opacity: pressed ? 0.5: 1}, styles.menu
            ]}
          >
            <Menu>
              <MenuTrigger>
                <MaterialIcons name='more-horiz' size={24} color='#7d7287' />
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
        <View style={styles.actions}>
          <Pressable
            onPress={() => onApprove(item.ID)}
            style={({ pressed }) => [
              {opacity: pressed ? 0.5: 1}, styles.approve
            ]}
          >
            <View style={{flexDirection:'row', alignItems:'center',}}>
              <Text style={{color:"white", fontSize: 14, fontWeight:'600'}}>approve</Text>
            </View>
          </Pressable>

          <Pressable
            onPress={() => onIgnore(item.ID)}
            style={({ pressed }) => [
              {opacity: pressed ? 0.5: 1}, styles.delete
            ]}
          >
            <View style={{flexDirection:'row', alignItems:'center',}}>
              <Text style={{color:"white", fontSize: 14, fontWeight:'600'}}>ignore</Text>
            </View>
          </Pressable>
        </View>
      }
      {(selector=='sent') &&
        <View style={styles.actions}><Pressable
          onPress={() => onCancel(item.ID)}
          style={({ pressed }) => [
            {opacity: pressed ? 0.5: 1}, styles.cancel
          ]}
        >
          <View style={{flexDirection:'row', alignItems:'center',}}>
            <Text style={{color:"white", fontSize: 14, fontWeight:'600'}}>cancel</Text>
          </View>
        </Pressable></View>
      }
    </View>
  )
}

const styles = StyleSheet.create({
  item: {
    marginBottom: 10,
    padding: 10,
    borderRadius: 16,
    backgroundColor: 'white',
    elevation: 3,
  },
  avatar: {
    height: 46,
    width: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    borderColor: '#613a5f',
    backgroundColor: '#d9cfe0',
  },
  menu: {
    alignItems: 'center',
    marginLeft: 'auto',
    padding: 4,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 10,
  },
  approve: {
    paddingVertical: 7,
    paddingHorizontal: 16,
    backgroundColor: '#1da877',
    alignItems: 'center',
    borderRadius: 18,
    marginLeft: 10,
  },
  delete: {
    paddingVertical: 7,
    paddingHorizontal: 16,
    backgroundColor: '#b79b45',
    alignItems: 'center',
    borderRadius: 18,
    marginLeft: 10,
  },
  cancel: {
    paddingVertical: 7,
    paddingHorizontal: 16,
    backgroundColor: '#853259',
    alignItems: 'center',
    borderRadius: 18,
  },
});
