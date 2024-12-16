const express = require('express');
const { body, validationResult } = require('express-validator');
const { getAllCars, addCar } = require('../controllers/carController');
const { authenticate } = require('../middleware/authMiddleware');

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
        body('year')
            .isNumeric()
            .withMessage('Year must be a number')
            .custom((value) => {
                const currentYear = new Date().getFullYear();
                if (value < 1886 || value > currentYear + 1) {
                    throw new Error(`Year must be between 1886 and ${currentYear + 1}.`);
                }
                return true;
            }),
        body('pricePerDay').isFloat({ gt: 0 }).withMessage('Price per day must be greater than 0'),
        body('availabilityStatus')
            .optional()
            .isBoolean()
            .withMessage('Availability status must be true or false'),
        body('image').optional().isString().withMessage('Image URL must be a string'),
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
            const carData = req.body;
            const car = await addCar(carData);
            return res.status(201).json({ message: 'Car added successfully', car });
        } catch (error) {
            console.error('Error adding car:', error.message);
            return res.status(500).json({ message: 'Failed to add car', error: error.message });
        }
    }
);

// Default route for cars to catch errors
router.use((req, res) => {
    res.status(404).json({ error: 'Car route not found' });
});

module.exports = router;