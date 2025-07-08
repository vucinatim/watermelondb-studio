import { jest } from '@jest/globals';

jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter');

jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');

  RN.NativeModules.TcpSocketModule = {
    createSocket: jest.fn(),
    listen: jest.fn(),
    connect: jest.fn(),
    write: jest.fn(),
    end: jest.fn(),
    destroy: jest.fn(),
    close: jest.fn(),
  };

  return RN;
});
