const express = require('express');
const User = require('../models/User');
const Car = require('../models/Car');
const Booking = require('../models/Booking');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

// Get user count
router.get('/users/count', authenticate, async (req, res) => {
    try {
        const userCount = await User.countDocuments();
        console.log('User Count:', userCount);
        res.status(200).json({ count: userCount });
    } catch (error) {
        console.error('Error fetching user count:', error.message);
        res.status(500).json({ message: 'Server error.', error: error.message });
    }
});

// Get car count
router.get('/cars/count', authenticate, async (req, res) => {
    try {
        const carCount = await Car.countDocuments();
        console.log('Car Count:', carCount);
        res.status(200).json({ count: carCount });
    } catch (error) {
        console.error('Error fetching car count:', error.message);
        res.status(500).json({ message: 'Server error.', error: error.message });
    }
});

// Get booking count
router.get('/bookings/count', authenticate, async (req, res) => {
    try {
        const bookingCount = await Booking.countDocuments();
        console.log('Booking Count:', bookingCount);
        res.status(200).json({ count: bookingCount });
    } catch (error) {
        console.error('Error fetching booking count:', error.message);
        res.status(500).json({ message: 'Server error.', error: error.message });
    }
});

module.exports = router; 