const express = require('express');
const { body } = require('express-validator');
const { getAllCars, addCar } = require('../controllers/carController');
const authenticateToken = require('../middleware/authMiddleware'); // If authentication is required
const router = express.Router();

// Routes for cars
router.get('/', getAllCars);

router.post(
    '/',
    [
        body('make').notEmpty().withMessage('Make is required'),
        body('model').notEmpty().withMessage('Model is required'),
        body('year').isNumeric().withMessage('Year must be a number'),
        body('pricePerDay').isFloat({ gt: 0 }).withMessage('Price per day must be greater than 0'),
        body('availabilityStatus').isBoolean().withMessage('Availability status must be true or false'),
    ],
    addCar
);

// Default route for cars to catch errors
router.use((req, res) => {
    res.status(404).json({ error: 'Car route not found' });
});

module.exports = router;