import { useCallback, useState } from 'react';
import { StyleSheet, Text, View, Image, ScrollView, TouchableOpacity, TextInput, Pressable,
  RefreshControl, Switch, ActivityIndicator } from 'react-native';
import { Formik } from 'formik';
import * as yup from 'yup';

// REFACTOR NOTE: this is the title / body / participants preview / password / Create part of
// screens/NewConv.js (the Formik form inside a ScrollView), together with its yup schema and styles.
// It owns `hasPassword` and the (cosmetic) pull-to-refresh state; the screen only gets
// onSubmit(values, hasPassword). Toggling the password switch used to *mutate* Formik's
// `props.values.password = '123456'`; there is no default password any more (see schemas below).
// REFACTOR NOTE: there was one schema where `password` was always required, which is why the field was
// pre-filled with '123456' even when the conversation had no password (and that default became the real
// password if the author just flipped the switch). The password is only validated when the switch is
// on, there is no default, and the author has to choose it.
const baseShape = {
  title: yup.string()
    .required()
    .max(30)
    .min(1),
  body: yup.string()
    .required()
    .max(300)
    .min(1),
};
const schemaWithoutPassword = yup.object(baseShape);
const schemaWithPassword = yup.object({
  ...baseShape,
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
    <View style={{flex: 1, paddingHorizontal:14, paddingTop:10}}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh}
      progressBackgroundColor={'white'} />}
      >
        <Formik
          initialValues={{title: '', body: '', password: ''}}
          onSubmit={(values) => onSubmit({...values, password: hasPassword ? values.password : ''}, hasPassword)}
          validationSchema={hasPassword ? schemaWithPassword : schemaWithoutPassword}
        >
          {props => (
            <View style={{alignItems:'flex-start', flex:1,}}>
              <Text style={styles.label}>Title</Text>
              <TextInput
                style={styles.input}
                placeholder='Title'
                onChangeText={props.handleChange('title')}
                value={props.values.title}
                maxLength={30}
              />
              { (props.touched.title && props.errors.title) && <Text style={styles.errorText}>{props.errors.title}</Text> }

              <Text style={[styles.label, {marginTop:10}]}>Body</Text>
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
                  <Text style={{fontSize:16, fontWeight:'700', color:'#574866', marginRight:20}}>Participants</Text>
                  {selected.length != 0 ? (
                    <View style={{flex:1,}} onStartShouldSetResponder={()=>true}>
                      <ScrollView horizontal>
                        {selected.map(item => (
                          <View key={item.ID}>
                            <Image source={{uri: item.photo}} style={{height:36, width:36, borderRadius:18, marginRight:4, borderWidth:1.5, borderColor:'#613a5f'}} />
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
                <Text style={[styles.label, {marginBottom:0, marginRight:8}]}>Password</Text>
                <Switch
                  onValueChange={() => setHasPassword(prev => !prev)}
                  value={hasPassword}
                />
              </View>
              {hasPassword ? (
                  <>
                    <TextInput
                      style={[styles.input, {marginTop:10}]}
                      placeholder='Password (6-16 characters)'
                      onChangeText={props.handleChange('password')}
                      value={props.values.password}
                      maxLength={16}
                      autoCapitalize='none'
                      autoCorrect={false}
                    />
                    <Text style={styles.hint}>
                      Share it with the people you want to join. It can't be shown again after you create the conversation.
                    </Text>
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
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ede9f2',
    marginLeft: 6,
    marginBottom: 6,
  },
  input: {
    marginBottom: 10,
    fontSize: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: 'white',
    alignSelf:'stretch',
    borderRadius: 14,
    elevation: 2,
  },
  hint: {
    color: '#ede9f2',
    opacity: 0.85,
    fontSize: 13,
    marginLeft: 6,
    marginBottom: 5,
  },
  errorText: {
    color: '#ffd0e3',
    fontWeight: 'bold',
    marginBottom: 3,
    marginLeft: 6
  },
  inputBody: {
    height: 160,
    marginBottom: 10,
    fontSize: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: 'white',
    alignSelf:'stretch',
    borderRadius: 14,
    elevation: 2,
  },
  buttonSubmit: {
    backgroundColor: '#1da877',
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 4,
    marginBottom: 20,
    marginTop: 20,
    alignSelf:'stretch',
    alignItems:'center',
  },
  buttonSubmitAI: {
    alignSelf:'center',
    marginBottom: 20,
    marginTop: 20,
  },
  participants: {
    backgroundColor:'#e7dcef',
    alignSelf:'stretch',
    padding: 12,
    marginTop: 12,
    borderRadius: 14,
  },
});
