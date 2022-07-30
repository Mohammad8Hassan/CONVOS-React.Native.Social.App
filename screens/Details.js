import { useEffect, useState, useRef } from 'react';
import { StyleSheet, Text, View, Button, ImageBackground, Image, KeyboardAvoidingView,
  TextInput, ScrollView, TouchableOpacity, FlatList, Alert
} from 'react-native';
import { globalStyles } from '../shared/globalStyles';
import Card from '../shared/Card';
import * as ImagePicker from 'expo-image-picker'
import { MaterialIcons } from '@expo/vector-icons';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { getFirestore, addDoc, collection, serverTimestamp, onSnapshot, query, orderBy, doc, 
  deleteDoc, Timestamp, setDoc } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'


export default function Details({ route, navigation }) {

  const { id } = route.params;
  const scrollView = useRef(null);
  const [image, setImage] = useState(null);
  const [addCommentButton, setAddCommentButton] = useState(true);
  const [commentBox, setCommentBox] = useState(false);
  const [comment, setComment] = useState('');
  const [allComments, setAllComments] = useState([]);
  const [post, setPost] = useState(null);
  const [isAvailable, setIsAvailable] = useState(true);
  
  const db = getFirestore();
  const storage = getStorage();

  useEffect(() => {
    // const imageRef = ref(storage, item.title);
    // getDownloadURL(imageRef)
    //   .then(uri => {
    //     setImage(uri);
    //   })
    //   .catch(error => {
    //     switch (error.code) {
    //       case 'storage/object-not-found':
    //         console.log(error);
    //         break;
    //       case 'storage/unauthorized':
    //         console.log(error);
    //         break;
    //       case 'storage/canceled':
    //         console.log(error);
    //         break;
    //       case 'storage/unknown':
    //         console.log(error);
    //         break;
    //     }
    //   })

    // setPost({
    //   title: 'test',
    //   body: 'test',
    //   author: 'test',
    //   authorID: 'test',
    //   authorEmail: 'test',
    //   dateCreated: 'test',
    // });

    
    onSnapshot(doc(db, 'Posts', id), doc => {
      if(doc.data()) {
        setPost(doc.data());
      
        setIsAvailable(true);
      }
      else {
        setIsAvailable(false);
      }
    })

    const colRef = collection(db, 'Posts', id, 'Comments');
    const q = query(colRef, orderBy('timeStamp'));
    onSnapshot(q, snapShot => {
      let result = [];
      snapShot.forEach(doc => {
        // console.log('before', doc.data().timeStamp);
        const empty = doc.data().timeStamp === null ? Timestamp.now() : doc.data().timeStamp;
        // console.log('after', empty);
        // console.log(doc.data());
        result.push({id: doc.id, ...doc.data(), timeStamp: empty});
      })
      setAllComments(result);
    })
  }, [])

  const showAlert = (id) => {
    Alert.alert(
      'Delete Comment?',
      'Are you sure you want to delete this comment?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: "confirm",
          onPress: () => deleteComment(id)
        }
      ],
      {
        cancelable: true
      }
    )
  }

  const addComment = () => {
    // let result = await ImagePicker.launchImageLibraryAsync({
    //   mediaTypes: ImagePicker.MediaTypeOptions.All,
    //   allowsEditing: true,
    //   aspect: [4, 3],
    //   quality: 1
    // });

    // console.log(result);

    // if(!result.cancelled) {
    //   setImage(result.uri);
    //   console.log("before ref");
    //   const refc = ref(storage, item.title)
    //   console.log("before fetch");
    //   const img = await fetch(result.uri);
    //   console.log("before blob");
    //   const bytes = await img.blob();
      
    //   console.log("before upload");
    //   await uploadBytes(refc, bytes)
    // };

    setAddCommentButton(false);
    setCommentBox(true);

    scrollView.current.scrollToEnd();
  };


  const postComment = async () => {
    setAddCommentButton(true);
    setCommentBox(false);
    scrollView.current.scrollToEnd();
    setComment('');
    
    await addDoc(collection(db, 'Posts', id, 'Comments'), {
      comment: comment,
      author: getAuth().currentUser.displayName,
      authorID: getAuth().currentUser.uid,
      timeStamp: serverTimestamp()
    })

    setDoc(doc(db, 'Users', getAuth().currentUser.uid, 'Threads', id), {
      timeStamp: serverTimestamp(),
      comment: comment
    })
  }

  const cancelComment = () => {
    setComment('');
    setAddCommentButton(true);
    setCommentBox(false);
  }

  const deleteComment = (commentId) => {
    deleteDoc(doc(db, "Posts", id, "Comments", commentId));
  }

  return (
    <KeyboardAvoidingView style={styles.container} >
      <ScrollView ref={scrollView}>
        { isAvailable == true ? (
          <>
            { post && 
            <>
              <Card>
              <View style={styles.cardContent}>
                <Text style={{color:'grey'}}>Title</Text>
                <Text style={{borderBottomColor:'#e6e6e6', borderBottomWidth:1, fontSize:18}}>{ post.title }</Text>

                <Text style={{marginTop:20, fontSize:18}}>{ post.body }</Text>

                <View style={styles.createdView}>
                  <Text style={{fontSize: 15}}>By: </Text>
                  <Text style={styles.createdAuthor}>{ post.author }</Text>
                  <Text style={styles.createdTime}>{post.dateCreated.toDate().toDateString()}</Text>
                </View>
              </View>
            </Card>

            <View>
              {addCommentButton && <MaterialIcons name='add' color='black' size={30} onPress={addComment}/>}
            </View>

            <View style={styles.addContainer}></View>


            <View style={styles.listContainer}>
              {
                allComments.map((comment) => {
                  return (
                    <View style={styles.listItem} key={comment.id}>
                      <View style={styles.commentView} >
                        <View style={styles.commentViewInner}>
                          <Text style={styles.theComment}>{comment.comment}</Text>
                          <View style={styles.commentDetails}>
                            <Text style={styles.author}>{ comment.author }</Text>
                            <Text style={styles.commentDate}>  •  {comment.timeStamp.toDate().toDateString()}</Text>
                          </View>
                        </View>
                      </View>
                      <View style={styles.delete} >
                        {(getAuth().currentUser.uid == comment.authorID) && <MaterialIcons name='delete' color='grey' size={25} onPress={() => showAlert(comment.id)}/>}
                      </View>
                    </View>
                  )
                })
              }
            </View>
            
            {
              commentBox && 
              
              <View style={styles.commentBox}>
                <TextInput
                  style={styles.comment}
                  placeholder='comment...'
                  onChangeText={(value) => setComment(value)}
                  value={comment}
                  multiline
                  textAlignVertical='top'
                />

                <View style={styles.buttonGroup}>
                  <TouchableOpacity style={styles.buttonCancel} onPress={cancelComment}>
                    <Text style={{color:'white', fontSize:15}}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.buttonPost} onPress={postComment}>
                    <Text style={{color:'white', fontSize:15}}>Post</Text>
                  </TouchableOpacity>
                </View>
              </View>
            }

            {/* <View>
              {image && <Image source={{uri: image}} style={{width: 200, height: 200}}/>}
            </View>  */}

              </>
            }
          </>
        ) : (
          <View style={styles.na}>
            <View style={styles.naHeader}>
              <MaterialIcons name='warning' color='#8b8c41' size={40}/>
              <Text style={{color:'#8b8c41', fontSize:20, marginLeft:10, fontWeight:'bold'}}>Post not available</Text>
            </View>
            <View style={styles.naBody}>
              <Text style={{fontSize:18, color:'#8b8c41'}}>The owner may have changed its privacy settings, or it has been deleted</Text>
            </View>
          </View>
        )
        } 
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10
  },
  na: {
    marginHorizontal:40,
    marginTop: 50,
    alignItems: 'center'
  },
  naHeader: {
    flexDirection: 'row',
    marginRight: 40,
    alignItems: 'center'
  },
  cardContent:{
    marginHorizontal: 18,
    marginVertical: 20,
  },
  rating:{
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: 16,
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  cat:{
    width: 30,
    height: 30,
  },
  commentBox: {
    backgroundColor: '#737373',
    height: 250,
    marginLeft: 6,
    marginRight:6,
    marginTop: 15,
    marginBottom: 20,
    padding: 10,
    borderRadius: 15,
  },
  comment: {
    backgroundColor: 'white',
    color: 'black',
    padding: 5,
    fontSize: 15,
    flex: 1,
    borderColor: '#adab1a',
    borderWidth: 2,
    elevation:25
  },
  buttonGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    marginTop: 8,
  },

  buttonPost: {
    backgroundColor: 'blue',
    padding: 10,
    width: 100,
    alignItems: 'center',
    borderRadius: 20,
    elevation: 8
  },
  buttonCancel: {
    backgroundColor: 'red',
    padding: 10,
    width: 100,
    alignItems: 'center',
    borderRadius: 20,
    elevation: 8
  },
  listItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10
  },
  commentView: {
    backgroundColor: 'pink',
    padding: 10,
    marginRight: 50,
    marginLeft: 5,
    borderRadius: 17,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  commentViewInner: {
   
  },
  delete: {
    opacity: 0.5,
    marginLeft: 'auto',
  },
  theComment: {
    fontSize: 17,
    fontFamily: 'Kanit-Light'
  },
  commentDetails: {
    flexDirection: 'row',
    marginTop: 5,
    alignItems: 'center'
  },
  author: {
    color: '#3380a3',
    fontSize: 15
  },
  commentDate: {
    color: 'grey'
  },
  addContainer: {
    borderBottomColor: '#a6a6a6',
    borderBottomWidth: 1,
    marginBottom: 20,
    marginHorizontal: 100,
    marginTop: 8
  },
  createdView: {
    flexDirection: 'row',
    marginTop: 30,
  },
  createdAuthor: {
    fontSize: 15,
    color: '#a1a333',
  },
  createdTime: {
    fontSize: 15,
    marginLeft: 'auto'
  }
})