const Booking = require('../models/Booking');
const Car = require('../models/Car');
const User = require('../models/User'); // Ensure User model is imported
const { formatInTimeZone, toDate } = require('date-fns-tz');
const { parseISO, isValid } = require('date-fns');

// Create a booking
const createBooking = async (req, res) => {
    try {
        const { carId, startDate, endDate } = req.body;
        const EST_TIMEZONE = 'America/New_York';

        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'Unauthorized. Please log in again.' });
        }

        // Validate request data
        if (!carId || !startDate || !endDate) {
            return res.status(400).json({ error: 'Car ID, start date, and end date are required' });
        }

        // Parse the dates
        const start = parseISO(startDate);
        const end = parseISO(endDate);
        const now = new Date();

        // Validate dates
        if (!isValid(start) || !isValid(end)) {
            return res.status(400).json({ message: 'Invalid date format provided.' });
        }

        if (start >= end) {
            return res.status(400).json({ message: 'Start date must be before end date.' });
        }

        if (start <= now) {
            return res.status(400).json({ message: 'Start time must be in the future.' });
        }

        // Check for conflicting bookings (exclude canceled and completed bookings)
        const conflictingBooking = await Booking.findOne({
            car: carId,
            status: 'confirmed', // Only check confirmed bookings since we auto-confirm
            $or: [
                { startDate: { $lte: end }, endDate: { $gte: start } }
            ]
        });

        if (conflictingBooking) {
            return res.status(400).json({ message: 'Car is not available for the selected dates.' });
        }

        // Calculate total price
        const car = await Car.findById(carId);
        if (!car) {
            return res.status(404).json({ message: 'Car not found.' });
        }

        // Calculate number of days (rounded up)
        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        const totalPrice = days * car.pricePerDay;

        // Create the booking with confirmed status (auto-confirmation)
        const booking = new Booking({
            user: req.user.id,
            car: carId,
            startDate: start,
            endDate: end,
            totalPrice,
            status: 'confirmed'
        });

        await booking.save();
        res.status(201).json({ message: 'Booking confirmed successfully', booking });

    } catch (error) {
        console.error('Error creating booking:', error);
        res.status(500).json({ message: 'Server error.', error: error.message });
    }
};

// Get user bookings
const getUserBookings = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'Unauthorized. Please log in again.' });
        }

        // Auto-complete bookings that have passed their end date
        const now = new Date();
        await Booking.updateMany(
            { 
                user: req.user.id,
                status: 'confirmed',
                endDate: { $lt: now }
            },
            { status: 'completed' }
        );

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

        // Auto-complete bookings that have passed their end date
        const now = new Date();
        await Booking.updateMany(
            { 
                status: 'confirmed',
                endDate: { $lt: now }
            },
            { status: 'completed' }
        );

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

// Update booking status (Admin or User cancelling their own)
const updateBookingStatus = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { status } = req.body;
        
        if (!req.user || !req.user.id) {
             return res.status(401).json({ message: 'Unauthorized. Please log in.' });
        }
        
        const userId = req.user.id;
        const userRole = req.user.role;

        if (!['pending', 'confirmed', 'canceled', 'completed'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status value' });
        }

        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Check permissions - MODIFIED THIS SECTION
        const isOwner = booking.user.toString() === userId;

        // If user is admin, allow all status changes
        // If user is owner, only allow cancellation
        if (!(userRole === 'admin' || (isOwner && status === 'canceled'))) {
            return res.status(403).json({ 
                message: userRole === 'admin' 
                    ? 'Admin permission denied.' 
                    : 'You can only cancel your own bookings.'
            });
        }
        
        // Prevent re-canceling
        if (booking.status === 'canceled' && status === 'canceled') {
             return res.status(400).json({ message: 'Booking is already canceled.' });
        }
        
        booking.status = status;
        
        await booking.save();

        const updatedBooking = await Booking.findById(booking._id).populate('car');

        res.status(200).json({ message: `Booking ${status} successfully`, booking: updatedBooking });
    } catch (error) {
        console.error('[updateBookingStatus] Error caught:', error);
        res.status(500).json({ message: 'Server error.', error: error.message });
    }
};

// Delete a booking (Admin or User deleting their own)
const deleteBooking = async (req, res) => {
    try {
        const { bookingId } = req.params;
        
        // Ensure user context exists
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'Unauthorized. Please log in.' });
        }

        const userId = req.user.id;
        const userRole = req.user.role;

        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Check permissions: Admin can delete any, User can delete their own
        const isOwner = booking.user.toString() === userId;

        if (userRole !== 'admin' && !isOwner) {
            return res.status(403).json({ message: 'Access denied. You can only delete your own bookings.' });
        }

        await booking.deleteOne(); // Use deleteOne on the document instance

        res.status(200).json({ message: 'Booking deleted successfully' });
    } catch (error) {
         console.error('[deleteBooking] Error caught:', error); // Log error
        res.status(500).json({ message: 'Server error.', error: error.message });
    }
};

module.exports = { createBooking, getUserBookings, getAllBookings, updateBookingStatus, deleteBooking };