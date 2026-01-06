import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { NoteInfo, translateNoteName } from '../audio/noteUtils';
import { useStore } from '../state/store';
import { translations } from '../localization/translations';

interface NoteDisplayProps {
  detectedNote: NoteInfo | null;
  targetNoteName: string;
  isCorrect: boolean;
  isAlmost: boolean;
  debug: boolean;
  rms: number;
}

const NoteDisplay: React.FC<NoteDisplayProps> = ({ 
  detectedNote, 
  isCorrect, 
  isAlmost,
  debug,
  rms 
}) => {
  const { settings } = useStore();
  const t = translations[settings.language].session;
  
  const getStatusColor = () => {
    if (isCorrect) return 'success.main';
    if (isAlmost) return 'warning.main';
    return 'text.primary';
  };

  const displayName = detectedNote 
    ? translateNoteName(detectedNote.noteName, settings.noteNaming) 
    : '--';

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 2, 
        borderRadius: 2, 
        width: 120, 
        height: 110, // Slightly taller for better spacing
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        border: '1px solid', 
        borderColor: 'divider', 
        bgcolor: 'background.paper',
        position: 'relative'
      }}
    >
      {/* Fixed label at the top */}
      <Typography 
        variant="caption" 
        color="textSecondary" 
        sx={{ 
          textTransform: 'uppercase', 
          letterSpacing: 1, 
          fontWeight: 900, 
          display: 'block', 
          mb: 1,
          fontSize: '0.65rem',
          opacity: 0.7
        }}
      >
        {t.detected}
      </Typography>

      {/* Fixed height container for the note itself */}
      <Box sx={{ 
        height: 40, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <Typography 
          variant="h4" 
          sx={{ 
            fontWeight: 900, 
            color: getStatusColor(),
            textShadow: isCorrect ? '0 0 10px rgba(76, 175, 80, 0.3)' : 'none',
            lineHeight: 1,
          }}
        >
          {displayName}
        </Typography>
      </Box>
      
      {/* Fixed height container for cents to prevent jumping */}
      <Box sx={{ 
        height: 20, 
        mt: 0.5, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        {detectedNote && (
          <Typography variant="caption" sx={{ fontWeight: 800, color: Math.abs(detectedNote.cents) < 15 ? 'success.light' : 'warning.light' }}>
            {detectedNote.cents > 0 ? `+${detectedNote.cents}` : detectedNote.cents}c
          </Typography>
        )}
      </Box>

      {debug && (
        <Box sx={{ position: 'absolute', bottom: -40, left: 0, right: 0, textAlign: 'center' }}>
          <Typography variant="caption" component="pre" sx={{ fontSize: '0.6rem', color: 'text.secondary' }}>
            {detectedNote?.frequency.toFixed(2) || 0}Hz | RMS: {rms.toFixed(4)}
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default NoteDisplay;