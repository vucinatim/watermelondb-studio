import { Text, View, StyleSheet, Button } from 'react-native';
import { DebugProvider } from 'watermelondb-studio';
import { database } from './db';
import { useEffect } from 'react';

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

export default function App() {
  useEffect(() => {
    console.log('App mounted. You can now connect the DB viewer.');
  }, []);

  return (
    <DebugProvider database={database} enabled>
      <View style={styles.container}>
        <Text style={styles.text}>WatermelonDB Studio Example</Text>
        <Text style={styles.info}>(4-finger tap to open the debug menu)</Text>
        <Button title="Add a Post" onPress={addPost} />
      </View>
    </DebugProvider>
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
});
