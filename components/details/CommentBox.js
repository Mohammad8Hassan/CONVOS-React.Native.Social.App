import { useState } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

// REFACTOR NOTE: the message input, the send button and the "N new messages" bubble used to be
// inline in screens/Details.js, with the typed text (`comment`) living in the screen's state - every
// keystroke re-rendered the whole conversation screen. The text now lives here and only the finished
// message goes up through onSend(text).
export default function CommentBox({ onSend, unreadMessages, onScrollDown }) {
  const [comment, setComment] = useState('');

  const send = () => {
    if(comment.trim().length === 0) return;

    const text = comment.trim();
    setComment('');
    onSend(text);
  }

  return (
    <View style={{ flexDirection:'row',}}>
      <View style={styles.commentBox}>
        <TextInput
          style={styles.comment}
          placeholder='Message...'
          onChangeText={(value) => setComment(value)}
          value={comment}
          multiline
        />

        <View style={styles.buttonGroup}>
          <Pressable
            onPress={send}
            style={({ pressed }) => [
              {opacity: pressed ? 0.5: 1}, styles.buttonPost,
            ]}
          >
            <View style={{backgroundColor:'#613a5f', borderRadius:20, padding:6, paddingLeft:8}}>
              <MaterialIcons name='arrow-forward-ios' size={25} color='white' />
            </View>
          </Pressable>
        </View>
      </View>
      {unreadMessages == 0? null : (
        <Pressable
          onPress={onScrollDown}
          pressRetentionOffset={{bottom: 30, left: 60, right: 20, top: 20}}
          style={({ pressed }) => [
            {opacity: pressed ? 0.5: 1, alignItems:'flex-end', justifyContent:'flex-start'}
          ]}
        >
          <View style={{elevation:10, position:'absolute', flexDirection:'row', backgroundColor:'#e374b5', padding:7, alignItems:'center', justifyContent:'center', borderRadius:25}}>
            <MaterialIcons name='keyboard-arrow-down' size={25} color='white' />
            <Text style={{color:'white', fontSize:17}}> {unreadMessages} </Text>
          </View>
        </Pressable>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  commentBox: {
    marginTop:10,
    backgroundColor: '#613a5f',
    paddingVertical:3,
    flexDirection:'row',
    flex:1
  },
  comment: {
    backgroundColor: 'white',
    color: 'black',
    padding: 5,
    paddingLeft: 15,
    flex:2,
    fontSize: 18,
    borderColor: '#613a5f',
    borderWidth: 1,
    alignSelf:'flex-end',
    borderRadius:20,
    marginLeft:5
  },
  buttonGroup: {
    flexDirection: 'row',
    flex:1
  },
  buttonPost: {
    flex:0.5,
    justifyContent:'center',
    alignItems:'center',
  },
});
