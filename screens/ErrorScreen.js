import { StyleSheet, Text, View, Pressable, SafeAreaView } from 'react-native';
//import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';

export default function ErrorScreen({ navigation }) {
  useEffect(() => {
    // const tab = navigation.getParent();
    // tab.setOptions({
    //   tabBarStyle: {display: 'none'}
    // });

    // return () => {
    //   tab.setOptions({
    //     tabBarStyle: {display: 'flex', backgroundColor: '#745f8a'}
    //   });
    // }
  })
  return (
    <SafeAreaView style={{flex:1}}>
      <Pressable 
        onPress={() => navigation.goBack()}
        style={({ pressed }) => [
          {opacity: pressed ? 0.5: 1}, {alignSelf:'flex-start', marginTop:10, marginLeft:10}
        ]}
        >
        <Ionicons name='chevron-back-circle' size={35} color="#853259" />
      </Pressable>
      <View style={styles.na}>
        <View style={styles.naHeader}>
          <MaterialIcons name='warning' color='#853259' size={40} style={{flex:1}}/>
          <Text style={{flex:6, color:'#853259', fontSize:20, fontFamily:'Solway-Bold'}}>Conversation not available</Text>
        </View>
        <View style={styles.naBody}>
          <Text style={{fontSize:18, color:'#853259', fontFamily:'Solway-Regular'}}>It may have been deleted, or you are no longer a participant</Text>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  na: {
    marginHorizontal:20,
    marginTop: 50,
    alignItems: 'stretch'
  },
  naHeader: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  naBody: {
    marginHorizontal:20,
    marginTop:10,
    alignItems: 'flex-start'
  },
})