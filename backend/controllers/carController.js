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
        const { 
            startDate, 
            endDate,
            startTime,
            endTime,
            priceMin,
            priceMax,
            yearMin,
            yearMax,
            make,
            model 
        } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'Start date and end date are required' });
        }

        // Parse dates and times to create proper DateTime objects
        let start, end;
        
        if (startTime && endTime) {
            // Parse time strings (e.g., "2:30 PM", "Midnight", "Noon")
            const parseTime = (timeStr) => {
                if (timeStr.toLowerCase() === 'midnight') return '00:00';
                if (timeStr.toLowerCase() === 'noon') return '12:00';
                
                // Convert 12-hour format to 24-hour format
                const [time, period] = timeStr.split(' ');
                const [hours, minutes] = time.split(':');
                let hour = parseInt(hours, 10);
                
                if (period.toLowerCase() === 'pm' && hour !== 12) {
                    hour += 12;
                } else if (period.toLowerCase() === 'am' && hour === 12) {
                    hour = 0;
                }
                
                return `${hour.toString().padStart(2, '0')}:${minutes}`;
            };

            const startTimeStr = parseTime(startTime);
            const endTimeStr = parseTime(endTime);
            
            // Create dates in local timezone to avoid timezone conversion issues
            start = new Date(`${startDate}T${startTimeStr}:00`);
            end = new Date(`${endDate}T${endTimeStr}:00`);
            
        } else {
            // Fallback to just dates if no times provided
            start = new Date(`${startDate}T00:00:00`);
            end = new Date(`${endDate}T23:59:59`);
        }

        if (isNaN(start) || isNaN(end) || start >= end) {
            return res.status(400).json({ error: 'Invalid date range. Start date must be before end date.' });
        }

        // Find booked cars in the selected date range with proper time overlap detection
        // Only consider confirmed bookings - canceled bookings should not block availability
        const bookedCarIds = await Booking.find({
            status: 'confirmed', // Only confirmed bookings block availability
            $or: [
                // Case 1: New booking starts during an existing booking
                { startDate: { $lt: end, $gte: start } },
                // Case 2: New booking ends during an existing booking  
                { endDate: { $gt: start, $lte: end } },
                // Case 3: New booking completely contains an existing booking
                { startDate: { $gte: start }, endDate: { $lte: end } },
                // Case 4: New booking is completely contained by an existing booking
                { startDate: { $lte: start }, endDate: { $gte: end } }
            ],
        }).distinct('car');

        // Build the filter object
        let filter = { 
            _id: { $nin: bookedCarIds },
            availabilityStatus: true // Only include cars marked as available
        };

        // Add price range filter
        if (priceMin || priceMax) {
            filter.pricePerDay = {};
            if (priceMin) filter.pricePerDay.$gte = Number(priceMin);
            if (priceMax) filter.pricePerDay.$lte = Number(priceMax);
        }

        // Add year range filter
        if (yearMin || yearMax) {
            filter.year = {};
            if (yearMin) filter.year.$gte = Number(yearMin);
            if (yearMax) filter.year.$lte = Number(yearMax);
        }

        // Add make and model filters
        if (make) {
            filter.make = { $regex: make, $options: 'i' };
        }
        if (model) {
            filter.model = { $regex: model, $options: 'i' };
        }

        // Fetch available cars with all filters applied
        const availableCars = await Car.find(filter);

        // Format cars to match the expected structure
        const formattedCars = availableCars.map(car => ({
            carId: car._id,
            make: car.make,
            model: car.model,
            year: car.year,
            pricePerDay: car.pricePerDay,
            availabilityStatus: car.availabilityStatus,
            image: car.image,
            averageRating: car.averageRating,
            reviewCount: car.reviewCount
        }));

        res.status(200).json(formattedCars);
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

// Get year range (oldest and newest car years)
const getYearRange = async (req, res) => {
    try {
        // Get all unique years where cars exist, sorted from oldest to newest
        const years = await Car.distinct('year').sort({ year: 1 });
        
        if (years.length === 0) {
            // No cars exist, return fallback values
            const currentYear = new Date().getFullYear();
            const nextYear = currentYear + 1;
            return res.status(200).json({
                minYear: currentYear,
                maxYear: currentYear,
                nextYear: nextYear,
                currentYear: currentYear,
                availableYears: [currentYear]
            });
        }
        
        const minYear = years[0]; // Oldest year
        const maxYear = years[years.length - 1]; // Newest year
        const currentYear = new Date().getFullYear();
        const nextYear = currentYear + 1;
        
        res.status(200).json({
            minYear,
            maxYear,
            nextYear,
            currentYear,
            availableYears: years // Array of all years where cars exist
        });
    } catch (err) {
        console.error('Error fetching year range:', err.message);
        res.status(500).json({ error: 'Failed to fetch year range', details: err.message });
    }
};

// Get price range (minimum and maximum car prices)
const getPriceRange = async (req, res) => {
    try {
        // Get all cars and find min/max prices
        const priceStats = await Car.aggregate([
            {
                $group: {
                    _id: null,
                    minPrice: { $min: "$pricePerDay" },
                    maxPrice: { $max: "$pricePerDay" },
                    avgPrice: { $avg: "$pricePerDay" },
                    totalCars: { $sum: 1 }
                }
            }
        ]);
        
        if (priceStats.length === 0) {
            // No cars exist, return fallback values
            return res.status(200).json({
                minPrice: 0,
                maxPrice: 100,
                avgPrice: 50,
                totalCars: 0
            });
        }
        
        const { minPrice, maxPrice, avgPrice, totalCars } = priceStats[0];
        
        res.status(200).json({
            minPrice: Math.floor(minPrice),
            maxPrice: Math.ceil(maxPrice),
            avgPrice: Math.round(avgPrice),
            totalCars
        });
    } catch (err) {
        console.error('Error fetching price range:', err.message);
        res.status(500).json({ error: 'Failed to fetch price range', details: err.message });
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

module.exports = { getAllCars, getAvailableCars, getAllMakes, getYearRange, getPriceRange, addCar, updateCar, deleteCar };