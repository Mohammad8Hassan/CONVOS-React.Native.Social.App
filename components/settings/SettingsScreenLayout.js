import { StyleSheet, Text, View, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';

// Header (back arrow + title) and scrolling body shared by the settings sub-screens.
export default function SettingsScreenLayout({ title, onBack, children }) {
  const { mainColor, backgroundColor, headerTextColor } = useSelector(state => state.theme);

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: mainColor}}>
      <View style={{flex: 1, backgroundColor: backgroundColor}}>
        <View style={[styles.header, {backgroundColor: mainColor}]}>
          <Pressable onPress={onBack} hitSlop={10} style={({ pressed }) => [{opacity: pressed ? 0.5 : 1}]}>
            <Ionicons name='chevron-back-circle' size={27} color={headerTextColor} />
          </Pressable>
          <Text style={{flex: 1, fontSize: 19, color: headerTextColor, fontFamily: 'Solway-Regular', marginLeft: 10}}>{ title }</Text>
        </View>
        <ScrollView contentContainerStyle={{paddingBottom: 30}}>{ children }</ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    paddingBottom: 16,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
  },
});
