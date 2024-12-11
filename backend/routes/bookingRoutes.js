const express = require('express');
const { createBooking, getBookings } = require('../controllers/bookingController');
const router = express.Router();

// Routes for bookings
router.post('/', createBooking);
router.get('/', getBookings);

// Default route for bookings to catch errors
router.use((req, res) => {
    res.status(404).json({ error: 'Booking route not found' });
});

module.exports = router;