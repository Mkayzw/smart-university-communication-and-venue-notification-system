const express = require('express');
const { getUsers, updateUser, deleteUser } = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// All user routes require authentication
router.use(authenticate);

// Get all users (Admin only)
router.get('/', authorize('ADMIN'), getUsers);

// Update user profile
router.put('/:id', updateUser);

// Delete user (Admin only)
router.delete('/:id', authorize('ADMIN'), deleteUser);

module.exports = router;