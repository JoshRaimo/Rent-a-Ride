const express = require('express');
const { authenticate, authorizeAdmin } = require('../middleware/authMiddleware');
const { getUserCount, getCarCount, getBookingCount } = require('../controllers/statsController');

const router = express.Router();

// Fetch stats (Admins only)
router.get('/users/count', authenticate, authorizeAdmin, getUserCount);
router.get('/cars/count', authenticate, authorizeAdmin, getCarCount);
router.get('/bookings/count', authenticate, authorizeAdmin, getBookingCount);

module.exports = router;