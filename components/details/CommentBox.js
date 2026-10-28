import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable, Keyboard } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

export default function CommentBox({ onSend, unreadMessages, onScrollDown }) {
  const [comment, setComment] = useState('');
  const canSend = comment.trim().length > 0;

  const insets = useSafeAreaInsets();
  const [keyboardUp, setKeyboardUp] = useState(false);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardUp(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardUp(false));
    return () => { show.remove(); hide.remove(); };
  }, [])

  const send = () => {
    if(!canSend) return;

    const text = comment.trim();
    setComment('');
    onSend(text);
  }

  return (
    <View style={{ flexDirection:'row',}}>
      <View style={[styles.commentBox, { paddingBottom: 8 + (keyboardUp ? 0 : insets.bottom) }]}>
        <TextInput
          style={styles.comment}
          placeholder='Message...'
          placeholderTextColor='#a79bb0'
          onChangeText={(value) => setComment(value)}
          value={comment}
          multiline
        />

        <Pressable
          onPress={send}
          style={({ pressed }) => [
            {opacity: pressed ? 0.6: 1}, styles.buttonPost, {backgroundColor: canSend ? '#613a5f' : '#b9a9c4'},
          ]}
        >
          <MaterialIcons name='send' size={22} color='white' />
        </Pressable>
      </View>
      {unreadMessages == 0? null : (
        <Pressable
          onPress={onScrollDown}
          pressRetentionOffset={{bottom: 30, left: 60, right: 20, top: 20}}
          style={({ pressed }) => [
            {opacity: pressed ? 0.5: 1, alignItems:'flex-end', justifyContent:'flex-start'}
          ]}
        >
          <View style={styles.unread}>
            <MaterialIcons name='keyboard-arrow-down' size={25} color='white' />
            <Text style={{color:'white', fontSize:16, fontWeight:'600'}}>{unreadMessages}</Text>
          </View>
        </Pressable>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  commentBox: {
    backgroundColor: 'white',
    paddingVertical: 8,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'flex-end',
    flex: 1,
    elevation: 12,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  comment: {
    backgroundColor: '#f3eef6',
    color: '#222',
    paddingVertical: 8,
    paddingHorizontal: 16,
    flex: 1,
    maxHeight: 120,
    fontSize: 16,
    borderRadius: 22,
  },
  buttonPost: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unread: {
    elevation: 10,
    position: 'absolute',
    right: 12,
    bottom: '100%',
    marginBottom: 10,
    flexDirection: 'row',
    backgroundColor: '#e374b5',
    paddingVertical: 6,
    paddingLeft: 6,
    paddingRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 25,
  },
});
