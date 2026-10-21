import { StyleSheet, Text, View, TouchableOpacity, FlatList, RefreshControl } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import FriendRow from './FriendRow';

export default function FriendList({ data, listTitle, listNum, selector, refreshing, onRefresh, onAddFriend, ...rowActions }) {
  const { titleColor, iconActiveColor, topButtonsColors } = useSelector(state => state.theme);

  return (
    <View style={{flex:1, marginBottom:20}}>
      <View style={{flexDirection: 'row', alignItems:'center', paddingLeft:6, marginBottom:8}}>
        <Text style={{color:titleColor, fontSize:15, fontWeight:'600'}}>{ listTitle.replace(/ - $/, '') }</Text>
        <Text style={{color:iconActiveColor, fontSize:15, fontWeight:'700', marginLeft:8}}>{ listNum }</Text>
      </View>

      <View style={{flex:1}}>
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
          <FlatList data={data} keyExtractor={(item) => item.id} contentContainerStyle={{paddingBottom:80}} removeClippedSubviews={false} refreshControl={
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
    marginTop:60,
    opacity:0.5
  },
});
