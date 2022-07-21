import { Formik } from 'formik';
import { View, TextInput, Button, Text, TouchableOpacity } from 'react-native';
import { globalStyles } from './globalStyles';
import * as yup from 'yup'

const reviewSchema = yup.object({
  title: yup.string()
    .required()
    .min(4),
  body: yup.string()
    .required()
    .min(8),
});

export default function Form({ addReview }) {
  return(

    <Formik
      initialValues={{title: '', body: ''}}
      onSubmit={(values) => addReview(values)}
      validationSchema={reviewSchema}
    >
      {props => (
        <View>
          <TextInput
            style={globalStyles.input}
            placeholder='Title'
            onChangeText={props.handleChange('title')}
            value={props.values.title}
          />
          <Text style={globalStyles.errorText}>{props.touched.body && props.errors.title}</Text>

          <TextInput
            style={globalStyles.inputBody}
            placeholder='Body'
            onChangeText={props.handleChange('body')}
            value={props.values.body}
            textAlignVertical= 'top'
            multiline 
          />
          <Text style={globalStyles.errorText}>{props.touched.body && props.errors.body}</Text>

          {/* <Button color='maroon' title='Submit' onPress={props.handleSubmit} /> */}
          <TouchableOpacity style={globalStyles.buttonSubmit} onPress={props.handleSubmit}>
            <Text style={{color:'white', fontSize:18,}}>Submit</Text>
          </TouchableOpacity>
        </View>
      )}
    </Formik>

  )
}