const Car = require('../models/Car');

// Get all cars
const getAllCars = async (req, res) => {
    try {
        const cars = await Car.find();
        res.status(200).json(cars);
    } catch (err) {
        console.error('Error fetching cars:', err.message); // Log error for debugging
        res.status(500).json({ error: 'Failed to fetch cars', details: err.message });
    }
};

// Add a new car
const addCar = async (req, res) => {
    try {
        const { make, model, year, price_per_day, availabilityStatus, image } = req.body;

        // Validate request data
        if (!make || !model || !year || price_per_day === undefined || availabilityStatus === undefined) {
            return res.status(400).json({ error: 'Missing required car details' });
        }

        // Ensure year is valid
        if (isNaN(year) || year < 1886 || year > new Date().getFullYear() + 1) { // Car production started in 1886
            return res.status(400).json({ error: 'Invalid car year provided' });
        }

        // Ensure price_per_day is a positive number
        if (isNaN(price_per_day) || price_per_day <= 0) {
            return res.status(400).json({ error: 'Price per day must be a positive number' });
        }

        // Create a new car instance
        const car = new Car({
            make,
            model,
            year,
            price_per_day,
            availabilityStatus,
            image: image || '', // Optional image field
        });

        // Save car to database
        await car.save();

        res.status(201).json({ message: 'Car added successfully', car });
    } catch (err) {
        console.error('Error adding car:', err.message); // Log error for debugging
        res.status(500).json({ error: 'Failed to add car', details: err.message });
    }
};

module.exports = { getAllCars, addCar };