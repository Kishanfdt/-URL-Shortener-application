import React, { useState, useEffect } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Divider,
  LinearProgress,
} from '@mui/material';
import { ArrowBack, Link as LinkIcon, BarChart as ChartIcon } from '@mui/icons-material';
import api from '../services/api';

// Import Chart.js components
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

// Register Chart.js Modules
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Analytics Page View

const Analytics = () => {
  const { urlId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await api.get(`/analytics/${urlId}`);
        setData(response.data.analytics);
      } catch (err) {
        console.error(err);
        if (err.response && err.response.status === 403) {
          setError('You do not have permission to view analytics for this link.');
        } else {
          setError('Failed to load analytics data.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [urlId]);
  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 12 }}>
        <CircularProgress color="primary" />
        <Typography sx={{ mt: 2 }} color="text.secondary">
          Loading analytics data...
        </Typography>
      </Box>
    );
  }
  if (error) {
    return (
      <Container maxWidth="sm" sx={{ py: 10, textAlign: 'center' }}>
        <Card sx={{ p: 4 }}>
          <Typography variant="h5" color="error" sx={{ mb: 2, fontWeight: 700 }}>
            Error
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            {error}
          </Typography>
          <Button variant="contained" component={RouterLink} to="/dashboard" startIcon={<ArrowBack />}>
            Back to Dashboard
          </Button>
        </Card>
      </Container>
    );
  }

  // --- Chart Configurations ---
  
  const lineBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#151829',
        titleColor: '#f8fafc',
        bodyColor: '#f8fafc',
        borderColor: '#222538',
        borderWidth: 1
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(34, 37, 56, 0.4)' },
        ticks: { color: '#94a3b8', font: { size: 11 } }
      },
      y: {
        grid: { color: 'rgba(34, 37, 56, 0.4)' },
        ticks: {
          color: '#94a3b8',
          font: { size: 11 },
          stepSize: 1,
          precision: 0
        }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#94a3b8',
          boxWidth: 12,
          font: { size: 11, weight: '500' }
        }
      },
      tooltip: {
        backgroundColor: '#151829',
        titleColor: '#f8fafc',
        bodyColor: '#f8fafc',
        borderColor: '#222538',
        borderWidth: 1
      }
    }
  };

  // 1. Daily Trend
  const dailyLabels = data.dailyTrend.map(d => d._id);
  const dailyValues = data.dailyTrend.map(d => d.clicks);
  const dailyData = {
    labels: dailyLabels.length > 0 ? dailyLabels : ['No Clicks Yet'],
    datasets: [
      {
        fill: true,
        label: 'Redirect Clicks',
        data: dailyValues.length > 0 ? dailyValues : [0],
        borderColor: '#f84464',
        backgroundColor: 'rgba(248, 68, 100, 0.1)',
        borderWidth: 2.5,
        tension: 0.35,
        pointBackgroundColor: '#f84464'
      }
    ]
  };

  // 2. Monthly Trend
  const monthlyLabels = data.monthlyTrend.map(d => d._id);
  const monthlyValues = data.monthlyTrend.map(d => d.clicks);
  const monthlyData = {
    labels: monthlyLabels.length > 0 ? monthlyLabels : ['No Clicks Yet'],
    datasets: [
      {
        label: 'Redirect Clicks',
        data: monthlyValues.length > 0 ? monthlyValues : [0],
        backgroundColor: '#f84464',
        borderRadius: 4,
        maxBarThickness: 40
      }
    ]
  };

  // 3. Browser Distribution
  const browserLabels = data.browserDistribution.map(d => d._id || 'Unknown');
  const browserValues = data.browserDistribution.map(d => d.count);
  const browserData = {
    labels: browserLabels.length > 0 ? browserLabels : ['No Data'],
    datasets: [
      {
        data: browserValues.length > 0 ? browserValues : [1],
        backgroundColor: ['#f84464', '#3b82f6', '#10b981', '#f59e0b', '#df3551', '#ec4899'],
        borderWidth: 1,
        borderColor: '#151829'
      }
    ]
  };

  // 4. Device Distribution
  const deviceLabels = data.deviceDistribution.map(d => d._id || 'Unknown');
  const deviceValues = data.deviceDistribution.map(d => d.count);
  const deviceData = {
    labels: deviceLabels.length > 0 ? deviceLabels : ['No Data'],
    datasets: [
      {
        data: deviceValues.length > 0 ? deviceValues : [1],
        backgroundColor: ['#10b981', '#f84464', '#f59e0b'],
        borderWidth: 1,
        borderColor: '#151829'
      }
    ]
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
        
        {/* Header Block */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4, flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
          <Box>
            <Button
              component={RouterLink}
              to="/dashboard"
              startIcon={<ArrowBack />}
              sx={{ p: 0, color: 'primary.main', mb: 1, '&:hover': { background: 'transparent', textDecoration: 'underline' } }}
            >
              Back to Dashboard
            </Button>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              Performance Metrics
            </Typography>
          </Box>
          <Button
            variant="outlined"
            href={data.shortUrl}
            target="_blank"
            rel="noopener noreferrer"
            startIcon={<LinkIcon />}
            sx={{ borderColor: '#334155', color: 'text.primary' }}
          >
            Visit URL Code: {data.shortCode}
          </Button>
        </Box>

        {/* Overview Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700, mb: 1 }}>
                  Total Redirect Clicks
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
                  <Typography variant="h3" sx={{ fontWeight: 800 }}>
                    {data.totalClicks}
                  </Typography>
                  <ChartIcon sx={{ color: 'primary.main', fontSize: 32 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700, mb: 1 }}>
                  Last Redirect Event
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, mt: 1.5 }}>
                  {data.lastVisited ? new Date(data.lastVisited).toLocaleString() : 'Never Redirected'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Target Destination URL Card */}
        <Card sx={{ mb: 4 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700, mb: 1 }}>
              Target Destination Long URL
            </Typography>
            <Typography
              component="a"
              href={data.originalUrl}
              target="_blank"
              rel="noopener noreferrer"
              color="primary.main"
              sx={{ fontWeight: 600, textDecoration: 'none', wordBreak: 'break-all', '&:hover': { textDecoration: 'underline' } }}
            >
              {data.originalUrl}
            </Typography>
          </CardContent>
        </Card>

        {/* Charts Grid */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                  Daily Clicks Trend (Last 30 Days)
                </Typography>
                <Box sx={{ height: 260 }}>
                  <Line data={dailyData} options={lineBarOptions} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                  Monthly Clicks Trend (Last 12 Months)
                </Typography>
                <Box sx={{ height: 260 }}>
                  <Bar data={monthlyData} options={lineBarOptions} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Browser and Device Distribution Grid */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                  Clicks by Browser
                </Typography>
                <Box sx={{ height: 260, position: 'relative', flex: 1 }}>
                  <Doughnut data={browserData} options={doughnutOptions} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                  Clicks by Device Type
                </Typography>
                <Box sx={{ height: 260, position: 'relative', flex: 1 }}>
                  <Doughnut data={deviceData} options={doughnutOptions} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Country and OS Distribution Grid */}
        <Grid container spacing={3} sx={{ mb: 5 }}>
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                  Top Countries
                </Typography>
                {data.countryDistribution.length === 0 ? (
                  <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                    No country data found.
                  </Typography>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    {data.countryDistribution.map((country) => {
                      const percentage = data.totalClicks > 0 ? (country.count / data.totalClicks) * 100 : 0;
                      return (
                        <Box key={country._id}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.8 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {country._id || 'Unknown'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {country.count} ({percentage.toFixed(0)}%)
                            </Typography>
                          </Box>
                          <LinearProgress variant="determinate" value={percentage} sx={{ height: 6, borderRadius: 3, backgroundColor: 'rgba(248, 68, 100, 0.15)' }} />
                        </Box>
                      );
                    })}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                  Operating Systems
                </Typography>
                {data.osDistribution.length === 0 ? (
                  <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                    No OS data found.
                  </Typography>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    {data.osDistribution.map((os) => {
                      const percentage = data.totalClicks > 0 ? (os.count / data.totalClicks) * 100 : 0;
                      return (
                        <Box key={os._id}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.8 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {os._id || 'Unknown'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {os.count} ({percentage.toFixed(0)}%)
                            </Typography>
                          </Box>
                          <LinearProgress variant="determinate" value={percentage} sx={{ height: 6, borderRadius: 3, backgroundColor: 'rgba(248, 68, 100, 0.15)' }} />
                        </Box>
                      );
                    })}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Visitor Logs Table */}
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
          Recent Clicks Log (Last 10)
        </Typography>

        {data.recentVisits.length === 0 ? (
          <Paper variant="outlined" sx={{ py: 6, px: 2, textAlign: 'center' }}>
            <Typography color="text.secondary">No analytics click logs registered yet for this link.</Typography>
          </Paper>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead sx={{ backgroundColor: 'background.default' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Visitor Timestamp</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Browser</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Device</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Client IP Address</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.recentVisits.map((visit) => (
                  <TableRow key={visit._id} hover>
                    <TableCell>{new Date(visit.timestamp).toLocaleString()}</TableCell>
                    <TableCell>{visit.browser}</TableCell>
                    <TableCell>{visit.device}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>{visit.ip}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

      </Container>
  );
};

export default Analytics;
