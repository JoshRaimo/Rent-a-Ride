const express = require('express');
const Booking = require('../models/Booking');
const Car = require('../models/Car');
const { authenticate } = require('../middleware/authMiddleware'); // Assuming this exists

const router = express.Router();

// Create a booking
router.post('/', authenticate, async (req, res) => {
    try {
        const { carId, startDate, endDate } = req.body;

        // Check for overlapping bookings
        const conflictingBooking = await Booking.findOne({
            car: carId,
            $or: [
                { startDate: { $lte: endDate, $gte: startDate } },
                { endDate: { $lte: endDate, $gte: startDate } },
            ],
        });

        if (conflictingBooking) {
            return res.status(400).json({ message: 'Car is not available for the selected dates.' });
        }

        // Calculate total price
        const car = await Car.findById(carId);
        const days = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
        const totalPrice = days * car.price_per_day;

        // Create booking
        const booking = await Booking.create({
            user: req.user.id,
            car: carId,
            startDate,
            endDate,
            totalPrice,
        });

        res.status(201).json(booking);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Get user bookings
router.get('/', authenticate, async (req, res) => {
    try {
        const bookings = await Booking.find({ user: req.user.id }).populate('car');
        res.status(200).json(bookings);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Admin: Manage all bookings
router.get('/all', authenticate, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied.' });
        }

        const bookings = await Booking.find().populate('user car');
        res.status(200).json(bookings);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error.' });
    }
});

module.exports = router;