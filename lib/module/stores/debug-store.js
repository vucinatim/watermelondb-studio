"use strict";

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
export const useDebugStore = create()(persist(set => ({
  isDbServerEnabled: true,
  // Default to true
  toggleDbServer: () => set(state => ({
    isDbServerEnabled: !state.isDbServerEnabled
  }))
}), {
  name: 'debug-storage',
  storage: createJSONStorage(() => AsyncStorage)
}));
//# sourceMappingURL=debug-store.js.map