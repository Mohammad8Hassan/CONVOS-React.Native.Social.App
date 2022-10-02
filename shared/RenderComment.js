import { StyleSheet, Text, View,  } from 'react-native'
import React from 'react';
import CachableImage from './CachableImage';
import { MaterialIcons } from '@expo/vector-icons';

export default function RenderComment(props) {
  return (
    <View style={styles.listItem} key={props.comment.id}>

      <View style={styles.commentView} >
        <View style={styles.commentViewInner}>
          <Text style={styles.theComment} selectable>{props.comment.comment}</Text>
          <View style={styles.commentDetails}>
            <Text style={styles.author} selectable>{ props.comment.author }</Text>
            <Text style={styles.commentDate}>  •  {props.comment.timeStamp.toDate().toDateString()}</Text>
          </View>
        </View>
      </View>

      <CachableImage source={{uri: comment.uri}} cacheKey={ props.comment.authorID } 
      style={{width:35, height:35, borderRadius:60, marginLeft:3, borderColor:'#613a5f', borderWidth:1, position:'absolute'}} 
      id={props.comment.authorID} xt={ props.comment.xt }/>

      <View style={styles.delete} >
        {(props.userID == props.comment.authorID) && <MaterialIcons name='delete' color='grey' size={25} onPress={() => props.alert(props.comment.id)}/>}
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
    backgroundColor: 'pink',
    padding: 10,
    marginRight: 50,
    marginLeft: 20,
    borderRadius: 17,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // borderColor:'#745f8a',
    // borderWidth:1
  },
  commentViewInner: {
    marginLeft: 15
  },
  delete: {
    opacity: 0.5,
    marginLeft: 'auto',
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