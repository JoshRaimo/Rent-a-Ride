const Booking = require('../models/Booking');

// Create a booking
const createBooking = async (req, res) => {
    try {
        const { user, car, startDate, endDate, totalPrice, status } = req.body;

        // Validate request data
        if (!user || !car || !startDate || !endDate || !totalPrice) {
            return res.status(400).json({ error: 'Missing required booking details' });
        }

        // Validate status (only allow certain values)
        const allowedStatuses = ['pending', 'confirmed', 'cancelled'];
        if (status && !allowedStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status value' });
        }

        // Ensure startDate is before endDate
        if (new Date(startDate) >= new Date(endDate)) {
            return res.status(400).json({ error: 'Start date must be before end date' });
        }

        // Validate totalPrice
        if (totalPrice <= 0) {
            return res.status(400).json({ error: 'Total price must be a positive number' });
        }

        // Check if the car is already booked for the given date range
        const existingBooking = await Booking.findOne({
            car,
            $or: [
                { startDate: { $lte: endDate }, endDate: { $gte: startDate } },
                { startDate: { $gte: startDate, $lte: endDate } }
            ]
        });

        if (existingBooking) {
            return res.status(400).json({ error: 'Car is not available for the selected dates' });
        }

        // Create the new booking
        const booking = new Booking({
            user,
            car,
            startDate,
            endDate,
            totalPrice,
            status: status || 'pending',  // Default status to 'pending' if not provided
        });

        await booking.save();
        res.status(201).json({ message: 'Booking created successfully', booking });
    } catch (err) {
        console.error('Error creating booking:', err.message);
        res.status(500).json({ error: 'Failed to create booking', details: err.message });
    }
};

// Get all bookings
const getBookings = async (req, res) => {
    try {
        const bookings = await Booking.find().populate('user').populate('car');
        res.status(200).json(bookings);
    } catch (err) {
        console.error('Error fetching bookings:', err.message);
        res.status(500).json({ error: 'Failed to fetch bookings', details: err.message });
    }
};

module.exports = { createBooking, getBookings };