const { validationResult } = require('express-validator');
const Car = require('../models/Car');

// Get all cars
const getAllCars = async (req, res) => {
    try {
        const cars = await Car.find();
        res.status(200).json(cars);
    } catch (err) {
        console.error('Error fetching cars:', err.message);
        res.status(500).json({ error: 'Failed to fetch cars', details: err.message });
    }
};

// Add a new car
const addCar = async (carData) => {
    try {
        // Extract fields from carData
        const { make, model, year, pricePerDay, availabilityStatus, image } = carData;

        // Year validation
        const currentYear = new Date().getFullYear();
        if (year < 1886 || year > currentYear + 1) {
            throw new Error(`Year must be between 1886 and ${currentYear + 1}.`);
        }

        // Price validation
        if (pricePerDay <= 0) {
            throw new Error('Price per day must be greater than 0.');
        }

        // Create a new car instance
        const car = new Car({
            make,
            model,
            year,
            pricePerDay,
            availabilityStatus,
            image: image || '',
        });

        // Save car to the database
        await car.save();
        return car;
    } catch (err) {
        console.error('Error adding car:', err.message);
        throw new Error(err.message); // Return the error message for the route to handle
    }
};

module.exports = { getAllCars, addCar };