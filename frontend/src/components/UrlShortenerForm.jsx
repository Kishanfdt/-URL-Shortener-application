import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  InputAdornment,
  CircularProgress,
  Snackbar,
  Alert,
  Paper,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText
} from '@mui/material';
import {
  Link as LinkIcon,
  ContentCopy,
  Check,
  AddLink,
  OpenInNew,
  QrCode as QrCodeIcon,
  ExpandMore as ExpandMoreIcon,
  AutoAwesome as MagicIcon,
  Warning as WarningIcon,
  Security as SecurityIcon
} from '@mui/icons-material';
import api from '../services/api';

/**
 * Reusable URL Shortening Form Component
 * @param {Function} onUrlCreated - Callback fired when a new shortened link is successfully created: (newUrl) => void
 */
const UrlShortenerForm = ({ onUrlCreated }) => {
  const [originalUrl, setOriginalUrl] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  
  // Success tracking states for the newly created link
  const [newUrlData, setNewUrlData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [safetyWarning, setSafetyWarning] = useState(null);
  const [copiedTextType, setCopiedTextType] = useState(null);
  
  // Safety Bypass State
  const [confirmSafetyOpen, setConfirmSafetyOpen] = useState(false);
  const [safetyScanResult, setSafetyScanResult] = useState(null);
  
  // Toast notifications
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastSeverity, setToastSeverity] = useState('success');

  // Show status popup alerts
  const showToast = (msg, severity = 'success') => {
    setToastMsg(msg);
    setToastSeverity(severity);
    setToastOpen(true);
  };

  // Client-side form validation
  const validateForm = () => {
    const errors = {};
    
    // 1. Original URL Validation
    if (!originalUrl || !originalUrl.trim()) {
      errors.originalUrl = 'Destination URL is required';
    } else {
      let urlToCheck = originalUrl.trim();
      if (!/^https?:\/\//i.test(urlToCheck)) {
        urlToCheck = 'http://' + urlToCheck;
      }
      const urlRegex = /^(https?:\/\/)?(www\.)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/[a-zA-Z0-9-._~:/?#[\]@!$&'()*+,;=]*)?$/;
      if (!urlRegex.test(urlToCheck)) {
        errors.originalUrl = 'Please enter a valid URL (e.g., https://example.com)';
      }
    }

    // 2. Custom Alias Validation (optional)
    if (customAlias && customAlias.trim() !== '') {
      const trimmedAlias = customAlias.trim();
      const aliasRegex = /^[a-zA-Z0-9-_]+$/;
      if (!aliasRegex.test(trimmedAlias)) {
        errors.customAlias = 'Alias must contain only letters, numbers, dashes (-), and underscores (_)';
      } else if (trimmedAlias.length < 3 || trimmedAlias.length > 30) {
        errors.customAlias = 'Alias must be between 3 and 30 characters';
      }
    }

    // 3. Expiration Date Validation (optional)
    if (expiresAt) {
      const expiryDate = new Date(expiresAt);
      if (isNaN(expiryDate.getTime())) {
        errors.expiresAt = 'Please enter a valid expiration date';
      } else if (expiryDate <= new Date()) {
        errors.expiresAt = 'Expiration date must be in the future';
      }
    }

    return errors;
  };

  // Submit link creation form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});
    setNewUrlData(null);

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setLoading(true);
    setSafetyWarning(null);
    setNewUrlData(null);
    
    try {
      // 1. Pre-scan the URL for safety
      const scanRes = await api.post('/urls/scan-safety', { originalUrl });
      const safety = scanRes.data.safety;
      
      if (safety.riskScore >= 50) {
        // High risk detected, show confirm modal
        setSafetyScanResult(safety);
        setConfirmSafetyOpen(true);
        setLoading(false);
        return;
      }
      
      // If safe, proceed with creation
      await createUrlRequest(false);
    } catch (error) {
      handleApiError(error);
    }
  };

  const handleConfirmBypass = async () => {
    setConfirmSafetyOpen(false);
    setLoading(true);
    try {
      await createUrlRequest(true);
    } catch (error) {
      handleApiError(error);
    }
  };

  const createUrlRequest = async (bypassSafety) => {
    const response = await api.post('/urls', { 
      originalUrl,
      customAlias: customAlias.trim() || undefined,
      expiresAt: expiresAt || undefined,
      bypassSafety
    });
    const createdLink = response.data.url;
    
    setNewUrlData(createdLink);
    setOriginalUrl('');
    setCustomAlias('');
    setExpiresAt('');
    showToast('Link shortened successfully!');
    
    if (onUrlCreated) {
      onUrlCreated(createdLink);
    }
    setLoading(false);
  };

  const handleApiError = (error) => {
    console.error(error);
    if (error.response && error.response.data) {
      if (error.response.data.isUnsafe) {
        setSafetyWarning({
          originalUrl,
          riskScore: error.response.data.safetyInfo?.riskScore || 0,
          status: error.response.data.safetyInfo?.status || 'unsafe',
          warning: error.response.data.safetyInfo?.warning || 'URL is marked as high-risk or malicious.'
        });
        showToast('URL creation blocked: Safety threat detected.', 'error');
      } else if (error.response.data.errors) {
        setFormErrors(error.response.data.errors);
      } else if (error.response.data.message) {
        const errMsg = error.response.data.message;
        if (errMsg.toLowerCase().includes('alias')) {
          setFormErrors({ customAlias: errMsg });
        } else {
          showToast(errMsg, 'error');
        }
      }
    } else {
      showToast('Failed to create short link.', 'error');
    }
    setLoading(false);
  };

  // Clipboard copy action for the newly created link
  const handleCopyNewLink = async () => {
    if (!newUrlData) return;
    try {
      await navigator.clipboard.writeText(newUrlData.shortUrl);
      setCopied(true);
      showToast('Copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
      showToast('Failed to copy link.', 'error');
    }
  };

  // Clipboard copy action for specific AI marketing texts
  const handleCopyText = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedTextType(type);
      showToast('Copied to clipboard!');
      setTimeout(() => setCopiedTextType(null), 2000);
    } catch (err) {
      console.error(err);
      showToast('Failed to copy to clipboard', 'error');
    }
  };

  // QR Code direct file download
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
      showToast('QR code downloaded successfully!');
    } catch (err) {
      console.error(err);
      showToast('Failed to download QR code.', 'error');
    }
  };

  return (
    <Box>
      {/* Shortener Card */}
      <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
        <CardContent sx={{ p: 4 }}>
          {safetyWarning && (
            <Alert 
              severity="error" 
              variant="outlined" 
              onClose={() => setSafetyWarning(null)} 
              sx={{ mb: 3, borderColor: '#f84464', backgroundColor: 'rgba(248, 68, 100, 0.05)' }}
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

          <Typography variant="h5" sx={{ mb: 1, fontWeight: 700 }}>
            Shorten a long URL
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Paste your destination link below. Optionally set a custom alias path.
          </Typography>

          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Grid container spacing={2}>
              {/* Target URL field */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Destination URL"
                  variant="outlined"
                  placeholder="https://example.com/some/very/long/destination/url"
                  value={originalUrl}
                  onChange={(e) => {
                    setOriginalUrl(e.target.value);
                    if (formErrors.originalUrl) setFormErrors(prev => ({ ...prev, originalUrl: '' }));
                  }}
                  error={!!formErrors.originalUrl}
                  helperText={formErrors.originalUrl}
                  disabled={loading}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LinkIcon sx={{ color: 'text.secondary' }} />
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>

              {/* Optional Custom Alias field */}
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Custom Alias (Optional)"
                  variant="outlined"
                  placeholder="my-link-name"
                  value={customAlias}
                  onChange={(e) => {
                    setCustomAlias(e.target.value);
                    if (formErrors.customAlias) setFormErrors(prev => ({ ...prev, customAlias: '' }));
                  }}
                  error={!!formErrors.customAlias}
                  helperText={formErrors.customAlias || 'Letters, numbers, dashes, underscores'}
                  disabled={loading}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        /
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>

              {/* Optional Expiration Date field */}
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Expiry Date & Time (Optional)"
                  type="datetime-local"
                  variant="outlined"
                  value={expiresAt}
                  onChange={(e) => {
                    setExpiresAt(e.target.value);
                    if (formErrors.expiresAt) setFormErrors(prev => ({ ...prev, expiresAt: '' }));
                  }}
                  error={!!formErrors.expiresAt}
                  helperText={formErrors.expiresAt || 'Link will expire after this time'}
                  disabled={loading}
                  InputLabelProps={{
                    shrink: true,
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
                py: 1.6,
                fontWeight: 'bold',
                backgroundColor: 'primary.main',
                '&:hover': { backgroundColor: 'primary.hover' },
                alignSelf: { xs: 'stretch', sm: 'flex-start' },
                minWidth: 180
              }}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <AddLink />}
            >
              {loading ? 'Shortening...' : 'Shorten Link'}
            </Button>
          </Box>

          {/* Success Panel showing newly created link details */}
          {newUrlData && (
            <Box>
              <Paper variant="outlined" sx={{ mt: 4, p: 3, backgroundColor: 'background.default', border: '1px dashed #f84464' }}>
                <Typography variant="subtitle2" color="primary.main" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Check fontSize="small" /> Your link is ready!
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', flexDirection: { xs: 'column', sm: 'row' } }}>
                  
                  {/* QR Code Image */}
                  <Box sx={{ backgroundColor: 'white', p: 1, borderRadius: 2, display: 'flex', border: '1px solid #222538' }}>
                    <Box component="img" src={newUrlData.qrCodeUrl} alt="QR Code" sx={{ width: 100, height: 100, display: 'block' }} />
                  </Box>
                  
                  <Box sx={{ flex: 1, minWidth: 200 }}>
                    <Typography
                      variant="h6"
                      component="a"
                      href={newUrlData.shortUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      color="primary.main"
                      sx={{ textDecoration: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 0.5 }}
                    >
                      {newUrlData.shortUrl}
                      <OpenInNew fontSize="inherit" sx={{ fontSize: 14 }} />
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: 450, mt: 0.5, mb: 2 }}>
                      Destination: {newUrlData.originalUrl}
                    </Typography>
   
                    <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                      <Button
                        variant="contained"
                        onClick={handleCopyNewLink}
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
                        sx={{ borderColor: '#222538' }}
                        startIcon={<QrCodeIcon />}
                      >
                        Download QR
                      </Button>
                    </Box>
                  </Box>
                </Box>
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
                    This link has been scanned. Threat Level: <strong>{newUrlData.safetyInfo.status.toUpperCase()}</strong> (Risk Score: {newUrlData.safetyInfo.riskScore}%).
                    {newUrlData.safetyInfo.warning && ` Note: ${newUrlData.safetyInfo.warning}`}
                  </Typography>
                </Alert>
              )}

              {/* AI Marketing Suite */}
              {newUrlData.aiMetadata && (
                <Box sx={{ mt: 3 }}>
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

        </CardContent>
      </Card>

      {/* Snackbar Alert Notifications */}
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

export default UrlShortenerForm;
