import React from 'react';
import { 
  Dialog, DialogTitle, DialogContent, Typography, 
  Button, Box, Paper, Stack, alpha, useTheme 
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import SettingsInputComponentIcon from '@mui/icons-material/SettingsInputComponent';
import { useStore } from '../state/store';
import { translations } from '../localization/translations';

const WelcomeDialog: React.FC = () => {
  const { settings, updateSettings } = useStore();
  const theme = useTheme();
  const t = translations[settings.language].welcome;

  const handleClose = () => {
    updateSettings({ hasSeenWelcome: true });
  };

  return (
    <Dialog 
      open={!settings.hasSeenWelcome} 
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3, p: 1 }
      }}
    >
      <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
        <Box sx={{ 
          display: 'inline-flex', 
          p: 2, 
          borderRadius: '50%', 
          bgcolor: alpha(theme.palette.primary.main, 0.1), 
          mb: 2 
        }}>
          <InfoIcon color="primary" sx={{ fontSize: 32 }} />
        </Box>
        <Typography variant="h5" fontWeight="900" sx={{ letterSpacing: -0.5 }}>
          {t.title}
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3}>
          <Typography variant="body2" color="textSecondary" align="center">
            {t.description}
          </Typography>

          <Paper 
            elevation={0} 
            sx={{ 
              p: 2, 
              bgcolor: alpha(theme.palette.primary.main, 0.05),
              border: '1px solid',
              borderColor: alpha(theme.palette.primary.main, 0.2),
              borderRadius: 2
            }}
          >
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
              <SettingsInputComponentIcon color="primary" />
              <Box>
                <Typography variant="subtitle2" fontWeight="800" color="primary" gutterBottom>
                  {t.tip}
                </Typography>
                <Typography variant="body2" sx={{ lineHeight: 1.5 }}>
                  {t.action}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Stack>
      </DialogContent>

      <Box sx={{ p: 3, pt: 1 }}>
        <Button 
          variant="contained" 
          fullWidth 
          size="large" 
          onClick={handleClose}
          sx={{ 
            py: 1.5, 
            borderRadius: 2,
            fontWeight: 800,
            boxShadow: theme.shadows[4]
          }}
        >
          {t.cta}
        </Button>
      </Box>
    </Dialog>
  );
};

export default WelcomeDialog;