import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminSidebar from '../components/AdminSidebar';

const BookingManagement = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all'); // Filter: all, pending, confirmed, canceled

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
        } catch (err) {
            console.error('Error updating booking status:', err);
            alert('Failed to update booking status.');
        }
    };

    const deleteBooking = async (bookingId) => {
        if (!window.confirm('Are you sure you want to delete this booking?')) return;

        try {
            await axios.delete(`${process.env.REACT_APP_API_URL}/bookings/${bookingId}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });
            fetchBookings(); // Refresh bookings list
        } catch (err) {
            console.error('Error deleting booking:', err);
            alert('Failed to delete booking.');
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

    return (
        <div className="flex">
            <AdminSidebar />
            <div className="flex-1 ml-20 mt-16 p-6 bg-white rounded-lg shadow-lg">
                <h2 className="text-3xl font-bold text-center text-primary-color mb-6">
                    Booking Management
                </h2>

                {error && <p className="text-red-500 text-center">{error}</p>}

                <div className="flex justify-between mb-4">
                    <label className="font-semibold">
                        Filter by Status:
                        <select
                            className="ml-2 p-2 border rounded"
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                        >
                            <option value="all">All</option>
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="canceled">Canceled</option>
                        </select>
                    </label>
                </div>

                {loading ? (
                    <p className="text-center">Loading...</p>
                ) : (
                    <table className="min-w-full bg-white border border-gray-200">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="py-2 px-4 border">User</th>
                                <th className="py-2 px-4 border">Car</th>
                                <th className="py-2 px-4 border">Start Date & Time</th>
                                <th className="py-2 px-4 border">End Date & Time</th>
                                <th className="py-2 px-4 border">Total Price</th>
                                <th className="py-2 px-4 border">Status</th>
                                <th className="py-2 px-4 border">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredBookings.length > 0 ? (
                                filteredBookings.map((booking) => (
                                    <tr key={booking._id} className="text-center">
                                        <td className="py-2 px-4 border">{booking.user?.name || 'N/A'}</td>
                                        <td className="py-2 px-4 border">
                                            {booking.car?.make} {booking.car?.model}
                                        </td>
                                        <td className="py-2 px-4 border">{formatDateTime(booking.startDate)}</td>
                                        <td className="py-2 px-4 border">{formatDateTime(booking.endDate)}</td>
                                        <td className="py-2 px-4 border">${booking.totalPrice}</td>
                                        <td className="py-2 px-4 border">{booking.status}</td>
                                        <td className="py-2 px-4 border">
                                            <button
                                                className="bg-green-500 text-white px-2 py-1 rounded mr-2"
                                                onClick={() => updateBookingStatus(booking._id, 'confirmed')}
                                            >
                                                Confirm
                                            </button>
                                            <button
                                                className="bg-yellow-500 text-white px-2 py-1 rounded mr-2"
                                                onClick={() => updateBookingStatus(booking._id, 'canceled')}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                className="bg-red-500 text-white px-2 py-1 rounded"
                                                onClick={() => deleteBooking(booking._id)}
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="py-4 text-center text-gray-500">
                                        No bookings found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default BookingManagement;