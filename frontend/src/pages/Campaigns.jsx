import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  CircularProgress,
  Snackbar,
  Alert,
  Paper,
  Divider,
} from '@mui/material';
import {
  FolderOpen as FolderIcon,
  Add as AddIcon,
  DeleteOutline as DeleteIcon,
  BarChart as ChartIcon,
  ArrowForward as ArrowIcon,
  Link as LinkIcon,
  DateRange as DateIcon,
} from '@mui/icons-material';
import api from '../services/api';

const Campaigns = () => {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [campaignName, setCampaignName] = useState('');
  const [campaignUrls, setCampaignUrls] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  // Delete Dialog States
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Snackbar States
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  const triggerSnackbar = (msg, severity = 'success') => {
    setSnackbarMsg(msg);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const response = await api.get('/campaigns');
      setCampaigns(response.data.campaigns || []);
    } catch (err) {
      console.error(err);
      triggerSnackbar('Failed to load campaigns.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    if (!campaignName.trim()) {
      triggerSnackbar('Campaign name is required', 'error');
      return;
    }

    const urlList = campaignUrls
      .split('\n')
      .map(u => u.trim())
      .filter(u => u.length > 0);

    if (urlList.length === 0) {
      triggerSnackbar('Please enter at least one valid URL', 'error');
      return;
    }

    try {
      setSubmitLoading(true);
      await api.post('/campaigns', {
        name: campaignName.trim(),
        urls: urlList,
      });
      triggerSnackbar('Campaign created successfully!', 'success');
      setCreateDialogOpen(false);
      setCampaignName('');
      setCampaignUrls('');
      fetchCampaigns();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || 'Failed to create campaign.';
      triggerSnackbar(msg, 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const openDeleteDialog = (campaign, e) => {
    e.stopPropagation();
    setCampaignToDelete(campaign);
    setDeleteDialogOpen(true);
  };

  const handleDeleteCampaign = async () => {
    if (!campaignToDelete) return;
    try {
      setDeleteLoading(true);
      await api.delete(`/campaigns/${campaignToDelete._id}`);
      triggerSnackbar('Campaign and its URLs deleted successfully.', 'success');
      setDeleteDialogOpen(false);
      setCampaignToDelete(null);
      fetchCampaigns();
    } catch (err) {
      console.error(err);
      triggerSnackbar('Failed to delete campaign.', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <Container maxWidth={false} sx={{ pt: 3, pb: 6, px: { xs: 2, sm: 4, md: 6 } }}>
      {/* Header section */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 5, flexDirection: { xs: 'column', sm: 'row' }, gap: 2, textAlign: { xs: 'center', sm: 'left' } }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, display: 'flex', alignItems: 'center', gap: 1.5, justifyContent: { xs: 'center', sm: 'flex-start' } }}>
            <FolderIcon sx={{ color: 'primary.main', fontSize: 36 }} /> Marketing Campaigns
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Group your short links into campaigns and track their collective performance.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
          sx={{ py: 1.2, px: 3, fontSize: '0.95rem' }}
        >
          Create Campaign
        </Button>
      </Box>

      {/* Campaigns Listing */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress color="primary" size={50} />
        </Box>
      ) : campaigns.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', backgroundColor: 'rgba(21, 28, 45, 0.25)', borderRadius: 4 }}>
          <FolderIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
            No campaigns yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 450, mx: 'auto' }}>
            Create your first marketing campaign by grouping multiple target links. LinkEnhancer AI will track and suggest performance optimizations automatically!
          </Typography>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Create Campaign
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {campaigns.map((campaign) => {
            const totalClicks = campaign.urls?.reduce((sum, u) => sum + (u.clicks || 0), 0) || 0;
            const linkCount = campaign.urls?.length || 0;
            const formattedDate = new Date(campaign.createdAt).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            });

            return (
              <Grid item xs={12} sm={6} md={4} key={campaign._id}>
                <Card
                  onClick={() => navigate(`/campaigns/${campaign._id}`)}
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 20px 40px rgba(248, 68, 100, 0.12)',
                      borderColor: 'rgba(248, 68, 100, 0.3)',
                    },
                  }}
                >
                  <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 800, wordBreak: 'break-word', pr: 2 }}>
                        {campaign.name}
                      </Typography>
                      <IconButton
                        size="small"
                        color="inherit"
                        onClick={(e) => openDeleteDialog(campaign, e)}
                        sx={{ color: 'text.secondary', '&:hover': { color: 'error.main', backgroundColor: 'rgba(248, 68, 100, 0.05)' } }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1, color: 'text.secondary' }}>
                      <LinkIcon fontSize="small" />
                      <Typography variant="body2">
                        {linkCount} {linkCount === 1 ? 'Link' : 'Links'}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3, color: 'text.secondary' }}>
                      <ChartIcon fontSize="small" />
                      <Typography variant="body2">
                        {totalClicks} Total Clicks
                      </Typography>
                    </Box>

                    <Box sx={{ mt: 'auto', pt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, color: 'text.secondary' }}>
                        <DateIcon sx={{ fontSize: 16 }} />
                        <Typography variant="caption">{formattedDate}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'primary.main', fontWeight: 700, fontSize: '0.875rem' }}>
                        Details <ArrowIcon sx={{ fontSize: 16 }} />
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Create Campaign Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => !submitLoading && setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>Create New Campaign</DialogTitle>
        <Box component="form" onSubmit={handleCreateCampaign}>
          <DialogContent sx={{ pt: 1 }}>
            <DialogContentText sx={{ mb: 3, color: 'text.secondary' }}>
              Name your campaign and provide the URLs you want to bundle. We'll automatically generate safe, optimized short links for you.
            </DialogContentText>

            <TextField
              autoFocus
              required
              fullWidth
              label="Campaign Name"
              placeholder="e.g. Summer Sale 2026"
              variant="outlined"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              disabled={submitLoading}
              sx={{ mb: 3 }}
            />

            <TextField
              required
              fullWidth
              multiline
              rows={6}
              label="Target URLs"
              placeholder="Paste one URL per line:&#10;https://example.com/product1&#10;https://example.com/product2&#10;https://example.com/product3"
              variant="outlined"
              value={campaignUrls}
              onChange={(e) => setCampaignUrls(e.target.value)}
              disabled={submitLoading}
              helperText="Separate multiple links using newlines."
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
            <Button
              onClick={() => setCreateDialogOpen(false)}
              disabled={submitLoading}
              color="inherit"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submitLoading}
            >
              {submitLoading ? <CircularProgress size={24} color="inherit" /> : 'Create'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => !deleteLoading && setDeleteDialogOpen(false)}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Delete Campaign?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the campaign "{campaignToDelete?.name}"?
            <br />
            <Box component="span" sx={{ color: 'error.main', fontWeight: 600, mt: 1, display: 'inline-block' }}>
              Warning: This will also delete all associated shortened URLs and their analytics data.
            </Box>
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleteLoading} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleDeleteCampaign} disabled={deleteLoading} color="error" variant="outlined">
            {deleteLoading ? <CircularProgress size={24} color="inherit" /> : 'Delete Campaign'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar alerts */}
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

export default Campaigns;
