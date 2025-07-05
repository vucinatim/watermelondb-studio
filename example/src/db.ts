import { appSchema, tableSchema } from '@nozbe/watermelondb';
import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';

const schema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'posts',
      columns: [
        { name: 'title', type: 'string' },
        { name: 'body', type: 'string', isOptional: true },
        { name: 'is_pinned', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
  ],
});

const adapter = new SQLiteAdapter({
  schema,
  // (You might want to comment it out for development purposes -- see CONTRIBUTION.md)
  // jsi: Platform.OS === 'ios',
  jsi: false,
  // (optional database name or file system path)
  // dbName: 'myapp',
  // (recommended option, should work flawlessly out of the box on iOS. On Android,
  // additional installation steps have to be taken - disable if you run into issues...)
  // onSetUpError: error => {
  //   // Database failed to load -- offer the user to reload the app or log out
  // }
});

export const database = new Database({
  adapter,
  modelClasses: [],
});
