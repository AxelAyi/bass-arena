import React from 'react';
import { Box, Typography, Paper, keyframes, alpha, useTheme } from '@mui/material';
import { NoteInfo, translateNoteName } from '../audio/noteUtils';
import { useStore } from '../state/store';
import { translations } from '../localization/translations';

const shake = keyframes`
  0% { transform: translateX(0); }
  25% { transform: translateX(-8px); }
  50% { transform: translateX(8px); }
  75% { transform: translateX(-8px); }
  100% { transform: translateX(0); }
`;

interface NoteDisplayProps {
  detectedNote: NoteInfo | null;
  targetNoteName: string;
  isCorrect: boolean;
  isAlmost: boolean;
  isFailure?: boolean;
  debug: boolean;
  rms: number;
}

const NoteDisplay: React.FC<NoteDisplayProps> = ({ 
  detectedNote, 
  isCorrect, 
  isAlmost,
  isFailure,
  debug,
  rms 
}) => {
  const { settings } = useStore();
  const theme = useTheme();
  const t = translations[settings.language].session;
  
  const getStatusColor = () => {
    if (isFailure) return 'error.main';
    if (isCorrect) return 'success.main';
    if (isAlmost) return 'warning.main';
    return 'text.primary';
  };

  const displayName = detectedNote 
    ? translateNoteName(detectedNote.noteName, settings.noteNaming).toUpperCase() 
    : '--';

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 2, 
        borderRadius: 2, 
        width: 120, 
        height: 110, 
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        border: '2px solid', 
        borderColor: isFailure ? 'error.main' : (isCorrect ? 'success.main' : 'divider'), 
        bgcolor: isFailure ? alpha(theme.palette.error.main, 0.05) : (isCorrect ? alpha(theme.palette.success.main, 0.05) : 'background.paper'),
        position: 'relative',
        animation: isFailure ? `${shake} 0.4s cubic-bezier(.36,.07,.19,.97) both` : 'none',
        transition: 'all 0.2s ease',
        boxShadow: isCorrect ? `0 0 15px ${alpha(theme.palette.success.main, 0.4)}` : 'none'
      }}
    >
      <Typography 
        variant="caption" 
        color={isFailure ? "error.main" : (isCorrect ? "success.main" : "textSecondary")} 
        sx={{ 
          textTransform: 'uppercase', 
          letterSpacing: 1, 
          fontWeight: 900, 
          display: 'block', 
          mb: 1,
          fontSize: '0.65rem',
          opacity: 0.7,
          transition: 'color 0.2s'
        }}
      >
        {t.detected}
      </Typography>

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
            textShadow: isCorrect ? `0 0 12px ${alpha(theme.palette.success.main, 0.5)}` : (isFailure ? `0 0 12px ${alpha(theme.palette.error.main, 0.5)}` : 'none'),
            lineHeight: 1,
            transition: 'color 0.2s'
          }}
        >
          {displayName}
        </Typography>
      </Box>
      
      <Box sx={{ 
        height: 20, 
        mt: 0.5, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        {detectedNote && !isFailure && !isCorrect && (
          <Typography variant="caption" sx={{ fontWeight: 800, color: Math.abs(detectedNote.cents) < 15 ? 'success.light' : 'warning.light' }}>
            {detectedNote.cents > 0 ? `+${detectedNote.cents}` : detectedNote.cents}c
          </Typography>
        )}
        {isCorrect && (
          <Typography variant="caption" sx={{ fontWeight: 900, color: 'success.main', textTransform: 'uppercase', fontSize: '0.6rem' }}>
            {t.perfect || 'MATCH'}
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
