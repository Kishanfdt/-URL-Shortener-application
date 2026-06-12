const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./routes/authRoutes');
const urlRoutes = require('./routes/urlRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const campaignRoutes = require('./routes/campaignRoutes');
const redirectRoutes = require('./routes/redirectRoutes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// Enable Helmet for security headers to protect endpoints, allowing cross-origin resources (like QR Codes) to be loaded by the frontend SPA
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// Global Rate Limiting - 100 requests per 15 minutes per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests from this IP, please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

// Auth Rate Limiting - 10 requests per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many login or signup attempts, please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Enable Cross-Origin Resource Sharing with restricted origin
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

// Parse incoming JSON requests with body size limits to prevent DOS
app.use(express.json({ limit: '10kb' }));

// Mount routers
app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/urls', urlRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/campaigns', campaignRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ success: true, status: 'healthy', timestamp: new Date() });
});

// Mount redirection router (must be mounted below specific routes to prevent conflicts)
app.use('/', redirectRoutes);

// Fallback 404 Route handler
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: 'Resource path not found' });
});

// Centralized error handling middleware
app.use(errorHandler);

module.exports = app;
