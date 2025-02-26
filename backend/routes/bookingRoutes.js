const express = require('express');
const { authenticate } = require('../middleware/authMiddleware');
const { createBooking, getUserBookings, getAllBookings, updateBookingStatus, deleteBooking } = require('../controllers/bookingController');

const router = express.Router();

// Create a booking
router.post('/', authenticate, createBooking);

// Get user bookings
router.get('/', authenticate, getUserBookings);

// Admin: Manage all bookings
router.get('/all', authenticate, getAllBookings);

// Update booking status
router.put('/:bookingId/status', authenticate, updateBookingStatus);

// Delete booking
router.delete('/:bookingId', authenticate, deleteBooking);

module.exports = router;