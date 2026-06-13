import { createTheme, responsiveFontSizes } from '@mui/material/styles';

let theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#f84464', // Crimson accent
      hover: '#df3551'
    },
    secondary: {
      main: '#10b981' // Emerald success accent
    },
    background: {
      default: '#030712', // Space Midnight Black
      paper: 'rgba(21, 28, 45, 0.45)' // Re-calibrated Glassmorphic Dark Blue-Slate
    },
    text: {
      primary: '#f3f4f6', // Light grey text
      secondary: '#9ca3af' // Muted grey text
    },
    divider: 'rgba(255, 255, 255, 0.08)'
  },
  typography: {
    fontFamily: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: 16,
    h1: {
      fontFamily: '"Outfit", sans-serif',
      fontWeight: 900,
      letterSpacing: '-1.5px'
    },
    h2: {
      fontFamily: '"Outfit", sans-serif',
      fontWeight: 800,
      letterSpacing: '-1px'
    },
    h3: {
      fontFamily: '"Outfit", sans-serif',
      fontWeight: 800,
      letterSpacing: '-0.5px'
    },
    h4: {
      fontFamily: '"Outfit", sans-serif',
      fontWeight: 700
    },
    h5: {
      fontFamily: '"Outfit", sans-serif',
      fontWeight: 700
    },
    h6: {
      fontFamily: '"Outfit", sans-serif',
      fontWeight: 600
    },
    button: {
      textTransform: 'none',
      fontWeight: 700,
      fontSize: '1.05rem'
    }
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarColor: '#2b2f44 #030712',
          '&::-webkit-scrollbar': {
            width: '8px',
            height: '8px'
          },
          '&::-webkit-scrollbar-track': {
            background: '#030712'
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#1f2937',
            borderRadius: '4px',
            border: '2px solid #030712',
            '&:hover': {
              background: '#374151'
            }
          }
        }
      }
    },
    MuiPaper: {
      defaultProps: {
        elevation: 0
      },
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }
      }
    },
    MuiCard: {
      defaultProps: {
        elevation: 0
      },
      styleOverrides: {
        root: {
          borderRadius: 24,
          backgroundColor: 'rgba(21, 28, 45, 0.45)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 15px 35px rgba(0, 0, 0, 0.3)',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.3s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 20px 40px rgba(248, 68, 100, 0.12)',
            borderColor: 'rgba(248, 68, 100, 0.3)'
          }
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          padding: '12px 28px',
          fontSize: '1.05rem',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-1px)'
          },
          '&:active': {
            transform: 'translateY(1px)'
          }
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #f84464 0%, #df3551 100%)',
          boxShadow: '0 4px 14px rgba(248, 68, 100, 0.25)',
          '&:hover': {
            background: 'linear-gradient(135deg, #df3551 0%, #c52943 100%)',
            boxShadow: '0 6px 20px rgba(248, 68, 100, 0.35)',
            transform: 'translateY(-2px)'
          }
        },
        outlinedPrimary: {
          borderColor: 'rgba(248, 68, 100, 0.5)',
          '&:hover': {
            borderColor: '#f84464',
            backgroundColor: 'rgba(248, 68, 100, 0.05)',
            transform: 'translateY(-2px)'
          }
        }
      }
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 14,
            fontSize: '1.05rem',
            transition: 'all 0.2s ease',
            '& fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.08)'
            },
            '&:hover fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.2)'
            },
            '&.Mui-focused fieldset': {
              borderColor: '#f84464',
              boxShadow: '0 0 0 3px rgba(248, 68, 100, 0.12)'
            }
          }
        }
      }
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 20,
          backgroundColor: '#0f121d',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }
      }
    }
  }
});

theme = responsiveFontSizes(theme);

export default theme;
