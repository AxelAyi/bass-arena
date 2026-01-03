
import React from 'react';
import { Box, Typography, Paper, Grid, Slider, Switch, FormControlLabel, Divider, FormGroup, Select, MenuItem, FormControl, InputLabel, ButtonBase } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import { useStore } from '../state/store';
import MicSelector from '../components/MicSelector';
import { translations } from '../localization/translations';

const Settings: React.FC = () => {
  const { settings, updateSettings } = useStore();
  const t = translations[settings.language].settings;

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
    { name: 'Orange', value: '#ff9800' },
    { name: 'Green', value: '#4caf50' },
    { name: 'Purple', value: '#9c27b0' },
    { name: 'Red', value: '#f44336' },
  ];

  const handleColorSelect = (newColor: string) => {
    updateSettings({ primaryColor: newColor });
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 900, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom fontWeight="bold">{t.title}</Typography>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>{t.audioInput}</Typography>
            <Divider sx={{ mb: 3 }} />
            <MicSelector />
            <Box sx={{ mt: 4 }}>
              <Typography gutterBottom>{t.noiseGate}: {settings.rmsThreshold.toFixed(3)}</Typography>
              <Slider value={settings.rmsThreshold} min={0.001} max={0.2} step={0.001} onChange={handleSlider('rmsThreshold')} />
              <Typography variant="caption" color="textSecondary">{t.noiseGateHint}</Typography>
            </Box>
            <Box sx={{ mt: 3 }}>
              <Typography gutterBottom>{t.pitchTolerance}: ±{settings.pitchTolerance}</Typography>
              <Slider value={settings.pitchTolerance} min={10} max={50} onChange={handleSlider('pitchTolerance')} />
            </Box>
            <Box sx={{ mt: 3 }}>
              <Typography gutterBottom>{t.stability}: {settings.stabilityMs}</Typography>
              <Slider value={settings.stabilityMs} min={50} max={1000} step={50} onChange={handleSlider('stabilityMs')} />
            </Box>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>{t.instrument}</Typography>
            <Divider sx={{ mb: 3 }} />
            
            <FormGroup sx={{ mb: 3 }}>
              <FormControlLabel 
                control={<Switch checked={settings.themeMode === 'dark'} onChange={toggleTheme} color="primary" />} 
                label={<Typography fontWeight="bold">{t.darkMode}</Typography>} 
              />
              <FormControlLabel 
                control={<Switch checked={settings.isFiveString} onChange={handleSwitch('isFiveString')} color="primary" />} 
                label={<Typography fontWeight="bold">{t.fiveString}</Typography>} 
              />
              <FormControlLabel 
                control={<Switch checked={settings.allowMultipleAttempts} onChange={handleSwitch('allowMultipleAttempts')} color="primary" />} 
                label={<Typography fontWeight="bold">{t.multipleAttempts}</Typography>} 
              />
            </FormGroup>

            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                {t.primaryColor || 'Primary Theme Color'}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mt: 1 }}>
                {colorOptions.map((c) => {
                  const isSelected = settings.primaryColor === c.value;
                  return (
                    <ButtonBase
                      key={c.value}
                      onClick={() => handleColorSelect(c.value)}
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        bgcolor: c.value,
                        border: isSelected ? '3px solid #fff' : '2px solid rgba(255,255,255,0.1)',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        '&:hover': {
                          opacity: 0.9,
                        }
                      }}
                    >
                      {isSelected && <CheckIcon sx={{ color: '#fff', fontSize: 24 }} />}
                    </ButtonBase>
                  );
                })}
              </Box>
            </Box>

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel id="language-label">{t.language}</InputLabel>
              <Select
                labelId="language-label"
                value={settings.language}
                label={t.language}
                onChange={handleLanguageChange}
              >
                <MenuItem value="en">English</MenuItem>
                <MenuItem value="fr">Français</MenuItem>
                <MenuItem value="es">Español</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel id="note-naming-label">{t.noteNaming}</InputLabel>
              <Select
                labelId="note-naming-label"
                value={settings.noteNaming}
                label={t.noteNaming}
                onChange={(e) => updateSettings({ noteNaming: e.target.value as any })}
              >
                <MenuItem value="english">English (C, D, E...)</MenuItem>
                <MenuItem value="latin">Latin (Do, Ré, Mi...)</MenuItem>
              </Select>
            </FormControl>

            <Box sx={{ mt: 2 }}>
              <Typography gutterBottom>{t.timeLimit}: {settings.timeLimit}</Typography>
              <Slider value={settings.timeLimit} min={2} max={15} onChange={handleSlider('timeLimit')} />
            </Box>
            <Box sx={{ mt: 3 }}>
              <Typography gutterBottom>{t.unlockThreshold}: {settings.minUnlockAccuracy}% Accuracy</Typography>
              <Slider value={settings.minUnlockAccuracy} min={50} max={100} step={5} onChange={handleSlider('minUnlockAccuracy')} />
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <FormGroup>
              <FormControlLabel control={<Switch checked={settings.strictOctave} onChange={handleSwitch('strictOctave')} />} label={t.strictOctave} />
              <FormControlLabel control={<Switch checked={settings.showFretNumber} onChange={handleSwitch('showFretNumber')} />} label={t.showFret} />
              <FormControlLabel control={<Switch checked={settings.lockString} onChange={handleSwitch('lockString')} />} label={t.validateString} />
            </FormGroup>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Settings;
