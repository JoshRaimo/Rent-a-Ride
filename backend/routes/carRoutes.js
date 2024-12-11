const express = require('express');
const { getAllCars, addCar } = require('../controllers/carController');
const router = express.Router();

// Routes for cars
router.get('/', getAllCars);
router.post('/', addCar);

// Default route for cars to catch errors
router.use((req, res) => {
    res.status(404).json({ error: 'Car route not found' });
});

module.exports = router;