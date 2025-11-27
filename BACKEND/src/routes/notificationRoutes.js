const express = require('express');
const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  registerPushToken,
  generateReminders
} = require('../controllers/notificationController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// All notification routes require authentication
router.use(authenticate);

// Get user notifications
router.get('/', getNotifications);

// Get unread notification count
router.get('/unread/count', getUnreadCount);

// Mark notification as read
router.patch('/:id/read', markAsRead);

// Mark all notifications as read
router.put('/read/all', markAllAsRead);

// Delete notification
router.delete('/:id', deleteNotification);

// Register push token
router.post('/push-token', registerPushToken);

// Generate automated reminders for upcoming classes (Admin only)
router.post('/generate-reminders', authorize('ADMIN'), generateReminders);

module.exports = router;