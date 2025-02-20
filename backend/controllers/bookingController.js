const Booking = require('../models/Booking');
const Car = require('../models/Car');

// Create a booking
const createBooking = async (req, res) => {
    try {
        const { carId, startDate, endDate } = req.body;

        // Validate request data
        if (!carId || !startDate || !endDate) {
            return res.status(400).json({ error: 'Car ID, start date, and end date are required' });
        }

        // Validate date range
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (isNaN(start) || isNaN(end) || start >= end) {
            return res.status(400).json({ message: 'Invalid date range. Start date must be before end date.' });
        }

        // **Updated Conflict Check**
        const conflictingBooking = await Booking.findOne({
            car: carId,
            $or: [
                { startDate: { $lte: end }, endDate: { $gte: start } }, // Overlapping booking
            ],
        });

        if (conflictingBooking) {
            return res.status(400).json({ message: 'Car is not available for the selected dates.' });
        }

        // Fetch car details
        const car = await Car.findById(carId);
        if (!car || !car.pricePerDay) {
            return res.status(404).json({ message: 'Car not found or price per day is not defined.' });
        }

        // Calculate total price
        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        const totalPrice = days * car.pricePerDay;

        // Create a new booking
        const booking = new Booking({
            user: req.user.id,
            car: carId,
            startDate,
            endDate,
            totalPrice,
            status: 'pending'
        });

        await booking.save();
        res.status(201).json({ message: 'Booking created successfully', booking });
    } catch (error) {
        console.error('Error creating booking:', error.message);
        res.status(500).json({ message: 'Server error.', error: error.message });
    }
};

// Get user bookings
const getUserBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ user: req.user.id }).populate('car');
        res.status(200).json(bookings);
    } catch (error) {
        console.error('Error fetching user bookings:', error.message);
        res.status(500).json({ message: 'Server error.', error: error.message });
    }
};

// Get all bookings (Admin only)
const getAllBookings = async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admins only.' });
        }

        const bookings = await Booking.find().populate('user car');
        res.status(200).json(bookings);
    } catch (error) {
        console.error('Error fetching all bookings:', error.message);
        res.status(500).json({ message: 'Server error.', error: error.message });
    }
};

module.exports = { createBooking, getUserBookings, getAllBookings };