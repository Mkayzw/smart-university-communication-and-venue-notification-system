const express = require('express');
const {
  getVenuesRealtime,
  getAvailableVenues,
  getVenues,
  getVenue,
  createVenue,
  updateVenue,
  updateVenueAvailability,
  deleteVenue
} = require('../controllers/venueController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// All venue routes require authentication
router.use(authenticate);

// Get venues with real-time occupancy status
router.get('/realtime', getVenuesRealtime);

// Check available venues
router.get('/available', getAvailableVenues);

// Get all venues
router.get('/', getVenues);

// Get single venue
router.get('/:id', getVenue);

// Create venue (Admin only)
router.post('/', authorize('ADMIN'), createVenue);

// Update venue (Admin only)
router.put('/:id', authorize('ADMIN'), updateVenue);

// Update venue availability (Admin only)
router.patch('/:id/availability', authorize('ADMIN'), updateVenueAvailability);

// Delete venue (Admin only)
router.delete('/:id', authorize('ADMIN'), deleteVenue);

module.exports = router;