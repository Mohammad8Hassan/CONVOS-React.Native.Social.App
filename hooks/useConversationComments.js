import { useCallback, useEffect, useRef, useState } from 'react';
import { getFirestore, collection, onSnapshot, query, orderBy, Timestamp } from 'firebase/firestore';

export default function useConversationComments({ id, allParticipants }) {
  const db = getFirestore();

  const [allComments, setAllComments] = useState([]);
  const [commentsIndicator, setCommentsIndicator] = useState(true);
  const [unreadMessages, setUnreadMessages] = useState(0);

  const scrollView = useRef(null);
  const scrollAfter = useRef(true);              // true while the user is near the bottom
  const commentsFlag = useRef('first render');   // becomes 'rendered' after the first content layout
  const unsubscribe = useRef();
  const participantsRef = useRef(allParticipants);
  participantsRef.current = allParticipants;

  const participantsReady = allParticipants != null;

  useEffect(() => {
    if(!participantsReady || unsubscribe.current) return;

    let active = true;
    const comments = [];

    const q = query(collection(db, 'Conversations', id, 'Comments'), orderBy('timeStamp'));

    unsubscribe.current = onSnapshot(q, async snapShot => {
      const participants = participantsRef.current;

      for (const change of snapShot.docChanges()) {
        if(change.type === 'added') {
          const c = change.doc.data();
          const empty = c.timeStamp === null ? Timestamp.now() : c.timeStamp;

          comments.push({id: change.doc.id, ...c, timeStamp: empty,
            uri: participants[c.authorID+'Photo']==undefined ? c.uri2 : participants[c.authorID+'Photo'],
            Name: participants[c.authorID+'Name']==undefined ? c.Name2 : participants[c.authorID+'Name'],
            removed: participants[c.authorID+'REM']==undefined ? c.removed2 : participants[c.authorID+'REM'],
            system: c.system == undefined ? false : c.system,
          });
        }
        else if(change.type === 'removed') {
          const index = comments.map(e => e.id).indexOf(change.doc.id);
          if(index != -1) comments.splice(index,1);
        }
      }

      if(!active) return;

      setAllComments([...comments]);

      if(scrollView.current && scrollAfter.current) {
        scrollView.current.scrollToEnd();
      } else {
        if(commentsFlag.current != 'first render')
          setUnreadMessages(prev => {return prev+1})
      }
      setCommentsIndicator(false);
    }, error => {console.log(error)})

    return () => {
      active = false;
      if(unsubscribe.current) {
        unsubscribe.current();
        unsubscribe.current = undefined;
      }
    }
  }, [participantsReady])

  const scrollNow = useCallback(() => {
    if(scrollView.current){
      scrollView.current.scrollToEnd();
      setUnreadMessages(0);
    }
  }, [])

  // ScrollView.onScroll
  const onScroll = ({nativeEvent}) => {
    const {layoutMeasurement, contentOffset, contentSize} = nativeEvent;
    const paddingToBottom = 50;

    if(layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom) {
      setUnreadMessages(0);
      scrollAfter.current = true;
    }
    else {
      scrollAfter.current = false;
    }
  }

  // ScrollView.onLayout
  const onLayout = () => {
    if(commentsFlag.current != 'first render' && scrollAfter.current && scrollView.current)
      scrollView.current.scrollToEnd({ animated: false });
  }

  // ScrollView.onContentSizeChange
  const onContentSizeChange = () => {
    if(commentsFlag.current == 'first render') {
      scrollNow();
      commentsFlag.current = 'rendered';
    }
  }

  return { allComments, commentsIndicator, unreadMessages, scrollView, scrollNow, onScroll, onLayout, onContentSizeChange };
}
