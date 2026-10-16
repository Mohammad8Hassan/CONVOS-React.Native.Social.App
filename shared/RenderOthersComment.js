import { StyleSheet, Text, View, Image, Linking} from 'react-native'
import React from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import Hyperlink from 'react-native-hyperlink';
import { formatCommentTime } from './formatTime';

// REFACTOR NOTE: the delete icon called an undefined `showAlert(...)` (ReferenceError on tap). It now calls
// the `alert` callback the parent passes in, like RenderComment does. (It only shows for your own comments,
// which Details renders with RenderComment, so this icon is effectively never visible.)
// Other people's messages: bubble on the left, round avatar on the right.
export default function RenderOthersComment(props) {
  return (
    <View style={[styles.row, {opacity: (props.comment.removed == true)? 0.5 : 1}]}>
      <View style={styles.delete}>
        {(props.userID == props.comment.authorID) && <MaterialIcons name='delete-outline' color='#9a8fa3' size={22} onPress={() => props.alert(props.comment.id)}/>}
      </View>

      <View style={styles.bubble}>
        <Hyperlink onPress={link => Linking.openURL(link)} linkStyle={{color:'#2a6f94', textDecorationLine:'underline'}}>
          <Text style={styles.theComment} selectable>{props.comment.comment}</Text>
        </Hyperlink>

        <View style={styles.meta}>
          <Text style={styles.author} selectable>{ props.comment.Name }</Text>
          <Text style={styles.commentDate}>{formatCommentTime(props.comment.timeStamp.toDate())}</Text>
        </View>
      </View>

      <Image source={{uri: props.comment.uri}} style={styles.avatar} />
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
    marginLeft: 6,
  },
  bubble: {
    backgroundColor: '#dcedf7',
    maxWidth: '76%',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 18,
    borderBottomRightRadius: 4,
    alignItems: 'flex-start',
    marginLeft: 'auto',
  },
  delete: {
    paddingRight: 6,
    paddingBottom: 6,
  },
  theComment: {
    fontSize: 15,
    lineHeight: 21,
    color: '#1f2a33',
    fontFamily: 'Poppins-Light',
  },
  meta: {
    marginTop: 4,
    alignItems: 'flex-start',
  },
  author: {
    color: '#2a6f94',
    fontSize: 11.5,
    fontWeight: '600',
  },
  commentDate: {
    color: '#7f8f99',
    fontSize: 11,
  },
})
