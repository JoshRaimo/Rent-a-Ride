const express = require('express');
const { registerUser, loginUser, validateRegistration, validateLogin } = require('../controllers/authController');
const router = express.Router();

// Test GET route for auth
router.get('/', (req, res) => {
    res.status(200).json({ message: 'Auth route is working' });
});

// Routes for user authentication with validation middleware
router.post('/register', validateRegistration, registerUser);
router.post('/login', validateLogin, loginUser);

// Test POST route
router.post('/test', (req, res) => {
    console.log('Test Route Body:', req.body); // Log the request body
    res.status(200).json({ message: 'Test successful', body: req.body });
});

// Error handler for unsupported routes in /api/auth
router.use((req, res) => {
    res.status(404).json({ error: 'Auth route not found' });
});

module.exports = router;