const express = require('express');
const { getAllCars, addCar, updateCar, deleteCar, getAvailableCars } = require('../controllers/carController');
const { validateCarRequest } = require('../middleware/carValidator');
const router = express.Router();

// Fetch all cars
router.get('/', getAllCars);

// Fetch available cars based on date range
router.get('/available', getAvailableCars);

// Add a new car
router.post('/', validateCarRequest, addCar);

// Update a car by ID
router.put('/:id', validateCarRequest, updateCar);

// Delete a car by ID (Let the controller handle image deletion)
router.delete('/:id', deleteCar);

module.exports = router;