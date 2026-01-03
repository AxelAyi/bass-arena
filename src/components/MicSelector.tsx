
import React, { useEffect, useState } from 'react';
import { FormControl, InputLabel, Select, MenuItem, SelectChangeEvent, Box, Typography, Button, Alert } from '@mui/material';
import { useStore } from '../state/store';

const MicSelector: React.FC = () => {
  const { settings, updateSettings, isMicEnabled, setMicEnabled } = useStore();
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [error, setError] = useState<string | null>(null);

  const getDevices = async () => {
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = allDevices.filter(d => d.kind === 'audioinput');
      setDevices(audioInputs);
      
      // If we have labels but permission wasn't fully checked, this confirms we are good
      if (audioInputs.length > 0 && audioInputs[0].label === "") {
        console.warn("Empty device labels. User might need to grant permission first.");
      }
    } catch (err) {
      setError("Could not access microphone list.");
    }
  };

  const handleEnableMic = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicEnabled(true);
      getDevices();
    } catch (err) {
      setError("Microphone permission denied.");
    }
  };

  const handleChange = (event: SelectChangeEvent) => {
    updateSettings({ selectedMicId: event.target.value });
  };

  useEffect(() => {
    if (isMicEnabled) {
      getDevices();
    }
  }, [isMicEnabled]);

  if (!isMicEnabled) {
    return (
      <Box sx={{ textAlign: 'center', p: 4, bgcolor: 'background.paper', borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>Microphone Access Required</Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          We need access to your microphone to listen to your bass notes.
        </Typography>
        <Button variant="contained" onClick={handleEnableMic}>
          Enable Microphone
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ minWidth: 200 }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <FormControl fullWidth>
        <InputLabel>Audio Input Device</InputLabel>
        <Select
          value={settings.selectedMicId}
          label="Audio Input Device"
          onChange={handleChange}
        >
          {devices.map((device) => (
            <MenuItem key={device.deviceId} value={device.deviceId}>
              {device.label || `Microphone ${device.deviceId.slice(0, 5)}...`}
            </MenuItem>
          ))}
          {devices.length === 0 && <MenuItem disabled>No microphones found</MenuItem>}
        </Select>
      </FormControl>
      {devices.length > 0 && devices[0].label === "" && (
        <Typography variant="caption" color="warning.main" sx={{ mt: 1, display: 'block' }}>
          * Refresh page if labels are missing.
        </Typography>
      )}
    </Box>
  );
};

export default MicSelector;
