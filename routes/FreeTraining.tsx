
import React, { useState, useCallback, useEffect } from 'react';
import { Box, Typography, Button, Paper, Slider, FormGroup, FormControlLabel, Checkbox, Divider, Stack, useTheme, useMediaQuery, MenuItem, Select, FormControl } from '@mui/material';
import Grid from '@mui/material/Grid2';
import * as ReactRouterDOM from 'react-router-dom';
import PsychologyIcon from '@mui/icons-material/Psychology';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import DashboardCustomizeIcon from '@mui/icons-material/DashboardCustomize';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import LayersIcon from '@mui/icons-material/Layers';

import { getAllPositionsInRanges, FretPosition, NOTE_NAMES } from '../data/fretboard';
import SessionRunner from '../components/SessionRunner';
import MicPermissionDialog from '../components/MicPermissionDialog';
import FretboardHeatmap, { ScaleType } from '../components/FretboardHeatmap';
import { useStore, FretboardItemStats } from '../state/store';
import { translations } from '../localization/translations';
import { translateNoteName } from '../audio/noteUtils';

const { useLocation } = ReactRouterDOM as any;

const FreeTraining: React.FC = () => {
  const { settings, isMicEnabled, mastery } = useStore();
  const theme = useTheme();
  const t = translations[settings.language].training;
  const location = useLocation();
  
  const [active, setActive] = useState(false);
  const [sessionKey, setSessionKey] = useState(0); 
  const [fretRange, setFretRange] = useState<number[]>([0, 12]);
  const [selectedStrings, setSelectedStrings] = useState({ G: true, D: true, A: true, E: true, B: false });
  const [questionCount, setQuestionCount] = useState(10);
  const [questions, setQuestions] = useState<FretPosition[]>([]);
  const [sessionTitle, setSessionTitle] = useState(t.title);
  const [micDialogOpen, setMicDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<'custom' | 'weak'>('custom');

  // Overlay State managed here for shared alignment
  const [scaleType, setScaleType] = useState<ScaleType>('none');
  const [rootNote, setRootNote] = useState('C');

  useEffect(() => {
    setActive(false);
  }, [location.key]);

  const handleStringChange = (name: string) => {
    setSelectedStrings(prev => ({ ...prev, [name]: !prev[name as keyof typeof prev] }));
  };

  const isMastered = (stats: FretboardItemStats | undefined): boolean => {
    if (!stats || stats.attempts < 3) return false;
    return (stats.corrects / stats.attempts) > 0.8;
  };

  const getWeaknessScore = (stats: FretboardItemStats | undefined) => {
    if (!stats || stats.attempts === 0) return 1.0; 
    
    const accuracy = stats.corrects / stats.attempts;
    const avgTime = stats.totalTime / stats.attempts;
    
    const accScore = 1 - accuracy;
    const speedScore = Math.min(1, avgTime / settings.timeLimit);
    
    const hoursSinceLast = (Date.now() - stats.lastAttempt) / (1000 * 60 * 60);
    const recencyBoost = Math.min(0.2, hoursSinceLast / 168); 
    
    return (accScore * 0.6) + (speedScore * 0.3) + (recencyBoost * 0.1);
  };

  const executeSession = useCallback((customQs?: FretPosition[], customTitle?: string) => {
    if (customQs) {
        setQuestions(customQs);
        setSessionTitle(customTitle || t.title);
    } else {
        const stringIndices: number[] = [];
        if (selectedStrings.G) stringIndices.push(0);
        if (selectedStrings.D) stringIndices.push(1);
        if (selectedStrings.A) stringIndices.push(2);
        if (selectedStrings.E) stringIndices.push(3);
        if (settings.isFiveString && selectedStrings.B) stringIndices.push(4);

        const pool = getAllPositionsInRanges(fretRange[1], stringIndices).filter(p => p.fret >= fretRange[0]);
        if (pool.length === 0) return;
        
        const finalQuestions: FretPosition[] = [];
        let lastMidi: number | null = null;
        
        while (finalQuestions.length < questionCount) {
          const candidates = pool.filter(p => p.midi !== lastMidi);
          const source = candidates.length > 0 ? candidates : pool;
          const pick = source[Math.floor(Math.random() * source.length)];
          finalQuestions.push(pick);
          lastMidi = pick.midi;
        }

        setQuestions(finalQuestions);
        setSessionTitle(t.title);
    }
    
    setSessionKey(prev => prev + 1);
    setActive(true);
  }, [fretRange, selectedStrings, questionCount, settings.isFiveString, t.title]);

  const startWeakSpotsSession = useCallback(() => {
    const stringIndices = settings.isFiveString ? [0, 1, 2, 3, 4] : [0, 1, 2, 3];
    const fullPool = getAllPositionsInRanges(12, stringIndices);
    
    const scoredPool = fullPool
        .map(pos => {
            const stats = mastery[`s${pos.string}f${pos.fret}`];
            return {
                pos,
                stats,
                score: getWeaknessScore(stats),
                mastered: isMastered(stats)
            };
        })
        .filter(item => !item.mastered) 
        .sort((a, b) => b.score - a.score);

    const weakItems = scoredPool.slice(0, 20); // Larger sample to filter repeats
    const finalWeakQs: FretPosition[] = [];
    let lastMidi: number | null = null;

    for (const item of weakItems) {
      if (finalWeakQs.length >= 10) break;
      if (item.pos.midi !== lastMidi) {
        finalWeakQs.push(item.pos);
        lastMidi = item.pos.midi;
      }
    }
    
    if (finalWeakQs.length === 0) {
        const maintenanceQs = fullPool
            .map(pos => ({ pos, stats: mastery[`s${pos.string}f${pos.fret}`] }))
            .sort((a, b) => (a.stats?.lastAttempt || 0) - (b.stats?.lastAttempt || 0))
            .slice(0, 10)
            .map(i => i.pos);
        executeSession(maintenanceQs, t.maintenanceDrill);
        return;
    }

    executeSession(finalWeakQs, t.fixWeakSpots);
  }, [settings.isFiveString, mastery, settings.timeLimit, executeSession, t.fixWeakSpots, t.maintenanceDrill]);

  const handleFixWeakSpots = () => {
    if (isMicEnabled) {
      startWeakSpotsSession();
    } else {
      setPendingAction('weak');
      setMicDialogOpen(true);
    }
  };

  const startCustomSession = useCallback(() => {
    executeSession();
  }, [executeSession]);

  const handleStartCustom = () => {
    if (isMicEnabled) {
      startCustomSession();
    } else {
      setPendingAction('custom');
      setMicDialogOpen(true);
    }
  };

  const handleMicSuccess = () => {
    if (pendingAction === 'custom') startCustomSession();
    else startWeakSpotsSession();
  };

  const availableStrings = ['G', 'D', 'A', 'E'];
  if (settings.isFiveString) {
    availableStrings.push('B');
  }

  const totalPossibleNotes = settings.isFiveString ? 65 : 52;
  const coveragePercent = Math.round((Object.keys(mastery).length / totalPossibleNotes) * 100);
  
  const masteryValues = Object.values(mastery) as FretboardItemStats[];
  const totalAttempts = masteryValues.reduce((acc, curr) => acc + curr.attempts, 0);
  const totalCorrects = masteryValues.reduce((acc, curr) => acc + curr.corrects, 0);
  const totalTime = masteryValues.reduce((acc, curr) => acc + curr.totalTime, 0);

  const globalAccuracy = totalAttempts > 0 ? Math.round((totalCorrects / totalAttempts) * 100) : 0;
  const globalAvgSpeed = totalAttempts > 0 ? (totalTime / totalAttempts).toFixed(2) : '0.00';

  if (active) {
    return (
      <SessionRunner 
        key={sessionKey} 
        questions={questions} 
        title={sessionTitle}
        onFinish={() => setActive(false)} 
        onReplay={() => {
            if (sessionTitle === t.fixWeakSpots || sessionTitle === t.maintenanceDrill) {
                startWeakSpotsSession();
            } else {
                startCustomSession();
            }
        }}
      />
    );
  }

  const sharedTitleStyles = {
    fontWeight: 900,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    display: 'flex',
    alignItems: 'center',
    gap: 1.5
  } as const;

  const sharedButtonStyles = {
    py: 1.8,
    fontWeight: 900,
    borderRadius: 1,
    borderWidth: 2,
    fontSize: '0.9rem',
    '&:hover': { borderWidth: 2 }
  } as const;

  return (
    <Box sx={{ pb: 6 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <FitnessCenterIcon color="primary" sx={{ fontSize: 32, mr: 1.5 }} />
        <Typography variant="h5" fontWeight="900" sx={{ letterSpacing: -1 }}>{t.title}</Typography>
      </Box>

      <Stack spacing={4}>
        <Paper 
          elevation={0} 
          sx={{ 
            borderRadius: 1, 
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            p: { xs: 2, md: 3 }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ width: 4, height: 24, bgcolor: 'primary.main', borderRadius: 0.5 }} />
              <Typography variant="subtitle1" fontWeight="900" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {t.heatmap}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mr: 1 }}>
                <Box sx={{ width: 10, height: 10, bgcolor: '#388e3c', borderRadius: 0.2 }} />
                <Typography variant="caption" sx={{ fontSize: '0.65rem', fontWeight: 800, opacity: 0.8 }}>{t.masteredLabel}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mr: 1 }}>
                <Box sx={{ width: 10, height: 10, bgcolor: '#d32f2f', borderRadius: 0.2 }} />
                <Typography variant="caption" sx={{ fontSize: '0.65rem', fontWeight: 800, opacity: 0.8 }}>{t.weakSpotLabel}</Typography>
              </Box>
            </Box>
          </Box>

          <FretboardHeatmap scaleType={scaleType} rootNote={rootNote} />

          <Box sx={{ 
            mt: 3,
            pt: 2,
            borderTop: '1px solid', 
            borderColor: 'divider'
          }}>
            <Stack 
              direction={{ xs: 'column', lg: 'row' }} 
              spacing={{ xs: 2, lg: 4 }} 
              alignItems={{ xs: 'flex-start', lg: 'center' }} 
            >
              <Stack direction="row" spacing={3} alignItems="center" sx={{ flexShrink: 0 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                    <LayersIcon fontSize="small" sx={{ color: 'text.secondary', opacity: 0.7 }} />
                    <Typography variant="caption" fontWeight="900" sx={{ textTransform: 'uppercase', color: 'text.secondary', whiteSpace: 'nowrap' }}>
                        Overlays:
                    </Typography>
                </Stack>

                <Stack direction="row" spacing={2} alignItems="center">
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="caption" fontWeight="800" sx={{ color: 'text.secondary', opacity: 0.8, whiteSpace: 'nowrap' }}>Scale</Typography>
                        <FormControl size="small" variant="standard">
                            <Select 
                                value={scaleType} 
                                onChange={(e) => setScaleType(e.target.value as ScaleType)}
                                sx={{ fontSize: '0.75rem', fontWeight: 800, minWidth: 100 }}
                                disableUnderline
                            >
                                <MenuItem value="none" sx={{ fontSize: '0.75rem' }}>None</MenuItem>
                                <MenuItem value="major_pent" sx={{ fontSize: '0.75rem' }}>Major Pentatonic</MenuItem>
                                <MenuItem value="minor_pent" sx={{ fontSize: '0.75rem' }}>Minor Pentatonic</MenuItem>
                            </Select>
                        </FormControl>
                    </Stack>

                    {scaleType !== 'none' && (
                        <Stack direction="row" spacing={1} alignItems="center">
                            <Typography variant="caption" fontWeight="800" sx={{ color: 'text.secondary', opacity: 0.8, whiteSpace: 'nowrap' }}>Root</Typography>
                            <FormControl size="small" variant="standard">
                                <Select 
                                    value={rootNote} 
                                    onChange={(e) => setRootNote(e.target.value)}
                                    sx={{ fontSize: '0.75rem', fontWeight: 800, minWidth: 40 }}
                                    disableUnderline
                                >
                                    {NOTE_NAMES.map(n => (
                                        <MenuItem key={n} value={n} sx={{ fontSize: '0.75rem' }}>
                                            {translateNoteName(n, settings.noteNaming)}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Stack>
                    )}
                </Stack>
              </Stack>

              <Box sx={{ display: { xs: 'none', lg: 'block' }, flexGrow: 1 }} />

              <Stack 
                direction="row" 
                spacing={{ xs: 3, sm: 4 }} 
                alignItems="center" 
                sx={{ width: { xs: '100%', lg: 'auto' }, justifyContent: { xs: 'space-between', lg: 'flex-end' } }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', color: 'text.secondary', opacity: 0.6 }}>
                      {t.neckCoverage}:
                    </Typography>
                    <Typography variant="subtitle2" fontWeight="900" color="primary.main">
                      {coveragePercent}%
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', color: 'text.secondary', opacity: 0.6 }}>
                      {t.accuracy}:
                    </Typography>
                    <Typography variant="subtitle2" fontWeight="900" color="primary.main">
                      {globalAccuracy}%
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', color: 'text.secondary', opacity: 0.6 }}>
                      {t.avgSpeed}:
                    </Typography>
                    <Typography variant="subtitle2" fontWeight="900" color="primary.main">
                      {globalAvgSpeed}s
                    </Typography>
                </Box>
              </Stack>
            </Stack>
          </Box>
        </Paper>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, lg: 5 }}>
            <Paper 
              elevation={0}
              sx={{ 
                height: '100%',
                p: 4,
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: settings.themeMode === 'dark' ? 'rgba(255, 152, 0, 0.04)' : 'rgba(255, 152, 0, 0.08)',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <PsychologyIcon 
                sx={{ 
                  position: 'absolute', 
                  bottom: -40, 
                  right: -40, 
                  fontSize: 280, 
                  opacity: settings.themeMode === 'dark' ? 0.04 : 0.07, 
                  transform: 'rotate(-15deg)',
                  pointerEvents: 'none',
                  color: 'primary.main',
                  zIndex: 0
                }} 
              />

              <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
                <Typography variant="subtitle1" sx={{ ...sharedTitleStyles, mb: 4 }}>
                  <PsychologyIcon color="primary" />
                  {t.fixWeakSpots}
                </Typography>
                
                <Typography variant="body2" color="textSecondary" sx={{ mb: 4, lineHeight: 1.7, minHeight: 80 }}>
                  {t.weakSpotsDesc}
                </Typography>
                
                <Button 
                  variant="outlined" 
                  color="primary" 
                  size="large"
                  fullWidth
                  onClick={handleFixWeakSpots}
                  startIcon={<PsychologyIcon />}
                  sx={{ ...sharedButtonStyles, mt: 'auto' }}
                >
                  {t.analyzeAndStart}
                </Button>
              </Box>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, lg: 7 }}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 4, 
                borderRadius: 1, 
                height: '100%',
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <Typography variant="subtitle1" sx={{ ...sharedTitleStyles, mb: 4 }}>
                <DashboardCustomizeIcon color="primary" />
                {t.customSessionSetup}
              </Typography>

              <Grid container spacing={4}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" gutterBottom fontWeight="800" color="textSecondary" sx={{ textTransform: 'uppercase', mb: 1, display: 'block' }}>
                    {t.fretRange}
                  </Typography>
                  <Box sx={{ px: 1, mt: 2 }}>
                    <Slider 
                      value={fretRange} 
                      onChange={(_, val) => setFretRange(val as number[])} 
                      valueLabelDisplay="auto" 
                      min={0} 
                      max={24} 
                      sx={{ color: 'primary.main' }}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                      <Typography variant="caption" fontWeight="bold">{fretRange[0]}</Typography>
                      <Typography variant="caption" fontWeight="bold">{fretRange[1]}</Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" gutterBottom fontWeight="800" color="textSecondary" sx={{ textTransform: 'uppercase', mb: 1, display: 'block' }}>
                    {t.strings}
                  </Typography>
                  <FormGroup row sx={{ mt: 1 }}>
                    {availableStrings.map(s => (
                      <FormControlLabel 
                        key={s} 
                        control={
                          <Checkbox 
                            checked={selectedStrings[s as keyof typeof selectedStrings]} 
                            onChange={() => handleStringChange(s)} 
                            size="small"
                          />
                        } 
                        label={<Typography variant="caption" fontWeight="700">{translateNoteName(s, settings.noteNaming)}</Typography>} 
                        sx={{ mr: 2 }}
                      />
                    ))}
                  </FormGroup>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Typography variant="caption" gutterBottom fontWeight="800" color="textSecondary" sx={{ textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between' }}>
                    {t.numQuestions} <span>{questionCount}</span>
                  </Typography>
                  <Box sx={{ px: 1, mt: 1 }}>
                    <Slider 
                      value={questionCount} 
                      onChange={(_, val) => setQuestionCount(val as number)} 
                      min={5} 
                      max={50} 
                      step={5} 
                      marks 
                      valueLabelDisplay="auto" 
                    />
                  </Box>
                </Grid>
              </Grid>

              <Box sx={{ mt: 'auto', pt: 4 }}>
                <Button 
                  variant="outlined" 
                  fullWidth 
                  size="large"
                  onClick={handleStartCustom} 
                  startIcon={<TrackChangesIcon />} 
                  disabled={availableStrings.every(s => !selectedStrings[s as keyof typeof selectedStrings])}
                  sx={sharedButtonStyles}
                >
                  {t.deployCustom}
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Stack>

      <MicPermissionDialog 
        open={micDialogOpen} 
        onClose={() => setMicDialogOpen(false)} 
        onSuccess={handleMicSuccess} 
      />
    </Box>
  );
};

export default FreeTraining;
