const express = require('express');
const router = express.Router();
const { redirectUrl } = require('../controllers/redirectController');

// Root redirection route
router.get('/:shortCode', redirectUrl);

module.exports = router;
