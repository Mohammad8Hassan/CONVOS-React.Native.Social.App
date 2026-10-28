import { StyleSheet, Text, View, Image, Linking} from 'react-native'
import React from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import Hyperlink from 'react-native-hyperlink';
import { formatCommentTime } from './formatTime';

export default function RenderComment(props) {
  return (
    <View style={styles.row}>
      <Image source={{uri: props.comment.uri}} style={styles.avatar} />

      <View style={styles.bubble}>
        <Hyperlink onPress={link => Linking.openURL(link)} linkStyle={{color:'#7a3f8f', textDecorationLine:'underline'}}>
          <Text style={styles.theComment} selectable>{props.comment.comment}</Text>
        </Hyperlink>

        <View style={styles.meta}>
          <Text style={styles.author} selectable numberOfLines={1}>{ props.comment.Name }</Text>
          <Text style={styles.commentDate}>{formatCommentTime(props.comment.timeStamp.toDate())}</Text>
        </View>
      </View>

      <View style={styles.delete}>
        <MaterialIcons name='delete-outline' color='#9a8fa3' size={22} onPress={() => props.alert(props.comment.id)}/>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    flex: 1,
    paddingHorizontal: 8,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderColor: 'white',
    borderWidth: 2,
    backgroundColor: '#d9cfe0',
    elevation: 3,
    marginRight: 6,
  },
  bubble: {
    backgroundColor: '#f6e4f0',
    maxWidth: '76%',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    alignItems: 'flex-start',
  },
  delete: {
    marginLeft: 'auto',
    paddingLeft: 6,
    paddingBottom: 6,
  },
  theComment: {
    fontSize: 15,
    lineHeight: 21,
    color: '#2b2230',
    fontFamily: 'Poppins-Light',
  },
  meta: {
    marginTop: 4,
    alignItems: 'flex-start',
  },
  author: {
    color: '#a0457f',
    fontSize: 11.5,
    fontWeight: '600',
  },
  commentDate: {
    color: '#8d8296',
    fontSize: 11,
  },
})
