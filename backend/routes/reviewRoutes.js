const express = require('express');
const router = express.Router();
const {
    createReview,
    getCarReviews,
    getUserReviews,
    canReviewBooking,
    getAllReviews,
    deleteReview,
    getReviewsByBooking
} = require('../controllers/reviewController');
const { authenticate, authorizeAdmin } = require('../middleware/authMiddleware');

// User routes (require authentication)
router.post('/', authenticate, createReview);
router.get('/my-reviews', authenticate, getUserReviews);
router.get('/can-review/:bookingId', authenticate, canReviewBooking);

// Public routes (no authentication required)
router.get('/car/:carId', getCarReviews);

// Admin routes (require admin privileges)
router.get('/admin/all', authenticate, authorizeAdmin, getAllReviews);
router.delete('/admin/:reviewId', authenticate, authorizeAdmin, deleteReview);

// Get reviews by booking ID (admin only)
router.get('/booking/:bookingId', authenticate, authorizeAdmin, getReviewsByBooking);

module.exports = router;
