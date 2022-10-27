import { StyleSheet, Text, View, Image} from 'react-native'
import React from 'react';
import { MaterialIcons } from '@expo/vector-icons';

export default function RenderOthersComment(props) {
  return (
    <>
      <View style={styles.delete} >
        {(props.userID == props.comment.authorID) && <MaterialIcons name='delete' color='grey' size={25} onPress={() => showAlert(props.comment.id)}/>}
      </View>
      <View style={styles.commentView} >
        <View style={styles.commentViewInner}>
          <Text style={styles.theComment} selectable>{props.comment.comment}</Text>
          <View style={styles.commentDetails}>
            <Text style={styles.author} selectable>{ props.comment.author }</Text>
            <Text style={styles.commentDate}>  •  {props.comment.timeStamp.toDate().toDateString()}</Text>
          </View>
        </View>
      </View>
      <View style={{justifyContent:'center', alignItems:'center'}}>
        <Image source={{uri: props.comment.uri}} style={{width:35, height:35, borderRadius:60, marginRight:3, borderColor:'#613a5f', borderWidth:1, position:'absolute', alignSelf:'flex-end'}} />
      </View>
    </>
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
    padding: 10,
    marginRight: 20,
    marginLeft: 50,
    borderRadius: 17,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  commentViewInner: {
    marginRight: 15
  },
  delete: {
    opacity: 0.5,
    marginRight: 'auto',
  },
  theComment: {
    fontSize: 17,
    fontFamily: 'Kanit-Light'
  },
  commentDetails: {
    flexDirection: 'row',
    marginTop: 5,
    alignItems: 'center'
  },
  author: {
    color: '#3380a3',
    fontSize: 15
  },
  commentDate: {
    color: 'grey'
  },
})