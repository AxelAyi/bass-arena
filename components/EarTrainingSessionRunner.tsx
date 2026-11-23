import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Container,
  Paper,
  Stack,
  alpha,
  useTheme,
  Fade,
  CircularProgress,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Divider,
  Collapse,
  keyframes,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PlayCircleFilledIcon from '@mui/icons-material/PlayCircleFilled';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopCircleIcon from '@mui/icons-material/StopCircle';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import HearingIcon from '@mui/icons-material/Hearing';
import ReplayIcon from '@mui/icons-material/Replay';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import ShuffleIcon from '@mui/icons-material/Shuffle';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import SchoolIcon from '@mui/icons-material/School';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

import { useStore } from '../state/store';
import { AudioEngine, AudioStats } from '../audio/audioEngine';
import { EarTrainingPlayer, EarInstrument } from '../audio/earTrainingAudio';
import { NOTE_NAMES_ENGLISH, translateNoteName, translateTextWithNotes, validateNote } from '../audio/noteUtils';
import { getEarTrainingBriefing } from '../data/earTrainingBriefings';
import { translations } from '../localization/translations';
import ScoreSummary from './ScoreSummary';
import VuMeter from './VuMeter';
import NoteDisplay from './NoteDisplay';

const notePulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.12); }
  100% { transform: scale(1); }
`;

interface EarTrainingSessionRunnerProps {
  day: number;
  title: string;
  description: string;
  sequence: number[];
  durations?: number[];
  onFinish: () => void;
  onReplay?: () => void;
  onNext?: { label: string; action: () => void };
  programId: string;
}

function getIntervalShortLabel(semitones: number): string {
  if (semitones === 0) return '1';
  const sign = semitones < 0 ? '-' : '+';
  const abs = Math.abs(semitones);
  const octaves = Math.floor(abs / 12);
  const rem = abs % 12;
  const names = ['1', 'm2', 'M2', 'm3', 'M3', 'P4', 'TT', 'P5', 'm6', 'M6', 'm7', 'M7'];
  if (rem === 0) {
    return `${sign}${octaves}Oct`;
  }
  if (octaves === 0) {
    return semitones > 0 ? names[rem] : `-${names[rem]}`;
  }
  return `${sign}${names[rem]}+${octaves}o`;
}

const EarTrainingSessionRunner: React.FC<EarTrainingSessionRunnerProps> = ({
  day,
  title,
  description,
  sequence,
  durations,
  onFinish,
  onReplay,
  onNext,
  programId,
}) => {
  const { settings, addSessionResult } = useStore();
  const theme = useTheme();
  const et = translations[settings.language].earTraining;
  const isDark = theme.palette.mode === 'dark';

  const [hasStarted, setHasStarted] = useState(false);
  const [showTheoryDrawer, setShowTheoryDrawer] = useState(false);
  const [gameState, setGameState] = useState<'IDLE' | 'PLAYING_REF' | 'USER_TURN' | 'FINISHED'>('IDLE');
  const [detected, setDetected] = useState<AudioStats | null>(null);
  const [feedback, setFeedback] = useState<string>('');
  const [pitchDirection, setPitchDirection] = useState<'higher' | 'lower' | null>(null);
  const [currentNoteIndex, setCurrentNoteIndex] = useState(0);
  const [playingNoteIndex, setPlayingNoteIndex] = useState<number | null>(null);
  const [stabilityCounter, setStabilityCounter] = useState(0);
  const [isResetting, setIsResetting] = useState(false);

  // Player controls
  const [playbackSpeed, setPlaybackSpeed] = useState<0.75 | 1 | 1.25>(1);
  const [instrument, setInstrument] = useState<EarInstrument>('bass');
  const [isStrictMode, setIsStrictMode] = useState<boolean>(false);
  const [showFirstNoteHint, setShowFirstNoteHint] = useState<boolean>(false);
  const [isAuditioningSingle, setIsAuditioningSingle] = useState<boolean>(false);

  // Scoring / Performance Refs
  const turnStartTimeRef = useRef<number>(0);
  const mistakesRef = useRef<number>(0);
  const lastMistakeTimeRef = useRef<number>(0);
  const finalMetricsRef = useRef({ score: 0, totalTime: 0, mistakes: 0, accuracy: 100 });

  // Dynamic sequence state
  const [activeSequence, setActiveSequence] = useState<number[]>([]);

  const audioEngineRef = useRef<AudioEngine | null>(null);
  const playerRef = useRef<EarTrainingPlayer | null>(null);
  const isPlaybackActiveRef = useRef<boolean>(false);
  const stabilityCheckRef = useRef<number | null>(null);
  const wrongNoteCheckRef = useRef<number | null>(null);

  // Refractory and Attack logic refs
  const isWaitingForNewAttackRef = useRef<boolean>(false);
  const lastCaughtMidiRef = useRef<number | null>(null);
  const peakRmsSinceCaptureRef = useRef<number>(0);
  const lastCaptureTimeRef = useRef<number>(0);
  const currentNoteIdxRef = useRef<number>(0);

  const processRef = useRef<(stats: AudioStats) => void>(() => {});

  useEffect(() => {
    currentNoteIdxRef.current = currentNoteIndex;
  }, [currentNoteIndex]);

  const getPlayer = useCallback(() => {
    if (!playerRef.current) {
      playerRef.current = new EarTrainingPlayer();
    }
    return playerRef.current;
  }, []);

  const randomizeSequenceRoot = useCallback(
    (baseSeq: number[]) => {
      if (baseSeq.length === 0) return [];
      const minMidi = Math.min(...baseSeq);
      const maxMidi = Math.max(...baseSeq);
      // Keep melodies in a clear, resonant bass range (avoid sub-muddy low frets where possible)
      const BASS_MIN = settings.isFiveString ? 28 : 30;
      const BASS_MAX = 54;
      let minShift = BASS_MIN - minMidi;
      let maxShift = BASS_MAX - maxMidi;
      if (minShift > maxShift) {
        minShift = (settings.isFiveString ? 23 : 28) - minMidi;
        maxShift = 58 - maxMidi;
      }
      if (minShift > maxShift) return [...baseSeq];
      const shift = Math.floor(Math.random() * (maxShift - minShift + 1)) + minShift;
      return baseSeq.map((n) => n + shift);
    },
    [settings.isFiveString]
  );

  useEffect(() => {
    setActiveSequence(randomizeSequenceRoot(sequence));
  }, [sequence, randomizeSequenceRoot]);

  const stopMic = useCallback(async () => {
    if (audioEngineRef.current) {
      await audioEngineRef.current.stop();
      audioEngineRef.current = null;
    }
  }, []);

  const ensureMicStarted = useCallback(async () => {
    if (!audioEngineRef.current) {
      audioEngineRef.current = new AudioEngine((stats) => processRef.current(stats));
      try {
        await audioEngineRef.current.start(settings.selectedMicId);
      } catch (err) {
        console.error('Failed to start mic', err);
      }
    }
  }, [settings.selectedMicId]);

  useEffect(() => {
    return () => {
      playerRef.current?.dispose();
      playerRef.current = null;
      stopMic();
    };
  }, [stopMic]);

  const handleExit = useCallback(() => {
    isPlaybackActiveRef.current = false;
    playerRef.current?.stop();
    stopMic();
    onFinish();
  }, [onFinish, stopMic]);

  const validateFullSequence = useCallback(() => {
    const totalTime = turnStartTimeRef.current > 0 ? (Date.now() - turnStartTimeRef.current) / 1000 : 1;
    const mistakes = mistakesRef.current;
    const parTime = activeSequence.length * (2.6 / playbackSpeed);
    const timePenalty = Math.max(0, (totalTime - parTime) * 1.5);
    const finalScore = Math.max(10, Math.round(100 - mistakes * 10 - timePenalty));
    const accuracy = mistakes === 0 ? 100 : Math.max(20, Math.round(100 - mistakes * 12));

    finalMetricsRef.current = { score: finalScore, totalTime, mistakes, accuracy };
    setGameState('FINISHED');
    setFeedback(et.feedbackPerfect);
    setPitchDirection(null);
    stopMic();

    if (activeSequence.length > 0) {
      getPlayer().playSuccessChord(activeSequence[0]);
    }

    addSessionResult({
      date: new Date().toISOString(),
      score: finalScore,
      accuracy,
      avgTime: totalTime / (activeSequence.length || 1),
      day,
      programId,
      wasBeginnerMode: showFirstNoteHint,
    });
  }, [activeSequence, playbackSpeed, et.feedbackPerfect, stopMic, getPlayer, addSessionResult, day, programId, showFirstNoteHint]);

  const triggerNextNote = useCallback(
    (midi: number, rms: number) => {
      const now = Date.now();
      if (now - lastCaptureTimeRef.current < 150) return;

      const nextIndex = currentNoteIdxRef.current + 1;
      lastCaughtMidiRef.current = midi;
      lastCaptureTimeRef.current = now;
      isWaitingForNewAttackRef.current = true;
      peakRmsSinceCaptureRef.current = rms;

      setCurrentNoteIndex(nextIndex);
      setStabilityCounter(0);
      setPitchDirection(null);
      stabilityCheckRef.current = null;
      wrongNoteCheckRef.current = null;

      if (nextIndex >= activeSequence.length) {
        validateFullSequence();
      } else {
        setFeedback(et.feedbackNoteCaught);
      }
    },
    [activeSequence.length, validateFullSequence, et.feedbackNoteCaught]
  );

  const handleAudioProcess = useCallback(
    (stats: AudioStats) => {
      if (isPlaybackActiveRef.current) return;
      setDetected(stats);

      const isActive = stats.rms >= settings.rmsThreshold;
      if (!isActive) {
        setStabilityCounter(0);
        stabilityCheckRef.current = null;
        wrongNoteCheckRef.current = null;
        isWaitingForNewAttackRef.current = false;
        return;
      }

      if (!stats.pitch) {
        setStabilityCounter(0);
        stabilityCheckRef.current = null;
        return;
      }

      const speedMultiplier = playbackSpeed === 1.25 ? 0.8 : playbackSpeed === 0.75 ? 1.1 : 1.0;
      const effectiveStabilityMs = Math.max(15, settings.stabilityMs * speedMultiplier);
      const effectiveWrongNoteMs = Math.max(120, 220 * speedMultiplier);

      if (isWaitingForNewAttackRef.current) {
        const isNewPluck = !!stats.isOnset;
        const isPitchChanged =
          lastCaughtMidiRef.current !== null && Math.abs(stats.pitch.midi - lastCaughtMidiRef.current) > 0.8;
        const isVolumeDip =
          peakRmsSinceCaptureRef.current > 0 && stats.rms < peakRmsSinceCaptureRef.current * 0.58;

        if (isNewPluck || isPitchChanged || isVolumeDip) {
          isWaitingForNewAttackRef.current = false;
          peakRmsSinceCaptureRef.current = stats.rms;
        } else {
          peakRmsSinceCaptureRef.current = Math.max(peakRmsSinceCaptureRef.current, stats.rms);
          return;
        }
      }

      const idx = currentNoteIdxRef.current;
      const targetMidi = activeSequence[idx];
      if (targetMidi === undefined) return;

      const isValid = validateNote(stats.pitch.midi, targetMidi, settings.strictOctave);

      if (isValid) {
        wrongNoteCheckRef.current = null;
        setPitchDirection(null);

        if (stats.rmsDerivative && stats.rmsDerivative < -0.001 && stabilityCheckRef.current === null) {
          return;
        }

        const isClearTransition =
          lastCaughtMidiRef.current !== null && Math.abs(stats.pitch.midi - lastCaughtMidiRef.current) > 0.8;

        if (isClearTransition) {
          triggerNextNote(stats.pitch.midi, stats.rms);
          return;
        }

        if (stabilityCheckRef.current === null) {
          stabilityCheckRef.current = Date.now();
          setFeedback(idx > 0 ? et.feedbackAlmost : et.feedbackStart);
          setIsResetting(false);
        } else {
          const elapsed = Date.now() - stabilityCheckRef.current;
          const progress = Math.min(100, (elapsed / effectiveStabilityMs) * 100);
          setStabilityCounter(progress);

          if (elapsed >= effectiveStabilityMs) {
            triggerNextNote(stats.pitch.midi, stats.rms);
          }
        }
      } else {
        // Ignore sustain tail of previously caught note
        if (idx > 0) {
          const previousMidi = activeSequence[idx - 1];
          const isJustSustainOfPrevious = validateNote(stats.pitch.midi, previousMidi, settings.strictOctave);
          if (isJustSustainOfPrevious && !stats.isOnset) {
            setStabilityCounter(0);
            stabilityCheckRef.current = null;
            return;
          }
        }

        setStabilityCounter(0);
        stabilityCheckRef.current = null;

        if (wrongNoteCheckRef.current === null) {
          wrongNoteCheckRef.current = Date.now();
        } else if (Date.now() - wrongNoteCheckRef.current > effectiveWrongNoteMs) {
          const direction = stats.pitch.midi < targetMidi ? 'higher' : 'lower';
          setPitchDirection(direction);

          const now = Date.now();
          if (now - lastMistakeTimeRef.current > 900) {
            mistakesRef.current += 1;
            lastMistakeTimeRef.current = now;
          }

          if (isStrictMode && idx > 0) {
            setCurrentNoteIndex(0);
            setFeedback(et.feedbackWrong);
            setIsResetting(true);
            isWaitingForNewAttackRef.current = false;
            lastCaughtMidiRef.current = null;
            setTimeout(() => setIsResetting(false), 1100);
          } else {
            setFeedback(direction === 'higher' ? et.goHigher : et.goLower);
          }
          wrongNoteCheckRef.current = null;
        }
      }
    },
    [activeSequence, settings, et, playbackSpeed, isStrictMode, triggerNextNote]
  );

  useEffect(() => {
    processRef.current = (stats: AudioStats) => {
      if (gameState === 'USER_TURN' && !isPlaybackActiveRef.current) {
        handleAudioProcess(stats);
      } else if (!isPlaybackActiveRef.current) {
        setDetected(stats);
      }
    };
  }, [handleAudioProcess, gameState]);

  const playReference = async (resetProgress = false) => {
    if (activeSequence.length === 0) return;

    isPlaybackActiveRef.current = true;
    setGameState('PLAYING_REF');
    setPlayingNoteIndex(null);
    setFeedback('');
    setPitchDirection(null);
    setStabilityCounter(0);
    setIsResetting(false);
    isWaitingForNewAttackRef.current = false;
    lastCaughtMidiRef.current = null;
    peakRmsSinceCaptureRef.current = 0;
    lastCaptureTimeRef.current = 0;

    if (resetProgress) {
      setCurrentNoteIndex(0);
      mistakesRef.current = 0;
    }

    const completed = await getPlayer().playMelody(
      activeSequence,
      durations,
      playbackSpeed,
      instrument,
      (noteIdx) => setPlayingNoteIndex(noteIdx)
    );

    setPlayingNoteIndex(null);
    if (!completed) {
      isPlaybackActiveRef.current = false;
      return;
    }

    await ensureMicStarted();
    // Brief settle window so speaker resonance doesn't trip the mic
    window.setTimeout(() => {
      isPlaybackActiveRef.current = false;
      if (turnStartTimeRef.current === 0 || resetProgress) {
        turnStartTimeRef.current = Date.now();
      }
      setGameState('USER_TURN');
    }, 160);
  };

  const stopPlaybackNow = () => {
    getPlayer().stop();
    setPlayingNoteIndex(null);
    isPlaybackActiveRef.current = false;
    ensureMicStarted().then(() => {
      if (turnStartTimeRef.current === 0) {
        turnStartTimeRef.current = Date.now();
      }
      setGameState('USER_TURN');
    });
  };

  const handleAuditionNote = async (midi: number) => {
    isPlaybackActiveRef.current = true;
    setIsAuditioningSingle(true);
    await getPlayer().playSingleNote(midi, instrument, 0.85);
    window.setTimeout(() => {
      isPlaybackActiveRef.current = false;
      setIsAuditioningSingle(false);
    }, 140);
  };

  const handleNewKey = () => {
    getPlayer().stop();
    isPlaybackActiveRef.current = false;
    setPlayingNoteIndex(null);
    setCurrentNoteIndex(0);
    setStabilityCounter(0);
    setFeedback('');
    setPitchDirection(null);
    setIsResetting(false);
    mistakesRef.current = 0;
    turnStartTimeRef.current = 0;
    setActiveSequence(randomizeSequenceRoot(sequence));
    setGameState('IDLE');
  };

  const handleFullReplay = () => {
    getPlayer().stop();
    setActiveSequence(randomizeSequenceRoot(sequence));
    setCurrentNoteIndex(0);
    mistakesRef.current = 0;
    turnStartTimeRef.current = 0;
    setGameState('IDLE');
    onReplay?.();
  };

  const firstNoteLabel = useMemo(() => {
    if (activeSequence.length === 0) return '--';
    const raw = NOTE_NAMES_ENGLISH[activeSequence[0] % 12];
    return translateNoteName(raw, settings.noteNaming);
  }, [activeSequence, settings.noteNaming]);

  const briefing = useMemo(() => {
    const raw = getEarTrainingBriefing(day, sequence, description, settings.language);
    return {
      tier: raw.tier,
      theoryTip: translateTextWithNotes(raw.theoryTip, settings.noteNaming),
      musicalValue: translateTextWithNotes(raw.musicalValue, settings.noteNaming),
      listeningTip: translateTextWithNotes(raw.listeningTip, settings.noteNaming),
    };
  }, [day, sequence, description, settings.language, settings.noteNaming]);

  const uniqueIntervals = useMemo(() => {
    if (sequence.length === 0) return [];
    const root = sequence[0];
    const diffs = Array.from(new Set(sequence.map((m) => m - root))).sort((a, b) => a - b);
    return diffs.map((d) => getIntervalShortLabel(d));
  }, [sequence]);

  const tierMeta = useMemo(() => {
    switch (briefing.tier) {
      case 'beginner':
        return { label: et.tierBeginner, color: 'success' as const };
      case 'intermediate':
        return { label: et.tierIntermediate, color: 'info' as const };
      case 'advanced':
        return { label: et.tierAdvanced, color: 'warning' as const };
      default:
        return { label: et.tierElite, color: 'secondary' as const };
    }
  }, [briefing.tier, et]);

  if (gameState === 'FINISHED') {
    const showNext = onNext && finalMetricsRef.current.accuracy >= settings.minUnlockAccuracy;
    return (
      <ScoreSummary
        result={{
          title,
          score: finalMetricsRef.current.score,
          totalTime: finalMetricsRef.current.totalTime,
          mistakes: finalMetricsRef.current.mistakes,
          accuracy: finalMetricsRef.current.accuracy,
          avgTime: finalMetricsRef.current.totalTime / (activeSequence.length || 1),
          isEarTraining: true,
          failedNotes: [],
        }}
        onClose={handleExit}
        onReplay={handleFullReplay}
        onNext={showNext ? onNext : undefined}
      />
    );
  }

  // Pre-session Theory & Ear Focus Briefing
  if (!hasStarted) {
    const amber = '#ffb300';
    return (
      <Fade in={true} timeout={350}>
        <Container maxWidth="md" sx={{ py: 2 }}>
          <Stack spacing={2.25}>
            {/* Header with Tier & Exercise Badges + Exit */}
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
                    color={tierMeta.color}
                    label={tierMeta.label}
                    sx={{ fontWeight: 900, borderRadius: 1.5 }}
                  />
                  <Chip
                    size="small"
                    variant="outlined"
                    color="primary"
                    label={`${sequence.length} ${et.notesLabel.toLowerCase()}`}
                    sx={{ fontWeight: 800, borderRadius: 1.5 }}
                  />
                  <Chip
                    size="small"
                    variant="outlined"
                    icon={<ShuffleIcon sx={{ fontSize: '14px !important' }} />}
                    label={et.randomKeyBadge}
                    sx={{ fontWeight: 700, borderRadius: 1.5 }}
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
                {et.exitSession}
              </Button>
            </Box>

            {/* Theory Tip, Musical Value & Listening Strategy Card */}
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2.25, sm: 3 },
                borderRadius: 3,
                border: '1px solid',
                borderColor: alpha(theme.palette.primary.main, 0.3),
                bgcolor: alpha(theme.palette.primary.main, isDark ? 0.08 : 0.04),
              }}
            >
              <Stack spacing={2}>
                <Box>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.75 }}>
                    <SchoolIcon color="primary" fontSize="small" />
                    <Typography variant="subtitle1" fontWeight={900} color="primary">
                      {et.briefingTitle}
                    </Typography>
                  </Stack>
                  <Typography variant="body1" sx={{ lineHeight: 1.65, fontWeight: 500 }}>
                    {briefing.theoryTip}
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
                        color: isDark ? amber : '#b26a00',
                        display: 'block',
                        mb: 0.25,
                      }}
                    >
                      {et.whyItMatters}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                      {briefing.musicalValue}
                    </Typography>
                  </Box>
                </Box>

                <Divider />

                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                  <HearingIcon color="secondary" sx={{ mt: 0.25, flexShrink: 0 }} fontSize="small" />
                  <Box>
                    <Typography
                      variant="caption"
                      fontWeight={900}
                      color="secondary"
                      sx={{
                        textTransform: 'uppercase',
                        letterSpacing: 1,
                        display: 'block',
                        mb: 0.25,
                      }}
                    >
                      {et.listeningTipTitle}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                      {briefing.listeningTip}
                    </Typography>
                  </Box>
                </Box>

                {/* Interval Vocabulary Preview (sorted, spoiler-free) */}
                {uniqueIntervals.length > 0 && (
                  <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap sx={{ pt: 0.5 }}>
                    <Typography
                      variant="caption"
                      fontWeight={800}
                      color="text.secondary"
                      sx={{ textTransform: 'uppercase', letterSpacing: 0.8, mr: 0.5 }}
                    >
                      {et.intervalsInPhrase}:
                    </Typography>
                    {uniqueIntervals.map((iv) => (
                      <Chip
                        key={iv}
                        size="small"
                        label={iv}
                        sx={{
                          fontWeight: 900,
                          height: 22,
                          fontSize: '0.72rem',
                          borderRadius: 1.5,
                          bgcolor: iv === '1' ? alpha(theme.palette.primary.main, 0.16) : 'background.paper',
                          color: iv === '1' ? 'primary.main' : 'text.primary',
                          border: '1px solid',
                          borderColor: iv === '1' ? alpha(theme.palette.primary.main, 0.4) : 'divider',
                        }}
                      />
                    ))}
                  </Stack>
                )}
              </Stack>
            </Paper>

            {/* 3-Step Flow Strip */}
            <Paper
              elevation={0}
              sx={{
                px: 2,
                py: 1.25,
                borderRadius: 2.5,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
              }}
            >
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1.5}
                alignItems={{ xs: 'flex-start', sm: 'center' }}
                justifyContent="space-around"
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <VolumeUpIcon color="primary" fontSize="small" />
                  <Typography variant="body2" fontWeight={800}>
                    {et.step1Listen}
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                  <HearingIcon color="secondary" fontSize="small" />
                  <Typography variant="body2" fontWeight={800}>
                    {et.step2Find}
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                  <MicIcon color="success" fontSize="small" />
                  <Typography variant="body2" fontWeight={800}>
                    {et.step3Play}
                  </Typography>
                </Stack>
              </Stack>
            </Paper>

            {/* Primary CTA */}
            <Box sx={{ display: 'flex', justifyContent: 'center', pt: 0.5 }}>
              <Button
                variant="contained"
                size="large"
                startIcon={<PlayArrowIcon />}
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  setHasStarted(true);
                }}
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
                {et.readyToPlay}
              </Button>
            </Box>
          </Stack>
        </Container>
      </Fade>
    );
  }

  const speedOptions: (0.75 | 1 | 1.25)[] = [0.75, 1, 1.25];
  const isMicPaused = gameState !== 'USER_TURN' || isAuditioningSingle;

  return (
    <Container maxWidth="md" sx={{ py: 1.5 }}>
      <Stack spacing={2}>
        {/* Header Bar */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1.5, flexWrap: 'wrap' }}>
          <Box>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mb: 0.5 }}>
              <Typography variant="h5" fontWeight={900} color="primary" sx={{ letterSpacing: -0.5 }}>
                {title}
              </Typography>
              <Chip
                size="small"
                variant="outlined"
                color="primary"
                label={`${activeSequence.length} ${et.notesLabel.toLowerCase()}`}
                sx={{ fontWeight: 800, height: 22, fontSize: '0.72rem' }}
              />
            </Stack>
            <Typography variant="body2" color="text.secondary">
              {description}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <Button
              size="small"
              variant={showTheoryDrawer ? 'contained' : 'outlined'}
              color="primary"
              startIcon={<SchoolIcon fontSize="small" />}
              endIcon={showTheoryDrawer ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
              onClick={() => setShowTheoryDrawer((prev) => !prev)}
              sx={{ fontWeight: 800, borderRadius: 2, textTransform: 'none' }}
            >
              {et.theoryAndTipBtn}
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              size="small"
              startIcon={<ArrowBackIcon />}
              onClick={handleExit}
              sx={{ fontWeight: 800, borderRadius: 2, textTransform: 'none' }}
            >
              {et.exitSession}
            </Button>
          </Stack>
        </Box>

        {/* Collapsible In-Session Theory & Listening Tip Drawer */}
        <Collapse in={showTheoryDrawer}>
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
            <Stack spacing={1.25}>
              <Typography variant="body2" sx={{ lineHeight: 1.55 }}>
                <strong>{et.briefingTitle}:</strong> {briefing.theoryTip}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55 }}>
                <strong>{et.listeningTipTitle}:</strong> {briefing.listeningTip}
              </Typography>
            </Stack>
          </Paper>
        </Collapse>

        {/* Compact Studio Control Strip: Instrument | Speed | Guided/Strict */}
        <Paper
          elevation={0}
          sx={{
            p: 1.25,
            px: 1.75,
            borderRadius: 2.5,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1.5,
          }}
        >
          {/* Sound Voice Picker */}
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <Typography variant="caption" fontWeight={900} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.8 }}>
              {et.soundLabel}:
            </Typography>
            <ToggleButtonGroup
              size="small"
              exclusive
              value={instrument}
              onChange={(_, v) => v && setInstrument(v)}
            >
              <ToggleButton value="bass" sx={{ fontWeight: 800, textTransform: 'none', px: 1.25, py: 0.3, fontSize: '0.74rem' }}>
                {et.voiceBass}
              </ToggleButton>
              <ToggleButton value="upright" sx={{ fontWeight: 800, textTransform: 'none', px: 1.25, py: 0.3, fontSize: '0.74rem' }}>
                {et.voiceUpright}
              </ToggleButton>
              <ToggleButton value="epiano" sx={{ fontWeight: 800, textTransform: 'none', px: 1.25, py: 0.3, fontSize: '0.74rem' }}>
                {et.voiceEpiano}
              </ToggleButton>
            </ToggleButtonGroup>
          </Stack>

          {/* Speed & Mode */}
          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
            <ToggleButtonGroup
              size="small"
              exclusive
              value={playbackSpeed}
              onChange={(_, v) => v && setPlaybackSpeed(v)}
            >
              {speedOptions.map((s) => (
                <ToggleButton key={s} value={s} sx={{ fontWeight: 800, px: 1, py: 0.3, fontSize: '0.74rem' }}>
                  {s}x
                </ToggleButton>
              ))}
            </ToggleButtonGroup>

            <Tooltip title={isStrictMode ? et.modeStrictHint : et.modeGuidedHint}>
              <ToggleButtonGroup
                size="small"
                exclusive
                value={isStrictMode ? 'strict' : 'guided'}
                onChange={(_, v) => v && setIsStrictMode(v === 'strict')}
              >
                <ToggleButton value="guided" sx={{ fontWeight: 800, textTransform: 'none', px: 1.25, py: 0.3, fontSize: '0.74rem' }}>
                  {et.modeGuided}
                </ToggleButton>
                <ToggleButton value="strict" sx={{ fontWeight: 800, textTransform: 'none', px: 1.25, py: 0.3, fontSize: '0.74rem' }}>
                  {et.modeStrict}
                </ToggleButton>
              </ToggleButtonGroup>
            </Tooltip>
          </Stack>
        </Paper>

        {/* Main Interactive Stage */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, sm: 3 },
            borderRadius: 3.5,
            bgcolor: alpha(theme.palette.primary.main, isDark ? 0.05 : 0.025),
            border: '2px solid',
            borderColor: isResetting
              ? 'error.main'
              : gameState === 'PLAYING_REF'
              ? 'warning.main'
              : gameState === 'USER_TURN'
              ? alpha(theme.palette.primary.main, 0.5)
              : 'divider',
            transition: 'border-color 0.25s ease',
          }}
        >
          <Stack spacing={2.5} alignItems="center">
            {/* Live Interactive Melody Sequence Slots */}
            <Box sx={{ width: '100%', textAlign: 'center' }}>
              <Stack direction="row" spacing={1} justifyContent="center" alignItems="center" sx={{ mb: 1.25 }} flexWrap="wrap" useFlexGap>
                <Typography variant="caption" fontWeight={900} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
                  {gameState === 'PLAYING_REF' && playingNoteIndex !== null
                    ? et.playingStep
                        .replace('{current}', String(playingNoteIndex + 1))
                        .replace('{total}', String(activeSequence.length))
                    : `${et.progressLabel}: ${currentNoteIndex} / ${activeSequence.length}`}
                </Typography>
                {showFirstNoteHint && activeSequence.length > 0 && (
                  <Chip
                    size="small"
                    icon={<MusicNoteIcon sx={{ fontSize: '14px !important' }} />}
                    label={`${et.startNoteBadge}: ${firstNoteLabel}`}
                    color="info"
                    variant="outlined"
                    sx={{ fontWeight: 900, height: 22, fontSize: '0.72rem' }}
                  />
                )}
              </Stack>

              <Box
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                  gap: 1,
                }}
              >
                {activeSequence.map((midi, i) => {
                  const isPlayingThis = gameState === 'PLAYING_REF' && playingNoteIndex === i;
                  const isCaught = i < currentNoteIndex;
                  const isCurrentTarget = gameState === 'USER_TURN' && i === currentNoteIndex;
                  const showNoteName = isCaught || (i === 0 && showFirstNoteHint);
                  const noteLabel = translateNoteName(NOTE_NAMES_ENGLISH[midi % 12], settings.noteNaming);
                  const intervalLabel = getIntervalShortLabel(midi - activeSequence[0]);
                  const canAuditionTile = (isCaught || i === 0) && gameState !== 'PLAYING_REF';

                  return (
                    <Box
                      key={i}
                      onClick={() => canAuditionTile && handleAuditionNote(midi)}
                      sx={{
                        minWidth: activeSequence.length > 10 ? 44 : 52,
                        height: 52,
                        px: 0.75,
                        borderRadius: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px solid',
                        cursor: canAuditionTile ? 'pointer' : 'default',
                        borderColor: isPlayingThis
                          ? 'warning.main'
                          : isCaught
                          ? 'success.main'
                          : isCurrentTarget
                          ? (isResetting || pitchDirection ? 'error.main' : 'primary.main')
                          : 'divider',
                        bgcolor: isPlayingThis
                          ? alpha(theme.palette.warning.main, 0.22)
                          : isCaught
                          ? alpha(theme.palette.success.main, 0.14)
                          : isCurrentTarget
                          ? alpha(theme.palette.primary.main, 0.12)
                          : 'background.paper',
                        animation: isPlayingThis ? `${notePulse} 0.45s ease-in-out` : 'none',
                        transform: isPlayingThis || isCurrentTarget ? 'scale(1.06)' : 'none',
                        boxShadow: isPlayingThis
                          ? `0 0 14px ${alpha(theme.palette.warning.main, 0.45)}`
                          : isCurrentTarget
                          ? `0 0 12px ${alpha(theme.palette.primary.main, 0.3)}`
                          : 'none',
                        transition: 'all 0.18s ease',
                        userSelect: 'none',
                      }}
                    >
                      <Typography
                        variant="body2"
                        fontWeight={900}
                        sx={{
                          lineHeight: 1.1,
                          color: isPlayingThis
                            ? 'warning.main'
                            : isCaught
                            ? 'success.main'
                            : isCurrentTarget
                            ? 'primary.main'
                            : 'text.secondary',
                        }}
                      >
                        {showNoteName ? noteLabel : i + 1}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          fontSize: '0.62rem',
                          fontWeight: 800,
                          lineHeight: 1,
                          mt: 0.25,
                          opacity: isCaught ? 0.9 : 0.45,
                          color: isCaught ? 'success.main' : 'text.secondary',
                        }}
                      >
                        {isCaught ? intervalLabel : isPlayingThis ? '♪' : '•'}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            </Box>

            {/* IDLE STATE */}
            {gameState === 'IDLE' && activeSequence.length > 0 && (
              <Stack spacing={2.5} alignItems="center" sx={{ py: 1.5 }}>
                <Typography variant="body1" fontWeight={700} color="text.secondary" textAlign="center">
                  {et.listenPrompt}
                </Typography>

                <Stack direction="row" spacing={1.5} flexWrap="wrap" justifyContent="center" useFlexGap>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={() => playReference(true)}
                    startIcon={<PlayCircleFilledIcon />}
                    sx={{ px: 4, py: 1.35, borderRadius: 2.5, fontWeight: 900, textTransform: 'none', fontSize: '1rem' }}
                  >
                    {et.playMelody}
                  </Button>

                  <Button
                    variant="outlined"
                    size="large"
                    onClick={() => handleAuditionNote(activeSequence[0])}
                    startIcon={<VolumeUpIcon />}
                    sx={{ px: 2.5, py: 1.35, borderRadius: 2.5, fontWeight: 800, textTransform: 'none' }}
                  >
                    {et.hearFirstNote}
                  </Button>
                </Stack>

                <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="center" useFlexGap>
                  <Chip
                    size="small"
                    icon={showFirstNoteHint ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                    label={showFirstNoteHint ? et.hideFirstNote : et.showFirstNote}
                    onClick={() => setShowFirstNoteHint((v) => !v)}
                    variant={showFirstNoteHint ? 'filled' : 'outlined'}
                    color={showFirstNoteHint ? 'info' : 'default'}
                    sx={{ fontWeight: 800, borderRadius: 1.5 }}
                  />
                  <Chip
                    size="small"
                    icon={<ShuffleIcon fontSize="small" />}
                    label={et.newKey}
                    onClick={handleNewKey}
                    variant="outlined"
                    sx={{ fontWeight: 800, borderRadius: 1.5 }}
                  />
                </Stack>
              </Stack>
            )}

            {/* PLAYING REFERENCE STATE */}
            {gameState === 'PLAYING_REF' && (
              <Stack spacing={2} alignItems="center" sx={{ py: 1 }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <HearingIcon color="warning" sx={{ fontSize: 30 }} />
                  <Typography variant="h6" fontWeight={900}>
                    {et.listening}
                  </Typography>
                  <Chip
                    size="small"
                    icon={<MicOffIcon sx={{ fontSize: '14px !important' }} />}
                    label={et.micPausedPlayback}
                    sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                  />
                </Stack>
                <Button
                  variant="outlined"
                  color="warning"
                  size="small"
                  startIcon={<StopCircleIcon />}
                  onClick={stopPlaybackNow}
                  sx={{ fontWeight: 800, borderRadius: 2, textTransform: 'none', px: 2.5 }}
                >
                  {et.stopPlayback}
                </Button>
              </Stack>
            )}

            {/* USER TURN: Compact Unified Detection Cockpit */}
            {gameState === 'USER_TURN' && (
              <Stack spacing={2} alignItems="center" sx={{ width: '100%' }}>
                <Paper
                  elevation={0}
                  sx={{
                    width: '100%',
                    px: { xs: 1.5, sm: 2.5 },
                    py: 1.5,
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: isResetting
                      ? 'error.main'
                      : pitchDirection
                      ? 'warning.main'
                      : 'divider',
                    bgcolor: 'background.paper',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 2,
                    flexWrap: 'wrap',
                  }}
                >
                  {/* Status + Directional Hint */}
                  <Box sx={{ minWidth: { xs: '100%', sm: 210 }, flex: '1 1 200px' }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.75 }}>
                      <Box
                        sx={{
                          p: 0.75,
                          borderRadius: '50%',
                          display: 'flex',
                          bgcolor: alpha(
                            isMicPaused
                              ? theme.palette.text.disabled
                              : isResetting
                              ? theme.palette.error.main
                              : theme.palette.primary.main,
                            0.14
                          ),
                        }}
                      >
                        {isMicPaused ? (
                          <MicOffIcon fontSize="small" color="disabled" />
                        ) : (
                          <MicIcon fontSize="small" color={isResetting ? 'error' : 'primary'} />
                        )}
                      </Box>
                      <Typography variant="subtitle1" fontWeight={900} color={isResetting ? 'error.main' : 'text.primary'}>
                        {isResetting ? et.restarting : et.yourTurn}
                      </Typography>
                    </Stack>

                    {/* Live Directional Pitch Hint OR Progress Status */}
                    {pitchDirection ? (
                      <Chip
                        size="small"
                        color="warning"
                        icon={pitchDirection === 'higher' ? <ArrowUpwardIcon /> : <ArrowDownwardIcon />}
                        label={pitchDirection === 'higher' ? et.goHigher : et.goLower}
                        sx={{ fontWeight: 900, borderRadius: 1.5 }}
                      />
                    ) : (
                      <Stack direction="row" spacing={1} alignItems="center">
                        <CircularProgress
                          variant="determinate"
                          value={stabilityCounter}
                          size={18}
                          thickness={6}
                          color={stabilityCounter > 0 ? 'success' : 'primary'}
                        />
                        <Typography variant="caption" fontWeight={800} color="text.secondary">
                          {stabilityCounter > 0
                            ? `${et.capturingLabel}... ${Math.round(stabilityCounter)}%`
                            : et.playNextNote}
                        </Typography>
                      </Stack>
                    )}
                  </Box>

                  {/* Live Detected Note */}
                  <NoteDisplay
                    detectedNote={!isMicPaused && detected && detected.rms >= settings.rmsThreshold ? detected.pitch : null}
                    targetNoteName=""
                    isCorrect={stabilityCounter === 100}
                    isAlmost={stabilityCounter > 0 && stabilityCounter < 100}
                    isFailure={isResetting}
                    debug={false}
                    rms={detected?.rms || 0}
                  />

                  {/* VU Meter */}
                  <Box sx={{ flex: '1 1 160px', maxWidth: { sm: 220 }, '& > div': { mt: 0 } }}>
                    <VuMeter rms={isMicPaused ? 0 : detected?.rms || 0} threshold={settings.rmsThreshold} />
                  </Box>
                </Paper>

                {/* Quick Ear-Helper Action Row */}
                <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="center" useFlexGap>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<ReplayIcon />}
                    onClick={() => playReference(false)}
                    sx={{ borderRadius: 2, px: 2, fontWeight: 800, textTransform: 'none' }}
                  >
                    {et.listenAgain}
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<VolumeUpIcon />}
                    onClick={() => activeSequence[0] !== undefined && handleAuditionNote(activeSequence[0])}
                    sx={{ borderRadius: 2, px: 2, fontWeight: 800, textTransform: 'none' }}
                  >
                    {et.hearFirstNote}
                  </Button>
                  <Button
                    variant={showFirstNoteHint ? 'contained' : 'outlined'}
                    color={showFirstNoteHint ? 'info' : 'inherit'}
                    size="small"
                    startIcon={showFirstNoteHint ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    onClick={() => setShowFirstNoteHint((v) => !v)}
                    sx={{ borderRadius: 2, px: 1.75, fontWeight: 800, textTransform: 'none' }}
                  >
                    {showFirstNoteHint ? et.hideFirstNote : et.showFirstNote}
                  </Button>
                  <Button
                    variant="outlined"
                    color="inherit"
                    size="small"
                    startIcon={<ShuffleIcon />}
                    onClick={handleNewKey}
                    sx={{ borderRadius: 2, px: 1.75, fontWeight: 800, textTransform: 'none' }}
                  >
                    {et.newKey}
                  </Button>
                </Stack>
              </Stack>
            )}
          </Stack>
        </Paper>

        {/* Feedback Banner */}
        {feedback && (
          <Fade in={true}>
            <Paper
              elevation={0}
              sx={{
                py: 1.1,
                px: 2.5,
                mx: 'auto',
                bgcolor: alpha(
                  isResetting
                    ? theme.palette.error.main
                    : pitchDirection
                    ? theme.palette.warning.main
                    : theme.palette.success.main,
                  0.09
                ),
                border: '1px solid',
                borderColor: alpha(
                  isResetting
                    ? theme.palette.error.main
                    : pitchDirection
                    ? theme.palette.warning.main
                    : theme.palette.success.main,
                  0.3
                ),
                borderRadius: 2.5,
              }}
            >
              <Typography
                variant="caption"
                fontWeight={900}
                color={isResetting ? 'error.main' : pitchDirection ? 'warning.main' : 'success.main'}
                sx={{ display: 'flex', alignItems: 'center', gap: 0.75, textTransform: 'uppercase', letterSpacing: 0.8 }}
              >
                {isResetting || pitchDirection ? (
                  <ErrorOutlineIcon fontSize="small" />
                ) : (
                  <CheckCircleIcon fontSize="small" />
                )}
                {feedback}
              </Typography>
            </Paper>
          </Fade>
        )}

        <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', fontStyle: 'italic', px: 1 }}>
          {et.tipFooter} • {et.caughtRevealed}.
        </Typography>
      </Stack>
    </Container>
  );
};

export default EarTrainingSessionRunner;