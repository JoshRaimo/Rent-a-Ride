import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, User, Calendar, MoreVertical, Flag } from 'lucide-react';
import StarRating from './StarRating';
import ProfileAvatar from './ProfileAvatar';
import axios from 'axios';
import { useToast } from '../hooks/useToast';

const ReviewDisplay = ({ carId, showTitle = true, maxInitialReviews = 5 }) => {
    const [reviews, setReviews] = useState([]);
    const [carRating, setCarRating] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showAllReviews, setShowAllReviews] = useState(false);
    const [sortBy, setSortBy] = useState('newest');
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    
    const { toast } = useToast();

    useEffect(() => {
        if (carId) {
            fetchReviews();
        }
    }, [carId, sortBy]);

    const fetchReviews = async (page = 1, append = false) => {
        try {
            if (!append) {
                setLoading(true);
            } else {
                setLoadingMore(true);
            }

            const response = await axios.get(
                `${process.env.REACT_APP_API_URL}/reviews/car/${carId}`,
                {
                    params: {
                        page,
                        limit: 10,
                        sort: sortBy
                    }
                }
            );

            const { reviews: newReviews, pagination, carRating: rating } = response.data;

            if (append) {
                setReviews(prev => [...prev, ...newReviews]);
            } else {
                setReviews(newReviews);
                setCarRating(rating);
            }

            setCurrentPage(pagination.currentPage);
            setHasMore(pagination.hasMore);

        } catch (error) {
            console.error('Error fetching reviews:', error);
            if (!append) {
                toast.error('Failed to load reviews', {
                    title: 'Loading Error'
                });
            }
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    const loadMoreReviews = () => {
        fetchReviews(currentPage + 1, true);
    };

    const handleSortChange = (newSort) => {
        setSortBy(newSort);
        setCurrentPage(1);
        setShowAllReviews(false);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getRatingDistributionPercentage = (rating) => {
        if (!carRating?.ratingDistribution || carRating.reviewCount === 0) return 0;
        const count = carRating.ratingDistribution.find(item => item._id === rating)?.count || 0;
        return (count / carRating.reviewCount) * 100;
    };

    const displayedReviews = showAllReviews ? reviews : reviews.slice(0, maxInitialReviews);

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="border-b border-gray-100 pb-4">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                                    <div className="flex-1">
                                        <div className="h-4 bg-gray-200 rounded w-1/4 mb-1"></div>
                                        <div className="h-3 bg-gray-200 rounded w-1/6"></div>
                                    </div>
                                </div>
                                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (!carRating || carRating.reviewCount === 0) {
        return (
            <div className="bg-white rounded-lg shadow-sm p-6">
                {showTitle && (
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">
                        Customer Reviews
                    </h3>
                )}
                <div className="text-center py-8">
                    <div className="text-gray-400 mb-2">
                        <StarRating rating={0} size="lg" />
                    </div>
                    <p className="text-gray-500">No reviews yet</p>
                    <p className="text-sm text-gray-400 mt-1">
                        Be the first to review this car!
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-sm p-6">
            {showTitle && (
                <h3 className="text-xl font-semibold text-gray-900 mb-6">
                    Customer Reviews
                </h3>
            )}

            {/* Rating Summary */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Overall Rating */}
                    <div className="text-center">
                        <div className="text-4xl font-bold text-gray-900 mb-2">
                            {carRating.averageRating.toFixed(1)}
                        </div>
                        <StarRating rating={carRating.averageRating} size="lg" className="justify-center mb-2" />
                        <p className="text-gray-600">
                            Based on {carRating.reviewCount} review{carRating.reviewCount !== 1 ? 's' : ''}
                        </p>
                    </div>

                    {/* Rating Distribution */}
                    <div className="space-y-2">
                        {[5, 4, 3, 2, 1].map(rating => (
                            <div key={rating} className="flex items-center gap-2 text-sm">
                                <span className="w-3 text-gray-600">{rating}</span>
                                <StarRating rating={rating} size="sm" />
                                <div className="flex-1 bg-gray-200 rounded-full h-2 mx-2">
                                    <div
                                        className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${getRatingDistributionPercentage(rating)}%` }}
                                    />
                                </div>
                                <span className="w-8 text-gray-600 text-right">
                                    {carRating.ratingDistribution.find(item => item._id === rating)?.count || 0}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Sort Options */}
            <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-gray-900">
                    Reviews ({carRating.reviewCount})
                </h4>
                <select
                    value={sortBy}
                    onChange={(e) => handleSortChange(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="highest">Highest Rated</option>
                    <option value="lowest">Lowest Rated</option>
                </select>
            </div>

            {/* Reviews List */}
            <div className="space-y-6">
                {displayedReviews.map((review) => (
                    <div key={review._id} className="border-b border-gray-100 pb-6 last:border-b-0">
                        <div className="flex items-start gap-4">
                            <ProfileAvatar 
                                user={review.user} 
                                size="md" 
                                className="flex-shrink-0"
                            />
                            
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-2">
                                    <div>
                                        <h5 className="font-medium text-gray-900">
                                            {review.user?.username || 'Anonymous'}
                                        </h5>
                                        <div className="flex items-center gap-2 mt-1">
                                            <StarRating rating={review.rating} size="sm" />
                                            <span className="text-sm text-gray-500">
                                                {formatDate(review.createdAt)}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    {/* Review Actions (future: report, etc.) */}
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                            Verified Rental
                                        </span>
                                    </div>
                                </div>

                                {review.comment && review.comment.trim() && (
                                    <p className="text-gray-700 leading-relaxed">
                                        {review.comment}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Load More / Show All Toggle */}
            {reviews.length > maxInitialReviews && (
                <div className="mt-6 text-center">
                    {!showAllReviews ? (
                        <button
                            onClick={() => setShowAllReviews(true)}
                            className="flex items-center gap-2 mx-auto text-blue-600 hover:text-blue-700 font-medium"
                        >
                            <span>Show all {carRating.reviewCount} reviews</span>
                            <ChevronDown className="w-4 h-4" />
                        </button>
                    ) : (
                        <>
                            {hasMore && (
                                <button
                                    onClick={loadMoreReviews}
                                    disabled={loadingMore}
                                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors mb-4"
                                >
                                    {loadingMore ? 'Loading...' : 'Load More Reviews'}
                                </button>
                            )}
                            <button
                                onClick={() => setShowAllReviews(false)}
                                className="flex items-center gap-2 mx-auto text-gray-600 hover:text-gray-700 font-medium"
                            >
                                <span>Show less</span>
                                <ChevronUp className="w-4 h-4" />
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default ReviewDisplay;
