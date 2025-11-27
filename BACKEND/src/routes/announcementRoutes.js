const express = require('express');
const {
  getAnnouncements,
  getAnnouncement,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  addComment,
  deleteComment
} = require('../controllers/announcementController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// All announcement routes require authentication
router.use(authenticate);

// Get all announcements
router.get('/', getAnnouncements);

// Get single announcement
router.get('/:id', getAnnouncement);

// Create announcement (Lecturer/Admin only)
router.post('/', authorize('LECTURER', 'ADMIN'), createAnnouncement);

// Update announcement (Author/Admin only)
router.put('/:id', updateAnnouncement);

// Delete announcement (Author/Admin only)
router.delete('/:id', deleteAnnouncement);

// Add comment to announcement
router.post('/:id/comments', addComment);

// Delete comment (Author/Admin only)
router.delete('/comments/:id', deleteComment);

module.exports = router;