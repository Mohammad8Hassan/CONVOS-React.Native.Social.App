import { useCallback, useState } from 'react';
import { StyleSheet, Text, View, Image, ScrollView, TouchableOpacity, TextInput, Pressable,
  RefreshControl, Switch, ActivityIndicator } from 'react-native';
import { Formik } from 'formik';
import * as yup from 'yup';

// REFACTOR NOTE: this is the title / body / participants preview / password / Create part of
// screens/NewConv.js (the Formik form inside a ScrollView), together with its yup schema and styles.
// It owns `hasPassword` and the (cosmetic) pull-to-refresh state; the screen only gets
// onSubmit(values, hasPassword). Two small cleanups:
//  - toggling the password switch used to *mutate* Formik's `props.values.password = '123456'`;
//    it now uses setFieldValue.
//  - the typed values are kept by Formik only (nothing else read them).
const reviewSchema = yup.object({
  title: yup.string()
    .required()
    .max(30)
    .min(1),
  body: yup.string()
    .required()
    .max(300)
    .min(1),
  password: yup.string()
    .required()
    .max(16)
    .min(6)
});

const wait = (timeout) => {
  return new Promise(resolve => setTimeout(resolve, timeout));
}

export default function ConversationForm({ selected, submitting, onOpenParticipants, onSubmit }) {
  const [hasPassword, setHasPassword] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    wait(800).then(() => setRefreshing(false));
  }, []);

  return (
    <View style={{flex: 1, padding:10,}}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh}
      progressBackgroundColor={'white'} />}
      >
        <Formik
          initialValues={{title: '', body: '', password: '123456'}}
          onSubmit={(values) => onSubmit(values, hasPassword)}
          validationSchema={reviewSchema}
        >
          {props => (
            <View style={{alignItems:'flex-start', flex:1,}}>
              <Text style={{fontSize:22, color:'#ede9f2', marginLeft:10, marginBottom:5, fontFamily:'Solway-Regular'}}>Title</Text>
              <TextInput
                style={styles.input}
                placeholder='Title'
                onChangeText={props.handleChange('title')}
                value={props.values.title}
                maxLength={30}
              />
              { (props.touched.title && props.errors.title) && <Text style={styles.errorText}>{props.errors.title}</Text> }

              <Text style={{fontSize:22, color:'#ede9f2', marginLeft:10, marginBottom:5, marginTop:10, fontFamily:'Solway-Regular'}}>Body</Text>
              <TextInput
                style={styles.inputBody}
                placeholder='Body'
                onChangeText={props.handleChange('body')}
                value={props.values.body}
                textAlignVertical= 'top'
                multiline
                maxLength={300}
              />
              { (props.touched.body && props.errors.body) && <Text style={styles.errorText}>{props.errors.body}</Text> }

              {/* participants */}
              <TouchableOpacity style={styles.participants} onPress={onOpenParticipants}>
                <View style={{flexDirection:'row', alignItems:'center'}}>
                  <Text style={{fontSize:22, color:'#574866', marginRight:30, fontFamily:'Solway-Regular'}}>Participants</Text>
                  {selected.length != 0 ? (
                    <View style={{flex:1,}} onStartShouldSetResponder={()=>true}>
                      <ScrollView horizontal>
                        {selected.map(item => (
                          <View key={item.ID}>
                            <Image source={{uri: item.photo}} style={{height:40, width:40, borderRadius:50}} />
                          </View>
                        ))}
                      </ScrollView>
                    </View>
                  ): null}
                </View>
                <View style={{flexDirection:'row', marginTop:5, flexWrap:'wrap'}}>
                  {selected.map(item => (
                    <View key={item.ID}>
                      <Text style={{fontSize:15, marginRight:8, color:'black'}}>{ item.name }</Text>
                    </View>
                  ))}
                </View>
              </TouchableOpacity>

              <View style={{flexDirection:'row', marginTop:20, alignItems:'center'}}>
                <Text style={{fontSize:22, color:'#ede9f2', marginLeft:10, marginRight:5, fontFamily:'Solway-Regular'}}>Password</Text>
                <Switch
                  onValueChange={() => {
                    if(!props.values.password)
                      props.setFieldValue('password', '123456');
                    setHasPassword(prev => !prev);
                  }}
                  value={hasPassword}
                />
              </View>
              {hasPassword ? (
                  <>
                    <TextInput
                      style={[styles.input, {marginTop:10}]}
                      placeholder='Password'
                      onChangeText={props.handleChange('password')}
                      value={props.values.password}
                    />
                    { (props.touched.password && props.errors.password) && <Text style={styles.errorText}>{props.errors.password}</Text> }
                  </>
                ) : null
              }

              {submitting? (
                  <ActivityIndicator size={50} color='#1da877' animating={submitting} style={styles.buttonSubmitAI}/>
                ) : (
                  <Pressable
                    onPress={props.handleSubmit}
                    style={({ pressed }) => [
                      {opacity: pressed ? 0.5: 1}, styles.buttonSubmit
                    ]}
                  >
                    <Text style={{color:'white', fontSize:18,}}>Create</Text>
                  </Pressable>
                )
              }

            </View>
          )}
        </Formik>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  input: {
    marginBottom: 10,
    borderWidth: 2,
    fontSize: 18,
    padding: 6,
    paddingLeft:8,
    borderColor:"#574866",
    backgroundColor: '#ede9f2',
    alignSelf:'stretch',
    marginRight: 50,
    borderRadius:10,
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
    padding: 8,
    paddingLeft:8,
    borderColor:"#574866",
    backgroundColor: '#ede9f2',
    alignSelf:'stretch',
    marginRight: 50,
    borderRadius:10,
  },
  buttonSubmit: {
    backgroundColor: '#1da877',
    padding: 10,
    borderRadius: 20,
    elevation: 8,
    marginBottom: 20,
    marginTop: 20,
    alignSelf:'stretch',
    alignItems:'center',
    marginHorizontal:30,
    shadowOffset: {width:0, height:5},
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  buttonSubmitAI: {
    alignSelf:'center',
    marginBottom: 20,
    marginTop: 20,
  },
  participants: {
    backgroundColor:'#cebce0',
    alignSelf:'stretch',
    marginHorizontal:3,
    padding:5,
    marginTop:15,
    borderRadius:5,
    paddingLeft:10,
  },
});
