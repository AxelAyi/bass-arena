
import React from 'react';
import { Box, Typography, Paper, Avatar, Link, IconButton, Divider } from '@mui/material';
import Grid from '@mui/material/Grid2';
import EmailIcon from '@mui/icons-material/Email';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import HandymanIcon from '@mui/icons-material/Handyman';
import FavoriteIcon from '@mui/icons-material/Favorite';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { useStore } from '../state/store';
import { translations } from '../localization/translations';

const About: React.FC = () => {
  const { settings } = useStore();
  const t = translations[settings.language].about;

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', pb: 4 }}>
      <Typography variant="h4" fontWeight="900" gutterBottom align="center" sx={{ letterSpacing: -1, mb: 4 }}>
        {t.title}
      </Typography>

      <Paper sx={{ p: 4, borderRadius: 2, mb: 4 }}>
        <Grid container spacing={4} alignItems="center">
          <Grid size={{ xs: 12, md: 4 }} sx={{ display: 'flex', justifyContent: 'center' }}>
            <Avatar
              alt="Axel A."
              src="https://axelayi.github.io/bass-arena-assets/images/axel-mononeon.jpg"
              sx={{ 
                width: 220, 
                height: 220, 
                filter: 'grayscale(100%) contrast(1.2) brightness(0.9)',
                border: '4px solid',
                borderColor: 'primary.main',
                boxShadow: (theme) => `0 12px 32px ${theme.palette.primary.main}40`,
                objectFit: 'cover'
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 8 }}>
            <Typography variant="h5" fontWeight="800" color="primary" gutterBottom>
              {t.subtitle}
            </Typography>
            <Typography variant="body1" color="textSecondary" paragraph sx={{ lineHeight: 1.7 }}>
              {t.description}
            </Typography>
            <Box sx={{ display: 'flex', gap: 3, mt: 3 }}>
              <Box sx={{ textAlign: 'center' }}>
                <MusicNoteIcon color="primary" sx={{ fontSize: 32 }} />
                <Typography variant="caption" sx={{ display: 'block', fontWeight: 800, mt: 0.5 }}>{t.bassist || 'BASSIST'}</Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <HandymanIcon color="primary" sx={{ fontSize: 32 }} />
                <Typography variant="caption" sx={{ display: 'block', fontWeight: 800, mt: 0.5 }}>{t.coder || 'CODER'}</Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* AI Experimentation Note */}
      <Paper sx={{ p: 4, borderRadius: 2, mb: 4, border: '1px dashed', borderColor: 'primary.main', bgcolor: 'rgba(255, 152, 0, 0.05)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1.5 }}>
          <AutoAwesomeIcon color="primary" />
          <Typography variant="h6" fontWeight="900" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {t.aiExperimentTitle}
          </Typography>
        </Box>
        <Typography variant="body2" color="textSecondary" sx={{ lineHeight: 1.8, fontStyle: 'italic' }}>
          {t.aiExperimentBody}
        </Typography>
      </Paper>

      <Paper sx={{ p: 4, borderRadius: 2, mb: 4, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
        <Typography variant="h6" fontWeight="900" gutterBottom sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
          {t.contact}
        </Typography>
        <Typography variant="body1" sx={{ mb: 3, opacity: 0.9 }}>
          {t.emailLabel}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'inherit', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}>
            <EmailIcon />
          </IconButton>
          <Link 
            href="mailto:axel.indedev@gmail.com" 
            sx={{ 
              color: 'inherit', 
              fontWeight: 800, 
              fontSize: '1.2rem', 
              textDecoration: 'none',
              borderBottom: '2px solid rgba(255,255,255,0.4)',
              '&:hover': { opacity: 0.8, borderBottomColor: '#fff' }
            }}
          >
            axel.indedev@gmail.com
          </Link>
        </Box>
      </Paper>

      <Divider sx={{ mb: 3 }} />
      
      <Box sx={{ textAlign: 'center', opacity: 0.6 }}>
        <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
          {t.footer} <FavoriteIcon sx={{ fontSize: 14, color: 'error.main' }} />
        </Typography>
      </Box>
    </Box>
  );
};

export default About;
