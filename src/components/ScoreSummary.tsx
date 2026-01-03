
import React from 'react';
import { Box, Typography, Button, Paper, Grid } from '@mui/material';
import { SessionResult } from '../state/store';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import TimerIcon from '@mui/icons-material/Timer';
import StarIcon from '@mui/icons-material/Star';

interface ScoreSummaryProps {
  result: SessionResult;
  onClose: () => void;
}

const ScoreSummary: React.FC<ScoreSummaryProps> = ({ result, onClose }) => {
  return (
    // Fix: Removed invalid 'paper' prop
    <Paper elevation={0} sx={{ p: 4, borderRadius: 4, maxWidth: 600, mx: 'auto', mt: 4 }}>
      <Typography variant="h4" align="center" gutterBottom color="primary">
        Session Complete!
      </Typography>
      
      <Grid container spacing={3} sx={{ my: 4 }}>
        {/* Fix: Replaced 'xs' with 'size' for newer MUI Grid versions */}
        <Grid size={4} sx={{ textAlign: 'center' }}>
          <StarIcon color="primary" sx={{ fontSize: 40 }} />
          <Typography variant="h5">{result.score}</Typography>
          <Typography variant="caption">Total Score</Typography>
        </Grid>
        {/* Fix: Replaced 'xs' with 'size' for newer MUI Grid versions */}
        <Grid size={4} sx={{ textAlign: 'center' }}>
          <CheckCircleOutlineIcon color="success" sx={{ fontSize: 40 }} />
          <Typography variant="h5">{result.accuracy.toFixed(0)}%</Typography>
          <Typography variant="caption">Accuracy</Typography>
        </Grid>
        {/* Fix: Replaced 'xs' with 'size' for newer MUI Grid versions */}
        <Grid size={4} sx={{ textAlign: 'center' }}>
          <TimerIcon color="secondary" sx={{ fontSize: 40 }} />
          <Typography variant="h5">{result.avgTime.toFixed(1)}s</Typography>
          <Typography variant="caption">Avg. Speed</Typography>
        </Grid>
      </Grid>

      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <Button variant="contained" size="large" onClick={onClose} sx={{ px: 6 }}>
          Return to Menu
        </Button>
      </Box>
    </Paper>
  );
};

export default ScoreSummary;