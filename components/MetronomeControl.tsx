import React from 'react';
// Added Paper to resolve "Cannot find name 'Paper'" error
import { Box, Typography, Slider, Switch, FormControlLabel, Select, MenuItem, FormControl, InputLabel, Stack, IconButton, Paper } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { useStore, MetronomeSound } from '../state/store';
import { translations } from '../localization/translations';

interface MetronomeControlProps {
  compact?: boolean;
}

const MetronomeControl: React.FC<MetronomeControlProps> = ({ compact = false }) => {
  const { settings, updateSettings } = useStore();
  const t = translations[settings.language].metronome;

  const handleBpmChange = (_: any, value: number | number[]) => {
    updateSettings({ metronomeBpm: value as number });
  };

  const handleVolumeChange = (_: any, value: number | number[]) => {
    updateSettings({ metronomeVolume: value as number });
  };

  const handleToggle = () => {
    updateSettings({ metronomeEnabled: !settings.metronomeEnabled });
  };

  const adjustBpm = (delta: number) => {
    const newVal = Math.max(30, Math.min(250, settings.metronomeBpm + delta));
    updateSettings({ metronomeBpm: newVal });
  };

  if (compact) {
    return (
      <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, bgcolor: 'background.default', border: '1px solid divider' }}>
        <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton size="small" onClick={handleToggle} color={settings.metronomeEnabled ? "primary" : "default"}>
              {settings.metronomeEnabled ? <PauseIcon /> : <PlayArrowIcon />}
            </IconButton>
            <Typography variant="caption" fontWeight="bold">{t.title}</Typography>
          </Box>
          
          <Stack direction="row" spacing={1} alignItems="center">
            <IconButton size="small" onClick={() => adjustBpm(-1)}><RemoveIcon fontSize="small" /></IconButton>
            <Typography variant="body2" fontWeight="900" sx={{ minWidth: 40, textAlign: 'center' }}>
              {settings.metronomeBpm} <Typography variant="caption" sx={{ fontWeight: 400 }}>{t.bpm}</Typography>
            </Typography>
            <IconButton size="small" onClick={() => adjustBpm(1)}><AddIcon fontSize="small" /></IconButton>
          </Stack>

          <Box sx={{ width: 100 }}>
             <Slider 
                value={settings.metronomeVolume} 
                min={0} max={1} step={0.05} 
                onChange={handleVolumeChange}
                size="small"
              />
          </Box>
        </Stack>
      </Paper>
    );
  }

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom fontWeight="bold" sx={{ textTransform: 'uppercase', color: 'text.secondary', display: 'block', mb: 2 }}>
        {t.title}
      </Typography>
      
      <Stack spacing={3}>
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" fontWeight="bold">{t.bpm}</Typography>
            <Typography variant="body2" fontWeight="bold" color="primary">{settings.metronomeBpm}</Typography>
          </Box>
          <Slider value={settings.metronomeBpm} min={30} max={250} onChange={handleBpmChange} />
        </Box>

        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" fontWeight="bold">{t.volume}</Typography>
          </Box>
          <Slider value={settings.metronomeVolume} min={0} max={1} step={0.05} onChange={handleVolumeChange} />
        </Box>

        <Stack direction="row" spacing={2}>
           <FormControl fullWidth size="small">
            <InputLabel>{t.sound}</InputLabel>
            <Select
              value={settings.metronomeSound}
              label={t.sound}
              onChange={(e) => updateSettings({ metronomeSound: e.target.value as MetronomeSound })}
            >
              <MenuItem value="beep">{t.beep}</MenuItem>
              <MenuItem value="tick">{t.tick}</MenuItem>
              <MenuItem value="wood">{t.wood}</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth size="small">
            <InputLabel>{t.timeSignature}</InputLabel>
            <Select
              value={settings.metronomeBeatsPerMeasure}
              label={t.timeSignature}
              onChange={(e) => updateSettings({ metronomeBeatsPerMeasure: e.target.value as number })}
            >
              <MenuItem value={2}>2/4</MenuItem>
              <MenuItem value={3}>3/4</MenuItem>
              <MenuItem value={4}>4/4</MenuItem>
              <MenuItem value={5}>5/4</MenuItem>
              <MenuItem value={6}>6/8</MenuItem>
            </Select>
          </FormControl>
        </Stack>

        <FormControlLabel 
          control={<Switch checked={settings.metronomeEnabled} onChange={handleToggle} color="primary" />} 
          label={<Typography variant="body2" fontWeight="bold">{settings.metronomeEnabled ? t.enabled : t.disabled}</Typography>} 
        />
      </Stack>
    </Box>
  );
};

export default MetronomeControl;