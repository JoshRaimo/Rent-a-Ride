import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, Filter, CheckCircle, XCircle, Trash2, Clock, DollarSign, User, Car, MessageSquare, Mail } from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import { useToast } from '../hooks/useToast';

const BookingManagement = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all'); // Filter: all, confirmed, completed, canceled
    
    const { toast, confirm } = useToast();

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/bookings/all`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });
            setBookings(response.data);
        } catch (err) {
            console.error('Error fetching bookings:', err);
            setError('Failed to load bookings.');
        } finally {
            setLoading(false);
        }
    };

    const updateBookingStatus = async (bookingId, status) => {
        try {
            await axios.put(
                `${process.env.REACT_APP_API_URL}/bookings/${bookingId}/status`,
                { status },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                }
            );
            fetchBookings(); // Refresh bookings list
            toast.success(`Booking ${status} successfully`, {
                title: 'Status Updated'
            });

            // Dispatch event to notify other pages about the booking status change
            window.dispatchEvent(new CustomEvent('bookingStatusChanged', {
                detail: {
                    status: status,
                    bookingId: bookingId
                }
            }));
        } catch (err) {
            console.error('Error updating booking status:', err);
            toast.error('Failed to update booking status', {
                title: 'Update Error'
            });
        }
    };

    const deleteBooking = async (bookingId) => {
        const confirmed = await confirm('Are you sure you want to delete this booking? This action cannot be undone.', {
            title: 'Delete Booking',
            confirmText: 'Delete',
            cancelText: 'Cancel',
            confirmButtonClass: 'bg-red-600 hover:bg-red-700'
        });
        if (confirmed) {
            handleDeleteConfirm(bookingId);
        }
    };

    const handleDeleteConfirm = async (bookingId) => {
        try {
            await axios.delete(`${process.env.REACT_APP_API_URL}/bookings/${bookingId}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });
            fetchBookings(); // Refresh bookings list
            toast.success('Booking deleted successfully', {
                title: 'Booking Removed'
            });

            // Dispatch event to notify other pages about the booking deletion
            // This will make the car available again
            window.dispatchEvent(new CustomEvent('bookingStatusChanged', {
                detail: {
                    status: 'deleted',
                    bookingId: bookingId
                }
            }));
        } catch (err) {
            console.error('Error deleting booking:', err);
            toast.error('Failed to delete booking', {
                title: 'Delete Error'
            });
        }
    };

    const viewBookingReviews = async (booking) => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/reviews/booking/${booking._id}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });
            
            if (response.data.reviews && response.data.reviews.length > 0) {
                const review = response.data.reviews[0];
                toast.info(`Review: ${review.rating}/5 stars${review.comment ? ` - "${review.comment}"` : ''}`, {
                    title: 'Customer Review',
                    duration: 5000
                });
            } else {
                toast.info('No review submitted for this rental yet.', {
                    title: 'No Review'
                });
            }
        } catch (err) {
            console.error('Error fetching booking reviews:', err);
            toast.error('Failed to fetch review', {
                title: 'Review Error'
            });
        }
    };



    const contactCustomer = (booking) => {
        const email = booking.user?.email;
        if (email) {
            // Open default email client with pre-filled details
            const subject = encodeURIComponent(`Regarding your rental - ${booking.car?.make} ${booking.car?.model}`);
            const body = encodeURIComponent(`Hello ${booking.user?.username || 'there'},

I'm contacting you regarding your recent rental of the ${booking.car?.year} ${booking.car?.make} ${booking.car?.model} from ${formatDateTime(booking.startDate)} to ${formatDateTime(booking.endDate)}.

Please let me know if you have any questions or feedback about your experience.

Best regards,
Rent-a-Ride Team`);
            
            window.open(`mailto:${email}?subject=${subject}&body=${body}`);
            toast.success('Email client opened', {
                title: 'Contact Customer'
            });
        } else {
            toast.error('No email address available for this customer', {
                title: 'Contact Error'
            });
        }
    };

    const filteredBookings = bookings.filter((booking) =>
        filter === 'all' ? true : booking.status === filter
    );

    // Format date and time in Eastern Standard Time (EST)
    const formatDateTime = (dateString) => {
        const date = new Date(dateString);
        // Convert to EST using Intl.DateTimeFormat for more control
        const options = {
            timeZone: 'America/New_York',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        };
        return new Intl.DateTimeFormat('en-US', options).format(date);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'confirmed':
                return 'bg-green-100 text-green-800';
            case 'completed':
                return 'bg-blue-100 text-blue-800';
            case 'canceled':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'confirmed':
                return <CheckCircle className="w-4 h-4" />;
            case 'completed':
                return <CheckCircle className="w-4 h-4" />;
            case 'canceled':
                return <XCircle className="w-4 h-4" />;
            default:
                return <Clock className="w-4 h-4" />;
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-50">
            <AdminSidebar />
            <div className="flex-1 ml-20 p-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center mb-2">
                        <Calendar className="w-8 h-8 text-blue-600 mr-3" />
                        <h1 className="text-4xl font-bold text-gray-900">Booking Management</h1>
                    </div>
                    <p className="text-gray-600 text-lg">Monitor and manage all car rental bookings</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-700">{error}</p>
                    </div>
                )}

                {/* Filter and Stats */}
                <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 mb-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <Filter className="w-5 h-5 text-gray-600" />
                            <select
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                            >
                                <option value="all">All Bookings</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="completed">Completed</option>
                                <option value="canceled">Canceled</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-6 text-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                                <span>Confirmed: {bookings.filter(b => b.status === 'confirmed').length}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                                <span>Completed: {bookings.filter(b => b.status === 'completed').length}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                                <span>Canceled: {bookings.filter(b => b.status === 'canceled').length}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        <p className="ml-4 text-gray-600 text-lg">Loading bookings...</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                        {filteredBookings.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                <div className="flex items-center">
                                                    <User className="w-4 h-4 mr-1" />
                                                    User
                                                </div>
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                <div className="flex items-center">
                                                    <Car className="w-4 h-4 mr-1" />
                                                    Car
                                                </div>
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                <div className="flex items-center">
                                                    <Clock className="w-4 h-4 mr-1" />
                                                    Duration
                                                </div>
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                <div className="flex items-center">
                                                    <DollarSign className="w-4 h-4 mr-1" />
                                                    Price
                                                </div>
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredBookings.map((booking) => (
                                            <tr key={booking._id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {booking.user?.username || 'Unknown User'}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {booking.user?.email || 'No email'}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {booking.car?.make} {booking.car?.model}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {booking.car?.year}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">
                                                        <div>{formatDateTime(booking.startDate)}</div>
                                                        <div className="text-gray-500">to</div>
                                                        <div>{formatDateTime(booking.endDate)}</div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        ${booking.totalPrice}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                                                        {getStatusIcon(booking.status)}
                                                        <span className="ml-1">{booking.status}</span>
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <div className="flex gap-2">
                                                        {/* Show Confirm button for non-confirmed, non-completed bookings (including canceled) */}
                                                        {booking.status !== 'confirmed' && booking.status !== 'completed' && (
                                                            <button
                                                                className="inline-flex items-center px-3 py-1 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                                                                onClick={() => updateBookingStatus(booking._id, 'confirmed')}
                                                                title={booking.status === 'canceled' ? "Re-confirm this canceled booking" : "Confirm this booking"}
                                                            >
                                                                <CheckCircle className="w-4 h-4 mr-1" />
                                                                {booking.status === 'canceled' ? 'Re-confirm' : 'Confirm'}
                                                            </button>
                                                        )}
                                                        
                                                        {/* Show Cancel button only for confirmed bookings */}
                                                        {booking.status === 'confirmed' && (
                                                            <button
                                                                className="inline-flex items-center px-3 py-1 bg-yellow-50 text-yellow-600 rounded-lg hover:bg-yellow-100 transition-colors"
                                                                onClick={() => updateBookingStatus(booking._id, 'canceled')}
                                                                title="Cancel this confirmed booking"
                                                            >
                                                                <XCircle className="w-4 h-4 mr-1" />
                                                                Cancel
                                                            </button>
                                                        )}
                                                        
                                                        {/* Show action buttons for completed bookings */}
                                                        {booking.status === 'completed' && (
                                                            <>
                                                                <button
                                                                    className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                                                                    onClick={() => viewBookingReviews(booking)}
                                                                    title="View customer review for this rental"
                                                                >
                                                                    <MessageSquare className="w-4 h-4 mr-1" />
                                                                    Reviews
                                                                </button>
                                                                <button
                                                                    className="inline-flex items-center px-3 py-1 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                                                                    onClick={() => contactCustomer(booking)}
                                                                    title="Contact customer via email"
                                                                >
                                                                    <Mail className="w-4 h-4 mr-1" />
                                                                    Contact
                                                                </button>
                                                            </>
                                                        )}
                                                        
                                                        {/* Always show Delete button */}
                                                        <button
                                                            className="inline-flex items-center px-3 py-1 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                                                            onClick={() => deleteBooking(booking._id)}
                                                            title="Delete this booking permanently"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                                <Calendar className="w-12 h-12 mb-4 text-gray-300" />
                                <p className="text-lg font-medium">No bookings found</p>
                                <p className="text-sm">Bookings will appear here when customers make reservations</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default BookingManagement;