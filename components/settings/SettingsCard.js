import { StyleSheet, Text, View, Switch, Pressable } from 'react-native';
import { useSelector } from 'react-redux';

export function SettingsCard({ title, children }) {
  const iconActiveColor = useSelector(state => state.theme.iconActiveColor);

  return (
    <View style={styles.card}>
      <Text style={{color: iconActiveColor, fontSize: 13, fontWeight: '700', letterSpacing: 0.5, marginBottom: 8}}>{ title }</Text>
      { children }
    </View>
  );
}

export function SwitchRow({ label, hint, value, onChange, disabled }) {
  return (
    <View style={styles.row}>
      <View style={{flex: 1, marginRight: 10}}>
        <Text style={styles.label}>{ label }</Text>
        { hint ? <Text style={styles.hint}>{ hint }</Text> : null }
      </View>
      <Switch value={value} onValueChange={onChange} disabled={disabled} trackColor={{true: '#613a5f'}} />
    </View>
  );
}

export function ChoiceRow({ label, hint, selected, onPress }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, {opacity: pressed ? 0.5 : 1}]}>
      <View style={{flex: 1, marginRight: 10}}>
        <Text style={styles.label}>{ label }</Text>
        { hint ? <Text style={styles.hint}>{ hint }</Text> : null }
      </View>
      <View style={[styles.radio, selected && {borderColor: '#613a5f'}]}>
        { selected ? <View style={styles.radioDot} /> : null }
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: 'white', marginHorizontal: 12, marginTop: 18, padding: 16, borderRadius: 18, elevation: 3 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  label: { color: '#5f5368', fontSize: 16 },
  hint: { color: '#8d8296', fontSize: 12, marginTop: 2 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#b9a9c4', alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#613a5f' },
});
