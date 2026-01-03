
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AppLanguage = 'en' | 'fr' | 'es';

export interface UserSettings {
  rmsThreshold: number;
  pitchTolerance: number;
  stabilityMs: number;
  timeLimit: number;
  strictOctave: boolean;
  showFretNumber: boolean;
  lockString: boolean;
  selectedMicId: string;
  minUnlockAccuracy: number;
  isFiveString: boolean;
  allowMultipleAttempts: boolean;
  themeMode: 'light' | 'dark';
  noteNaming: 'english' | 'latin';
  language: AppLanguage;
  primaryColor: string;
}

export interface SessionResult {
  date: string;
  score: number;
  accuracy: number;
  avgTime: number;
  day?: number;
  programId: string;
}

interface AppState {
  settings: UserSettings;
  history: SessionResult[];
  activeProgramId: string;
  updateSettings: (newSettings: Partial<UserSettings>) => void;
  addSessionResult: (result: SessionResult) => void;
  setActiveProgramId: (id: string) => void;
  isMicEnabled: boolean;
  setMicEnabled: (enabled: boolean) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      settings: {
        rmsThreshold: 0.01, // Changed from 0.05 to 0.010
        pitchTolerance: 30,
        stabilityMs: 30,
        timeLimit: 5,
        strictOctave: false,
        showFretNumber: true,
        lockString: true,
        selectedMicId: '',
        minUnlockAccuracy: 80,
        isFiveString: false,
        allowMultipleAttempts: false,
        themeMode: 'dark',
        noteNaming: 'english',
        language: 'en',
        primaryColor: '#2196f3',
      },
      history: [],
      activeProgramId: 'fretboard',
      updateSettings: (newSettings) => set((state) => ({ 
        settings: { ...state.settings, ...newSettings } 
      })),
      addSessionResult: (result) => set((state) => ({ 
        history: [...state.history, result] 
      })),
      setActiveProgramId: (id) => set({ activeProgramId: id }),
      isMicEnabled: false,
      setMicEnabled: (enabled) => set({ isMicEnabled: enabled }),
    }),
    {
      name: 'bass-arena-storage-v1',
      partialize: (state) => ({
        settings: state.settings,
        history: state.history,
        activeProgramId: state.activeProgramId,
      }),
    }
  )
);
