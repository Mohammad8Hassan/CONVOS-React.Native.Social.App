import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Button, FlatList, TouchableOpacity, ImageBackground, Modal,
  KeyboardAvoidingView, ScrollView, Alert
} from 'react-native';
import { globalStyles } from '../shared/globalStyles';
import Card from '../shared/Card';
import { MaterialIcons } from '@expo/vector-icons';
import Form from '../shared/Form';
import { getFirestore, addDoc, collection, serverTimestamp, onSnapshot, query, orderBy,
   doc, deleteDoc, setDoc, Timestamp } from 'firebase/firestore'
import { getAuth } from 'firebase/auth';
import { Menu, MenuOptions, MenuOption, MenuTrigger, } from 'react-native-popup-menu';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ByMe({ navigation }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [reviews, setReviews] = useState([]);

  const db = getFirestore();
  
  useEffect(() => {
    const colRef = collection(db, 'Posts');
    const q = query(colRef, orderBy('dateCreated'));
    const unsubscribe = onSnapshot(q, snapShot => {
      let result = [];
      snapShot.forEach(doc => {
        if(getAuth().currentUser.uid == doc.data().authorID) {
          const empty = doc.data().dateCreated === null ? Timestamp.now() : doc.data().dateCreated;
          result.push({id: doc.id, ...doc.data(), dateCreated: empty});
        }
      })
      
      setReviews(result);
    })

    return () => {
      unsubscribe();
    }

  }, [])

  const deletePost = (id) => {
    deleteDoc(doc(db, 'Posts', id));
  }

  const showAlert = (id) => {
    Alert.alert(
      'Delete Post?',
      'Are you sure you want to delete this post?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: "confirm",
          onPress: () => deletePost(id)
        }
      ],
      {
        cancelable: true
      }
    )
  }

  const addReview = (review) => {
    setModalOpen(false);

    addDoc(collection(db, 'Posts'), {
      title: review.title,
      body: review.body,
      author: getAuth().currentUser.displayName,
      authorID: getAuth().currentUser.uid,
      authorEmail: getAuth().currentUser.email,
      dateCreated: serverTimestamp(),
    })
  
  };

  return (
    <SafeAreaView style={{flex:1}}>
      <View style={{...globalStyles.container, backgroundColor:'#806b96'}}>
        
        <Modal visible={modalOpen} animationType='fade'>
          <View style={styles.modalContent}>

            <MaterialIcons name='close' size={24} 
            style={{...styles.modalToggle, ...styles.modalClose}} onPress={() => setModalOpen(false)} />

            <KeyboardAvoidingView style={styles.modalBody}>
              <ScrollView>
                <Form addReview={addReview} />
              </ScrollView>
            </KeyboardAvoidingView>

          </View>
        </Modal>
        
        <View style={styles.homeHeader}>
          <Text style={{fontSize:18, color:'white'}}>By me</Text>

          <TouchableOpacity onPress={() => setModalOpen(true)} style={styles.newConv}>
            <View style={styles.modalToggle}>
              <MaterialIcons name='add' size={18} color="white" />
              <Text style={{color:'white', fontSize:15, marginLeft:5}}>New Conversation</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={{flex: 1}}>
          <FlatList data={reviews} renderItem={({ item }) => (
            <TouchableOpacity onPress={() => navigation.navigate('Details', { id: item.id })} style={styles.item}>
              <Card>
                <View style={styles.content}>
                  <View style={styles.header}>
                    <Text style={globalStyles.titleText}>{ item.title }</Text>
                    
                    {(getAuth().currentUser.uid == item.authorID) &&
                      <Menu>
                        <MenuTrigger>
                          <MaterialIcons name='more-horiz' size={24} color="grey"/>
                        </MenuTrigger>
                        <MenuOptions>
                          <MenuOption onSelect={() => showAlert(item.id)}>
                            <Text style={{color: "red", fontSize: 18, margin: 5}}>Delete Post</Text>
                          </MenuOption>
                        </MenuOptions>
                      </Menu>
                    }
                    
                  </View>
                  <Text style={styles.body} numberOfLines={2}>{ item.body }</Text>
                </View>
                <View style={styles.createdView}>
                  <Text style={styles.createdAuthor}>{ item.author }</Text>
                  <Text style={styles.createdTime}>{ item.dateCreated.toDate().toDateString() }</Text>
                </View>
              </Card>
            </TouchableOpacity>
          )}/>
        </View>
        
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  modalToggle: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f2f2f2',
    padding: 10,
    borderRadius: 10,
    alignSelf: 'center',
    flexDirection: 'row',
    borderStyle: 'dashed'
  },
  modalClose: {
    marginTop: 20,
    marginBottom: 0,
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#d5ccd9',
  },
  modalBody: {
    flex: 1,
    alignItems: 'center',
    alignItems: 'stretch',
    margin: 20,
    paddingTop: 20,
  },
  content:{
    marginHorizontal: 18,
    marginTop: 20,
  },
  createdView: {
    flexDirection: 'row',
    marginTop: 30,
    backgroundColor: '#cebce0',
    padding: 10,
    marginHorizontal: 0
  },
  newConv: {
    justifyContent:'center'
  },
  homeHeader: {
    flexDirection: 'row', 
    justifyContent:'space-between', 
    alignItems:'center',
    marginBottom: 15,
    backgroundColor: '#524d57',
    padding: 10
  },
  createdAuthor: {
    fontSize: 15,
    color: '#545303',
  },
  createdTime: {
    fontSize: 15,
    marginLeft: 'auto'
  },
  body: {
    marginTop: 15,
    fontSize: 20,
  },
  header: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  item: {
    marginHorizontal: 10,
    marginBottom: 10
  }
});