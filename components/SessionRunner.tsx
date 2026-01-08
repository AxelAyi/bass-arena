import { Box, Typography, IconButton, Container, CircularProgress, Alert, Paper, Stack, useTheme, Fade, Zoom, keyframes } from '@mui/material';
import { alpha } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useStore, SessionResult } from '../state/store';
import { AudioEngine, AudioStats } from '../audio/audioEngine';
import { FretPosition, BASS_STRINGS } from '../data/fretboard';
import { validateNote, translateNoteName } from '../audio/noteUtils';
import { translations } from '../localization/translations';
import TimerBar from './TimerBar';
import NoteDisplay from './NoteDisplay';
import VuMeter from './VuMeter';
import ScoreSummary from './ScoreSummary';
import SheetMusic from './SheetMusic';

const screenShake = keyframes`
  0% { transform: translate(0, 0); }
  10% { transform: translate(-4px, -4px); }
  20% { transform: translate(4px, 4px); }
  30% { transform: translate(-4px, 4px); }
  40% { transform: translate(4px, -4px); }
  50% { transform: translate(-4px, 0); }
  60% { transform: translate(4px, 0); }
  70% { transform: translate(0, -4px); }
  80% { transform: translate(0, 4px); }
  100% { transform: translate(0, 0); }
`;

const successPulse = keyframes`
  0% { transform: scale(1); filter: brightness(1); }
  50% { transform: scale(1.05); filter: brightness(1.2); }
  100% { transform: scale(1); filter: brightness(1); }
`;

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

const FretboardVisualAid: React.FC<{ stringIdx: number, fret: number, isFiveString: boolean, noteNaming: 'english' | 'latin', isFailure?: boolean, isSuccess?: boolean }> = ({ stringIdx, fret, isFiveString, noteNaming, isFailure, isSuccess }) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  
  const stringsToRender = isFiveString ? [0, 1, 2, 3, 4] : [0, 1, 2, 3];
  const blockIndex = fret > 0 ? Math.floor((fret - 1) / 3) : 0;
  const startFret = blockIndex * 3;
  
  const fretWidth = 100;
  const stringSpacing = 28;
  const boardWidth = 3 * fretWidth; 
  const boardHeight = (stringsToRender.length - 1) * stringSpacing;
  
  const neckTopOffset = 25;
  const indicatorFrets = [3, 5, 7, 9, 12, 15, 17, 19, 21, 24];

  const getTargetColor = () => {
    if (isFailure) return theme.palette.error.main;
    if (isSuccess) return theme.palette.success.main;
    return theme.palette.primary.main;
  };

  const targetColor = getTargetColor();

  return (
    <Box sx={{ width: '100%', py: 2, display: 'flex', justifyContent: 'center', bgcolor: 'transparent' }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', position: 'relative' }}>
        
        {/* String Labels */}
        <Box sx={{ position: 'relative', mr: 3, mt: `${neckTopOffset}px`, height: boardHeight }}>
          {stringsToRender.map((s, i) => {
            const isTargetString = s === stringIdx;
            return (
              <Typography 
                key={s} 
                variant="caption" 
                sx={{ 
                  position: 'absolute',
                  top: i * stringSpacing,
                  right: 0,
                  transform: 'translateY(-50%)',
                  fontWeight: 900, 
                  fontSize: '0.85rem',
                  color: isTargetString ? (isFailure ? 'error.main' : (isSuccess ? 'success.main' : 'primary.main')) : (isDarkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'),
                  lineHeight: 1,
                  whiteSpace: 'nowrap',
                  textShadow: (isTargetString && fret === 0) ? `0 0 8px ${alpha(targetColor, 0.5)}` : 'none'
                }}
              >
                {translateNoteName(BASS_STRINGS[s].name, noteNaming)}
              </Typography>
            );
          })}
        </Box>

        {/* Fretboard Graphic Area */}
        <Box sx={{ position: 'relative', width: boardWidth, height: boardHeight + neckTopOffset + 30 }}>
          
          {[0, 1, 2].map((i) => {
            const fretVal = startFret + i + 1;
            const isIndicator = indicatorFrets.includes(fretVal);
            const labelColor = isIndicator ? 'text.primary' : 'text.secondary';
            
            return (
              <React.Fragment key={i}>
                <Box 
                  key={`label-${i}`}
                  sx={{ 
                    position: 'absolute', 
                    left: (i + 0.5) * fretWidth,
                    top: -5,
                    width: fretWidth,
                    height: 25,
                    textAlign: 'center',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      fontSize: isIndicator ? '0.8rem' : '0.75rem', 
                      fontWeight: isIndicator ? 900 : 600, 
                      color: labelColor, 
                      opacity: isIndicator ? 1 : 0.8,
                      lineHeight: 1
                    }}
                  >
                    {fretVal}
                  </Typography>
                </Box>

                {isIndicator && (
                  <Box 
                    key={`dot-${i}`}
                    sx={{ 
                      position: 'absolute', 
                      left: (i + 0.5) * fretWidth,
                      top: boardHeight + neckTopOffset + 10,
                      width: 6, 
                      height: 6, 
                      borderRadius: '50%', 
                      bgcolor: labelColor, 
                      transform: 'translateX(-50%)',
                      opacity: 0.6
                    }} 
                  />
                )}
              </React.Fragment>
            );
          })}

          <Box 
            sx={{ 
              position: 'absolute', 
              top: neckTopOffset, 
              left: 0, 
              width: boardWidth, 
              height: boardHeight, 
              bgcolor: isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
              borderRadius: 0.5,
              zIndex: 1
            }} 
          />

          <Box sx={{ position: 'relative', top: neckTopOffset, height: boardHeight, width: boardWidth }}>
            
            {[0, 1, 2, 3].map((i) => {
              const isNut = (startFret === 0 && i === 0);
              return (
                <Box 
                  key={i} 
                  sx={{ 
                    position: 'absolute', 
                    left: i * fretWidth, 
                    top: 0, 
                    bottom: 0, 
                    width: isNut ? 5 : 2, 
                    bgcolor: isDarkMode ? '#ffffff' : '#333333',
                    opacity: isNut ? 1 : 0.4,
                    zIndex: 10, 
                    transform: 'translateX(-50%)',
                  }} 
                />
              );
            })}

            {stringsToRender.map((s, i) => {
              const isActive = s === stringIdx;
              const stringColor = isActive 
                ? targetColor 
                : (isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)');
              
              return (
                <Box 
                  key={s} 
                  sx={{ 
                    position: 'absolute', 
                    top: i * stringSpacing, 
                    left: 0, 
                    right: 0, 
                    height: isActive ? 3 : 1.5, 
                    bgcolor: stringColor,
                    zIndex: isActive ? 20 : 5, 
                    boxShadow: isActive ? `0 0 12px ${alpha(targetColor, 0.6)}` : 'none',
                    transform: 'translateY(-50%)',
                    transition: 'all 0.2s ease'
                  }} 
                />
              );
            })}

            {fret > 0 && (() => {
              const spaceIndex = fret - startFret;
              const markerX = (spaceIndex - 0.5) * fretWidth;
              const markerY = stringsToRender.indexOf(stringIdx) * stringSpacing;

              return (
                <Box 
                  sx={{ 
                    position: 'absolute', 
                    left: markerX, 
                    top: markerY,
                    width: 14, 
                    height: 14, 
                    borderRadius: '50%', 
                    bgcolor: isFailure ? 'error.main' : (isSuccess ? 'success.main' : 'primary.main'),
                    transform: 'translate(-50%, -50%)',
                    boxShadow: `0 0 10px ${targetColor}`,
                    zIndex: 30, 
                    transition: 'all 0.15s ease-out'
                  }} 
                />
              );
            })()}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

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
  const theme = useTheme();
  const t = translations[settings.language].session;
  const isDarkMode = theme.palette.mode === 'dark';
  
  const [countdown, setCountdown] = useState<number | 'GO' | null>(3);
  const [currentIdx, setCurrentIdx] = useState(0); 
  const [sequenceIdx, setSequenceIdx] = useState(0); 
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(settings.timeLimit);
  const [isFinished, setIsFinished] = useState(false);
  const [isProcessingFailure, setIsProcessingFailure] = useState(false);
  const [isProcessingSuccess, setIsProcessingSuccess] = useState(false);
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
  
  const lastTransitionMidiRef = useRef<number | null>(null);
  const isWaitingForNewAttackRef = useRef<boolean>(false);
  const lastRmsRef = useRef<number>(0);

  const isSequenceMode = !!sequence && sequence.length > 0;
  
  const currentTargetMidi = useMemo(() => {
    if (isSequenceMode && sequence) {
      return sequence[sequenceIdx] || 0;
    }
    return questions[currentIdx]?.midi || 0;
  }, [isSequenceMode, sequence, sequenceIdx, questions, currentIdx]);

  const currentTargetName = useMemo(() => {
    if (isSequenceMode) {
      const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      return translateNoteName(names[currentTargetMidi % 12], 'english');
    }
    return questions[currentIdx]?.noteName || '--';
  }, [isSequenceMode, currentTargetMidi, questions, currentIdx]);

  const currentQuestionMeta = useMemo(() => {
    if (isSequenceMode) return null;
    return questions[currentIdx];
  }, [isSequenceMode, questions, currentIdx]);

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
      programId,
      wasBeginnerMode: settings.beginnerMode
    });
  }, [questions.length, sequence?.length, day, programId, isSequenceMode, addSessionResult, settings.beginnerMode]);

  const nextStep = useCallback(() => {
    setTimeLeft(settings.timeLimit);
    questionStartTimeRef.current = Date.now();
    setStabilityCounter(0);
    stabilityCheckRef.current = null;
    wrongNoteLockoutRef.current = null;
    setIsProcessingFailure(false);
    setIsProcessingSuccess(false);
    
    isWaitingForNewAttackRef.current = true;

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
    if (isFinished || isProcessingFailure || isProcessingSuccess) return;
    
    setIsProcessingSuccess(true);
    const timeTaken = (Date.now() - questionStartTimeRef.current) / 1000;
    
    if (detected && detected.pitch) {
      lastTransitionMidiRef.current = detected.pitch.midi;
    }

    if (currentQuestionMeta) {
      recordAttempt(currentQuestionMeta.string, currentQuestionMeta.fret, true, timeTaken);
    }

    scoreRef.current += (1 + (timeTaken < 1.5 ? 0.5 : 0));
    setScore(scoreRef.current);
    resultsRef.current.push({ correct: true, time: timeTaken, note: currentTargetName });
    
    setTimeout(() => {
      const hasMore = isSequenceMode 
        ? (sequence && sequenceIdx < sequence.length - 1)
        : (currentIdx < questions.length - 1);

      if (hasMore) {
        nextStep();
      } else {
        finishSession();
      }
    }, 400);
  }, [isFinished, isProcessingFailure, isProcessingSuccess, isSequenceMode, sequence, sequenceIdx, currentIdx, questions.length, currentTargetName, currentQuestionMeta, nextStep, finishSession, recordAttempt, detected]);

  const handleFailure = useCallback(() => {
    if (isFinished || isProcessingFailure || isProcessingSuccess) return;
    
    setIsProcessingFailure(true); 
    
    if (detected && detected.pitch) {
      lastTransitionMidiRef.current = detected.pitch.midi;
    }

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
    
    setTimeout(() => {
      if (isSequenceMode) finishSession();
      else {
        if (currentIdx < questions.length - 1) {
          nextStep();
        } else {
          finishSession();
        }
      }
    }, 1000);
  }, [isFinished, isProcessingFailure, isProcessingSuccess, settings.timeLimit, currentTargetName, isSequenceMode, currentIdx, questions.length, currentQuestionMeta, nextStep, finishSession, recordAttempt, detected]);

  const handleAudioProcess = useCallback((stats: AudioStats) => {
    if (countdown !== null || isFinished || isProcessingFailure || isProcessingSuccess) return; 
    setDetected(stats);
    
    const isActive = stats.rms >= settings.rmsThreshold;
    const prevRms = lastRmsRef.current;
    lastRmsRef.current = stats.rms;

    if (!isActive) {
      isWaitingForNewAttackRef.current = false;
      lastTransitionMidiRef.current = null;
      setStabilityCounter(0);
      stabilityCheckRef.current = null;
      wrongNoteLockoutRef.current = null;
      return;
    }

    if (isWaitingForNewAttackRef.current) {
      const isNewAttack = stats.rms > prevRms * 1.8;
      const pitchShifted = stats.pitch && lastTransitionMidiRef.current !== null && 
                          Math.abs(stats.pitch.midi - lastTransitionMidiRef.current) > 0.8;

      if (isNewAttack || pitchShifted) {
        isWaitingForNewAttackRef.current = false;
      } else {
        return;
      }
    }

    if (!stats.pitch) {
      setStabilityCounter(0);
      stabilityCheckRef.current = null;
      return;
    }

    const isDecaying = stats.rms < prevRms * 0.95;
    const isValid = validateNote(stats.pitch.midi, currentTargetMidi, settings.strictOctave);
    
    if (isValid) {
      if (isDecaying && stabilityCheckRef.current === null) {
        return; 
      }

      if (stabilityCheckRef.current === null) {
        stabilityCheckRef.current = Date.now();
        wrongNoteLockoutRef.current = null;
      } else {
        const elapsed = Date.now() - stabilityCheckRef.current;
        setStabilityCounter(Math.min(100, (elapsed / (settings.stabilityMs || 30)) * 100));
        if (elapsed >= (settings.stabilityMs || 30)) {
          handleSuccess();
        }
      }
    } else {
      setStabilityCounter(0);
      stabilityCheckRef.current = null;
      
      if (!settings.allowMultipleAttempts) {
        if (isDecaying && wrongNoteLockoutRef.current === null) {
          return;
        }

        if (wrongNoteLockoutRef.current === null) {
          wrongNoteLockoutRef.current = Date.now();
        } else if (Date.now() - wrongNoteLockoutRef.current > 250) { 
          handleFailure();
        }
      }
    }
  }, [currentTargetMidi, settings, handleSuccess, handleFailure, countdown, isFinished, isProcessingFailure, isProcessingSuccess]);

  const processRef = useRef(handleAudioProcess);
  useEffect(() => {
    processRef.current = handleAudioProcess;
  }, [handleAudioProcess]);

  useEffect(() => {
    if (countdown === null) return;
    const timer = setTimeout(() => {
      if (countdown === 3) setCountdown(2);
      else if (countdown === 2) setCountdown(1);
      else if (countdown === 1) setCountdown('GO');
      else if (countdown === 'GO') {
        setCountdown(null);
        questionStartTimeRef.current = Date.now(); 
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  useEffect(() => {
    if (countdown !== null) return; 

    const audioProxy = (stats: AudioStats) => processRef.current(stats);
    audioEngineRef.current = new AudioEngine(audioProxy);
    
    const startEngine = async () => {
      try {
        await audioEngineRef.current?.start(settings.selectedMicId);
        setEngineError(null);
      } catch (err: any) {
        setEngineError(err.message || "Could not start audio engine.");
      }
    };
    startEngine();
    
    return () => {
      if (audioEngineRef.current) audioEngineRef.current.stop();
    };
  }, [settings.selectedMicId, countdown]);

  useEffect(() => {
    if (countdown !== null) return; 

    timerRef.current = setInterval(() => {
      if (engineError || isFinished || isProcessingFailure || isProcessingSuccess) return;
      setTimeLeft(prev => {
        if (prev <= 0.05) {
          handleFailure();
          return settings.timeLimit;
        }
        return prev - 0.05;
      });
    }, 50);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [settings.timeLimit, engineError, isFinished, handleFailure, countdown, isProcessingFailure, isProcessingSuccess]);

  const summaryResult = useMemo(() => {
    if (!isFinished) return null;
    const totalExpected = isSequenceMode ? sequence?.length || 1 : questions.length;
    const correctAnswers = resultsRef.current.filter(r => r.correct).length;
    const avgTime = resultsRef.current.reduce((acc, r) => acc + r.time, 0) / (resultsRef.current.length || 1);
    
    return {
      date: new Date().toISOString(),
      score: Math.round(scoreRef.current * 10) / 10,
      accuracy: totalExpected > 0 ? (correctAnswers / totalExpected) * 100 : 0,
      avgTime,
      day,
      programId,
      wasBeginnerMode: settings.beginnerMode,
      failedNotes: [...failedNotesRef.current],
      title
    } as ExtendedSessionResult;
  }, [isFinished, isSequenceMode, questions.length, sequence?.length, day, programId, title, settings.beginnerMode]);

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

  if (countdown !== null) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          textAlign: 'center',
          px: 3,
          minHeight: '70vh',
          bgcolor: 'transparent'
        }}
      >
        <Fade in={true} timeout={600}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 900, 
                textTransform: 'uppercase', 
                letterSpacing: -0.5, 
                mb: 1,
                color: 'text.primary',
                opacity: 0.9
              }}
            >
              {title}
            </Typography>

            <Typography 
              variant="subtitle1" 
              color="primary" 
              sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: 2, mb: 4, opacity: 0.7 }}
            >
              {t.getReady}
            </Typography>

            <Box 
              sx={{ 
                width: { xs: 140, sm: 180 }, 
                height: { xs: 140, sm: 180 }, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                border: '6px solid',
                borderColor: 'primary.main',
                borderRadius: '50%',
                position: 'relative',
                boxShadow: (theme) => `0 0 40px ${alpha(theme.palette.primary.main, 0.15)}`
              }}
            >
              <Fade key={countdown} in={true} timeout={300}>
                <Typography 
                  variant="h1" 
                  sx={{ 
                    fontWeight: 900, 
                    fontSize: countdown === 'GO' ? { xs: '3.5rem', sm: '4.5rem' } : { xs: '5.5rem', sm: '7rem' }, 
                    color: countdown === 'GO' 
                      ? (isDarkMode ? '#ffffff' : 'primary.dark') 
                      : 'primary.main',
                    lineHeight: 1
                  }}
                >
                  {countdown === 'GO' ? 'GO' : countdown}
                </Typography>
              </Fade>
            </Box>
            
            <IconButton 
              onClick={onFinish} 
              sx={{ mt: 6, opacity: 0.5, '&:hover': { opacity: 1, color: 'error.main' } }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </Fade>
      </Box>
    );
  }

  // Session UI (Active)
  return (
    <Box sx={{ 
      minHeight: '85vh', 
      transition: 'background-color 0.3s ease',
      bgcolor: isProcessingFailure 
        ? alpha(theme.palette.error.main, 0.08) 
        : (isProcessingSuccess ? alpha(theme.palette.success.main, 0.08) : 'transparent'),
      animation: isProcessingFailure ? `${screenShake} 0.5s cubic-bezier(.36,.07,.19,.97) both` : 'none',
      borderRadius: 4,
      px: { xs: 1, sm: 3 },
      py: 2
    }}>
      <Container maxWidth="md">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Box>
            <Typography 
              variant="subtitle2" 
              color={isProcessingFailure ? "error" : (isProcessingSuccess ? "success" : "primary")} 
              sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, transition: 'color 0.2s' }}
            >
              {title}
            </Typography>
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
          <Box sx={{ opacity: isProcessingFailure ? 0.3 : 1, transition: 'opacity 0.2s' }}>
            <SheetMusic 
              midiNotes={sequence} 
              currentIndex={sequenceIdx} 
              isFiveString={settings.isFiveString}
            />
          </Box>
        )}

        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center', 
          gap: { xs: 2, md: 4 }, 
          mb: 8, 
          mt: isSequenceMode ? 2 : 6,
          animation: isProcessingSuccess ? `${successPulse} 0.4s ease-out` : 'none'
        }}>
          <Box sx={{ textAlign: 'center', width: { xs: 'auto', sm: 220 } }}>
            <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: 2, display: 'block', mb: 0.5, opacity: 0.8 }}>
              {t.note}
            </Typography>
            <Box sx={{ height: { xs: '5rem', sm: '7rem' }, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography 
                variant="h1" 
                fontWeight="900" 
                sx={{ 
                  textTransform: 'uppercase', 
                  fontSize: { xs: '5rem', sm: '6.5rem', md: '7.5rem' },
                  lineHeight: 1,
                  letterSpacing: -4,
                  color: isProcessingFailure ? 'error.main' : (isProcessingSuccess ? 'success.main' : 'text.primary'),
                  whiteSpace: 'nowrap',
                  transition: 'color 0.2s'
                }}
              >
                {translateNoteName(currentTargetName, settings.noteNaming).toUpperCase()}
              </Typography>
            </Box>
          </Box>

          {!isSequenceMode && questions[currentIdx] && (
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', maxWidth: { xs: '100%', md: 600 }, justifyContent: 'center', bgcolor: 'transparent' }}>
              {settings.beginnerMode ? (
                <FretboardVisualAid 
                  stringIdx={questions[currentIdx].string} 
                  fret={questions[currentIdx].fret} 
                  isFiveString={settings.isFiveString} 
                  noteNaming={settings.noteNaming}
                  isFailure={isProcessingFailure}
                  isSuccess={isProcessingSuccess}
                />
              ) : (
                <Paper 
                  elevation={0}
                  sx={{ 
                    px: 4, 
                    py: 2, 
                    borderRadius: 2, 
                    bgcolor: isProcessingFailure ? alpha(theme.palette.error.main, 0.1) : (isProcessingSuccess ? alpha(theme.palette.success.main, 0.1) : alpha(theme.palette.primary.main, settings.themeMode === 'dark' ? 0.08 : 0.04)),
                    color: isProcessingFailure ? 'error.main' : (isProcessingSuccess ? 'success.main' : 'primary.main'),
                    border: '2px solid',
                    borderColor: isProcessingFailure ? 'error.main' : (isProcessingSuccess ? 'success.main' : alpha(theme.palette.primary.main, 0.2)),
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: { xs: 160, sm: 200 },
                    minHeight: 110, 
                    boxShadow: 'none',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Typography variant="caption" sx={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1.5, mb: 1, opacity: 0.8, textAlign: 'center' }}>
                    {t.pluckString}
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 900, textAlign: 'center' }}>
                    {translateNoteName(questions[currentIdx].stringName, settings.noteNaming).toUpperCase()}
                  </Typography>
                </Paper>
              )}
            </Box>
          )}
        </Box>

        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          gap: { xs: 3, md: 5 }, 
          flexWrap: 'wrap' 
        }}>
          <NoteDisplay 
            detectedNote={detected && detected.rms >= settings.rmsThreshold ? detected.pitch : null} 
            targetNoteName={currentTargetName}
            isCorrect={isProcessingSuccess || stabilityCounter === 100}
            isAlmost={stabilityCounter > 0 && stabilityCounter < 100}
            isFailure={isProcessingFailure}
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
                value={(isProcessingFailure || isProcessingSuccess) ? 100 : stabilityCounter} 
                size={24} 
                thickness={6}
                color={isProcessingSuccess ? "success" : (isProcessingFailure ? "error" : "primary")}
              />
            </Box>
            <VuMeter rms={detected?.rms || 0} threshold={settings.rmsThreshold} />
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default SessionRunner;
