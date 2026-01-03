
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserSettings {
  rmsThreshold: number;
  pitchTolerance: number;
  stabilityMs: number;
  timeLimit: number;
  strictOctave: boolean;
  showFretNumber: boolean;
  lockString: boolean;
  selectedMicId: string;
}

export interface SessionResult {
  date: string;
  score: number;
  accuracy: number;
  avgTime: number;
  day?: number;
}

interface AppState {
  settings: UserSettings;
  history: SessionResult[];
  updateSettings: (newSettings: Partial<UserSettings>) => void;
  addSessionResult: (result: SessionResult) => void;
  isMicEnabled: boolean;
  setMicEnabled: (enabled: boolean) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      settings: {
        rmsThreshold: 0.01, // Changed from 0.05 to 0.010
        pitchTolerance: 30,
        stabilityMs: 200,
        timeLimit: 5,
        strictOctave: false,
        showFretNumber: true,
        lockString: true,
        selectedMicId: '',
      },
      history: [],
      isMicEnabled: false,
      updateSettings: (newSettings) => set((state) => ({ 
        settings: { ...state.settings, ...newSettings } 
      })),
      addSessionResult: (result) => set((state) => ({ 
        history: [...state.history, result] 
      })),
      setMicEnabled: (enabled) => set({ isMicEnabled: enabled }),
    }),
    {
      name: 'bass-master-storage',
    }
  )
);
