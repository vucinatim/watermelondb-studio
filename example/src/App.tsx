import { Text, View, StyleSheet, Button, FlatList } from 'react-native';
import { DebugProvider } from 'watermelondb-studio';
import { database, Post } from './db';
import { useEffect } from 'react';
import { withObservables } from '@nozbe/watermelondb/react';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

// A simple function to add a new post
const addPost = async () => {
  await database.write(async () => {
    await database.collections.get('posts').create((post: any) => {
      post.title = `New Post ${Date.now()}`;
      post.is_pinned = false;
    });
  });
  console.log('New post created');
};

const PostItem = ({ post }: { post: Post }) => (
  <View style={styles.post}>
    <Text>{post.title}</Text>
  </View>
);

const PostsList = withObservables([], () => ({
  posts: database.collections.get<Post>('posts').query().observe(),
}))(({ posts }: { posts: Post[] }) => (
  <FlatList
    data={posts}
    renderItem={({ item }) => <PostItem post={item} />}
    keyExtractor={(item) => item.id}
    style={styles.list}
  />
));

export default function App() {
  useEffect(() => {
    console.log('App mounted. You can now connect the DB viewer.');
  }, []);

  return (
    <SafeAreaProvider>
      <DebugProvider database={database} enabled>
        <SafeAreaView style={styles.container}>
          <Text style={styles.text}>WatermelonDB Studio Example</Text>
          <Text style={styles.info}>(4-finger tap to open the debug menu)</Text>
          <Button title="Add a Post" onPress={addPost} />
          <PostsList />
        </SafeAreaView>
      </DebugProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  info: {
    fontSize: 14,
    color: 'gray',
  },
  list: {
    marginTop: 16,
    alignSelf: 'stretch',
    marginHorizontal: 16,
  },
  post: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
});
