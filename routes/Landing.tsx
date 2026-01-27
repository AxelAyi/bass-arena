import React from 'react';
import { Box, Typography, Button, Container, Stack, Paper, useTheme, alpha, keyframes } from '@mui/material';
import Grid from '@mui/material/Grid2';
import * as ReactRouterDOM from 'react-router-dom';
import MicIcon from '@mui/icons-material/Mic';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import SchoolIcon from '@mui/icons-material/School';
import PlayCircleFilledIcon from '@mui/icons-material/PlayCircleFilled';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import PsychologyIcon from '@mui/icons-material/Psychology';
import KeyboardDoubleArrowDownIcon from '@mui/icons-material/KeyboardDoubleArrowDown';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

import { useStore } from '../state/store';
import { translations } from '../localization/translations';

const { Link } = ReactRouterDOM as any;

const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
`;

const Landing: React.FC = () => {
  const { settings } = useStore();
  const theme = useTheme();
  const t = translations[settings.language].landing;
  const isDarkMode = theme.palette.mode === 'dark';

  const scrollToNext = () => {
    const nextSection = document.getElementById('features');
    if (nextSection) {
      nextSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <Box>
      {/* Hero Section */}
      <Box 
        sx={{ 
          minHeight: '80vh', 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          position: 'relative',
          pb: 10
        }}
      >
        <Box 
          sx={{ 
            position: 'absolute', 
            top: '20%', 
            left: '50%', 
            transform: 'translateX(-50%)', 
            width: '80%', 
            height: '400px', 
            background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.1)} 0%, transparent 70%)`,
            zIndex: -1 
          }} 
        />
        
        <Stack spacing={4} alignItems="center" sx={{ maxWidth: 800 }}>
          <Box 
            sx={{ 
              display: 'inline-flex', 
              px: 2, 
              py: 0.5, 
              borderRadius: 10, 
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              color: 'primary.main',
              fontWeight: 900,
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: 1.5,
              mb: 2,
              animation: `${float} 3s ease-in-out infinite`
            }}
          >
            A Simple Tool for Daily Practice
          </Box>
          <Typography 
            variant="h1" 
            sx={{ 
              fontWeight: 900, 
              fontSize: { xs: '3rem', md: '5rem' }, 
              lineHeight: 1, 
              letterSpacing: -2,
              mb: 2
            }}
          >
            {t.heroTitle}
          </Typography>
          <Typography 
            variant="h6" 
            color="textSecondary" 
            sx={{ 
              maxWidth: 600, 
              lineHeight: 1.6, 
              fontWeight: 400,
              mb: 4
            }}
          >
            {t.heroSubtitle}
          </Typography>
          
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ width: '100%', justifyContent: 'center' }}>
            <Button 
              variant="contained" 
              size="large" 
              component={Link} 
              to="/program"
              startIcon={<PlayCircleFilledIcon />}
              sx={{ 
                px: 6, 
                py: 2, 
                borderRadius: 2, 
                fontSize: '1.1rem',
                fontWeight: 800,
                boxShadow: (theme) => `0 10px 30px ${alpha(theme.palette.primary.main, 0.4)}`
              }}
            >
              {t.ctaPrimary}
            </Button>
            <Button 
              variant="outlined" 
              size="large" 
              onClick={scrollToNext}
              sx={{ px: 4, py: 2, borderRadius: 2, fontWeight: 700 }}
            >
              {t.ctaSecondary}
            </Button>
          </Stack>
        </Stack>

        <Box 
          sx={{ 
            position: 'absolute', 
            bottom: 40, 
            cursor: 'pointer',
            animation: `${float} 2s infinite ease-in-out`
          }}
          onClick={scrollToNext}
        >
          <KeyboardDoubleArrowDownIcon color="disabled" />
        </Box>
      </Box>

      {/* Feature Grid */}
      <Container maxWidth="lg" id="features" sx={{ py: 10 }}>
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 3, 
                height: '100%', 
                borderRadius: 4, 
                bgcolor: alpha(theme.palette.primary.main, 0.03),
                border: '1px solid',
                borderColor: 'divider'
              }}
            >
              <MicIcon color="primary" sx={{ fontSize: 40, mb: 2 }} />
              <Typography variant="h6" fontWeight="900" gutterBottom>{t.feature1Title}</Typography>
              <Typography variant="body2" color="textSecondary" sx={{ lineHeight: 1.6 }}>
                {t.feature1Desc}
              </Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 3, 
                height: '100%', 
                borderRadius: 4, 
                bgcolor: alpha(theme.palette.primary.main, 0.03),
                border: '1px solid',
                borderColor: 'divider'
              }}
            >
              <MenuBookIcon color="primary" sx={{ fontSize: 40, mb: 2 }} />
              <Typography variant="h6" fontWeight="900" gutterBottom>{t.feature2Title}</Typography>
              <Typography variant="body2" color="textSecondary" sx={{ lineHeight: 1.6 }}>
                {t.feature2Desc}
              </Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 3, 
                height: '100%', 
                borderRadius: 4, 
                bgcolor: alpha(theme.palette.primary.main, 0.03),
                border: '1px solid',
                borderColor: 'divider'
              }}
            >
              <SchoolIcon color="primary" sx={{ fontSize: 40, mb: 2 }} />
              <Typography variant="h6" fontWeight="900" gutterBottom>{t.feature3Title}</Typography>
              <Typography variant="body2" color="textSecondary" sx={{ lineHeight: 1.6 }}>
                {t.feature3Desc}
              </Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 3, 
                height: '100%', 
                borderRadius: 4, 
                bgcolor: alpha(theme.palette.primary.main, 0.03),
                border: '1px solid',
                borderColor: theme.palette.primary.main,
                boxShadow: `0 0 15px ${alpha(theme.palette.primary.main, 0.1)}`
              }}
            >
              <AutoAwesomeIcon color="primary" sx={{ fontSize: 40, mb: 2 }} />
              <Typography variant="h6" fontWeight="900" gutterBottom>{t.feature4Title}</Typography>
              <Typography variant="body2" color="textSecondary" sx={{ lineHeight: 1.6 }}>
                {t.feature4Desc}
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Container>

      {/* SRS Science Section */}
      <Box sx={{ py: 12, position: 'relative', overflow: 'hidden' }}>
        <Container maxWidth="md">
          <Paper 
            elevation={0} 
            sx={{ 
              p: { xs: 4, md: 8 }, 
              borderRadius: 6, 
              border: '1px solid', 
              borderColor: 'divider',
              bgcolor: 'background.paper',
              position: 'relative'
            }}
          >
            <Box 
              sx={{ 
                position: 'absolute', 
                top: -20, 
                right: 40, 
                px: 2, 
                py: 1, 
                bgcolor: 'primary.main', 
                color: 'primary.contrastText', 
                borderRadius: 2,
                fontWeight: 900,
                fontSize: '0.75rem',
                letterSpacing: 1,
                textTransform: 'uppercase',
                boxShadow: theme.shadows[4]
              }}
            >
              Methodology
            </Box>
            
            <Stack spacing={4} alignItems="center" textAlign="center">
              <TrendingUpIcon color="primary" sx={{ fontSize: 48 }} />
              <Box>
                <Typography variant="h4" fontWeight="900" gutterBottom sx={{ letterSpacing: -1 }}>
                  {t.srsSectionTitle}
                </Typography>
                <Typography variant="subtitle1" color="primary" fontWeight="800" sx={{ mb: 3, textTransform: 'uppercase', letterSpacing: 1.5 }}>
                  {t.srsSectionSubtitle}
                </Typography>
                <Typography variant="body1" color="textSecondary" sx={{ lineHeight: 1.8, fontSize: '1.1rem' }}>
                  {t.srsSectionDesc}
                </Typography>
              </Box>
              
              <Box sx={{ width: '100%', pt: 4 }}>
                 <Grid container spacing={2} justifyContent="center" alignItems="flex-end" sx={{ height: 100 }}>
                    {[30, 50, 70, 90, 100].map((h, i) => (
                      <Grid key={i} size={{ xs: 2 }}>
                        <Box sx={{ 
                          height: `${h}%`, 
                          bgcolor: alpha(theme.palette.primary.main, (i + 1) * 0.2), 
                          borderRadius: '4px 4px 0 0' 
                        }} />
                      </Grid>
                    ))}
                 </Grid>
                 <Typography variant="caption" color="textSecondary" sx={{ mt: 2, display: 'block', fontWeight: 700 }}>
                   The Forgetting Curve vs. Spaced Repetition Intervals
                 </Typography>
              </Box>
            </Stack>
          </Paper>
        </Container>
      </Box>

      {/* How it works */}
      <Box sx={{ bgcolor: isDarkMode ? alpha('#fff', 0.02) : alpha('#000', 0.02), py: 12 }}>
        <Container maxWidth="md">
          <Typography variant="h4" align="center" fontWeight="900" gutterBottom sx={{ mb: 8 }}>
            How it works
          </Typography>
          <Stack spacing={6}>
            <Box sx={{ display: 'flex', gap: 4, alignItems: 'flex-start' }}>
              <Typography variant="h2" color="primary" sx={{ fontWeight: 900, opacity: 0.2, lineHeight: 1 }}>01</Typography>
              <Box>
                <Typography variant="h5" fontWeight="900" gutterBottom>{t.step1Title}</Typography>
                <Typography variant="body1" color="textSecondary">{t.step1Desc}</Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 4, alignItems: 'flex-start' }}>
              <Typography variant="h2" color="primary" sx={{ fontWeight: 900, opacity: 0.2, lineHeight: 1 }}>02</Typography>
              <Box>
                <Typography variant="h5" fontWeight="900" gutterBottom>{t.step2Title}</Typography>
                <Typography variant="body1" color="textSecondary">{t.step2Desc}</Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 4, alignItems: 'flex-start' }}>
              <Typography variant="h2" color="primary" sx={{ fontWeight: 900, opacity: 0.2, lineHeight: 1 }}>03</Typography>
              <Box>
                <Typography variant="h5" fontWeight="900" gutterBottom>{t.step3Title}</Typography>
                <Typography variant="body1" color="textSecondary">{t.step3Desc}</Typography>
              </Box>
            </Box>
          </Stack>
        </Container>
      </Box>

      {/* Curriculum Preview */}
      <Container maxWidth="lg" sx={{ py: 12 }}>
        <Typography variant="h4" align="center" fontWeight="900" gutterBottom sx={{ mb: 8 }}>
          {t.curriculumTitle}
        </Typography>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper variant="outlined" sx={{ p: 4, borderRadius: 4, height: '100%' }}>
              <Typography variant="overline" color="primary" fontWeight="bold">Days 1-10</Typography>
              <Typography variant="h6" fontWeight="900" gutterBottom>{t.phase1}</Typography>
              <Typography variant="body2" color="textSecondary">{t.phase1Desc}</Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper variant="outlined" sx={{ p: 4, borderRadius: 4, height: '100%' }}>
              <Typography variant="overline" color="primary" fontWeight="bold">Days 11-20</Typography>
              <Typography variant="h6" fontWeight="900" gutterBottom>{t.phase2}</Typography>
              <Typography variant="body2" color="textSecondary">{t.phase2Desc}</Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper variant="outlined" sx={{ p: 4, borderRadius: 4, height: '100%' }}>
              <Typography variant="overline" color="primary" fontWeight="bold">Days 21-30</Typography>
              <Typography variant="h6" fontWeight="900" gutterBottom>{t.phase3}</Typography>
              <Typography variant="body2" color="textSecondary">{t.phase3Desc}</Typography>
            </Paper>
          </Grid>
        </Grid>
      </Container>

      {/* Ready CTA */}
      <Box sx={{ py: 15, textAlign: 'center' }}>
        <Container maxWidth="sm">
          <PsychologyIcon color="primary" sx={{ fontSize: 60, mb: 4 }} />
          <Typography variant="h4" fontWeight="900" gutterBottom>{t.readyTitle}</Typography>
          <Typography variant="body1" color="textSecondary" sx={{ mb: 6 }}>{t.readyDesc}</Typography>
          <Button 
            variant="contained" 
            size="large" 
            component={Link} 
            to="/program"
            sx={{ px: 10, py: 2, borderRadius: 2, fontWeight: 900, fontSize: '1.1rem' }}
          >
            {t.ctaPrimary}
          </Button>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ py: 6, borderTop: '1px solid', borderColor: 'divider', textAlign: 'center', opacity: 0.6 }}>
        <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
          BassArena 2026 - Master your instrument.
        </Typography>
      </Box>
    </Box>
  );
};

export default Landing;