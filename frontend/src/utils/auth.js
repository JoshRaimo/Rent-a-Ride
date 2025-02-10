import { jwtDecode } from 'jwt-decode';

// Get the token from localStorage
export const getToken = () => localStorage.getItem('token');

// Save the token to localStorage
export const setToken = (token) => localStorage.setItem('token', token);

// Remove the token from localStorage
export const removeToken = () => localStorage.removeItem('token');

// Decode the token to get user data
export const decodeToken = () => {
    const token = getToken();
    if (!token) return null;

    try {
        return jwtDecode(token); // Decode the token using jwt-decode
    } catch (error) {
        console.error('Failed to decode token:', error.message);
        removeToken(); // Remove invalid token
        return null;
    }
};

// Check if the token is expired
export const isTokenExpired = () => {
    const decoded = decodeToken();
    if (!decoded) return true;

    const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
    return decoded.exp < currentTime; // Check if token expiration is in the past
};

// Logout function (clears token and redirects)
export const logout = (navigate) => {
    removeToken();
    localStorage.removeItem('user');
    if (navigate) navigate('/login'); // Redirect to login page if navigate is passed
};