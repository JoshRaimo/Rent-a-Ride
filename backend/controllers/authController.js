const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// User registration
const registerUser = async (req, res) => {
    try {
        const { username, email, password, role } = req.body;

        console.log('Register Request Body:', req.body);

        // Validate input fields
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Check if email is already registered
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email is already registered' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user
        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            role: role || 'user', // Default role
        });

        await newUser.save();

        res.status(201).json({
            message: 'User registered successfully',
            user: {
                _id: newUser._id,
                username: newUser.username,
                email: newUser.email,
                role: newUser.role,
            },
        });
    } catch (err) {
        console.error('Registration Error:', err.message);
        res.status(500).json({ error: 'Failed to register user', details: err.message });
    }
};

// User login
const loginUser = async (req, res) => {
    try {
        console.log('Login Request Body:', req.body);

        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        // Validate password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        // Generate JWT with username included
        const token = jwt.sign(
            { id: user._id, username: user.username, email: user.email, role: user.role }, // Include username here
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        console.log('Login Successful:', { username: user.username, email: user.email });

        // Send response
        return res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                _id: user._id,
                username: user.username, // Include username
                email: user.email,
                role: user.role,
            },
        });
    } catch (err) {
        console.error('Login Error:', err.message);
        return res.status(500).json({ message: 'Server error during login', error: err.message });
    }
};

module.exports = { registerUser, loginUser };