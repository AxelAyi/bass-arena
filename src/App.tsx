
import React from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box, AppBar, Toolbar, Typography, Button, Container, BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import SettingsIcon from '@mui/icons-material/Settings';

import { theme } from './theme';
import Program from './routes/Program';
import FreeTraining from './routes/FreeTraining';
import Settings from './routes/Settings';

const Navigation = () => {
  const location = useLocation();
  const [value, setValue] = React.useState(0);

  React.useEffect(() => {
    if (location.pathname === '/') setValue(0);
    else if (location.pathname === '/training') setValue(1);
    else if (location.pathname === '/settings') setValue(2);
  }, [location]);

  return (
    <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000 }} elevation={3}>
      <BottomNavigation
        showLabels
        value={value}
        onChange={(_, newValue) => setValue(newValue)}
      >
        <BottomNavigationAction label="Program" icon={<MenuBookIcon />} component={Link} to="/" />
        <BottomNavigationAction label="Training" icon={<FitnessCenterIcon />} component={Link} to="/training" />
        <BottomNavigationAction label="Settings" icon={<SettingsIcon />} component={Link} to="/settings" />
      </BottomNavigation>
    </Paper>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ pb: 10, minHeight: '100vh', bgcolor: 'background.default' }}>
          <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <Toolbar>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold', letterSpacing: 1 }}>
                BASS<span style={{ color: theme.palette.primary.main }}>MASTER</span>
              </Typography>
              <Button color="inherit" component={Link} to="/settings">
                <SettingsIcon sx={{ mr: 1 }} />
                Setup
              </Button>
            </Toolbar>
          </AppBar>

          <Container maxWidth="xl" sx={{ mt: 2 }}>
            <Routes>
              <Route path="/" element={<Program />} />
              <Route path="/training" element={<FreeTraining />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </Container>

          <Navigation />
        </Box>
      </Router>
    </ThemeProvider>
  );
};

export default App;
