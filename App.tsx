import React, { useState, useMemo, useEffect } from 'react';
// Fix: Use module import and cast to any to resolve missing named exports
import * as ReactRouterDOM from 'react-router-dom';
import {
  ThemeProvider,
  CssBaseline,
  Box,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  IconButton,
  Menu,
  MenuItem,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Tooltip,
  useMediaQuery,
  useTheme,
  alpha,
} from '@mui/material';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import TuneIcon from '@mui/icons-material/Tune';
import SchoolIcon from '@mui/icons-material/School';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import InfoIcon from '@mui/icons-material/Info';
import HomeIcon from '@mui/icons-material/Home';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';

import { getAppTheme } from './theme';
import { useStore } from './state/store';
import { translations } from './localization/translations';
import Landing from './routes/Landing';
import Program from './routes/Program';
import Settings from './routes/Settings';
import Theory from './routes/Theory';
import About from './routes/About';
import Profile from './routes/Profile';
import Tuner from './components/Tuner';
import WelcomeDialog from './components/WelcomeDialog';

// Fix: Extract components/hooks from the casted module object
const { HashRouter: Router, Routes, Route, Link, useLocation, Navigate } = ReactRouterDOM as any;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const RouteTracker = () => {
  const location = useLocation();
  const isInitialLoad = React.useRef(true);

  useEffect(() => {
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }

    const pagePath = `${location.pathname}${location.search}`;
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'page_view', {
        page_path: pagePath,
        page_location: window.location.href,
        page_title: document.title,
      });
    }
  }, [location.pathname, location.search]);

  return null;
};

interface HeaderProps {
  onOpenTuner: () => void;
  onToggleTheme: () => void;
}

const Header: React.FC<HeaderProps> = ({ onOpenTuner, onToggleTheme }) => {
  const { settings } = useStore();
  const t = translations[settings.language].nav;
  const theme = useTheme();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [desktopMenuAnchor, setDesktopMenuAnchor] = useState<null | HTMLElement>(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const isRouteActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const navSections = [
    { label: t.home, path: '/', icon: <HomeIcon fontSize="small" /> },
    { label: t.program, path: '/program', icon: <MenuBookIcon fontSize="small" /> },
    { label: t.theory, path: '/theory', icon: <SchoolIcon fontSize="small" /> },
    { label: t.profile, path: '/profile', icon: <PersonOutlineIcon fontSize="small" /> },
  ];

  // Close menus on route change or breakpoint change
  useEffect(() => {
    setDesktopMenuAnchor(null);
    setMobileDrawerOpen(false);
  }, [location.pathname, isMobile]);

  const settingsActive = isRouteActive('/settings');
  const aboutActive = isRouteActive('/about');
  const isDark = settings.themeMode === 'dark';

  return (
    <>
      <AppBar
        position="sticky"
        color="inherit"
        elevation={0}
        sx={{
          borderBottom: '1px solid',
          borderColor: 'divider',
          backdropFilter: 'blur(10px)',
          bgcolor: isDark ? 'rgba(10, 10, 10, 0.85)' : 'rgba(255, 255, 255, 0.88)',
        }}
      >
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ height: 64, gap: 1 }}>
            {/* Brand Logo */}
            <Typography
              variant="h6"
              component={Link}
              to="/"
              sx={{
                fontWeight: 900,
                letterSpacing: -1,
                textDecoration: 'none',
                color: 'text.primary',
                mr: isMobile ? 'auto' : 3,
                flexShrink: 0,
              }}
            >
              BASS<span style={{ color: theme.palette.primary.main }}>ARENA</span>
            </Typography>

            {!isMobile ? (
              <>
                {/* Top Section Navigation (Desktop) */}
                <Box
                  component="nav"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.75,
                    flexGrow: 1,
                  }}
                >
                  {navSections.map((item) => {
                    const active = isRouteActive(item.path);
                    return (
                      <Button
                        key={item.path}
                        component={Link}
                        to={item.path}
                        startIcon={item.icon}
                        size="small"
                        sx={{
                          px: 1.5,
                          py: 0.8,
                          borderRadius: 2,
                          textTransform: 'none',
                          fontWeight: active ? 800 : 600,
                          color: active ? 'primary.main' : 'text.secondary',
                          bgcolor: active ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                          '&:hover': {
                            bgcolor: active
                              ? alpha(theme.palette.primary.main, 0.16)
                              : alpha(theme.palette.text.primary, 0.06),
                            color: active ? 'primary.main' : 'text.primary',
                          },
                        }}
                      >
                        {item.label}
                      </Button>
                    );
                  })}
                </Box>

                {/* Right Utility Bar (Desktop) */}
                <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center', flexShrink: 0 }}>
                  <Button
                    color="primary"
                    variant="contained"
                    size="small"
                    onClick={onOpenTuner}
                    startIcon={<TuneIcon />}
                    sx={{ fontWeight: 800, borderRadius: 2, textTransform: 'none', mr: 0.5 }}
                  >
                    {t.tuner}
                  </Button>

                  <Tooltip title={isDark ? t.lightMode : t.darkMode}>
                    <Box
                      component="button"
                      type="button"
                      onClick={onToggleTheme}
                      aria-label={isDark ? t.lightMode : t.darkMode}
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 0.25,
                        p: '3px',
                        borderRadius: 99,
                        border: '1px solid',
                        borderColor: 'divider',
                        bgcolor: isDark
                          ? alpha(theme.palette.common.white, 0.05)
                          : alpha(theme.palette.common.black, 0.04),
                        cursor: 'pointer',
                        transition: 'border-color 0.2s, background-color 0.2s',
                        '&:hover': {
                          borderColor: 'primary.main',
                        },
                      }}
                    >
                      <Box
                        sx={{
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: !isDark ? 'background.paper' : 'transparent',
                          color: !isDark ? '#f59e0b' : 'text.disabled',
                          boxShadow: !isDark ? '0 1px 3px rgba(0,0,0,0.16)' : 'none',
                          transition: 'all 0.2s',
                        }}
                      >
                        <LightModeOutlinedIcon sx={{ fontSize: 15 }} />
                      </Box>
                      <Box
                        sx={{
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: isDark ? alpha(theme.palette.primary.main, 0.22) : 'transparent',
                          color: isDark ? '#90caf9' : 'text.disabled',
                          boxShadow: isDark ? '0 1px 3px rgba(0,0,0,0.35)' : 'none',
                          transition: 'all 0.2s',
                        }}
                      >
                        <DarkModeOutlinedIcon sx={{ fontSize: 15 }} />
                      </Box>
                    </Box>
                  </Tooltip>

                  <Divider orientation="vertical" flexItem sx={{ my: 1.5, mx: 0.25 }} />

                  <Tooltip title={t.settings}>
                    <IconButton
                      component={Link}
                      to="/settings"
                      size="small"
                      aria-label={t.settings}
                      sx={{
                        color: settingsActive ? 'primary.main' : 'inherit',
                        bgcolor: settingsActive ? alpha(theme.palette.primary.main, 0.12) : 'transparent',
                      }}
                    >
                      <SettingsOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>

                  <IconButton
                    color="inherit"
                    size="small"
                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => setDesktopMenuAnchor(e.currentTarget)}
                    aria-label="Menu"
                    sx={{
                      color: aboutActive ? 'primary.main' : 'inherit',
                      bgcolor: aboutActive ? alpha(theme.palette.primary.main, 0.12) : 'transparent',
                    }}
                  >
                    <MenuIcon fontSize="small" />
                  </IconButton>

                  <Menu
                    anchorEl={desktopMenuAnchor}
                    open={Boolean(desktopMenuAnchor)}
                    onClose={() => setDesktopMenuAnchor(null)}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                    slotProps={{
                      paper: {
                        sx: {
                          mt: 1,
                          minWidth: 180,
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: 'divider',
                        },
                      },
                    }}
                  >
                    <MenuItem
                      component={Link}
                      to="/settings"
                      selected={settingsActive}
                      onClick={() => setDesktopMenuAnchor(null)}
                      sx={{ fontWeight: settingsActive ? 800 : 600 }}
                    >
                      <SettingsOutlinedIcon sx={{ mr: 1.5, color: settingsActive ? 'primary.main' : 'text.secondary' }} fontSize="small" />
                      {t.settings}
                    </MenuItem>
                    <MenuItem
                      component={Link}
                      to="/about"
                      selected={aboutActive}
                      onClick={() => setDesktopMenuAnchor(null)}
                      sx={{ fontWeight: aboutActive ? 800 : 600 }}
                    >
                      <InfoIcon sx={{ mr: 1.5, color: aboutActive ? 'primary.main' : 'text.secondary' }} fontSize="small" />
                      {t.about}
                    </MenuItem>
                  </Menu>
                </Box>
              </>
            ) : (
              /* Mobile: Everything inside the Burger Menu */
              <IconButton
                color="inherit"
                onClick={() => setMobileDrawerOpen(true)}
                aria-label="Menu"
                edge="end"
              >
                <MenuIcon />
              </IconButton>
            )}
          </Toolbar>
        </Container>
      </AppBar>

      {/* Mobile Drawer containing all sections, tools, settings & about */}
      <Drawer
        anchor="right"
        open={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: 270,
            bgcolor: 'background.paper',
          },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 2,
            height: 64,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 900, letterSpacing: -1 }}>
            BASS<span style={{ color: theme.palette.primary.main }}>ARENA</span>
          </Typography>
          <IconButton onClick={() => setMobileDrawerOpen(false)} size="small" aria-label="Close">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <List sx={{ px: 1, py: 1.5 }}>
          {navSections.map((item) => {
            const active = isRouteActive(item.path);
            return (
              <ListItemButton
                key={item.path}
                component={Link}
                to={item.path}
                selected={active}
                onClick={() => setMobileDrawerOpen(false)}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  color: active ? 'primary.main' : 'text.primary',
                }}
              >
                <ListItemIcon sx={{ minWidth: 38, color: active ? 'primary.main' : 'text.secondary' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{ fontWeight: active ? 800 : 600, fontSize: '0.95rem' }}
                />
              </ListItemButton>
            );
          })}
        </List>

        <Divider />

        <List sx={{ px: 1, py: 1.5 }}>
          <ListItemButton
            onClick={() => {
              setMobileDrawerOpen(false);
              onOpenTuner();
            }}
            sx={{ borderRadius: 2, mb: 0.5 }}
          >
            <ListItemIcon sx={{ minWidth: 38, color: 'primary.main' }}>
              <TuneIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary={t.tuner}
              primaryTypographyProps={{ fontWeight: 700, fontSize: '0.95rem' }}
            />
          </ListItemButton>

          <ListItemButton
            onClick={() => {
              onToggleTheme();
            }}
            sx={{ borderRadius: 2 }}
          >
            <ListItemIcon sx={{ minWidth: 38, color: isDark ? '#f59e0b' : 'text.secondary' }}>
              {isDark ? <LightModeOutlinedIcon fontSize="small" /> : <DarkModeOutlinedIcon fontSize="small" />}
            </ListItemIcon>
            <ListItemText
              primary={isDark ? t.lightMode : t.darkMode}
              primaryTypographyProps={{ fontWeight: 600, fontSize: '0.95rem' }}
            />
          </ListItemButton>
        </List>

        <Divider />

        <List sx={{ px: 1, py: 1.5 }}>
          <ListItemButton
            component={Link}
            to="/settings"
            selected={settingsActive}
            onClick={() => setMobileDrawerOpen(false)}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              color: settingsActive ? 'primary.main' : 'text.primary',
            }}
          >
            <ListItemIcon sx={{ minWidth: 38, color: settingsActive ? 'primary.main' : 'text.secondary' }}>
              <SettingsOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary={t.settings}
              primaryTypographyProps={{ fontWeight: settingsActive ? 800 : 600, fontSize: '0.95rem' }}
            />
          </ListItemButton>

          <ListItemButton
            component={Link}
            to="/about"
            selected={aboutActive}
            onClick={() => setMobileDrawerOpen(false)}
            sx={{
              borderRadius: 2,
              color: aboutActive ? 'primary.main' : 'text.primary',
            }}
          >
            <ListItemIcon sx={{ minWidth: 38, color: aboutActive ? 'primary.main' : 'text.secondary' }}>
              <InfoIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary={t.about}
              primaryTypographyProps={{ fontWeight: aboutActive ? 800 : 600, fontSize: '0.95rem' }}
            />
          </ListItemButton>
        </List>
      </Drawer>
    </>
  );
};

const App: React.FC = () => {
  const [tunerOpen, setTunerOpen] = useState(false);
  const { settings, updateSettings } = useStore();

  // Automatically adjust grey values for contrast if "Grey" is selected
  const effectivePrimaryColor = useMemo(() => {
    if (settings.primaryColor === '#bdbdbd' || settings.primaryColor === '#424242' || settings.primaryColor === '#616161') {
      return settings.themeMode === 'light' ? '#424242' : '#bdbdbd';
    }
    return settings.primaryColor;
  }, [settings.primaryColor, settings.themeMode]);

  const theme = useMemo(() => getAppTheme(settings.themeMode, effectivePrimaryColor), [settings.themeMode, effectivePrimaryColor]);

  const toggleTheme = () => {
    updateSettings({ themeMode: settings.themeMode === 'light' ? 'dark' : 'light' });
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <ScrollToTop />
        <RouteTracker />
        <Box sx={{ pb: 4, minHeight: '100vh', bgcolor: 'background.default', color: 'text.primary' }}>
          <Header onOpenTuner={() => setTunerOpen(true)} onToggleTheme={toggleTheme} />

          <Container maxWidth="lg" sx={{ pt: 3 }}>
            <Routes>
              <Route path="/" element={<Landing />} />

              <Route path="/program" element={<Program />} />
              <Route path="/program/:programId" element={<Program />} />
              <Route path="/program/:programId/day/:day" element={<Program />} />

              <Route path="/training" element={<Navigate to="/profile" replace />} />
              <Route path="/training/:sessionType" element={<Navigate to="/profile" replace />} />

              <Route path="/theory" element={<Theory />} />
              <Route path="/theory/:sectionId" element={<Theory />} />

              <Route path="/profile" element={<Profile />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/about" element={<About />} />
            </Routes>
          </Container>
        </Box>
        <Tuner open={tunerOpen} onClose={() => setTunerOpen(false)} />
        <WelcomeDialog />
      </Router>
    </ThemeProvider>
  );
};

export default App;