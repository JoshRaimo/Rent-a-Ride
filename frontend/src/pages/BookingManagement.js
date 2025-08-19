import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, Filter, CheckCircle, XCircle, Trash2, Clock, DollarSign, User, Car } from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import { useToast } from '../hooks/useToast';

const BookingManagement = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all'); // Filter: all, pending, confirmed, canceled
    
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
        } catch (err) {
            console.error('Error deleting booking:', err);
            toast.error('Failed to delete booking', {
                title: 'Delete Error'
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
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
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
            case 'pending':
                return <Clock className="w-4 h-4" />;
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
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="completed">Completed</option>
                                <option value="canceled">Canceled</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-6 text-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                                <span>Pending: {bookings.filter(b => b.status === 'pending').length}</span>
                            </div>
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
                                                        <button
                                                            className="inline-flex items-center px-3 py-1 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                                                            onClick={() => updateBookingStatus(booking._id, 'confirmed')}
                                                        >
                                                            <CheckCircle className="w-4 h-4 mr-1" />
                                                            Confirm
                                                        </button>
                                                        <button
                                                            className="inline-flex items-center px-3 py-1 bg-yellow-50 text-yellow-600 rounded-lg hover:bg-yellow-100 transition-colors"
                                                            onClick={() => updateBookingStatus(booking._id, 'canceled')}
                                                        >
                                                            <XCircle className="w-4 h-4 mr-1" />
                                                            Cancel
                                                        </button>
                                                        <button
                                                            className="inline-flex items-center px-3 py-1 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                                                            onClick={() => deleteBooking(booking._id)}
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