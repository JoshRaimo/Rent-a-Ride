const express = require('express');
const axios = require('axios');
const router = express.Router();

// Variable to store the current JWT and its expiration time
let jwtToken = process.env.CAR_API_JWT || null;
let tokenExpiration = null;

// Function to check and refresh token if needed
const checkAndRefreshToken = async () => {
    try {
        // If token is expired or will expire in the next 24 hours
        if (!jwtToken || !tokenExpiration || tokenExpiration - Date.now() < 24 * 60 * 60 * 1000) {
            const response = await axios.post('https://carapi.app/api/auth/login', {
                api_token: process.env.CAR_API_KEY,
                api_secret: process.env.CAR_API_SECRET,
            });

            jwtToken = response.data.jwt;
            // Set expiration to 30 days from now
            tokenExpiration = Date.now() + (30 * 24 * 60 * 60 * 1000);
            console.log('JWT token refreshed automatically');
        }
    } catch (error) {
        console.error('Error refreshing JWT:', error.message);
    }
};

// Middleware to check token before each request
router.use(async (req, res, next) => {
    await checkAndRefreshToken();
    next();
});

/**
 * Route to manually update the JWT
 * Request Body: { jwt: "new-token" }
 */
router.post('/update-jwt', (req, res) => {
    const { jwt } = req.body;

    if (!jwt) {
        return res.status(400).json({ error: 'JWT is required.' });
    }

    jwtToken = jwt;
    tokenExpiration = Date.now() + (30 * 24 * 60 * 60 * 1000); // Set expiration to 30 days
    console.log('JWT updated manually:', jwt);
    res.status(200).json({ message: 'JWT updated successfully.' });
});

/**
 * Route to generate a new JWT (calls CarAPI's login endpoint)
 */
router.post('/generate-jwt', async (req, res) => {
    try {
        const response = await axios.post('https://carapi.app/api/auth/login', {
            api_token: process.env.CAR_API_KEY,
            api_secret: process.env.CAR_API_SECRET,
        });

        jwtToken = response.data.jwt;
        tokenExpiration = Date.now() + (30 * 24 * 60 * 60 * 1000); // Set expiration to 30 days

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
router.get('/get-jwt', async (req, res) => {
    await checkAndRefreshToken();
    
    if (!jwtToken) {
        return res.status(404).json({ error: 'JWT not found. Generate or update one.' });
    }
    res.status(200).json({ jwt: jwtToken });
});

module.exports = router;