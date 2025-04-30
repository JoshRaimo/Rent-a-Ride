import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const ProfilePage = ({ onUpdateUser }) => {
    const [user, setUser] = useState(null);
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [bookings, setBookings] = useState([]);
    const [loadingBookings, setLoadingBookings] = useState(true);
    const [deletingBookingId, setDeletingBookingId] = useState(null);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);

    useEffect(() => {
        const fetchUserProfile = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('token');
                if (!token) throw new Error("No token found");
                const response = await axios.get(
                    `${process.env.REACT_APP_API_URL}/users/profile`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setUser(response.data);
                setUsername(response.data.username);
                setEmail(response.data.email);
            } catch (error) {
                console.error('Error fetching profile:', error.message);
                toast.error('Failed to fetch profile. Please log in again.');
                localStorage.removeItem('token');
            } finally {
                setLoading(false);
            }
        };

        const fetchUserBookings = async () => {
            setLoadingBookings(true);
            try {
                const token = localStorage.getItem('token');
                if (!token) return;
                const response = await axios.get(
                    `${process.env.REACT_APP_API_URL}/bookings`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setBookings(response.data);
            } catch (error) {
                console.error('Error fetching bookings:', error.response?.data?.message || error.message);
                if (localStorage.getItem('token')) {
                    toast.error('Failed to fetch bookings.');
                }
            } finally {
                setLoadingBookings(false);
            }
        };

        fetchUserProfile();
        fetchUserBookings();
    }, []);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        try {
            setUpdating(true);
            const token = localStorage.getItem('token');
            const response = await axios.put(
                `${process.env.REACT_APP_API_URL}/users/profile`,
                { username, email },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const updatedUser = response.data.user;
            localStorage.setItem('user', JSON.stringify(updatedUser));
            onUpdateUser(updatedUser);

            toast.success('Profile updated successfully!');
        } catch (error) {
            console.error('Error updating profile:', error.message);
            toast.error('Failed to update profile.');
        } finally {
            setUpdating(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        try {
            setUpdating(true);
            const token = localStorage.getItem('token');
            await axios.put(
                `${process.env.REACT_APP_API_URL}/users/change-password`,
                { currentPassword, newPassword },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            toast.success('Password updated successfully!');
            setCurrentPassword('');
            setNewPassword('');
        } catch (error) {
            console.error('Error changing password:', error.message);
            toast.error(error.response?.data?.message || 'Failed to change password.');
        } finally {
            setUpdating(false);
        }
    };

    const formatBookingDate = (dateString) => {
        try {
            return format(new Date(dateString), 'MM/dd/yyyy hh:mm a');
        } catch (error) {
            console.error("Error formatting date:", error);
            return "Invalid Date";
        }
    };

    const handleDeleteBooking = async (bookingId) => {
        toast.info(
            <div>
                <p>Are you sure you want to permanently DELETE this booking? This action cannot be undone.</p>
                <div className="mt-2">
                    <button
                        className="bg-red-500 text-white px-4 py-2 rounded mr-2"
                        onClick={() => {
                            handleDeleteConfirm(bookingId);
                            toast.dismiss();
                        }}
                    >
                        Delete
                    </button>
                    <button
                        className="bg-gray-500 text-white px-4 py-2 rounded"
                        onClick={() => toast.dismiss()}
                    >
                        Cancel
                    </button>
                </div>
            </div>,
            {
                autoClose: false,
                closeOnClick: false,
                draggable: false,
                closeButton: false
            }
        );
    };

    const handleDeleteConfirm = async (bookingId) => {
        setDeletingBookingId(bookingId);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.delete(
                `${process.env.REACT_APP_API_URL}/bookings/${bookingId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setBookings(prevBookings =>
                prevBookings.filter(booking => booking._id !== bookingId)
            );

            toast.success(response.data.message || 'Booking deleted successfully!');
        } catch (error) {
            console.error('Error deleting booking:', error.response?.data?.message || error.message);
            toast.error(error.response?.data?.message || 'Failed to delete booking.');
        } finally {
            setDeletingBookingId(null);
        }
    };

    return (
        <div className="max-w-3xl mx-auto mt-10 p-6 bg-white rounded shadow mb-10">
            <h1 className="text-2xl font-bold mb-6 text-center">Profile</h1>

            {loading ? (
                <p className="text-center text-blue-500">Loading profile...</p>
            ) : !user ? (
                <p className="text-center text-red-500">Could not load profile. Please try logging in again.</p>
            ) : (
                <>
                    <form onSubmit={handleUpdateProfile} className="mb-8">
                        <div className="mb-4">
                            <label className="block mb-1">Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-3 py-2 border rounded"
                                placeholder="Enter your username"
                                required
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block mb-1">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-3 py-2 border rounded"
                                placeholder="Enter your email"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className={`w-full py-2 rounded text-white transition duration-200 ${
                                updating
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-blue-500 hover:bg-blue-600'
                            }`}
                            disabled={updating}
                        >
                            {updating ? 'Updating...' : 'Update Profile'}
                        </button>
                    </form>

                    <div className="border-t pt-6 mb-8">
                        <h2 className="text-xl font-bold mb-4">Change Password</h2>
                        <form onSubmit={handleChangePassword}>
                            <div className="mb-4">
                                <label className="block mb-1">Current Password</label>
                                <div className="relative">
                                    <input
                                        type={showCurrentPassword ? "text" : "password"}
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        className="w-full px-3 py-2 border rounded pr-10"
                                        placeholder="Enter current password"
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                    >
                                        {showCurrentPassword ? <FaEye size={20} /> : <FaEyeSlash size={20} />}
                                    </button>
                                </div>
                            </div>
                            <div className="mb-4">
                                <label className="block mb-1">New Password</label>
                                <div className="relative">
                                    <input
                                        type={showNewPassword ? "text" : "password"}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full px-3 py-2 border rounded pr-10"
                                        placeholder="Enter new password"
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                    >
                                        {showNewPassword ? <FaEye size={20} /> : <FaEyeSlash size={20} />}
                                    </button>
                                </div>
                            </div>
                            <button
                                type="submit"
                                className={`w-full py-2 rounded text-white transition duration-200 ${
                                    updating
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-blue-500 hover:bg-blue-600'
                                }`}
                                disabled={updating}
                            >
                                {updating ? 'Updating Password...' : 'Change Password'}
                            </button>
                        </form>
                    </div>

                    <div className="border-t pt-6">
                        <h2 className="text-xl font-bold mb-4">Your Bookings</h2>
                        {loadingBookings ? (
                            <p className="text-center text-blue-500">Loading bookings...</p>
                        ) : bookings.length === 0 ? (
                            <p className="text-center text-gray-500">You have no active bookings.</p>
                        ) : (
                            <div className="space-y-4">
                                {bookings.map((booking) => (
                                    <div key={booking._id} className="p-4 border rounded shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                        <div className="flex-grow">
                                            <p><strong>Car:</strong> {booking.car ? `${booking.car.make} ${booking.car.model}` : 'N/A (Car details unavailable)'}</p>
                                            <p><strong>Start:</strong> {formatBookingDate(booking.startDate)}</p>
                                            <p><strong>End:</strong> {formatBookingDate(booking.endDate)}</p>
                                            <p><strong>Total Price:</strong> ${booking.totalPrice != null ? booking.totalPrice.toFixed(2) : 'N/A'}</p>
                                            <p><strong>Status:</strong> <span className={`capitalize font-semibold ${
                                                booking.status === 'confirmed' ? 'text-green-600' :
                                                booking.status === 'pending' ? 'text-yellow-600' :
                                                booking.status === 'canceled' ? 'text-red-600 line-through' :
                                                'text-gray-600'
                                            }`}>{booking.status || 'Unknown'}</span></p>
                                        </div>

                                        <div className="flex-shrink-0 self-center sm:self-auto">
                                            <button
                                                onClick={() => handleDeleteBooking(booking._id)}
                                                className={`px-4 py-2 rounded text-white text-sm font-medium transition duration-200 ${
                                                    deletingBookingId === booking._id
                                                        ? 'bg-gray-400 cursor-not-allowed'
                                                        : 'bg-red-500 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2'
                                                }`}
                                                disabled={deletingBookingId === booking._id}
                                            >
                                                {deletingBookingId === booking._id ? 'Deleting...' : 'Delete Booking'}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default ProfilePage;
