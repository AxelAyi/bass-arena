import React, { useEffect, useState, useCallback, useRef } from 'react';
import { FormControl, InputLabel, Select, MenuItem, SelectChangeEvent, Box, Button, Alert, CircularProgress, Typography, alpha } from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { useStore } from '../state/store';
import { translations } from '../localization/translations';
import MicIcon from '@mui/icons-material/Mic';

const MicSelector: React.FC = () => {
  const { settings, updateSettings, isMicEnabled, setMicEnabled } = useStore();
  const t = translations[settings.language].mic;
  const st = translations[settings.language].settings;
  
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [error, setError] = useState<{ message: string, type: 'error' | 'warning' } | null>(null);
  const [loading, setLoading] = useState(true);
  const [permissionState, setPermissionState] = useState<PermissionState | 'unknown'>('unknown');
  
  const hasInitializedRef = useRef(false);

  // Sync error state with isMicEnabled: if enabled, we definitely don't have a permission error.
  useEffect(() => {
    if (isMicEnabled) {
      setError(null);
    }
  }, [isMicEnabled]);

  const getDevices = useCallback(async () => {
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = allDevices.filter(d => d.kind === 'audioinput');
      setDevices(audioInputs);
      
      if (audioInputs.length > 0 && !settings.selectedMicId) {
        const defaultDevice = audioInputs.find(d => d.deviceId === 'default') || audioInputs[0];
        if (defaultDevice) {
          updateSettings({ selectedMicId: defaultDevice.deviceId });
        }
      }
    } catch (err) {
      console.error("Error enumerating devices:", err);
      setError({ message: t.failed, type: 'error' });
    }
  }, [settings.selectedMicId, updateSettings, t.failed]);

  const checkPermissionAndLoad = useCallback(async () => {
    if (hasInitializedRef.current && isMicEnabled) return;
    setLoading(true);
    
    try {
      // Check browser permissions API
      if (navigator.permissions && (navigator.permissions as any).query) {
        try {
          const result = await navigator.permissions.query({ name: 'microphone' as any });
          setPermissionState(result.state);
          
          if (result.state !== 'denied') {
            setError(null);
          } else {
            setError({ message: t.denied, type: 'warning' });
            setMicEnabled(false);
          }

          result.onchange = () => {
            const newState = result.state;
            setPermissionState(newState);
            if (newState !== 'denied') {
              // Hide warning if permission is no longer denied
              setError(null);
            } else {
              setError({ message: t.denied, type: 'warning' });
              setMicEnabled(false);
            }
          };
        } catch (e) {
          console.warn("Permission API query failed", e);
        }
      }

      // We just probe for labels to see if we already have a functional session from before
      const initialDevices = await navigator.mediaDevices.enumerateDevices();
      const hasLabels = initialDevices.some(d => d.kind === 'audioinput' && d.label !== '');
      
      // Removed the auto-enable logic here. 
      // User must explicitly click "Enable Microphone" to start the session.
      if (hasLabels) {
        await getDevices();
        hasInitializedRef.current = true;
      }
    } catch (e) {
      console.warn("Permission check failed", e);
    } finally {
      setLoading(false);
    }
  }, [getDevices, setMicEnabled, updateSettings, t.denied, isMicEnabled]);

  const handleEnableMic = async () => {
    setError(null);
    setLoading(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const activeTrack = stream.getAudioTracks()[0];
      const activeDeviceId = activeTrack.getSettings().deviceId;
      
      if (activeDeviceId) {
        updateSettings({ selectedMicId: activeDeviceId });
      }

      stream.getTracks().forEach(track => track.stop());
      setMicEnabled(true);
      setError(null);
      await getDevices();
      hasInitializedRef.current = true;
      setPermissionState('granted');
    } catch (err: any) {
      console.error("Mic Request Error:", err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError({ message: t.denied, type: 'error' });
        setPermissionState('denied');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError({ message: t.notFound, type: 'error' });
      } else {
        setError({ message: t.failed + ": " + (err.message || err.name), type: 'error' });
      }
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
    const onDeviceChange = () => getDevices();
    navigator.mediaDevices.addEventListener('devicechange', onDeviceChange);
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', onDeviceChange);
    };
  }, [checkPermissionAndLoad, getDevices]);

  const currentSelectValue = (devices.length > 0 && settings.selectedMicId) 
    ? (devices.some(d => d.deviceId === settings.selectedMicId) ? settings.selectedMicId : devices[0].deviceId)
    : '';

  if (loading && !isMicEnabled) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 1 }}><CircularProgress size={20} /></Box>;
  }

  if (!isMicEnabled) {
    return (
      <Box sx={{ py: 1 }}>
        {error && (
          <Alert 
            severity={error.type} 
            sx={{ mb: 2 }} 
            icon={error.type === 'error' ? <ErrorOutlineIcon /> : <WarningAmberIcon />}
          >
            {error.message}
          </Alert>
        )}
        <Button 
          variant="contained" 
          onClick={handleEnableMic} 
          size="large" 
          fullWidth
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <MicIcon />}
          disabled={loading || permissionState === 'denied'}
          sx={{ fontWeight: 800 }}
        >
          {loading ? t.loadingNotation : t.enable}
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ minWidth: 200 }}>
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
          {devices.length === 0 && <MenuItem value="">{t.noMics}</MenuItem>}
        </Select>
      </FormControl>
      {devices.length > 0 && devices[0].label === "" && (
        <Typography variant="caption" color="warning.main" sx={{ mt: 1, display: 'block' }}>
          {t.refreshHint}
        </Typography>
      )}
    </Box>
  );
};

export default MicSelector;