
import React, { useState } from 'react';
import { Box, Typography, Button, Paper, Slider, FormGroup, FormControlLabel, Checkbox, Grid } from '@mui/material';
import { getAllPositionsInRanges, FretPosition } from '../data/fretboard';
import SessionRunner from '../components/SessionRunner';

const FreeTraining: React.FC = () => {
  const [active, setActive] = useState(false);
  const [fretRange, setFretRange] = useState<number[]>([0, 12]);
  const [selectedStrings, setSelectedStrings] = useState({
    G: true, D: true, A: true, E: true
  });
  const [questionCount, setQuestionCount] = useState(10);

  const handleStringChange = (name: string) => {
    setSelectedStrings(prev => ({ ...prev, [name]: !prev[name as keyof typeof prev] }));
  };

  const startSession = () => {
    setActive(true);
  };

  const generateQuestions = (): FretPosition[] => {
    const stringIndices: number[] = [];
    if (selectedStrings.G) stringIndices.push(0);
    if (selectedStrings.D) stringIndices.push(1);
    if (selectedStrings.A) stringIndices.push(2);
    if (selectedStrings.E) stringIndices.push(3);

    const pool = getAllPositionsInRanges(fretRange[1], stringIndices)
      .filter(p => p.fret >= fretRange[0]);

    if (pool.length === 0) return [];
    
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, questionCount);
  };

  if (active) {
    return <SessionRunner questions={generateQuestions()} onFinish={() => setActive(false)} />;
  }

  return (
    <Box sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom fontWeight="bold">Free Training</Typography>
      <Typography variant="body1" color="textSecondary" sx={{ mb: 4 }}>
        Configure a custom practice session to target specific areas of the neck.
      </Typography>

      <Paper sx={{ p: 4, borderRadius: 3 }}>
        <Grid container spacing={4}>
          {/* Fix: Replaced individual breakpoint props with 'size' for MUI v6 Grid compatibility */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography gutterBottom fontWeight="bold">Fret Range</Typography>
            <Box sx={{ px: 2, mt: 4 }}>
              <Slider
                value={fretRange}
                onChange={(_, val) => setFretRange(val as number[])}
                valueLabelDisplay="on"
                min={0}
                max={24}
              />
            </Box>
          </Grid>

          {/* Fix: Replaced individual breakpoint props with 'size' for MUI v6 Grid compatibility */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography gutterBottom fontWeight="bold">Strings</Typography>
            <FormGroup row>
              {['G', 'D', 'A', 'E'].map(s => (
                <FormControlLabel
                  key={s}
                  control={<Checkbox checked={selectedStrings[s as keyof typeof selectedStrings]} onChange={() => handleStringChange(s)} />}
                  label={s}
                />
              ))}
            </FormGroup>
          </Grid>

          {/* Fix: Replaced individual breakpoint props with 'size' for MUI v6 Grid compatibility */}
          <Grid size={12}>
            <Typography gutterBottom fontWeight="bold">Number of Questions: {questionCount}</Typography>
            <Slider
              value={questionCount}
              onChange={(_, val) => setQuestionCount(val as number)}
              min={5}
              max={50}
              step={5}
              marks
              valueLabelDisplay="auto"
            />
          </Grid>
        </Grid>

        <Box sx={{ mt: 6, textAlign: 'center' }}>
          <Button 
            variant="contained" 
            size="large" 
            fullWidth 
            onClick={startSession}
            disabled={Object.values(selectedStrings).every(v => !v)}
          >
            Start Session
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default FreeTraining;