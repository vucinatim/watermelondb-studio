import { Database } from '@nozbe/watermelondb';
import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { executeSql } from '../utils/execute-sql';

// Mock schema and model for testing purposes
const testSchema = {
  version: 1,
  tables: {
    posts: {
      name: 'posts',
      columns: [
        { name: 'title', type: 'string' },
        { name: 'content', type: 'string' },
        { name: 'is_pinned', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'last_modified', type: 'number' },
      ],
    },
  },
};

// Mock WatermelonDB adapter and database
const mockAdapter = {
  schema: testSchema,
  underlyingAdapter: {
    _dispatcher: {
      _db: {
        queryAsArray: jest.fn(),
      },
    },
  },
  unsafeExecute: jest.fn(),
};

const mockDatabase = {
  adapter: mockAdapter,
  schema: testSchema,
  collections: {
    get: jest.fn().mockReturnThis(),
    _cache: {
      recordsFromQueryResult: jest.fn(),
    },
  },
  write: jest.fn(async (fn: () => Promise<void>) => await fn()),
} as unknown as Database;

// Mock the internal WatermelonDB modules that are require()'d
jest.mock('@nozbe/watermelondb/src/adapters/common', () => ({
  sanitizeQueryResult: (result: any) => result,
}));

jest.mock(
  '@nozbe/watermelondb/src/adapters/sqlite/makeDispatcher/decodeQueryResult',
  () => ({
    default: (result: any) => result,
  })
);

describe('executeSql', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should execute a SELECT * query and return all columns and rows', async () => {
    // Arrange
    const mockPosts = [
      { id: '1', title: 'Post 1', content: 'Content 1' },
      { id: '2', title: 'Post 2', content: 'Content 2' },
    ];

    (
      mockAdapter.underlyingAdapter._dispatcher._db.queryAsArray as jest.Mock
    ).mockReturnValue(mockPosts);
    (
      mockDatabase.collections.get('posts' as any)._cache
        .recordsFromQueryResult as jest.Mock
    ).mockReturnValue(mockPosts.map((p) => ({ _raw: p })));

    const sql = 'SELECT * FROM posts;';

    // Act
    const result = await executeSql(mockDatabase, sql);

    // Assert
    expect(
      mockAdapter.underlyingAdapter._dispatcher._db.queryAsArray
    ).toHaveBeenCalledWith('posts', 'SELECT * FROM posts', []);
    expect(result.columns).toEqual(['id', 'title', 'content']);
    expect(result.rows).toEqual(mockPosts);
  });
});
