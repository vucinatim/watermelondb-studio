import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface DebugState {
  isDbServerEnabled: boolean;
  toggleDbServer: () => void;
}

export const useDebugStore = create<DebugState>()(
  persist(
    (set) => ({
      isDbServerEnabled: true, // Default to true
      toggleDbServer: () =>
        set((state) => ({ isDbServerEnabled: !state.isDbServerEnabled })),
    }),
    {
      name: 'debug-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
