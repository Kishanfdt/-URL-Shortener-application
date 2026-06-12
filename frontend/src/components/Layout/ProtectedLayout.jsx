import React from 'react';
import { Outlet, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
} from '@mui/material';
import { ExitToApp, Link as LinkIcon } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

// Keep theme consistent with Dashboard
// Layout Component

const ProtectedLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      
      {/* Floating Capsule Navigation AppBar */}
      <AppBar position="sticky" elevation={0} sx={{ 
        backgroundColor: 'transparent',
        backgroundImage: 'none',
        border: 'none',
        top: 0,
        zIndex: 1100,
        pt: 2,
        pb: 1
      }}>
        <Container maxWidth="lg">
          <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            px: { xs: 2.5, sm: 4 },
            py: 1.5,
            borderRadius: '20px',
            backgroundColor: 'rgba(21, 28, 45, 0.65)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.35)'
          }}>
            {/* Logo / Brand Name */}
            <Box component={RouterLink} to="/dashboard" sx={{ display: 'flex', alignItems: 'center', gap: 1, textDecoration: 'none', color: 'text.primary' }}>
              <LinkIcon sx={{ color: 'primary.main', fontSize: 28 }} />
              <Typography variant="h6" sx={{ fontWeight: 900, letterSpacing: '-0.8px' }}>
                Link<Box component="span" sx={{ color: 'primary.main' }}>Enhancer</Box>
              </Typography>
            </Box>

            {/* User Identity Profile Control */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {user && (
                <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' }, fontWeight: 500 }}>
                  Hello, <Box component="span" sx={{ color: 'primary.main', fontWeight: 600 }}>{user.name}</Box>
                </Typography>
              )}
              
              <Button
                variant="outlined"
                color="inherit"
                size="small"
                onClick={handleLogout}
                startIcon={<ExitToApp />}
                sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', '&:hover': { borderColor: 'error.main', color: 'error.main' } }}
              >
                Log Out
              </Button>
            </Box>
          </Box>
        </Container>
      </AppBar>

        {/* Main Content Box */}
        <Box sx={{ flex: 1, py: 2 }}>
          <Outlet />
        </Box>

      </Box>
  );
};

export default ProtectedLayout;
