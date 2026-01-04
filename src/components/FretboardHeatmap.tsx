import React, { useMemo } from 'react';
import { Box, Typography, Paper, Tooltip, Divider } from '@mui/material';
import { useStore, FretboardItemStats } from '../state/store';
import { translations } from '../localization/translations';
import { getFretInfo, BASS_STRINGS } from '../data/fretboard';
import { translateNoteName } from '../audio/noteUtils';

interface FretboardHeatmapProps {
  onSelectPosition?: (s: number, f: number) => void;
}

const FretboardHeatmap: React.FC<FretboardHeatmapProps> = ({ onSelectPosition }) => {
  const { settings, mastery } = useStore();
  const t = translations[settings.language].training;
  const fretMax = 12; // Standard view
  const isReadOnly = !onSelectPosition;
  
  const stringsToRender = useMemo(() => {
    return settings.isFiveString ? [0, 1, 2, 3, 4] : [0, 1, 2, 3];
  }, [settings.isFiveString]);

  const getWeaknessScore = (stats: FretboardItemStats) => {
    if (!stats || stats.attempts === 0) return -1;
    
    const accuracy = stats.corrects / stats.attempts;
    
    // Time is no longer considered in the calculation of the Mastered state.
    // Speed is considered "High" as long as the note was played within the allowed time limit.
    // We only return the accuracy-based weakness score (1.0 = 0% accuracy, 0.0 = 100% accuracy).
    return (1 - accuracy);
  };

  const getCellColor = (score: number, stats?: FretboardItemStats) => {
    if (score === -1) return 'rgba(255, 255, 255, 0.05)'; // Unplayed
    
    // Minimum 3 attempts required to be eligible for Mastered (Green)
    if (stats && stats.attempts < 3) return '#f44336'; 
    
    if (score < 0.2) return '#4caf50'; // Green (Mastered: > 80% accuracy)
    if (score < 0.5) return '#ffeb3b'; // Yellow (Acceptable: > 50% accuracy)
    return '#f44336'; // Red (Weak Spot: <= 50% accuracy)
  };

  return (
    <Box>
      <Paper 
        elevation={0} 
        sx={{ 
          p: 2, 
          bgcolor: 'background.default', 
          border: '1px solid divider', 
          overflowX: 'auto',
          borderRadius: 1
        }}
      >
        <Box sx={{ minWidth: 800 }}>
          {/* Fret numbers row */}
          <Box sx={{ display: 'flex', mb: 1 }}>
            <Box sx={{ width: 40 }} /> 
            {Array.from({ length: fretMax + 1 }).map((_, f) => (
              <Box key={f} sx={{ flex: 1, textAlign: 'center' }}>
                <Typography variant="caption" sx={{ fontWeight: 900, opacity: [3, 5, 7, 9, 12].includes(f) ? 1 : 0.4 }}>
                    {f}
                </Typography>
              </Box>
            ))}
          </Box>

          {/* String rows */}
          {stringsToRender.map((sIdx) => (
            <Box key={sIdx} sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <Box sx={{ width: 40, textAlign: 'center' }}>
                <Typography variant="body2" fontWeight="bold" color="primary">
                  {translateNoteName(BASS_STRINGS[sIdx].name, settings.noteNaming)}
                </Typography>
              </Box>
              {Array.from({ length: fretMax + 1 }).map((_, f) => {
                const info = getFretInfo(sIdx, f);
                const stats = mastery[`s${sIdx}f${f}`];
                const score = getWeaknessScore(stats);
                const color = getCellColor(score, stats);
                
                const tooltipContent = stats ? (
                    <Box sx={{ p: 0.5 }}>
                        <Typography variant="caption" fontWeight="bold" sx={{ display: 'block', mb: 0.5 }}>
                            {translateNoteName(info.noteName, settings.noteNaming)}
                        </Typography>
                        <Divider sx={{ mb: 0.5, bgcolor: 'rgba(255,255,255,0.2)' }} />
                        <Typography variant="caption" sx={{ display: 'block' }}>{t.attempts}: {stats.attempts}</Typography>
                        <Typography variant="caption" sx={{ display: 'block' }}>{t.accuracy}: {((stats.corrects/stats.attempts)*100).toFixed(0)}%</Typography>
                        <Typography variant="caption" sx={{ display: 'block' }}>{t.avgSpeed}: {(stats.totalTime/stats.attempts).toFixed(2)}s</Typography>
                    </Box>
                ) : t.notPracticed;

                return (
                  <Tooltip key={f} title={tooltipContent} arrow>
                    <Box 
                      onClick={() => !isReadOnly && onSelectPosition?.(sIdx, f)}
                      sx={{ 
                        flex: 1, 
                        height: 26, 
                        bgcolor: color,
                        m: 0.25,
                        borderRadius: 0.25,
                        cursor: isReadOnly ? 'default' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid rgba(255,255,255,0.02)',
                        transition: isReadOnly ? 'none' : 'transform 0.1s',
                        '&:hover': !isReadOnly ? {
                            transform: 'scale(1.1)',
                            zIndex: 2,
                            border: '1px solid rgba(255,255,255,0.5)'
                        } : {}
                      }}
                    >
                        <Typography variant="caption" sx={{ fontSize: '0.55rem', color: score !== -1 ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.2)', fontWeight: 800 }}>
                            {translateNoteName(info.noteName, settings.noteNaming)}
                        </Typography>
                    </Box>
                  </Tooltip>
                );
              })}
            </Box>
          ))}
        </Box>
      </Paper>
    </Box>
  );
};

export default FretboardHeatmap;