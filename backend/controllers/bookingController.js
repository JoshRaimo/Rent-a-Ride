const Booking = require('../models/Booking');

// Create a booking
const createBooking = async (req, res) => {
    try {
        const { user, car, startDate, endDate, totalPrice, bookingStatus } = req.body;

        // Validate request data
        if (!user || !car || !startDate || !endDate || !totalPrice || !bookingStatus) {
            return res.status(400).json({ error: 'Missing required booking details' });
        }

        const booking = new Booking({
            user,
            car,
            startDate,
            endDate,
            totalPrice,
            bookingStatus,
        });
        await booking.save();

        res.status(201).json({ message: 'Booking created successfully', booking });
    } catch (err) {
        res.status(500).json({ error: 'Failed to create booking', details: err.message });
    }
};

// Get all bookings
const getBookings = async (req, res) => {
    try {
        const bookings = await Booking.find().populate('user').populate('car');
        res.status(200).json(bookings);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch bookings', details: err.message });
    }
};

module.exports = { createBooking, getBookings };