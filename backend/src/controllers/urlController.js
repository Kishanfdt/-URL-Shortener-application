const QRCode = require('qrcode');
const Url = require('../models/Url');
const urlService = require('../services/urlService');
const aiService = require('../services/aiService');

// Helper to determine active server base URL (e.g. http://localhost:5000)
const getBaseUrl = (req) => {
  return `${req.protocol}://${req.get('host')}`;
};

/**
 * @desc    Create a shortened URL
 * @route   POST /api/v1/urls
 * @access  Private
 */
const createShortUrl = async (req, res, next) => {
  try {
    const { originalUrl, customAlias, expiresAt } = req.body;
    const userId = req.user._id;
    const host = getBaseUrl(req);

    const data = await urlService.createUrl(originalUrl, userId, host, customAlias, expiresAt);

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
    const { originalUrl, expiresAt } = req.body;
    const host = getBaseUrl(req);

    // Call createUrl service with undefined userId
    const data = await urlService.createUrl(originalUrl, undefined, host, undefined, expiresAt);

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

module.exports = {
  createShortUrl,
  getUserUrls,
  deleteUserUrl,
  getQrCodeImage,
  createGuestUrl,
  predictEngagement
};
