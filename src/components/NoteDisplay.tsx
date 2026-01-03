
import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { NoteInfo } from '../audio/noteUtils';

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
  targetNoteName, 
  isCorrect, 
  isAlmost,
  debug,
  rms 
}) => {
  const getStatusColor = () => {
    if (isCorrect) return 'success.main';
    if (isAlmost) return 'warning.main';
    return 'text.primary';
  };

  return (
    <Paper elevation={4} sx={{ p: 4, textAlign: 'center', borderRadius: 4, minWidth: 200, bgcolor: 'background.paper' }}>
      <Typography variant="h6" color="textSecondary" gutterBottom>
        DETECTED
      </Typography>
      <Typography 
        variant="h1" 
        sx={{ 
          fontWeight: 900, 
          color: getStatusColor(),
          textShadow: isCorrect ? '0 0 20px rgba(76, 175, 80, 0.5)' : 'none'
        }}
      >
        {detectedNote ? detectedNote.noteName : '--'}
      </Typography>
      
      {detectedNote && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="body1" color={Math.abs(detectedNote.cents) < 15 ? 'success.light' : 'warning.light'}>
            {detectedNote.cents > 0 ? `+${detectedNote.cents}` : detectedNote.cents} cents
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.6 }}>
            {detectedNote.cents > 0 ? 'Sharp' : detectedNote.cents < 0 ? 'Flat' : 'Perfect'}
          </Typography>
        </Box>
      )}

      {debug && (
        <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid rgba(255,255,255,0.1)', textAlign: 'left' }}>
          <Typography variant="caption" component="pre">
            Freq: {detectedNote?.frequency.toFixed(2) || 0} Hz<br/>
            Midi: {detectedNote?.midi || 0}<br/>
            Octave: {detectedNote?.octave || 0}<br/>
            RMS: {rms.toFixed(4)}
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default NoteDisplay;
