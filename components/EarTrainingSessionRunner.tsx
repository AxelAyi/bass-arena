import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Box, Typography, Button, Container, Paper, Stack, alpha, useTheme, Fade, IconButton, CircularProgress, Chip } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PlayCircleFilledIcon from '@mui/icons-material/PlayCircleFilled';
import MicIcon from '@mui/icons-material/Mic';
import HearingIcon from '@mui/icons-material/Hearing';
import ReplayIcon from '@mui/icons-material/Replay';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import SpeedIcon from '@mui/icons-material/Speed';

import { useStore } from '../state/store';
import { AudioEngine, AudioStats } from '../audio/audioEngine';
import { validateNote } from '../audio/noteUtils';
import { translations } from '../localization/translations';
import ScoreSummary from './ScoreSummary';
import VuMeter from './VuMeter';
import NoteDisplay from './NoteDisplay';

interface EarTrainingSessionRunnerProps {
  day: number;
  title: string;
  description: string;
  sequence: number[];
  onFinish: () => void;
  onReplay?: () => void;
  onNext?: { label: string; action: () => void };
  programId: string;
}

const EarTrainingSessionRunner: React.FC<EarTrainingSessionRunnerProps> = ({ 
  day, title, description, sequence, onFinish, onReplay, onNext, programId 
}) => {
  const { settings, addSessionResult } = useStore();
  const theme = useTheme();
  const et = translations[settings.language].earTraining;

  const [gameState, setGameState] = useState<'IDLE' | 'PLAYING_REF' | 'USER_TURN' | 'FINISHED'>('IDLE');
  const [detected, setDetected] = useState<AudioStats | null>(null);
  const [feedback, setFeedback] = useState<string>('');
  const [currentNoteIndex, setCurrentNoteIndex] = useState(0);
  const [stabilityCounter, setStabilityCounter] = useState(0);
  const [isResetting, setIsResetting] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 2 | 4>(1);
  
  // Scoring / Performance Refs
  const turnStartTimeRef = useRef<number>(0);
  const mistakesRef = useRef<number>(0);
  const finalMetricsRef = useRef({ score: 0, totalTime: 0, mistakes: 0 });

  // Dynamic sequence state
  const [activeSequence, setActiveSequence] = useState<number[]>([]);

  const audioEngineRef = useRef<AudioEngine | null>(null);
  const stabilityCheckRef = useRef<number | null>(null);
  const wrongNoteCheckRef = useRef<number | null>(null);
  
  // Refractory and Attack logic refs
  const isWaitingForNewAttackRef = useRef<boolean>(false);
  const lastCaughtMidiRef = useRef<number | null>(null);
  const peakRmsSinceCaptureRef = useRef<number>(0);
  const lastCaptureTimeRef = useRef<number>(0);
  
  const processRef = useRef<(stats: AudioStats) => void>(() => {});

  const randomizeSequenceRoot = useCallback((baseSeq: number[]) => {
    if (baseSeq.length === 0) return [];
    const minMidi = Math.min(...baseSeq);
    const maxMidi = Math.max(...baseSeq);
    const BASS_MIN = settings.isFiveString ? 23 : 28;
    const BASS_MAX = 52; 
    const minShift = BASS_MIN - minMidi;
    const maxShift = BASS_MAX - maxMidi;
    const shift = Math.floor(Math.random() * (maxShift - minShift + 1)) + minShift;
    return baseSeq.map(n => n + shift);
  }, [settings.isFiveString]);

  useEffect(() => {
    setActiveSequence(randomizeSequenceRoot(sequence));
  }, [sequence, randomizeSequenceRoot]);

  const triggerNextNote = (midi: number, rms: number) => {
    const now = Date.now();
    
    // Refractory period: refuse to trigger a new note within 150ms of the last capture
    if (now - lastCaptureTimeRef.current < 150) return;

    const nextIndex = currentNoteIndex + 1;
    lastCaughtMidiRef.current = midi;
    lastCaptureTimeRef.current = now;
    isWaitingForNewAttackRef.current = true;
    peakRmsSinceCaptureRef.current = rms;
    
    setCurrentNoteIndex(nextIndex);
    setStabilityCounter(0);
    stabilityCheckRef.current = null;

    if (nextIndex >= activeSequence.length) {
      validateFullSequence();
    } else {
      setFeedback(et.feedbackNoteCaught);
    }
  };

  const handleAudioProcess = useCallback((stats: AudioStats) => {
    setDetected(stats);

    const isActive = stats.rms >= settings.rmsThreshold;
    
    if (!isActive) {
      setStabilityCounter(0);
      stabilityCheckRef.current = null;
      wrongNoteCheckRef.current = null;
      // Dropping below gate is a clear "reset" of plucking state
      isWaitingForNewAttackRef.current = false;
      return;
    }

    if (!stats.pitch) {
      setStabilityCounter(0);
      stabilityCheckRef.current = null;
      return;
    }

    // Adaptive timings
    const speedMultiplier = playbackSpeed === 4 ? 0.4 : (playbackSpeed === 2 ? 0.7 : 1.0);
    const effectiveStabilityMs = Math.max(10, settings.stabilityMs * speedMultiplier);
    const effectiveWrongNoteMs = Math.max(50, 150 * speedMultiplier);

    // --- ATTACK GUARD LOGIC ---
    if (isWaitingForNewAttackRef.current) {
      const isNewPluck = stats.isOnset;
      const isPitchChanged = lastCaughtMidiRef.current !== null && 
                             Math.abs(stats.pitch.midi - lastCaughtMidiRef.current) > 0.8;
      
      // Volume DIP detection
      const isVolumeDip = peakRmsSinceCaptureRef.current > 0 && stats.rms < peakRmsSinceCaptureRef.current * 0.55;

      // Logic: Drop the guard if there is a NEW pluck, OR if the pitch clearly moved, OR if there was a deep volume dip followed by recovery
      if (isNewPluck || isPitchChanged || isVolumeDip) {
        isWaitingForNewAttackRef.current = false;
        peakRmsSinceCaptureRef.current = stats.rms;
      } else {
        peakRmsSinceCaptureRef.current = Math.max(peakRmsSinceCaptureRef.current, stats.rms);
        return;
      }
    }

    const targetMidi = activeSequence[currentNoteIndex];
    const isValid = validateNote(stats.pitch.midi, targetMidi, settings.strictOctave);

    if (isValid) {
      wrongNoteCheckRef.current = null;
      
      // If volume is decaying sharply, it's sustain, not intent.
      // Ignore if derivative is negative and we aren't already tracking stability.
      if (stats.rmsDerivative && stats.rmsDerivative < -0.001 && stabilityCheckRef.current === null) {
        return;
      }

      // Fast track validation for clear pitch transitions
      const isClearTransition = lastCaughtMidiRef.current !== null && 
                                Math.abs(stats.pitch.midi - lastCaughtMidiRef.current) > 0.8;

      if (isClearTransition) {
        triggerNextNote(stats.pitch.midi, stats.rms);
        return;
      }

      if (stabilityCheckRef.current === null) {
        stabilityCheckRef.current = Date.now();
        setFeedback(currentNoteIndex > 0 ? et.feedbackAlmost : et.feedbackStart);
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
        // --- SUSTAIN FILTERING FOR WRONG NOTES ---
        if (currentNoteIndex > 0) {
          const previousMidi = activeSequence[currentNoteIndex - 1];
          const isJustSustainOfPrevious = validateNote(stats.pitch.midi, previousMidi, settings.strictOctave);
          
          // If it's just the previous note sustaining and no new pluck has occurred, ignore it
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
          if (currentNoteIndex > 0) {
            mistakesRef.current += 1;
            setCurrentNoteIndex(0);
            setFeedback(et.feedbackWrong);
            setIsResetting(true);
            isWaitingForNewAttackRef.current = false;
            lastCaughtMidiRef.current = null;
            setTimeout(() => setIsResetting(false), 1200);
          }
          wrongNoteCheckRef.current = null;
        }
    }
  }, [activeSequence, currentNoteIndex, settings, et, playbackSpeed]);

  useEffect(() => {
    processRef.current = (stats: AudioStats) => {
      if (gameState === 'USER_TURN') {
        handleAudioProcess(stats);
      } else {
        setDetected(stats);
      }
    };
  }, [handleAudioProcess, gameState]);

  const validateFullSequence = () => {
    const totalTime = (Date.now() - turnStartTimeRef.current) / 1000;
    const mistakes = mistakesRef.current;
    const parTime = activeSequence.length * (2.5 / playbackSpeed);
    const timePenalty = Math.max(0, (totalTime - parTime) * 2);
    const finalScore = Math.max(0, Math.round(100 - (mistakes * 15) - timePenalty));

    finalMetricsRef.current = { score: finalScore, totalTime, mistakes };
    setGameState('FINISHED');
    setFeedback(et.feedbackPerfect);
    
    addSessionResult({
      date: new Date().toISOString(),
      score: finalScore,
      accuracy: mistakes === 0 ? 100 : Math.max(0, 100 - (mistakes * 20)),
      avgTime: totalTime / activeSequence.length,
      day,
      programId,
      wasBeginnerMode: false
    });
  };

  const playReference = async () => {
    setGameState('PLAYING_REF');
    setFeedback('');
    setCurrentNoteIndex(0);
    setStabilityCounter(0);
    setIsResetting(false);
    isWaitingForNewAttackRef.current = false;
    lastCaughtMidiRef.current = null;
    peakRmsSinceCaptureRef.current = 0;
    lastCaptureTimeRef.current = 0;
    mistakesRef.current = 0;

    if (!audioEngineRef.current) {
      audioEngineRef.current = new AudioEngine((stats) => processRef.current(stats));
      try {
        await audioEngineRef.current.start(settings.selectedMicId);
      } catch (err) {
        console.error("Failed to start mic", err);
      }
    }

    await audioEngineRef.current.playSequence(activeSequence, 70 * playbackSpeed);
    turnStartTimeRef.current = Date.now();
    setGameState('USER_TURN');
  };

  const stopAudio = useCallback(async () => {
    if (audioEngineRef.current) {
      await audioEngineRef.current.stop();
      audioEngineRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, [stopAudio]);

  const handleFullReplay = () => {
    setActiveSequence(randomizeSequenceRoot(sequence));
    setGameState('IDLE');
    onReplay?.();
  };

  if (gameState === 'FINISHED') {
    return (
      <ScoreSummary 
        result={{ 
          title, 
          score: finalMetricsRef.current.score, 
          totalTime: finalMetricsRef.current.totalTime,
          mistakes: finalMetricsRef.current.mistakes,
          accuracy: 100, 
          avgTime: 0,    
          isEarTraining: true,
          failedNotes: [] 
        }} 
        onClose={onFinish} 
        onReplay={handleFullReplay}
        onNext={onNext}
      />
    );
  }

  const speedOptions: (1 | 2 | 4)[] = [1, 2, 4];

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack spacing={4} alignItems="center">
        <Box sx={{ textAlign: 'center', width: '100%' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="h4" fontWeight="900" color="primary">{title}</Typography>
            <IconButton onClick={onFinish}><CloseIcon /></IconButton>
          </Box>
          <Typography variant="body1" color="textSecondary">{description}</Typography>
        </Box>

        <Paper 
          elevation={0} 
          sx={{ 
            p: { xs: 3, md: 6 }, 
            width: '100%', 
            borderRadius: 4, 
            bgcolor: alpha(theme.palette.primary.main, 0.03),
            border: '2px dashed',
            borderColor: isResetting ? 'error.main' : (gameState === 'USER_TURN' ? 'primary.main' : 'divider'),
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 350,
            transition: 'all 0.3s ease',
            position: 'relative'
          }}
        >
          {gameState === 'IDLE' && (activeSequence.length > 0) && (
            <Stack spacing={4} alignItems="center">
              <HearingIcon sx={{ fontSize: 80, color: 'divider' }} />
              <Typography variant="h6" fontWeight="800" color="textSecondary">{et.listenPrompt}</Typography>
              
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="caption" sx={{ fontWeight: 900, textTransform: 'uppercase', mb: 1.5, display: 'block', letterSpacing: 1, opacity: 0.7 }}>
                  {et.speed}
                </Typography>
                <Stack direction="row" spacing={1}>
                  {speedOptions.map(s => (
                    <Chip 
                      key={s}
                      label={`x${s}`}
                      onClick={() => setPlaybackSpeed(s)}
                      variant={playbackSpeed === s ? "filled" : "outlined"}
                      color={playbackSpeed === s ? "primary" : "default"}
                      sx={{ fontWeight: 900, width: 60, borderRadius: 1.5 }}
                      icon={playbackSpeed === s ? <SpeedIcon sx={{ fontSize: '14px !important' }} /> : undefined}
                    />
                  ))}
                </Stack>
              </Box>

              <Button 
                variant="contained" 
                size="large" 
                onClick={playReference}
                startIcon={<PlayCircleFilledIcon />}
                sx={{ px: 4, py: 1.5, borderRadius: 2, fontWeight: 800 }}
              >
                {et.playMelody}
              </Button>
            </Stack>
          )}

          {gameState === 'PLAYING_REF' && (
            <Stack spacing={3} alignItems="center">
              <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress size={100} thickness={2} />
                <HearingIcon sx={{ fontSize: 40, position: 'absolute', color: 'primary.main' }} />
              </Box>
              <Typography variant="h6" fontWeight="800">{et.listening}</Typography>
              <Typography variant="caption" sx={{ letterSpacing: 2, textTransform: 'uppercase', opacity: 0.6 }}>
                Memorize the intervals... (x{playbackSpeed})
              </Typography>
            </Stack>
          )}

          {gameState === 'USER_TURN' && (
            <Stack spacing={4} alignItems="center" sx={{ width: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ 
                    position: 'relative', 
                    display: 'flex', 
                    p: 1, 
                    borderRadius: '50%', 
                    bgcolor: alpha(isResetting ? theme.palette.error.main : theme.palette.primary.main, (detected?.rms || 0) > settings.rmsThreshold ? 0.2 : 0.05) 
                }}>
                  <MicIcon color={isResetting ? "error" : "primary"} sx={{ fontSize: 32 }} />
                </Box>
                <Typography variant="h5" fontWeight="900" color={isResetting ? "error.main" : "text.primary"}>
                  {isResetting ? et.restarting : et.yourTurn}
                </Typography>
              </Box>
              
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1, fontWeight: 800 }}>
                  {et.progressLabel}: {currentNoteIndex} / {activeSequence.length} {et.notesLabel}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                    {activeSequence.map((_, i) => (
                    <Box 
                        key={i} 
                        sx={{ 
                        width: 14, 
                        height: 14, 
                        borderRadius: '50%', 
                        bgcolor: i < currentNoteIndex ? 'success.main' : (i === currentNoteIndex ? (isResetting ? 'error.main' : 'primary.main') : alpha(theme.palette.divider, 0.2)),
                        transform: i === currentNoteIndex ? 'scale(1.3)' : 'none',
                        boxShadow: i === currentNoteIndex ? `0 0 10px ${isResetting ? theme.palette.error.main : theme.palette.primary.main}` : 'none',
                        transition: 'all 0.3s'
                        }} 
                    />
                    ))}
                </Box>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'center', gap: { xs: 2, md: 5 }, width: '100%', flexWrap: 'wrap' }}>
                <NoteDisplay 
                  detectedNote={detected && detected.rms >= settings.rmsThreshold ? detected.pitch : null} 
                  targetNoteName="" 
                  isCorrect={stabilityCounter === 100}
                  isAlmost={stabilityCounter > 0 && stabilityCounter < 100}
                  isFailure={isResetting}
                  debug={false}
                  rms={detected?.rms || 0}
                />
                
                <Box sx={{ width: 220, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <VuMeter rms={detected?.rms || 0} threshold={settings.rmsThreshold} />
                  <Box sx={{ mt: 1.5 }}>
                    <CircularProgress 
                        variant="determinate" 
                        value={stabilityCounter} 
                        size={20} 
                        thickness={6} 
                        sx={{ verticalAlign: 'middle', mr: 1 }}
                    />
                    <Typography variant="caption" sx={{ fontWeight: 800 }}>
                      {stabilityCounter > 0 ? `${et.capturingLabel}... ${Math.round(stabilityCounter)}%` : (isResetting ? et.tryAgain : et.playNextNote)}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Stack direction="row" spacing={2} alignItems="center">
                <Button 
                  variant="outlined" 
                  startIcon={<ReplayIcon />} 
                  onClick={playReference}
                  size="small"
                  sx={{ borderRadius: 10, px: 3 }}
                >
                  {et.listenAgain}
                </Button>
                <Stack direction="row" spacing={0.5}>
                  {speedOptions.map(s => (
                    <Chip 
                      key={s}
                      label={`x${s}`}
                      onClick={() => setPlaybackSpeed(s)}
                      size="small"
                      variant={playbackSpeed === s ? "filled" : "outlined"}
                      color={playbackSpeed === s ? "primary" : "default"}
                      sx={{ fontWeight: 800, fontSize: '0.65rem' }}
                    />
                  ))}
                </Stack>
              </Stack>
            </Stack>
          )}
        </Paper>

        {feedback && (
          <Fade in={true}>
            <Paper sx={{ 
                p: 2, 
                px: 4, 
                bgcolor: alpha(isResetting ? theme.palette.error.main : theme.palette.success.main, 0.05), 
                border: '1px solid', 
                borderColor: alpha(isResetting ? theme.palette.error.main : theme.palette.success.main, 0.2), 
                borderRadius: 10 
            }}>
              <Typography variant="subtitle2" fontWeight="900" color={isResetting ? "error.main" : "success.main"} sx={{ display: 'flex', alignItems: 'center', gap: 1, textTransform: 'uppercase', letterSpacing: 1 }}>
                {isResetting ? <ErrorOutlineIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />} {feedback}
              </Typography>
            </Paper>
          </Fade>
        )}

        <Typography variant="caption" color="textSecondary" sx={{ fontStyle: 'italic', maxWidth: 400, textAlign: 'center' }}>
           {et.tipFooter}
        </Typography>
      </Stack>
    </Container>
  );
};

export default EarTrainingSessionRunner;