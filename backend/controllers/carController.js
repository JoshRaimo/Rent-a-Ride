const Car = require('../models/Car');

// Get all cars
const getAllCars = async (req, res) => {
    try {
        const cars = await Car.find();
        res.status(200).json(cars);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch cars', details: err.message });
    }
};

// Add a new car
const addCar = async (req, res) => {
    try {
        const { make, model, year, pricePerDay, availabilityStatus, image } = req.body;

        // Validate request data
        if (!make || !model || !year || !pricePerDay || availabilityStatus === undefined) {
            return res.status(400).json({ error: 'Missing required car details' });
        }

        const car = new Car({
            make,
            model,
            year,
            pricePerDay,
            availabilityStatus,
            image,
        });
        await car.save();

        res.status(201).json({ message: 'Car added successfully', car });
    } catch (err) {
        res.status(500).json({ error: 'Failed to add car', details: err.message });
    }
};

module.exports = { getAllCars, addCar };