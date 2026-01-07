import React, { useMemo } from 'react';
import { Box, Typography, Paper, Tooltip, Divider, useTheme } from '@mui/material';
import { useStore, FretboardItemStats } from '../state/store';
import { translations } from '../localization/translations';
import { getFretInfo, BASS_STRINGS, NOTE_NAMES } from '../data/fretboard';
import { translateNoteName } from '../audio/noteUtils';
import FlareIcon from '@mui/icons-material/Flare';

export type ScaleType = 'none' | 'major_pent' | 'minor_pent';

interface FretboardHeatmapProps {
  onSelectPosition?: (s: number, f: number) => void;
  scaleType?: ScaleType;
  rootNote?: string;
}

const FretboardHeatmap: React.FC<FretboardHeatmapProps> = ({ 
  onSelectPosition, 
  scaleType = 'none', 
  rootNote = 'C' 
}) => {
  const { settings, mastery } = useStore();
  const theme = useTheme();
  const t = translations[settings.language].training;
  const fretMax = 12; // Standard view
  const isReadOnly = !onSelectPosition;
  const isDarkMode = theme.palette.mode === 'dark';

  const stringsToRender = useMemo(() => {
    return settings.isFiveString ? [0, 1, 2, 3, 4] : [0, 1, 2, 3];
  }, [settings.isFiveString]);

  // Calculate notes in scale
  const scaleNotes = useMemo(() => {
    if (scaleType === 'none') return new Set<string>();
    const rootIdx = NOTE_NAMES.indexOf(rootNote);
    const intervals = scaleType === 'major_pent' ? [0, 2, 4, 7, 9] : [0, 3, 5, 7, 10];
    return new Set(intervals.map(i => NOTE_NAMES[(rootIdx + i) % 12]));
  }, [scaleType, rootNote]);

  const getWeaknessScore = (stats: FretboardItemStats) => {
    if (!stats || stats.attempts === 0) return -1;
    const accuracy = stats.corrects / stats.attempts;
    return (1 - accuracy);
  };

  const getCellColor = (score: number, stats?: FretboardItemStats) => {
    if (score === -1) {
      return isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.06)'; 
    }
    
    if (stats && stats.attempts < 3) return isDarkMode ? '#d32f2f' : '#ef5350'; 
    
    if (score < 0.2) return isDarkMode ? '#388e3c' : '#66bb6a'; // Mastered (Green)
    if (score < 0.5) return isDarkMode ? '#fbc02d' : '#ffee58'; // Acceptable (Yellow)
    return isDarkMode ? '#d32f2f' : '#ef5350'; // Weak Spot (Red)
  };

  const getTextColor = (score: number, stats?: FretboardItemStats) => {
    if (score === -1) {
      return isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.7)';
    }
    return '#000000';
  };

  return (
    <Box>
      <Paper 
        elevation={0} 
        sx={{ 
          p: 2, 
          bgcolor: isDarkMode ? 'background.default' : '#ffffff', 
          border: '1px solid',
          borderColor: 'divider', 
          overflowX: 'auto',
          borderRadius: 1,
          boxShadow: isDarkMode ? 'none' : 'inset 0 1px 3px rgba(0,0,0,0.05)'
        }}
      >
        <Box sx={{ minWidth: 800 }}>
          {/* Fret numbers row */}
          <Box sx={{ display: 'flex', mb: 1 }}>
            <Box sx={{ width: 40 }} /> 
            {Array.from({ length: fretMax + 1 }).map((_, f) => (
              <Box key={f} sx={{ flex: 1, textAlign: 'center' }}>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    fontWeight: 900, 
                    color: isDarkMode ? 'text.secondary' : 'text.primary',
                    opacity: [3, 5, 7, 9, 12].includes(f) ? 1 : 0.4 
                  }}
                >
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
                const textColor = getTextColor(score, stats);
                
                const isHighlighted = scaleNotes.has(info.noteName);

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

                // Fix: Explicitly pass children prop to Tooltip to resolve TypeScript "children missing" error
                // when standard JSX children syntax fails to be correctly parsed as a property.
                return (
                  <Tooltip 
                    key={f} 
                    title={tooltipContent} 
                    arrow
                    children={
                      <Box 
                        onClick={() => !isReadOnly && onSelectPosition?.(sIdx, f)}
                        sx={{ 
                          flex: 1, 
                          height: 32, 
                          bgcolor: color,
                          m: 0.25,
                          borderRadius: 0.5,
                          cursor: isReadOnly ? 'default' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative',
                          border: '1px solid',
                          borderColor: isHighlighted 
                            ? (isDarkMode ? 'primary.main' : 'primary.dark') 
                            : (isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'),
                          boxShadow: isHighlighted ? `0 0 8px ${theme.palette.primary.main}${isDarkMode ? '40' : '60'}` : 'none',
                          zIndex: isHighlighted ? 1 : 0,
                          transition: isReadOnly ? 'none' : 'transform 0.1s, border-color 0.1s',
                          '&:hover': !isReadOnly ? {
                              transform: 'scale(1.2)',
                              zIndex: 2,
                              borderColor: isDarkMode ? 'primary.main' : 'primary.dark',
                              boxShadow: theme.shadows[4]
                          } : {}
                        }}
                      >
                          {isHighlighted && info.noteName === rootNote && (
                            <FlareIcon 
                              sx={{ 
                                position: 'absolute', 
                                top: -4, 
                                right: -4, 
                                fontSize: '0.8rem', 
                                color: 'primary.main',
                                filter: 'drop-shadow(0 0 1px rgba(0,0,0,0.3))'
                              }} 
                            />
                          )}
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              fontSize: '0.65rem', 
                              color: textColor, 
                              fontWeight: isHighlighted ? 900 : 800,
                              pointerEvents: 'none',
                              opacity: (scaleType !== 'none' && !isHighlighted) ? 0.15 : 1,
                            }}
                          >
                              {translateNoteName(info.noteName, settings.noteNaming)}
                          </Typography>
                      </Box>
                    }
                  />
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