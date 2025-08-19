import React, { useState } from 'react';
import { Star, Send, X } from 'lucide-react';
import StarRating from './StarRating';
import { useToast } from '../hooks/useToast';
import axios from 'axios';

const ReviewForm = ({ booking, onReviewSubmitted, onCancel }) => {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (rating === 0) {
            toast.error('Please select a rating', {
                title: 'Rating Required'
            });
            return;
        }



        if (comment.length > 1000) {
            toast.error('Comment must be less than 1000 characters', {
                title: 'Comment Too Long'
            });
            return;
        }

        setIsSubmitting(true);

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `${process.env.REACT_APP_API_URL}/reviews`,
                {
                    bookingId: booking._id,
                    rating,
                    comment: comment.trim()
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            toast.success('Review submitted successfully!', {
                title: 'Thank you for your feedback!'
            });
            
            if (onReviewSubmitted) {
                onReviewSubmitted(response.data.review);
            }

            // Reset form
            setRating(0);
            setComment('');

        } catch (error) {
            console.error('Error submitting review:', error);
            const errorMessage = error.response?.data?.message || 'Failed to submit review';
            toast.error(errorMessage, {
                title: 'Submission Failed'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRatingChange = (newRating) => {
        setRating(newRating);
    };

    return (
        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">
                    Write a Review
                </h3>
                {onCancel && (
                    <button
                        onClick={onCancel}
                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        type="button"
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* Car Info */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                    {booking.car?.image && (
                        <img
                            src={booking.car.image}
                            alt={`${booking.car.make} ${booking.car.model}`}
                            className="w-16 h-16 object-cover rounded-lg"
                        />
                    )}
                    <div>
                        <h4 className="font-semibold text-lg text-gray-900">
                            {booking.car?.year} {booking.car?.make} {booking.car?.model}
                        </h4>
                        <p className="text-gray-600">
                            Rental Period: {new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                {/* Rating */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Your Rating *
                    </label>
                    <div className="flex items-center gap-4">
                        <StarRating
                            rating={rating}
                            onRatingChange={handleRatingChange}
                            interactive={true}
                            size="lg"
                        />
                        <span className="text-sm text-gray-600">
                            {rating === 0 && 'Click to rate'}
                            {rating === 1 && 'Poor'}
                            {rating === 2 && 'Fair'}
                            {rating === 3 && 'Good'}
                            {rating === 4 && 'Very Good'}
                            {rating === 5 && 'Excellent'}
                        </span>
                    </div>
                </div>

                {/* Comment */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Your Review (Optional)
                    </label>
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Share your experience with this car. How was the condition, performance, and overall rental experience? (Optional)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical min-h-[120px]"
                        maxLength={1000}
                    />
                    <div className="flex justify-between items-center mt-2">
                        <p className="text-sm text-gray-500">
                            Share details about the car's condition, cleanliness, performance, and your overall experience.
                        </p>
                        <span className={`text-sm ${comment.length > 900 ? 'text-red-500' : 'text-gray-400'}`}>
                            {comment.length}/1000
                        </span>
                    </div>
                </div>

                {/* Submit Button */}
                <div className="flex items-center justify-end gap-3">
                    {onCancel && (
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                    )}
                    <button
                        type="submit"
                        disabled={isSubmitting || rating === 0}
                        className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send className="w-4 h-4" />
                        {isSubmitting ? 'Submitting...' : 'Submit Review'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ReviewForm;
