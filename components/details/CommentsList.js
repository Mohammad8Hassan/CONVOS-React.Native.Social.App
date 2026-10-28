import { StyleSheet, View, ScrollView, ActivityIndicator } from 'react-native';
import RenderComment from '../../shared/RenderComment';
import RenderOthersComment from '../../shared/RenderOthersComment';
import SystemMessage from '../../shared/SystemMessage';

export default function CommentsList({
  comments, loading, participants, userID, onDeleteComment, scrollRef, onScroll, onLayout, onContentSizeChange,
}) {
  if(loading)
    return <ActivityIndicator size={80} color='#d4c86e' animating={loading} style={{flex:1}} />;

  const isRemoved = (comment) => {
    const rem = participants ? participants[comment.authorID + 'REM'] : undefined;
    return rem === undefined ? comment.removed : rem;
  }

  const withAuthor = (comment) => {
    if(!participants) return comment;
    const name = participants[comment.authorID + 'Name'];
    const photo = participants[comment.authorID + 'Photo'];
    return {...comment, Name: name || comment.Name, uri: photo || comment.uri};
  }

  return (
    <ScrollView ref={scrollRef} onScroll={onScroll} onLayout={onLayout} onContentSizeChange={onContentSizeChange}>
      <View style={styles.listContainer}>
        {comments.map(comment => (
          <View style={styles.listItem} key={comment.id}>
            {comment.system ? (
              <SystemMessage comment={withAuthor(comment)} />
            ) : comment.authorID == userID ? (
              <RenderComment comment={withAuthor(comment)} userID={userID} alert={onDeleteComment} />
            ) : (
              <RenderOthersComment comment={{...withAuthor(comment), removed: isRemoved(comment)}} userID={userID} alert={onDeleteComment} />
            )}
          </View>
        ))}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  listContainer: {
    marginTop:14,
    paddingBottom: 6,
  },
  listItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
});
