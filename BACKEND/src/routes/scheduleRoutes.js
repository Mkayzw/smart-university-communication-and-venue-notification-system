const express = require('express');
const {
  getMySchedule,
  getSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule
} = require('../controllers/scheduleController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// All schedule routes require authentication
router.use(authenticate);

// Get my personal schedule
router.get('/my-schedule', getMySchedule);

// Get all schedules
router.get('/', getSchedules);

// Create schedule (Lecturer/Admin only)
router.post('/', authorize('LECTURER', 'ADMIN'), createSchedule);

// Update schedule (Lecturer/Admin only)
router.put('/:id', authorize('LECTURER', 'ADMIN'), updateSchedule);

// Delete schedule (Lecturer/Admin only)
router.delete('/:id', authorize('LECTURER', 'ADMIN'), deleteSchedule);

module.exports = router;