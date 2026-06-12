import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Grid,
  Button,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
  Divider,
  Tabs,
  Tab,
  Avatar,
  Chip,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  Link as LinkIcon,
  ContentCopy,
  DeleteOutline,
  BarChart,
  Check,
  OpenInNew,
  QrCode as QrCodeIcon,
  Home as HomeIcon,
  AutoAwesome as MagicIcon,
  History as HistoryIcon,
  AccountCircle as ProfileIcon,
  Search,
  TrendingUp,
  Launch,
  DateRange,
  MailOutline,
  Star
} from '@mui/icons-material';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import UrlShortenerForm from '../components/UrlShortenerForm';

// Premium midnight dark theme with BookMyShow Crimson Red accents
// TabPanel Component

// Custom TabPanel Component
const TabPanel = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 1 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const Dashboard = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    if (location.state && typeof location.state.activeTab === 'number') {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state]);

  const [urls, setUrls] = useState([]);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Dialog States
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [urlToDelete, setUrlToDelete] = useState(null);
  
  // QR Dialog States
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [qrCodeData, setQrCodeData] = useState(null);

  // Snackbar States
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [copiedId, setCopiedId] = useState(null);

  // AI CTR Prediction States
  const [predictTitle, setPredictTitle] = useState('');
  const [predictDesc, setPredictDesc] = useState('');
  const [predictPlatform, setPredictPlatform] = useState('Twitter');
  const [predictTime, setPredictTime] = useState('18:00');
  const [predictLoading, setPredictLoading] = useState(false);
  const [predictionResult, setPredictionResult] = useState(null);
  const [predictError, setPredictError] = useState('');

  const handlePredictCtr = async (e) => {
    e.preventDefault();
    setPredictLoading(true);
    setPredictError('');
    setPredictionResult(null);
    try {
      const response = await api.post('/urls/predict', {
        title: predictTitle,
        description: predictDesc,
        platform: predictPlatform,
        timeOfPosting: predictTime
      });
      setPredictionResult(response.data.prediction);
    } catch (err) {
      console.error(err);
      setPredictError('Failed to calculate engagement metrics. Please try again.');
    } finally {
      setPredictLoading(false);
    }
  };

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Load user URLs
  const fetchUrls = async () => {
    try {
      const response = await api.get('/urls');
      setUrls(response.data.urls);
    } catch (err) {
      console.error(err);
      triggerSnackbar('Failed to load links from server.', 'error');
    } finally {
      setFetchLoading(false);
    }
  };

  useEffect(() => {
    fetchUrls();
  }, []);

  // Summary Metrics calculations
  const totalLinks = urls.length;
  const totalClicks = urls.reduce((acc, curr) => acc + curr.clicks, 0);
  const mostPopular = urls.reduce(
    (max, curr) => (curr.clicks > max.clicks ? curr : max),
    { clicks: 0, shortCode: 'N/A', shortUrl: '#' }
  );

  // Filter links for search query
  const filteredUrls = urls.filter(
    (url) =>
      url.originalUrl.toLowerCase().includes(searchQuery.toLowerCase()) ||
      url.shortCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Show status popup alerts
  const triggerSnackbar = (msg, severity = 'success') => {
    setSnackbarMsg(msg);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  // Open QR Dialog helper
  const openQrDialog = (url) => {
    setQrCodeData(url);
    setQrDialogOpen(true);
  };

  // QR Code direct download helper
  const handleDownloadQrCode = async (qrCodeUrl, shortCode) => {
    try {
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${shortCode}-qr.png`;
      document.body.appendChild(link);
      link.click();
      
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      triggerSnackbar('QR Code downloaded successfully!');
    } catch (err) {
      console.error(err);
      triggerSnackbar('Failed to download QR code.', 'error');
    }
  };

  // Copy to clipboard Action
  const handleCopy = async (shortUrl, id) => {
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopiedId(id);
      triggerSnackbar('Copied to clipboard!');
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error(err);
      triggerSnackbar('Failed to copy to clipboard', 'error');
    }
  };

  // Trigger Delete confirmation dialog
  const openDeleteDialog = (urlId) => {
    setUrlToDelete(urlId);
    setDeleteDialogOpen(true);
  };

  // Execute Delete URL Action
  const handleDeleteConfirm = async () => {
    if (!urlToDelete) return;

    try {
      await api.delete(`/urls/${urlToDelete}`);
      setUrls((prev) => prev.filter((url) => url.id !== urlToDelete));
      triggerSnackbar('Link and associated analytics deleted.');
    } catch (err) {
      console.error(err);
      triggerSnackbar('Failed to delete the link.', 'error');
    } finally {
      setDeleteDialogOpen(false);
      setUrlToDelete(null);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      
      {/* Navigation Tabs */}
      <Box sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', mb: 4, pb: 1 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          textColor="primary"
          indicatorColor="primary"
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTabs-indicator': {
              display: 'none'
            },
            '& .MuiTab-root': {
              borderRadius: '30px',
              minHeight: '40px',
              height: '40px',
              px: 3,
              mx: 0.5,
              fontWeight: 700,
              color: 'text.secondary',
              transition: 'all 0.2s',
              '&.Mui-selected': {
                color: 'white',
                background: 'linear-gradient(135deg, #f84464 0%, #df3551 100%)',
                boxShadow: '0 4px 12px rgba(248, 68, 100, 0.25)'
              },
              '&:hover:not(.Mui-selected)': {
                background: 'rgba(255, 255, 255, 0.04)',
                color: 'text.primary'
              }
            }
          }}
        >
            <Tab label="Home" icon={<HomeIcon />} iconPosition="start" sx={{ fontWeight: 700, minHeight: 64 }} />
            <Tab label="Generate" icon={<MagicIcon />} iconPosition="start" sx={{ fontWeight: 700, minHeight: 64 }} />
            <Tab label="History" icon={<HistoryIcon />} iconPosition="start" sx={{ fontWeight: 700, minHeight: 64 }} />
            <Tab label="Profile" icon={<ProfileIcon />} iconPosition="start" sx={{ fontWeight: 700, minHeight: 64 }} />
          </Tabs>
        </Box>

        {/* 1. HOME PANEL */}
        <TabPanel value={activeTab} index={0}>
          <Grid container spacing={3}>
            {/* Welcome banner */}
            <Grid item xs={12}>
              <Card sx={{ 
                position: 'relative',
                background: 'linear-gradient(135deg, rgba(21, 28, 45, 0.75) 0%, rgba(34, 21, 34, 0.55) 100%)', 
                border: '1px solid rgba(255, 255, 255, 0.1)', 
                boxShadow: '0 25px 50px rgba(0, 0, 0, 0.35)',
                overflow: 'hidden',
                p: 1 
              }}>
                <Box sx={{
                  position: 'absolute',
                  top: '-50%',
                  right: '-10%',
                  width: '300px',
                  height: '300px',
                  background: 'radial-gradient(circle, rgba(248, 68, 100, 0.12) 0%, rgba(248, 68, 100, 0) 70%)',
                  pointerEvents: 'none',
                  zIndex: 0
                }} />
                <CardContent sx={{ p: 4, position: 'relative', zIndex: 1 }}>
                  <Typography variant="h4" sx={{ fontWeight: 900, mb: 1 }}>
                    Welcome back, <Box component="span" className="text-gradient-primary">{user ? user.name : 'Enhancer'}</Box>!
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    Here is a quick overview of your shortened links and traffic click volume.
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Button variant="contained" color="primary" onClick={() => setActiveTab(1)} startIcon={<MagicIcon />}>
                      Create New Link
                    </Button>
                    <Button variant="outlined" color="inherit" onClick={() => setActiveTab(2)} startIcon={<HistoryIcon />} sx={{ borderColor: 'rgba(255, 255, 255, 0.12)', '&:hover': { borderColor: 'primary.main' } }}>
                      Manage Links
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Metrics cards */}
            <Grid item xs={12} sm={4}>
              <Card sx={{ 
                height: '100%',
                background: 'linear-gradient(135deg, rgba(21, 28, 45, 0.55) 0%, rgba(17, 24, 30, 0.35) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                '&:hover': {
                  transform: 'translateY(-6px)',
                  boxShadow: '0 15px 35px rgba(248, 68, 100, 0.15)',
                  borderColor: 'rgba(248, 68, 100, 0.35)'
                }
              }}>
                <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', position: 'relative' }}>
                  <Box sx={{ 
                    position: 'absolute', 
                    top: 20, 
                    right: 20, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    width: 44, 
                    height: 44, 
                    borderRadius: '50%', 
                    background: 'rgba(248, 68, 100, 0.12)', 
                    border: '1px solid rgba(248, 68, 100, 0.25)' 
                  }}>
                    <LinkIcon sx={{ color: 'primary.main', fontSize: 22 }} />
                  </Box>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700, mb: 1, letterSpacing: '0.5px' }}>
                    Shortened Links
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, mt: 1 }}>
                    <Typography variant="h3" sx={{ fontWeight: 900 }} className="text-gradient-primary">
                      {fetchLoading ? <CircularProgress size={24} /> : totalLinks}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      active codes
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={4}>
              <Card sx={{ 
                height: '100%',
                background: 'linear-gradient(135deg, rgba(21, 28, 45, 0.55) 0%, rgba(17, 24, 30, 0.35) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                '&:hover': {
                  transform: 'translateY(-6px)',
                  boxShadow: '0 15px 35px rgba(16, 185, 129, 0.15)',
                  borderColor: 'rgba(16, 185, 129, 0.35)'
                }
              }}>
                <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', position: 'relative' }}>
                  <Box sx={{ 
                    position: 'absolute', 
                    top: 20, 
                    right: 20, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    width: 44, 
                    height: 44, 
                    borderRadius: '50%', 
                    background: 'rgba(16, 185, 129, 0.12)', 
                    border: '1px solid rgba(16, 185, 129, 0.25)' 
                  }}>
                    <TrendingUp sx={{ color: 'secondary.main', fontSize: 22 }} />
                  </Box>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700, mb: 1, letterSpacing: '0.5px' }}>
                    Total Clicks
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, mt: 1 }}>
                    <Typography variant="h3" sx={{ fontWeight: 900 }} className="text-gradient-success">
                      {fetchLoading ? <CircularProgress size={24} /> : totalClicks}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      redirections
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={4}>
              <Card sx={{ 
                height: '100%',
                background: 'linear-gradient(135deg, rgba(21, 28, 45, 0.55) 0%, rgba(17, 24, 30, 0.35) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                '&:hover': {
                  transform: 'translateY(-6px)',
                  boxShadow: '0 15px 35px rgba(99, 102, 241, 0.15)',
                  borderColor: 'rgba(99, 102, 241, 0.35)'
                }
              }}>
                <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', position: 'relative' }}>
                  <Box sx={{ 
                    position: 'absolute', 
                    top: 20, 
                    right: 20, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    width: 44, 
                    height: 44, 
                    borderRadius: '50%', 
                    background: 'rgba(99, 102, 241, 0.12)', 
                    border: '1px solid rgba(99, 102, 241, 0.25)' 
                  }}>
                    <Star sx={{ color: '#818cf8', fontSize: 22 }} />
                  </Box>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700, mb: 1, letterSpacing: '0.5px' }}>
                    Most Visited Link
                  </Typography>
                  {fetchLoading ? (
                    <CircularProgress size={24} sx={{ mt: 1 }} />
                  ) : mostPopular.shortCode !== 'N/A' ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', mt: 1 }}>
                      <Typography variant="h5" sx={{ fontWeight: 900, mb: 0.5, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '80%' }} className="text-gradient-purple">
                        /{mostPopular.shortCode}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        with <strong>{mostPopular.clicks}</strong> clicks
                      </Typography>
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2.5 }}>
                      No links shortened yet
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* 2. GENERATE PANEL */}
        <TabPanel value={activeTab} index={1}>
          <Box sx={{ maxWidth: 900, mx: 'auto' }}>
            <UrlShortenerForm onUrlCreated={(newUrl) => {
              setUrls((prev) => [newUrl, ...prev]);
              setActiveTab(2); // automatically jump to History list to view
            }} />

            {/* AI CTR Optimizer Card */}
            <Card sx={{ mt: 4, backgroundColor: 'background.paper', p: 1 }}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h5" sx={{ fontWeight: 800, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <MagicIcon color="primary" /> AI CTR Engagement Predictor
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                  Predict how likely your link is to receive clicks on social media. Enter details to estimate engagement and receive optimization recommendations.
                </Typography>

                <Box component="form" onSubmit={handlePredictCtr}>
                  <Grid container spacing={3}>
                    {/* Inputs Column */}
                    <Grid item xs={12} md={7}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                        <TextField
                          fullWidth
                          label="Campaign Title / Headline"
                          placeholder="e.g. 🔥 Save 40% on Noise Smartwatch today!"
                          value={predictTitle}
                          onChange={(e) => setPredictTitle(e.target.value)}
                          required
                          disabled={predictLoading}
                        />

                        <TextField
                          fullWidth
                          label="Description Snippet"
                          placeholder="e.g. Perfect fitness companion with 7-day battery life."
                          multiline
                          rows={3}
                          value={predictDesc}
                          onChange={(e) => setPredictDesc(e.target.value)}
                          disabled={predictLoading}
                        />

                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              select
                              label="Target Platform"
                              value={predictPlatform}
                              onChange={(e) => setPredictPlatform(e.target.value)}
                              SelectProps={{ native: true }}
                              disabled={predictLoading}
                              sx={{
                                '& select': {
                                  backgroundColor: 'background.paper'
                                }
                              }}
                            >
                              <option value="LinkedIn">LinkedIn</option>
                              <option value="Twitter">Twitter / X</option>
                              <option value="Facebook">Facebook</option>
                              <option value="Instagram">Instagram</option>
                            </TextField>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              label="Time of Posting"
                              type="time"
                              value={predictTime}
                              onChange={(e) => setPredictTime(e.target.value)}
                              InputLabelProps={{ shrink: true }}
                              disabled={predictLoading}
                            />
                          </Grid>
                        </Grid>

                        {predictError && (
                          <Alert severity="error" variant="outlined">
                            {predictError}
                          </Alert>
                        )}

                        <Button
                          type="submit"
                          variant="contained"
                          color="primary"
                          size="large"
                          disabled={predictLoading}
                          sx={{ height: 50, mt: 1 }}
                          startIcon={predictLoading ? <CircularProgress size={20} color="inherit" /> : <TrendingUp />}
                        >
                          {predictLoading ? 'Analyzing copy...' : 'Analyze Engagement Potential'}
                        </Button>
                      </Box>
                    </Grid>

                    {/* Results Column */}
                    <Grid item xs={12} md={5}>
                      <Box sx={{
                        height: '100%',
                        borderLeft: { md: '1px solid #222538' },
                        pl: { md: 4 },
                        pt: { xs: 4, md: 0 },
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        textAlign: 'center'
                      }}>
                        {predictionResult ? (
                          <Box sx={{ width: '100%' }}>
                            <Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700, mb: 2 }}>
                              Predicted Engagement Result
                            </Typography>
                            
                            {/* CTR Display */}
                            <Box sx={{ position: 'relative', display: 'inline-flex', mb: 3 }}>
                              <CircularProgress
                                variant="determinate"
                                value={predictionResult.predictedCtr}
                                size={120}
                                thickness={6}
                                color={predictionResult.predictedCtr >= 70 ? 'success' : predictionResult.predictedCtr >= 40 ? 'warning' : 'error'}
                              />
                              <Box sx={{
                                top: 0,
                                left: 0,
                                bottom: 0,
                                right: 0,
                                position: 'absolute',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}>
                                <Typography variant="h4" component="div" sx={{ fontWeight: 900 }}>
                                  {predictionResult.predictedCtr}%
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                                  Est. CTR
                                </Typography>
                              </Box>
                            </Box>

                            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                              Score: {predictionResult.engagementScore} / 10
                            </Typography>

                            <Divider sx={{ my: 2 }} />

                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1, textAlign: 'left', fontWeight: 'bold' }}>
                              Improvement Suggestions:
                            </Typography>
                            <Box sx={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 1 }}>
                              {predictionResult.suggestions.map((suggestion, i) => (
                                <Typography key={i} variant="body2" sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                  <span style={{ color: '#f84464' }}>&#10004;</span> {suggestion}
                                </Typography>
                              ))}
                            </Box>
                          </Box>
                        ) : (
                          <Box sx={{ p: 4, opacity: 0.5 }}>
                            <TrendingUp sx={{ fontSize: 64, mb: 2, color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary">
                              Enter your post details and click analyze to preview CTR predictions and optimization advice.
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </TabPanel>

        {/* 3. HISTORY PANEL */}
        <TabPanel value={activeTab} index={2}>
          {/* Top Actions & Search Bar */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Shortened Link Records
            </Typography>
            
            <TextField
              placeholder="Search links..."
              size="small"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ width: { xs: '100%', sm: 300 } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                )
              }}
            />
          </Box>

          {/* Loader Spinner */}
          {fetchLoading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8 }}>
              <CircularProgress color="primary" />
              <Typography sx={{ mt: 2 }} color="text.secondary">
                Retrieving link records...
              </Typography>
            </Box>
          ) : filteredUrls.length === 0 ? (
            // Empty State
            <Paper variant="outlined" sx={{ py: 8, px: 4, textAlign: 'center', borderStyle: 'dashed', borderColor: '#222538', backgroundColor: 'background.paper' }}>
              <LinkIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" sx={{ mb: 1 }}>
                {searchQuery ? 'No search results found' : 'No links created yet'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {searchQuery ? 'Try adjusting your search keywords.' : 'Navigate to the Generate tab to create your first short link.'}
              </Typography>
            </Paper>
          ) : (
            // Responsive Grid of Cards (For Mobile) & Table (For Desktop)
            <>
              {/* Desktop Table View */}
              <TableContainer component={Paper} variant="outlined" sx={{ display: { xs: 'none', md: 'block' }, borderColor: '#222538', backgroundColor: 'background.paper' }}>
                <Table sx={{ minWidth: 650 }}>
                  <TableHead sx={{ backgroundColor: '#0b0e1a' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, borderColor: '#222538' }}>Original Link</TableCell>
                      <TableCell sx={{ fontWeight: 700, borderColor: '#222538' }}>Short Link</TableCell>
                      <TableCell sx={{ fontWeight: 700, borderColor: '#222538' }} align="center">Clicks</TableCell>
                      <TableCell sx={{ fontWeight: 700, borderColor: '#222538' }} align="center">Expiry Date</TableCell>
                      <TableCell sx={{ fontWeight: 700, borderColor: '#222538' }} align="center">Created</TableCell>
                      <TableCell sx={{ fontWeight: 700, borderColor: '#222538' }} align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredUrls.map((url) => (
                      <TableRow key={url.id} hover>
                        <TableCell sx={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', borderColor: '#222538' }}>
                          <Tooltip title={url.originalUrl} placement="top">
                            <Typography variant="body2">{url.originalUrl}</Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell sx={{ borderColor: '#222538' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography
                              component="a"
                              href={url.shortUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              color="primary.main"
                              sx={{ textDecoration: 'none', fontWeight: 'bold', '&:hover': { textDecoration: 'underline' } }}
                            >
                              {url.shortCode}
                            </Typography>
                            <IconButton size="small" href={url.shortUrl} target="_blank" rel="noopener noreferrer">
                              <OpenInNew fontSize="inherit" sx={{ fontSize: 14 }} />
                            </IconButton>
                          </Box>
                        </TableCell>
                        <TableCell align="center" sx={{ borderColor: '#222538' }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {url.clicks}
                          </Typography>
                        </TableCell>
                        <TableCell align="center" sx={{ borderColor: '#222538' }}>
                          <Typography variant="body2" color={url.expiresAt ? (new Date(url.expiresAt) <= new Date() ? 'error.main' : 'text.secondary') : 'text.secondary'}>
                            {url.expiresAt ? new Date(url.expiresAt).toLocaleDateString() + ' ' + new Date(url.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never'}
                          </Typography>
                        </TableCell>
                        <TableCell align="center" sx={{ borderColor: '#222538' }}>
                          <Typography variant="body2" color="text.secondary">
                            {new Date(url.createdAt).toLocaleDateString()}
                          </Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ borderColor: '#222538' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                            <Tooltip title="Copy Link">
                              <IconButton
                                onClick={() => handleCopy(url.shortUrl, url.id)}
                                color={copiedId === url.id ? 'success' : 'default'}
                              >
                                {copiedId === url.id ? <Check /> : <ContentCopy />}
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="QR Code">
                              <IconButton onClick={() => openQrDialog(url)} color="default">
                                <QrCodeIcon />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="View Analytics">
                              <IconButton onClick={() => navigate(`/analytics/${url.id}`)} color="default">
                                <BarChart />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Delete">
                              <IconButton onClick={() => openDeleteDialog(url.id)} color="error">
                                <DeleteOutline />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Mobile Stack Cards View */}
              <Grid container spacing={2} sx={{ display: { xs: 'flex', md: 'none' } }}>
                {filteredUrls.map((url) => (
                  <Grid item xs={12} key={url.id}>
                    <Card>
                      <CardContent>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                          Created: {new Date(url.createdAt).toLocaleDateString()}
                        </Typography>
                        
                        <Typography variant="h6" sx={{ mb: 1 }}>
                          <Box
                            component="a"
                            href={url.shortUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            color="primary.main"
                            sx={{ textDecoration: 'none', fontWeight: 'bold' }}
                          >
                            {url.shortUrl}
                          </Box>
                        </Typography>

                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            mb: 2,
                            wordBreak: 'break-all',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}
                        >
                          {url.originalUrl}
                        </Typography>

                        {url.expiresAt && (
                          <Typography variant="body2" color={new Date(url.expiresAt) <= new Date() ? 'error.main' : 'text.secondary'} sx={{ mb: 2 }}>
                            Expires: <strong>{new Date(url.expiresAt).toLocaleString()}</strong>
                          </Typography>
                        )}

                        <Divider sx={{ mb: 2 }} />

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2">
                            Clicks: <strong>{url.clicks}</strong>
                          </Typography>
                          
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <IconButton
                              onClick={() => handleCopy(url.shortUrl, url.id)}
                              color={copiedId === url.id ? 'success' : 'default'}
                            >
                              {copiedId === url.id ? <Check /> : <ContentCopy />}
                            </IconButton>

                            <IconButton onClick={() => openQrDialog(url)} color="default">
                              <QrCodeIcon />
                            </IconButton>
                            
                            <IconButton onClick={() => navigate(`/analytics/${url.id}`)} color="default">
                              <BarChart />
                            </IconButton>

                            <IconButton onClick={() => openDeleteDialog(url.id)} color="error">
                              <DeleteOutline />
                            </IconButton>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </>
          )}
        </TabPanel>

        {/* 4. PROFILE PANEL */}
        <TabPanel value={activeTab} index={3}>
          {user && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              {/* Premium Ticket styled profile */}
              <Card sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                maxWidth: 650,
                width: '100%',
                backgroundColor: 'rgba(21, 24, 41, 0.55)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '2px solid #f84464',
                position: 'relative',
                overflow: 'visible',
                borderRadius: 4,
                boxShadow: '0 15px 40px rgba(248, 68, 100, 0.18)'
              }}>
                
                {/* Punch Holes for ticket stub styling */}
                <Box sx={{
                  display: { xs: 'none', sm: 'block' },
                  position: 'absolute',
                  top: -12,
                  left: 172,
                  width: 24,
                  height: 24,
                  backgroundColor: 'background.default',
                  borderRadius: '50%',
                  zIndex: 2,
                  borderBottom: '1px solid #222538'
                }} />
                
                <Box sx={{
                  display: { xs: 'none', sm: 'block' },
                  position: 'absolute',
                  bottom: -12,
                  left: 172,
                  width: 24,
                  height: 24,
                  backgroundColor: 'background.default',
                  borderRadius: '50%',
                  zIndex: 2,
                  borderTop: '1px solid #222538'
                }} />

                {/* Left Ticket Stub */}
                <Box sx={{
                  width: { xs: '100%', sm: 184 },
                  backgroundColor: '#221522',
                  borderRight: { xs: 'none', sm: '2px dashed #f84464' },
                  borderBottom: { xs: '2px dashed #f84464', sm: 'none' },
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  p: 3,
                  textAlign: 'center',
                  borderTopLeftRadius: 14,
                  borderBottomLeftRadius: { xs: 0, sm: 14 }
                }}>
                  <Avatar sx={{
                    width: 72,
                    height: 72,
                    bgcolor: 'primary.main',
                    fontSize: '2rem',
                    fontWeight: 'bold',
                    mb: 2,
                    boxShadow: '0 4px 15px rgba(248, 68, 100, 0.3)'
                  }}>
                    {user.name.charAt(0).toUpperCase()}
                  </Avatar>
                  <Chip
                    icon={<Star sx={{ fontSize: '14px !important' }} />}
                    label="PRO TICKET"
                    color="primary"
                    size="small"
                    sx={{ fontWeight: 'bold', letterSpacing: '0.5px' }}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: 'block' }}>
                    Showstopper Member
                  </Typography>
                </Box>

                {/* Right Ticket Info body */}
                <Box sx={{ flex: 1, p: 4 }}>
                  <Typography variant="h5" sx={{ fontWeight: 800, mb: 3 }}>
                    Admit One: {user.name}
                  </Typography>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    
                    {/* Email row */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <MailOutline color="disabled" />
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          Email Address
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {user.email}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Member since row */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <DateRange color="disabled" />
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          Registration Date
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {new Date(user.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Total traffic row */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <TrendingUp color="disabled" />
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          Account Click Volume
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {totalClicks} total redirects across {totalLinks} links
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  <Divider sx={{ my: 3 }} />

                  {/* Plan features check list */}
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontWeight: 'bold', textTransform: 'uppercase' }}>
                    Branded Features Unlocked
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', lineHeight: 1.5 }}>
                    &bull; Infinite URL links shortening<br />
                    &bull; Custom aliases mapping (silent auto-fallback)<br />
                    &bull; Dynamic expiry date schedules<br />
                    &bull; High-res QR codes retrieval & downloads<br />
                    &bull; Operating system, Geolocation, and browser analytics
                  </Typography>
                </Box>

              </Card>
            </Box>
          )}
        </TabPanel>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
          <DialogTitle>Confirm URL Deletion</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete this shortened link? All recorded analytics data and histories for this link will be permanently purged. This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setDeleteDialogOpen(false)} color="inherit">
              Cancel
            </Button>
            <Button onClick={handleDeleteConfirm} color="error" variant="contained">
              Delete Permanently
            </Button>
          </DialogActions>
        </Dialog>

        {/* QR Code Viewer Dialog */}
        <Dialog open={qrDialogOpen} onClose={() => setQrDialogOpen(false)} maxWidth="xs" fullWidth>
          <DialogTitle sx={{ fontWeight: 'bold', textAlign: 'center' }}>
            Link QR Code
          </DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3 }}>
            {qrCodeData && (
              <>
                <Box sx={{ backgroundColor: 'white', p: 2, borderRadius: 2, mb: 3, display: 'flex', border: '1px solid #222538' }}>
                  <Box component="img" src={qrCodeData.qrCodeUrl} alt="QR Code" sx={{ width: 180, height: 180, display: 'block' }} />
                </Box>
                <Typography variant="body1" color="primary.main" sx={{ fontWeight: 'bold', mb: 1, wordBreak: 'break-all', textAlign: 'center' }}>
                  {qrCodeData.shortUrl}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mb: 3, wordBreak: 'break-all' }}>
                  {qrCodeData.originalUrl}
                </Typography>
              </>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3, justifyContent: 'center', gap: 1.5 }}>
            <Button onClick={() => setQrDialogOpen(false)} color="inherit">
              Close
            </Button>
            {qrCodeData && (
              <Button
                onClick={() => handleDownloadQrCode(qrCodeData.qrCodeUrl, qrCodeData.shortCode)}
                variant="contained"
                color="primary"
                startIcon={<QrCodeIcon />}
              >
                Download QR
              </Button>
            )}
          </DialogActions>
        </Dialog>

        {/* Snackbar Notification Alerts */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={4000}
          onClose={() => setSnackbarOpen(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} variant="filled">
            {snackbarMsg}
          </Alert>
        </Snackbar>

      </Container>
  );
};

export default Dashboard;
