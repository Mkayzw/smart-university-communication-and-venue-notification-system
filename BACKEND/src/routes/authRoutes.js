const express = require('express');
const { register, login, getMe } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Register
router.post('/register', register);

// Login
router.post('/login', login);

// Get current user
router.get('/me', authenticate, getMe);

module.exports = router;