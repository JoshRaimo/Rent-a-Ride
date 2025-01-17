const express = require('express');
const axios = require('axios');
const router = express.Router();

// Variable to store the generated JWT
let jwtToken = null;

// Route to generate JWT
router.post('/generate-jwt', async (req, res) => {
    try {
        const response = await axios.post('https://carapi.app/api/auth/login', {
            api_token: process.env.CAR_API_KEY, // API Token
            api_secret: process.env.CAR_API_SECRET, // API Secret
        });

        // Log the response for debugging
        console.log('JWT Response:', response.data);

        // Save the JWT for reuse
        jwtToken = response.data.jwt;

        // Send the JWT in the response
        res.status(200).json({ jwt: jwtToken });
    } catch (error) {
        console.error('Error generating JWT:', error.response?.data || error.message);
        res.status(500).json({
            error: 'Failed to generate JWT',
            details: error.response?.data || error.message, // Send more error details for debugging
        });
    }
});

// Route to get the saved JWT
router.get('/get-jwt', (req, res) => {
    if (!jwtToken) {
        return res.status(404).json({ error: 'JWT not found. Generate a new one.' });
    }
    res.status(200).json({ jwt: jwtToken });
});

// Middleware to check JWT expiration and refresh if needed (optional)
router.use(async (req, res, next) => {
    if (!jwtToken) {
        console.warn('JWT not available. Generate it first.');
        return res.status(401).json({ error: 'JWT not available. Please generate it first.' });
    }
    // Optionally, add logic to verify JWT expiration here
    next();
});

module.exports = router;