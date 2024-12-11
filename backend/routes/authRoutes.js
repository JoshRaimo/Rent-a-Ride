const express = require('express');
const { registerUser, loginUser } = require('../controllers/authController');
const router = express.Router();

// Test GET route for auth
router.get('/', (req, res) => {
    res.status(200).json({ message: 'Auth route is working' });
});

// Routes for user authentication
router.post('/register', registerUser);
router.post('/login', loginUser);

// Error handler for unsupported routes in /api/auth
router.use((req, res) => {
    res.status(404).json({ error: 'Auth route not found' });
});

module.exports = router;