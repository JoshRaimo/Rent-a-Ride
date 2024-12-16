const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
    // Log the Authorization header
    const authHeader = req.header('Authorization');
    console.log('Authorization Header:', authHeader);

    if (!authHeader) {
        return res.status(401).json({ message: 'Authorization header is missing.' });
    }

    // Validate the format of the Authorization header
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return res.status(401).json({ message: 'Authorization header must be in the format: Bearer <token>' });
    }

    const token = parts[1];
    console.log('Extracted Token:', token);

    try {
        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Attach decoded user info to request
        next();
    } catch (err) {
        console.error('JWT Verification Error:', err.message);
        res.status(400).json({ message: 'Invalid token.' });
    }
};

module.exports = { authenticate };