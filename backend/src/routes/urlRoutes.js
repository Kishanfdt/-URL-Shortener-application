const express = require('express');
const router = express.Router();

const { createShortUrl, getUserUrls, deleteUserUrl, getQrCodeImage, createGuestUrl, predictEngagement, scanUrlSafety } = require('../controllers/urlController');
const { protect } = require('../middlewares/authMiddleware');
const { validateUrlInput } = require('../validators/urlValidator');

// Public QR Code retrieval (allows direct browser embedding in img tags)
router.get('/:id/qrcode', getQrCodeImage);

// Public guest URL shortening route (anonymous)
router.post('/guest', validateUrlInput, createGuestUrl);

// Public scan safety route
router.post('/scan-safety', scanUrlSafety);

// Public CTR prediction route
router.post('/predict', predictEngagement);

// Protect all other routes in this router
router.use(protect);

// Endpoint routes
router.post('/', validateUrlInput, createShortUrl);
router.get('/', getUserUrls);
router.delete('/:id', deleteUserUrl);

module.exports = router;
