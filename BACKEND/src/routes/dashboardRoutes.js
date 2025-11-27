const express = require('express');
const { getDashboardStats } = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// All dashboard routes require authentication
router.use(authenticate);

// Get dashboard stats
router.get('/stats', getDashboardStats);

module.exports = router;