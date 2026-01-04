import React, { useMemo, useState } from 'react';
import { Box, Typography, Paper, Tooltip, Divider, useTheme, Stack, MenuItem, Select, FormControl, InputLabel, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { useStore, FretboardItemStats } from '../state/store';
import { translations } from '../localization/translations';
import { getFretInfo, BASS_STRINGS, NOTE_NAMES } from '../data/fretboard';
import { translateNoteName } from '../audio/noteUtils';
import FlareIcon from '@mui/icons-material/Flare';
import LayersIcon from '@mui/icons-material/Layers';

interface FretboardHeatmapProps {
  onSelectPosition?: (s: number, f: number) => void;
}

type ScaleType = 'none' | 'major_pent' | 'minor_pent';

const FretboardHeatmap: React.FC<FretboardHeatmapProps> = ({ onSelectPosition }) => {
  const { settings, mastery } = useStore();
  const theme = useTheme();
  const t = translations[settings.language].training;
  const fretMax = 12; // Standard view
  const isReadOnly = !onSelectPosition;
  const isDarkMode = theme.palette.mode === 'dark';

  // Overlay State
  const [scaleType, setScaleType] = useState<ScaleType>('none');
  const [rootNote, setRootNote] = useState('C');
  const [selectedBox, setSelectedBox] = useState<number | 'all'>('all');
  
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

  // Calculate Box Fret Range (Simple visualization logic for 4/5 string bass)
  const boxRange = useMemo(() => {
    if (selectedBox === 'all' || scaleType === 'none') return null;
    
    let rootFret = -1;
    // Find first occurrence of root on E string as anchor for visualization
    for (let f = 0; f <= 12; f++) {
      if (getFretInfo(3, f).noteName === rootNote) {
        rootFret = f;
        break;
      }
    }

    if (rootFret === -1) return null;

    const minorOffsets = [0, 3, 5, 8, 10]; 
    const majorOffsets = [0, 2, 4, 7, 9];
    
    const offsets = scaleType === 'minor_pent' ? minorOffsets : majorOffsets;
    const startFret = (rootFret + offsets[(selectedBox as number) - 1]) % 12;
    
    return { start: startFret, end: (startFret + 3) % 13 };
  }, [selectedBox, scaleType, rootNote]);

  const getWeaknessScore = (stats: FretboardItemStats) => {
    if (!stats || stats.attempts === 0) return -1;
    const accuracy = stats.corrects / stats.attempts;
    return (1 - accuracy);
  };

  const getCellColor = (score: number, stats?: FretboardItemStats) => {
    if (score === -1) {
      return isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.06)'; 
    }
    
    // Threshold for low attempts: highlight as red/danger if barely practiced
    if (stats && stats.attempts < 3) return isDarkMode ? '#d32f2f' : '#ef5350'; 
    
    if (score < 0.2) return isDarkMode ? '#388e3c' : '#66bb6a'; // Mastered (Green)
    if (score < 0.5) return isDarkMode ? '#fbc02d' : '#ffee58'; // Acceptable (Yellow)
    return isDarkMode ? '#d32f2f' : '#ef5350'; // Weak Spot (Red)
  };

  const getTextColor = (score: number, stats?: FretboardItemStats) => {
    if (score === -1) {
      return isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.4)';
    }
    // For active cells, we use high contrast dark text on the vibrant backgrounds
    return '#000000';
  };

  return (
    <Box>
      {/* Pattern Overlay Controls */}
      <Paper 
        variant="outlined" 
        sx={{ 
          p: 1.5, 
          mb: 2, 
          borderRadius: 1, 
          bgcolor: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <LayersIcon fontSize="small" color="primary" />
          <Typography variant="caption" fontWeight="900" sx={{ textTransform: 'uppercase' }}>Pattern Overlays</Typography>
        </Stack>

        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Scale Type</InputLabel>
          <Select 
            value={scaleType} 
            label="Scale Type" 
            onChange={(e) => setScaleType(e.target.value as ScaleType)}
            sx={{ fontSize: '0.75rem', fontWeight: 700 }}
          >
            <MenuItem value="none">None</MenuItem>
            <MenuItem value="major_pent">Major Pentatonic</MenuItem>
            <MenuItem value="minor_pent">Minor Pentatonic</MenuItem>
          </Select>
        </FormControl>

        {scaleType !== 'none' && (
          <>
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <InputLabel>Root</InputLabel>
              <Select 
                value={rootNote} 
                label="Root" 
                onChange={(e) => setRootNote(e.target.value)}
                sx={{ fontSize: '0.75rem', fontWeight: 700 }}
              >
                {NOTE_NAMES.map(n => (
                  <MenuItem key={n} value={n}>{translateNoteName(n, settings.noteNaming)}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <ToggleButtonGroup
              size="small"
              value={selectedBox}
              exclusive
              onChange={(_, val) => val !== null && setSelectedBox(val)}
              sx={{ height: 32 }}
            >
              <ToggleButton value="all" sx={{ px: 1.5, fontSize: '0.65rem', fontWeight: 800 }}>All</ToggleButton>
              {[1, 2, 3, 4, 5].map(b => (
                <ToggleButton key={b} value={b} sx={{ px: 1.5, fontSize: '0.65rem', fontWeight: 800 }}>Box {b}</ToggleButton>
              ))}
            </ToggleButtonGroup>
          </>
        )}
      </Paper>

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
                    opacity: [3, 5, 7, 9, 12].includes(f) ? 1 : 0.3 
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
                
                const isInScale = scaleNotes.has(info.noteName);
                const isInBoxRange = boxRange 
                  ? (f >= boxRange.start && f <= boxRange.end) || (f + 12 >= boxRange.start && f + 12 <= boxRange.end)
                  : true;
                const isHighlighted = isInScale && isInBoxRange;

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