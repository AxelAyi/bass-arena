
import React, { useEffect, useState, useCallback } from 'react';
import { FormControl, InputLabel, Select, MenuItem, SelectChangeEvent, Box, Button, Alert, CircularProgress } from '@mui/material';
import { useStore } from '../state/store';
import { translations } from '../localization/translations';

const MicSelector: React.FC = () => {
  const { settings, updateSettings, isMicEnabled, setMicEnabled } = useStore();
  const t = translations[settings.language].mic;
  const st = translations[settings.language].settings;
  
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const getDevices = useCallback(async () => {
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = allDevices.filter(d => d.kind === 'audioinput');
      setDevices(audioInputs);
      
      if (audioInputs.length > 0) {
        const currentId = settings.selectedMicId;
        const exists = audioInputs.some(d => d.deviceId === currentId);
        
        if (!currentId || !exists) {
          const defaultDevice = audioInputs.find(d => d.deviceId === 'default') || audioInputs[0];
          if (defaultDevice) {
            updateSettings({ selectedMicId: defaultDevice.deviceId });
          }
        }
      }
    } catch (err) {
      console.error("Error enumerating devices:", err);
      setError(t.failed);
    }
  }, [settings.selectedMicId, updateSettings, t.failed]);

  const checkPermissionAndLoad = useCallback(async () => {
    setLoading(true);
    try {
      const initialDevices = await navigator.mediaDevices.enumerateDevices();
      const hasLabels = initialDevices.some(d => d.kind === 'audioinput' && d.label !== '');
      
      if (hasLabels) {
        setMicEnabled(true);
        await getDevices();
      }
    } catch (e) {
      console.warn("Permission check failed", e);
    } finally {
      setLoading(false);
    }
  }, [getDevices, setMicEnabled]);

  const handleEnableMic = async () => {
    setError(null);
    setLoading(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setMicEnabled(true);
      await getDevices();
    } catch (err: any) {
      setError(t.failed);
      setMicEnabled(false);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event: SelectChangeEvent) => {
    updateSettings({ selectedMicId: event.target.value });
  };

  useEffect(() => {
    checkPermissionAndLoad();
    navigator.mediaDevices.addEventListener('devicechange', getDevices);
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', getDevices);
    };
  }, [checkPermissionAndLoad, getDevices]);

  const currentSelectValue = devices.some(d => d.deviceId === settings.selectedMicId) 
    ? settings.selectedMicId 
    : (devices.length > 0 ? '' : '');

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 1 }}><CircularProgress size={20} /></Box>;
  }

  if (!isMicEnabled) {
    return (
      <Box sx={{ py: 1 }}>
        <Button variant="outlined" onClick={handleEnableMic} size="small" fullWidth>
          {t.enable}
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ minWidth: 200 }}>
      {error && <Alert severity="error" sx={{ mb: 1, py: 0 }}>{error}</Alert>}
      <FormControl fullWidth size="small">
        <InputLabel id="mic-selector-label">{st.audioInput}</InputLabel>
        <Select
          labelId="mic-selector-label"
          value={currentSelectValue}
          label={st.audioInput}
          onChange={handleChange}
        >
          {devices.map((device) => (
            <MenuItem key={device.deviceId} value={device.deviceId}>
              {device.label || `Microphone (${device.deviceId.slice(0, 5)}...)`}
            </MenuItem>
          ))}
          {devices.length === 0 && <MenuItem value="">No microphones found</MenuItem>}
        </Select>
      </FormControl>
    </Box>
  );
};

export default MicSelector;
