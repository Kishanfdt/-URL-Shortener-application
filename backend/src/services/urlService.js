const Url = require('../models/Url');
const Analytics = require('../models/Analytics');
const { generateShortCode } = require('../utils/codeGenerator');
const aiService = require('./aiService');

/**
 * Create a new shortened URL
 * @param {string} originalUrl - The long target URL
 * @param {string} userId - ID of the creating user
 * @param {string} host - The server base domain (e.g., http://localhost:5000)
 * @param {string} [customAlias] - Optional custom alias back-half (e.g., kishan)
 * @param {Date|string} [expiresAt] - Optional expiration date
 */
const createUrl = async (originalUrl, userId, host, customAlias, expiresAt, bypassSafety = false) => {
  // 1. Run safety scan first
  const safetyInfo = await aiService.checkLinkSafety(originalUrl);
  if (safetyInfo.riskScore >= 65 && !bypassSafety) {
    const error = new Error(safetyInfo.warning || 'URL is marked as high-risk or malicious.');
    error.statusCode = 400;
    error.isUnsafe = true;
    error.safetyInfo = safetyInfo;
    throw error;
  }

  let shortCode;

  const validateAlias = (alias) => {
    if (!alias || alias.trim() === '') return false;
    const trimmed = alias.trim();
    const aliasRegex = /^[a-zA-Z0-9-_]+$/;
    if (!aliasRegex.test(trimmed)) return false;
    if (trimmed.length < 3 || trimmed.length > 30) return false;
    const reservedTerms = ['api', 'health', 'auth', 'urls', 'analytics', 'dashboard', 'login', 'signup'];
    if (reservedTerms.includes(trimmed.toLowerCase())) return false;
    return true;
  };

  if (customAlias) {
    if (!validateAlias(customAlias)) {
      const error = new Error('Alias must be 3-30 characters long and contain only letters, numbers, dashes, or underscores. It cannot be a reserved word.');
      error.statusCode = 400;
      throw error;
    }
    const existing = await Url.findOne({ shortCode: customAlias });
    if (existing) {
      const error = new Error('Custom alias is already in use. Please select a different one.');
      error.statusCode = 400;
      throw error;
    }
    shortCode = customAlias;
  } else {
    let attempts = 0;
    const maxAttempts = 5;

    // Collision resolution loop for auto-generated codes
    while (attempts < maxAttempts) {
      shortCode = generateShortCode();
      const existing = await Url.findOne({ shortCode });
      if (!existing) break;
      attempts++;
    }

    if (attempts === maxAttempts) {
      const error = new Error('Failed to generate a unique short code. Please try again.');
      error.statusCode = 500;
      throw error;
    }
  }

  // 2. Scrape page content and generate AI marketing captions
  const pageContent = await aiService.scrapeWebpage(originalUrl);
  const aiMetadata = await aiService.generateMarketingSuite(originalUrl, pageContent.title, pageContent.description, pageContent.bodyText);

  // Create document in database
  const url = await Url.create({
    userId,
    originalUrl,
    shortCode,
    expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    aiMetadata,
    safetyInfo
  });

  return {
    id: url._id,
    originalUrl: url.originalUrl,
    shortCode: url.shortCode,
    shortUrl: `${host}/${url.shortCode}`,
    qrCodeUrl: `${host}/api/v1/urls/${url._id}/qrcode`,
    clicks: url.clicks,
    expiresAt: url.expiresAt,
    aiMetadata: url.aiMetadata,
    safetyInfo: url.safetyInfo,
    createdAt: url.createdAt
  };
};

/**
 * Fetch all URLs created by a user
 * @param {string} userId - ID of the owner
 * @param {string} host - The server base domain (for shortUrl building)
 */
const getUrls = async (userId, host) => {
  const urls = await Url.find({ userId }).sort({ createdAt: -1 });
  
  return urls.map(url => ({
    id: url._id,
    originalUrl: url.originalUrl,
    shortCode: url.shortCode,
    shortUrl: `${host}/${url.shortCode}`,
    qrCodeUrl: `${host}/api/v1/urls/${url._id}/qrcode`,
    clicks: url.clicks,
    expiresAt: url.expiresAt,
    aiMetadata: url.aiMetadata,
    safetyInfo: url.safetyInfo,
    createdAt: url.createdAt
  }));
};

/**
 * Delete a URL and all associated logs (Cascading Delete)
 * @param {string} urlId - The ID of the URL to delete
 * @param {string} userId - ID of the requesting user (ownership check)
 */
const deleteUrl = async (urlId, userId) => {
  const url = await Url.findById(urlId);

  if (!url) {
    const error = new Error('URL not found');
    error.statusCode = 404;
    throw error;
  }

  // Verify ownership
  if (url.userId.toString() !== userId.toString()) {
    const error = new Error('Not authorized to delete this URL');
    error.statusCode = 403;
    throw error;
  }

  // Delete associated analytics logs first
  await Analytics.deleteMany({ urlId });

  // Delete URL document
  await Url.deleteOne({ _id: urlId });

  return { success: true };
};

module.exports = {
  createUrl,
  getUrls,
  deleteUrl
};
