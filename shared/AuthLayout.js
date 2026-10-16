import { StyleSheet, Text, View, Image, ScrollView, KeyboardAvoidingView, Pressable, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import logo from '../assets/Imgs/icon.png';

// Shared shell of Login / Register: purple hero (app logo + wordmark, plus two ghost chat bubbles) with the form on a rounded sheet that rises over it.
export default function AuthLayout({ title, subtitle, onBack, compact, children }) {
  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{flexGrow: 1}} keyboardShouldPersistTaps='handled' showsVerticalScrollIndicator={false}>
          <View style={[styles.hero, compact && styles.heroCompact]}>
            <View style={[styles.bubble, styles.bubbleLeft]} pointerEvents='none' />
            <View style={[styles.bubble, styles.bubbleRight]} pointerEvents='none' />

            {onBack && (
              <Pressable onPress={onBack} style={({ pressed }) => [styles.back, {opacity: pressed ? 0.5 : 1}]} hitSlop={10}>
                <Ionicons name='chevron-back-circle' size={32} color='white' />
              </Pressable>
            )}

            <Image source={logo} style={styles.logo} />

            <Text style={styles.brand}>CONVOS</Text>
            <Text style={styles.tagline}>Conversations, with your people</Text>
          </View>

          <View style={styles.sheet}>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            {children}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#613a5f' },
  hero: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 50,
    paddingBottom: 56,
    overflow: 'hidden',
  },
  heroCompact: { paddingTop: 30, paddingBottom: 44 },
  back: { position: 'absolute', top: 12, left: 12, zIndex: 10 },
  bubble: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 28,
  },
  bubbleLeft: { width: 120, height: 70, top: 28, left: -26, borderBottomLeftRadius: 6 },
  bubbleRight: { width: 150, height: 84, bottom: 38, right: -34, borderBottomRightRadius: 6 },
  logo: {
    width: 104,
    height: 104,
    borderRadius: 28,
    marginBottom: 16,
    elevation: 8,
  },
  brand: {
    fontFamily: 'Solway-Bold',
    fontSize: 34,
    letterSpacing: 4,
    color: 'white',
  },
  tagline: {
    fontFamily: 'Solway-Regular',
    fontSize: 14,
    color: '#d4c86e',
    marginTop: 2,
  },
  sheet: {
    flex: 1,
    backgroundColor: '#faf7fc',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 26,
    paddingTop: 28,
    paddingBottom: 30,
    marginTop: -28,
  },
  title: { fontFamily: 'Solway-Bold', fontSize: 24, color: '#30162f' },
  subtitle: { fontSize: 14, color: '#8d8296', marginTop: 2, marginBottom: 6 },
});
