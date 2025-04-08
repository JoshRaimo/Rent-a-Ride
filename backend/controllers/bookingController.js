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

        // Check for conflicting bookings
        const conflictingBooking = await Booking.findOne({
            car: carId,
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

        // Create the booking
        const booking = new Booking({
            user: req.user.id,
            car: carId,
            startDate: start,
            endDate: end,
            totalPrice,
            status: 'pending'
        });

        await booking.save();
        res.status(201).json({ message: 'Booking created successfully', booking });

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

// Update booking status (Admin or User cancelling their own)
const updateBookingStatus = async (req, res) => {
    console.log(`[updateBookingStatus] Received request for bookingId: ${req.params.bookingId}, status: ${req.body.status}`); // Log entry point
    try {
        const { bookingId } = req.params;
        const { status } = req.body;
        
        // Ensure user context exists
        if (!req.user || !req.user.id) {
             console.log('[updateBookingStatus] Unauthorized attempt - No user context.');
             return res.status(401).json({ message: 'Unauthorized. Please log in.' });
        }
        
        const userId = req.user.id;
        const userRole = req.user.role;
        console.log(`[updateBookingStatus] User ID: ${userId}, Role: ${userRole}`); // Log user details

        // Validate status
        if (!['pending', 'confirmed', 'canceled'].includes(status)) {
            console.log('[updateBookingStatus] Invalid status value:', status); // Log invalid status attempt
            return res.status(400).json({ message: 'Invalid status value' });
        }

        console.log(`[updateBookingStatus] Finding booking with ID: ${bookingId}`); // Log before DB query
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            console.log('[updateBookingStatus] Booking not found.'); // Log if booking doesn't exist
            return res.status(404).json({ message: 'Booking not found' });
        }
        console.log('[updateBookingStatus] Booking found:', booking._id, 'Current status:', booking.status, 'Owner:', booking.user); // Log if booking is found

        // Check permissions
        const isOwner = booking.user.toString() === userId;
        console.log(`[updateBookingStatus] Checking permissions. Is owner: ${isOwner}`); // Log permission check details

        if (userRole === 'admin') {
            console.log('[updateBookingStatus] Admin permission granted.');
        } else if (isOwner && status === 'canceled') {
             console.log('[updateBookingStatus] User permission granted for cancellation.');
        } else {
             console.log('[updateBookingStatus] Permission denied.'); // Log permission denial
            return res.status(403).json({ message: 'Access denied. You can only cancel your own bookings.' });
        }
        
        // Prevent re-canceling
        if (booking.status === 'canceled' && status === 'canceled') {
             console.log('[updateBookingStatus] Attempted to cancel an already canceled booking.'); // Log re-cancel attempt
             return res.status(400).json({ message: 'Booking is already canceled.' });
        }
        // Add other checks if needed (e.g., prevent cancellation of 'confirmed' bookings past a certain date)
        
        console.log(`[updateBookingStatus] Updating booking status from ${booking.status} to: ${status}`); // Log status change details
        booking.status = status;
        
        console.log('[updateBookingStatus] Saving booking...'); // Log before saving
        await booking.save();
        console.log('[updateBookingStatus] Booking saved successfully.'); // Log after successful save

        console.log('[updateBookingStatus] Populating car details...'); // Log before populating
        // Use .populate() on the document before sending it back
        const updatedBooking = await Booking.findById(booking._id).populate('car');
        console.log('[updateBookingStatus] Car details populated.'); // Log after populating

        console.log('[updateBookingStatus] Sending successful response.'); // Log before sending response
        res.status(200).json({ message: `Booking ${status} successfully`, booking: updatedBooking }); // Send the populated booking back
    } catch (error) {
        // Log the full error stack trace
        console.error('[updateBookingStatus] Error caught:', error); 
        res.status(500).json({ message: 'Server error.', error: error.message }); // Keep sending generic message to frontend
    }
};

// Delete a booking (Admin or User deleting their own)
const deleteBooking = async (req, res) => {
    console.log(`[deleteBooking] Received request for bookingId: ${req.params.bookingId}`); // Log entry
    try {
        const { bookingId } = req.params;
        
        // Ensure user context exists
        if (!req.user || !req.user.id) {
            console.log('[deleteBooking] Unauthorized attempt - No user context.');
            return res.status(401).json({ message: 'Unauthorized. Please log in.' });
        }

        const userId = req.user.id;
        const userRole = req.user.role;
         console.log(`[deleteBooking] User ID: ${userId}, Role: ${userRole}`); // Log user details

        console.log(`[deleteBooking] Finding booking with ID: ${bookingId}`); // Log before find
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            console.log('[deleteBooking] Booking not found.'); // Log not found
            return res.status(404).json({ message: 'Booking not found' });
        }
         console.log('[deleteBooking] Booking found:', booking._id, 'Owner:', booking.user); // Log found

        // Check permissions: Admin can delete any, User can delete their own
        const isOwner = booking.user.toString() === userId;
         console.log(`[deleteBooking] Checking permissions. Is owner: ${isOwner}`); // Log permission check

        if (userRole !== 'admin' && !isOwner) {
             console.log('[deleteBooking] Permission denied.'); // Log denial
            return res.status(403).json({ message: 'Access denied. You can only delete your own bookings.' });
        }

        console.log('[deleteBooking] Permission granted. Deleting booking...'); // Log before delete
        await booking.deleteOne(); // Use deleteOne on the document instance
        console.log('[deleteBooking] Booking deleted successfully.'); // Log after delete

        res.status(200).json({ message: 'Booking deleted successfully' });
    } catch (error) {
         console.error('[deleteBooking] Error caught:', error); // Log error
        res.status(500).json({ message: 'Server error.', error: error.message });
    }
};

module.exports = { createBooking, getUserBookings, getAllBookings, updateBookingStatus, deleteBooking };