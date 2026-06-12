const express = require('express');
const router = express.Router();

const { signup, login, getMe } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');
const { validateSignup, validateLogin } = require('../validators/authValidator');

// Public signup route
router.post('/signup', validateSignup, signup);

// Public login route
router.post('/login', validateLogin, login);

// Private profile route
router.get('/me', protect, getMe);

module.exports = router;
