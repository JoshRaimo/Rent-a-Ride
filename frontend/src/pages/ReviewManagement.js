import React, { useState, useEffect } from 'react';
import { MessageSquare, Star, Trash2, User, Car, Calendar, Filter, Search, ChevronDown, ChevronUp } from 'lucide-react';
import axios from 'axios';
import { useToast } from '../hooks/useToast';
import AdminSidebar from '../components/AdminSidebar';
import StarRating from '../components/StarRating';
import ProfileAvatar from '../components/ProfileAvatar';

const ReviewManagement = () => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({});
    const [filters, setFilters] = useState({
        rating: '',
        sort: 'newest'
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [showFilters, setShowFilters] = useState(false);
    
    const { toast, confirm } = useToast();

    useEffect(() => {
        fetchReviews();
    }, [filters, searchTerm, currentPage]);

    const fetchReviews = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            
            const params = {
                page: currentPage,
                limit: 20,
                sort: filters.sort
            };

            if (filters.rating) params.rating = filters.rating;
            if (searchTerm) params.search = searchTerm;

            const response = await axios.get(
                `${process.env.REACT_APP_API_URL}/reviews/admin/all`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    params
                }
            );

            setReviews(response.data.reviews);
            setStats(response.data.stats);
            setTotalPages(response.data.pagination.totalPages);

        } catch (error) {
            console.error('Error fetching reviews:', error);
            toast.error('Failed to load reviews', {
                title: 'Loading Error'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteReview = async (reviewId) => {
        const confirmed = await confirm('Are you sure you want to delete this review? This action cannot be undone.', {
            title: 'Delete Review',
            confirmText: 'Delete',
            cancelText: 'Cancel',
            confirmButtonClass: 'bg-red-600 hover:bg-red-700'
        });
        if (!confirmed) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            await axios.delete(
                `${process.env.REACT_APP_API_URL}/reviews/admin/${reviewId}`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            toast.success('Review deleted successfully', {
                title: 'Review Removed'
            });
            fetchReviews(); // Refresh the list
        } catch (error) {
            console.error('Error deleting review:', error);
            toast.error('Failed to delete review', {
                title: 'Delete Error'
            });
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setCurrentPage(1);
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getRatingColor = (rating) => {
        if (rating >= 4) return 'text-green-600';
        if (rating >= 3) return 'text-yellow-600';
        return 'text-red-600';
    };

    return (
        <div className="flex min-h-screen bg-gray-50">
            <AdminSidebar />
            
            <div className="flex-1 p-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                                <MessageSquare className="w-8 h-8 text-blue-600" />
                                Review Management
                            </h1>
                            <p className="text-gray-600 mt-2">
                                Manage customer reviews and ratings
                            </p>
                        </div>
                        
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center gap-2 bg-white border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <Filter className="w-4 h-4" />
                            Filters
                            {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Reviews</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.totalReviews || 0}</p>
                            </div>
                            <MessageSquare className="w-8 h-8 text-blue-600" />
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Average Rating</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {stats.averageRating ? stats.averageRating.toFixed(1) : '0.0'}
                                </p>
                            </div>
                            <Star className="w-8 h-8 text-yellow-500" />
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">5-Star Reviews</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.ratingDistribution?.[5] || 0}</p>
                            </div>
                            <div className="text-yellow-500">⭐</div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">1-Star Reviews</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.ratingDistribution?.[1] || 0}</p>
                            </div>
                            <div className="text-red-500">⭐</div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                {showFilters && (
                    <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Search Reviews
                                </label>
                                <div className="relative">
                                    <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={handleSearch}
                                        placeholder="Search by user, car, or comment..."
                                        className="pl-10 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Filter by Rating
                                </label>
                                <select
                                    value={filters.rating}
                                    onChange={(e) => handleFilterChange('rating', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">All Ratings</option>
                                    <option value="5">5 Stars</option>
                                    <option value="4">4 Stars</option>
                                    <option value="3">3 Stars</option>
                                    <option value="2">2 Stars</option>
                                    <option value="1">1 Star</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Sort by
                                </label>
                                <select
                                    value={filters.sort}
                                    onChange={(e) => handleFilterChange('sort', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="newest">Newest First</option>
                                    <option value="oldest">Oldest First</option>
                                    <option value="highest">Highest Rated</option>
                                    <option value="lowest">Lowest Rated</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {/* Reviews List */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    {loading ? (
                        <div className="p-8">
                            <div className="animate-pulse space-y-4">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <div key={i} className="border-b border-gray-100 pb-4">
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                                            <div className="flex-1 space-y-2">
                                                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                                                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : reviews.length === 0 ? (
                        <div className="p-12 text-center">
                            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No Reviews Found</h3>
                            <p className="text-gray-500">
                                {searchTerm || filters.rating 
                                    ? 'Try adjusting your filters to see more reviews.'
                                    : 'No customer reviews have been submitted yet.'
                                }
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="p-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                                    All Reviews ({stats.totalReviews || 0})
                                </h2>
                                <div className="space-y-6">
                                    {reviews.map((review) => (
                                        <div key={review._id} className="border-b border-gray-100 pb-6 last:border-b-0">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-start gap-4 flex-1">
                                                    <ProfileAvatar user={review.user} size="md" />
                                                    
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <h4 className="font-medium text-gray-900">
                                                                {review.user?.username || 'Anonymous'}
                                                            </h4>
                                                            <StarRating rating={review.rating} size="sm" />
                                                            <span className="text-sm text-gray-500">
                                                                {formatDate(review.createdAt)}
                                                            </span>
                                                        </div>
                                                        
                                                        <div className="mb-3">
                                                            <p className="text-sm text-gray-600 mb-1">
                                                                <Car className="w-4 h-4 inline mr-1" />
                                                                {review.car?.year} {review.car?.make} {review.car?.model}
                                                            </p>
                                                            <p className="text-sm text-gray-600">
                                                                <Calendar className="w-4 h-4 inline mr-1" />
                                                                Rental: {new Date(review.booking?.startDate).toLocaleDateString()} - {new Date(review.booking?.endDate).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                        
                                                        {review.comment && review.comment.trim() && (
                                                            <p className="text-gray-700 leading-relaxed">
                                                                {review.comment}
                                                            </p>
                                                        )}
                                                        
                                                        <div className="mt-3 flex items-center gap-2">
                                                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                                                Verified Rental
                                                            </span>
                                                            <span className="text-xs text-gray-500">
                                                                User: {review.user?.email}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <button
                                                    onClick={() => handleDeleteReview(review._id)}
                                                    className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete Review"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                                    <div className="text-sm text-gray-700">
                                        Page {currentPage} of {totalPages}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                            disabled={currentPage === 1}
                                            className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                        >
                                            Previous
                                        </button>
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                            disabled={currentPage === totalPages}
                                            className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReviewManagement;
