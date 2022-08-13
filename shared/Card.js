import { View, StyleSheet } from "react-native";


export default function Card(props) {
    return(
        <View style={styles.card}>
            <View style={styles.cardContent}>
                { props.children }
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card:{
        borderRadius: 6,
        backgroundColor: '#fff',
        elevation: 10
    },
  
});