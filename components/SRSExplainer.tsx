
import React from 'react';
import { 
  Dialog, DialogTitle, DialogContent, Typography, 
  Button, Box, Stack, Divider, useTheme, alpha 
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import TimerIcon from '@mui/icons-material/Timer';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PsychologyIcon from '@mui/icons-material/Psychology';
import { useStore } from '../state/store';
import { translations } from '../localization/translations';

interface SRSExplainerProps {
  open: boolean;
  onClose: () => void;
}

const SRSExplainer: React.FC<SRSExplainerProps> = ({ open, onClose }) => {
  const { settings } = useStore();
  const t = translations[settings.language].srs;
  const pt = translations[settings.language].program;
  const theme = useTheme();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
        <AutoAwesomeIcon color="primary" />
        <Typography variant="h6" fontWeight="900">{t.title}</Typography>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3}>
          <Typography variant="body2" color="textSecondary" sx={{ lineHeight: 1.7 }}>
            {t.intro}
          </Typography>

          <Box sx={{ p: 2, bgcolor: alpha(theme.palette.primary.main, 0.05), borderRadius: 2, border: '1px solid', borderColor: alpha(theme.palette.primary.main, 0.2) }}>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1.5 }}>
              <TrendingUpIcon color="primary" />
              <Typography variant="subtitle2" fontWeight="800">{t.curveTitle}</Typography>
            </Stack>
            <Typography variant="body2" sx={{ lineHeight: 1.6, mb: 2 }}>
              {t.curveDesc}
            </Typography>
            <Box sx={{ height: 120, width: '100%', display: 'flex', alignItems: 'flex-end', gap: 1, px: 2 }}>
              {[20, 40, 60, 80, 100].map((h, i) => (
                <Box key={i} sx={{ 
                  flex: 1, 
                  height: `${h}%`, 
                  bgcolor: i === 4 ? 'primary.main' : alpha(theme.palette.primary.main, 0.3),
                  borderRadius: '4px 4px 0 0',
                  position: 'relative'
                }}>
                  <Typography variant="caption" sx={{ position: 'absolute', bottom: -20, left: 0, right: 0, textAlign: 'center', fontWeight: 700 }}>
                    L{i+1}
                  </Typography>
                </Box>
              ))}
            </Box>
            <Typography variant="caption" align="center" display="block" sx={{ mt: 3, fontWeight: 700, color: 'text.secondary' }}>
              {pt.srsIntervals}
            </Typography>
          </Box>

          <Stack spacing={1}>
            <Typography variant="subtitle2" fontWeight="800" sx={{ mb: 1 }}>{t.levelsTitle}</Typography>
            <Typography variant="caption" sx={{ display: 'flex', gap: 1 }}><TimerIcon sx={{ fontSize: 14 }} /> {t.l1}</Typography>
            <Typography variant="caption" sx={{ display: 'flex', gap: 1 }}><TimerIcon sx={{ fontSize: 14 }} /> {t.l2}</Typography>
            <Typography variant="caption" sx={{ display: 'flex', gap: 1 }}><TimerIcon sx={{ fontSize: 14 }} /> {t.l3}</Typography>
            <Typography variant="caption" sx={{ display: 'flex', gap: 1 }}><TimerIcon sx={{ fontSize: 14 }} /> {t.l4}</Typography>
            <Typography variant="caption" sx={{ display: 'flex', gap: 1 }}><TimerIcon sx={{ fontSize: 14 }} /> {t.l5}</Typography>
          </Stack>

          <Divider />

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', color: '#ff9800' }}>
            <PsychologyIcon />
            <Typography variant="body2" fontWeight="700">
              {t.gold}
            </Typography>
          </Box>
        </Stack>
      </DialogContent>
      <Box sx={{ p: 3, pt: 1, textAlign: 'center' }}>
        <Button variant="contained" fullWidth onClick={onClose} sx={{ fontWeight: 800 }}>
          Got it!
        </Button>
      </Box>
    </Dialog>
  );
};

export default SRSExplainer;
