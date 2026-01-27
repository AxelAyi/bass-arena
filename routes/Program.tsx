import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Box, Typography, Card, CardContent, CardActionArea, LinearProgress, Chip, Alert, Snackbar, Tabs, Tab, Paper, FormControlLabel, Switch, IconButton, keyframes, alpha, useTheme, Stack } from '@mui/material';
import Grid from '@mui/material/Grid2';
import * as ReactRouterDOM from 'react-router-dom';
import LockIcon from '@mui/icons-material/Lock';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import HistoryToggleOffIcon from '@mui/icons-material/HistoryToggleOff';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import EventRepeatIcon from '@mui/icons-material/EventRepeat';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import SignalCellularAltIcon from '@mui/icons-material/SignalCellularAlt';

import { PROGRAMS, DayTask } from '../data/program30days';
import { useStore } from '../state/store';
import { translations } from '../localization/translations';
import SessionRunner from '../components/SessionRunner';
import EarTrainingSessionRunner from '../components/EarTrainingSessionRunner';
import MicPermissionDialog from '../components/MicPermissionDialog';
import SRSExplainer from '../components/SRSExplainer';
import SRSTimeline from '../components/SRSTimeline';
import { getAllPositionsInRanges, FretPosition } from '../data/fretboard';
import { translateTextWithNotes } from '../audio/noteUtils';

const { useParams, useNavigate } = ReactRouterDOM as any;

const pulse = keyframes`
  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 179, 0, 0.4); }
  70% { transform: scale(1.02); box-shadow: 0 0 0 10px rgba(255, 179, 0, 0); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 179, 0, 0); }
`;

const glow = keyframes`
  0% { border-color: rgba(255, 179, 0, 0.2); box-shadow: 0 0 5px rgba(255, 179, 0, 0.1); }
  50% { border-color: rgba(255, 179, 0, 0.6); box-shadow: 0 0 15px rgba(255, 179, 0, 0.2); }
  100% { border-color: rgba(255, 179, 0, 0.2); box-shadow: 0 0 5px rgba(255, 179, 0, 0.1); }
`;

interface ActiveTaskInfo {
  task: DayTask;
  questions: FretPosition[];
  title: string;
}

const Program: React.FC = () => {
  const { history, settings, updateSettings, srsProgress, isMicEnabled } = useStore();
  const { programId, day } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const t = translations[settings.language].program;
  
  const [activeTask, setActiveTask] = useState<ActiveTaskInfo | null>(null);
  const [sessionKey, setSessionKey] = useState(0); 
  const [error, setError] = useState<string | null>(null);
  const [micDialogOpen, setMicDialogOpen] = useState(false);
  const [srsExplainerOpen, setSrsExplainerOpen] = useState(false);
  const [pendingTask, setPendingTask] = useState<DayTask | null>(null);
  
  const lastLaunchedRef = useRef<string | null>(null);

  const currentProgramId = useMemo(() => programId || 'fretboard', [programId]);
  const activeProgram = useMemo(() => PROGRAMS.find(p => p.id === currentProgramId) || PROGRAMS[0], [currentProgramId]);

  const filteredDays = useMemo(() => {
    return activeProgram.days.filter(d => settings.isFiveString || !d.isFiveStringOnly);
  }, [activeProgram.days, settings.isFiveString]);

  const sanitizeText = useCallback((task: DayTask, type: 'title' | 'description') => {
    let clean = '';
    if (settings.language === 'fr') clean = (type === 'title' ? task.title_fr : task.description_fr) || (type === 'title' ? task.title : task.description);
    else if (settings.language === 'es') clean = (type === 'title' ? task.title_es : task.description_es) || (type === 'title' ? task.title : task.description);
    else clean = (type === 'title' ? task.title : task.description);

    if (!settings.isFiveString) {
      clean = clean.replace(/\s*&\s*B/gi, '').replace(/\s*y\s*Si/gi, '').replace(/\s*&\s*Si/gi, '').replace(/\s*and\s*B/gi, '').replace(/B\s*&\s*/gi, '').replace(/Si\s*&\s*/gi, '').replace(/B\s*string/gi, 'lower strings').replace(/Corde\s*Si/gi, 'cordes graves').replace(/Cuerda\s*Si/gi, 'cuerdas graves').replace(/B:/gi, ':').replace(/Si:/gi, ':').replace(/\s+/g, ' ').trim();
    }
    return translateTextWithNotes(clean, settings.noteNaming);
  }, [settings.isFiveString, settings.noteNaming, settings.language]);

  const onNextAction = useMemo(() => {
    if (!day) return undefined;
    const currentDayNum = parseInt(day);
    const currentIndex = filteredDays.findIndex(d => d.day === currentDayNum);
    if (currentIndex === -1 || currentIndex >= filteredDays.length - 1) return undefined;
    
    const nextTask = filteredDays[currentIndex + 1];
    return {
      label: sanitizeText(nextTask, 'title'),
      action: () => {
        navigate(`/program/${currentProgramId}/day/${nextTask.day}`);
      }
    };
  }, [day, filteredDays, currentProgramId, navigate, sanitizeText]);

  const srsStats = useMemo(() => {
    let dueCount = 0;
    let upNextCount = 0;
    let totalMastered = 0;
    const now = new Date();

    filteredDays.forEach(task => {
      const srs = srsProgress[`${currentProgramId}-day${task.day}`];
      if (srs) {
        if (srs.level === 5) totalMastered++;
        else if (srs.nextReview) {
          const reviewDate = new Date(srs.nextReview);
          if (reviewDate <= now) dueCount++;
          else upNextCount++;
        }
      }
    });

    return { dueCount, upNextCount, totalMastered };
  }, [filteredDays, currentProgramId, srsProgress]);

  const dailyStats = useMemo(() => {
    const stats: Record<number, { bestAcc: number, bestScore: number, isBeginnerBest: boolean, hasProCompletion: boolean }> = {};
    history.forEach(session => {
      if (session.programId === currentProgramId && session.day !== undefined) {
        const dayNum = session.day;
        const current = stats[dayNum];
        const isBetter = !current || session.accuracy > current.bestAcc;
        const isSuccessful = session.accuracy >= settings.minUnlockAccuracy;
        
        if (!current) {
          stats[dayNum] = { 
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
  }, [history, currentProgramId, settings.minUnlockAccuracy]);

  const masteredCount = useMemo(() => 
    filteredDays.filter(task => {
      const stats = dailyStats[task.day];
      return stats && stats.bestAcc >= settings.minUnlockAccuracy;
    }).length,
  [filteredDays, dailyStats, settings.minUnlockAccuracy]);
  
  const progressPercent = (masteredCount / (filteredDays.length || 1)) * 100;

  const isTaskUnlocked = useCallback((taskIndex: number) => {
    if (settings.unlockAllExercises) return true;
    if (taskIndex === 0) return true;
    const prevTask = filteredDays[taskIndex - 1];
    const prevStats = dailyStats[prevTask.day];
    return !!(prevStats && prevStats.bestAcc >= settings.minUnlockAccuracy);
  }, [filteredDays, dailyStats, settings.minUnlockAccuracy, settings.unlockAllExercises]);

  const launchTask = useCallback((task: DayTask) => {
    const stringIndices = settings.isFiveString ? task.strings : task.strings.filter(s => s !== 4);
    const pool = getAllPositionsInRanges(task.fretRange[1], stringIndices).filter(p => p.fret >= task.fretRange[0]);
    if (pool.length === 0 && !task.sequence) { setError(t.noNotesError); return; }

    const finalQuestions: FretPosition[] = [];
    if (!task.sequence) {
      const targetCount = task.questionCount || 10;
      let lastMidi: number | null = null;
      while (finalQuestions.length < targetCount) {
        const candidates = pool.filter(p => p.midi !== lastMidi);
        const source = candidates.length > 0 ? candidates : pool;
        const pick = source[Math.floor(Math.random() * source.length)];
        finalQuestions.push(pick);
        lastMidi = pick.midi;
      }
    }

    lastLaunchedRef.current = `${currentProgramId}-${task.day}`;
    setActiveTask({ task, questions: finalQuestions, title: sanitizeText(task, 'title') });
    setSessionKey(prev => prev + 1);
  }, [currentProgramId, settings.isFiveString, sanitizeText, t.noNotesError]);

  useEffect(() => {
    if (day) {
      const dayNum = parseInt(day);
      const sessionSlug = `${currentProgramId}-${dayNum}`;
      
      if (lastLaunchedRef.current === sessionSlug) return;

      const task = filteredDays.find(d => d.day === dayNum);
      if (task) {
        const taskIdx = filteredDays.indexOf(task);
        if (isTaskUnlocked(taskIdx)) {
          if (isMicEnabled) launchTask(task);
          else { setPendingTask(task); setMicDialogOpen(true); }
        } else navigate(`/program/${currentProgramId}`);
      }
    } else {
      setActiveTask(null);
      lastLaunchedRef.current = null;
    }
  }, [day, filteredDays, currentProgramId, isTaskUnlocked, isMicEnabled, launchTask, navigate]);

  const handleStartTask = (task: DayTask) => navigate(`/program/${currentProgramId}/day/${task.day}`);
  const handleProgramTabChange = (_: any, val: string) => navigate(`/program/${val}`);

  if (activeTask) {
    if (activeTask.task.isEarTraining) {
      return (
        <EarTrainingSessionRunner 
          key={sessionKey}
          day={activeTask.task.day}
          title={activeTask.title}
          description={sanitizeText(activeTask.task, 'description')}
          sequence={activeTask.task.sequence || []}
          onFinish={() => navigate(`/program/${currentProgramId}`)}
          onReplay={() => setSessionKey(prev => prev + 1)}
          onNext={onNextAction}
          programId={currentProgramId}
        />
      );
    }
    return (
      <SessionRunner 
        key={sessionKey}
        questions={activeTask.questions} 
        title={activeTask.title}
        onFinish={() => navigate(`/program/${currentProgramId}`)}
        day={activeTask.task.day}
        programId={currentProgramId}
        onReplay={() => setSessionKey(prev => prev + 1)}
        sequence={activeTask.task.sequence}
        onNext={onNextAction}
      />
    );
  }

  const srsAmber = '#ffb300';

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <MenuBookIcon color="primary" sx={{ fontSize: 32, mr: 1.5 }} />
          <Typography variant="h5" fontWeight="900" sx={{ letterSpacing: -1 }}>{t.title}</Typography>
        </Box>
        
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2, 
            bgcolor: settings.srsEnabled ? alpha(srsAmber, 0.1) : alpha(theme.palette.primary.main, 0.05), 
            px: 2, 
            py: 0.8, 
            borderRadius: 10, 
            border: '2px solid', 
            borderColor: settings.srsEnabled ? srsAmber : alpha(theme.palette.primary.main, 0.1),
            animation: settings.srsEnabled ? `${glow} 3s infinite ease-in-out` : 'none',
            transition: 'all 0.3s ease'
          }}
        >
          <FormControlLabel
            control={<Switch checked={settings.srsEnabled} onChange={(e) => updateSettings({ srsEnabled: e.target.checked })} size="small" color="warning" />}
            label={
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="caption" fontWeight="900" sx={{ color: settings.srsEnabled ? srsAmber : 'text.secondary', letterSpacing: 0.5 }}>
                  {settings.srsEnabled ? t.srsStatusActive : t.srsMode}
                </Typography>
                {settings.srsEnabled && <AssignmentTurnedInIcon sx={{ fontSize: 16, color: srsAmber }} />}
              </Stack>
            }
            sx={{ m: 0 }}
          />
          <IconButton size="small" onClick={() => setSrsExplainerOpen(true)} sx={{ color: settings.srsEnabled ? srsAmber : 'primary.main' }}>
            <HelpOutlineIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {settings.srsEnabled && (
        <Paper 
          elevation={0} 
          sx={{ 
            p: 3, 
            mb: 4, 
            borderRadius: 3, 
            bgcolor: alpha(srsAmber, 0.05), 
            border: '1px solid', 
            borderColor: alpha(srsAmber, 0.2),
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            gap: 3,
            alignItems: 'center'
          }}
        >
          <Box sx={{ textAlign: 'center', minWidth: 140 }}>
             <HistoryToggleOffIcon sx={{ fontSize: 40, color: srsAmber, mb: 1 }} />
             <Typography variant="h6" fontWeight="900" color="warning.main">{t.srsQueueTitle}</Typography>
          </Box>
          <Grid container spacing={2} sx={{ flexGrow: 1 }}>
             <Grid size={{ xs: 6, sm: 4 }}>
               <Paper sx={{ p: 2, textAlign: 'center', bgcolor: srsStats.dueCount > 0 ? alpha(srsAmber, 0.15) : 'background.paper', borderRadius: 2 }}>
                 <Typography variant="h4" fontWeight="900" color={srsStats.dueCount > 0 ? srsAmber : 'text.disabled'}>{srsStats.dueCount}</Typography>
                 <Typography variant="caption" fontWeight="800" sx={{ opacity: 0.7 }}>{t.srsDueToday}</Typography>
               </Paper>
             </Grid>
             <Grid size={{ xs: 6, sm: 4 }}>
               <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
                 <Typography variant="h4" fontWeight="900">{srsStats.upNextCount}</Typography>
                 <Typography variant="caption" fontWeight="800" sx={{ opacity: 0.7 }}>{t.srsUpNext}</Typography>
               </Paper>
             </Grid>
             <Grid size={{ xs: 12, sm: 4 }}>
               <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
                 <Typography variant="h4" fontWeight="900" color="success.main">{srsStats.totalMastered}</Typography>
                 <Typography variant="caption" fontWeight="800" sx={{ opacity: 0.7 }}>{t.mastered}</Typography>
               </Paper>
             </Grid>
          </Grid>
        </Paper>
      )}

      <Box sx={{ mb: 4 }}>
        <Paper sx={{ mb: 3, borderRadius: 2, overflow: 'hidden', border: 'none', bgcolor: 'background.paper' }} elevation={0}>
          <Tabs value={currentProgramId} onChange={handleProgramTabChange} variant="scrollable" scrollButtons="auto" sx={{ px: 1, minHeight: 48 }}>
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
          <Typography variant="h6" fontWeight="800" gutterBottom>
            {settings.language === 'fr' ? (activeProgram.name_fr || activeProgram.name) : settings.language === 'es' ? (activeProgram.name_es || activeProgram.name) : activeProgram.name}
          </Typography>
          <Typography variant="body2" color="textSecondary" gutterBottom sx={{ maxWidth: 700 }}>
            {(settings.language === 'fr' ? activeProgram.description_fr : settings.language === 'es' ? activeProgram.description_es : activeProgram.description) || activeProgram.description} {settings.minUnlockAccuracy}% {t.needAccuracy}.
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
          const srs = srsProgress[`${currentProgramId}-day${task.day}`] || { level: 0, nextReview: '' };
          const isSuccessful = stats.bestAcc >= settings.minUnlockAccuracy;
          const unlocked = isTaskUnlocked(index);
          const isDue = settings.srsEnabled && srs.nextReview && new Date(srs.nextReview) <= new Date();
          
          // Difficulty indicator for Ear Training
          const sequenceLength = task.sequence?.length || 0;
          const difficultyColor = sequenceLength < 4 ? 'success.main' : sequenceLength < 7 ? 'warning.main' : 'error.main';

          return (
            <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={task.day}>
              <Card 
                sx={{ 
                  height: '100%', 
                  opacity: unlocked ? 1 : 0.6,
                  bgcolor: isDue ? alpha(srsAmber, 0.08) : (isSuccessful ? alpha(theme.palette.success.main, 0.05) : 'background.paper'),
                  border: '2px solid',
                  borderColor: isDue ? srsAmber : (isSuccessful ? alpha(theme.palette.success.main, 0.2) : (unlocked ? 'divider' : 'rgba(0,0,0,0.05)')),
                  animation: isDue ? `${pulse} 2s infinite ease-in-out` : 'none',
                  borderRadius: 3,
                  position: 'relative',
                  transition: 'all 0.2s ease-in-out'
                }}
                elevation={0}
              >
                <CardActionArea onClick={() => handleStartTask(task)} disabled={!unlocked} sx={{ height: '100%' }}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5, alignItems: 'flex-start' }}>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                        <Chip 
                          label={`${t.day} ${index + 1}`} 
                          size="small" 
                          color={isDue ? "warning" : (unlocked ? "primary" : "default")} 
                          sx={{ fontWeight: 900, borderRadius: 1.5, height: 22 }} 
                        />
                        {isDue && (
                          <Chip 
                            label={t.srsBadge} 
                            size="small" 
                            icon={<EventRepeatIcon sx={{ fontSize: '12px !important' }} />}
                            sx={{ fontWeight: 900, height: 22, fontSize: '0.65rem', borderRadius: 1.5, bgcolor: srsAmber, color: '#000' }} 
                          />
                        )}
                        {task.isEarTraining && (
                          <Chip 
                            label={`${t.difficulty}: ${sequenceLength} ${t.notes}`} 
                            size="small" 
                            icon={<SignalCellularAltIcon sx={{ fontSize: '12px !important', color: difficultyColor }} />}
                            sx={{ fontWeight: 900, height: 22, fontSize: '0.65rem', borderRadius: 1.5, bgcolor: alpha(theme.palette.text.primary, 0.05) }} 
                          />
                        )}
                      </Box>
                      {isSuccessful ? (
                        <CheckCircleIcon color="success" fontSize="small" />
                      ) : (
                        !unlocked && <LockIcon color="disabled" fontSize="small" />
                      )}
                    </Box>
                    <Typography variant="subtitle1" gutterBottom fontWeight="900" sx={{ lineHeight: 1.2 }}>{sanitizeText(task, 'title')}</Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2, fontSize: '0.85rem' }}>{sanitizeText(task, 'description')}</Typography>
                    
                    <Box sx={{ mt: 'auto' }}>
                      <Chip label={`${t.fret} ${task.fretRange[0]}-${task.fretRange[1]}`} size="small" variant="outlined" sx={{ borderRadius: 1, fontSize: '0.7rem', fontWeight: 700 }} />
                      
                      {settings.srsEnabled && srs.level > 0 && (
                        <Box sx={{ mt: 1 }}>
                          <SRSTimeline level={srs.level} />
                          <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.5 }}>
                            <CalendarMonthIcon sx={{ fontSize: 12, color: isDue ? srsAmber : 'text.secondary' }} />
                            <Typography variant="caption" sx={{ color: isDue ? srsAmber : 'text.secondary', fontWeight: 800, fontSize: '0.65rem' }}>
                              {srs.level === 5 ? t.srsMastered : (isDue ? t.srsToday : `${t.srsNext} ${new Date(srs.nextReview).toLocaleDateString()}`)}
                            </Typography>
                          </Stack>
                        </Box>
                      )}
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
        onSuccess={() => pendingTask && launchTask(pendingTask)} 
      />
      <SRSExplainer open={srsExplainerOpen} onClose={() => setSrsExplainerOpen(false)} />
    </Box>
  );
};

export default Program;