import { Database } from '@nozbe/watermelondb';
import { DbServerManager } from '../db-server';

jest.useFakeTimers();

jest.mock('react-native-tcp-socket', () => {
  const actualTcpSocket = jest.requireActual('react-native-tcp-socket');
  const { EventEmitter } = require('events');

  class MockServer extends EventEmitter {
    listen = jest.fn((options: { port: number }, callback: () => void) => {
      // Simulate EADDRINUSE on the first port
      if (options.port === 12345) {
        setTimeout(() => {
          const error = new Error(
            'bind failed: EADDRINUSE (Address already in use)'
          );
          (error as any).code = 'EADDRINUSE';
          this.emit('error', error);
        }, 10);
      } else {
        // Succeed on the next port
        setTimeout(() => {
          callback();
        }, 10);
      }
    });

    close = jest.fn((callback) => {
      setTimeout(() => {
        if (callback) callback();
        this.emit('close');
      }, 10);
    });

    removeAllListeners = jest.fn();
  }

  return {
    ...actualTcpSocket,
    createServer: jest.fn(() => new MockServer()),
  };
});

jest.mock('expo-network', () => ({
  getIpAddressAsync: jest.fn().mockResolvedValue('192.168.1.100'),
}));

jest.mock('expo-device', () => ({
  modelName: 'Jest Test Runner',
}));

const mockDb = {
  schema: { tables: { posts: { columns: { last_modified: {} } } } },
  collections: {
    get: () => ({
      query: () => ({
        fetch: () => Promise.resolve([]),
      }),
    }),
  },
  withChangesForTables: () => ({
    subscribe: () => ({ unsubscribe: () => {} }),
  }),
} as unknown as Database;

describe('DbServerManager EADDRINUSE handling', () => {
  it('should retry on the next port when EADDRINUSE is encountered', async () => {
    const serverManager = new DbServerManager(mockDb);

    let finalStatus = '';
    const statusPromise = new Promise<void>((resolve) => {
      serverManager.subscribe((status) => {
        finalStatus = status;
        if (status === 'running' || status === 'error') {
          resolve();
        }
      });
    });

    serverManager.start();
    await jest.runAllTimersAsync();
    await statusPromise;

    expect(finalStatus).toBe('running');

    const connectionInfo = serverManager.getConnectionInfo();
    expect(connectionInfo?.port).toBe(12346);
  }, 10000);
});
