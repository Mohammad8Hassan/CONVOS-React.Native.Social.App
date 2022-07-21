import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Button, FlatList, TouchableOpacity, ImageBackground, Modal,
  KeyboardAvoidingView, ScrollView
} from 'react-native';
import { globalStyles } from '../shared/globalStyles';
import Card from '../shared/Card';
import { MaterialIcons } from '@expo/vector-icons';
import Form from '../shared/Form';
import { getFirestore, addDoc, collection, serverTimestamp, onSnapshot, query, orderBy,
   doc, deleteDoc, setDoc, Timestamp } from 'firebase/firestore'
import { getAuth } from 'firebase/auth';
import { Menu, MenuOptions, MenuOption, MenuTrigger, } from 'react-native-popup-menu';


// component
export default function Home({ navigation }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [reviews, setReviews] = useState([]);

  const db = getFirestore();

  // { title: 'Zelda, Breath of Fresh Air', rating: 5, body: 'lorem ipsum', key: '1' },
  

  useEffect(() => {
    const colRef = collection(db, 'Posts');
    const q = query(colRef, orderBy('dateCreated'));
    onSnapshot(q, snapShot => {
      let result = [];
      snapShot.forEach(doc => {
        const empty = doc.data().dateCreated === null ? Timestamp.now() : doc.data().dateCreated;
        result.push({id: doc.id, ...doc.data(), dateCreated: empty});
      })
      
      setReviews(result);
    })
  }, [])

  const deletePost = (id) => {
    deleteDoc(doc(db, 'Posts', id));
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
    <ImageBackground source={require('../assets/Imgs/bk.jpg')} imageStyle={{opacity: 0.9}} style={globalStyles.container}>
      
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

      <MaterialIcons name='add' size={24} 
      style={styles.modalToggle} 
      color="white"
      onPress={() => setModalOpen(true)}
      />
      <View style={{flex: 1}}>
        <FlatList data={reviews} renderItem={({ item }) => (
          <TouchableOpacity onPress={() => navigation.navigate('Details', { item })}>
            <Card>
              <View style={styles.content}>
                <View style={styles.header}>
                  <Text style={globalStyles.titleText}>{ item.title }</Text>

                  <Menu>
                    <MenuTrigger>
                      <MaterialIcons name='more-horiz' size={24} color="grey"/>
                    </MenuTrigger>
                    <MenuOptions>
                      <MenuOption onSelect={() => deletePost(item.id)}>
                        <Text style={{color: "red", fontSize: 18, margin: 5}}>Delete Post</Text>
                      </MenuOption>
                    </MenuOptions>
                  </Menu>

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
      
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  modalToggle: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f2f2f2',
    padding: 10,
    borderRadius: 10,
    alignSelf: 'center',
    
  },
  modalClose: {
    marginTop: 20,
    marginBottom: 0,
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#d5ccd9'
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
    backgroundColor: '#c5f5fc',
    padding: 10,
    marginHorizontal: 0
  },
  createdAuthor: {
    fontSize: 15,
    color: '#a1a30b',
  },
  createdTime: {
    fontSize: 15,
    marginLeft: 'auto'
  },
  body: {
    marginTop: 15,
    fontSize: 20
  },
  header: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between'
  }
});