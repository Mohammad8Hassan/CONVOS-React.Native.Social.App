import { useState } from 'react';
import { StyleSheet, View, TextInput, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export default function AuthInput({ icon, secureTextEntry, style, ...props }) {
  const [hidden, setHidden] = useState(true);
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.box, focused && styles.focused, style]}>
      <MaterialIcons name={icon} size={22} color={focused ? '#613a5f' : '#a79bb0'} />
      <TextInput
        {...props}
        secureTextEntry={secureTextEntry && hidden}
        placeholderTextColor='#a79bb0'
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={styles.input}
      />
      {secureTextEntry && (
        <Pressable onPress={() => setHidden(h => !h)} hitSlop={10}>
          <MaterialIcons name={hidden ? 'visibility-off' : 'visibility'} size={22} color='#a79bb0' />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0e9f4',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'transparent',
    paddingHorizontal: 14,
    marginTop: 12,
  },
  focused: { backgroundColor: 'white', borderColor: '#613a5f' },
  input: { flex: 1, fontSize: 16, color: '#222', paddingVertical: 13, paddingHorizontal: 10 },
});
