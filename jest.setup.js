import { jest } from '@jest/globals';
import { NativeModules } from 'react-native';

// Mock the missing native module that WatermelonDB expects.
NativeModules.WMDatabaseBridge = {
  getRandomIds: jest.fn(() => Promise.resolve('mock_id_1,mock_id_2')),
};
