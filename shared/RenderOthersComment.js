import { StyleSheet, Text, View, Image, Linking} from 'react-native'
import React from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import Hyperlink from 'react-native-hyperlink';

export default function RenderOthersComment(props) {
  return (
    <View style={{flexDirection:'row', flex:1, opacity: (props.comment.removed == true)? 0.5 : 1}}>
      <View style={styles.delete} >
        {(props.userID == props.comment.authorID) && <MaterialIcons name='delete' color='grey' size={25} onPress={() => showAlert(props.comment.id)}/>}
      </View>

      <View style={styles.commentView} >
        <Hyperlink onPress={link => Linking.openURL(link)} linkStyle={{color:'#574d06', fontStyle:'italic'}}>
          <Text style={styles.theComment} selectable>{props.comment.comment}</Text>
        </Hyperlink>

        <View style={styles.commentDetails}>
          <Text style={styles.author} selectable>{ props.comment.Name }</Text>
          <Text style={styles.commentDate}>{props.comment.timeStamp.toDate().toDateString()}  -  {props.comment.timeStamp.toDate().getHours().toString()}:{props.comment.timeStamp.toDate().getMinutes().toString()}</Text>
        </View>
      </View>

      <View style={{justifyContent:'center', alignItems:'center', marginRight:3}}>
        <Image source={{uri: props.comment.uri}} style={{width:35, height:35, borderRadius:60, marginRight:3, borderColor:'#613a5f', borderWidth:1, position:'absolute', alignSelf:'flex-end'}} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  comment: {
    backgroundColor: 'white',
    color: 'black',
    padding: 7,
    paddingLeft: 15,
    flex:4,
    fontSize: 18,
    borderColor: '#613a5f',
    borderWidth: 1,
    alignSelf:'flex-end',
    borderRadius:20
  },
  listItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  commentView: {
    backgroundColor: '#c0f0ff',
    padding: 5,
    paddingLeft:8,
    paddingRight: 25,
    marginRight: 20,
    marginLeft: 50,
    borderRadius: 17,
    alignItems: 'flex-start',
  },
  // commentViewInner: {
  //   marginRight: 15
  // },
  delete: {
    opacity: 0.5,
    marginRight: 'auto',
  },
  theComment: {
    fontSize: 15,
    fontFamily: 'Poppins-Light'
  },
  commentDetails: {
    marginTop: 5,
    alignItems: 'flex-end',
    alignSelf:'flex-end'
  },
  author: {
    color: '#3380a3',
    fontSize: 12
  },
  commentDate: {
    color: 'grey',
    fontSize: 12
  },
})