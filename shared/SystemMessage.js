import { StyleSheet, Text, View, Image } from 'react-native'
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
      <View style={{flexDirection:'row', alignItems:'center', flexWrap:'wrap'}}>
        <Image source={{uri: props.comment.uri}} style={{height:25, width:25, borderRadius:50, }} />
        <Text style={{color:'#3380a3', marginLeft:5, fontSize:13, fontWeight:'bold'}}>{ props.comment.Name }</Text>
        <Text style={{color:color(), fontSize:13, fontStyle:'italic'}}>{ status() }</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 5,
    marginVertical:6,
    padding:4,
    borderRadius: 10,
    borderWidth:1,
  }
})