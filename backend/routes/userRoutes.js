const express = require('express');
const bcrypt = require('bcrypt');
const { authenticate } = require('../middleware/authMiddleware');
const { getAllUsers, resetUserPassword, deleteUser } = require('../controllers/userController');
const User = require('../models/User');

const router = express.Router();

// Get all users
router.get('/', getAllUsers);

// Get user profile
router.get('/profile', authenticate, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password'); // Exclude password
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(user);
    } catch (error) {
        console.error('Error fetching profile:', error.message);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Update user profile
router.put('/profile', authenticate, async (req, res) => {
    try {
        const user = await User.findById(req.user.id); // Fetch user by ID
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Extract updated fields from the request body
        const { username, email } = req.body;

        if (username) user.username = username;
        if (email) user.email = email;

        // Save updated user
        await user.save();

        res.status(200).json({ message: 'Profile updated successfully', user });
    } catch (error) {
        console.error('Error updating profile:', error.message);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Update user password
router.put('/change-password', authenticate, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Please provide current and new password.' });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Validate current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Current password is incorrect.' });
        }

        // Update to new hashed password
        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Error updating password:', error.message);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// User Management
router.patch('/users/:id/reset-password', resetUserPassword);
router.delete('/users/:id', deleteUser);

module.exports = router;