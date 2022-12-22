import { StyleSheet, Text, View, Image} from 'react-native'
import React, { useEffect, useRef, useState } from 'react';
import { MaterialIcons } from '@expo/vector-icons';

export default function RenderComment(props) {

  return (
    <View style={{flexDirection:'row', alignItems:'center', flex:1}}>
      <View style={styles.commentView} >
        <Text style={styles.theComment} selectable>{props.comment.comment}</Text>
        
        <View style={styles.commentDetails}>
          <Text style={styles.author} selectable numberOfLines={1}>{ props.comment.Name }</Text>
          <Text style={styles.commentDate}>{props.comment.timeStamp.toDate().toDateString()}  -  {props.comment.timeStamp.toDate().getHours().toString()}:{props.comment.timeStamp.toDate().getMinutes().toString()}</Text>
        </View>
      </View>

      <Image source={{uri: props.comment.uri}} style={{width:35, height:35, borderRadius:60, marginLeft:3, borderColor:'#613a5f', borderWidth:1, position:'absolute'}} />
      
      <View style={styles.delete} >
        <MaterialIcons name='delete' color='grey' size={25} onPress={() => props.alert(props.comment.id)}/>
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
    flex: 3,
    padding: 5,
    paddingRight:8,
    paddingLeft:25,
    marginRight: 50,
    marginLeft: 18,
    borderRadius: 17,
    alignItems: 'flex-start'
  },
  // commentViewInner: {
  //   marginLeft: 15
  // },
  delete: {
    opacity: 0.5,
    marginLeft: 'auto',
  },
  theComment: {
    fontSize: 15,
    fontFamily: 'Poppins-Light'
  },
  commentDetails: {
    marginTop: 5,
    alignItems: 'flex-start'
  },
  author: {
    color: '#3380a3',
    fontSize: 12,
  },
  commentDate: {
    color: 'grey',
    fontSize: 12,
  },
})