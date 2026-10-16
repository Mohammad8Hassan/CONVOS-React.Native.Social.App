import { StyleSheet, Text, View, Image, Platform } from 'react-native'
import React, { useEffect, useState } from 'react'

let color = '';

export default function SystemMessage(props) {
  // const [status, setStatus] = useState('');
  // const [color, setColor] = useState()
  
  // useEffect(() => {
  //   switch(props.comment.comment) {
  //     case 'added': status = ' has joined the conversation.'; color= 'green'; console.log('added'); break;
  //     case 'left': status = ' has left the conversation.'; color= 'yellow'; console.log('left'); break;
  //     case 'removed': status = ' was removed from the conversation.'; color= 'yellow'; console.log('removed'); break;
  //   }
  //   console.log("status: ", status);
  //   console.log("color: ", color);
  // })

  const status = () => {
    switch(props.comment.comment) {
      case 'joined': return ' has joined the conversation';
      case 'left': return ' has left the conversation';
      case 'removed': return ' was removed from the conversation';
    }
  }

  const color = () => {
    switch(props.comment.comment) {
      case 'joined': return 'green';
      case 'left': return '#ada45a';
      case 'removed': return '#ada45a';
    }
  }
  

  return (
    <View style={[styles.container, {borderColor:color()}]}>
      <View style={{flexDirection:'row', alignItems:'center', }}>
        <Image source={{uri: props.comment.uri}} style={{height:25, width:25, borderRadius:50, }} />
        <Text style={{color:'#3380a3', marginLeft:5, fontSize:Platform.OS==='android'?13:12, fontWeight:'bold', flexShrink:1}}>
          { props.comment.Name }
          <Text style={{color:color(), fontSize:Platform.OS==='android'?13:12, fontStyle:'italic', fontWeight:'normal'}}>{ status() }</Text>
        </Text>
        
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginVertical:4,
    paddingVertical:4,
    paddingHorizontal:8,
    borderRadius: 20,
    borderWidth:1,
    backgroundColor:'rgba(255,255,255,0.8)',
  }
})