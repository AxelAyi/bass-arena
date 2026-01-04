
import React, { useState, useMemo } from 'react';
// Fix: Use module import and cast to any to resolve missing named exports
import * as ReactRouterDOM from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box, AppBar, Toolbar, Typography, Button, Container, BottomNavigation, BottomNavigationAction, Paper, IconButton, Menu, MenuItem, useMediaQuery } from '@mui/material';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import SettingsIcon from '@mui/icons-material/Settings';
import TuneIcon from '@mui/icons-material/Tune';
import SchoolIcon from '@mui/icons-material/School';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import MenuIcon from '@mui/icons-material/Menu';
import InfoIcon from '@mui/icons-material/Info';

import { getAppTheme } from './theme';
import { useStore } from './state/store';
import { translations } from './localization/translations';
import Program from './routes/Program';
import FreeTraining from './routes/FreeTraining';
import Settings from './routes/Settings';
import Theory from './routes/Theory';
import About from './routes/About';
import Tuner from './components/Tuner';

// Fix: Extract components/hooks from the casted module object
const { HashRouter: Router, Routes, Route, Link, useLocation } = ReactRouterDOM as any;

const Navigation = () => {
  const { settings } = useStore();
  const t = translations[settings.language].nav;
  const location = useLocation();
  const [value, setValue] = React.useState(0);

  React.useEffect(() => {
    if (location.pathname === '/') setValue(0);
    else if (location.pathname === '/training') setValue(1);
    else if (location.pathname === '/theory') setValue(2);
    else if (location.pathname === '/settings') setValue(3);
    else if (location.pathname === '/about') setValue(4);
  }, [location]);

  return (
    <Paper 
      sx={{ 
        position: 'fixed', 
        bottom: 0, 
        left: 0, 
        right: 0, 
        zIndex: 1000,
        borderRadius: 0,
        borderTop: '1px solid',
        borderColor: 'divider'
      }} 
      elevation={0}
    >
      <BottomNavigation
        showLabels
        value={value}
        onChange={(_, newValue) => setValue(newValue)}
        sx={{ height: 64 }}
      >
        <BottomNavigationAction label={t.program} icon={<MenuBookIcon />} component={Link} to="/" />
        <BottomNavigationAction label={t.training} icon={<FitnessCenterIcon />} component={Link} to="/training" />
        <BottomNavigationAction label={t.theory} icon={<SchoolIcon />} component={Link} to="/theory" />
        <BottomNavigationAction label={t.settings} icon={<SettingsIcon />} component={Link} to="/settings" />
        <BottomNavigationAction label={t.about} icon={<InfoIcon />} component={Link} to="/about" />
      </BottomNavigation>
    </Paper>
  );
};

const App: React.FC = () => {
  const [tunerOpen, setTunerOpen] = useState(false);
  const { settings, updateSettings } = useStore();
  const t = translations[settings.language].nav;
  const isMobile = useMediaQuery('(max-width:600px)');

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const openMenu = Boolean(anchorEl);

  const theme = useMemo(() => getAppTheme(settings.themeMode, settings.primaryColor), [settings.themeMode, settings.primaryColor]);

  const toggleTheme = () => {
    updateSettings({ themeMode: settings.themeMode === 'light' ? 'dark' : 'light' });
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ pb: 10, minHeight: '100vh', bgcolor: 'background.default', color: 'text.primary' }}>
          <AppBar 
            position="sticky" 
            color="inherit" 
            elevation={0} 
            sx={{ 
              borderBottom: '1px solid',
              borderColor: 'divider',
              backdropFilter: 'blur(8px)',
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(10, 10, 10, 0.8)' : 'rgba(255, 255, 255, 0.8)'
            }}
          >
            <Toolbar sx={{ height: 64 }}>
              <Typography 
                variant="h6" 
                component={Link} 
                to="/"
                sx={{ 
                  flexGrow: 1, 
                  fontWeight: 900, 
                  letterSpacing: -1, 
                  textDecoration: 'none', 
                  color: 'text.primary' 
                }}
              >
                BASS<span style={{ color: theme.palette.primary.main }}>ARENA</span>
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                {!isMobile ? (
                  <>
                    <IconButton onClick={toggleTheme} color="inherit" size="small">
                      {settings.themeMode === 'dark' ? <Brightness7Icon fontSize="small" /> : <Brightness4Icon fontSize="small" />}
                    </IconButton>
                    <Button 
                      color="primary" 
                      variant="contained" 
                      size="small" 
                      onClick={() => setTunerOpen(true)}
                      startIcon={<TuneIcon />}
                    >
                      {t.tuner}
                    </Button>
                  </>
                ) : (
                  <>
                    <IconButton onClick={toggleTheme} color="inherit" size="small">
                      {settings.themeMode === 'dark' ? <Brightness7Icon fontSize="small" /> : <Brightness4Icon fontSize="small" />}
                    </IconButton>
                    <IconButton color="inherit" onClick={handleMenuOpen} size="small">
                      <MenuIcon fontSize="small" />
                    </IconButton>
                    <Menu
                      anchorEl={anchorEl}
                      open={openMenu}
                      onClose={handleMenuClose}
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                    >
                      <MenuItem onClick={() => { setTunerOpen(true); handleMenuClose(); }}>
                        <TuneIcon sx={{ mr: 1.5 }} fontSize="small" /> {t.tuner}
                      </MenuItem>
                      <MenuItem component={Link} to="/settings" onClick={handleMenuClose}>
                        <SettingsIcon sx={{ mr: 1.5 }} fontSize="small" /> {t.settings}
                      </MenuItem>
                      <MenuItem component={Link} to="/about" onClick={handleMenuClose}>
                        <InfoIcon sx={{ mr: 1.5 }} fontSize="small" /> {t.about}
                      </MenuItem>
                    </Menu>
                  </>
                )}
              </Box>
            </Toolbar>
          </AppBar>

          <Container maxWidth="lg" sx={{ pt: 3 }}>
            <Routes>
              <Route path="/" element={<Program />} />
              <Route path="/training" element={<FreeTraining />} />
              <Route path="/theory" element={<Theory />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/about" element={<About />} />
            </Routes>
          </Container>

          <Navigation />
        </Box>
        <Tuner open={tunerOpen} onClose={() => setTunerOpen(false)} />
      </Router>
    </ThemeProvider>
  );
};

export default App;
