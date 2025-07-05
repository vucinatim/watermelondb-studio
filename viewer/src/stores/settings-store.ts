import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  manualIp: string | null;
  setManualIp: (ip: string | null) => void;
  clearManualIp: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      manualIp: null,
      setManualIp: (ip) => set({ manualIp: ip }),
      clearManualIp: () => set({ manualIp: null }),
    }),
    {
      name: 'settings-storage',
    },
  ),
);
