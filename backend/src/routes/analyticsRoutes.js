const express = require('express');
const router = express.Router();

const { getAnalytics } = require('../controllers/analyticsController');
const { protect } = require('../middlewares/authMiddleware');

// Mount routes - require token authorization
router.get('/:urlId', protect, getAnalytics);

module.exports = router;
