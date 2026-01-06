import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Box, Typography, Card, CardContent, CardActionArea, LinearProgress, Chip, Alert, Snackbar, Tabs, Tab, Paper } from '@mui/material';
import Grid from '@mui/material/Grid2';
// Fix: Use module import to bypass named export type check
import * as ReactRouterDOM from 'react-router-dom';
import LockIcon from '@mui/icons-material/Lock';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import StarIcon from '@mui/icons-material/Star';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import { PROGRAMS, DayTask } from '../data/program30days';
import { useStore } from '../state/store';
import { translations } from '../localization/translations';
import SessionRunner from '../components/SessionRunner';
import { getAllPositionsInRanges, FretPosition } from '../data/fretboard';
import { translateTextWithNotes } from '../audio/noteUtils';

// Fix: Extract useLocation from module via casting
const { useLocation } = ReactRouterDOM as any;

interface ActiveTaskInfo {
  task: DayTask;
  questions: FretPosition[];
  title: string;
  onNext?: { label: string; action: () => void };
}

const Program: React.FC = () => {
  const { history, settings, activeProgramId, setActiveProgramId } = useStore();
  const t = translations[settings.language].program;
  const location = useLocation();
  
  const [activeTask, setActiveTask] = useState<ActiveTaskInfo | null>(null);
  const [sessionKey, setSessionKey] = useState(0); 
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setActiveTask(null);
  }, [location.key]);

  const activeProgram = useMemo(() => 
    PROGRAMS.find(p => p.id === activeProgramId) || PROGRAMS[0],
  [activeProgramId]);

  const filteredDays = useMemo(() => {
    return activeProgram.days.filter(day => {
      if (!settings.isFiveString && day.isFiveStringOnly) return false;
      return true;
    });
  }, [activeProgram.days, settings.isFiveString]);

  const localizedProgramName = useMemo(() => {
    if (settings.language === 'fr') return activeProgram.name_fr || activeProgram.name;
    if (settings.language === 'es') return activeProgram.name_es || activeProgram.name;
    return activeProgram.name;
  }, [activeProgram, settings.language]);

  const localizedProgramDesc = useMemo(() => {
    if (settings.language === 'fr') return activeProgram.description_fr || activeProgram.description;
    if (settings.language === 'es') return activeProgram.description_es || activeProgram.description;
    return activeProgram.description;
  }, [activeProgram, settings.language]);

  const dailyStats = useMemo(() => {
    const stats: Record<number, { bestAcc: number, bestScore: number }> = {};
    history.forEach(session => {
      if (session.programId === activeProgramId && session.day !== undefined) {
        const day = session.day;
        const current = stats[day];
        if (!current) {
          stats[day] = { bestAcc: session.accuracy, bestScore: session.score };
        } else {
          stats[day] = {
            bestAcc: Math.max(current.bestAcc, session.accuracy),
            bestScore: Math.max(current.bestScore, session.score)
          };
        }
      }
    });
    return stats;
  }, [history, activeProgramId]);

  const masteredCount = useMemo(() => 
    filteredDays.filter(task => {
      const stats = dailyStats[task.day];
      return stats && stats.bestAcc >= settings.minUnlockAccuracy;
    }).length,
  [filteredDays, dailyStats, settings.minUnlockAccuracy]);
  
  const progressPercent = (masteredCount / filteredDays.length) * 100;

  const isTaskUnlocked = useCallback((taskIndex: number) => {
    if (settings.unlockAllExercises) return true;
    if (taskIndex === 0) return true;
    const prevTask = filteredDays[taskIndex - 1];
    const prevStats = dailyStats[prevTask.day];
    return !!(prevStats && prevStats.bestAcc >= settings.minUnlockAccuracy);
  }, [filteredDays, dailyStats, settings.minUnlockAccuracy, settings.unlockAllExercises]);

  const sanitizeText = useCallback((task: DayTask, type: 'title' | 'description') => {
    let clean = '';
    
    if (settings.language === 'fr') {
      clean = (type === 'title' ? task.title_fr : task.description_fr) || (type === 'title' ? task.title : task.description);
    } else if (settings.language === 'es') {
      clean = (type === 'title' ? task.title_es : task.description_es) || (type === 'title' ? task.title : task.description);
    } else {
      clean = (type === 'title' ? task.title : task.description);
    }

    if (!settings.isFiveString) {
      clean = clean
        .replace(/\s*&\s*B/gi, '')
        .replace(/\s*y\s*Si/gi, '')
        .replace(/\s*&\s*Si/gi, '')
        .replace(/\s*and\s*B/gi, '')
        .replace(/B\s*&\s*/gi, '')
        .replace(/Si\s*&\s*/gi, '')
        .replace(/B\s*string/gi, 'lower strings')
        .replace(/Corde\s*Si/gi, 'cordes graves')
        .replace(/Cuerda\s*Si/gi, 'cuerdas graves')
        .replace(/B:/gi, ':')
        .replace(/Si:/gi, ':')
        .replace(/\s+/g, ' ')
        .trim();
    }
    
    return translateTextWithNotes(clean, settings.noteNaming);
  }, [settings.isFiveString, settings.noteNaming, settings.language]);

  const generateQuestions = useCallback((task: DayTask): FretPosition[] => {
    if (task.sequence) return []; 

    const stringsToUse = settings.isFiveString ? task.strings : task.strings.filter(s => s !== 4);
    
    const pool = getAllPositionsInRanges(task.fretRange[1], stringsToUse)
      .filter(p => p.fret >= task.fretRange[0]);
    
    let filteredPool = pool;
    if (task.focusNotes && task.focusNotes.length > 0) {
      filteredPool = pool.filter(p => task.focusNotes!.includes(p.noteName));
    }

    if (filteredPool.length === 0) return [];

    const targetCount = task.questionCount || 10;
    let finalQuestions: FretPosition[] = [];
    
    const shuffledPool = [...filteredPool].sort(() => 0.5 - Math.random());
    finalQuestions = [...shuffledPool];

    while (finalQuestions.length < targetCount) {
      const more = [...filteredPool].sort(() => 0.5 - Math.random());
      finalQuestions = [...finalQuestions, ...more];
    }

    return finalQuestions.slice(0, targetCount);
  }, [settings.isFiveString]);

  const handleStartTask = useCallback((task: DayTask, force: boolean = false) => {
    const taskIndex = filteredDays.findIndex(d => d.day === task.day);
    if (force || isTaskUnlocked(taskIndex)) {
      const qs = generateQuestions(task);
      const taskTitle = sanitizeText(task, 'title');
      
      if (qs.length === 0 && !task.sequence) {
        setError(t.noNotesError);
        return;
      }

      const nextTask = filteredDays[taskIndex + 1];
      const onNext = nextTask ? {
        label: sanitizeText(nextTask, 'title'),
        action: () => handleStartTask(nextTask, true) 
      } : undefined;

      setActiveTask({ 
        task, 
        questions: qs, 
        title: taskTitle,
        onNext 
      });
      setSessionKey(prev => prev + 1);
    }
  }, [isTaskUnlocked, generateQuestions, sanitizeText, t.noNotesError, filteredDays]);

  if (activeTask) {
    return (
      <SessionRunner 
        key={sessionKey}
        questions={activeTask.questions} 
        title={activeTask.title}
        onFinish={() => setActiveTask(null)}
        day={activeTask.task.day}
        programId={activeProgramId}
        onReplay={() => handleStartTask(activeTask.task, true)}
        onNext={activeTask.onNext}
        sequence={activeTask.task.sequence}
      />
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <MenuBookIcon color="primary" sx={{ fontSize: 32, mr: 1.5 }} />
        <Typography variant="h5" fontWeight="900" sx={{ letterSpacing: -1 }}>{t.title}</Typography>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Paper 
          sx={{ 
            mb: 3,
            borderRadius: 2, 
            overflow: 'hidden',
            border: 'none',
            bgcolor: 'background.paper'
          }} 
          elevation={0}
        >
          <Tabs 
            value={activeProgramId} 
            onChange={(_, val) => setActiveProgramId(val)} 
            variant="scrollable"
            scrollButtons="auto"
            sx={{ px: 1, minHeight: 48 }}
          >
            {PROGRAMS.map(p => (
              <Tab 
                key={p.id} 
                label={
                  settings.language === 'fr' ? (p.name_fr || p.name) : 
                  settings.language === 'es' ? (p.name_es || p.name) : 
                  p.name
                } 
                value={p.id} 
                sx={{ py: 1.5, fontWeight: 700, px: 2 }}
              />
            ))}
          </Tabs>
        </Paper>
        
        <Box sx={{ mb: 4, p: 3, bgcolor: 'rgba(33, 150, 243, 0.04)', borderRadius: 2 }}>
          <Typography variant="h6" fontWeight="800" gutterBottom>{localizedProgramName}</Typography>
          <Typography variant="body2" color="textSecondary" gutterBottom sx={{ maxWidth: 700 }}>
            {localizedProgramDesc} {settings.minUnlockAccuracy}% {t.needAccuracy}.
          </Typography>
          <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ flexGrow: 1 }}>
              <LinearProgress 
                variant="determinate" 
                value={progressPercent} 
                sx={{ height: 8, borderRadius: 4, bgcolor: 'divider' }} 
              />
            </Box>
            <Typography variant="subtitle2" fontWeight="bold">{masteredCount}/{filteredDays.length} {t.mastered}</Typography>
          </Box>
        </Box>
      </Box>

      <Grid container spacing={2} sx={{ mb: 4 }}>
        {filteredDays.map((task, index) => {
          const stats = dailyStats[task.day] || { bestAcc: 0, bestScore: 0 };
          const isMastered = stats.bestAcc >= settings.minUnlockAccuracy;
          const unlocked = isTaskUnlocked(index);
          
          return (
            <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={task.day}>
              <Card 
                sx={{ 
                  height: '100%', 
                  opacity: unlocked ? 1 : 0.6,
                  bgcolor: isMastered ? 'rgba(76, 175, 80, 0.05)' : 'background.paper',
                  border: isMastered ? '1px solid rgba(76, 175, 80, 0.2)' : (unlocked ? '1px solid divider' : '1px dashed divider'),
                  boxShadow: 'none',
                  borderRadius: 2
                }}
                elevation={0}
              >
                <CardActionArea onClick={() => handleStartTask(task)} disabled={!unlocked} sx={{ height: '100%' }}>
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                      <Chip 
                        label={`${t.day} ${index + 1}`} 
                        size="small" 
                        color={unlocked ? "primary" : "default"}
                        sx={{ fontWeight: 800, borderRadius: 1 }} 
                      />
                      {isMastered ? (
                        <CheckCircleIcon color="success" fontSize="small" />
                      ) : (unlocked ? null : <LockIcon color="disabled" fontSize="small" />)}
                    </Box>
                    <Typography variant="subtitle1" gutterBottom fontWeight="800" color={unlocked ? "text.primary" : "text.disabled"}>
                      {sanitizeText(task, 'title')}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2, minHeight: 32 }}>
                      {sanitizeText(task, 'description')}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                       {stats.bestAcc > 0 ? (
                         <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                           <StarIcon sx={{ color: isMastered ? '#4caf50' : '#ff9800', fontSize: 16 }} />
                           <Typography variant="caption" sx={{ fontWeight: 800, color: isMastered ? '#4caf50' : '#ff9800' }}>
                             {t.best}: {stats.bestAcc.toFixed(0)}%
                           </Typography>
                         </Box>
                       ) : (
                         <Typography variant="caption" color="text.disabled">{t.noAttempts}</Typography>
                       )}
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip label={`${t.fret} ${task.fretRange[0]}-${task.fretRange[1]}`} size="small" variant="outlined" sx={{ borderRadius: 1, fontSize: '0.7rem' }} />
                      {activeProgramId !== 'pentatonic' && (
                        <Chip label={`${task.questionCount || 10} ${t.notes}`} size="small" variant="outlined" sx={{ borderRadius: 1, fontSize: '0.7rem', opacity: 0.6 }} />
                      )}
                      {task.sequence && <Chip label={`♪ ${t.scale}`} size="small" color="secondary" variant="filled" sx={{ fontWeight: 700, borderRadius: 1, fontSize: '0.7rem' }} />}
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          );
        })}
      </Grid>
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
        <Alert onClose={() => setError(null)} severity="error" variant="filled" sx={{ width: '100%' }}>{error}</Alert>
      </Snackbar>
    </Box>
  );
};

export default Program;