const { validationResult } = require('express-validator');
const Car = require('../models/Car');
const Booking = require('../models/Booking');
const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const s3 = require('../config/s3');

// Get all cars
const getAllCars = async (req, res) => {
    try {
        const { make, model, availabilityStatus, minPrice, maxPrice } = req.query;
        const filter = {};

        if (make) filter.make = make;
        if (model) filter.model = model;
        if (availabilityStatus) filter.availabilityStatus = availabilityStatus;
        if (minPrice || maxPrice) {
            filter.pricePerDay = {};
            if (minPrice) filter.pricePerDay.$gte = parseFloat(minPrice);
            if (maxPrice) filter.pricePerDay.$lte = parseFloat(maxPrice);
        }

        // Adjust limit to fetch all makes
        const limit = parseInt(req.query.limit) || 68;

        const cars = await Car.find(filter).limit(limit);

        const formattedCars = cars.map(car => ({
            carId: car._id,  
            make: car.make,
            model: car.model,
            year: car.year,
            pricePerDay: car.pricePerDay,
            availabilityStatus: car.availabilityStatus,
            image: car.image
        }));

        const total = await Car.countDocuments(filter);

        res.status(200).json({ total, cars: formattedCars });
    } catch (err) {
        console.error('Error fetching cars:', err.message);
        res.status(500).json({ error: 'Failed to fetch cars', details: err.message });
    }
};

// Get available cars based on date range
const getAvailableCars = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'Start date and end date are required' });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (isNaN(start) || isNaN(end) || start >= end) {
            return res.status(400).json({ error: 'Invalid date range. Start date must be before end date.' });
        }

        // Find booked cars in the selected date range
        const bookedCarIds = await Booking.find({
            $or: [
                { startDate: { $lte: end }, endDate: { $gte: start } }, // Overlapping bookings
            ],
        }).distinct('car');

        // Fetch only available cars (not in bookedCarIds)
        const availableCars = await Car.find({ _id: { $nin: bookedCarIds } });

        res.status(200).json(availableCars);
    } catch (err) {
        console.error('Error fetching available cars:', err.message);
        res.status(500).json({ error: 'Failed to fetch available cars', details: err.message });
    }
};

// Fetch all car makes
const getAllMakes = async (req, res) => {
    try {
        const makes = await Car.distinct('make').sort();
        res.status(200).json(makes);
    } catch (err) {
        console.error('Error fetching car makes:', err.message);
        res.status(500).json({ error: 'Failed to fetch car makes', details: err.message });
    }
};

// Add a new car
const addCar = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { make, model, year, pricePerDay, availabilityStatus, image } = req.body;

    try {
        const car = new Car({
            make,
            model,
            year,
            pricePerDay,
            availabilityStatus,
            image: image || '',
        });

        await car.save();
        res.status(201).json({
            carId: car._id,
            make: car.make,
            model: car.model,
            year: car.year,
            pricePerDay: car.pricePerDay,
            availabilityStatus: car.availabilityStatus,
            image: car.image
        });
    } catch (err) {
        console.error('Error adding car:', err.message);
        res.status(500).json({ error: 'Failed to add car', details: err.message });
    }
};

// Update car details
const updateCar = async (req, res) => {
    const { id } = req.params;

    try {
        const car = await Car.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
        if (!car) {
            return res.status(404).json({ error: 'Car not found' });
        }
        res.status(200).json({
            carId: car._id,
            make: car.make,
            model: car.model,
            year: car.year,
            pricePerDay: car.pricePerDay,
            availabilityStatus: car.availabilityStatus,
            image: car.image
        });
    } catch (err) {
        console.error('Error updating car:', err.message);
        res.status(500).json({ error: 'Failed to update car', details: err.message });
    }
};

// Delete a car and its associated image from S3
const deleteCar = async (req, res) => {
    const { id } = req.params;

    try {
        const car = await Car.findById(id);
        if (!car) {
            return res.status(404).json({ error: 'Car not found' });
        }

        if (car.image && car.image.includes(process.env.S3_BUCKET_NAME)) {
            const imageKey = car.image.split('/').pop();

            const deleteParams = {
                Bucket: process.env.S3_BUCKET_NAME,
                Key: `images/${imageKey}`,
            };

            try {
                await s3.send(new DeleteObjectCommand(deleteParams));
            } catch (s3Error) {
                console.error('Error deleting image from S3:', s3Error.message);
            }
        }

        await Car.findByIdAndDelete(id);
        return res.status(200).json({ message: 'Car deleted successfully' });
    } catch (err) {
        console.error('Error deleting car:', err.message);
        res.status(500).json({ error: 'Failed to delete car', details: err.message });
    }
};

module.exports = { getAllCars, getAvailableCars, getAllMakes, addCar, updateCar, deleteCar };