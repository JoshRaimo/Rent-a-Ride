const axios = require('axios');

// Create axios client with a dynamic Authorization header
const carApiClient = axios.create({
    baseURL: 'https://carapi.app/api',
});

// Add a request interceptor to dynamically set the Authorization header
carApiClient.interceptors.request.use((config) => {
    const jwt = process.env.CAR_API_KEY; // Retrieve API key (or JWT)
    if (jwt) {
        config.headers.Authorization = `Bearer ${jwt}`;
    }
    return config;
});

// Validate CAR_API_KEY availability
if (!process.env.CAR_API_KEY) {
    console.error('CAR_API_KEY is missing. Please add it to your .env file.');
    throw new Error('Missing CAR_API_KEY');
}

/**
 * Fetch car makes from CarAPI
 */
const fetchCarMakes = async () => {
    try {
        const response = await carApiClient.get('/makes');
        return response.data;
    } catch (error) {
        console.error('Error fetching car makes:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
            headers: error.response?.headers,
        });
        throw new Error('Failed to fetch car makes');
    }
};

/**
 * Fetch car models for a specific make
 * @param {string} make - The car make (e.g., "Toyota").
 */
const fetchCarModels = async (make) => {
    try {
        const response = await carApiClient.get('/models', {
            params: { make },
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching car models:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
            headers: error.response?.headers,
        });
        throw new Error('Failed to fetch car models');
    }
};

module.exports = { fetchCarMakes, fetchCarModels };