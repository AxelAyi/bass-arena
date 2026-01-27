import React from 'react';
import { Box, Typography, alpha, useTheme } from '@mui/material';

interface RhythmGridProps {
  pattern: number[];
  currentIdx: number;
  hits?: boolean[];
  misses?: boolean[];
}

const RhythmGrid: React.FC<RhythmGridProps> = ({ pattern, currentIdx, hits, misses }) => {
  const theme = useTheme();
  const bars = 2;
  const subsPerBar = 16;
  const totalSlots = bars * subsPerBar;

  return (
    <Box sx={{ width: '100%', my: 2 }}>
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: `repeat(${totalSlots}, 1fr)`,
        gap: 0.5,
        height: 60,
        bgcolor: alpha(theme.palette.divider, 0.05),
        p: 1,
        borderRadius: 2,
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider'
      }}>
        {pattern.map((val, i) => {
          const isBarStart = i % 16 === 0;
          const isBeatStart = i % 4 === 0;
          const isActive = i === currentIdx;
          const isTarget = val === 1;
          const wasHit = hits && hits[i];
          const wasMissed = misses && misses[i];

          let cellColor = 'transparent';
          if (isTarget) cellColor = alpha(theme.palette.primary.main, 0.1);
          if (wasHit) cellColor = alpha(theme.palette.success.main, 0.6);
          if (wasMissed) cellColor = alpha(theme.palette.error.main, 0.4);
          if (isActive) cellColor = theme.palette.primary.main;

          return (
            <Box 
              key={i} 
              sx={{ 
                height: '100%', 
                bgcolor: cellColor,
                borderRadius: 0.5,
                borderLeft: isBarStart ? '2px solid' : (isBeatStart ? '1px solid' : 'none'),
                borderColor: isBarStart ? theme.palette.primary.main : alpha(theme.palette.divider, 0.3),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.1s linear',
                boxShadow: isActive ? `0 0 10px ${theme.palette.primary.main}` : 'none',
                zIndex: isActive ? 10 : 1
              }}
            >
               {isTarget && !isActive && !wasHit && !wasMissed && (
                 <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'primary.main', opacity: 0.5 }} />
               )}
            </Box>
          );
        })}
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, px: 1 }}>
        <Typography variant="caption" fontWeight="900" sx={{ color: 'text.secondary' }}>BAR 1</Typography>
        <Typography variant="caption" fontWeight="900" sx={{ color: 'text.secondary' }}>BAR 2</Typography>
      </Box>
    </Box>
  );
};

export default RhythmGrid;
