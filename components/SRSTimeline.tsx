import React from 'react';
import { Box, Stack, Typography, alpha, useTheme } from '@mui/material';
import { useStore } from '../state/store';
import { translations } from '../localization/translations';

interface SRSTimelineProps {
  level: number;
}

const SRSTimeline: React.FC<SRSTimelineProps> = ({ level }) => {
  const { settings } = useStore();
  const theme = useTheme();
  const t = translations[settings.language].program;

  const levels = [1, 2, 3, 4, 5];
  const amber = '#ffb300';

  return (
    <Box sx={{ width: '100%', mt: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
        <Typography variant="caption" sx={{ fontWeight: 800, color: level > 0 ? amber : 'text.secondary', fontSize: '0.65rem', textTransform: 'uppercase' }}>
          {t.srsLevel}
        </Typography>
        <Typography variant="caption" sx={{ fontWeight: 900, color: level === 5 ? amber : 'text.secondary', fontSize: '0.65rem' }}>
          {level === 5 ? t.srsPermanent : `${level}/5`}
        </Typography>
      </Stack>
      
      <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 0.5, height: 6 }}>
        {levels.map((l) => {
          const isActive = l <= level;
          return (
            <Box 
              key={l}
              sx={{ 
                flex: 1, 
                height: '100%', 
                bgcolor: isActive ? amber : alpha(theme.palette.divider, 0.1),
                borderRadius: 1,
                boxShadow: (isActive && l === level) ? `0 0 8px ${alpha(amber, 0.6)}` : 'none',
                transition: 'all 0.3s ease'
              }}
            />
          );
        })}
      </Box>
    </Box>
  );
};

export default SRSTimeline;