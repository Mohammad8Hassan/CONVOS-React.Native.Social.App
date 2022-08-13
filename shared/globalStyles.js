import { StyleSheet } from "react-native";

export const globalStyles = StyleSheet.create({
      titleText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
        marginRight: 50
      },
      paragraph: {
        marginVertical: 8,
        lineHeight: 20,
      },
      container: {
        flex: 1,
        
      },
      input: {
        marginBottom: 10,
        marginHorizontal: 20,
        borderBottomWidth: 1,
        fontSize: 18,
        padding: 10,
        borderColor:"grey",
        backgroundColor: 'white'
      },
      errorText: {
        color: 'crimson',
        fontWeight: 'bold',
        marginBottom: 6,
        marginTop: 3,
        textAlign: 'center',
      },
      inputBody: {
        height: 200,
        marginBottom: 20,
        marginHorizontal: 20,
        borderBottomWidth: 1,
        fontSize: 18,
        padding: 10,
        borderColor:"grey",
        backgroundColor: 'white'
      },
      buttonSubmit: {
        backgroundColor: '#b27cc4',
        padding: 10,
        alignItems: 'center',
        borderRadius: 20,
        elevation: 8,
        marginBottom: 20,
        marginTop: 20,
        marginHorizontal: 40
      },
});