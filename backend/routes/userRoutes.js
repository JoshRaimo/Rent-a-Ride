const express = require('express');
const { authenticate } = require('../middleware/authMiddleware');
const { 
    getAllUsers, 
    getUserProfile, 
    updateUserProfile, 
    changePassword, 
    resetUserPassword, 
    deleteUser 
} = require('../controllers/userController');

const router = express.Router();

// User Profile Routes
router.get('/profile', authenticate, getUserProfile);
router.put('/profile', authenticate, updateUserProfile);
router.put('/change-password', authenticate, changePassword);

// User Management Routes
router.get('/', getAllUsers);
router.patch('/:id/reset-password', resetUserPassword);
router.delete('/:id', deleteUser);

module.exports = router;