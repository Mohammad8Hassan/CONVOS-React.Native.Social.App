import { useEffect, useState, useRef, useCallback } from 'react';
import { StyleSheet, Text, View, Button, ImageBackground, Image, KeyboardAvoidingView,
  TextInput, ScrollView, TouchableOpacity, FlatList, Alert, Pressable, Keyboard
} from 'react-native';
import { globalStyles } from '../shared/globalStyles';
import Card from '../shared/Card';
import * as ImagePicker from 'expo-image-picker'
import { MaterialIcons } from '@expo/vector-icons';
import { Foundation } from '@expo/vector-icons';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { getFirestore, addDoc, collection, serverTimestamp, onSnapshot, query, orderBy, doc, 
  deleteDoc, Timestamp, setDoc, getDoc } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { Entypo } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context';
import avatar from '../assets/Imgs/avatar.png';
import CachableImage from '../shared/CachableImage';
import RenderComment from '../shared/RenderComment';

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
  const [allParticipants, setAllParticipants] = useState(null);
  const [loadedParticipants, setLoadedParticipants] = useState(false);


  const db = getFirestore();
  const storage = getStorage();
  const defaultImg = Image.resolveAssetSource(avatar).uri;
  const user = getAuth().currentUser;

  useEffect(() => {
    const tab = navigation.getParent();
    tab.setOptions({
      tabBarStyle: {display: 'none'}
    });
    
    const showSubscription = Keyboard.addListener("keyboardDidShow", () => {
      if(scrollView != null) {
        scrollView.current.scrollToEnd({animated:true});
      }
    })

    const unsubscribe = onSnapshot(doc(db, 'Conversations', id), snapShot => {
      if(snapShot.data()) {
        getDoc(doc(db, 'Conversations', id, 'Participants', user.uid))
          .then(res => {
            if(res.exists()){
              setPost(snapShot.data());
      
              setIsAvailable(true);
            }
            else {
              setIsAvailable(false);
            }
          })
      }
      else {
        setIsAvailable(false);
      }
    })
    
    let participants = {};
    const participantsRef = collection(db, 'Conversations', id, 'Participants');
    const unsubscribe3 =  onSnapshot(participantsRef, async snapShot => {
      await Promise.all(snapShot.docs.map(async user => {
        const info = await getDoc(doc(db, 'Users', user.id));
        participants[user.id + 'name'] = info.data().Name;
        participants[user.id + 'Photo'] = info.data().Photo;
        participants[user.id + 'xt'] = info.data().photoExtension;
      }));
      setAllParticipants(participants);
      
    })

    return () => {
      tab.setOptions({
        tabBarStyle: {display: 'flex', backgroundColor: '#745f8a'}
      });
      unsubscribe();
      unsubscribe3();
      showSubscription.remove();
    }

  }, [])


  useEffect(() => {
    if(allParticipants != null) {
      loadComments();
    }
  }, [allParticipants])


  const loadComments = useCallback(() => {
    const colRef = collection(db, 'Conversations', id, 'Comments');
    const q = query(colRef, orderBy('timeStamp'));
    
    const unsubscribe2 = onSnapshot(q, async snapShot => {
      let comments = allComments;

      for (const change of snapShot.docChanges()) {
        if(change.type === 'added') {
          // const user = await getDoc(doc(db, 'Users', change.doc.data().authorID));
          const empty = change.doc.data().timeStamp === null ? Timestamp.now() : change.doc.data().timeStamp;
          // const refc = ref(storage, 'Profile Photos/' + change.doc.data().authorID);
          // let url_Temp = null;
          // try{
          //   url_Temp = await getDownloadURL(refc);
          // }
          // catch{
          //   url_Temp = defaultImg;
          // }
          // console.log(user.data().Photo);
          console.log(change.doc.data().authorID+'Photo');
          console.log(allParticipants);
          comments.push({id: change.doc.id, ...change.doc.data(), timeStamp: empty, 
            uri: allParticipants[change.doc.data().authorID+'Photo'], 
            xt: allParticipants[change.doc.data().authorID+'xt'],
            Name: allParticipants[change.doc.data().authorID+'Name']
          });
        }
      }
      // console.log('comments: ', comments);
      setAllComments(prev => {
        prev = comments;
        return [...prev];
      });
      // snapShot.docChanges().forEach(change => {
      //   if(change.type === 'added') {
      //     console.log('ddddd', change.doc.data());
      //     setAllComments(async prev => {
      //       const empty = change.doc.data().timeStamp === null ? Timestamp.now() : change.doc.data().timeStamp;
      //       const refc = ref(storage, 'Profile Photos/' + change.doc.data().authorID);
      //       let url_Temp = null;
      //       try{
      //         url_Temp = await getDownloadURL(refc);
      //       }
      //       catch{
      //         url_Temp = defaultImg;
      //       }
            
      //       prev.push({id: change.doc.id, ...change.doc.data(), timeStamp: empty, uri: url_Temp});
      //       console.log('ddddd', prev);
      //       return [...prev];
      //     })
      //   }
      // })

      // let result = [];

      // for (const doc of snapShot.docs) {
      //   const empty = doc.data().timeStamp === null ? Timestamp.now() : doc.data().timeStamp;
      //   const refc = ref(storage, 'Profile Photos/' + doc.data().authorID);
      //   let url_Temp = null;
      //   try{
      //     url_Temp = await getDownloadURL(refc);
      //   }
      //   catch{
      //     url_Temp = defaultImg;
      //   }

      //   result.push({id: doc.id, ...doc.data(), timeStamp: empty, uri: url_Temp});
      // }

      // setAllComments(result);
    })

    return () => {
      unsubscribe2();
    }
  }, [allParticipants])

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

  const scrollToEnd = () => {
    scrollView.current.scrollToEnd({animated:false});
  }

  const postComment = async () => {
    const theComment = comment;
    if(comment == '') return;

    scrollView.current.scrollToEnd();
    setComment('');
    
    await addDoc(collection(db, 'Conversations', id, 'Comments'), {
      comment: theComment,
      author: getAuth().currentUser.displayName,
      authorID: getAuth().currentUser.uid,
      timeStamp: serverTimestamp()
    })
  }

  const cancelComment = () => {
    setAddCommentButton(true);
    setCommentBox(false);
  }

  const deleteComment = (commentId) => {
    deleteDoc(doc(db, "Conversations", id, "Comments", commentId));
  }

  return (
    <SafeAreaView style={{flex:1}}>
      { isAvailable == true ? (
        <>
          { post &&
            <>
              <View style={styles.card}>
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
              </View>

              <KeyboardAvoidingView style={styles.container}  >
                <View style={{flex:1}}>
                  <ScrollView ref={scrollView} onContentSizeChange={(w, h) => {scrollView.current.scrollToEnd({animated:false})}}>
                    
                    <View style={styles.listContainer}>
                      {
                        allComments.map((comment) => {
                          return (
                            <View style={styles.listItem} key={comment.id}>
                              <View style={styles.commentView} >
                                <View style={styles.commentViewInner}>
                                  <Text style={styles.theComment} selectable>{comment.comment}</Text>
                                  <View style={styles.commentDetails}>
                                    <Text style={styles.author} selectable>{ comment.author }</Text>
                                    <Text style={styles.commentDate}>  •  {comment.timeStamp.toDate().toDateString()}</Text>
                                  </View>
                                </View>
                              </View>
                              <CachableImage source={{uri: comment.uri}} cacheKey={ comment.authorID } 
                              style={{width:35, height:35, borderRadius:60, marginLeft:3, borderColor:'#613a5f', borderWidth:1, position:'absolute'}} 
                              id={comment.authorID} xt={ comment.xt }/>
                              <View style={styles.delete} >
                                {(getAuth().currentUser.uid == comment.authorID) && <MaterialIcons name='delete' color='grey' size={25} onPress={() => showAlert(comment.id)}/>}
                              </View>
                              {/* <RenderComment comment={comment} userID={getAuth().currentUser.uid} alert={showAlert} /> */}
                            </View>
                          )
                        })
                      }
                    </View>
                    
                  </ScrollView>
                  <View style={styles.commentBox}>
                    <TextInput
                      style={styles.comment}
                      placeholder='comment...'
                      onChangeText={(value) => setComment(value)}
                      value={comment}
                      multiline
                    />

                    <View style={styles.buttonGroup}>
                      <Pressable
                        onPress={postComment}
                        style={({ pressed }) => [
                          {opacity: pressed ? 0.5: 1}, styles.buttonPost,
                        ]}
                      >
                        <View style={{backgroundColor:'#613a5f', borderRadius:20, padding:6, paddingLeft:8}}>
                          <MaterialIcons name='arrow-forward-ios' size={25} color='white' />
                        </View>
                      </Pressable>
                    </View>
                  </View>
                </View>
              </KeyboardAvoidingView>
            </>
          }
        </>
        ) : (
          <View style={styles.na}>
            <View style={styles.naHeader}>
              <MaterialIcons name='warning' color='#8b8c41' size={40}/>
              <Text style={{color:'#8b8c41', fontSize:20, marginLeft:10, fontWeight:'bold'}}>Conversation not available</Text>
            </View>
            <View style={styles.naBody}>
              <Text style={{fontSize:18, color:'#8b8c41'}}>The owner may have removed you, or it has been deleted</Text>
            </View>
          </View>
        )
      }
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 5,
    backgroundColor:'white'
  },
  card:{
    backgroundColor:'#fff',
    elevation: 15
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
    margin:10,
    padding:10,
    borderRadius:10
  },
  commentBox: {
    // backgroundColor: '#613a5f',
    paddingVertical:3,
    flexDirection:'row'
  },
  comment: {
    backgroundColor: 'white',
    color: 'black',
    padding: 7,
    paddingLeft: 15,
    flex:4,
    fontSize: 18,
    borderColor: '#613a5f',
    borderWidth: 1,
    alignSelf:'flex-end',
    borderRadius:20
  },
  buttonGroup: {
    flexDirection: 'row',
    flex:1
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
    flex:1,
    justifyContent:'center',
    alignItems:'center',
    // borderColor: '#adab1a',
    // borderWidth: 2,
  },
  buttonCancel: {
    backgroundColor: '#E374A0',
    padding: 10,
    justifyContent:'center',
    alignItems:'center',
  },
  listContainer: {
    marginTop:10,
  },
  listItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  pic: {
    height: 35,
    width: 35,
    borderRadius: 60,
    marginLeft:3,
    borderColor: '#613a5f',
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
    alignItems: 'center',
    // borderColor:'#745f8a',
    // borderWidth:1
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