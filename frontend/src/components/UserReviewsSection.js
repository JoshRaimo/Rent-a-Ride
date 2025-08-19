import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, Calendar, Car, Edit, Trash2, DollarSign } from 'lucide-react';
import axios from 'axios';
import { useToast } from '../hooks/useToast';
import StarRating from './StarRating';
import ReviewForm from './ReviewForm';

const UserReviewsSection = ({ user }) => {
    const [reviews, setReviews] = useState([]);
    const [completedBookings, setCompletedBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [activeTab, setActiveTab] = useState('reviews'); // 'reviews' or 'pending'
    
    const { toast } = useToast();

    useEffect(() => {
        fetchUserReviews();
        fetchCompletedBookings();
    }, []);

    const fetchUserReviews = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `${process.env.REACT_APP_API_URL}/reviews/my-reviews`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            setReviews(response.data.reviews);
        } catch (error) {
            console.error('Error fetching user reviews:', error);
            toast.error('Failed to load your reviews', {
                title: 'Loading Error'
            });
        }
    };

    const fetchCompletedBookings = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `${process.env.REACT_APP_API_URL}/bookings`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            
            // Filter for completed bookings and check which ones can be reviewed
            const completedBookings = response.data.filter(booking => booking.status === 'completed');
            
            // Check which bookings can be reviewed (haven't been reviewed yet)
            const bookingsWithReviewStatus = await Promise.all(
                completedBookings.map(async (booking) => {
                    try {
                        const reviewCheckResponse = await axios.get(
                            `${process.env.REACT_APP_API_URL}/reviews/can-review/${booking._id}`,
                            {
                                headers: { Authorization: `Bearer ${token}` }
                            }
                        );
                        return {
                            ...booking,
                            canReview: reviewCheckResponse.data.canReview && !reviewCheckResponse.data.hasReviewed,
                            hasReviewed: reviewCheckResponse.data.hasReviewed
                        };
                    } catch (error) {
                        return { ...booking, canReview: false, hasReviewed: false };
                    }
                })
            );

            setCompletedBookings(bookingsWithReviewStatus);
        } catch (error) {
            console.error('Error fetching completed bookings:', error);
            toast.error('Failed to load completed bookings', {
                title: 'Loading Error'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleWriteReview = (booking) => {
        setSelectedBooking(booking);
        setShowReviewForm(true);
    };

    const handleReviewSubmitted = (newReview) => {
        setReviews(prev => [newReview, ...prev]);
        setShowReviewForm(false);
        setSelectedBooking(null);
        
        // Update the booking's review status
        setCompletedBookings(prev => 
            prev.map(booking => 
                booking._id === newReview.booking 
                    ? { ...booking, hasReviewed: true, canReview: false }
                    : booking
            )
        );
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const pendingReviews = completedBookings.filter(booking => booking.canReview && !booking.hasReviewed);

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-20 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    My Reviews
                </h3>
            </div>

            {/* Tab Navigation */}
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
                <button
                    onClick={() => setActiveTab('reviews')}
                    className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                        activeTab === 'reviews'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                    My Reviews ({reviews.length})
                </button>
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                        activeTab === 'pending'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                    Write Reviews ({pendingReviews.length})
                </button>
            </div>

            {/* Review Form Modal */}
            {showReviewForm && selectedBooking && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <ReviewForm
                            booking={selectedBooking}
                            onReviewSubmitted={handleReviewSubmitted}
                            onCancel={() => {
                                setShowReviewForm(false);
                                setSelectedBooking(null);
                            }}
                        />
                    </div>
                </div>
            )}

            {/* Tab Content */}
            {activeTab === 'reviews' ? (
                <div>
                    {reviews.length > 0 ? (
                        <div className="space-y-4">
                            {reviews.map((review) => (
                                <div key={review._id} className="border border-gray-200 rounded-lg p-4">
                                    <div className="flex items-start gap-4">
                                        {review.car?.image && (
                                            <img
                                                src={review.car.image}
                                                alt={`${review.car.make} ${review.car.model}`}
                                                className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                                            />
                                        )}
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="font-semibold text-gray-900">
                                                    {review.car?.year} {review.car?.make} {review.car?.model}
                                                </h4>
                                                <div className="flex items-center gap-2">
                                                    <StarRating rating={review.rating} size="sm" />
                                                    <span className="text-sm text-gray-500">
                                                        {formatDate(review.createdAt)}
                                                    </span>
                                                </div>
                                            </div>
                                            {review.comment && review.comment.trim() && (
                                                <p className="text-gray-700 mb-3">{review.comment}</p>
                                            )}
                                            <div className="flex items-center gap-4 text-sm text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-4 h-4" />
                                                    Rental: {formatDate(review.booking?.startDate)} - {formatDate(review.booking?.endDate)}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <DollarSign className="w-4 h-4" />
                                                    ${review.booking?.totalPrice}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <h4 className="text-lg font-medium text-gray-900 mb-2">No Reviews Yet</h4>
                            <p className="text-gray-500 mb-4">
                                You haven't written any reviews yet. Complete a rental to leave your first review!
                            </p>
                        </div>
                    )}
                </div>
            ) : (
                <div>
                    {pendingReviews.length > 0 ? (
                        <div className="space-y-4">
                            <p className="text-gray-600 mb-4">
                                You have {pendingReviews.length} completed rental{pendingReviews.length !== 1 ? 's' : ''} waiting for your review:
                            </p>
                            {pendingReviews.map((booking) => (
                                <div key={booking._id} className="border border-gray-200 rounded-lg p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            {booking.car?.image && (
                                                <img
                                                    src={booking.car.image}
                                                    alt={`${booking.car.make} ${booking.car.model}`}
                                                    className="w-16 h-16 object-cover rounded-lg"
                                                />
                                            )}
                                            <div>
                                                <h4 className="font-semibold text-gray-900">
                                                    {booking.car?.year} {booking.car?.make} {booking.car?.model}
                                                </h4>
                                                <p className="text-gray-600">
                                                    {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    Total: ${booking.totalPrice}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleWriteReview(booking)}
                                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                                        >
                                            <Edit className="w-4 h-4" />
                                            Write Review
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <Star className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <h4 className="text-lg font-medium text-gray-900 mb-2">All Caught Up!</h4>
                            <p className="text-gray-500">
                                You've reviewed all your completed rentals. Thank you for your feedback!
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default UserReviewsSection;
