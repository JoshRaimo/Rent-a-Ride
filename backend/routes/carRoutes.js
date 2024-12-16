const express = require('express');
const { body, validationResult } = require('express-validator');
const { getAllCars, addCar } = require('../controllers/carController');
const { authenticate } = require('../middleware/authMiddleware'); // Updated for token authentication
const router = express.Router();

// Get all cars
router.get('/', getAllCars);

// Add a new car (Admin only)
router.post(
    '/add',
    [
        authenticate, // Ensure the user is authenticated
        body('make').notEmpty().withMessage('Make is required'),
        body('model').notEmpty().withMessage('Model is required'),
        body('year').isNumeric().withMessage('Year must be a number'),
        body('price_per_day').isFloat({ gt: 0 }).withMessage('Price per day must be greater than 0'),
        body('availabilityStatus').optional().isBoolean().withMessage('Availability status must be true or false'),
    ],
    async (req, res) => {
        try {
            // Check if the user is an admin
            if (req.user.role !== 'admin') {
                return res.status(403).json({ message: 'Access denied. Admins only.' });
            }

            // Validate request body
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            // Call the controller function to add a new car
            const car = await addCar(req.body);
            res.status(201).json({ message: 'Car added successfully', car });
        } catch (error) {
            console.error('Error adding car:', error.message);
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    }
);

// Default route for cars to catch errors
router.use((req, res) => {
    res.status(404).json({ error: 'Car route not found' });
});

module.exports = router;