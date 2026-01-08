
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

export interface SRSTaskProgress {
  level: number; // 0-5
  lastCompleted: string; // ISO Date
  nextReview: string; // ISO Date
}

export interface UserSettings {
  rmsThreshold: number;
  pitchTolerance: number;
  stabilityMs: number;
  timeLimit: number;
  strictOctave: boolean;
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
  beginnerMode: boolean;
  srsEnabled: boolean;
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
  wasBeginnerMode?: boolean;
}

const DEFAULT_SETTINGS: UserSettings = {
  rmsThreshold: 0.01,
  pitchTolerance: 30,
  stabilityMs: 30,
  timeLimit: 5,
  strictOctave: false,
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
  beginnerMode: true,
  srsEnabled: false,
  metronomeEnabled: false,
  metronomeBpm: 100,
  metronomeVolume: 0.5,
  metronomeSound: 'tick',
  metronomeBeatsPerMeasure: 4,
};

const SRS_INTERVALS_DAYS = [0, 1, 3, 7, 14, 30];

interface AppState {
  settings: UserSettings;
  history: SessionResult[];
  mastery: Record<string, FretboardItemStats>; // Key: s{string}f{fret}
  srsProgress: Record<string, SRSTaskProgress>; // Key: {programId}-day{day}
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
      srsProgress: {},
      activeProgramId: 'fretboard',
      updateSettings: (newSettings) => set((state) => ({ 
        settings: { ...state.settings, ...newSettings } 
      })),
      addSessionResult: (result) => set((state) => {
        const srsKey = `${result.programId}-day${result.day}`;
        const currentSrs = state.srsProgress[srsKey] || { level: 0, lastCompleted: '', nextReview: '' };
        
        let newLevel = currentSrs.level;
        if (result.accuracy >= state.settings.minUnlockAccuracy) {
          newLevel = Math.min(5, currentSrs.level + 1);
        } else {
          newLevel = Math.max(0, currentSrs.level - 1);
        }

        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + SRS_INTERVALS_DAYS[newLevel]);

        return {
          history: [...state.history, result],
          srsProgress: {
            ...state.srsProgress,
            [srsKey]: {
              level: newLevel,
              lastCompleted: result.date,
              nextReview: nextDate.toISOString()
            }
          }
        };
      }),
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
        srsProgress: newState.srsProgress || {},
        activeProgramId: newState.activeProgramId || 'fretboard',
      })),
      resetStore: () => set(() => ({
        settings: DEFAULT_SETTINGS,
        history: [],
        mastery: {},
        srsProgress: {},
        activeProgramId: 'fretboard',
        isMicEnabled: false,
      })),
    }),
    {
      name: 'bass-arena-storage-v3',
      partialize: (state) => ({
        settings: state.settings,
        history: state.history,
        mastery: state.mastery,
        srsProgress: state.srsProgress,
        activeProgramId: state.activeProgramId,
      }),
    }
  )
);
