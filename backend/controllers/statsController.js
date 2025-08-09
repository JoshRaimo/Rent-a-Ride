const User = require('../models/User');
const Car = require('../models/Car');
const Booking = require('../models/Booking');

// Get user count
const getUserCount = async (req, res) => {
    try {
        const count = await User.countDocuments();
        res.status(200).json({ count });
    } catch (error) {
        console.error('Error fetching user count:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Get car count
const getCarCount = async (req, res) => {
    try {
        const count = await Car.countDocuments();
        res.status(200).json({ count });
    } catch (error) {
        console.error('Error fetching car count:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Get booking count
const getBookingCount = async (req, res) => {
    try {
        const count = await Booking.countDocuments();
        res.status(200).json({ count });
    } catch (error) {
        console.error('Error fetching booking count:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = { getUserCount, getCarCount, getBookingCount };