import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  CircularProgress,
  Divider,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  ContentCopy as CopyIcon,
  Check as CheckIcon,
  QrCode as QrCodeIcon,
  OpenInNew as OpenInNewIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AutoAwesome as MagicIcon,
  BarChart as ChartIcon,
  Link as LinkIcon,
} from '@mui/icons-material';
import api from '../services/api';

const CampaignDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  // QR Dialog States
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [qrCodeData, setQrCodeData] = useState(null);

  // Snackbar States
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  const triggerSnackbar = (msg, severity = 'success') => {
    setSnackbarMsg(msg);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const fetchCampaignDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/campaigns/${id}`);
      setCampaign(response.data.campaign || null);
    } catch (err) {
      console.error(err);
      triggerSnackbar('Failed to fetch campaign details.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaignDetails();
  }, [id]);

  const handleCopy = async (shortUrl, urlId) => {
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopiedId(urlId);
      triggerSnackbar('Copied to clipboard!');
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error(err);
      triggerSnackbar('Failed to copy link.', 'error');
    }
  };

  const openQrDialog = (url) => {
    // Construct the direct image URL from baseUrl
    const baseUrl = api.defaults.baseURL || 'http://localhost:5000/api/v1';
    const qrCodeUrl = `${baseUrl}/urls/${url.id}/qrcode`;
    setQrCodeData({
      ...url,
      qrCodeUrl,
    });
    setQrDialogOpen(true);
  };

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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 15 }}>
        <CircularProgress color="primary" size={50} />
      </Box>
    );
  }

  if (!campaign) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h5" sx={{ mb: 2 }}>Campaign not found</Typography>
        <Button startIcon={<BackIcon />} onClick={() => navigate('/campaigns')} variant="outlined">
          Back to Campaigns
        </Button>
      </Container>
    );
  }

  const linkCount = campaign.urls?.length || 0;

  return (
    <Container maxWidth={false} sx={{ pt: 3, pb: 6, px: { xs: 2, sm: 4, md: 6 } }}>
      {/* Header Back Button & Title */}
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate('/campaigns')}
          sx={{ mb: 2, color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
        >
          Back to Campaigns
        </Button>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h3" sx={{ fontWeight: 900, mb: 1, letterSpacing: '-1px' }}>
              {campaign.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Created on {new Date(campaign.createdAt).toLocaleDateString()} &bull; Bundled Links: {linkCount}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Card sx={{ px: 3, py: 1.5, minWidth: 140, textAlign: 'center', backgroundColor: 'rgba(248, 68, 100, 0.05)', borderColor: 'rgba(248, 68, 100, 0.2)' }}>
              <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700 }}>
                Total Clicks
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 900, color: 'primary.main' }}>
                {campaign.totalClicks}
              </Typography>
            </Card>
          </Box>
        </Box>
      </Box>

      {/* AI Performance Insights section */}
      <Card sx={{ mb: 5, border: '1px solid rgba(248, 68, 100, 0.2)', background: 'linear-gradient(135deg, rgba(21, 28, 45, 0.8) 0%, rgba(34, 21, 34, 0.5) 100%)', boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)' }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 3, display: 'flex', alignItems: 'center', gap: 1.2, color: 'primary.main' }}>
            <MagicIcon /> AI Campaign Insights
          </Typography>

          {campaign.totalClicks === 0 ? (
            <Typography variant="body1" color="text.secondary">
              Await redirection traffic. Once visitors start clicking, LinkEnhancer AI will analyze the stats to identify your best/worst performing URLs and provide campaign optimization suggestions.
            </Typography>
          ) : (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
                  {/* Best Performing URL */}
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                    <Box sx={{ p: 1, borderRadius: 2, backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                      <TrendingUpIcon sx={{ color: 'secondary.main', fontSize: 28 }} />
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'secondary.main', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                        Best Performing Link
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 800, wordBreak: 'break-all', mt: 0.5 }}>
                        {campaign.aiInsights?.bestLink || 'Calculating...'}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Worst Performing URL */}
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                    <Box sx={{ p: 1, borderRadius: 2, backgroundColor: 'rgba(248, 68, 100, 0.1)', border: '1px solid rgba(248, 68, 100, 0.2)' }}>
                      <TrendingDownIcon sx={{ color: 'primary.main', fontSize: 28 }} />
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                        Worst Performing Link
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 800, wordBreak: 'break-all', mt: 0.5 }}>
                        {campaign.aiInsights?.worstLink || 'Calculating...'}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Box sx={{ height: '100%', borderLeft: { md: '1px solid rgba(255, 255, 255, 0.08)' }, pl: { md: 4 } }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.5px', mb: 1.5 }}>
                    Optimization Suggestions
                  </Typography>
                  <Typography variant="body2" sx={{ lineHeight: 1.7, color: 'text.primary' }}>
                    {campaign.aiInsights?.optimizationSuggestions || 'Awaiting optimization analysis...'}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          )}
        </CardContent>
      </Card>

      {/* Linked Short URL List */}
      <Typography variant="h5" sx={{ fontWeight: 800, mb: 3 }}>
        Campaign Links
      </Typography>

      <TableContainer component={Paper} variant="outlined" sx={{ backgroundColor: 'background.paper', borderColor: 'rgba(255, 255, 255, 0.08)' }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead sx={{ backgroundColor: '#0b0e1a' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, borderColor: 'rgba(255, 255, 255, 0.08)' }}>Original Destination URL</TableCell>
              <TableCell sx={{ fontWeight: 700, borderColor: 'rgba(255, 255, 255, 0.08)' }}>Shortened URL</TableCell>
              <TableCell sx={{ fontWeight: 700, borderColor: 'rgba(255, 255, 255, 0.08)' }} align="center">Clicks</TableCell>
              <TableCell sx={{ fontWeight: 700, borderColor: 'rgba(255, 255, 255, 0.08)' }} align="center">Created</TableCell>
              <TableCell sx={{ fontWeight: 700, borderColor: 'rgba(255, 255, 255, 0.08)' }} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {campaign.urls?.map((url) => (
              <TableRow key={url.id} hover>
                <TableCell sx={{ maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', borderColor: 'rgba(255, 255, 255, 0.08)' }}>
                  <Tooltip title={url.originalUrl} placement="top">
                    <Typography variant="body2">{url.originalUrl}</Typography>
                  </Tooltip>
                </TableCell>
                <TableCell sx={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography
                      component="a"
                      href={url.shortUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      color="primary.main"
                      sx={{ textDecoration: 'none', fontWeight: 'bold', '&:hover': { textDecoration: 'underline' } }}
                    >
                      {url.shortUrl}
                    </Typography>
                    <IconButton size="small" href={url.shortUrl} target="_blank" rel="noopener noreferrer">
                      <OpenInNewIcon fontSize="inherit" sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Box>
                </TableCell>
                <TableCell align="center" sx={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {url.clicks}
                  </Typography>
                </TableCell>
                <TableCell align="center" sx={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}>
                  <Typography variant="body2" color="text.secondary">
                    {new Date(url.createdAt).toLocaleDateString()}
                  </Typography>
                </TableCell>
                <TableCell align="right" sx={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                    <Tooltip title="Copy Link">
                      <IconButton
                        onClick={() => handleCopy(url.shortUrl, url.id)}
                        color={copiedId === url.id ? 'success' : 'default'}
                      >
                        {copiedId === url.id ? <CheckIcon /> : <CopyIcon />}
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="QR Code">
                      <IconButton onClick={() => openQrDialog(url)} color="default">
                        <QrCodeIcon />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="View Link Analytics">
                      <IconButton onClick={() => navigate(`/analytics/${url.id}`)} color="default">
                        <ChartIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

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

      {/* Snackbar Alerts */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} sx={{ width: '100%' }} variant="filled">
          {snackbarMsg}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default CampaignDetails;
