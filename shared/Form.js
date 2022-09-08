import { Formik } from 'formik';
import { StyleSheet, View, TextInput, Text, TouchableOpacity, Modal, Pressable, } from 'react-native';
import { globalStyles } from './globalStyles';
import * as yup from 'yup';

const reviewSchema = yup.object({
  title: yup.string()
    .required()
    .min(1),
  body: yup.string()
    .required()
    .min(1),
});

export default function Form({ addConversation }) {
  return(

    <Formik
      initialValues={{title: '', body: ''}}
      onSubmit={(values) => addConversation(values)}
      validationSchema={reviewSchema}
    >
      {props => (
        <View style={{alignItems:'flex-start'}}>
          <Text style={{fontSize:22, color:'#ede9f2', marginLeft:10, marginBottom:5}}>Title</Text>
          <TextInput
            style={styles.input}
            placeholder='Title'
            onChangeText={props.handleChange('title')}
            value={props.values.title}
          />
          <Text style={styles.errorText}>{props.touched.body && props.errors.title}</Text>

          <Text style={{fontSize:22, color:'#ede9f2', marginLeft:10, marginBottom:5, marginTop:10}}>Body</Text>
          <TextInput
            style={styles.inputBody}
            placeholder='Body'
            onChangeText={props.handleChange('body')}
            value={props.values.body}
            textAlignVertical= 'top'
            multiline 
          />
          <Text style={styles.errorText}>{props.touched.body && props.errors.body}</Text>

          <View style={styles.participants}>
            <Text style={{fontSize:22, color:'#574866',}}>Participants</Text>
          </View>



          <TouchableOpacity style={styles.buttonSubmit} onPress={props.handleSubmit}>
            <Text style={{color:'white', fontSize:18,}}>Submit</Text>
          </TouchableOpacity>
        </View>
      )}
    </Formik>

  )
}

const styles = StyleSheet.create({
  input: {
    marginBottom: 10,
    borderWidth: 2,
    fontSize: 18,
    padding: 10,
    borderColor:"#574866",
    backgroundColor: '#ede9f2',
    alignSelf:'stretch',
    marginRight: 50,
    borderRadius:20
  },
  errorText: {
    color: '#ff9cc3',
    fontWeight: 'bold',
    marginBottom: 3,
    marginLeft:10
  },
  inputBody: {
    height: 200,
    marginBottom: 10,
    borderWidth: 2,
    fontSize: 18,
    padding: 10,
    borderColor:"#574866",
    backgroundColor: '#ede9f2',
    alignSelf:'stretch',
    marginRight: 50,
    borderRadius:20,
  },
  buttonSubmit: {
    backgroundColor: '#b27cc4',
    padding: 10,
    borderRadius: 20,
    elevation: 8,
    marginBottom: 20,
    marginTop: 20,
    alignSelf:'stretch',
    alignItems:'center',
    marginHorizontal:30
  },
  participants: {
    backgroundColor:'#cebce0', 
    alignSelf:'stretch', 
    marginHorizontal:10,
    padding:5,
    marginTop:10,
    borderRadius:5,
    paddingLeft:10
  }
})