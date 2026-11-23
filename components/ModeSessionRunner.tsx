import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Container,
  Paper,
  Stack,
  IconButton,
  Chip,
  Slider,
  LinearProgress,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
  CircularProgress,
  Tooltip,
  Collapse,
  Divider,
  Fade,
  useTheme,
  alpha,
  keyframes,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import GraphicEqIcon from '@mui/icons-material/GraphicEq';
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';
import FlagIcon from '@mui/icons-material/Flag';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import SchoolIcon from '@mui/icons-material/School';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import PianoIcon from '@mui/icons-material/Piano';
import QueueMusicIcon from '@mui/icons-material/QueueMusic';
import ViewModuleIcon from '@mui/icons-material/ViewModule';

import { useStore } from '../state/store';
import { AudioEngine, AudioStats } from '../audio/audioEngine';
import { ModeBackingEngine, BackingBeatEvent } from '../audio/modeBackingEngine';
import {
  MODE_DEFINITIONS,
  ModeTaskConfig,
  ModeChordStep,
} from '../data/modesProgram';
import { BASS_STRINGS, NOTE_NAMES } from '../data/fretboard';
import {
  translateNoteName,
  translateTextWithNotes,
  validateNote,
  getBassPositionsForSequence,
  BassTabPosition,
} from '../audio/noteUtils';
import { translations } from '../localization/translations';
import NoteDisplay from './NoteDisplay';
import VuMeter from './VuMeter';
import SheetMusic from './SheetMusic';
import ScoreSummary from './ScoreSummary';

const targetPulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(33, 150, 243, 0.7); transform: translate(-50%, -50%) scale(1); }
  50% { box-shadow: 0 0 0 10px rgba(33, 150, 243, 0); transform: translate(-50%, -50%) scale(1.18); }
  100% { box-shadow: 0 0 0 0 rgba(33, 150, 243, 0); transform: translate(-50%, -50%) scale(1); }
`;

const colorGlow = keyframes`
  0% { box-shadow: 0 0 6px rgba(255, 179, 0, 0.45); }
  50% { box-shadow: 0 0 16px rgba(255, 179, 0, 0.9); }
  100% { box-shadow: 0 0 6px rgba(255, 179, 0, 0.45); }
`;

export interface ModeSessionRunnerProps {
  day: number;
  title: string;
  description: string;
  modeConfig: ModeTaskConfig;
  sequence?: number[];
  programId: string;
  onFinish: () => void;
  onReplay?: () => void;
  onNext?: { label: string; action: () => void };
}

type NoteRole = 'root' | 'color' | 'chord' | 'scale' | 'outside';

interface AnalyzedNote {
  midi: number;
  noteName: string;
  interval: number;
  degree: string;
  role: NoteRole;
}

const CHROMATIC_DEGREES = ['1', 'b2', '2', 'b3', '3', '4', 'b5', '5', 'b6', '6', 'b7', '7'];

function analyzeMidiInStep(midi: number, step: ModeChordStep): AnalyzedNote {
  const mode = MODE_DEFINITIONS[step.modeId];
  const interval = ((midi - step.rootMidi) % 12 + 12) % 12;
  const noteName = NOTE_NAMES[midi % 12];
  const scaleIdx = mode.intervals.indexOf(interval);

  if (scaleIdx === -1) {
    return {
      midi,
      noteName,
      interval,
      degree: CHROMATIC_DEGREES[interval],
      role: 'outside',
    };
  }

  const degree = mode.degreeLabels[scaleIdx];
  let role: NoteRole = 'scale';
  if (interval === 0) role = 'root';
  else if (interval === mode.colorInterval) role = 'color';
  else if (mode.chordTones.includes(interval)) role = 'chord';

  return { midi, noteName, interval, degree, role };
}

interface ModalFretboardProps {
  step: ModeChordStep;
  isFiveString: boolean;
  noteNaming: 'english' | 'latin';
  labelMode: 'degrees' | 'notes';
  targetMidi?: number | null;
  targetPosition?: BassTabPosition | null;
  detectedMidi?: number | null;
}

const ModalFretboard: React.FC<ModalFretboardProps> = ({
  step,
  isFiveString,
  noteNaming,
  labelMode,
  targetMidi,
  targetPosition,
  detectedMidi,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const strings = isFiveString ? [0, 1, 2, 3, 4] : [0, 1, 2, 3];
  const maxFret = 12;
  const fretCount = maxFret;
  const fretWidth = 64;
  const openColWidth = 44;
  const stringSpacing = 26;
  const topOffset = 20;
  const totalWidth = openColWidth + fretCount * fretWidth;
  const boardHeight = (strings.length - 1) * stringSpacing;
  const inlayFrets = [3, 5, 7, 9, 12];
  const amber = '#ffb300';

  const getRoleColors = (role: NoteRole) => {
    switch (role) {
      case 'root':
        return {
          bg: theme.palette.primary.main,
          fg: theme.palette.primary.contrastText,
          border: theme.palette.primary.main,
        };
      case 'color':
        return {
          bg: amber,
          fg: '#111111',
          border: amber,
        };
      case 'chord':
        return {
          bg: theme.palette.success.main,
          fg: '#ffffff',
          border: theme.palette.success.main,
        };
      case 'scale':
        return {
          bg: isDark ? '#1e2430' : '#ffffff',
          fg: isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.8)',
          border: isDark ? 'rgba(255,255,255,0.32)' : 'rgba(0,0,0,0.28)',
        };
      default:
        return { bg: 'transparent', fg: 'transparent', border: 'transparent' };
    }
  };

  return (
    <Box
      sx={{
        width: '100%',
        overflowX: 'auto',
        py: 0.5,
        px: 0.5,
        '&::-webkit-scrollbar': { height: 6 },
        '&::-webkit-scrollbar-thumb': { bgcolor: 'divider', borderRadius: 3 },
      }}
    >
      <Box
        sx={{
          position: 'relative',
          width: totalWidth + 24,
          height: boardHeight + topOffset + 22,
          mx: 'auto',
        }}
      >
        {/* Fret Numbers */}
        {Array.from({ length: maxFret + 1 }, (_, fret) => {
          const x = fret === 0 ? openColWidth / 2 : openColWidth + (fret - 0.5) * fretWidth;
          const isInlay = inlayFrets.includes(fret);
          return (
            <React.Fragment key={`fret-header-${fret}`}>
              <Typography
                variant="caption"
                sx={{
                  position: 'absolute',
                  left: x,
                  top: 2,
                  transform: 'translateX(-50%)',
                  fontWeight: isInlay || fret === 0 ? 900 : 600,
                  fontSize: '0.72rem',
                  color: isInlay ? 'primary.main' : 'text.secondary',
                }}
              >
                {fret === 0 ? '0' : fret}
              </Typography>
              {isInlay && (
                <Box
                  sx={{
                    position: 'absolute',
                    left: x,
                    top: topOffset + boardHeight + 14,
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    gap: 0.5,
                  }}
                >
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'text.disabled' }} />
                  {fret === 12 && (
                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'text.disabled' }} />
                  )}
                </Box>
              )}
            </React.Fragment>
          );
        })}

        {/* Fretboard Wood / Surface */}
        <Box
          sx={{
            position: 'absolute',
            left: openColWidth,
            top: topOffset,
            width: fretCount * fretWidth,
            height: boardHeight,
            bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.035)',
            borderRadius: 1,
          }}
        />

        {/* Fret Wires */}
        {Array.from({ length: fretCount + 1 }, (_, i) => (
          <Box
            key={`wire-${i}`}
            sx={{
              position: 'absolute',
              left: openColWidth + i * fretWidth,
              top: topOffset,
              height: boardHeight,
              width: i === 0 ? 4 : 1.5,
              bgcolor: i === 0 ? (isDark ? '#fff' : '#222') : 'divider',
              transform: 'translateX(-50%)',
              zIndex: 2,
            }}
          />
        ))}

        {/* Bass Strings */}
        {strings.map((sIdx, renderIdx) => {
          const y = topOffset + renderIdx * stringSpacing;
          const thickness = 1.4 + renderIdx * 0.45;
          return (
            <React.Fragment key={`str-${sIdx}`}>
              <Typography
                variant="caption"
                sx={{
                  position: 'absolute',
                  left: 2,
                  top: y,
                  transform: 'translateY(-50%)',
                  fontWeight: 900,
                  fontSize: '0.7rem',
                  color: 'text.disabled',
                }}
              >
                {translateNoteName(BASS_STRINGS[sIdx].name, noteNaming)}
              </Typography>
              <Box
                sx={{
                  position: 'absolute',
                  left: openColWidth,
                  top: y,
                  width: fretCount * fretWidth,
                  height: thickness,
                  bgcolor: isDark ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.26)',
                  transform: 'translateY(-50%)',
                  zIndex: 3,
                }}
              />
            </React.Fragment>
          );
        })}

        {/* Mode Notes & Live / Target Markers */}
        {strings.map((sIdx, renderIdx) => {
          const y = topOffset + renderIdx * stringSpacing;
          const openMidi = BASS_STRINGS[sIdx].openMidi;

          return Array.from({ length: maxFret + 1 }, (_, fret) => {
            const midi = openMidi + fret;
            const analyzed = analyzeMidiInStep(midi, step);
            const isTargetExact = targetPosition
              ? sIdx === targetPosition.stringIndex && fret === targetPosition.fret
              : targetMidi !== null && targetMidi !== undefined && midi === targetMidi;
            const isDetectedMatch =
              detectedMidi !== null &&
              detectedMidi !== undefined &&
              (detectedMidi % 12) === (midi % 12);

            if (analyzed.role === 'outside' && !isDetectedMatch && !isTargetExact) {
              return null;
            }

            const x = fret === 0 ? openColWidth / 2 + 4 : openColWidth + (fret - 0.5) * fretWidth;
            const colors = getRoleColors(analyzed.role);
            const label =
              labelMode === 'degrees'
                ? analyzed.degree
                : translateNoteName(analyzed.noteName, noteNaming);

            const isOutsideDetected = analyzed.role === 'outside' && isDetectedMatch;
            const size = isTargetExact ? 28 : analyzed.role === 'color' || analyzed.role === 'root' ? 25 : 22;

            return (
              <Box
                key={`n-${sIdx}-${fret}`}
                sx={{
                  position: 'absolute',
                  left: x,
                  top: y,
                  width: size,
                  height: size,
                  borderRadius: analyzed.role === 'color' ? '6px' : '50%',
                  bgcolor: isOutsideDetected
                    ? alpha(theme.palette.error.main, 0.25)
                    : colors.bg,
                  color: isOutsideDetected ? theme.palette.error.main : colors.fg,
                  border: '2px solid',
                  borderColor: isTargetExact
                    ? '#ffffff'
                    : isDetectedMatch
                    ? theme.palette.secondary.main
                    : isOutsideDetected
                    ? theme.palette.error.main
                    : colors.border,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: label.length > 2 ? '0.6rem' : '0.68rem',
                  fontWeight: 900,
                  transform: 'translate(-50%, -50%)',
                  zIndex: isTargetExact ? 20 : isDetectedMatch ? 16 : analyzed.role === 'color' ? 12 : 10,
                  animation: isTargetExact
                    ? `${targetPulse} 1.4s infinite ease-in-out`
                    : analyzed.role === 'color'
                    ? `${colorGlow} 2.6s infinite ease-in-out`
                    : 'none',
                  boxShadow: isDetectedMatch
                    ? `0 0 0 4px ${alpha(theme.palette.secondary.main, 0.35)}`
                    : 'none',
                  transition: 'all 0.15s ease',
                  userSelect: 'none',
                }}
              >
                {label}
              </Box>
            );
          });
        })}
      </Box>
    </Box>
  );
};

const ModeSessionRunner: React.FC<ModeSessionRunnerProps> = ({
  day,
  title,
  description,
  modeConfig,
  sequence,
  programId,
  onFinish,
  onReplay,
  onNext,
}) => {
  const { settings, addSessionResult } = useStore();
  const theme = useTheme();
  const mt = translations[settings.language].modes;
  const st = translations[settings.language].session;
  const amber = '#ffb300';

  const isDrill = modeConfig.kind === 'drill' && !!sequence && sequence.length > 0;
  const goals = modeConfig.improvGoals || {
    minInModeNotes: 16,
    minColorNoteHits: 3,
    requireRoot: true,
    requireChordTones: 2,
  };

  // Backing track & mic gating state
  const [isBackingPlaying, setIsBackingPlaying] = useState(false);
  const [isAuditioning, setIsAuditioning] = useState(false);
  const [isDetectionPaused, setIsDetectionPaused] = useState(false);
  const [bpm, setBpm] = useState(modeConfig.bpm);
  const [backingVolume, setBackingVolume] = useState(0.38);
  const [beatState, setBeatState] = useState<BackingBeatEvent>({
    chordIndex: 0,
    barInChord: 0,
    beatInBar: 0,
  });

  // UI display state
  const [hasStarted, setHasStarted] = useState(false);
  const [labelMode, setLabelMode] = useState<'degrees' | 'notes'>(
    modeConfig.stepType === 'scale' ? 'notes' : 'degrees'
  );
  const [showTheoryCard, setShowTheoryCard] = useState(false);
  const [viewMode, setViewMode] = useState<'neck' | 'tab' | 'both'>('neck');
  const [engineError, setEngineError] = useState<string | null>(null);
  const [detected, setDetected] = useState<AudioStats | null>(null);
  const [stabilityCounter, setStabilityCounter] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  // Drill progress state
  const [drillIdx, setDrillIdx] = useState(0);
  const [drillMistakes, setDrillMistakes] = useState(0);
  const [drillSuccessFlash, setDrillSuccessFlash] = useState(false);
  const [drillWrongFlash, setDrillWrongFlash] = useState(false);
  const drillTimesRef = useRef<number[]>([]);
  const drillStepStartRef = useRef<number>(Date.now());
  const failedNotesRef = useRef<string[]>([]);

  // Improv progress state
  const [improvInModeCount, setImprovInModeCount] = useState(0);
  const [improvOutsideCount, setImprovOutsideCount] = useState(0);
  const [improvColorHits, setImprovColorHits] = useState(0);
  const [improvRootHit, setImprovRootHit] = useState(false);
  const [improvChordTonesHit, setImprovChordTonesHit] = useState<number[]>([]);
  const [lastImprovNote, setLastImprovNote] = useState<AnalyzedNote | null>(null);
  const improvStartTimeRef = useRef<number>(Date.now());
  const improvStatsRef = useRef({
    inMode: 0,
    outside: 0,
    colorHits: 0,
    rootHit: false,
    chordTones: new Set<number>(),
  });

  // Audio engines & attack guard refs
  const audioEngineRef = useRef<AudioEngine | null>(null);
  const backingRef = useRef<ModeBackingEngine | null>(null);
  const stabilityCheckRef = useRef<number | null>(null);
  const wrongCheckRef = useRef<number | null>(null);
  const isWaitingForNewAttackRef = useRef<boolean>(false);
  const lastCapturedMidiRef = useRef<number | null>(null);
  const lastCaptureTsRef = useRef<number>(0);
  const lastRmsRef = useRef<number>(0);

  const activeChordIdx =
    modeConfig.progression.length > 1
      ? isDrill
        ? Math.min(
            modeConfig.progression.length - 1,
            Math.floor((drillIdx / Math.max(1, (sequence?.length || 1))) * modeConfig.progression.length)
          )
        : beatState.chordIndex
      : 0;

  const activeStep: ModeChordStep = modeConfig.progression[activeChordIdx] || modeConfig.progression[0];
  const activeMode = MODE_DEFINITIONS[activeStep.modeId];

  const activeStepRef = useRef<ModeChordStep>(activeStep);
  useEffect(() => {
    activeStepRef.current = activeStep;
  }, [activeStep]);

  const improvTipText = useMemo(() => {
    const raw =
      settings.language === 'fr'
        ? modeConfig.improvTip_fr || modeConfig.improvTip
        : settings.language === 'es'
        ? modeConfig.improvTip_es || modeConfig.improvTip
        : modeConfig.improvTip;
    return translateTextWithNotes(raw, settings.noteNaming);
  }, [modeConfig, settings.language, settings.noteNaming]);

  const theoryNoteText = useMemo(() => {
    const raw =
      settings.language === 'fr'
        ? modeConfig.theoryNote_fr || modeConfig.theoryNote
        : settings.language === 'es'
        ? modeConfig.theoryNote_es || modeConfig.theoryNote
        : modeConfig.theoryNote;
    return translateTextWithNotes(raw, settings.noteNaming);
  }, [modeConfig, settings.language, settings.noteNaming]);

  const comparedToBasicText = useMemo(() => {
    const raw =
      settings.language === 'fr'
        ? activeMode.comparedToBasic_fr
        : settings.language === 'es'
        ? activeMode.comparedToBasic_es
        : activeMode.comparedToBasic;
    return translateTextWithNotes(raw, settings.noteNaming);
  }, [activeMode, settings.language, settings.noteNaming]);

  const stepTypeBadge = useMemo(() => {
    switch (modeConfig.stepType) {
      case 'scale':
        return { label: mt.badgeScale, color: 'info' as const };
      case 'groove':
        return { label: mt.badgeGroove, color: 'primary' as const };
      case 'improv':
        return { label: mt.badgeImprovStep, color: 'warning' as const };
      case 'switch':
        return { label: mt.badgeSwitch, color: 'secondary' as const };
      default:
        return { label: isDrill ? mt.badgeDrill : mt.badgeImprov, color: 'primary' as const };
    }
  }, [modeConfig.stepType, mt, isDrill]);

  const modeNameLocalized = useMemo(() => {
    if (settings.language === 'fr') return activeMode.name_fr;
    if (settings.language === 'es') return activeMode.name_es;
    return activeMode.name;
  }, [activeMode, settings.language]);

  const modeVibeLocalized = useMemo(() => {
    if (settings.language === 'fr') return activeMode.vibe_fr;
    if (settings.language === 'es') return activeMode.vibe_es;
    return activeMode.vibe;
  }, [activeMode, settings.language]);

  const drillTabPositions = useMemo(() => {
    if (!isDrill || !sequence || sequence.length === 0) return [];
    return getBassPositionsForSequence(sequence, settings.isFiveString, true);
  }, [isDrill, sequence, settings.isFiveString]);

  // Mission completion check (for Improv Lab)
  const improvMissionComplete = useMemo(() => {
    if (isDrill) return false;
    return (
      improvInModeCount >= goals.minInModeNotes &&
      improvColorHits >= goals.minColorNoteHits &&
      (!goals.requireRoot || improvRootHit) &&
      improvChordTonesHit.length >= goals.requireChordTones
    );
  }, [
    isDrill,
    improvInModeCount,
    improvColorHits,
    improvRootHit,
    improvChordTonesHit.length,
    goals,
  ]);

  // Initialize Backing Engine
  useEffect(() => {
    backingRef.current = new ModeBackingEngine();
    backingRef.current.setVolume(backingVolume);
    return () => {
      backingRef.current?.dispose();
      backingRef.current = null;
    };
  }, []);

  useEffect(() => {
    backingRef.current?.setVolume(backingVolume);
  }, [backingVolume]);

  useEffect(() => {
    backingRef.current?.setBpm(bpm);
  }, [bpm]);

  const isAuditioningRef = useRef(false);
  const isDetectionPausedRef = useRef(false);
  useEffect(() => {
    isAuditioningRef.current = isAuditioning;
  }, [isAuditioning]);
  useEffect(() => {
    isDetectionPausedRef.current = isDetectionPaused;
  }, [isDetectionPaused]);

  const resetDetectionGuards = useCallback(() => {
    setDetected(null);
    setStabilityCounter(0);
    stabilityCheckRef.current = null;
    wrongCheckRef.current = null;
    isWaitingForNewAttackRef.current = false;
    lastCapturedMidiRef.current = null;
  }, []);

  const toggleBacking = useCallback(() => {
    if (!backingRef.current) return;
    if (isBackingPlaying) {
      backingRef.current.stop();
      setIsBackingPlaying(false);
      setIsDetectionPaused(false);
      isDetectionPausedRef.current = false;
      resetDetectionGuards();
    } else {
      setIsAuditioning(false);
      isAuditioningRef.current = false;
      // Pause mic detection by default when vamp starts so speaker audio doesn't trigger false detections
      setIsDetectionPaused(true);
      isDetectionPausedRef.current = true;
      resetDetectionGuards();
      backingRef.current.start(modeConfig.progression, bpm, (ev) => {
        setBeatState(ev);
      });
      setIsBackingPlaying(true);
    }
  }, [isBackingPlaying, modeConfig.progression, bpm, resetDetectionGuards]);

  const handleAudition = useCallback(() => {
    if (!backingRef.current) return;
    if (isAuditioning) {
      backingRef.current.stop();
      setIsAuditioning(false);
      isAuditioningRef.current = false;
      resetDetectionGuards();
      return;
    }

    setIsBackingPlaying(false);
    setIsDetectionPaused(false);
    isDetectionPausedRef.current = false;
    setIsAuditioning(true);
    isAuditioningRef.current = true;
    resetDetectionGuards();

    backingRef.current.auditionStep(activeStep, () => {
      setIsAuditioning(false);
      isAuditioningRef.current = false;
      resetDetectionGuards();
    });
  }, [activeStep, isAuditioning, resetDetectionGuards]);

  const handleExit = useCallback(() => {
    backingRef.current?.stop();
    setIsBackingPlaying(false);
    setIsAuditioning(false);
    isAuditioningRef.current = false;
    audioEngineRef.current?.stop();
    onFinish();
  }, [onFinish]);

  const handleStartSession = useCallback(() => {
    backingRef.current?.stop();
    setIsBackingPlaying(false);
    setIsAuditioning(false);
    isAuditioningRef.current = false;
    setIsDetectionPaused(false);
    isDetectionPausedRef.current = false;
    resetDetectionGuards();
    drillStepStartRef.current = Date.now();
    improvStartTimeRef.current = Date.now();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setHasStarted(true);
  }, [resetDetectionGuards]);

  const [finalSummary, setFinalSummary] = useState<any>(null);

  const completeDrillSession = useCallback(
    (finalMistakes: number) => {
      backingRef.current?.stop();
      setIsBackingPlaying(false);
      audioEngineRef.current?.stop();

      const totalNotes = sequence?.length || 1;
      const accuracy = Math.max(0, Math.min(100, ((totalNotes - finalMistakes) / totalNotes) * 100));
      const avgTime =
        drillTimesRef.current.reduce((a, b) => a + b, 0) / (drillTimesRef.current.length || 1);
      const score = Math.round(accuracy * 1.2 + Math.max(0, 3 - avgTime) * 10);

      const res = {
        date: new Date().toISOString(),
        score,
        accuracy,
        avgTime,
        day,
        programId,
        wasBeginnerMode: false,
      };
      addSessionResult(res);
      setFinalSummary({
        ...res,
        title,
        failedNotes: [...failedNotesRef.current],
      });
      setIsFinished(true);
    },
    [sequence?.length, day, programId, title, addSessionResult]
  );

  const completeImprovSession = useCallback(() => {
    backingRef.current?.stop();
    setIsBackingPlaying(false);
    audioEngineRef.current?.stop();

    const s = improvStatsRef.current;
    const totalPlayed = s.inMode + s.outside;
    const rawInModeRatio = totalPlayed > 0 ? (s.inMode / totalPlayed) * 100 : 0;

    // Calculate mission completion score
    const goalsMet =
      (s.inMode >= goals.minInModeNotes ? 1 : s.inMode / Math.max(1, goals.minInModeNotes)) +
      (s.colorHits >= goals.minColorNoteHits ? 1 : s.colorHits / Math.max(1, goals.minColorNoteHits)) +
      (!goals.requireRoot || s.rootHit ? 1 : 0) +
      (s.chordTones.size >= goals.requireChordTones
        ? 1
        : s.chordTones.size / Math.max(1, goals.requireChordTones));

    const goalFactor = goalsMet / 4;
    // Reward musical modal accuracy weighted with goal completion
    const accuracy = Math.round(Math.min(100, rawInModeRatio * 0.55 + goalFactor * 100 * 0.45));
    const elapsedSec = Math.max(1, (Date.now() - improvStartTimeRef.current) / 1000);
    const avgTime = totalPlayed > 0 ? elapsedSec / totalPlayed : 0;
    const score = Math.round(s.inMode * 5 + s.colorHits * 15 + s.chordTones.size * 10);

    const res = {
      date: new Date().toISOString(),
      score,
      accuracy,
      avgTime,
      day,
      programId,
      wasBeginnerMode: false,
    };
    addSessionResult(res);
    setFinalSummary({
      ...res,
      title,
      failedNotes: [],
    });
    setIsFinished(true);
  }, [goals, day, programId, title, addSessionResult]);

  // Real-time pitch handler
  const handleAudioProcess = useCallback(
    (stats: AudioStats) => {
      if (isFinished || isAuditioningRef.current || isDetectionPausedRef.current) {
        setDetected(null);
        setStabilityCounter(0);
        stabilityCheckRef.current = null;
        wrongCheckRef.current = null;
        return;
      }
      setDetected(stats);

      const isActive = stats.rms >= settings.rmsThreshold;
      const prevRms = lastRmsRef.current;
      lastRmsRef.current = stats.rms;

      if (!isActive) {
        isWaitingForNewAttackRef.current = false;
        lastCapturedMidiRef.current = null;
        setStabilityCounter(0);
        stabilityCheckRef.current = null;
        wrongCheckRef.current = null;
        return;
      }

      if (!stats.pitch) {
        setStabilityCounter(0);
        stabilityCheckRef.current = null;
        return;
      }

      if (isWaitingForNewAttackRef.current) {
        const isNewPluck = !!stats.isOnset || stats.rms > prevRms * 1.65;
        const pitchShifted =
          lastCapturedMidiRef.current !== null &&
          Math.abs(stats.pitch.midi - lastCapturedMidiRef.current) > 0.8;

        if (isNewPluck || pitchShifted) {
          isWaitingForNewAttackRef.current = false;
        } else {
          return;
        }
      }

      const now = Date.now();
      if (now - lastCaptureTsRef.current < 160) return;

      const isDecaying = stats.rms < prevRms * 0.94;
      const requiredStability = Math.max(20, settings.stabilityMs || 30);

      if (isDrill && sequence) {
        const targetMidi = sequence[drillIdx];
        const isValid = validateNote(stats.pitch.midi, targetMidi, settings.strictOctave);

        if (isValid) {
          wrongCheckRef.current = null;
          if (isDecaying && stabilityCheckRef.current === null) return;

          if (stabilityCheckRef.current === null) {
            stabilityCheckRef.current = now;
          } else {
            const elapsed = now - stabilityCheckRef.current;
            setStabilityCounter(Math.min(100, (elapsed / requiredStability) * 100));
            if (elapsed >= requiredStability) {
              const stepTime = (now - drillStepStartRef.current) / 1000;
              drillTimesRef.current.push(stepTime);
              drillStepStartRef.current = now;

              lastCapturedMidiRef.current = stats.pitch.midi;
              lastCaptureTsRef.current = now;
              isWaitingForNewAttackRef.current = true;
              stabilityCheckRef.current = null;
              setStabilityCounter(0);

              setDrillSuccessFlash(true);
              setTimeout(() => setDrillSuccessFlash(false), 260);

              if (drillIdx < sequence.length - 1) {
                setDrillIdx((idx) => idx + 1);
              } else {
                completeDrillSession(drillMistakes);
              }
            }
          }
        } else {
          setStabilityCounter(0);
          stabilityCheckRef.current = null;

          // Ignore sustain of previous note
          if (drillIdx > 0 && validateNote(stats.pitch.midi, sequence[drillIdx - 1], settings.strictOctave) && !stats.isOnset) {
            return;
          }

          if (wrongCheckRef.current === null) {
            wrongCheckRef.current = now;
          } else if (now - wrongCheckRef.current > 280) {
            const targetName = NOTE_NAMES[targetMidi % 12];
            if (!failedNotesRef.current.includes(targetName)) {
              failedNotesRef.current.push(targetName);
            }
            setDrillMistakes((m) => m + 1);
            setDrillWrongFlash(true);
            setTimeout(() => setDrillWrongFlash(false), 380);
            wrongCheckRef.current = null;
            isWaitingForNewAttackRef.current = true;
            lastCapturedMidiRef.current = stats.pitch.midi;
            lastCaptureTsRef.current = now;
          }
        }
      } else {
        // FREE MODAL IMPROVISATION LAB
        if (isDecaying && stabilityCheckRef.current === null) return;

        if (stabilityCheckRef.current === null) {
          stabilityCheckRef.current = now;
        } else {
          const elapsed = now - stabilityCheckRef.current;
          setStabilityCounter(Math.min(100, (elapsed / requiredStability) * 100));

          if (elapsed >= requiredStability) {
            const analyzed = analyzeMidiInStep(stats.pitch.midi, activeStepRef.current);
            setLastImprovNote(analyzed);

            if (analyzed.role === 'outside') {
              improvStatsRef.current.outside += 1;
              setImprovOutsideCount(improvStatsRef.current.outside);
            } else {
              improvStatsRef.current.inMode += 1;
              setImprovInModeCount(improvStatsRef.current.inMode);

              if (analyzed.role === 'root') {
                improvStatsRef.current.rootHit = true;
                setImprovRootHit(true);
              }
              if (analyzed.role === 'color') {
                improvStatsRef.current.colorHits += 1;
                setImprovColorHits(improvStatsRef.current.colorHits);
              }
              if (analyzed.role === 'chord' || analyzed.role === 'color') {
                const stepMode = MODE_DEFINITIONS[activeStepRef.current.modeId];
                if (stepMode.chordTones.includes(analyzed.interval) && analyzed.interval !== 0) {
                  improvStatsRef.current.chordTones.add(analyzed.interval);
                  setImprovChordTonesHit(Array.from(improvStatsRef.current.chordTones));
                }
              }
            }

            lastCapturedMidiRef.current = stats.pitch.midi;
            lastCaptureTsRef.current = now;
            isWaitingForNewAttackRef.current = true;
            stabilityCheckRef.current = null;
            setStabilityCounter(0);
          }
        }
      }
    },
    [
      isFinished,
      isDrill,
      sequence,
      drillIdx,
      drillMistakes,
      settings.rmsThreshold,
      settings.stabilityMs,
      settings.strictOctave,
      completeDrillSession,
    ]
  );

  const processRef = useRef(handleAudioProcess);
  useEffect(() => {
    processRef.current = handleAudioProcess;
  }, [handleAudioProcess]);

  // Start Mic AudioEngine only after the user finishes reading the pre-session theory briefing
  useEffect(() => {
    if (!hasStarted) return;

    const engine = new AudioEngine((stats) => processRef.current(stats));
    audioEngineRef.current = engine;

    const startMic = async () => {
      try {
        await engine.start(settings.selectedMicId);
        setEngineError(null);
      } catch (err: any) {
        setEngineError(err.message || st.audioError);
      }
    };
    startMic();

    return () => {
      engine.stop();
      audioEngineRef.current = null;
    };
  }, [hasStarted, settings.selectedMicId, st.audioError]);

  if (engineError) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Alert severity="error" variant="filled" sx={{ mb: 3 }}>
          <Typography variant="h6">{st.audioError}</Typography>
          <Typography variant="body2">{engineError}</Typography>
        </Alert>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={handleExit}>
          {mt.exitSession}
        </Button>
      </Container>
    );
  }

  if (isFinished && finalSummary) {
    const showNext = onNext && finalSummary.accuracy >= settings.minUnlockAccuracy;
    return (
      <ScoreSummary
        result={finalSummary}
        onClose={handleExit}
        onReplay={onReplay}
        onNext={showNext ? onNext : undefined}
      />
    );
  }

  // Pre-session Theory & Mode Briefing (shown before mic detection activates)
  if (!hasStarted) {
    const isDarkMode = theme.palette.mode === 'dark';
    const parentScaleChipLabel = translateTextWithNotes(
      mt.parentScaleNote.replace(
        '{note}',
        translateNoteName(activeMode.cMajorParentNote, settings.noteNaming)
      ),
      settings.noteNaming
    );
    const progressionPreviewLabel =
      modeConfig.progression.length > 1
        ? modeConfig.progression
            .map((s) => translateTextWithNotes(s.chordLabel, settings.noteNaming))
            .join(' → ')
        : null;

    return (
      <Fade in={true} timeout={350}>
        <Container maxWidth="md" sx={{ py: 2 }}>
          <Stack spacing={2.25}>
            {/* Header with Mode Badges & Exit */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: 2,
                flexWrap: 'wrap',
              }}
            >
              <Box>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
                  <Chip
                    size="small"
                    color="primary"
                    variant="outlined"
                    label={`${mt.modeOfSeven.replace('{num}', String(activeMode.modeNumber))} • ${modeNameLocalized}`}
                    sx={{ fontWeight: 900, borderRadius: 1.5 }}
                  />
                  <Chip
                    size="small"
                    icon={<AutoAwesomeIcon sx={{ fontSize: '13px !important' }} />}
                    label={stepTypeBadge.label}
                    color={stepTypeBadge.color}
                    sx={{ fontWeight: 900, borderRadius: 1.5 }}
                  />
                  <Chip
                    size="small"
                    label={`${translateTextWithNotes(activeStep.chordLabel, settings.noteNaming)} • ★${activeMode.colorDegree}`}
                    sx={{
                      fontWeight: 900,
                      borderRadius: 1.5,
                      bgcolor: alpha(amber, 0.16),
                      color: isDarkMode ? amber : '#8c5300',
                    }}
                  />
                </Stack>
                <Typography variant="h5" fontWeight={900} sx={{ letterSpacing: -0.5 }}>
                  {title}
                </Typography>
              </Box>
              <Button
                variant="outlined"
                color="inherit"
                size="small"
                startIcon={<ArrowBackIcon />}
                onClick={handleExit}
                sx={{ fontWeight: 800, borderRadius: 2, textTransform: 'none' }}
              >
                {mt.exitSession}
              </Button>
            </Box>

            {/* Theory Tip & Musical Approach Card */}
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2.25, sm: 3 },
                borderRadius: 3,
                border: '1px solid',
                borderColor: alpha(theme.palette.primary.main, 0.3),
                bgcolor: alpha(theme.palette.primary.main, isDarkMode ? 0.08 : 0.04),
              }}
            >
              <Stack spacing={2}>
                <Box>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    <SchoolIcon color="primary" fontSize="small" />
                    <Typography variant="subtitle1" fontWeight={900} color="primary">
                      {mt.theoryBriefingTitle} — {modeNameLocalized}
                    </Typography>
                  </Stack>
                  <Typography variant="body1" sx={{ lineHeight: 1.65, fontWeight: 500 }}>
                    {theoryNoteText}
                  </Typography>
                </Box>

                <Divider />

                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                  <LightbulbIcon sx={{ color: amber, mt: 0.25, flexShrink: 0 }} fontSize="small" />
                  <Box>
                    <Typography
                      variant="caption"
                      fontWeight={900}
                      sx={{
                        textTransform: 'uppercase',
                        letterSpacing: 1,
                        color: isDarkMode ? amber : '#b26a00',
                        display: 'block',
                        mb: 0.25,
                      }}
                    >
                      {mt.improvTipTitle}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                      {improvTipText}
                    </Typography>
                  </Box>
                </Box>

                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Chip
                    size="small"
                    icon={<MusicNoteIcon fontSize="small" />}
                    variant="outlined"
                    color="primary"
                    label={parentScaleChipLabel}
                    sx={{ fontWeight: 800, borderRadius: 1.5, bgcolor: 'background.paper' }}
                  />
                  <Chip
                    size="small"
                    label={`${mt.comparedToLabel} ${comparedToBasicText}`}
                    sx={{
                      fontWeight: 800,
                      borderRadius: 1.5,
                      bgcolor: alpha(amber, 0.14),
                      color: isDarkMode ? amber : '#8c5300',
                    }}
                  />
                  {progressionPreviewLabel && (
                    <Chip
                      size="small"
                      color="secondary"
                      variant="outlined"
                      label={progressionPreviewLabel}
                      sx={{ fontWeight: 900, borderRadius: 1.5, bgcolor: 'background.paper' }}
                    />
                  )}
                </Stack>
              </Stack>
            </Paper>

            {/* Modal Fretboard Preview */}
            <Paper
              elevation={0}
              sx={{
                p: 1.75,
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 1,
                  mb: 0.75,
                }}
              >
                <Box>
                  <Typography
                    variant="caption"
                    fontWeight={900}
                    color="text.secondary"
                    sx={{ textTransform: 'uppercase', letterSpacing: 1.1, display: 'block' }}
                  >
                    {mt.shapePreviewTitle}
                  </Typography>
                  <Typography variant="body2" fontWeight={900}>
                    {translateNoteName(activeStep.rootName, settings.noteNaming)} {modeNameLocalized}{' '}
                    <Typography component="span" variant="caption" color="text.secondary" fontWeight={700}>
                      ({activeMode.degreeLabels.join(' - ')}) • {modeVibeLocalized}
                    </Typography>
                  </Typography>
                </Box>

                <ToggleButtonGroup
                  size="small"
                  exclusive
                  value={labelMode}
                  onChange={(_, v) => v && setLabelMode(v)}
                >
                  <ToggleButton value="degrees" sx={{ fontWeight: 800, px: 1.1, py: 0.3, textTransform: 'none', fontSize: '0.72rem' }}>
                    {mt.showDegrees}
                  </ToggleButton>
                  <ToggleButton value="notes" sx={{ fontWeight: 800, px: 1.1, py: 0.3, textTransform: 'none', fontSize: '0.72rem' }}>
                    {mt.showNotes}
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>

              <ModalFretboard
                step={activeStep}
                isFiveString={settings.isFiveString}
                noteNaming={settings.noteNaming}
                labelMode={labelMode}
                targetMidi={null}
                targetPosition={null}
                detectedMidi={null}
              />

              <Stack direction="row" spacing={1.5} flexWrap="wrap" alignItems="center" justifyContent="center" sx={{ mt: 0.75 }}>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: 'primary.main' }} />
                  <Typography variant="caption" fontWeight={700} sx={{ fontSize: '0.72rem' }}>
                    {mt.roleRoot}
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: 'success.main' }} />
                  <Typography variant="caption" fontWeight={700} sx={{ fontSize: '0.72rem' }}>
                    {mt.roleChord}
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <Box sx={{ width: 10, height: 10, borderRadius: '3px', bgcolor: amber }} />
                  <Typography variant="caption" fontWeight={800} sx={{ fontSize: '0.72rem' }}>
                    {mt.colorNote} ({activeMode.colorDegree})
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      border: '2px solid',
                      borderColor: 'text.secondary',
                    }}
                  />
                  <Typography variant="caption" fontWeight={700} sx={{ fontSize: '0.72rem' }}>
                    {mt.roleScale}
                  </Typography>
                </Stack>
              </Stack>
            </Paper>

            {/* Actions: Audition Mode + Primary Start CTA */}
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.5}
              justifyContent="center"
              alignItems="center"
              sx={{ pt: 0.5 }}
            >
              <Button
                variant={isAuditioning ? 'contained' : 'outlined'}
                color={isAuditioning ? 'warning' : 'primary'}
                size="large"
                startIcon={isAuditioning ? <StopIcon /> : <GraphicEqIcon />}
                onClick={handleAudition}
                sx={{
                  px: 3,
                  py: 1.4,
                  borderRadius: 3,
                  fontWeight: 800,
                  textTransform: 'none',
                }}
              >
                {isAuditioning ? mt.stopAudition : mt.auditionMode}
              </Button>

              <Button
                variant="contained"
                size="large"
                startIcon={<PlayArrowIcon />}
                onClick={handleStartSession}
                sx={{
                  px: 4.5,
                  py: 1.5,
                  borderRadius: 3,
                  fontWeight: 900,
                  fontSize: '1.05rem',
                  textTransform: 'none',
                  boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.35)}`,
                }}
              >
                {isDrill ? mt.readyToPlayDrill : mt.readyToPlayImprov}
              </Button>
            </Stack>
          </Stack>
        </Container>
      </Fade>
    );
  }

  const currentTargetMidi = isDrill && sequence ? sequence[drillIdx] : null;
  const currentTargetPosition =
    isDrill && drillTabPositions.length > drillIdx ? drillTabPositions[drillIdx] : null;
  const currentTargetAnalyzed =
    currentTargetMidi !== null ? analyzeMidiInStep(currentTargetMidi, activeStep) : null;
  const liveDetectedMidi =
    !isAuditioning && !isDetectionPaused && detected && detected.rms >= settings.rmsThreshold && detected.pitch
      ? detected.pitch.midi
      : null;

  const totalImprovPlayed = improvInModeCount + improvOutsideCount;
  const liveImprovAccuracy =
    totalImprovPlayed > 0 ? Math.round((improvInModeCount / totalImprovPlayed) * 100) : 100;

  const getRoleBadgeLabel = (role: NoteRole) => {
    switch (role) {
      case 'root':
        return mt.roleRoot;
      case 'color':
        return `${mt.roleColor} ★`;
      case 'chord':
        return mt.roleChord;
      case 'scale':
        return mt.roleScale;
      default:
        return mt.roleOutside;
    }
  };

  const getRoleChipColor = (role: NoteRole) => {
    switch (role) {
      case 'root':
        return theme.palette.primary.main;
      case 'color':
        return amber;
      case 'chord':
        return theme.palette.success.main;
      case 'scale':
        return theme.palette.text.secondary;
      default:
        return theme.palette.error.main;
    }
  };

  const targetStringLabel = currentTargetPosition
    ? translateNoteName(BASS_STRINGS[currentTargetPosition.stringIndex]?.name || '', settings.noteNaming)
    : '';
  const isMicPausedNow = isAuditioning || isDetectionPaused;

  return (
    <Container maxWidth="lg" sx={{ py: 1, pb: 3 }}>
      <Stack spacing={1.25}>
        {/* Compact Single-Row Header */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 1,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
            <Typography variant="h6" fontWeight={900} sx={{ letterSpacing: -0.4, mr: 0.5 }}>
              {title}
            </Typography>
            <Chip
              size="small"
              label={`${mt.modeOfSeven.replace('{num}', String(activeMode.modeNumber))} • ${modeNameLocalized}`}
              color="primary"
              variant="outlined"
              sx={{ fontWeight: 900, borderRadius: 1.5, height: 22, fontSize: '0.7rem' }}
            />
            <Chip
              size="small"
              icon={<AutoAwesomeIcon sx={{ fontSize: '12px !important' }} />}
              label={stepTypeBadge.label}
              color={stepTypeBadge.color}
              sx={{ fontWeight: 900, borderRadius: 1.5, height: 22, fontSize: '0.7rem' }}
            />
            <Chip
              size="small"
              label={`${translateTextWithNotes(activeStep.chordLabel, settings.noteNaming)} • ★${activeMode.colorDegree}`}
              sx={{
                fontWeight: 900,
                borderRadius: 1.5,
                height: 22,
                fontSize: '0.7rem',
                bgcolor: alpha(amber, 0.16),
                color: theme.palette.mode === 'dark' ? amber : '#995c00',
              }}
            />
          </Box>

          <Stack direction="row" spacing={1} alignItems="center">
            <Button
              size="small"
              variant={showTheoryCard ? 'contained' : 'outlined'}
              color="primary"
              startIcon={<SchoolIcon fontSize="small" />}
              endIcon={showTheoryCard ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
              onClick={() => setShowTheoryCard((prev) => !prev)}
              sx={{ fontWeight: 800, borderRadius: 2, textTransform: 'none', py: 0.35 }}
            >
              {mt.theoryAndTips}
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              size="small"
              startIcon={<ArrowBackIcon />}
              onClick={handleExit}
              sx={{ fontWeight: 800, borderRadius: 2, textTransform: 'none', py: 0.35 }}
            >
              {mt.exitSession}
            </Button>
          </Stack>
        </Box>

        {/* Collapsible Theory Lesson & Beginner Tip Drawer */}
        <Collapse in={showTheoryCard}>
          <Paper
            elevation={0}
            sx={{
              p: 1.75,
              borderRadius: 2.5,
              border: '1px solid',
              borderColor: alpha(theme.palette.primary.main, 0.3),
              bgcolor: alpha(theme.palette.primary.main, 0.04),
            }}
          >
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 7 }}>
                <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.5 }}>
                  <SchoolIcon color="primary" fontSize="small" />
                  <Typography variant="caption" fontWeight={900} color="primary" sx={{ textTransform: 'uppercase', letterSpacing: 0.8 }}>
                    {mt.theoryBriefingTitle} — {modeNameLocalized}
                  </Typography>
                </Stack>
                <Typography variant="body2" sx={{ lineHeight: 1.55, mb: 1 }}>
                  {theoryNoteText}
                </Typography>
                <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                  <Chip
                    size="small"
                    variant="outlined"
                    color="primary"
                    label={translateTextWithNotes(
                      mt.parentScaleNote.replace(
                        '{note}',
                        translateNoteName(activeMode.cMajorParentNote, settings.noteNaming)
                      ),
                      settings.noteNaming
                    )}
                    sx={{ fontWeight: 800, borderRadius: 1.5, bgcolor: 'background.paper', height: 22, fontSize: '0.7rem' }}
                  />
                  <Chip
                    size="small"
                    label={`${mt.comparedToLabel} ${comparedToBasicText}`}
                    sx={{
                      fontWeight: 800,
                      borderRadius: 1.5,
                      height: 22,
                      fontSize: '0.7rem',
                      bgcolor: alpha(amber, 0.16),
                      color: theme.palette.mode === 'dark' ? amber : '#995c00',
                    }}
                  />
                </Stack>
              </Grid>
              <Grid size={{ xs: 12, md: 5 }}>
                <Box
                  sx={{
                    p: 1.25,
                    height: '100%',
                    borderRadius: 2,
                    bgcolor: alpha(amber, 0.08),
                    border: '1px solid',
                    borderColor: alpha(amber, 0.3),
                  }}
                >
                  <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.5 }}>
                    <LightbulbIcon sx={{ color: amber, fontSize: 16 }} />
                    <Typography
                      variant="caption"
                      fontWeight={900}
                      sx={{ color: theme.palette.mode === 'dark' ? amber : '#b26a00', textTransform: 'uppercase', letterSpacing: 0.8 }}
                    >
                      {mt.improvTipTitle}
                    </Typography>
                  </Stack>
                  <Typography variant="body2" sx={{ lineHeight: 1.5, fontSize: '0.82rem' }}>
                    {improvTipText}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Collapse>

        {/* TOP UNIFIED PLAY & DETECTION COCKPIT — immediately visible on load with zero scrolling */}
        <Paper
          elevation={0}
          sx={{
            px: { xs: 1.5, sm: 2.25 },
            py: 1.25,
            borderRadius: 3,
            border: '2px solid',
            borderColor: drillWrongFlash
              ? 'error.main'
              : drillSuccessFlash
              ? 'success.main'
              : isMicPausedNow
              ? 'warning.main'
              : alpha(theme.palette.primary.main, 0.28),
            bgcolor: 'background.paper',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: { xs: 1.5, sm: 2 },
            flexWrap: 'wrap',
            transition: 'border-color 0.2s ease',
          }}
        >
          {/* Zone 1: Next Note to Play (Drill) OR Live Role Readout (Improv) */}
          {isDrill && currentTargetAnalyzed && sequence ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.75, minWidth: { xs: 'auto', sm: 240 } }}>
              <Box sx={{ textAlign: 'center', minWidth: 72 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0.9, fontSize: '0.62rem', display: 'block', mb: 0.2 }}
                >
                  {mt.nextNoteToPlay}
                </Typography>
                <Typography
                  variant="h2"
                  fontWeight={900}
                  sx={{
                    fontSize: { xs: '2.4rem', sm: '2.9rem' },
                    lineHeight: 1,
                    letterSpacing: -1.2,
                    color: drillWrongFlash
                      ? 'error.main'
                      : drillSuccessFlash
                      ? 'success.main'
                      : getRoleChipColor(currentTargetAnalyzed.role),
                    transition: 'color 0.2s',
                  }}
                >
                  {translateNoteName(currentTargetAnalyzed.noteName, settings.noteNaming).toUpperCase()}
                </Typography>
              </Box>

              <Stack spacing={0.5}>
                <Stack direction="row" spacing={0.6} alignItems="center" flexWrap="wrap" useFlexGap>
                  {currentTargetPosition && (
                    <Chip
                      size="small"
                      color="primary"
                      label={`${targetStringLabel} • ${mt.fretLabel} ${currentTargetPosition.fret}`}
                      sx={{ fontWeight: 900, fontSize: '0.72rem', height: 22, borderRadius: 1.5 }}
                    />
                  )}
                  <Chip
                    size="small"
                    label={`${currentTargetAnalyzed.degree} • ${getRoleBadgeLabel(currentTargetAnalyzed.role)}`}
                    sx={{
                      fontWeight: 900,
                      fontSize: '0.68rem',
                      height: 22,
                      borderRadius: 1.5,
                      bgcolor: getRoleChipColor(currentTargetAnalyzed.role),
                      color: currentTargetAnalyzed.role === 'color' ? '#111' : '#fff',
                    }}
                  />
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                  <CircularProgress
                    variant="determinate"
                    value={stabilityCounter}
                    size={16}
                    thickness={6}
                    color={drillSuccessFlash ? 'success' : drillWrongFlash ? 'error' : 'primary'}
                  />
                  <Typography variant="caption" color="text.secondary" fontWeight={800} sx={{ fontSize: '0.7rem' }}>
                    {drillIdx + 1} / {sequence.length} • {isMicPausedNow ? mt.micPaused : st.stability}
                  </Typography>
                </Stack>
              </Stack>
            </Box>
          ) : (
            /* Improv Mode Live Role Readout */
            <Box sx={{ flex: '1 1 240px', minWidth: 210 }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.4 }} flexWrap="wrap" useFlexGap>
                <Typography variant="caption" fontWeight={900} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.9 }}>
                  {mt.improvMission}
                </Typography>
                <Chip
                  size="small"
                  label={`${mt.inModeAccuracy}: ${liveImprovAccuracy}%`}
                  color={liveImprovAccuracy >= 80 ? 'success' : 'warning'}
                  sx={{ fontWeight: 900, height: 20, fontSize: '0.68rem' }}
                />
              </Stack>
              {lastImprovNote ? (
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                  <Typography variant="h4" fontWeight={900} sx={{ lineHeight: 1 }}>
                    {translateNoteName(lastImprovNote.noteName, settings.noteNaming)}
                  </Typography>
                  <Chip
                    size="small"
                    label={`${lastImprovNote.degree} • ${getRoleBadgeLabel(lastImprovNote.role)}`}
                    sx={{
                      fontWeight: 900,
                      height: 24,
                      bgcolor: getRoleChipColor(lastImprovNote.role),
                      color: lastImprovNote.role === 'color' ? '#111' : '#fff',
                    }}
                  />
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary" fontWeight={700} sx={{ fontSize: '0.82rem' }}>
                  {mt.startJammingPrompt}
                </Typography>
              )}
            </Box>
          )}

          {/* Zone 2: Live Detected Note */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <NoteDisplay
              detectedNote={
                !isMicPausedNow && detected && detected.rms >= settings.rmsThreshold
                  ? detected.pitch
                  : null
              }
              targetNoteName={currentTargetAnalyzed ? currentTargetAnalyzed.noteName : ''}
              isCorrect={drillSuccessFlash || (!isDrill && !!lastImprovNote && lastImprovNote.role !== 'outside')}
              isAlmost={stabilityCounter > 0 && stabilityCounter < 100}
              isFailure={drillWrongFlash || (!isDrill && !!lastImprovNote && lastImprovNote.role === 'outside')}
              debug={false}
              rms={isMicPausedNow ? 0 : detected?.rms || 0}
            />
          </Box>

          {/* Zone 3: Input Level + Compact Mic Paused Indicator */}
          <Box sx={{ flex: '1 1 165px', maxWidth: { sm: 230 }, '& > div': { mt: 0 } }}>
            <VuMeter
              rms={isMicPausedNow ? 0 : detected?.rms || 0}
              threshold={settings.rmsThreshold}
            />
            {isMicPausedNow && (
              <Tooltip title={isAuditioning ? mt.previewPausedHint : mt.vampPausedHint}>
                <Chip
                  size="small"
                  color="warning"
                  variant="outlined"
                  icon={<MicOffIcon sx={{ fontSize: '14px !important' }} />}
                  label={isAuditioning ? mt.previewPausedHint : mt.micPaused}
                  sx={{ mt: 0.75, width: '100%', fontWeight: 800, fontSize: '0.68rem', height: 22 }}
                />
              </Tooltip>
            )}
          </Box>
        </Paper>

        {/* Compact Audio, View Switcher & Display Controls Bar */}
        <Paper
          elevation={0}
          sx={{
            px: 1.5,
            py: 0.9,
            borderRadius: 2.5,
            border: '1px solid',
            borderColor: isBackingPlaying || isAuditioning ? 'primary.main' : 'divider',
            bgcolor: isBackingPlaying || isAuditioning ? alpha(theme.palette.primary.main, 0.05) : 'background.paper',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1.25,
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <Button
              variant={isBackingPlaying ? 'contained' : 'outlined'}
              color={isBackingPlaying ? 'error' : 'primary'}
              size="small"
              onClick={toggleBacking}
              startIcon={isBackingPlaying ? <StopIcon /> : <PlayArrowIcon />}
              sx={{ fontWeight: 800, borderRadius: 2, textTransform: 'none', py: 0.35 }}
            >
              {isBackingPlaying ? mt.stopBacking : mt.playBacking}
            </Button>

            <Tooltip title={mt.auditionHint}>
              <Button
                variant={isAuditioning ? 'contained' : 'outlined'}
                color={isAuditioning ? 'warning' : 'primary'}
                size="small"
                onClick={handleAudition}
                startIcon={isAuditioning ? <StopIcon /> : <GraphicEqIcon />}
                sx={{ fontWeight: 800, borderRadius: 2, textTransform: 'none', py: 0.35 }}
              >
                {isAuditioning ? mt.stopAudition : mt.auditionMode}
              </Button>
            </Tooltip>

            <Button
              variant={isMicPausedNow ? 'outlined' : 'contained'}
              color={isMicPausedNow ? 'warning' : 'success'}
              size="small"
              disabled={isAuditioning}
              onClick={() => {
                const nextPaused = !isDetectionPaused;
                setIsDetectionPaused(nextPaused);
                isDetectionPausedRef.current = nextPaused;
                resetDetectionGuards();
              }}
              startIcon={isMicPausedNow ? <MicOffIcon /> : <MicIcon />}
              sx={{ fontWeight: 800, borderRadius: 2, textTransform: 'none', py: 0.35 }}
            >
              {isMicPausedNow
                ? isBackingPlaying
                  ? mt.enablePlayAlong
                  : mt.micPaused
                : mt.micListening}
            </Button>

            {/* Compact Tempo */}
            <Stack
              direction="row"
              spacing={0.25}
              alignItems="center"
              sx={{ px: 0.5, borderRadius: 1.5, border: '1px solid', borderColor: 'divider' }}
            >
              <IconButton size="small" onClick={() => setBpm((b) => Math.max(60, b - 4))} sx={{ p: 0.3 }}>
                <RemoveIcon sx={{ fontSize: 14 }} />
              </IconButton>
              <Typography variant="caption" fontWeight={900} sx={{ minWidth: 48, textAlign: 'center', fontSize: '0.72rem' }}>
                {bpm}
              </Typography>
              <IconButton size="small" onClick={() => setBpm((b) => Math.min(150, b + 4))} sx={{ p: 0.3 }}>
                <AddIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </Stack>

            {/* Compact Volume */}
            <Stack direction="row" spacing={0.75} alignItems="center" sx={{ width: 92 }}>
              <VolumeUpIcon sx={{ fontSize: 16 }} color="action" />
              <Slider
                size="small"
                min={0}
                max={0.8}
                step={0.05}
                value={backingVolume}
                onChange={(_, val) => setBackingVolume(val as number)}
                aria-label="Backing Volume"
              />
            </Stack>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            {isDrill && (
              <ToggleButtonGroup
                size="small"
                exclusive
                value={viewMode}
                onChange={(_, v) => v && setViewMode(v)}
              >
                <ToggleButton value="neck" sx={{ fontWeight: 800, px: 1.1, py: 0.3, textTransform: 'none', fontSize: '0.72rem', gap: 0.4 }}>
                  <PianoIcon sx={{ fontSize: 14 }} />
                  {mt.viewNeck}
                </ToggleButton>
                <ToggleButton value="tab" sx={{ fontWeight: 800, px: 1.1, py: 0.3, textTransform: 'none', fontSize: '0.72rem', gap: 0.4 }}>
                  <QueueMusicIcon sx={{ fontSize: 14 }} />
                  {mt.viewTab}
                </ToggleButton>
                <ToggleButton value="both" sx={{ fontWeight: 800, px: 1.1, py: 0.3, textTransform: 'none', fontSize: '0.72rem', gap: 0.4 }}>
                  <ViewModuleIcon sx={{ fontSize: 14 }} />
                  {mt.viewBoth}
                </ToggleButton>
              </ToggleButtonGroup>
            )}

            <ToggleButtonGroup
              size="small"
              exclusive
              value={labelMode}
              onChange={(_, v) => v && setLabelMode(v)}
            >
              <ToggleButton value="degrees" sx={{ fontWeight: 800, px: 1.1, py: 0.3, textTransform: 'none', fontSize: '0.72rem' }}>
                {mt.showDegrees}
              </ToggleButton>
              <ToggleButton value="notes" sx={{ fontWeight: 800, px: 1.1, py: 0.3, textTransform: 'none', fontSize: '0.72rem' }}>
                {mt.showNotes}
              </ToggleButton>
            </ToggleButtonGroup>
          </Stack>
        </Paper>

        {/* Compact Multi-Chord Progression Strip (only when switching chords) */}
        {modeConfig.progression.length > 1 && (
          <Paper
            elevation={0}
            sx={{
              px: 1.5,
              py: 1,
              borderRadius: 2.5,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1.5,
              flexWrap: 'wrap',
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ flex: 1 }}>
              {modeConfig.progression.map((step, idx) => {
                const isCurrent = idx === activeChordIdx;
                const def = MODE_DEFINITIONS[step.modeId];
                return (
                  <Box
                    key={`${step.chordLabel}-${idx}`}
                    sx={{
                      px: 1.25,
                      py: 0.5,
                      borderRadius: 1.75,
                      border: '2px solid',
                      borderColor: isCurrent ? 'primary.main' : 'divider',
                      bgcolor: isCurrent ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      transition: 'all 0.2s',
                    }}
                  >
                    <Typography variant="caption" fontWeight={900} color={isCurrent ? 'primary.main' : 'text.primary'}>
                      {translateTextWithNotes(step.chordLabel, settings.noteNaming)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, fontSize: '0.68rem' }}>
                      ★{def.colorDegree} • {step.bars} {mt.bars}
                    </Typography>
                  </Box>
                );
              })}
            </Stack>

            <Stack direction="row" spacing={0.6} alignItems="center">
              {[0, 1, 2, 3].map((b) => (
                <Box
                  key={b}
                  sx={{
                    width: 9,
                    height: 9,
                    borderRadius: '50%',
                    bgcolor:
                      isBackingPlaying && beatState.beatInBar === b
                        ? b === 0
                          ? amber
                          : 'primary.main'
                        : 'divider',
                    transform: isBackingPlaying && beatState.beatInBar === b ? 'scale(1.3)' : 'none',
                    transition: 'all 0.1s',
                  }}
                />
              ))}
            </Stack>
          </Paper>
        )}

        {/* Interactive Modal Fretboard (shown in Improv or Drill 'neck' / 'both') */}
        {(!isDrill || viewMode === 'neck' || viewMode === 'both') && (
          <Paper
            elevation={0}
            sx={{
              p: 1.5,
              borderRadius: 3,
              border: '2px solid',
              borderColor: drillWrongFlash
                ? 'error.main'
                : drillSuccessFlash
                ? 'success.main'
                : 'divider',
              bgcolor: 'background.paper',
              transition: 'border-color 0.2s',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 1,
                mb: 0.5,
              }}
            >
              <Typography variant="body2" fontWeight={900}>
                {translateNoteName(activeStep.rootName, settings.noteNaming)} {modeNameLocalized}{' '}
                <Typography component="span" variant="caption" color="text.secondary" fontWeight={700}>
                  ({activeMode.degreeLabels.join(' - ')}) • {modeVibeLocalized}
                </Typography>
              </Typography>

              {/* Inline Legend */}
              <Stack direction="row" spacing={1.25} flexWrap="wrap" alignItems="center">
                <Stack direction="row" spacing={0.4} alignItems="center">
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: 'primary.main' }} />
                  <Typography variant="caption" fontWeight={700} sx={{ fontSize: '0.7rem' }}>
                    {mt.roleRoot}
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={0.4} alignItems="center">
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: 'success.main' }} />
                  <Typography variant="caption" fontWeight={700} sx={{ fontSize: '0.7rem' }}>
                    {mt.roleChord}
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={0.4} alignItems="center">
                  <Box sx={{ width: 10, height: 10, borderRadius: '3px', bgcolor: amber }} />
                  <Typography variant="caption" fontWeight={800} sx={{ fontSize: '0.7rem' }}>
                    {mt.colorNote} ({activeMode.colorDegree})
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={0.4} alignItems="center">
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      border: '2px solid',
                      borderColor: 'text.secondary',
                    }}
                  />
                  <Typography variant="caption" fontWeight={700} sx={{ fontSize: '0.7rem' }}>
                    {mt.roleScale}
                  </Typography>
                </Stack>
              </Stack>
            </Box>

            <ModalFretboard
              step={activeStep}
              isFiveString={settings.isFiveString}
              noteNaming={settings.noteNaming}
              labelMode={labelMode}
              targetMidi={currentTargetMidi}
              targetPosition={currentTargetPosition}
              detectedMidi={liveDetectedMidi}
            />

            {/* Compact Step-by-Step Pattern Ribbon right inside the Drill card */}
            {isDrill && sequence && (
              <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, justifyContent: 'center' }}>
                  {sequence.map((midi, i) => {
                    const info = analyzeMidiInStep(midi, activeStep);
                    const isDone = i < drillIdx;
                    const isActive = i === drillIdx;
                    const noteLabel = translateNoteName(info.noteName, settings.noteNaming);

                    return (
                      <Box
                        key={`${midi}-${i}`}
                        sx={{
                          px: 0.9,
                          py: 0.4,
                          borderRadius: 1.5,
                          minWidth: 42,
                          textAlign: 'center',
                          border: '2px solid',
                          borderColor: isActive
                            ? info.role === 'color'
                              ? amber
                              : 'primary.main'
                            : isDone
                            ? 'success.main'
                            : 'divider',
                          bgcolor: isActive
                            ? alpha(info.role === 'color' ? amber : theme.palette.primary.main, 0.16)
                            : isDone
                            ? alpha(theme.palette.success.main, 0.1)
                            : 'transparent',
                          transform: isActive ? 'scale(1.08)' : 'none',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <Typography variant="caption" fontWeight={900} sx={{ display: 'block', lineHeight: 1.1 }}>
                          {noteLabel}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            display: 'block',
                            fontWeight: 900,
                            fontSize: '0.62rem',
                            lineHeight: 1.1,
                            color: info.role === 'color' ? amber : 'text.secondary',
                          }}
                        >
                          {info.degree}
                          {info.role === 'color' ? '★' : ''}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            )}
          </Paper>
        )}

        {/* Compact Sheet Music / TAB (when Drill 'tab' or 'both') */}
        {isDrill && sequence && (viewMode === 'tab' || viewMode === 'both') && (
          <Box sx={{ opacity: drillWrongFlash ? 0.35 : 1, transition: 'opacity 0.2s' }}>
            <SheetMusic
              midiNotes={sequence}
              currentIndex={drillIdx}
              isFiveString={settings.isFiveString}
              preferNoOpenStrings={true}
              compact={true}
            />
          </Box>
        )}

        {/* Compact Horizontal Improv Mission Bar (Improv Labs only) */}
        {!isDrill && (
          <Paper
            elevation={0}
            sx={{
              p: 1.5,
              borderRadius: 3,
              border: '2px solid',
              borderColor: improvMissionComplete ? 'success.main' : 'divider',
              bgcolor: improvMissionComplete ? alpha(theme.palette.success.main, 0.05) : 'background.paper',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 1.5,
              }}
            >
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center" sx={{ flex: 1 }}>
                <Chip
                  size="small"
                  icon={
                    improvRootHit ? (
                      <CheckCircleIcon color="success" />
                    ) : (
                      <RadioButtonUncheckedIcon color="disabled" />
                    )
                  }
                  label={`${mt.goalHitRoot} (${improvRootHit ? 1 : 0}/1)`}
                  variant={improvRootHit ? 'filled' : 'outlined'}
                  color={improvRootHit ? 'success' : 'default'}
                  sx={{ fontWeight: 800, borderRadius: 1.5 }}
                />

                <Chip
                  size="small"
                  icon={
                    improvChordTonesHit.length >= goals.requireChordTones ? (
                      <CheckCircleIcon color="success" />
                    ) : (
                      <RadioButtonUncheckedIcon color="disabled" />
                    )
                  }
                  label={`${mt.goalChordTones} (${Math.min(improvChordTonesHit.length, goals.requireChordTones)}/${goals.requireChordTones})`}
                  variant={improvChordTonesHit.length >= goals.requireChordTones ? 'filled' : 'outlined'}
                  color={improvChordTonesHit.length >= goals.requireChordTones ? 'success' : 'default'}
                  sx={{ fontWeight: 800, borderRadius: 1.5 }}
                />

                <Chip
                  size="small"
                  icon={
                    improvColorHits >= goals.minColorNoteHits ? (
                      <CheckCircleIcon sx={{ color: `${amber} !important` }} />
                    ) : (
                      <RadioButtonUncheckedIcon color="disabled" />
                    )
                  }
                  label={`${mt.goalColorNote} (${activeMode.colorDegree}) ${Math.min(improvColorHits, goals.minColorNoteHits)}/${goals.minColorNoteHits}`}
                  variant="outlined"
                  sx={{
                    fontWeight: 800,
                    borderRadius: 1.5,
                    borderColor: improvColorHits >= goals.minColorNoteHits ? amber : undefined,
                    bgcolor: improvColorHits >= goals.minColorNoteHits ? alpha(amber, 0.14) : 'transparent',
                  }}
                />

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 165 }}>
                  <Typography variant="caption" fontWeight={900} noWrap>
                    {mt.goalInModeNotes}: {Math.min(improvInModeCount, goals.minInModeNotes)}/{goals.minInModeNotes}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(100, (improvInModeCount / goals.minInModeNotes) * 100)}
                    color={improvInModeCount >= goals.minInModeNotes ? 'success' : 'primary'}
                    sx={{ flex: 1, minWidth: 55, height: 6, borderRadius: 3 }}
                  />
                </Box>
              </Stack>

              <Button
                variant="contained"
                size="small"
                color={improvMissionComplete ? 'success' : 'primary'}
                disabled={totalImprovPlayed < 4}
                startIcon={<FlagIcon />}
                onClick={completeImprovSession}
                sx={{ fontWeight: 900, borderRadius: 2, px: 2.25, py: 0.75, textTransform: 'none', flexShrink: 0 }}
              >
                {improvMissionComplete ? mt.finishMissionComplete : mt.finishJam}
              </Button>
            </Box>
          </Paper>
        )}
      </Stack>
    </Container>
  );
};

export default ModeSessionRunner;
