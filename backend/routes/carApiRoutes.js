const express = require('express');
const axios = require('axios');
const router = express.Router();

/**
 * Middleware to validate the Authorization header and extract JWT
 */
const validateAuthorizationHeader = (req, res, next) => {
    const authorizationHeader = req.headers.authorization;
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authorization header is missing or invalid.' });
    }
    req.jwt = authorizationHeader.split(' ')[1]; // Extract JWT
    next();
};

/**
 * Route to fetch car makes
 * Optional query parameters: page, limit
 */
router.get('/makes', validateAuthorizationHeader, async (req, res) => {
    try {
        const { page = 1, limit = 1000 } = req.query; // Optional pagination parameters
        const response = await axios.get('https://carapi.app/api/makes', {
            headers: {
                Authorization: `Bearer ${req.jwt}`,
            },
            params: { page, limit }, // Pass pagination if needed
        });
        res.status(200).json(response.data);
    } catch (error) {
        console.error('Error fetching car makes:', {
            message: error.message,
            data: error.response?.data,
            headers: error.response?.headers,
        });
        res.status(500).json({
            error: 'Failed to fetch car makes',
            details: error.response?.data || error.message,
        });
    }
});

/**
 * Route to fetch car models for a specific make
 * Query Parameter: make (required)
 */
router.get('/models', validateAuthorizationHeader, async (req, res) => {
    const { make } = req.query;
    if (!make) {
        return res.status(400).json({ error: 'Make query parameter is required.' });
    }

    try {
        const response = await axios.get('https://carapi.app/api/models', {
            headers: {
                Authorization: `Bearer ${req.jwt}`,
            },
            params: { make },
        });
        res.status(200).json(response.data);
    } catch (error) {
        console.error('Error fetching car models:', {
            message: error.message,
            data: error.response?.data,
            headers: error.response?.headers,
        });
        res.status(500).json({
            error: 'Failed to fetch car models',
            details: error.response?.data || error.message,
        });
    }
});

/**
 * Route to fetch car years for a specific make and model
 * Query Parameters: make (required), model (required)
 */
router.get('/years', validateAuthorizationHeader, async (req, res) => {
    const { make, model } = req.query;

    // Ensure both make and model are provided
    if (!make || !model) {
        return res.status(400).json({ error: 'Both make and model query parameters are required.' });
    }

    try {
        const response = await axios.get('https://carapi.app/api/years', {
            headers: {
                Authorization: `Bearer ${req.jwt}`,
            },
            params: { make, model },
        });
        res.status(200).json(response.data); // Return the list of years
    } catch (error) {
        console.error('Error fetching car years:', {
            message: error.message,
            data: error.response?.data,
            headers: error.response?.headers,
        });
        res.status(500).json({
            error: 'Failed to fetch car years',
            details: error.response?.data || error.message,
        });
    }
});

module.exports = router;