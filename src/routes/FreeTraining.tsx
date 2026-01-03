
import React, { useState, useCallback, useEffect } from 'react';
import { Box, Typography, Button, Paper, Slider, FormGroup, FormControlLabel, Checkbox, Divider, Card, CardContent, Stack, Chip, useTheme, useMediaQuery } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { useLocation } from 'react-router-dom';
import PsychologyIcon from '@mui/icons-material/Psychology';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import DashboardCustomizeIcon from '@mui/icons-material/DashboardCustomize';
import HistoryEduIcon from '@mui/icons-material/HistoryEdu';
import AssessmentIcon from '@mui/icons-material/Assessment';

import { getAllPositionsInRanges, FretPosition, getFretInfo } from '../data/fretboard';
import SessionRunner from '../components/SessionRunner';
import MicPermissionDialog from '../components/MicPermissionDialog';
import FretboardHeatmap from '../components/FretboardHeatmap';
import { useStore, FretboardItemStats } from '../state/store';
import { translations } from '../localization/translations';
import { translateNoteName } from '../audio/noteUtils';

const FreeTraining: React.FC = () => {
  const { settings, isMicEnabled, mastery } = useStore();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
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

  useEffect(() => {
    setActive(false);
  }, [location.key]);

  const handleStringChange = (name: string) => {
    setSelectedStrings(prev => ({ ...prev, [name]: !prev[name as keyof typeof prev] }));
  };

  const getWeaknessScore = (stats: FretboardItemStats | undefined) => {
    if (!stats || stats.attempts === 0) return 0.5;
    const accuracy = stats.corrects / stats.attempts;
    const avgTime = stats.totalTime / stats.attempts;
    const accScore = 1 - accuracy;
    const speedScore = Math.min(1, avgTime / settings.timeLimit);
    const hoursSinceLast = (Date.now() - stats.lastAttempt) / (1000 * 60 * 60);
    const recencyBoost = Math.min(0.2, hoursSinceLast / 100); 
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
        
        let shuffled = [...pool].sort(() => 0.5 - Math.random());
        let finalQuestions = [...shuffled];
        while (finalQuestions.length < questionCount) {
            const more = [...pool].sort(() => 0.5 - Math.random());
            finalQuestions = [...finalQuestions, ...more];
        }
        setQuestions(finalQuestions.slice(0, questionCount));
        setSessionTitle(t.title);
    }
    
    setSessionKey(prev => prev + 1);
    setActive(true);
  }, [fretRange, selectedStrings, questionCount, settings.isFiveString, t.title]);

  const handleFixWeakSpots = () => {
    const stringIndices = settings.isFiveString ? [0, 1, 2, 3, 4] : [0, 1, 2, 3];
    const fullPool = getAllPositionsInRanges(12, stringIndices);
    const scoredPool = fullPool.map(pos => ({
        pos,
        score: getWeaknessScore(mastery[`s${pos.string}f${pos.fret}`])
    })).sort((a, b) => b.score - a.score);

    const weakQs = scoredPool.slice(0, 10).map(item => item.pos);
    
    if (isMicEnabled) {
        executeSession(weakQs, t.fixWeakSpots);
    } else {
        setMicDialogOpen(true);
    }
  };

  const startSession = useCallback(() => {
    if (isMicEnabled) {
      executeSession();
    } else {
      setMicDialogOpen(true);
    }
  }, [isMicEnabled, executeSession]);

  if (active) {
    return (
      <SessionRunner 
        key={sessionKey} 
        questions={questions} 
        title={sessionTitle}
        onFinish={() => setActive(false)} 
        onReplay={startSession}
      />
    );
  }

  const availableStrings = ['G', 'D', 'A', 'E'];
  if (settings.isFiveString) {
    availableStrings.push('B');
  }

  const totalPossibleNotes = settings.isFiveString ? 65 : 52;
  const coveragePercent = Math.round((Object.keys(mastery).length / totalPossibleNotes) * 100);
  const weakNotesList = Object.entries(mastery)
    .map(([key, stats]) => ({ key, score: getWeaknessScore(stats as FretboardItemStats) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return (
    <Box sx={{ pb: 6 }}>
      {/* Header Section */}
      <Box sx={{ mb: 5, display: 'flex', alignItems: 'center', gap: 2.5 }}>
        <Box 
          sx={{ 
            bgcolor: 'primary.main', 
            p: 1.5, 
            borderRadius: 2, 
            display: 'flex',
            boxShadow: `0 4px 20px ${theme.palette.primary.main}40`
          }}
        >
          <HistoryEduIcon sx={{ color: 'primary.contrastText', fontSize: 28 }} />
        </Box>
        <Box>
          <Typography variant="h4" fontWeight="900" sx={{ letterSpacing: -1.5, lineHeight: 1.1 }}>
            {t.title}
          </Typography>
          <Typography variant="body1" color="textSecondary" sx={{ mt: 0.5 }}>
            {t.description}
          </Typography>
        </Box>
      </Box>

      <Stack spacing={5}>
        {/* 1. Full-Width Fretboard Dashboard */}
        <Paper 
          elevation={0} 
          sx={{ 
            borderRadius: 4, 
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper'
          }}
        >
          {/* Dashboard Header */}
          <Box sx={{ px: 4, py: 3, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <AssessmentIcon color="primary" />
              <Typography variant="h6" fontWeight="900" sx={{ textTransform: 'uppercase', letterSpacing: 1.5, fontSize: '0.9rem' }}>
                Neck Mastery Map
              </Typography>
            </Box>
            <Typography variant="caption" color="textSecondary" sx={{ fontStyle: 'italic', display: { xs: 'none', sm: 'block' } }}>
              Click any note to start a target drill
            </Typography>
          </Box>

          {/* Map Area - Full Width */}
          <Box sx={{ p: { xs: 1, md: 3 }, bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)' }}>
            <FretboardHeatmap onSelectPosition={(s, f) => {
                executeSession([getFretInfo(s, f)], `Target Drill: ${getFretInfo(s, f).noteName}`);
            }} />
          </Box>

          {/* Insights Footer - Dedicated row below map */}
          <Box sx={{ 
            px: 4, 
            py: 3, 
            bgcolor: 'background.default', 
            borderTop: '1px solid', 
            borderColor: 'divider'
          }}>
            <Grid container spacing={4} alignItems="center">
              {/* Coverage Metric */}
              <Grid size={{ xs: 12, md: 3 }}>
                <Box sx={{ textAlign: { xs: 'center', md: 'left' } }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', color: 'text.secondary', display: 'block', mb: 0.5 }}>
                    {t.neckCoverage}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, justifyContent: { xs: 'center', md: 'flex-start' } }}>
                    <Typography variant="h3" fontWeight="900" color="primary.main">
                      {coveragePercent}%
                    </Typography>
                    <Typography variant="body2" color="textSecondary" fontWeight="700">Explored</Typography>
                  </Box>
                </Box>
              </Grid>

              <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' }, mx: 2 }} />

              {/* Weak Notes Metric */}
              <Grid size={{ xs: 12, md: 8 }}>
                <Box sx={{ textAlign: { xs: 'center', md: 'left' } }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', color: 'text.secondary', display: 'block', mb: 1.5 }}>
                    {t.topWeakNotes}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', justifyContent: { xs: 'center', md: 'flex-start' } }}>
                    {weakNotesList.map(({ key }) => {
                      const s = parseInt(key.split('f')[0].substring(1));
                      const f = parseInt(key.split('f')[1]);
                      const info = getFretInfo(s, f);
                      return (
                        <Chip 
                          key={key}
                          label={`${translateNoteName(info.noteName, settings.noteNaming)} (${translateNoteName(info.stringName, settings.noteNaming)})`}
                          variant="outlined"
                          size="medium"
                          sx={{ 
                            fontWeight: 900,
                            borderRadius: 2,
                            borderColor: 'error.main',
                            color: 'error.main',
                            bgcolor: 'rgba(244, 67, 54, 0.05)',
                            px: 1
                          }}
                        />
                      );
                    })}
                    {weakNotesList.length === 0 && (
                      <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                        No data collected yet. Start playing to see insights!
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Paper>

        {/* Action Grid */}
        <Grid container spacing={4}>
          {/* Fix Weak Spots CTA */}
          <Grid size={{ xs: 12, lg: 5 }}>
            <Card 
              elevation={0}
              sx={{ 
                height: '100%',
                borderRadius: 4,
                position: 'relative',
                overflow: 'hidden',
                background: theme.palette.mode === 'dark' 
                  ? `linear-gradient(145deg, ${theme.palette.background.paper} 0%, rgba(255, 152, 0, 0.1) 100%)`
                  : `linear-gradient(145deg, #fff 0%, rgba(255, 152, 0, 0.05) 100%)`,
                border: '1px solid',
                borderColor: 'primary.main',
                boxShadow: `0 10px 30px rgba(0,0,0,0.1)`
              }}
            >
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <Box sx={{ bgcolor: 'primary.main', p: 1, borderRadius: 1.5 }}>
                    <PsychologyIcon sx={{ color: 'primary.contrastText' }} />
                  </Box>
                  <Typography variant="h5" fontWeight="900">{t.fixWeakSpots}</Typography>
                </Box>
                
                <Typography variant="body1" color="textSecondary" sx={{ mb: 4, lineHeight: 1.7 }}>
                  {t.weakSpotsDesc}
                </Typography>
                
                <Button 
                  variant="contained" 
                  color="primary" 
                  size="large"
                  fullWidth
                  onClick={handleFixWeakSpots}
                  sx={{ py: 2, fontWeight: 900, borderRadius: 2.5, boxShadow: 6 }}
                >
                  Analyze & Start Drill
                </Button>
              </CardContent>
              <Box sx={{ position: 'absolute', bottom: -20, right: -20, opacity: 0.05 }}>
                <PsychologyIcon sx={{ fontSize: 180 }} />
              </Box>
            </Card>
          </Grid>

          {/* Custom Session Builder */}
          <Grid size={{ xs: 12, lg: 7 }}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 4, 
                borderRadius: 4, 
                height: '100%',
                border: '1px solid',
                borderColor: 'divider'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                <DashboardCustomizeIcon color="primary" />
                <Typography variant="h6" fontWeight="900" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Custom Session Setup
                </Typography>
              </Box>

              <Grid container spacing={4}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" gutterBottom fontWeight="800" color="textSecondary">
                    {t.fretRange.toUpperCase()}
                  </Typography>
                  <Box sx={{ px: 1, mt: 3 }}>
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
                  <Typography variant="subtitle2" gutterBottom fontWeight="800" color="textSecondary">
                    {t.strings.toUpperCase()}
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
                        label={<Typography variant="body2" fontWeight="700">{translateNoteName(s, settings.noteNaming)}</Typography>} 
                        sx={{ mr: 2 }}
                      />
                    ))}
                  </FormGroup>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle2" gutterBottom fontWeight="800" color="textSecondary">
                    {t.numQuestions.toUpperCase()}: <Box component="span" sx={{ color: 'primary.main' }}>{questionCount}</Box>
                  </Typography>
                  <Box sx={{ px: 1, mt: 2 }}>
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

              <Box sx={{ mt: 4 }}>
                <Button 
                  variant="outlined" 
                  fullWidth 
                  size="large"
                  onClick={startSession} 
                  startIcon={<TrackChangesIcon />} 
                  disabled={availableStrings.every(s => !selectedStrings[s as keyof typeof selectedStrings])}
                  sx={{ py: 1.8, fontWeight: 900, borderRadius: 2.5, borderWidth: 2, '&:hover': { borderWidth: 2 } }}
                >
                  Deploy Custom Drill
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Stack>

      <MicPermissionDialog 
        open={micDialogOpen} 
        onClose={() => setMicDialogOpen(false)} 
        onSuccess={startSession} 
      />
    </Box>
  );
};

export default FreeTraining;
