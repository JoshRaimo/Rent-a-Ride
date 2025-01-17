const express = require('express');
const axios = require('axios');
const router = express.Router();

// Route to fetch car makes
router.get('/makes', async (req, res) => {
    try {
        const response = await axios.get('https://carapi.app/api/makes', {
            headers: {
                Authorization: req.headers.authorization,
            },
        });
        res.status(200).json(response.data);
    } catch (error) {
        console.error('Error fetching car makes:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to fetch car makes' });
    }
});

// Route to fetch car models for a specific make
router.get('/models', async (req, res) => {
    const { make } = req.query; // Get the make from query parameters
    if (!make) {
        return res.status(400).json({ error: 'Make is required' });
    }

    try {
        const jwt = req.headers.authorization?.split(' ')[1]; // Extract JWT from Authorization header
        if (!jwt) {
            return res.status(401).json({ error: 'JWT token is missing. Please provide a valid token.' });
        }

        const response = await axios.get(`https://carapi.app/api/models?make=${make}`, {
            headers: {
                Authorization: `Bearer ${jwt}`, // Use the provided JWT
            },
        });
        res.status(200).json(response.data); // Send the response to the frontend
    } catch (error) {
        console.error('Error fetching car models:', {
            message: error.message,
            data: error.response?.data,
            headers: error.response?.headers,
        });
        res.status(500).json({
            error: 'Failed to fetch car models',
            details: error.response?.data || error.message, // Provide detailed error information
        });
    }
});

module.exports = router;