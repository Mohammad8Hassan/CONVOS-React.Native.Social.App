import { StyleSheet, Text, View, Pressable } from 'react-native';
import { useSelector } from 'react-redux';

// REFACTOR NOTE: the three "Friends List / Received Requests / Sent Requests" buttons used to be
// three copy-pasted ~15 line blocks in the render of screens/Friends.js. Same layout, one Tab helper.
// (The old onPress also set `title` and `num` states, which nothing ever read - dropped.)
function Tab({ name, label, selector, onSelect, count, style }) {
  const selectorColor = useSelector(state => state.theme.selectorColor);
  const active = selector == name;

  return (
    <View style={[{paddingTop:12, flex: active ? 2 : 1}, style]}>
      <Pressable
        onPress={() => onSelect(name)}
        style={({ pressed }) => [
          {opacity: pressed ? 0.5: 1}, styles.friendsOp, {backgroundColor: active ? selectorColor: 'grey'}
        ]}
      >
        <View style={{flexDirection:'row', alignItems:'center',}}>
          <Text style={{color:"white", fontSize: 16,}} adjustsFontSizeToFit numberOfLines={2}>{label}</Text>
        </View>
      </Pressable>
      { (count > 0) && <Text style={styles.badge}>{ count }</Text> }
    </View>
  )
}

export default function FriendsTabs({ selector, onSelect, receivedRequestsNum, sentRequestsNum }) {
  return (
    <View style={{flexDirection:'row', alignItems:'center', marginBottom:20, justifyContent:'space-between', paddingTop:10,}}>
      <Tab name='friends' label='Friends List' selector={selector} onSelect={onSelect} style={{marginRight:10}} />
      <Tab name='received' label='Received Requests' selector={selector} onSelect={onSelect} count={receivedRequestsNum} />
      <Tab name='sent' label='Sent Requests' selector={selector} onSelect={onSelect} count={sentRequestsNum} style={{marginLeft:10}} />
    </View>
  )
}

const styles = StyleSheet.create({
  friendsOp: {
    padding: 8,
    backgroundColor: 'grey',
    alignItems: 'center',
    borderRadius:15,
  },
  badge:{
    backgroundColor:'#f55fd2',
    position:'absolute',
    paddingVertical: 2,
    paddingHorizontal: 5,
    borderRadius:8,
    elevation:20,
    overflow:'hidden',
    alignSelf:'flex-end'
  },
});
