
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Typography, Dialog, DialogTitle, DialogContent, IconButton, Paper } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import { AudioEngine, AudioStats } from '../audio/audioEngine';
import { useStore } from '../state/store';
import { translateNoteName } from '../audio/noteUtils';
import { translations } from '../localization/translations';
import VuMeter from './VuMeter';

interface TunerProps {
  open: boolean;
  onClose: () => void;
}

const Tuner: React.FC<TunerProps> = ({ open, onClose }) => {
  const { settings } = useStore();
  const st = translations[settings.language].session;
  const nt = translations[settings.language].nav;
  
  const [detected, setDetected] = useState<AudioStats | null>(null);
  const audioEngineRef = useRef<AudioEngine | null>(null);

  const handleAudioProcess = useCallback((stats: AudioStats) => {
    setDetected(stats);
  }, []);

  useEffect(() => {
    if (open) {
      audioEngineRef.current = new AudioEngine(handleAudioProcess);
      audioEngineRef.current.start(settings.selectedMicId).catch(console.error);
    } else {
      audioEngineRef.current?.stop();
    }
    return () => {
      audioEngineRef.current?.stop();
    };
  }, [open, settings.selectedMicId, handleAudioProcess]);

  const isActive = (detected?.rms || 0) > settings.rmsThreshold;
  const cents = isActive ? (detected?.pitch?.cents || 0) : 0;
  const rawNoteName = (isActive && detected?.pitch) ? detected.pitch.noteName : '--';
  const displayNoteName = rawNoteName === '--' ? '--' : translateNoteName(rawNoteName, settings.noteNaming);
  
  // Needle sensitivity: Scale rotation based on cents
  const rotation = isActive ? Math.max(-45, Math.min(45, (cents / 50) * 45)) : 0;
  const isInTune = isActive && Math.abs(cents) < 5;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <MusicNoteIcon color="primary" sx={{ mr: 1, fontSize: 20 }} />
          <Typography variant="subtitle1" fontWeight="bold">{nt.tuner}</Typography>
        </Box>
        <IconButton onClick={onClose} size="small"><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>
      <DialogContent sx={{ textAlign: 'center', pb: 2 }}>
        <Paper 
          elevation={0} 
          sx={{ 
            p: 3, 
            bgcolor: 'background.default', 
            borderRadius: 2, 
            position: 'relative',
            overflow: 'hidden',
            border: isInTune ? '2px solid #4caf50' : '2px solid transparent',
            transition: 'border 0.2s'
          }}
        >
          <Typography variant="h2" sx={{ fontWeight: 900, mb: 0, opacity: isActive ? 1 : 0.2 }}>
            {displayNoteName}
          </Typography>
          <Typography variant="caption" color={isInTune ? 'success.main' : 'text.secondary'} sx={{ fontWeight: 'bold', display: 'block', mb: 2 }}>
            {isActive ? (isInTune ? st.perfect : `${cents > 0 ? '+' : ''}${cents} cents`) : st.silence}
          </Typography>
          <Box sx={{ position: 'relative', height: 80, width: '100%', display: 'flex', justifyContent: 'center' }}>
            <Box sx={{ position: 'absolute', bottom: 0, width: '100%', height: 1, bgcolor: 'rgba(255,255,255,0.1)' }} />
            {[-50, -25, 0, 25, 50].map((tick) => (
              <Box 
                key={tick}
                sx={{ 
                  position: 'absolute', 
                  bottom: 0, 
                  left: `${50 + (tick / 50) * 50}%`,
                  width: tick === 0 ? 2 : 1,
                  height: tick === 0 ? 16 : 8,
                  bgcolor: tick === 0 ? 'primary.main' : 'rgba(255,255,255,0.3)',
                  transform: 'translateX(-50%)'
                }}
              />
            ))}
            <Box 
              sx={{ 
                position: 'absolute', 
                bottom: -5, 
                height: 60, 
                width: 2, 
                bgcolor: isInTune ? '#4caf50' : '#ff5722',
                transformOrigin: 'bottom center',
                transform: `rotate(${rotation}deg)`,
                // Reduced transition from 0.1s to 0.05s for a more "sensitive/reactive" feel
                transition: 'transform 0.05s linear',
                opacity: isActive ? 1 : 0.2
              }} 
            />
          </Box>
        </Paper>
        <Box sx={{ mt: 2 }}><VuMeter rms={detected?.rms || 0} threshold={settings.rmsThreshold} /></Box>
      </DialogContent>
    </Dialog>
  );
};

export default Tuner;
