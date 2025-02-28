const Booking = require('../models/Booking');
const Car = require('../models/Car');
const User = require('../models/User'); // Ensure User model is imported

// Create a booking
const createBooking = async (req, res) => {
    try {
        const { carId, startDate, endDate } = req.body;

        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'Unauthorized. Please log in again.' });
        }

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
            $or: [{ startDate: { $lte: end }, endDate: { $gte: start } }],
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
            user: req.user.id, // Ensure user ID is stored
            car: carId,
            startDate,
            endDate,
            totalPrice,
            status: 'pending',
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
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'Unauthorized. Please log in again.' });
        }

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

        // Populate the user field with username, name, and email
        const bookings = await Booking.find().populate({
            path: 'user',
            select: 'username name email' // Ensure we retrieve username, name, and email
        }).populate('car');

        res.status(200).json(bookings);
    } catch (error) {
        console.error('Error fetching all bookings:', error.message);
        res.status(500).json({ message: 'Server error.', error: error.message });
    }
};

// Update booking status (Admin only)
const updateBookingStatus = async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admins only.' });
        }

        const { bookingId } = req.params;
        const { status } = req.body;

        if (!['pending', 'confirmed', 'canceled'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status value' });
        }

        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        booking.status = status;
        await booking.save();

        res.status(200).json({ message: 'Booking status updated successfully', booking });
    } catch (error) {
        console.error('Error updating booking status:', error.message);
        res.status(500).json({ message: 'Server error.', error: error.message });
    }
};

// Delete a booking (Admin only)
const deleteBooking = async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admins only.' });
        }

        const { bookingId } = req.params;
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        await booking.deleteOne();
        res.status(200).json({ message: 'Booking deleted successfully' });
    } catch (error) {
        console.error('Error deleting booking:', error.message);
        res.status(500).json({ message: 'Server error.', error: error.message });
    }
};

module.exports = { createBooking, getUserBookings, getAllBookings, updateBookingStatus, deleteBooking };