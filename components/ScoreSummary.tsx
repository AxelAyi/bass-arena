
import React from 'react';
import { Box, Typography, Button, Paper, Divider, Chip } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { useStore } from '../state/store';
import { translations } from '../localization/translations';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import TimerIcon from '@mui/icons-material/Timer';
import StarIcon from '@mui/icons-material/Star';
import ReplayIcon from '@mui/icons-material/Replay';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import HomeIcon from '@mui/icons-material/Home';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

interface ScoreSummaryProps {
  result: any;
  onClose: () => void;
  onReplay?: () => void;
  onNext?: { label: string; action: () => void };
}

const ScoreSummary: React.FC<ScoreSummaryProps> = ({ result, onClose, onReplay, onNext }) => {
  const { settings } = useStore();
  const t = translations[settings.language].summary;

  const failedNotes = result.failedNotes || [];
  const sessionTitle = result.title || '';

  return (
    <Paper sx={{ p: 3, borderRadius: 2, maxWidth: 500, mx: 'auto', mt: 3, border: '1px solid rgba(255,255,255,0.05)' }}>
      <Typography variant="caption" align="center" color="primary" sx={{ display: 'block', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.5, mb: 0.5 }}>
        {t.title}
      </Typography>
      <Typography variant="h5" align="center" gutterBottom sx={{ fontWeight: 900, mb: 2 }}>
        {sessionTitle}
      </Typography>
      
      <Grid container spacing={2} sx={{ my: 2 }}>
        <Grid size={{ xs: 4 }} sx={{ textAlign: 'center' }}>
          <StarIcon color="primary" sx={{ fontSize: 24, mb: 0.5 }} />
          <Typography variant="h6" fontWeight="bold">{result.score}</Typography>
          <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>{t.totalScore}</Typography>
        </Grid>
        <Grid size={{ xs: 4 }} sx={{ textAlign: 'center' }}>
          <CheckCircleOutlineIcon color="success" sx={{ fontSize: 24, mb: 0.5 }} />
          <Typography variant="h6" fontWeight="bold">{result.accuracy.toFixed(0)}%</Typography>
          <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>{t.accuracy}</Typography>
        </Grid>
        <Grid size={{ xs: 4 }} sx={{ textAlign: 'center' }}>
          <TimerIcon color="secondary" sx={{ fontSize: 24, mb: 0.5 }} />
          <Typography variant="h6" fontWeight="bold">{result.avgTime.toFixed(1)}s</Typography>
          <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>{t.avgSpeed}</Typography>
        </Grid>
      </Grid>

      {failedNotes.length > 0 && (
        <Box sx={{ mb: 3, p: 1.5, bgcolor: 'rgba(255, 87, 34, 0.05)', borderRadius: 1.5, border: '1px solid rgba(255, 87, 34, 0.2)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
            <WarningAmberIcon color="error" sx={{ fontSize: 16 }} />
            <Typography variant="caption" color="error.main" fontWeight="bold">{t.failures || 'Review Notes'}</Typography>
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {failedNotes.map((note: string, idx: number) => (
              <Chip key={idx} label={note} size="small" color="error" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
            ))}
          </Box>
        </Box>
      )}

      <Divider sx={{ mb: 3, opacity: 0.1 }} />

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {onNext && (
          <Button variant="contained" fullWidth onClick={onNext.action} startIcon={<SkipNextIcon />} sx={{ py: 1 }}>
            {t.next}: {onNext.label}
          </Button>
        )}
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          {onReplay && (
            <Button variant="outlined" fullWidth onClick={onReplay} startIcon={<ReplayIcon />} size="small">
              {t.replay}
            </Button>
          )}
          <Button variant="outlined" color="inherit" fullWidth onClick={onClose} startIcon={<HomeIcon />} size="small" sx={{ opacity: 0.7 }}>
            {t.return}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default ScoreSummary;
