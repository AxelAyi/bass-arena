
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Typography, Button, IconButton, Container, Fade, CircularProgress } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useStore } from '../state/store';
import { AudioEngine, AudioStats } from '../audio/audioEngine';
import { FretPosition, getFretInfo } from '../data/fretboard';
import { validateNote } from '../audio/noteUtils';
import TimerBar from './TimerBar';
import NoteDisplay from './NoteDisplay';
import VuMeter from './VuMeter';
import ScoreSummary from './ScoreSummary';

interface SessionRunnerProps {
  questions: FretPosition[];
  onFinish: () => void;
  day?: number;
}

const SessionRunner: React.FC<SessionRunnerProps> = ({ questions, onFinish, day }) => {
  const { settings, addSessionResult } = useStore();
  
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(settings.timeLimit);
  const [isFinished, setIsFinished] = useState(false);
  const [detected, setDetected] = useState<AudioStats | null>(null);
  const [stabilityCounter, setStabilityCounter] = useState(0);
  const [results, setResults] = useState<{ correct: boolean, time: number }[]>([]);
  const [sessionStartTime] = useState(Date.now());

  const audioEngineRef = useRef<AudioEngine | null>(null);
  const timerRef = useRef<any>(null);
  const questionStartTimeRef = useRef<number>(Date.now());
  const stabilityCheckRef = useRef<number | null>(null);

  const currentQuestion = questions[currentIdx];

  // Logic to handle incoming audio stats
  const handleAudioProcess = useCallback((stats: AudioStats) => {
    setDetected(stats);
    
    if (!stats.pitch || stats.rms < settings.rmsThreshold) {
      setStabilityCounter(0);
      stabilityCheckRef.current = null;
      return;
    }

    const isValid = validateNote(stats.pitch.midi, currentQuestion.midi, settings.strictOctave);
    
    if (isValid) {
      if (stabilityCheckRef.current === null) {
        stabilityCheckRef.current = Date.now();
      } else {
        const elapsed = Date.now() - stabilityCheckRef.current;
        setStabilityCounter(Math.min(100, (elapsed / settings.stabilityMs) * 100));
        
        if (elapsed >= settings.stabilityMs) {
          handleSuccess();
        }
      }
    } else {
      setStabilityCounter(0);
      stabilityCheckRef.current = null;
    }
  }, [currentIdx, currentQuestion, settings]);

  const handleSuccess = useCallback(() => {
    if (isFinished) return;
    
    const timeTaken = (Date.now() - questionStartTimeRef.current) / 1000;
    let bonus = 0;
    if (timeTaken < 1.5) bonus = 0.5;
    else if (timeTaken < 2.5) bonus = 0.25;

    setScore(s => s + 1 + bonus);
    setResults(r => [...r, { correct: true, time: timeTaken }]);
    nextQuestion();
  }, [currentIdx, isFinished]);

  const handleTimeout = useCallback(() => {
    setResults(r => [...r, { correct: false, time: settings.timeLimit }]);
    nextQuestion();
  }, [currentIdx, settings.timeLimit]);

  const nextQuestion = useCallback(() => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(i => i + 1);
      setTimeLeft(settings.timeLimit);
      questionStartTimeRef.current = Date.now();
      setStabilityCounter(0);
      stabilityCheckRef.current = null;
    } else {
      finishSession();
    }
  }, [currentIdx, questions.length, settings.timeLimit]);

  const finishSession = useCallback(() => {
    setIsFinished(true);
    if (audioEngineRef.current) audioEngineRef.current.stop();
    if (timerRef.current) clearInterval(timerRef.current);

    const totalQuestions = questions.length;
    const correctAnswers = results.filter(r => r.correct).length;
    const avgTime = results.reduce((acc, r) => acc + r.time, 0) / results.length;
    
    const finalResult = {
      date: new Date().toISOString(),
      score: Math.round(score * 10) / 10,
      accuracy: (correctAnswers / totalQuestions) * 100,
      avgTime,
      day
    };
    
    addSessionResult(finalResult);
  }, [questions.length, results, score, day, addSessionResult]);

  // Init audio and timers
  useEffect(() => {
    audioEngineRef.current = new AudioEngine(handleAudioProcess);
    audioEngineRef.current.start(settings.selectedMicId);

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0.1) {
          handleTimeout();
          return settings.timeLimit;
        }
        return prev - 0.1;
      });
    }, 100);

    return () => {
      if (audioEngineRef.current) audioEngineRef.current.stop();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [handleAudioProcess, handleTimeout, settings.selectedMicId, settings.timeLimit]);

  if (isFinished) {
    const totalQuestions = questions.length;
    const correctAnswers = results.filter(r => r.correct).length;
    const avgTime = results.reduce((acc, r) => acc + r.time, 0) / results.length;
    
    return (
      <ScoreSummary 
        result={{
          date: new Date().toISOString(),
          score: Math.round(score * 10) / 10,
          accuracy: (correctAnswers / totalQuestions) * 100,
          avgTime
        }} 
        onClose={onFinish} 
      />
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Question {currentIdx + 1} / {questions.length}</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h6" color="primary">Score: {score}</Typography>
          <IconButton onClick={onFinish} color="inherit"><CloseIcon /></IconButton>
        </Box>
      </Box>

      <TimerBar remaining={timeLeft} total={settings.timeLimit} />

      <Box sx={{ textAlign: 'center', my: 6 }}>
        <Typography variant="h5" color="textSecondary" gutterBottom>
          Play note
        </Typography>
        <Typography variant="h2" sx={{ fontWeight: 800, mb: 1 }}>
          {currentQuestion.noteName}
        </Typography>
        <Typography variant="h5" color="primary">
          on the <span style={{ textDecoration: 'underline' }}>{currentQuestion.stringName} string</span>
        </Typography>
        {settings.showFretNumber && (
          <Typography variant="subtitle1" color="textSecondary" sx={{ mt: 1 }}>
            (Hint: Fret {currentQuestion.fret})
          </Typography>
        )}
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
        <NoteDisplay 
          detectedNote={detected?.pitch || null} 
          targetNoteName={currentQuestion.noteName}
          isCorrect={stabilityCounter === 100}
          isAlmost={stabilityCounter > 0 && stabilityCounter < 100}
          debug={true}
          rms={detected?.rms || 0}
        />
        
        <Box sx={{ width: 250 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <CircularProgress 
              variant="determinate" 
              value={stabilityCounter} 
              size={40} 
              thickness={5} 
              color={stabilityCounter === 100 ? "success" : "primary"}
            />
            <Typography variant="body2">Stability</Typography>
          </Box>
          <VuMeter rms={detected?.rms || 0} threshold={settings.rmsThreshold} />
        </Box>
      </Box>
    </Container>
  );
};

export default SessionRunner;
