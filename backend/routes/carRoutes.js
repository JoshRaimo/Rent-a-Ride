const express = require('express');
const { getAllCars, addCar, updateCar, deleteCar, getAvailableCars, getYearRange, getPriceRange } = require('../controllers/carController');
const { validateCarRequest } = require('../middleware/carValidator');
const { cacheAvailableCars, cacheCarDetails, cacheYearRange, cachePriceRange, invalidateCache } = require('../middleware/simpleCache');
const router = express.Router();

// Fetch all cars
router.get('/', getAllCars);

// Fetch available cars based on date range (cached for 5 minutes)
router.get('/available', cacheAvailableCars, getAvailableCars);

// Get year range (oldest and newest car years) - cached for 24 hours
router.get('/year-range', cacheYearRange, getYearRange);

// Get price range (minimum and maximum car prices) - cached for 1 hour
router.get('/price-range', cachePriceRange, getPriceRange);

// Add a new car (invalidate car-related cache)
router.post('/', validateCarRequest, invalidateCache(['/api/cars/available', '/api/cars/year-range', '/api/cars/price-range']), addCar);

// Update a car by ID (invalidate car-related cache)
router.put('/:id', validateCarRequest, invalidateCache(['/api/cars/available', '/api/cars/year-range', '/api/cars/price-range']), updateCar);

// Delete a car by ID (invalidate car-related cache)
router.delete('/:id', invalidateCache(['/api/cars/available', '/api/cars/year-range', '/api/cars/price-range']), deleteCar);

module.exports = router;