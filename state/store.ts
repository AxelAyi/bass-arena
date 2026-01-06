import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AppLanguage = 'en' | 'fr' | 'es';
export type MetronomeSound = 'beep' | 'tick' | 'wood';

export interface FretboardItemStats {
  attempts: number;
  corrects: number;
  totalTime: number;
  lastAttempt: number;
}

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
  unlockAllExercises: boolean;
  themeMode: 'light' | 'dark';
  noteNaming: 'english' | 'latin';
  language: AppLanguage;
  primaryColor: string;
  hasSeenWelcome: boolean;
  // Metronome Settings
  metronomeEnabled: boolean;
  metronomeBpm: number;
  metronomeVolume: number;
  metronomeSound: MetronomeSound;
  metronomeBeatsPerMeasure: number;
}

export interface SessionResult {
  date: string;
  score: number;
  accuracy: number;
  avgTime: number;
  day?: number;
  programId: string;
}

const DEFAULT_SETTINGS: UserSettings = {
  rmsThreshold: 0.01,
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
  unlockAllExercises: false,
  themeMode: 'dark',
  noteNaming: 'english',
  language: 'en',
  primaryColor: '#2196f3',
  hasSeenWelcome: false,
  metronomeEnabled: false,
  metronomeBpm: 100,
  metronomeVolume: 0.5,
  metronomeSound: 'tick',
  metronomeBeatsPerMeasure: 4,
};

interface AppState {
  settings: UserSettings;
  history: SessionResult[];
  mastery: Record<string, FretboardItemStats>; // Key: s{string}f{fret}
  activeProgramId: string;
  updateSettings: (newSettings: Partial<UserSettings>) => void;
  addSessionResult: (result: SessionResult) => void;
  recordAttempt: (stringIdx: number, fret: number, correct: boolean, time: number) => void;
  setActiveProgramId: (id: string) => void;
  isMicEnabled: boolean;
  setMicEnabled: (enabled: boolean) => void;
  importState: (newState: any) => void;
  resetStore: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,
      history: [],
      mastery: {},
      activeProgramId: 'fretboard',
      updateSettings: (newSettings) => set((state) => ({ 
        settings: { ...state.settings, ...newSettings } 
      })),
      addSessionResult: (result) => set((state) => ({ 
        history: [...state.history, result] 
      })),
      recordAttempt: (s, f, correct, time) => set((state) => {
        const key = `s${s}f${f}`;
        const current = state.mastery[key] || { attempts: 0, corrects: 0, totalTime: 0, lastAttempt: 0 };
        return {
          mastery: {
            ...state.mastery,
            [key]: {
              attempts: current.attempts + 1,
              corrects: current.corrects + (correct ? 1 : 0),
              totalTime: current.totalTime + time,
              lastAttempt: Date.now()
            }
          }
        };
      }),
      setActiveProgramId: (id) => set({ activeProgramId: id }),
      isMicEnabled: false,
      setMicEnabled: (enabled) => set({ isMicEnabled: enabled }),
      importState: (newState) => set(() => ({
        settings: { ...DEFAULT_SETTINGS, ...newState.settings },
        history: newState.history || [],
        mastery: newState.mastery || {},
        activeProgramId: newState.activeProgramId || 'fretboard',
      })),
      resetStore: () => set(() => ({
        settings: DEFAULT_SETTINGS,
        history: [],
        mastery: {},
        activeProgramId: 'fretboard',
        isMicEnabled: false,
      })),
    }),
    {
      name: 'bass-arena-storage-v2',
      partialize: (state) => ({
        settings: state.settings,
        history: state.history,
        mastery: state.mastery,
        activeProgramId: state.activeProgramId,
      }),
    }
  )
);