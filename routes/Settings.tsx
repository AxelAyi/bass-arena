import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Box, Typography, Paper, Slider, Switch, FormControlLabel, Divider, FormGroup, Select, MenuItem, FormControl, InputLabel, ButtonBase, Button, Snackbar, Alert, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Stack, alpha } from '@mui/material';
import Grid from '@mui/material/Grid2';
import CheckIcon from '@mui/icons-material/Check';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import SettingsIcon from '@mui/icons-material/Settings';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { useStore } from '../state/store';
import MicSelector from '../components/MicSelector';
import { translations } from '../localization/translations';
import { AudioEngine, AudioStats } from '../audio/audioEngine';
import VuMeter from '../components/VuMeter';

const Settings: React.FC = () => {
  const { settings, history, mastery, activeProgramId, updateSettings, isMicEnabled, setMicEnabled, importState, resetStore } = useStore();
  const t = translations[settings.language].settings;
  const ts = translations[settings.language].session;

  const [isTesting, setIsTesting] = useState(false);
  const [testStats, setTestStats] = useState<AudioStats | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean, message: string, severity: 'success' | 'error' | 'info' }>({ open: false, message: '', severity: 'info' });
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const audioEngineRef = useRef<AudioEngine | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSlider = (key: string) => (_: any, value: number | number[]) => {
    updateSettings({ [key]: value });
  };

  const handleSwitch = (key: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    updateSettings({ [key]: event.target.checked });
  };

  const toggleTheme = (event: React.ChangeEvent<HTMLInputElement>) => {
    updateSettings({ themeMode: event.target.checked ? 'dark' : 'light' });
  };

  const handleLanguageChange = (e: any) => {
    const newLang = e.target.value;
    const noteNaming = (newLang === 'fr' || newLang === 'es') && settings.noteNaming === 'english' ? 'latin' : settings.noteNaming;
    updateSettings({ language: newLang, noteNaming });
  };

  const colorOptions = [
    { name: 'Blue', value: '#2196f3' },
    { name: 'Cyan', value: '#00bcd4' },
    { name: 'Green', value: '#4caf50' },
    { name: 'Purple', value: '#9c27b0' },
    { name: 'Red', value: '#f44336' },
    { name: 'Grey', value: settings.themeMode === 'light' ? '#424242' : '#bdbdbd' },
  ];

  const handleColorSelect = (newColor: string) => {
    updateSettings({ primaryColor: newColor });
  };

  const handleTestProcess = useCallback((stats: AudioStats) => {
    setTestStats(stats);
  }, []);

  const toggleTest = () => {
    setIsTesting(prev => !prev);
  };

  const handleExport = () => {
    try {
      const data = {
        settings,
        history,
        mastery,
        activeProgramId,
        exportDate: new Date().toISOString(),
        version: '2.0'
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `bassarena-backup-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setSnackbar({ open: true, message: 'Export failed', severity: 'error' });
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const json = JSON.parse(evt.target?.result as string);
        if (json.settings && json.mastery) {
          importState(json);
          setSnackbar({ open: true, message: t.importSuccess, severity: 'success' });
        } else {
          throw new Error('Invalid format');
        }
      } catch (err) {
        setSnackbar({ open: true, message: t.importError, severity: 'error' });
      }
      e.target.value = ''; 
    };
    reader.readAsText(file);
  };

  const handleConfirmReset = async () => {
    const wasMicEnabled = isMicEnabled;
    resetStore();
    setResetDialogOpen(false);
    setSnackbar({ open: true, message: t.resetSuccess, severity: 'info' });

    if (wasMicEnabled) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const activeTrack = stream.getAudioTracks()[0];
        const activeDeviceId = activeTrack.getSettings().deviceId;
        if (activeDeviceId) {
          updateSettings({ selectedMicId: activeDeviceId });
        }
        stream.getTracks().forEach(track => track.stop());
        setMicEnabled(true);
      } catch (e) {
        setMicEnabled(false);
      }
    }
  };

  useEffect(() => {
    const restartEngine = async () => {
        if (audioEngineRef.current) {
            await audioEngineRef.current.stop();
        }
        
        if (isTesting && isMicEnabled) {
            audioEngineRef.current = new AudioEngine(handleTestProcess);
            try {
                await audioEngineRef.current.start(settings.selectedMicId);
            } catch (err) {
                console.error("Test engine failed to start with device:", settings.selectedMicId, err);
                setIsTesting(false);
            }
        }
    };

    restartEngine();

    return () => {
      audioEngineRef.current?.stop();
    };
  }, [isTesting, settings.selectedMicId, isMicEnabled, handleTestProcess]);

  const shouldDisplayNote = testStats && testStats.pitch && testStats.rms >= settings.rmsThreshold;

  return (
    <Box sx={{ pb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <SettingsIcon color="primary" sx={{ fontSize: 32, mr: 1.5 }} />
        <Typography variant="h5" fontWeight="900" sx={{ letterSpacing: -1 }}>{t.title}</Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="subtitle1" gutterBottom fontWeight="800" color="primary" sx={{ mb: 1.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t.audioInput}</Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ mb: 3 }}>
                <MicSelector />
              </Box>

              <Box sx={{ mb: 3, p: 2, bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 2, border: '1px solid rgba(255,255,255,0.05)' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase' }}>
                    {t.liveMonitor}
                  </Typography>
                  <Button 
                    size="small" 
                    variant={isTesting ? "outlined" : "contained"} 
                    color={isTesting ? "error" : "primary"}
                    onClick={toggleTest}
                    startIcon={isTesting ? <MicOffIcon /> : <MicIcon />}
                    disabled={!isMicEnabled}
                  >
                    {isTesting ? t.stopTest : t.startTest}
                  </Button>
                </Box>
                
                {isTesting ? (
                  <Box sx={{ mt: 2 }}>
                    <VuMeter rms={testStats?.rms || 0} threshold={settings.rmsThreshold} />
                    <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold', color: 'primary.main' }}>
                      {t.noteLabel}: {shouldDisplayNote ? `${testStats.pitch!.noteName}${testStats.pitch!.octave}` : '--'}
                    </Typography>
                  </Box>
                ) : (
                  <Typography variant="caption" color="textSecondary" sx={{ fontStyle: 'italic', display: 'block', mt: 1 }}>
                    {t.testHint}
                  </Typography>
                )}
              </Box>
              
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2" gutterBottom fontWeight="bold" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  {t.noiseGate} <span>{settings.rmsThreshold.toFixed(3)}</span>
                </Typography>
                <Slider 
                  value={settings.rmsThreshold} 
                  min={0.001} 
                  max={0.2} 
                  step={0.001} 
                  onChange={handleSlider('rmsThreshold')} 
                  size="small"
                />
                <Typography variant="caption" color="textSecondary" sx={{ display: 'block', lineHeight: 1.2 }}>{t.noiseGateHint}</Typography>
              </Box>

              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" gutterBottom fontWeight="bold" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  {t.pitchTolerance} <span>±{settings.pitchTolerance}</span>
                </Typography>
                <Slider value={settings.pitchTolerance} min={10} max={50} onChange={handleSlider('pitchTolerance')} size="small" />
              </Box>

              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" gutterBottom fontWeight="bold" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  {t.stability} <span>{settings.stabilityMs}ms</span>
                </Typography>
                <Slider value={settings.stabilityMs} min={50} max={1000} step={50} onChange={handleSlider('stabilityMs')} size="small" />
              </Box>
            </Paper>

            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="subtitle1" gutterBottom fontWeight="800" color="primary" sx={{ mb: 1.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t.instrument}</Typography>
              <Divider sx={{ mb: 2 }} />
              
              <FormGroup>
                <FormControlLabel control={<Switch checked={settings.themeMode === 'dark'} onChange={toggleTheme} color="primary" size="small" />} label={<Typography variant="body2" fontWeight="700">{t.darkMode}</Typography>} />
                <FormControlLabel control={<Switch checked={settings.isFiveString} onChange={handleSwitch('isFiveString')} color="primary" size="small" />} label={<Typography variant="body2" fontWeight="700">{t.fiveString}</Typography>} labelPlacement="end" />
                <FormControlLabel control={<Switch checked={settings.allowMultipleAttempts} onChange={handleSwitch('allowMultipleAttempts')} color="primary" size="small" />} label={<Typography variant="body2" fontWeight="700">{t.multipleAttempts}</Typography>} labelPlacement="end" />
              </FormGroup>
            </Paper>
          </Box>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="subtitle1" gutterBottom fontWeight="800" color="primary" sx={{ mb: 1.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t.localization}</Typography>
              <Divider sx={{ mb: 2 }} />

              <Box sx={{ mb: 3 }}>
                <Typography variant="caption" gutterBottom fontWeight="800" sx={{ mb: 1, textTransform: 'uppercase', color: 'text.secondary', display: 'block' }}>
                  {t.primaryColor}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                  {colorOptions.map((c) => {
                    const isSelected = settings.primaryColor === c.value || (c.name === 'Grey' && (settings.primaryColor === '#424242' || settings.primaryColor === '#bdbdbd'));
                    return (
                      <ButtonBase
                        key={c.value}
                        onClick={() => handleColorSelect(c.value)}
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          bgcolor: c.value,
                          border: isSelected ? '3px solid' : '1px solid rgba(0,0,0,0.1)',
                          borderColor: settings.themeMode === 'dark' ? '#fff' : 'primary.main',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {isSelected && <CheckIcon sx={{ color: '#fff', fontSize: 18 }} />}
                      </ButtonBase>
                    );
                  })}
                </Box>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel sx={{ fontWeight: 700 }}>{t.language}</InputLabel>
                  <Select value={settings.language} label={t.language} onChange={handleLanguageChange} sx={{ fontWeight: 700 }}>
                    <MenuItem value="en">English</MenuItem>
                    <MenuItem value="fr">Français</MenuItem>
                    <MenuItem value="es">Español</MenuItem>
                  </Select>
                </FormControl>
                <FormControl fullWidth size="small">
                  <InputLabel sx={{ fontWeight: 700 }}>{t.noteNaming}</InputLabel>
                  <Select value={settings.noteNaming} label={t.noteNaming} onChange={(e) => updateSettings({ noteNaming: e.target.value as any })} sx={{ fontWeight: 700 }}>
                    <MenuItem value="english">English (C, D, E...)</MenuItem>
                    <MenuItem value="latin">Latin (Do, Ré, Mi...)</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Paper>

            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="subtitle1" gutterBottom fontWeight="800" color="primary" sx={{ mb: 1.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t.trainingRules}</Typography>
              <Divider sx={{ mb: 2 }} />

              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" gutterBottom fontWeight="bold" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  {t.timeLimit} <span>{settings.timeLimit}s</span>
                </Typography>
                <Slider value={settings.timeLimit} min={2} max={15} onChange={handleSlider('timeLimit')} size="small" />
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" gutterBottom fontWeight="bold" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  {t.unlockThreshold} <span>{settings.minUnlockAccuracy}%</span>
                </Typography>
                <Slider value={settings.minUnlockAccuracy} min={50} max={100} step={5} onChange={handleSlider('minUnlockAccuracy')} size="small" />
              </Box>
              
              <FormGroup>
                <FormControlLabel control={<Switch checked={settings.unlockAllExercises} onChange={handleSwitch('unlockAllExercises')} color="primary" size="small" />} label={<Typography variant="body2" fontWeight="700">{t.unlockAllExercises}</Typography>} labelPlacement="end" />
                <FormControlLabel control={<Switch checked={settings.strictOctave} onChange={handleSwitch('strictOctave')} color="primary" size="small" />} label={<Typography variant="body2" fontWeight="700">{t.strictOctave}</Typography>} labelPlacement="end" />
                <FormControlLabel control={<Switch checked={settings.showFretNumber} onChange={handleSwitch('showFretNumber')} color="primary" size="small" />} label={<Typography variant="body2" fontWeight="700">{t.showFret}</Typography>} labelPlacement="end" />
                <FormControlLabel control={<Switch checked={settings.lockString} onChange={handleSwitch('lockString')} color="primary" size="small" />} label={<Typography variant="body2" fontWeight="700">{t.validateString}</Typography>} labelPlacement="end" />
              </FormGroup>
            </Paper>

            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="subtitle1" gutterBottom fontWeight="800" color="primary" sx={{ mb: 1.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t.dataManagement}</Typography>
              <Divider sx={{ mb: 2 }} />
              <Stack direction="column" spacing={2}>
                <Button 
                  variant="outlined" 
                  startIcon={<CloudDownloadIcon />} 
                  fullWidth 
                  onClick={handleExport}
                >
                  {t.exportData}
                </Button>
                <Button 
                  variant="outlined" 
                  startIcon={<CloudUploadIcon />} 
                  fullWidth 
                  onClick={handleImportClick}
                >
                  {t.importData}
                </Button>
                <input
                  type="file"
                  accept=".json"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={handleImportFile}
                />
                <Button 
                  variant="outlined" 
                  color="error" 
                  startIcon={<RestartAltIcon />} 
                  fullWidth 
                  onClick={() => setResetDialogOpen(true)}
                  sx={{ mt: 2 }}
                >
                  {t.resetData}
                </Button>
              </Stack>
            </Paper>
          </Box>
        </Grid>
      </Grid>

      <Dialog
        open={resetDialogOpen}
        onClose={() => setResetDialogOpen(false)}
      >
        <DialogTitle>{t.resetConfirmTitle}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t.resetConfirmDesc}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleConfirmReset} color="error" variant="contained">
            {t.resetData}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={4000} 
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} variant="filled" sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Settings;