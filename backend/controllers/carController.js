const { validationResult } = require('express-validator');
const Car = require('../models/Car');
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

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const cars = await Car.find(filter).skip(skip).limit(limit);
        const total = await Car.countDocuments(filter);

        res.status(200).json({ total, page, cars });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch cars', details: err.message });
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
        res.status(201).json(car);
    } catch (err) {
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
        res.status(200).json(car);
    } catch (err) {
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

        let imageDeleted = false;

        // Delete the image from S3 if it exists
        if (car.image) {
            const imageKey = car.image.split('/').pop(); // Extract key from the URL

            const deleteParams = {
                Bucket: process.env.S3_BUCKET_NAME,
                Key: `images/${imageKey}`,
            };

            try {
                await s3.send(new DeleteObjectCommand(deleteParams));
                imageDeleted = true;
            } catch (s3Error) {
                console.error('Error deleting image from S3:', s3Error.message);
            }
        }

        if (imageDeleted || !car.image) {
            // Only delete the car from the database if the image is deleted successfully or doesn't exist
            await Car.findByIdAndDelete(id);
            return res.status(200).json({ message: 'Car and associated image deleted successfully' });
        } else {
            return res.status(500).json({ error: 'Failed to delete image, car not removed' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete car', details: err.message });
    }
};

module.exports = { getAllCars, addCar, updateCar, deleteCar };