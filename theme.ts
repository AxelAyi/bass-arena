
import { createTheme } from '@mui/material/styles';

export const getAppTheme = (mode: 'light' | 'dark', primaryColor: string) => createTheme({
  palette: {
    mode,
    primary: {
      main: primaryColor,
    },
    secondary: {
      main: '#9c27b0',
    },
    background: {
      default: mode === 'dark' ? '#0a0a0a' : '#f8f9fa',
      paper: mode === 'dark' ? '#141414' : '#ffffff',
    },
    divider: mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
  },
  shape: {
    borderRadius: 8, // Reduced from 16
  },
  shadows: [
    'none',
    '0px 1px 3px rgba(0,0,0,0.05)',
    '0px 2px 5px rgba(0,0,0,0.05)',
    '0px 4px 10px rgba(0,0,0,0.08)',
    '0px 8px 16px rgba(0,0,0,0.1)',
    ...Array(20).fill('none'),
  ] as any,
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 800,
      letterSpacing: '-0.02em',
    },
    h5: {
      fontWeight: 700,
    },
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
          padding: '6px 16px', // Reduced padding
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.05)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          transition: 'transform 0.15s ease-in-out, box-shadow 0.15s ease-in-out',
          '&:hover': {
            transform: 'translateY(-2px)', // Subtler hover
            boxShadow: '0px 8px 16px rgba(0,0,0,0.1)',
          },
        },
      },
    },
  },
});
