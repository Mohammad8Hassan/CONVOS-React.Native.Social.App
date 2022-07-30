import { useState } from "react";
import { View, StyleSheet, Button, StatusBar, Text } from "react-native";

export default function About() {
    const [cond1, setCond1] = useState(true);
    const [cond2, setCond2] = useState(true);

    return (
      <>
      { cond1 == true ? (
          <>
            { cond2 && 
            <Text>First Route</Text> }
          </>
        ): (
          <Text>Second Route</Text>
        )
      
      }
      </>
    );
};
    
const styles = StyleSheet.create({
    
});