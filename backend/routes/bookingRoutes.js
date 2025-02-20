const express = require('express');
const { authenticate } = require('../middleware/authMiddleware');
const { createBooking, getUserBookings, getAllBookings } = require('../controllers/bookingController');

const router = express.Router();

// Create a booking
router.post('/', authenticate, createBooking);

// Get user bookings
router.get('/', authenticate, getUserBookings);

// Admin: Manage all bookings
router.get('/all', authenticate, getAllBookings);

module.exports = router;