const jwt = require('jsonwebtoken');

// Authentication middleware
const authenticate = (req, res, next) => {
    const authHeader = req.header('Authorization');

    // Log the Authorization header (only in development for debugging)
    if (process.env.NODE_ENV === 'development') {
        console.log('Authorization Header:', authHeader);
    }

    // Validate Authorization header existence
    if (!authHeader) {
        return res.status(401).json({ message: 'Authorization header is missing.' });
    }

    // Validate Authorization format
    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
        return res
            .status(401)
            .json({ message: 'Invalid authorization format. Use Bearer <token>.' });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Attach decoded payload to `req.user`

        // Optional: Log decoded token in development mode
        if (process.env.NODE_ENV === 'development') {
            console.log('Decoded Token:', decoded);
        }

        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            console.error('JWT Expired:', err.message);
            return res.status(401).json({ message: 'Token has expired. Please log in again.' });
        } else if (err.name === 'JsonWebTokenError') {
            console.error('JWT Malformed:', err.message);
            return res.status(400).json({ message: 'Invalid token.' });
        } else {
            console.error('JWT Verification Error:', err.message);
            return res.status(403).json({ message: 'Failed to authenticate token.' });
        }
    }
};

module.exports = { authenticate };