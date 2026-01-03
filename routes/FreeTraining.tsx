
import React, { useState, useCallback, useEffect } from 'react';
import { Box, Typography, Button, Paper, Slider, FormGroup, FormControlLabel, Checkbox, Grid2 as Grid } from '@mui/material';
import { useLocation } from 'react-router-dom';
import { getAllPositionsInRanges, FretPosition } from '../data/fretboard';
import SessionRunner from '../components/SessionRunner';
import MicPermissionDialog from '../components/MicPermissionDialog';
import { useStore } from '../state/store';
import { translations } from '../localization/translations';
import { translateNoteName } from '../audio/noteUtils';

const FreeTraining: React.FC = () => {
  const { settings, isMicEnabled } = useStore();
  const t = translations[settings.language].training;
  const location = useLocation();
  
  const [active, setActive] = useState(false);
  const [sessionKey, setSessionKey] = useState(0); 
  const [fretRange, setFretRange] = useState<number[]>([0, 12]);
  const [selectedStrings, setSelectedStrings] = useState({ G: true, D: true, A: true, E: true, B: false });
  const [questionCount, setQuestionCount] = useState(10);
  const [questions, setQuestions] = useState<FretPosition[]>([]);
  const [micDialogOpen, setMicDialogOpen] = useState(false);

  useEffect(() => {
    setActive(false);
  }, [location.key]);

  const handleStringChange = (name: string) => {
    setSelectedStrings(prev => ({ ...prev, [name]: !prev[name as keyof typeof prev] }));
  };

  const executeSession = useCallback(() => {
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
    setSessionKey(prev => prev + 1);
    setActive(true);
  }, [fretRange, selectedStrings, questionCount, settings.isFiveString]);

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
        title={t.title}
        onFinish={() => setActive(false)} 
        onReplay={startSession}
      />
    );
  }

  const availableStrings = ['G', 'D', 'A', 'E'];
  if (settings.isFiveString) {
    availableStrings.push('B');
  }

  return (
    <Box sx={{ p: 2, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom fontWeight="bold">{t.title}</Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>{t.description}</Typography>
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="subtitle2" gutterBottom fontWeight="bold">
              {t.fretRange}: {fretRange[0]} - {fretRange[1]}
            </Typography>
            <Box sx={{ px: 2, mt: 3 }}>
              <Slider value={fretRange} onChange={(_, val) => setFretRange(val as number[])} valueLabelDisplay="auto" min={0} max={24} size="small" />
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="subtitle2" gutterBottom fontWeight="bold">{t.strings}</Typography>
            <FormGroup row>
              {availableStrings.map(s => (
                <FormControlLabel 
                  key={s} 
                  control={<Checkbox checked={selectedStrings[s as keyof typeof selectedStrings]} onChange={() => handleStringChange(s)} size="small" />} 
                  label={<Typography variant="body2">{translateNoteName(s, settings.noteNaming)}</Typography>} 
                />
              ))}
            </FormGroup>
          </Grid>
          <Grid size={12}>
            <Typography variant="subtitle2" gutterBottom fontWeight="bold">{t.numQuestions}: {questionCount}</Typography>
            <Slider value={questionCount} onChange={(_, val) => setQuestionCount(val as number)} min={5} max={100} step={5} marks valueLabelDisplay="auto" size="small" />
          </Grid>
        </Grid>
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Button variant="contained" size="medium" fullWidth onClick={startSession} disabled={availableStrings.every(s => !selectedStrings[s as keyof typeof selectedStrings])}>
            {t.start}
          </Button>
        </Box>
      </Paper>
      <MicPermissionDialog 
        open={micDialogOpen} 
        onClose={() => setMicDialogOpen(false)} 
        onSuccess={executeSession} 
      />
    </Box>
  );
};

export default FreeTraining;
