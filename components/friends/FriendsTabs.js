import { StyleSheet, Text, View, Pressable } from 'react-native';
import { useSelector } from 'react-redux';

function Tab({ name, label, selector, onSelect, count }) {
  const selectorColor = useSelector(state => state.theme.selectorColor);
  const active = selector == name;

  return (
    <Pressable
      onPress={() => onSelect(name)}
      style={({ pressed }) => [
        {opacity: pressed ? 0.7: 1}, styles.tab, active && {backgroundColor: selectorColor, flex: 1.5}
      ]}
    >
      <Text style={[styles.label, {opacity: active ? 1 : 0.8}]} numberOfLines={1}>{label}</Text>
      { (count > 0) && <Text style={styles.badge}>{ count }</Text> }
    </Pressable>
  )
}

export default function FriendsTabs({ selector, onSelect, receivedRequestsNum, sentRequestsNum }) {
  return (
    <View style={styles.track}>
      <Tab name='friends' label='Friends' selector={selector} onSelect={onSelect} />
      <Tab name='received' label='Received' selector={selector} onSelect={onSelect} count={receivedRequestsNum} />
      <Tab name='sent' label='Sent' selector={selector} onSelect={onSelect} count={sentRequestsNum} />
    </View>
  )
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: 'rgba(48,22,47,0.28)',
    borderRadius: 24,
    padding: 4,
    marginTop: 14,
    marginBottom: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  label: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  },
  badge: {
    backgroundColor: '#f55fd2',
    color: 'white',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 6,
    paddingVertical: 1,
    paddingHorizontal: 6,
    borderRadius: 9,
    overflow: 'hidden',
  },
});
