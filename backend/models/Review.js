const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    car: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Car',
        required: true
    },
    booking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        required: false,
        maxlength: 1000,
        default: ''
    },
    reviewDate: {
        type: Date,
        default: Date.now
    },
    // Prevent duplicate reviews for the same booking
    isVerifiedRental: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Compound index to ensure one review per booking
reviewSchema.index({ booking: 1 }, { unique: true });

// Index for efficient querying
reviewSchema.index({ car: 1, createdAt: -1 });
reviewSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Review', reviewSchema);
