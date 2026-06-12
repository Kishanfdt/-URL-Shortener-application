import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Link
} from '@mui/material';
import { Link as LinkIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

// Signup Page View

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [validationErrors, setValidationErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const errors = {};
    if (!name.trim()) errors.name = 'Name is required';
    
    if (!email.trim()) {
      errors.email = 'Email is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        errors.email = 'Please enter a valid email address';
      }
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters long';
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationErrors({});
    setError('');

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setLoading(true);
    try {
      await signup(name, email, password);
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Signup failed. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="xs">
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', py: 4 }}>
        
        {/* Logo brand */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 4 }}>
          <LinkIcon sx={{ color: 'primary.main', fontSize: 32 }} />
          <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: '-0.8px' }}>
            Link<Box component="span" sx={{ color: 'primary.main' }}>Enhancer</Box>
          </Typography>
        </Box>

        {/* Form container */}
        <Card sx={{ 
          width: '100%', 
          background: 'rgba(17, 24, 30, 0.55)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.35)',
          borderRadius: 4
        }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h5" sx={{ mb: 1, fontWeight: 700, textAlign: 'center' }}>
                Create Account
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
                Sign up to start shortening links
              </Typography>

              {error && (
                <Alert severity="error" sx={{ mb: 3 }} variant="outlined">
                  {error}
                </Alert>
              )}

              {Object.keys(validationErrors).length > 0 && !error && (
                <Alert severity="error" sx={{ mb: 3 }} variant="outlined">
                  <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                    Please fix the following:
                  </Typography>
                  <Box component="ul" sx={{ pl: 2, m: 0 }}>
                    {Object.values(validationErrors).map((msg, i) => (
                      <li key={i}>{msg}</li>
                    ))}
                  </Box>
                </Alert>
              )}

              <Box component="form" onSubmit={handleSubmit}>
                <TextField
                  fullWidth
                  label="Full Name"
                  margin="dense"
                  variant="outlined"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  error={!!validationErrors.name}
                  helperText={validationErrors.name}
                  disabled={loading}
                  required
                />
                
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  margin="dense"
                  variant="outlined"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={!!validationErrors.email}
                  helperText={validationErrors.email}
                  disabled={loading}
                  required
                />
                
                <TextField
                  fullWidth
                  label="Password"
                  type="password"
                  margin="dense"
                  variant="outlined"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={!!validationErrors.password}
                  helperText={validationErrors.password}
                  disabled={loading}
                  required
                />

                <TextField
                  fullWidth
                  label="Confirm Password"
                  type="password"
                  margin="dense"
                  variant="outlined"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  error={!!validationErrors.confirmPassword}
                  helperText={validationErrors.confirmPassword}
                  disabled={loading}
                  required
                />

                <Button
                  fullWidth
                  variant="contained"
                  type="submit"
                  size="large"
                  disabled={loading}
                  sx={{ mt: 3, py: 1.5, backgroundColor: 'primary.main', '&:hover': { backgroundColor: 'primary.hover' } }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign Up'}
                </Button>
              </Box>

              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Already have an account?{' '}
                  <Link component={RouterLink} to="/login" color="primary.main" sx={{ fontWeight: 600, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                    Log In
                  </Link>
                </Typography>
              </Box>

            </CardContent>
          </Card>

        </Box>
      </Container>
  );
};

export default Signup;
