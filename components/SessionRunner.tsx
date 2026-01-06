import { Box, Typography, IconButton, Container, CircularProgress, Alert, Paper, Stack } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useStore, SessionResult } from '../state/store';
import { AudioEngine, AudioStats } from '../audio/audioEngine';
import { FretPosition } from '../data/fretboard';
import { validateNote, translateNoteName } from '../audio/noteUtils';
import { translations } from '../localization/translations';
import TimerBar from './TimerBar';
import NoteDisplay from './NoteDisplay';
import VuMeter from './VuMeter';
import ScoreSummary from './ScoreSummary';
import SheetMusic from './SheetMusic';

interface SessionRunnerProps {
  questions: FretPosition[];
  onFinish: () => void;
  title: string;
  day?: number;
  programId?: string;
  onReplay?: () => void;
  onNext?: { label: string; action: () => void };
  sequence?: number[]; 
}

export interface ExtendedSessionResult extends SessionResult {
  failedNotes: string[];
  title: string;
}

const SessionRunner: React.FC<SessionRunnerProps> = ({ 
  questions, 
  onFinish, 
  title,
  day, 
  programId = 'free',
  onReplay,
  onNext,
  sequence
}) => {
  const { settings, addSessionResult, recordAttempt } = useStore();
  const t = translations[settings.language].session;
  
  const [currentIdx, setCurrentIdx] = useState(0); 
  const [sequenceIdx, setSequenceIdx] = useState(0); 
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(settings.timeLimit);
  const [isFinished, setIsFinished] = useState(false);
  const [detected, setDetected] = useState<AudioStats | null>(null);
  const [stabilityCounter, setStabilityCounter] = useState(0);
  const [engineError, setEngineError] = useState<string | null>(null);

  const resultsRef = useRef<{ correct: boolean, time: number, note: string }[]>([]);
  const scoreRef = useRef<number>(0);
  const failedNotesRef = useRef<string[]>([]);
  
  const audioEngineRef = useRef<AudioEngine | null>(null);
  const timerRef = useRef<any>(null);
  const questionStartTimeRef = useRef<number>(Date.now());
  const stabilityCheckRef = useRef<number | null>(null);
  const wrongNoteLockoutRef = useRef<number | null>(null);
  const lastValidatedMidiRef = useRef<number | null>(null);

  const isSequenceMode = !!sequence && sequence.length > 0;
  
  const currentTargetMidi = useMemo(() => {
    if (isSequenceMode && sequence) {
      return sequence[sequenceIdx] || 0;
    }
    return questions[currentIdx]?.midi || 0;
  }, [isSequenceMode, sequence, sequenceIdx, questions, currentIdx]);

  const currentQuestionMeta = useMemo(() => {
    if (isSequenceMode) return null;
    return questions[currentIdx];
  }, [isSequenceMode, questions, currentIdx]);

  const currentTargetName = useMemo(() => {
    if (isSequenceMode) {
      const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      return translateNoteName(names[currentTargetMidi % 12], 'english');
    }
    return questions[currentIdx]?.noteName || '--';
  }, [isSequenceMode, currentTargetMidi, questions, currentIdx]);

  const finishSession = useCallback(() => {
    setIsFinished(true);
    if (audioEngineRef.current) audioEngineRef.current.stop();
    if (timerRef.current) clearInterval(timerRef.current);

    const finalResults = resultsRef.current;
    const totalQuestionsAsked = isSequenceMode ? sequence?.length || 1 : questions.length;
    const correctAnswers = finalResults.filter(r => r.correct).length;
    const avgTime = finalResults.reduce((acc, r) => acc + r.time, 0) / (finalResults.length || 1);
    
    addSessionResult({
      date: new Date().toISOString(),
      score: Math.round(scoreRef.current * 10) / 10,
      accuracy: totalQuestionsAsked > 0 ? (correctAnswers / totalQuestionsAsked) * 100 : 0,
      avgTime,
      day,
      programId
    });
  }, [questions.length, sequence?.length, day, programId, isSequenceMode, addSessionResult]);

  const nextStep = useCallback(() => {
    setTimeLeft(settings.timeLimit);
    questionStartTimeRef.current = Date.now();
    setStabilityCounter(0);
    stabilityCheckRef.current = null;
    wrongNoteLockoutRef.current = null;

    if (isSequenceMode && sequence) {
      if (sequenceIdx < sequence.length - 1) {
        setSequenceIdx(s => s + 1);
      } else {
        finishSession();
      }
    } else {
       if (currentIdx < questions.length - 1) {
        setCurrentIdx(i => i + 1);
      } else {
        finishSession();
      }
    }
  }, [currentIdx, questions.length, sequenceIdx, sequence, isSequenceMode, settings.timeLimit, finishSession]);

  const handleSuccess = useCallback(() => {
    if (isFinished) return;
    const timeTaken = (Date.now() - questionStartTimeRef.current) / 1000;
    
    lastValidatedMidiRef.current = currentTargetMidi;

    if (currentQuestionMeta) {
      recordAttempt(currentQuestionMeta.string, currentQuestionMeta.fret, true, timeTaken);
    }

    scoreRef.current += (1 + (timeTaken < 1.5 ? 0.5 : 0));
    setScore(scoreRef.current);
    resultsRef.current.push({ correct: true, time: timeTaken, note: currentTargetName });
    
    const hasMore = isSequenceMode 
      ? (sequence && sequenceIdx < sequence.length - 1)
      : (currentIdx < questions.length - 1);

    if (hasMore) {
      nextStep();
    } else {
      finishSession();
    }
  }, [isFinished, isSequenceMode, sequence, sequenceIdx, currentIdx, questions.length, currentTargetName, currentTargetMidi, currentQuestionMeta, nextStep, finishSession, recordAttempt]);

  const handleFailure = useCallback(() => {
    if (isFinished) return;
    
    if (audioEngineRef.current) {
      audioEngineRef.current.playFailureSound();
    }
    
    if (currentQuestionMeta) {
      recordAttempt(currentQuestionMeta.string, currentQuestionMeta.fret, false, settings.timeLimit);
    }

    const noteFailed = currentTargetName;
    if (!failedNotesRef.current.includes(noteFailed)) {
      failedNotesRef.current.push(noteFailed);
    }
    
    resultsRef.current.push({ correct: false, time: settings.timeLimit, note: noteFailed });
    
    if (isSequenceMode) finishSession();
    else {
      if (currentIdx < questions.length - 1) {
        nextStep();
      } else {
        finishSession();
      }
    }
  }, [isFinished, settings.timeLimit, currentTargetName, isSequenceMode, currentIdx, questions.length, currentQuestionMeta, nextStep, finishSession, recordAttempt]);

  const handleAudioProcess = useCallback((stats: AudioStats) => {
    setDetected(stats);
    const isActive = stats.rms >= settings.rmsThreshold;
    
    // Quick exit if no valid signal
    if (!stats.pitch || !isActive) {
      setStabilityCounter(0);
      stabilityCheckRef.current = null;
      return;
    }

    const isValid = validateNote(stats.pitch.midi, currentTargetMidi, settings.strictOctave);
    
    if (isValid) {
      // If we just validated this MIDI note for a previous step, require a small drop in RMS or a change 
      // to avoid auto-validating identical adjacent notes in a sequence (e.g. scales)
      if (lastValidatedMidiRef.current === stats.pitch.midi && isSequenceMode) {
          return;
      }

      if (stabilityCheckRef.current === null) {
        stabilityCheckRef.current = Date.now();
        wrongNoteLockoutRef.current = null;
      } else {
        const elapsed = Date.now() - stabilityCheckRef.current;
        // Use a faster multiplier for UI feedback
        setStabilityCounter(Math.min(100, (elapsed / (settings.stabilityMs || 30)) * 100));
        if (elapsed >= (settings.stabilityMs || 30)) {
          handleSuccess();
        }
      }
    } else {
      setStabilityCounter(0);
      stabilityCheckRef.current = null;
      
      // If the user plays a wrong note, we allow a tiny grace period before failing
      // to avoid failing on transient "scrape" noises during finger shifts.
      if (!settings.allowMultipleAttempts) {
        if (wrongNoteLockoutRef.current === null) {
          wrongNoteLockoutRef.current = Date.now();
        } else if (Date.now() - wrongNoteLockoutRef.current > 60) { // 60ms grace
          handleFailure();
        }
      }
      
      // If user plays a different note, clear the "same-note" lock
      if (lastValidatedMidiRef.current !== stats.pitch.midi) {
          lastValidatedMidiRef.current = null;
      }
    }
  }, [currentTargetMidi, settings, handleSuccess, handleFailure, isSequenceMode]);

  useEffect(() => {
    audioEngineRef.current = new AudioEngine(handleAudioProcess);
    const startEngine = async () => {
      try {
        await audioEngineRef.current?.start(settings.selectedMicId);
        setEngineError(null);
      } catch (err: any) {
        setEngineError(err.message || "Could not start audio engine.");
      }
    };
    startEngine();
    
    timerRef.current = setInterval(() => {
      if (engineError || isFinished) return;
      setTimeLeft(prev => {
        if (prev <= 0.05) {
          handleFailure();
          return settings.timeLimit;
        }
        return prev - 0.05;
      });
    }, 50);

    return () => {
      if (audioEngineRef.current) audioEngineRef.current.stop();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [handleAudioProcess, settings.selectedMicId, settings.timeLimit, engineError, isFinished, handleFailure]);

  const summaryResult = useMemo(() => {
    if (!isFinished) return null;
    const finalResults = resultsRef.current;
    const totalExpected = isSequenceMode ? sequence?.length || 1 : questions.length;
    const correctAnswers = finalResults.filter(r => r.correct).length;
    const avgTime = finalResults.reduce((acc, r) => acc + r.time, 0) / (finalResults.length || 1);
    
    return {
      date: new Date().toISOString(),
      score: Math.round(scoreRef.current * 10) / 10,
      accuracy: totalExpected > 0 ? (correctAnswers / totalExpected) * 100 : 0,
      avgTime,
      day,
      programId,
      failedNotes: [...failedNotesRef.current],
      title
    } as ExtendedSessionResult;
  }, [isFinished, isSequenceMode, questions.length, sequence?.length, day, programId, title]);

  if (engineError) {
    return (
      <Container sx={{ py: 10 }}>
        <Alert severity="error" variant="filled">
          <Typography variant="h6">Audio Initialization Error</Typography>
          <Typography variant="body2">{engineError}</Typography>
        </Alert>
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <IconButton onClick={onFinish} color="inherit"><CloseIcon /></IconButton>
        </Box>
      </Container>
    );
  }

  if (isFinished && summaryResult) {
    const showNext = onNext && summaryResult.accuracy >= settings.minUnlockAccuracy;

    return (
      <ScoreSummary 
        result={summaryResult} 
        onClose={onFinish} 
        onReplay={onReplay} 
        onNext={showNext ? onNext : undefined} 
      />
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
        <Box>
          <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>{title}</Typography>
          <Typography variant="h6" color="textSecondary">
            {isSequenceMode ? t.scaleDrill : `${t.note} ${currentIdx + 1} / ${questions.length}`}
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="h6" color="primary">{t.score}: {score}</Typography>
          <IconButton onClick={onFinish} size="small"><CloseIcon /></IconButton>
        </Box>
      </Box>

      <TimerBar remaining={timeLeft} total={settings.timeLimit} />

      {isSequenceMode && sequence && (
        <SheetMusic 
          midiNotes={sequence} 
          currentIndex={sequenceIdx} 
          isFiveString={settings.isFiveString}
        />
      )}

      {/* Primary Target Display */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: { xs: 4, sm: 8 }, 
        mb: 8, 
        mt: isSequenceMode ? 2 : 6 
      }}>
        {/* Note section with fixed dimensions */}
        <Box sx={{ textAlign: 'center', width: { xs: 'auto', sm: 220 } }}>
          <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: 2, display: 'block', mb: 1, opacity: 0.8 }}>
            {t.note}
          </Typography>
          <Box sx={{ height: { xs: '6rem', sm: '9rem' }, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography 
              variant="h1" 
              fontWeight="900" 
              sx={{ 
                textTransform: 'uppercase', 
                fontSize: { xs: '6rem', sm: '7.5rem', md: '9rem' },
                lineHeight: 1,
                letterSpacing: -4,
                color: 'text.primary',
                whiteSpace: 'nowrap'
              }}
            >
              {translateNoteName(currentTargetName, settings.noteNaming)}
            </Typography>
          </Box>
        </Box>

        {/* String hint section */}
        {!isSequenceMode && questions[currentIdx] && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Paper 
              elevation={0}
              sx={{ 
                px: 4, 
                py: 2, 
                borderRadius: 2, 
                bgcolor: settings.themeMode === 'dark' ? 'rgba(33, 150, 243, 0.08)' : 'rgba(33, 150, 243, 0.04)',
                color: 'primary.main',
                border: '1px solid',
                borderColor: 'rgba(33, 150, 243, 0.2)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: { xs: 160, sm: 200 },
                minHeight: 110, // Match the height of NoteDisplay for alignment if stacked
                boxShadow: 'none'
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1.5, mb: 1, opacity: 0.8, textAlign: 'center' }}>
                {t.pluckString}
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 900, textAlign: 'center' }}>
                {translateNoteName(questions[currentIdx].stringName, settings.noteNaming)}
              </Typography>
            </Paper>
          </Box>
        )}
      </Box>

      {/* Performance Monitor - Aligned and balanced */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', // Center vertically
        gap: { xs: 3, md: 5 }, 
        flexWrap: 'wrap' 
      }}>
        <NoteDisplay 
          detectedNote={detected && detected.rms >= settings.rmsThreshold ? detected.pitch : null} 
          targetNoteName={currentTargetName}
          isCorrect={stabilityCounter === 100}
          isAlmost={stabilityCounter > 0 && stabilityCounter < 100}
          debug={false}
          rms={detected?.rms || 0}
        />
        
        <Box sx={{ 
          width: { xs: '100%', sm: 280 }, 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center' 
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5, justifyContent: 'center' }}>
            <CircularProgress 
              variant="determinate" 
              value={stabilityCounter} 
              size={24} 
              thickness={6}
              color={stabilityCounter === 100 ? "success" : "primary"}
            />
          </Box>
          <VuMeter rms={detected?.rms || 0} threshold={settings.rmsThreshold} />
        </Box>
      </Box>
    </Container>
  );
};

export default SessionRunner;