
import React from 'react';
import { LinearProgress, Box, Typography } from '@mui/material';
import { useStore } from '../state/store';
import { translations } from '../localization/translations';

interface TimerBarProps {
  remaining: number;
  total: number;
}

const TimerBar: React.FC<TimerBarProps> = ({ remaining, total }) => {
  const { settings } = useStore();
  const t = translations[settings.language].session;
  const progress = (remaining / total) * 100;
  const color = progress > 50 ? 'success' : progress > 25 ? 'warning' : 'error';

  return (
    <Box sx={{ width: '100%', mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="body2" color="textSecondary">{t.timeLeft}</Typography>
        <Typography variant="body2" fontWeight="bold">{remaining.toFixed(1)}s</Typography>
      </Box>
      <LinearProgress 
        variant="determinate" 
        value={progress} 
        color={color as any}
        sx={{ height: 12, borderRadius: 6 }} 
      />
    </Box>
  );
};

export default TimerBar;
