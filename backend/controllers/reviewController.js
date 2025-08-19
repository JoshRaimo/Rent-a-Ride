const Review = require('../models/Review');
const Car = require('../models/Car');
const Booking = require('../models/Booking');
const User = require('../models/User');

// Create a new review
const createReview = async (req, res) => {
    try {
        const { bookingId, rating, comment } = req.body;
        const userId = req.user.id;

        // Validate input
        if (!bookingId || !rating) {
            return res.status(400).json({ message: 'Booking ID and rating are required' });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'Rating must be between 1 and 5' });
        }

        if (comment && comment.length > 1000) {
            return res.status(400).json({ message: 'Comment must be less than 1000 characters' });
        }

        // Check if booking exists and belongs to the user
        const booking = await Booking.findById(bookingId).populate('car');
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        if (booking.user.toString() !== userId) {
            return res.status(403).json({ message: 'You can only review your own bookings' });
        }

        // Check if booking is completed
        if (booking.status !== 'completed') {
            return res.status(400).json({ message: 'You can only review completed bookings' });
        }

        // Check if review already exists for this booking
        const existingReview = await Review.findOne({ booking: bookingId });
        if (existingReview) {
            return res.status(400).json({ message: 'You have already reviewed this booking' });
        }

        // Create the review
        const review = new Review({
            user: userId,
            car: booking.car._id,
            booking: bookingId,
            rating,
            comment
        });

        await review.save();

        // Update car's rating statistics
        await updateCarRating(booking.car._id);

        // Populate the review with user and car details for response
        const populatedReview = await Review.findById(review._id)
            .populate('user', 'username email')
            .populate('car', 'make model year');

        res.status(201).json({
            message: 'Review created successfully',
            review: populatedReview
        });

    } catch (error) {
        console.error('Error creating review:', error);
        res.status(500).json({ message: 'Failed to create review', error: error.message });
    }
};

// Get reviews for a specific car
const getCarReviews = async (req, res) => {
    try {
        const { carId } = req.params;
        const { page = 1, limit = 10, sort = 'newest' } = req.query;

        // Validate car exists
        const car = await Car.findById(carId);
        if (!car) {
            return res.status(404).json({ message: 'Car not found' });
        }

        // Determine sort order
        let sortOrder = { createdAt: -1 }; // newest first
        if (sort === 'oldest') {
            sortOrder = { createdAt: 1 };
        } else if (sort === 'highest') {
            sortOrder = { rating: -1, createdAt: -1 };
        } else if (sort === 'lowest') {
            sortOrder = { rating: 1, createdAt: -1 };
        }

        const reviews = await Review.find({ car: carId })
            .populate('user', 'username profilePicture')
            .sort(sortOrder)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .lean();

        const totalReviews = await Review.countDocuments({ car: carId });

        // Calculate rating distribution
        const ratingDistribution = await Review.aggregate([
            { $match: { car: car._id } },
            {
                $group: {
                    _id: '$rating',
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: -1 } }
        ]);

        res.json({
            reviews,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalReviews / limit),
                totalReviews,
                hasMore: page * limit < totalReviews
            },
            carRating: {
                averageRating: car.averageRating,
                reviewCount: car.reviewCount,
                ratingDistribution
            }
        });

    } catch (error) {
        console.error('Error fetching car reviews:', error);
        res.status(500).json({ message: 'Failed to fetch reviews', error: error.message });
    }
};

// Get reviews by a specific user
const getUserReviews = async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 10 } = req.query;

        const reviews = await Review.find({ user: userId })
            .populate('car', 'make model year image averageRating')
            .populate('booking', 'startDate endDate totalPrice status')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .lean();

        const totalReviews = await Review.countDocuments({ user: userId });

        res.json({
            reviews,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalReviews / limit),
                totalReviews,
                hasMore: page * limit < totalReviews
            }
        });

    } catch (error) {
        console.error('Error fetching user reviews:', error);
        res.status(500).json({ message: 'Failed to fetch user reviews', error: error.message });
    }
};

// Check if user can review a booking
const canReviewBooking = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const userId = req.user.id;

        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        if (booking.user.toString() !== userId) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const canReview = booking.status === 'completed';
        const existingReview = await Review.findOne({ booking: bookingId });

        res.json({
            canReview,
            hasReviewed: !!existingReview,
            bookingStatus: booking.status
        });

    } catch (error) {
        console.error('Error checking review eligibility:', error);
        res.status(500).json({ message: 'Failed to check review eligibility', error: error.message });
    }
};

// Update car rating statistics
const updateCarRating = async (carId) => {
    try {
        const reviews = await Review.find({ car: carId });
        
        if (reviews.length === 0) {
            // No reviews, reset to defaults
            await Car.findByIdAndUpdate(carId, {
                averageRating: 0,
                reviewCount: 0,
                totalRatingPoints: 0
            });
            return;
        }

        const totalRatingPoints = reviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = totalRatingPoints / reviews.length;

        await Car.findByIdAndUpdate(carId, {
            averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
            reviewCount: reviews.length,
            totalRatingPoints
        });

    } catch (error) {
        console.error('Error updating car rating:', error);
        throw error;
    }
};

// Admin: Get all reviews with filters
const getAllReviews = async (req, res) => {
    try {
        const { page = 1, limit = 20, rating, carId, userId, sort = 'newest' } = req.query;

        // Build filter object
        const filter = {};
        if (rating) filter.rating = parseInt(rating);
        if (carId) filter.car = carId;
        if (userId) filter.user = userId;

        // Determine sort order
        let sortOrder = { createdAt: -1 };
        if (sort === 'oldest') {
            sortOrder = { createdAt: 1 };
        } else if (sort === 'highest') {
            sortOrder = { rating: -1, createdAt: -1 };
        } else if (sort === 'lowest') {
            sortOrder = { rating: 1, createdAt: -1 };
        }

        const reviews = await Review.find(filter)
            .populate('user', 'username email profilePicture')
            .populate('car', 'make model year image')
            .populate('booking', 'startDate endDate totalPrice')
            .sort(sortOrder)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .lean();

        const totalReviews = await Review.countDocuments(filter);

        // Get review statistics
        const stats = await Review.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: null,
                    averageRating: { $avg: '$rating' },
                    totalReviews: { $sum: 1 },
                    ratingDistribution: {
                        $push: '$rating'
                    }
                }
            }
        ]);

        const ratingCounts = stats[0]?.ratingDistribution.reduce((acc, rating) => {
            acc[rating] = (acc[rating] || 0) + 1;
            return acc;
        }, {}) || {};

        res.json({
            reviews,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalReviews / limit),
                totalReviews,
                hasMore: page * limit < totalReviews
            },
            stats: {
                averageRating: stats[0]?.averageRating || 0,
                totalReviews: stats[0]?.totalReviews || 0,
                ratingDistribution: ratingCounts
            }
        });

    } catch (error) {
        console.error('Error fetching all reviews:', error);
        res.status(500).json({ message: 'Failed to fetch reviews', error: error.message });
    }
};

// Admin: Delete a review
const deleteReview = async (req, res) => {
    try {
        const { reviewId } = req.params;

        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        const carId = review.car;
        
        // Delete the review
        await Review.findByIdAndDelete(reviewId);

        // Update car rating statistics
        await updateCarRating(carId);

        res.json({ message: 'Review deleted successfully' });

    } catch (error) {
        console.error('Error deleting review:', error);
        res.status(500).json({ message: 'Failed to delete review', error: error.message });
    }
};

module.exports = {
    createReview,
    getCarReviews,
    getUserReviews,
    canReviewBooking,
    getAllReviews,
    deleteReview,
    updateCarRating
};
