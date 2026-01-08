
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Box, Typography, Card, CardContent, CardActionArea, LinearProgress, Chip, Alert, Snackbar, Tabs, Tab, Paper, FormControlLabel, Switch, IconButton, Tooltip, keyframes, alpha, useTheme } from '@mui/material';
import Grid from '@mui/material/Grid2';
import * as ReactRouterDOM from 'react-router-dom';
import LockIcon from '@mui/icons-material/Lock';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import StarIcon from '@mui/icons-material/Star';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import SchoolIcon from '@mui/icons-material/School';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import EventRepeatIcon from '@mui/icons-material/EventRepeat';
import TimerIcon from '@mui/icons-material/Timer';
import { PROGRAMS, DayTask } from '../data/program30days';
import { useStore } from '../state/store';
import { translations } from '../localization/translations';
import SessionRunner from '../components/SessionRunner';
import MicPermissionDialog from '../components/MicPermissionDialog';
import SRSExplainer from '../components/SRSExplainer';
import { getAllPositionsInRanges, FretPosition } from '../data/fretboard';
import { translateTextWithNotes } from '../audio/noteUtils';

const { useLocation } = ReactRouterDOM as any;

const pulse = keyframes`
  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(211, 47, 47, 0.4); }
  70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(211, 47, 47, 0); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(211, 47, 47, 0); }
`;

interface ActiveTaskInfo {
  task: DayTask;
  questions: FretPosition[];
  title: string;
}

const Program: React.FC = () => {
  const { history, settings, activeProgramId, setActiveProgramId, isMicEnabled, updateSettings, srsProgress } = useStore();
  const theme = useTheme();
  const t = translations[settings.language].program;
  const location = useLocation();
  
  const [activeTask, setActiveTask] = useState<ActiveTaskInfo | null>(null);
  const [sessionKey, setSessionKey] = useState(0); 
  const [error, setError] = useState<string | null>(null);
  const [micDialogOpen, setMicDialogOpen] = useState(false);
  const [srsExplainerOpen, setSrsExplainerOpen] = useState(false);
  const [pendingTask, setPendingTask] = useState<DayTask | null>(null);

  useEffect(() => {
    setActiveTask(null);
  }, [location.key]);

  const activeProgram = useMemo(() => 
    PROGRAMS.find(p => p.id === activeProgramId) || PROGRAMS[0],
  [activeProgramId]);

  // Fix: Define localized name and description for the active program to resolve "Cannot find name" errors
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

  const filteredDays = useMemo(() => {
    return activeProgram.days.filter(day => {
      if (!settings.isFiveString && day.isFiveStringOnly) return false;
      return true;
    });
  }, [activeProgram.days, settings.isFiveString]);

  const dailyStats = useMemo(() => {
    const stats: Record<number, { bestAcc: number, bestScore: number, isBeginnerBest: boolean, hasProCompletion: boolean }> = {};
    history.forEach(session => {
      if (session.programId === activeProgramId && session.day !== undefined) {
        const day = session.day;
        const current = stats[day];
        const isBetter = !current || session.accuracy > current.bestAcc;
        const isSuccessful = session.accuracy >= settings.minUnlockAccuracy;
        
        if (!current) {
          stats[day] = { 
            bestAcc: session.accuracy, 
            bestScore: session.score, 
            isBeginnerBest: !!session.wasBeginnerMode,
            hasProCompletion: isSuccessful && !session.wasBeginnerMode
          };
        } else {
          if (isSuccessful && !session.wasBeginnerMode) {
            current.hasProCompletion = true;
          }
          if (isBetter) {
            current.bestAcc = session.accuracy;
            current.bestScore = session.score;
            current.isBeginnerBest = !!session.wasBeginnerMode;
          }
        }
      }
    });
    return stats;
  }, [history, activeProgramId, settings.minUnlockAccuracy]);

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
    const pool = getAllPositionsInRanges(task.fretRange[1], stringsToUse).filter(p => p.fret >= task.fretRange[0]);
    if (pool.length === 0) return [];
    const targetCount = task.questionCount || 10;
    const finalQuestions: FretPosition[] = [];
    let lastMidi: number | null = null;
    while (finalQuestions.length < targetCount) {
      const candidates = pool.filter(p => p.midi !== lastMidi);
      const source = candidates.length > 0 ? candidates : pool;
      const pick = source[Math.floor(Math.random() * source.length)];
      finalQuestions.push(pick);
      lastMidi = pick.midi;
    }
    return finalQuestions;
  }, [settings.isFiveString]);

  const startActualTask = useCallback((task: DayTask) => {
    const qs = generateQuestions(task);
    const taskTitle = sanitizeText(task, 'title');
    if (qs.length === 0 && !task.sequence) {
      setError(t.noNotesError);
      return;
    }
    setActiveTask({ task, questions: qs, title: taskTitle });
    setSessionKey(prev => prev + 1);
  }, [generateQuestions, sanitizeText, t.noNotesError]);

  const handleStartTask = useCallback((task: DayTask, force: boolean = false) => {
    const taskIndex = filteredDays.findIndex(d => d.day === task.day);
    if (force || isTaskUnlocked(taskIndex)) {
      if (!isMicEnabled && !force) {
        setPendingTask(task);
        setMicDialogOpen(true);
      } else {
        startActualTask(task);
      }
    }
  }, [isTaskUnlocked, isMicEnabled, filteredDays, startActualTask]);

  const handleToggleSrs = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateSettings({ srsEnabled: e.target.checked });
  };

  const getSrsLevelColor = (level: number) => {
    if (level === 0) return 'default';
    if (level <= 2) return 'warning';
    if (level <= 4) return 'primary';
    return 'success';
  };

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
        onNext={null as any}
        sequence={activeTask.task.sequence}
      />
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <MenuBookIcon color="primary" sx={{ fontSize: 32, mr: 1.5 }} />
          <Typography variant="h5" fontWeight="900" sx={{ letterSpacing: -1 }}>{t.title}</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, bgcolor: alpha(theme.palette.primary.main, 0.05), px: 2, py: 0.5, borderRadius: 10, border: '1px solid', borderColor: alpha(theme.palette.primary.main, 0.1) }}>
          <FormControlLabel
            control={<Switch checked={settings.srsEnabled} onChange={handleToggleSrs} size="small" />}
            label={<Typography variant="caption" fontWeight="900" color="primary">{t.srsMode}</Typography>}
            sx={{ m: 0 }}
          />
          <IconButton size="small" onClick={() => setSrsExplainerOpen(true)} color="primary">
            <HelpOutlineIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Paper 
          sx={{ mb: 3, borderRadius: 2, overflow: 'hidden', border: 'none', bgcolor: 'background.paper' }} 
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
                label={settings.language === 'fr' ? (p.name_fr || p.name) : settings.language === 'es' ? (p.name_es || p.name) : p.name} 
                value={p.id} 
                sx={{ py: 1.5, fontWeight: 700, px: 2 }}
              />
            ))}
          </Tabs>
        </Paper>
        
        <Box sx={{ mb: 4, p: 3, bgcolor: alpha(theme.palette.primary.main, 0.04), borderRadius: 2 }}>
          <Typography variant="h6" fontWeight="800" gutterBottom>{localizedProgramName}</Typography>
          <Typography variant="body2" color="textSecondary" gutterBottom sx={{ maxWidth: 700 }}>
            {localizedProgramDesc} {settings.minUnlockAccuracy}% {t.needAccuracy}.
          </Typography>
          <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ flexGrow: 1 }}>
              <LinearProgress variant="determinate" value={progressPercent} sx={{ height: 8, borderRadius: 4, bgcolor: 'divider' }} />
            </Box>
            <Typography variant="subtitle2" fontWeight="bold">{masteredCount}/{filteredDays.length} {t.mastered}</Typography>
          </Box>
        </Box>
      </Box>

      <Grid container spacing={2} sx={{ mb: 4 }}>
        {filteredDays.map((task, index) => {
          const stats = dailyStats[task.day] || { bestAcc: 0, bestScore: 0, isBeginnerBest: false, hasProCompletion: false };
          const srs = srsProgress[`${activeProgramId}-day${task.day}`] || { level: 0, nextReview: '' };
          const isSuccessful = stats.bestAcc >= settings.minUnlockAccuracy;
          const unlocked = isTaskUnlocked(index);
          const showBeginnerBadge = isSuccessful && !stats.hasProCompletion;
          
          const isDue = settings.srsEnabled && srs.nextReview && new Date(srs.nextReview) <= new Date();
          const isLevel5 = srs.level === 5;

          return (
            <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={task.day}>
              <Card 
                sx={{ 
                  height: '100%', 
                  opacity: unlocked ? 1 : 0.6,
                  bgcolor: isDue ? alpha(theme.palette.error.main, 0.05) : (isSuccessful ? alpha(theme.palette.success.main, 0.05) : 'background.paper'),
                  border: isDue ? `2px solid ${theme.palette.error.main}` : (isSuccessful ? `1px solid ${alpha(theme.palette.success.main, 0.2)}` : (unlocked ? '1px solid divider' : '1px dashed divider')),
                  animation: isDue ? `${pulse} 2s infinite ease-in-out` : 'none',
                  boxShadow: isLevel5 ? `0 0 15px ${alpha(theme.palette.success.main, 0.2)}` : 'none',
                  borderRadius: 2,
                  position: 'relative',
                  overflow: 'hidden'
                }}
                elevation={0}
              >
                {isLevel5 && (
                  <Box sx={{ position: 'absolute', top: 0, right: 0, width: 40, height: 40, background: 'linear-gradient(45deg, transparent 50%, #4caf50 50%)', opacity: 0.8 }} />
                )}
                <CardActionArea onClick={() => handleStartTask(task)} disabled={!unlocked} sx={{ height: '100%' }}>
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5, alignItems: 'flex-start' }}>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                        <Chip 
                          label={`${t.day} ${index + 1}`} 
                          size="small" 
                          color={unlocked ? "primary" : "default"}
                          sx={{ fontWeight: 800, borderRadius: 1 }} 
                        />
                        {settings.srsEnabled && srs.level > 0 && (
                          <Chip 
                            icon={<EventRepeatIcon sx={{ fontSize: '0.8rem !important' }} />}
                            label={`${t.srsLevel} ${srs.level}`}
                            size="small"
                            color={getSrsLevelColor(srs.level)}
                            sx={{ fontWeight: 800, height: 20, fontSize: '0.65rem', borderRadius: 1 }}
                          />
                        )}
                        {showBeginnerBadge && !isDue && (
                          <Chip icon={<SchoolIcon sx={{ fontSize: '0.9rem !important' }} />} label={t.beginnerBadge} size="small" variant="outlined" color="secondary" sx={{ fontWeight: 700, height: 20, fontSize: '0.65rem', borderRadius: 1 }} />
                        )}
                        {isDue && (
                          <Chip label={t.srsBadge} size="small" color="error" sx={{ fontWeight: 900, height: 20, fontSize: '0.65rem', borderRadius: 1 }} />
                        )}
                      </Box>
                      {isLevel5 ? (
                         <StarIcon color="success" fontSize="small" />
                      ) : isSuccessful ? (
                        <CheckCircleIcon color="success" fontSize="small" />
                      ) : (unlocked ? null : <LockIcon color="disabled" fontSize="small" />)}
                    </Box>
                    <Typography variant="subtitle1" gutterBottom fontWeight="800" color={unlocked ? "text.primary" : "text.disabled"}>
                      {sanitizeText(task, 'title')}
                    </Typography>
                    
                    {settings.srsEnabled && srs.level > 0 && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                        <TimerIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                        <Typography variant="caption" color="textSecondary" fontWeight="700">
                          {t.srsNext} {isDue ? <span style={{ color: theme.palette.error.main }}>{t.srsToday}</span> : (isLevel5 ? t.srsMastered : new Date(srs.nextReview).toLocaleDateString())}
                        </Typography>
                      </Box>
                    )}

                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2, minHeight: 32 }}>
                      {sanitizeText(task, 'description')}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                       {stats.bestAcc > 0 ? (
                         <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                           <StarIcon sx={{ color: isSuccessful ? '#4caf50' : '#ff9800', fontSize: 16 }} />
                           <Typography variant="caption" sx={{ fontWeight: 800, color: isSuccessful ? '#4caf50' : '#ff9800' }}>
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
      <MicPermissionDialog 
        open={micDialogOpen} 
        onClose={() => setMicDialogOpen(false)} 
        onSuccess={() => pendingTask && handleStartTask(pendingTask, true)} 
      />
      <SRSExplainer 
        open={srsExplainerOpen} 
        onClose={() => setSrsExplainerOpen(false)} 
      />
    </Box>
  );
};

export default Program;
