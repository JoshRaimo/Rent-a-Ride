const jwt = require('jsonwebtoken');

// Authentication middleware
const authenticate = (req, res, next) => {
    const authHeader = req.header('Authorization');

    // Log the authentication scheme (only in development)
    if (process.env.NODE_ENV === 'development') {
        console.log('Auth Header:', authHeader ? authHeader.split(' ')[0] : 'None');
    }

    // Ensure Authorization header exists
    if (!authHeader) {
        return res.status(401).json({ message: 'Authorization header is missing.' });
    }

    const parts = authHeader.split(' ');

    // Validate Bearer format
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return res.status(401).json({ message: 'Invalid authorization format. Use Bearer <token>.' });
    }

    const token = parts[1];

    // Ensure JWT secret is set
    if (!process.env.JWT_SECRET) {
        console.error('JWT_SECRET is missing from environment variables.');
        return res.status(500).json({ message: 'Internal server error: Missing JWT secret.' });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Attach decoded token payload to req.user

        // Optional: Log token details without exposing sensitive data
        if (process.env.NODE_ENV === 'development') {
            console.log('Decoded Token:', {
                id: decoded.id,
                email: decoded.email, // Assuming token payload includes email
                role: decoded.role,
                exp: new Date(decoded.exp * 1000) // Convert UNIX timestamp to readable date
            });
        }

        next();
    } catch (err) {
        console.error('JWT Verification Error:', err.message);

        if (err.name === 'TokenExpiredError') {
            return res.status(403).json({ message: 'Token has expired. Please log in again.' });
        } else if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Invalid token. Please log in again.' });
        } else {
            return res.status(500).json({ message: 'Authentication error.' });
        }
    }
};

const authorizeAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Admins only.' });
    }
    next();
};

module.exports = { authenticate, authorizeAdmin };