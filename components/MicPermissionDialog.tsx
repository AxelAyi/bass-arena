import React, { useState } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, Typography, 
  Button, Box, Alert, CircularProgress, DialogActions 
} from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import { useStore } from '../state/store';
import { translations } from '../localization/translations';

interface MicPermissionDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const MicPermissionDialog: React.FC<MicPermissionDialogProps> = ({ open, onClose, onSuccess }) => {
  const { settings, setMicEnabled, updateSettings } = useStore();
  const t = translations[settings.language].mic;
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEnableMic = async () => {
    setError(null);
    setLoading(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Reflect the value selected in the browser's prompt back into our settings
      const activeTrack = stream.getAudioTracks()[0];
      const activeDeviceId = activeTrack.getSettings().deviceId;
      
      if (activeDeviceId) {
        updateSettings({ selectedMicId: activeDeviceId });
      }

      stream.getTracks().forEach(track => track.stop());
      
      setMicEnabled(true);
      setLoading(false);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Mic permission error:", err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError(t.denied);
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError(t.notFound);
      } else {
        setError(t.failed);
      }
      setMicEnabled(false);
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ textAlign: 'center', pb: 0 }}>
        <MicIcon color="primary" sx={{ fontSize: 48, mb: 1 }} />
        <Typography variant="h6">{t.required}</Typography>
      </DialogTitle>
      <DialogContent sx={{ textAlign: 'center', py: 2 }}>
        <Typography variant="body2" color="textSecondary">
          {t.description}
        </Typography>
        {error && <Alert severity="error" sx={{ mt: 2, textAlign: 'left' }}>{error}</Alert>}
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center', pb: 3, px: 3 }}>
        <Button 
          variant="contained" 
          onClick={handleEnableMic} 
          disabled={loading}
          fullWidth
          sx={{ py: 1.5 }}
        >
          {loading ? <CircularProgress size={24} /> : t.enable}
        </Button>
        <Button variant="text" color="inherit" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MicPermissionDialog;