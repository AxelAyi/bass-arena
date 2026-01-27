import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Box, Typography, Button, Container, Paper, Stack, alpha, useTheme, Fade, IconButton, Slider, Alert, CircularProgress } from '@mui/material';
import Grid from '@mui/material/Grid2';
import CloseIcon from '@mui/icons-material/Close';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TimerIcon from '@mui/icons-material/Timer';
import MusicNoteIcon from '@mui/icons-material/MusicNote';

import { useStore } from '../state/store';
import { AudioEngine, AudioStats } from '../audio/audioEngine';
import { MetronomeEngine } from '../audio/metronomeEngine';
import { translations } from '../localization/translations';
import { generateRhythmXML } from '../audio/noteUtils';
import RhythmGrid from './RhythmGrid';
import * as OSMDNamespace from 'opensheetmusicdisplay';

interface RhythmSessionRunnerProps {
  day: number;
  title: string;
  description: string;
  pattern: number[];
  midiSequence: number[];
  onFinish: () => void;
}

const RhythmSessionRunner: React.FC<RhythmSessionRunnerProps> = ({ day, title, description, pattern, midiSequence, onFinish }) => {
  const { settings, addSessionResult } = useStore();
  const theme = useTheme();
  const t = translations[settings.language].rhythm;

  const [bpm, setBpm] = useState(100);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(-1);
  const [countIn, setCountIn] = useState<number | null>(null);
  const [hits, setHits] = useState<boolean[]>(new Array(32).fill(false));
  const [misses, setMisses] = useState<boolean[]>(new Array(32).fill(false));
  const [loading, setLoading] = useState(true);

  const audioEngineRef = useRef<AudioEngine | null>(null);
  const metronomeRef = useRef<MetronomeEngine>(new MetronomeEngine());
  const osmdContainerRef = useRef<HTMLDivElement>(null);
  const osmdRef = useRef<any>(null);
  const timerRef = useRef<number | null>(null);
  const sessionStartTimeRef = useRef<number>(0);

  // Performance stats
  const totalCorrectRef = useRef(0);
  const totalTargetRef = useRef(pattern.filter(v => v === 1).length * 2); // 2 loops

  // Initialize OSMD
  useEffect(() => {
    const initOSMD = async () => {
      if (!osmdContainerRef.current) return;
      try {
        const OSMDClass = (OSMDNamespace as any).OpenSheetMusicDisplay || (OSMDNamespace as any).default;
        osmdRef.current = new OSMDClass(osmdContainerRef.current, {
          autoResize: true,
          drawTitle: false,
          drawSubtitle: false,
          drawComposer: false,
          drawMetronomeMarks: false,
          renderBackend: 'svg',
          cursorsOptions: [{ type: 1, color: theme.palette.primary.main, alpha: 0.6, follow: true }]
        });
        const xml = generateRhythmXML(pattern, midiSequence, settings.isFiveString);
        await osmdRef.current.load(xml);
        osmdRef.current.render();
        setLoading(false);
      } catch (err) {
        console.error("OSMD Error:", err);
      }
    };
    initOSMD();
    return () => {
      stopSession();
    };
  }, [pattern, midiSequence, settings.isFiveString]);

  const handleAudioProcess = useCallback((stats: AudioStats) => {
    if (!isReady || currentIdx < 0 || countIn !== null) return;

    if (stats.isOnset) {
      // Check if currentIdx is a target
      if (pattern[currentIdx] === 1 && !hits[currentIdx]) {
        setHits(prev => {
          const next = [...prev];
          next[currentIdx] = true;
          return next;
        });
        totalCorrectRef.current++;
      }
    }
  }, [isReady, currentIdx, countIn, pattern, hits]);

  const playBassGroove = useCallback((midi: number, time: number, ctx: AudioContext) => {
    if (!midi) return;
    const freq = 440 * Math.pow(2, (midi - 69) / 12);
    
    // Mix for "Classic" electric bass feel
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, time);

    const osc2 = ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq, time);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, time);
    filter.frequency.exponentialRampToValueAtTime(80, time + 0.3);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.35, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.4);
    
    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + 0.4);
    osc2.stop(time + 0.4);
  }, []);

  const runLoop = async (ctx: AudioContext) => {
    sessionStartTimeRef.current = ctx.currentTime;
    const intervalS = 60.0 / bpm / 4; // 16th notes
    let step = 0;
    const totalSteps = 64; // 2 bars repeated once (32 * 2)

    const schedule = () => {
      const currentTime = ctx.currentTime;
      const stepIdx = step % 32;

      // Update UI Cursor
      setCurrentIdx(stepIdx);

      // Play groove synth if in "Listen" mode
      if (isPlaying && !isReady) {
        const midi = midiSequence[stepIdx];
        if (midi) playBassGroove(midi, currentTime, ctx);
      }

      step++;
      if (step < totalSteps) {
        timerRef.current = window.setTimeout(schedule, intervalS * 1000);
      } else {
        finishSession();
      }
    };

    schedule();
  };

  const startSession = async () => {
    const ae = new AudioEngine(handleAudioProcess);
    const ctx = await ae.start(settings.selectedMicId);
    if (!ctx) return;
    audioEngineRef.current = ae;

    setHits(new Array(32).fill(false));
    setMisses(new Array(32).fill(false));
    totalCorrectRef.current = 0;

    // Count-in
    let c = 4;
    setCountIn(c);
    metronomeRef.current.start(ctx, bpm, 4, settings.metronomeSound, settings.metronomeVolume);
    
    const countInterval = setInterval(() => {
        c--;
        if (c > 0) {
            setCountIn(c);
        } else {
            clearInterval(countInterval);
            setCountIn(null);
            runLoop(ctx);
        }
    }, 60000 / bpm);
  };

  const stopSession = () => {
    setIsPlaying(false);
    setIsReady(false);
    setCountIn(null);
    setCurrentIdx(-1);
    if (timerRef.current) clearTimeout(timerRef.current);
    audioEngineRef.current?.stop();
    metronomeRef.current.stop();
  };

  const finishSession = () => {
    const accuracy = (totalCorrectRef.current / totalTargetRef.current) * 100;
    addSessionResult({
      date: new Date().toISOString(),
      score: Math.round(accuracy),
      accuracy: Math.min(100, accuracy),
      avgTime: 0,
      day,
      programId: 'rhythm'
    });
    stopSession();
    onFinish();
  };

  const handleListen = () => {
    setIsReady(false);
    setIsPlaying(true);
    startSession();
  };

  const handlePlayAlong = () => {
    setIsReady(true);
    setIsPlaying(true);
    startSession();
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack spacing={4}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" fontWeight="900" color="primary">{title}</Typography>
            <Typography variant="body2" color="textSecondary">{description}</Typography>
          </Box>
          <IconButton onClick={onFinish}><CloseIcon /></IconButton>
        </Box>

        <Paper sx={{ p: 1, minHeight: 200, position: 'relative', bgcolor: '#fff' }}>
           {loading && (
             <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <CircularProgress size={32} />
             </Box>
           )}
           <div ref={osmdContainerRef} style={{ width: '100%' }} />
        </Paper>

        <Paper sx={{ p: 3, borderRadius: 2 }}>
          <RhythmGrid pattern={pattern} currentIdx={currentIdx} hits={hits} misses={misses} />
          {countIn !== null && (
            <Box sx={{ textAlign: 'center', py: 2 }}>
               <Typography variant="h1" fontWeight="900" color="primary">{countIn}</Typography>
               <Typography variant="subtitle1" fontWeight="bold">{t.countIn}</Typography>
            </Box>
          )}
          {isReady && !countIn && (
            <Alert severity="info" icon={<MusicNoteIcon />}>
              <Typography variant="subtitle2" fontWeight="bold">{t.playAlong}</Typography>
            </Alert>
          )}
        </Paper>

        <Paper sx={{ p: 3, borderRadius: 2 }}>
          <Grid container spacing={4} alignItems="center">
            <Grid size={{ xs: 12, md: 6 }}>
               <Typography variant="subtitle2" fontWeight="bold" gutterBottom>{t.tempo}: {bpm}</Typography>
               <Slider 
                value={bpm} 
                min={50} max={140} 
                onChange={(_, v) => setBpm(v as number)} 
                disabled={isPlaying} 
               />
               {bpm === 140 && <Typography variant="caption" color="warning.main">{t.maxTempoReached}</Typography>}
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
               <Stack direction="row" spacing={2}>
                 {!isPlaying ? (
                   <>
                    <Button variant="outlined" fullWidth onClick={handleListen} startIcon={<PlayArrowIcon />}>
                      {t.listen}
                    </Button>
                    <Button variant="contained" fullWidth onClick={handlePlayAlong} startIcon={<CheckCircleIcon />}>
                      {t.play}
                    </Button>
                   </>
                 ) : (
                   <Button variant="contained" color="error" fullWidth onClick={stopSession} startIcon={<PauseIcon />}>
                     {t.stop}
                   </Button>
                 )}
               </Stack>
            </Grid>
          </Grid>
        </Paper>
      </Stack>
    </Container>
  );
};

export default RhythmSessionRunner;