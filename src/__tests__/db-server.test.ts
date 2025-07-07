import {
  jest,
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
} from '@jest/globals';
import type { ServerStatus } from '../db-server';
import { DbServerManager } from '../db-server';
import type { Database } from '@nozbe/watermelondb';
import TcpSocket from 'react-native-tcp-socket';
import * as Network from 'expo-network';

// Mock all external dependencies
jest.mock('@nozbe/watermelondb', () => ({
  Database: jest.fn(),
  Q: {
    where: jest.fn(),
    gt: jest.fn(),
  },
}));
jest.mock('expo-device', () => ({
  modelName: 'Test Mock Device',
}));
jest.mock('expo-network', () => ({
  getIpAddressAsync: jest.fn(),
}));
jest.mock('react-native-tcp-socket', () => ({
  createServer: jest.fn(),
}));
jest.mock('../utils/execute-sql');
jest.mock('react-native', () => ({
  Platform: { OS: 'test-os' },
}));

const mockedTcpSocket = jest.mocked(TcpSocket);
const mockedNetwork = jest.mocked(Network);

// Mock a minimal DB that the server can interact with
const mockDatabase = {
  schema: {
    tables: {
      posts: {
        name: 'posts',
        columns: [
          { name: 'title', type: 'string' },
          { name: 'last_modified', type: 'number' },
        ],
      },
    },
  },
  collections: {
    get: jest.fn().mockReturnValue({}),
  },
  withChangesForTables: jest.fn(() => ({
    subscribe: jest.fn(() => ({
      unsubscribe: jest.fn(),
    })),
  })),
} as unknown as Database;

describe('DbServerManager', () => {
  let dbServerManager: DbServerManager;

  beforeEach(() => {
    jest.useFakeTimers();
    mockedNetwork.getIpAddressAsync.mockResolvedValue('192.168.1.100');
    dbServerManager = new DbServerManager(mockDatabase);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('should try the next port when EADDRINUSE error occurs', async () => {
    // Arrange
    const mockServer1 = {
      on: jest.fn((event: string, callback: (arg: any) => void) => {
        if (event === 'error') {
          callback({ code: 'EADDRINUSE' });
        }
      }),
      listen: jest.fn(),
      close: jest.fn((callback?: () => void) => callback?.()),
      removeAllListeners: jest.fn(),
    };

    const mockServer2 = {
      on: jest.fn(),
      listen: jest.fn((_: any, callback?: () => void) => {
        callback?.(); // Immediately simulate successful listen
      }),
      close: jest.fn((callback?: () => void) => callback?.()),
      removeAllListeners: jest.fn(),
    };

    mockedTcpSocket.createServer
      .mockReturnValueOnce(mockServer1 as any)
      .mockReturnValueOnce(mockServer2 as any);

    const statusUpdates: ServerStatus[] = [];
    dbServerManager.subscribe((status) => {
      statusUpdates.push(status);
    });

    // Act
    const startPromise = dbServerManager.start();
    // Let the first setTimeout in `start()` run
    jest.runAllTimers();
    await startPromise;
    // Let the setTimeout in the `EADDRINUSE` error handler run
    jest.runAllTimers();

    // Assert
    const BASE_PORT = 12345;
    expect(mockedTcpSocket.createServer).toHaveBeenCalledTimes(2);

    // Check that it tried to listen on the first port
    expect(mockServer1.listen).toHaveBeenCalledWith(
      expect.objectContaining({ port: BASE_PORT }),
      expect.any(Function)
    );

    // Check that it gracefully closed the first server and tried the second port
    expect(mockServer1.close).toHaveBeenCalledTimes(1);
    expect(mockServer2.listen).toHaveBeenCalledWith(
      expect.objectContaining({ port: BASE_PORT + 1 }),
      expect.any(Function)
    );

    // Check the final state
    expect(dbServerManager.status).toBe('running');
    expect(dbServerManager.getConnectionInfo()?.port).toBe(BASE_PORT + 1);

    // Check the sequence of status updates
    expect(statusUpdates).toEqual(['stopped', 'starting', 'running']);
  });
});
