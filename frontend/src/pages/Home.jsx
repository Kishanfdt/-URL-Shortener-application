import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  InputAdornment,
  CircularProgress,
  Paper,
  Snackbar,
  Alert,
  Divider,
  Link,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import {
  Link as LinkIcon,
  ContentCopy,
  Check,
  AddLink,
  OpenInNew,
  QrCode as QrCodeIcon,
  BarChart,
  Security as SecurityIcon,
  FlashOn,
  AutoAwesome as MagicIcon,
  Star,
  ExpandMore as ExpandMoreIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

// Landing Page View

const Home = () => {
  const [originalUrl, setOriginalUrl] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [loading, setLoading] = useState(false);
  const [inputError, setInputError] = useState('');
  const [expiryError, setExpiryError] = useState('');
  
  // Success states for guest links
  const [newUrlData, setNewUrlData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [safetyWarning, setSafetyWarning] = useState(null);
  const [copiedTextType, setCopiedTextType] = useState(null);
  
  // Safety Bypass State
  const [confirmSafetyOpen, setConfirmSafetyOpen] = useState(false);
  const [safetyScanResult, setSafetyScanResult] = useState(null);
  
  // Toasts
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastSeverity, setToastSeverity] = useState('success');

  const { user } = useAuth();
  const navigate = useNavigate();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState('');

  const handleToolClick = (toolName, activeTab) => {
    if (user) {
      navigate('/dashboard', { state: { activeTab } });
    } else {
      setSelectedTool(toolName);
      setAuthDialogOpen(true);
    }
  };

  const showToast = (msg, severity = 'success') => {
    setToastMsg(msg);
    setToastSeverity(severity);
    setToastOpen(true);
  };

  // Client URL Validation
  const validateUrl = (url) => {
    if (!url || !url.trim()) {
      return 'Destination URL is required';
    }
    let urlToCheck = url.trim();
    if (!/^https?:\/\//i.test(urlToCheck)) {
      urlToCheck = 'http://' + urlToCheck;
    }
    const urlRegex = /^(https?:\/\/)?(www\.)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/[a-zA-Z0-9-._~:/?#[\]@!$&'()*+,;=]*)?$/;
    if (!urlRegex.test(urlToCheck)) {
      return 'Please enter a valid URL';
    }
    return '';
  };

  const handleGuestShorten = async (e) => {
    e.preventDefault();
    setInputError('');
    setExpiryError('');
    setSafetyWarning(null);
    setNewUrlData(null);

    const validationMsg = validateUrl(originalUrl);
    if (validationMsg) {
      setInputError(validationMsg);
      return;
    }

    if (expiresAt) {
      const expiryDate = new Date(expiresAt);
      if (isNaN(expiryDate.getTime())) {
        setExpiryError('Please enter a valid expiration date');
        return;
      } else if (expiryDate <= new Date()) {
        setExpiryError('Expiration date must be in the future');
        return;
      }
    }

    setLoading(true);
    try {
      const scanRes = await api.post('/urls/scan-safety', { originalUrl });
      const safety = scanRes.data.safety;

      if (safety.riskScore >= 50) {
        setSafetyScanResult(safety);
        setConfirmSafetyOpen(true);
        setLoading(false);
        return;
      }

      await createGuestUrlRequest(false);
    } catch (err) {
      handleGuestError(err);
    }
  };

  const handleConfirmBypass = async () => {
    setConfirmSafetyOpen(false);
    setLoading(true);
    try {
      await createGuestUrlRequest(true);
    } catch (err) {
      handleGuestError(err);
    }
  };

  const createGuestUrlRequest = async (bypassSafety) => {
    const response = await api.post('/urls/guest', { originalUrl, expiresAt: expiresAt || undefined, bypassSafety });
    setNewUrlData(response.data.url);
    setOriginalUrl('');
    setExpiresAt('');
    showToast('Url shortened successfully!');
    setLoading(false);
  };

  const handleGuestError = (err) => {
    console.error(err);
    if (err.response && err.response.data && err.response.data.isUnsafe) {
      setSafetyWarning({
        originalUrl,
        riskScore: err.response.data.safetyInfo?.riskScore || 0,
        status: err.response.data.safetyInfo?.status || 'unsafe',
        warning: err.response.data.safetyInfo?.warning || 'URL is marked as high-risk or malicious.'
      });
      showToast('URL creation blocked: Safety threat detected.', 'error');
    } else {
      showToast('Failed to shorten URL. Try again later.', 'error');
    }
    setLoading(false);
  };

  const handleCopyText = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedTextType(type);
      showToast('Copied to clipboard!');
      setTimeout(() => setCopiedTextType(null), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyLink = async () => {
    if (!newUrlData) return;
    try {
      await navigator.clipboard.writeText(newUrlData.shortUrl);
      setCopied(true);
      showToast('Copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownloadQr = async () => {
    if (!newUrlData) return;
    try {
      const response = await fetch(newUrlData.qrCodeUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${newUrlData.shortCode}-qr.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      showToast('QR code downloaded!');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Navbar */}
      <Box sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)', backgroundColor: 'rgba(11, 14, 26, 0.6)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 100 }}>
          <Container maxWidth="lg">
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, textDecoration: 'none', color: 'text.primary' }}>
                <LinkIcon sx={{ color: 'primary.main', fontSize: 30 }} />
                <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: '-0.8px' }}>
                  Link<Box component="span" sx={{ color: 'primary.main' }}>Enhancer</Box>
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 2 }}>
                {user ? (
                  <Button variant="contained" component={RouterLink} to="/dashboard">
                    Go to Dashboard
                  </Button>
                ) : (
                  <>
                    <Button variant="text" color="inherit" component={RouterLink} to="/login">
                      Log In
                    </Button>
                    <Button variant="contained" component={RouterLink} to="/signup">
                      Get Started Free
                    </Button>
                  </>
                )}
              </Box>
            </Box>
          </Container>
        </Box>

        {/* Hero Section */}
        <Box sx={{
          position: 'relative',
          py: { xs: 10, md: 16 },
          textAlign: 'center',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'radial-gradient(circle at 50% -20%, rgba(248, 68, 100, 0.12) 0%, transparent 60%)'
        }}>
          {/* Neon decorative circles */}
          <Box sx={{
            position: 'absolute',
            top: '20%',
            left: '10%',
            width: '300px',
            height: '300px',
            background: 'radial-gradient(circle, rgba(79, 70, 229, 0.06) 0%, rgba(79, 70, 229, 0) 70%)',
            pointerEvents: 'none',
            zIndex: 0
          }} />
          <Box sx={{
            position: 'absolute',
            bottom: '10%',
            right: '10%',
            width: '400px',
            height: '400px',
            background: 'radial-gradient(circle, rgba(248, 68, 100, 0.05) 0%, rgba(248, 68, 100, 0) 70%)',
            pointerEvents: 'none',
            zIndex: 0
          }} />

          <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
            <Typography variant="h2" sx={{ fontWeight: 900, mb: 2, letterSpacing: '-1.5px', fontSize: { xs: '2.5rem', md: '3.75rem' } }}>
              Elevate Your <Box component="span" className="text-gradient-primary">Link Experience</Box>
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 6, fontWeight: 500, maxW: 650, mx: 'auto', px: 2 }}>
              Shorten links, generate instant custom QR codes, and monitor visitor analytics in real-time with our sleek URL manager.
            </Typography>

            {/* Tool Portal Grid (ilovepdf/qtext style) */}
            <Grid container spacing={2} sx={{ mb: 6, textAlign: 'left', maxWidth: 800, mx: 'auto' }}>
              <Grid item xs={12} sm={4}>
                <Card sx={{ 
                  cursor: 'pointer',
                  height: '100%', 
                  background: 'rgba(21, 28, 45, 0.55)', 
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    borderColor: 'primary.main',
                    boxShadow: '0 10px 25px rgba(248, 68, 100, 0.15)'
                  }
                }} onClick={() => {
                  document.getElementById('shortener-card')?.scrollIntoView({ behavior: 'smooth' });
                }}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                      <LinkIcon color="primary" />
                      <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Shorten URL</Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      Collapse long URLs into clean, compact shares instantly. (Free Guest Tool)
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={4}>
                <Card sx={{ 
                  cursor: 'pointer',
                  height: '100%', 
                  background: 'rgba(21, 28, 45, 0.55)', 
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    borderColor: 'secondary.main',
                    boxShadow: '0 10px 25px rgba(16, 185, 129, 0.15)'
                  }
                }} onClick={() => handleToolClick('AI CTR Predictor', 1)}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                      <MagicIcon sx={{ color: 'secondary.main' }} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>AI CTR Predictor</Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      Optimize copy headline titles & calculate estimated conversion counts.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={4}>
                <Card sx={{ 
                  cursor: 'pointer',
                  height: '100%', 
                  background: 'rgba(21, 28, 45, 0.55)', 
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    borderColor: '#818cf8',
                    boxShadow: '0 10px 25px rgba(129, 140, 248, 0.15)'
                  }
                }} onClick={() => handleToolClick('Branded QR codes', 1)}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                      <QrCodeIcon sx={{ color: '#818cf8' }} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Branded QRs</Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      Generate and customize high-resolution QR codes vector prints instantly.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Card sx={{ 
                  cursor: 'pointer',
                  height: '100%', 
                  background: 'rgba(21, 28, 45, 0.55)', 
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    borderColor: 'primary.main',
                    boxShadow: '0 10px 25px rgba(248, 68, 100, 0.15)'
                  }
                }} onClick={() => handleToolClick('Real-time Analytics', 2)}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                      <BarChart color="primary" />
                      <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Real-time Analytics</Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      Track browser engines, device types, geolocations, and visitor logs in high fidelity.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Card sx={{ 
                  cursor: 'pointer',
                  height: '100%', 
                  background: 'rgba(21, 28, 45, 0.55)', 
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    borderColor: '#f59e0b',
                    boxShadow: '0 10px 25px rgba(245, 158, 11, 0.15)'
                  }
                }} onClick={() => handleToolClick('Custom Alias Mapping', 1)}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                      <AddLink sx={{ color: '#f59e0b' }} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Branded Slugs</Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      Map clean, custom back-half paths to replace random alphanumeric hashes.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Shortener Container */}
            <Card id="shortener-card" sx={{
              maxWidth: 750,
              mx: 'auto',
              p: { xs: 3, md: 4 },
              backgroundColor: 'rgba(17, 24, 30, 0.55)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 4,
              boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
              textAlign: 'left',
              mb: 4,
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 25px 60px rgba(248, 68, 100, 0.08)',
                borderColor: 'rgba(248, 68, 100, 0.2)'
              }
            }}>
              {safetyWarning && (
                <Alert 
                  severity="error" 
                  variant="outlined" 
                  onClose={() => setSafetyWarning(null)} 
                  sx={{ mb: 3, borderColor: '#f84464', backgroundColor: 'rgba(248, 68, 100, 0.05)', textAlign: 'left' }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1, color: '#f84464' }}>
                    <WarningIcon /> Security Threat Blocked
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    The URL <strong>{safetyWarning.originalUrl}</strong> was flagged as unsafe (Threat Status: <strong>{safetyWarning.status.toUpperCase()}</strong> | Threat Score: <strong>{safetyWarning.riskScore}%</strong>).
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: 'text.secondary', fontWeight: 'bold' }}>
                    Reason: {safetyWarning.warning}
                  </Typography>
                </Alert>
              )}

              <Box component="form" onSubmit={handleGuestShorten} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Grid container spacing={2}>
                  {/* Destination Long URL Field */}
                  <Grid item xs={12} md={8}>
                    <TextField
                      fullWidth
                      variant="outlined"
                      placeholder="Paste your long link here..."
                      value={originalUrl}
                      onChange={(e) => {
                        setOriginalUrl(e.target.value);
                        if (inputError) setInputError('');
                      }}
                      error={!!inputError}
                      helperText={inputError}
                      disabled={loading}
                      required
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: '#0b0e1a'
                        }
                      }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LinkIcon sx={{ color: 'text.secondary' }} />
                          </InputAdornment>
                        )
                      }}
                    />
                  </Grid>

                  {/* Expiration Date picker field */}
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Expiry Date & Time (Optional)"
                      type="datetime-local"
                      variant="outlined"
                      value={expiresAt}
                      onChange={(e) => {
                        setExpiresAt(e.target.value);
                        if (expiryError) setExpiryError('');
                      }}
                      error={!!expiryError}
                      helperText={expiryError}
                      disabled={loading}
                      InputLabelProps={{
                        shrink: true,
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: '#0b0e1a'
                        }
                      }}
                    />
                  </Grid>
                </Grid>

                <Button
                  variant="contained"
                  type="submit"
                  size="large"
                  disabled={loading}
                  sx={{
                    py: 1.5,
                    height: 52,
                    backgroundColor: 'primary.main',
                    '&:hover': { backgroundColor: 'primary.hover' }
                  }}
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <AddLink />}
                >
                  Shorten Link
                </Button>
              </Box>

              {/* Guest Success Panel */}
              {newUrlData && (
                <Box>
                  <Paper variant="outlined" sx={{ mt: 3, p: 3, backgroundColor: '#0b0e1a', border: '1px dashed #f84464', textAlign: 'left' }}>
                    <Typography variant="subtitle2" color="primary.main" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Check fontSize="small" /> Link shortened successfully!
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', flexDirection: { xs: 'column', sm: 'row' } }}>
                      <Box sx={{ backgroundColor: 'white', p: 0.8, borderRadius: 2, border: '1px solid #222538' }}>
                        <Box component="img" src={newUrlData.qrCodeUrl} alt="QR Code" sx={{ width: 90, height: 90, display: 'block' }} />
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 200 }}>
                        <Typography
                          variant="h6"
                          component="a"
                          href={newUrlData.shortUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          color="primary.main"
                          sx={{ textDecoration: 'none', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
                        >
                          {newUrlData.shortUrl}
                          <OpenInNew fontSize="inherit" sx={{ fontSize: 13 }} />
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: 350, mt: 0.5, mb: 2 }}>
                          Original: {newUrlData.originalUrl}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1.5 }}>
                          <Button
                            variant="contained"
                            onClick={handleCopyLink}
                            color={copied ? 'success' : 'primary'}
                            size="small"
                            startIcon={copied ? <Check /> : <ContentCopy />}
                          >
                            {copied ? 'Copied!' : 'Copy'}
                          </Button>
                          <Button
                            variant="outlined"
                            onClick={handleDownloadQr}
                            color="inherit"
                            size="small"
                            sx={{ borderColor: '#334155' }}
                            startIcon={<QrCodeIcon />}
                          >
                            Download QR
                          </Button>
                        </Box>
                      </Box>
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2, fontStyle: 'italic' }}>
                      * Guest links are created anonymously. To monitor analytics, track click history, or set custom aliases, please <Link component={RouterLink} to="/signup" color="primary.main">create a free account</Link>.
                    </Typography>
                  </Paper>

                  {/* Safety warning if riskScore > 0 */}
                  {newUrlData.safetyInfo && newUrlData.safetyInfo.riskScore > 0 && (
                    <Alert 
                      severity={newUrlData.safetyInfo.riskScore >= 30 ? "warning" : "info"} 
                      variant="outlined" 
                      sx={{ mt: 2, borderColor: newUrlData.safetyInfo.riskScore >= 30 ? 'warning.main' : 'info.main' }}
                    >
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                        <SecurityIcon fontSize="small" /> Safety Scan Details
                      </Typography>
                      <Typography variant="body2">
                        Threat Level: <strong>{newUrlData.safetyInfo.status.toUpperCase()}</strong> (Risk Score: {newUrlData.safetyInfo.riskScore}%).
                        {newUrlData.safetyInfo.warning && ` Note: ${newUrlData.safetyInfo.warning}`}
                      </Typography>
                    </Alert>
                  )}

                  {/* AI Marketing Suite */}
                  {newUrlData.aiMetadata && (
                    <Box sx={{ mt: 3, textAlign: 'left' }}>
                      <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <MagicIcon color="primary" /> AI Marketing Suite
                      </Typography>

                      {/* Summary & Insights */}
                      <Accordion sx={{ backgroundColor: 'background.paper', border: '1px solid #222538', mb: 1, '&:before': { display: 'none' } }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'text.secondary' }} />}>
                          <Typography sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                            💡 Webpage Summary & Insights
                          </Typography>
                        </AccordionSummary>
                        <AccordionDetails sx={{ borderTop: '1px solid #222538', p: 3 }}>
                          {newUrlData.aiMetadata.headline && (
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700, display: 'block', mb: 0.5 }}>
                                Headline
                              </Typography>
                              <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                                {newUrlData.aiMetadata.headline}
                              </Typography>
                            </Box>
                          )}
                          {newUrlData.aiMetadata.summary && (
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700, display: 'block', mb: 0.5 }}>
                                Summary
                              </Typography>
                              <Typography variant="body2">
                                {newUrlData.aiMetadata.summary}
                              </Typography>
                            </Box>
                          )}
                          {newUrlData.aiMetadata.keyPoints && newUrlData.aiMetadata.keyPoints.length > 0 && (
                            <Box>
                              <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700, display: 'block', mb: 0.5 }}>
                                Key Takeaways
                              </Typography>
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                {newUrlData.aiMetadata.keyPoints.map((point, idx) => (
                                  <Typography key={idx} variant="body2" sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                    <span style={{ color: '#f84464' }}>&bull;</span> {point}
                                  </Typography>
                                ))}
                              </Box>
                            </Box>
                          )}
                        </AccordionDetails>
                      </Accordion>

                      {/* Social Caption */}
                      {newUrlData.aiMetadata.socialCaption && (
                        <Accordion sx={{ backgroundColor: 'background.paper', border: '1px solid #222538', mb: 1, '&:before': { display: 'none' } }}>
                          <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'text.secondary' }} />}>
                            <Typography sx={{ fontWeight: 700 }}>
                              📱 Social Caption
                            </Typography>
                          </AccordionSummary>
                          <AccordionDetails sx={{ borderTop: '1px solid #222538', p: 3 }}>
                            <Box sx={{ p: 2, backgroundColor: 'background.default', borderRadius: 2, border: '1px solid #222538', mb: 2 }}>
                              <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                                {newUrlData.aiMetadata.socialCaption}
                              </Typography>
                            </Box>
                            <Button
                              variant="outlined"
                              color="primary"
                              size="small"
                              onClick={() => handleCopyText(newUrlData.aiMetadata.socialCaption, 'social')}
                              startIcon={copiedTextType === 'social' ? <Check /> : <ContentCopy />}
                            >
                              {copiedTextType === 'social' ? 'Copied!' : 'Copy Caption'}
                            </Button>
                          </AccordionDetails>
                        </Accordion>
                      )}

                      {/* LinkedIn Post */}
                      {newUrlData.aiMetadata.linkedinPost && (
                        <Accordion sx={{ backgroundColor: 'background.paper', border: '1px solid #222538', mb: 1, '&:before': { display: 'none' } }}>
                          <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'text.secondary' }} />}>
                            <Typography sx={{ fontWeight: 700 }}>
                              🔗 LinkedIn Post
                            </Typography>
                          </AccordionSummary>
                          <AccordionDetails sx={{ borderTop: '1px solid #222538', p: 3 }}>
                            <Box sx={{ p: 2, backgroundColor: 'background.default', borderRadius: 2, border: '1px solid #222538', mb: 2 }}>
                              <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                                {newUrlData.aiMetadata.linkedinPost}
                              </Typography>
                            </Box>
                            <Button
                              variant="outlined"
                              color="primary"
                              size="small"
                              onClick={() => handleCopyText(newUrlData.aiMetadata.linkedinPost, 'linkedin')}
                              startIcon={copiedTextType === 'linkedin' ? <Check /> : <ContentCopy />}
                            >
                              {copiedTextType === 'linkedin' ? 'Copied!' : 'Copy LinkedIn Post'}
                            </Button>
                          </AccordionDetails>
                        </Accordion>
                      )}

                      {/* Twitter / X Post */}
                      {newUrlData.aiMetadata.twitterPost && (
                        <Accordion sx={{ backgroundColor: 'background.paper', border: '1px solid #222538', mb: 1, '&:before': { display: 'none' } }}>
                          <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'text.secondary' }} />}>
                            <Typography sx={{ fontWeight: 700 }}>
                              🐦 Twitter / X Post
                            </Typography>
                          </AccordionSummary>
                          <AccordionDetails sx={{ borderTop: '1px solid #222538', p: 3 }}>
                            <Box sx={{ p: 2, backgroundColor: 'background.default', borderRadius: 2, border: '1px solid #222538', mb: 2 }}>
                              <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                                {newUrlData.aiMetadata.twitterPost}
                              </Typography>
                            </Box>
                            <Button
                              variant="outlined"
                              color="primary"
                              size="small"
                              onClick={() => handleCopyText(newUrlData.aiMetadata.twitterPost, 'twitter')}
                              startIcon={copiedTextType === 'twitter' ? <Check /> : <ContentCopy />}
                            >
                              {copiedTextType === 'twitter' ? 'Copied!' : 'Copy Tweet'}
                            </Button>
                          </AccordionDetails>
                        </Accordion>
                      )}
                    </Box>
                  )}
                </Box>
              )}
            </Card>

            <Typography variant="body2" color="text.secondary">
              By shortening, you agree to our Terms of Service. No credit card required.
            </Typography>
          </Container>
        </Box>

        {/* Features Grid */}
        <Container maxWidth="lg" sx={{ py: 10 }}>
          <Typography variant="h4" align="center" sx={{ fontWeight: 800, mb: 1 }}>
            Enterprise Features, Simplified
          </Typography>
          <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 8 }}>
            Everything you need to capture clicks and optimize sharing performance.
          </Typography>

          <Grid container spacing={4}>
            {/* Feature 1 */}
            <Grid item xs={12} sm={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent sx={{ p: 4, textAlign: 'center' }}>
                  <Box sx={{ backgroundColor: 'rgba(248, 68, 100, 0.1)', display: 'inline-flex', p: 2, borderRadius: '50%', mb: 3 }}>
                    <FlashOn sx={{ color: 'primary.main', fontSize: 32 }} />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
                    Instant Redirection
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    Resolve shortcodes to target destinations with sub-100ms response times using local caching pipelines.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Feature 2 */}
            <Grid item xs={12} sm={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent sx={{ p: 4, textAlign: 'center' }}>
                  <Box sx={{ backgroundColor: 'rgba(248, 68, 100, 0.1)', display: 'inline-flex', p: 2, borderRadius: '50%', mb: 3 }}>
                    <BarChart sx={{ color: 'primary.main', fontSize: 32 }} />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
                    Advanced Analytics
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    Monitor visitor browser engines, device scopes, operating systems, and approximate geolocations in real-time.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Feature 3 */}
            <Grid item xs={12} sm={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent sx={{ p: 4, textAlign: 'center' }}>
                  <Box sx={{ backgroundColor: 'rgba(248, 68, 100, 0.1)', display: 'inline-flex', p: 2, borderRadius: '50%', mb: 3 }}>
                    <MagicIcon sx={{ color: 'primary.main', fontSize: 32 }} />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
                    Custom Aliases & QRs
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    Create custom back-half paths to replace random hashes, and download unique QR Codes instantly.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>


        {/* Footer */}
        <Box sx={{ py: 6, backgroundColor: '#0b0e1a', borderTop: '1px solid #222538', textAlign: 'center', mt: 'auto' }}>
          <Container maxWidth="lg">
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1, mb: 3 }}>
              <LinkIcon sx={{ color: 'primary.main', fontSize: 24 }} />
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Link<Box component="span" sx={{ color: 'primary.main' }}>Enhancer</Box>
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              &copy; {new Date().getFullYear()} LinkEnhancer Inc. All rights reserved. Made with &hearts; for developers.
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, flexWrap: 'wrap' }}>
              <Link component={RouterLink} to="/login" color="text.secondary" sx={{ fontSize: '0.85rem', textDecoration: 'none', '&:hover': { color: 'primary.main' } }}>Log In</Link>
              <Link component={RouterLink} to="/signup" color="text.secondary" sx={{ fontSize: '0.85rem', textDecoration: 'none', '&:hover': { color: 'primary.main' } }}>Sign Up</Link>
              <Link href="#" color="text.secondary" sx={{ fontSize: '0.85rem', textDecoration: 'none', '&:hover': { color: 'primary.main' } }}>Privacy Policy</Link>
              <Link href="#" color="text.secondary" sx={{ fontSize: '0.85rem', textDecoration: 'none', '&:hover': { color: 'primary.main' } }}>Terms of Service</Link>
            </Box>
          </Container>
        </Box>

        {/* Guest Lock Auth Dialog */}
        <Dialog open={authDialogOpen} onClose={() => setAuthDialogOpen(false)} maxWidth="xs" fullWidth>
          <DialogTitle sx={{ fontWeight: 800, textAlign: 'center', pt: 3 }}>
            🔒 Unlock {selectedTool}
          </DialogTitle>
          <DialogContent sx={{ p: 3, pb: 1, textAlign: 'center' }}>
            <DialogContentText sx={{ color: 'text.secondary', mb: 2 }}>
              To use the <strong>{selectedTool}</strong> tool, custom QR downloads, and detailed visitor analytics, please log in or create a free account.
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 4, justifyContent: 'center', gap: 1.5 }}>
            <Button onClick={() => setAuthDialogOpen(false)} color="inherit">
              Cancel
            </Button>
            <Button variant="outlined" component={RouterLink} to="/login" color="primary">
              Log In
            </Button>
            <Button variant="contained" component={RouterLink} to="/signup" color="primary">
              Sign Up Free
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar Toast */}
        <Snackbar
          open={toastOpen}
          autoHideDuration={4000}
          onClose={() => setToastOpen(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={() => setToastOpen(false)} severity={toastSeverity} variant="filled">
            {toastMsg}
          </Alert>
        </Snackbar>

        {/* Safety Confirmation Dialog */}
        <Dialog
          open={confirmSafetyOpen}
          onClose={() => setConfirmSafetyOpen(false)}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
          PaperProps={{
            sx: {
              backgroundColor: 'background.paper',
              border: '1px solid #f84464',
              borderRadius: 2
            }
          }}
        >
          <DialogTitle id="alert-dialog-title" sx={{ color: '#f84464', display: 'flex', alignItems: 'center', gap: 1, fontWeight: 'bold' }}>
            <WarningIcon /> Unsafe URL Detected
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description" sx={{ color: 'text.primary', mb: 2 }}>
              The URL you are trying to shorten has been flagged as potentially malicious.
            </DialogContentText>
            {safetyScanResult && (
              <Alert severity="error" variant="outlined" sx={{ borderColor: '#f84464', backgroundColor: 'rgba(248, 68, 100, 0.05)' }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#f84464' }}>
                  Risk Score: {safetyScanResult.riskScore}%
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {safetyScanResult.warning}
                </Typography>
              </Alert>
            )}
            <DialogContentText sx={{ color: 'text.secondary', mt: 2, fontSize: '0.9rem' }}>
              Are you sure you want to shorten this link? Users who click on it will be shown a warning page before being redirected.
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ p: 2, pt: 0 }}>
            <Button onClick={() => setConfirmSafetyOpen(false)} color="inherit" sx={{ fontWeight: 'bold' }}>
              Cancel
            </Button>
            <Button onClick={handleConfirmBypass} variant="contained" sx={{ backgroundColor: '#f84464', color: 'white', '&:hover': { backgroundColor: '#e11d48' }, fontWeight: 'bold' }} autoFocus>
              Proceed Anyway
            </Button>
          </DialogActions>
        </Dialog>

      </Box>
  );
};

export default Home;
