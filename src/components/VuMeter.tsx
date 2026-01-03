
import React from 'react';
import { Box, LinearProgress, Typography } from '@mui/material';

interface VuMeterProps {
  rms: number;
  threshold: number;
}

const VuMeter: React.FC<VuMeterProps> = ({ rms, threshold }) => {
  // Normalize RMS for display (0 to 1)
  const normalizedValue = Math.min(rms * 10, 1); // Scale for better visibility
  const percentage = normalizedValue * 100;
  const thresholdPct = Math.min(threshold * 10 * 100, 100);

  return (
    <Box sx={{ width: '100%', mt: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="caption">Input Level</Typography>
        <Typography variant="caption" color={rms > threshold ? 'success.main' : 'error.main'}>
          {rms > threshold ? 'Active' : 'Below Gate'}
        </Typography>
      </Box>
      <Box sx={{ position: 'relative', height: 10, bgcolor: 'grey.800', borderRadius: 5, overflow: 'hidden' }}>
        <Box 
          sx={{ 
            width: `${percentage}%`, 
            height: '100%', 
            bgcolor: rms > threshold ? 'primary.main' : 'grey.600',
            transition: 'width 0.1s linear'
          }} 
        />
        {/* Threshold marker */}
        <Box 
          sx={{ 
            position: 'absolute', 
            left: `${thresholdPct}%`, 
            top: 0, 
            bottom: 0, 
            width: 2, 
            bgcolor: 'white',
            zIndex: 1
          }} 
        />
      </Box>
    </Box>
  );
};

export default VuMeter;
