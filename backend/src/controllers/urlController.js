const os = require('os');
const QRCode = require('qrcode');
const Url = require('../models/Url');
const urlService = require('../services/urlService');
const aiService = require('../services/aiService');

const getLocalIpAddress = () => {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
};

// Helper to determine active server base URL (e.g. http://localhost:5000)
const getBaseUrl = (req) => {
  let host = req.get('host');
  if (host && (host.includes('localhost') || host.includes('127.0.0.1'))) {
    const port = host.split(':')[1] || '5000';
    host = `${getLocalIpAddress()}:${port}`;
  }
  return `${req.protocol}://${host}`;
};

/**
 * @desc    Create a shortened URL
 * @route   POST /api/v1/urls
 * @access  Private
 */
const createShortUrl = async (req, res, next) => {
  try {
    const { originalUrl, customAlias, expiresAt, bypassSafety } = req.body;
    const userId = req.user._id;
    const host = getBaseUrl(req);

    const data = await urlService.createUrl(originalUrl, userId, host, customAlias, expiresAt, bypassSafety);

    res.status(201).json({
      success: true,
      url: data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all URLs for the authenticated user
 * @route   GET /api/v1/urls
 * @access  Private
 */
const getUserUrls = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const host = getBaseUrl(req);

    const data = await urlService.getUrls(userId, host);

    res.status(200).json({
      success: true,
      urls: data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a shortened URL
 * @route   DELETE /api/v1/urls/:id
 * @access  Private
 */
const deleteUserUrl = async (req, res, next) => {
  try {
    const urlId = req.params.id;
    const userId = req.user._id;

    await urlService.deleteUrl(urlId, userId);

    res.status(200).json({
      success: true,
      message: 'URL and associated analytics deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Generate and stream a QR code image for a shortened URL
 * @route   GET /api/v1/urls/:id/qrcode
 * @access  Public
 */
const getQrCodeImage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const url = await Url.findById(id);

    if (!url) {
      return res.status(404).json({ success: false, message: 'URL not found' });
    }

    const host = getBaseUrl(req);
    const shortUrl = `${host}/${url.shortCode}`;

    // Generate QR code buffer (300px width with custom colors)
    const qrBuffer = await QRCode.toBuffer(shortUrl, {
      type: 'png',
      width: 300,
      margin: 2,
      color: {
        dark: '#0f172a',  // slate 900
        light: '#ffffff'  // white
      }
    });

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `inline; filename="${url.shortCode}-qr.png"`);
    res.send(qrBuffer);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a guest shortened URL (anonymous)
 * @route   POST /api/v1/urls/guest
 * @access  Public
 */
const createGuestUrl = async (req, res, next) => {
  try {
    const { originalUrl, expiresAt, bypassSafety } = req.body;
    const host = getBaseUrl(req);

    // Call createUrl service with undefined userId
    const data = await urlService.createUrl(originalUrl, undefined, host, undefined, expiresAt, bypassSafety);

    res.status(201).json({
      success: true,
      url: data
    });
  } catch (error) {
    next(error);
  }
};

const predictEngagement = async (req, res, next) => {
  try {
    const { title, description, platform, timeOfPosting } = req.body;
    const prediction = await aiService.predictCtrScore(title, description, platform, timeOfPosting);

    res.status(200).json({
      success: true,
      prediction
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Scan URL for safety before shortening
 * @route   POST /api/v1/urls/scan-safety
 * @access  Public
 */
const scanUrlSafety = async (req, res, next) => {
  try {
    const { originalUrl } = req.body;
    if (!originalUrl) {
      return res.status(400).json({ success: false, message: 'Please provide a URL to scan' });
    }
    const safetyResult = await aiService.checkLinkSafety(originalUrl);
    
    res.status(200).json({
      success: true,
      safety: safetyResult
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createShortUrl,
  getUserUrls,
  deleteUserUrl,
  getQrCodeImage,
  createGuestUrl,
  predictEngagement,
  scanUrlSafety
};
