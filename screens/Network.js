import { StyleSheet, Text, View, Pressable, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
//import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';

export default function Network({ navigation }) {
  
  return (
    <SafeAreaView style={{flex:1, backgroundColor:'#613a5f'}}>
      <View style={{flex:1, backgroundColor:'#ebebeb'}}>
        <Pressable 
          onPress={() => BackHandler.exitApp()}
          style={({ pressed }) => [
            {opacity: pressed ? 0.5: 1}, {alignSelf:'flex-start', marginTop:10, marginLeft:10}
          ]}
          >
          <Ionicons name='chevron-back-circle' size={35} color="#853259" />
        </Pressable>

        <View style={styles.na}>
          <View style={styles.naHeader}>
            <MaterialIcons name='wifi-off' color='#853259' size={40} style={{flex:1}}/>
            <Text style={{flex:6, color:'#853259', fontSize:20, fontFamily:'Solway-Bold'}}>No internet connection</Text>
          </View>

          <View style={styles.naBody}>
            <Text style={{fontSize:18, color:'#853259', fontFamily:'Solway-Regular'}}>CONVOS requires an active internet connection to work.</Text>
          </View>
        </View>

      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  na: {
    marginHorizontal:20,
    marginTop: 50,
    alignItems: 'stretch',
    paddingHorizontal:20
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