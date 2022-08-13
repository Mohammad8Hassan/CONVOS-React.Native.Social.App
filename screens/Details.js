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
import { Entypo } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context';


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
    const tab = navigation.getParent();
    tab.setOptions({
      tabBarStyle: {display: 'none'}
    });
    
    const unsubscribe = onSnapshot(doc(db, 'Posts', id), doc => {
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

    const unsubscribe2 = onSnapshot(q, async snapShot => {
      let result = [];

      // snapShot.forEach(doc => {
      //   const empty = doc.data().timeStamp === null ? Timestamp.now() : doc.data().timeStamp;
      //   const refc = ref(storage, doc.data().authorID);
      //   const url_Temp = await getDownloadURL(refc);
      //   url_Temp == null ? defaultImg : url_Temp;

      //   result.push({id: doc.id, ...doc.data(), timeStamp: empty, uri: url_Temp});
      // })

      for (const doc of snapShot.docs) {
        const empty = doc.data().timeStamp === null ? Timestamp.now() : doc.data().timeStamp;
        const refc = ref(storage, doc.data().authorID);
        const url_Temp = await getDownloadURL(refc);
        url_Temp == null ? defaultImg : url_Temp;

        result.push({id: doc.id, ...doc.data(), timeStamp: empty, uri: url_Temp});
      }

      setAllComments(result);
    })


    return () => {
      tab.setOptions({
        tabBarStyle: {display: 'flex', backgroundColor: '#524d57'}
      });
      unsubscribe();
      unsubscribe2();
    }

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
    <SafeAreaView style={{flex:1}}>

      

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


              {/* <View style={styles.addContainer}></View> */}


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
                        <Image source={{uri: comment.uri}} style={styles.pic} />
                        <View style={styles.delete} >
                          {(getAuth().currentUser.uid == comment.authorID) && <MaterialIcons name='delete' color='grey' size={25} onPress={() => showAlert(comment.id)}/>}
                        </View>
                      </View>
                    )
                  })
                }
              </View>
              
              
                {addCommentButton && 
                  <TouchableOpacity style={styles.write} onPress={addComment}>
                    <Entypo name='new-message' color='grey' size={25} />
                    <Text style={{fontSize:20, marginLeft:5, color:'grey'}}>write</Text>
                  </TouchableOpacity>
                }
              

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 10,
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
  write: {
    flexDirection:'row',
    justifyContent:'center',
    padding:10,
    alignSelf:'center',
    borderWidth: 1,
    borderColor:'grey',
    borderStyle:'dashed',
    borderRadius:10,
    alignItems:'center',
    marginTop: 20,
    marginBottom: 50
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
  listContainer: {
    marginTop:10
  },
  listItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10
  },
  pic: {
    height: 35,
    width: 35,
    borderRadius: 60,
    marginLeft:3,
    borderColor: '#51445e',
    borderWidth:1,
    position: 'absolute'
  },
  commentView: {
    backgroundColor: 'pink',
    padding: 10,
    marginRight: 50,
    marginLeft: 20,
    borderRadius: 17,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  commentViewInner: {
    marginLeft: 15
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
  },
})