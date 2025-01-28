const express = require('express');
const axios = require('axios');
const router = express.Router();

// Variable to store the current JWT
let jwtToken = process.env.CAR_API_JWT || null; // Initialize from environment variables if available

/**
 * Route to manually update the JWT
 * Request Body: { jwt: "new-token" }
 */
router.post('/update-jwt', (req, res) => {
    const { jwt } = req.body;

    if (!jwt) {
        return res.status(400).json({ error: 'JWT is required.' });
    }

    jwtToken = jwt; // Update the stored JWT
    console.log('JWT updated manually:', jwt);
    res.status(200).json({ message: 'JWT updated successfully.' });
});

/**
 * Route to generate a new JWT (calls CarAPI's login endpoint)
 */
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
            details: error.response?.data || error.message,
        });
    }
});

/**
 * Route to retrieve the current JWT
 */
router.get('/get-jwt', (req, res) => {
    if (!jwtToken) {
        return res.status(404).json({ error: 'JWT not found. Generate or update one.' });
    }
    res.status(200).json({ jwt: jwtToken });
});

/**
 * Middleware to check if a JWT exists (optional)
 */
router.use((req, res, next) => {
    if (!jwtToken) {
        console.warn('JWT not available. Please generate or update it first.');
        return res.status(401).json({ error: 'JWT not available. Please generate or update it first.' });
    }
    next();
});

module.exports = router;