import { StyleSheet, Text, View, TouchableOpacity, FlatList, RefreshControl } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import FriendRow from './FriendRow';

// REFACTOR NOTE: this was the `renderList(data, listTitle, listNum)` function in screens/Friends.js,
// called three times from the render. It is a component now; row actions are passed through
// to FriendRow instead of being closed over.
export default function FriendList({ data, listTitle, listNum, selector, refreshing, onRefresh, onAddFriend, ...rowActions }) {
  const { titleBackground, titleColor, iconActiveColor, topButtonsColors } = useSelector(state => state.theme);

  return (
    <View style={{flex:1, marginBottom:20}}>
      <View style={{flexDirection: 'row', backgroundColor:titleBackground, alignItems:'center', paddingLeft:8}}>
        <Text style={{color:titleColor, fontSize:19, fontFamily:'Solway-Regular'}}>{ listTitle }</Text>
        <Text style={{color:iconActiveColor, fontSize:19, marginLeft:5}}>{ listNum }</Text>
      </View>

      <View style={{flex:1, marginTop:5, padding:4}}>
        {(data.length == 0 && selector=='friends')? (
          <TouchableOpacity onPress={onAddFriend} style={[styles.newMid, {borderColor:topButtonsColors}]}>
            <Text style={{color:topButtonsColors, fontSize:20, fontFamily:'Solway-Regular', opacity:0.5}}>
              You can add friends using thier ID
            </Text>
            <MaterialIcons name='person-add' size={80} color={topButtonsColors} style={{opacity:0.5, marginBottom:10}}/>
            <Text style={{color:topButtonsColors, fontSize:18, fontFamily:'Solway-Regular', opacity:0.5}}>
              Click to add your first friend
            </Text>
          </TouchableOpacity>
        ) : (
          <FlatList data={data} removeClippedSubviews={false} refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#613a5f']} />
          } renderItem={({ item }) => (
            <FriendRow item={item} selector={selector} {...rowActions} />
          )} />
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
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
});
