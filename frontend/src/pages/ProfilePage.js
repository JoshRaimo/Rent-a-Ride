import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../hooks/useToast';
import { format } from 'date-fns';
import { Eye, EyeOff, User, Mail, Shield, Calendar, DollarSign, Car, Edit2, Save, X, Trash2, Clock, MessageSquare } from 'lucide-react';
import ProfilePictureUpload from '../components/ProfilePictureUpload';
import UserReviewsSection from '../components/UserReviewsSection';

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
    const [bookingFilter, setBookingFilter] = useState('active'); // 'active', 'completed', 'all'
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [editingProfile, setEditingProfile] = useState(false);
    const [changingPassword, setChangingPassword] = useState(false);
    
    const { toast, confirm } = useToast();

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
                toast.error('Failed to fetch profile. Please log in again.', {
                    title: 'Authentication Error'
                });
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
                    toast.error('Failed to fetch bookings.', {
                        title: 'Loading Error'
                    });
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
            setUser(updatedUser); // Update local user state
            localStorage.setItem('user', JSON.stringify(updatedUser));
            onUpdateUser(updatedUser);
            setEditingProfile(false);

            toast.success('Profile updated successfully!', {
                title: 'Profile Saved'
            });
        } catch (error) {
            console.error('Error updating profile:', error.message);
            toast.error('Failed to update profile.', {
                title: 'Update Error'
            });
        } finally {
            setUpdating(false);
        }
    };

    const handleCancelEdit = () => {
        setUsername(user.username);
        setEmail(user.email);
        setEditingProfile(false);
    };

    const handleProfilePictureUpdate = (updatedUser) => {
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        onUpdateUser(updatedUser);
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

            toast.success('Password updated successfully!', {
                title: 'Security Updated'
            });
            setCurrentPassword('');
            setNewPassword('');
            setChangingPassword(false);
        } catch (error) {
            console.error('Error changing password:', error.message);
            toast.error(error.response?.data?.message || 'Failed to change password.', {
                title: 'Password Error'
            });
        } finally {
            setUpdating(false);
        }
    };

    const handleCancelPasswordChange = () => {
        setCurrentPassword('');
        setNewPassword('');
        setChangingPassword(false);
    };

    const formatBookingDate = (dateString) => {
        try {
            return format(new Date(dateString), 'MM/dd/yyyy hh:mm a');
        } catch (error) {
            console.error("Error formatting date:", error);
            return "Invalid Date";
        }
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
                return <Calendar className="w-4 h-4" />;
            case 'completed':
                return <Calendar className="w-4 h-4" />;
            case 'canceled':
                return <X className="w-4 h-4" />;
            default:
                return <Clock className="w-4 h-4" />;
        }
    };

    const getFilteredBookings = () => {
        switch (bookingFilter) {
            case 'active':
                return bookings.filter(booking => booking.status === 'confirmed');
            case 'completed':
                return bookings.filter(booking => booking.status === 'completed');
            case 'all':
                return bookings;
            default:
                return bookings.filter(booking => booking.status === 'confirmed');
        }
    };

    const handleDeleteBooking = async (bookingId) => {
        const confirmed = await confirm('Are you sure you want to permanently DELETE this booking? This action cannot be undone.', {
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

            toast.success(response.data.message || 'Booking deleted successfully!', {
                title: 'Booking Cancelled'
            });
        } catch (error) {
            console.error('Error deleting booking:', error.response?.data?.message || error.message);
            toast.error(error.response?.data?.message || 'Failed to delete booking.', {
                title: 'Delete Error'
            });
        } finally {
            setDeletingBookingId(null);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-6xl mx-auto px-6">
                {/* Header */}
                <div className="mb-12">
                    <div className="flex items-center mb-4">
                        <User className="w-10 h-10 text-blue-600 mr-4" />
                        <h1 className="text-5xl font-bold text-gray-900">My Profile</h1>
                    </div>
                    <p className="text-gray-600 text-xl">Manage your account settings and view your bookings</p>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        <p className="ml-4 text-gray-600 text-lg">Loading profile...</p>
                    </div>
                ) : !user ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                        <p className="text-red-700">Could not load profile. Please try logging in again.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                        {/* Left Column - Profile Info */}
                        <div className="lg:col-span-1 space-y-8">
                            {/* Profile Picture Card */}
                            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-8">
                                <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">Profile Picture</h2>
                                <ProfilePictureUpload user={user} onProfileUpdate={handleProfilePictureUpdate} />
                            </div>

                            {/* Account Info Card */}
                            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-8">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-semibold text-gray-900">Account Information</h2>
                                    {!editingProfile ? (
                                        <button
                                            onClick={() => setEditingProfile(true)}
                                            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                                        >
                                            <Edit2 className="w-4 h-4 mr-2" />
                                            Edit
                                        </button>
                                    ) : null}
                                </div>

                                {editingProfile ? (
                                    <form onSubmit={handleUpdateProfile} className="space-y-6">
                                        <div>
                                            <label className="block text-base font-medium text-gray-700 mb-3">
                                                <User className="w-5 h-5 inline mr-2" />
                                                Username
                                            </label>
                                            <input
                                                type="text"
                                                value={username}
                                                onChange={(e) => setUsername(e.target.value)}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-base font-medium text-gray-700 mb-3">
                                                <Mail className="w-5 h-5 inline mr-2" />
                                                Email
                                            </label>
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                                                required
                                            />
                                        </div>
                                        <div className="flex space-x-3 pt-4">
                                            <button
                                                type="submit"
                                                disabled={updating}
                                                className="flex-1 flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors font-medium"
                                            >
                                                <Save className="w-5 h-5 mr-2" />
                                                {updating ? 'Saving...' : 'Save Changes'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleCancelEdit}
                                                className="flex-1 flex items-center justify-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                                            >
                                                <X className="w-5 h-5 mr-2" />
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="space-y-5">
                                        <div className="flex items-center py-2">
                                            <User className="w-5 h-5 text-gray-400 mr-3" />
                                            <span className="text-base text-gray-600 mr-3 min-w-[80px]">Username:</span>
                                            <span className="font-medium text-base">{user.username}</span>
                                        </div>
                                        <div className="flex items-center py-2">
                                            <Mail className="w-5 h-5 text-gray-400 mr-3" />
                                            <span className="text-base text-gray-600 mr-3 min-w-[80px]">Email:</span>
                                            <span className="font-medium text-base">{user.email}</span>
                                        </div>
                                        <div className="flex items-center py-2">
                                            <Shield className="w-5 h-5 text-gray-400 mr-3" />
                                            <span className="text-base text-gray-600 mr-3 min-w-[80px]">Role:</span>
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                                user.role === 'admin' 
                                                    ? 'bg-purple-100 text-purple-800' 
                                                    : 'bg-green-100 text-green-800'
                                            }`}>
                                                {user.role}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Password Change Card */}
                            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-8">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-semibold text-gray-900">Security</h2>
                                    {!changingPassword ? (
                                        <button
                                            onClick={() => setChangingPassword(true)}
                                            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                                        >
                                            <Edit2 className="w-4 h-4 mr-2" />
                                            Change Password
                                        </button>
                                    ) : null}
                                </div>

                                {changingPassword ? (
                                    <form onSubmit={handleChangePassword} className="space-y-6">
                                        <div>
                                            <label className="block text-base font-medium text-gray-700 mb-3">Current Password</label>
                                            <div className="relative">
                                                <input
                                                    type={showCurrentPassword ? "text" : "password"}
                                                    value={currentPassword}
                                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12 text-base"
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                >
                                                    {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-base font-medium text-gray-700 mb-3">New Password</label>
                                            <div className="relative">
                                                <input
                                                    type={showNewPassword ? "text" : "password"}
                                                    value={newPassword}
                                                    onChange={(e) => setNewPassword(e.target.value)}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12 text-base"
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                                >
                                                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex space-x-3 pt-4">
                                            <button
                                                type="submit"
                                                disabled={updating}
                                                className="flex-1 flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors font-medium"
                                            >
                                                <Save className="w-5 h-5 mr-2" />
                                                {updating ? 'Updating...' : 'Update Password'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleCancelPasswordChange}
                                                className="flex-1 flex items-center justify-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                                            >
                                                <X className="w-5 h-5 mr-2" />
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <p className="text-gray-600 text-base leading-relaxed">Keep your account secure by regularly updating your password.</p>
                                )}
                            </div>
                        </div>

                        {/* Right Column - Bookings */}
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-8">
                                <div className="flex items-center mb-6">
                                    <Calendar className="w-7 h-7 text-blue-600 mr-3" />
                                    <h2 className="text-2xl font-semibold text-gray-900">Your Bookings</h2>
                                    <span className="ml-auto text-base text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                                        {getFilteredBookings().length} {getFilteredBookings().length === 1 ? 'booking' : 'bookings'}
                                    </span>
                                </div>

                                {/* Booking Filter Tabs */}
                                <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
                                    <button
                                        onClick={() => setBookingFilter('active')}
                                        className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                                            bookingFilter === 'active'
                                                ? 'bg-white text-blue-600 shadow-sm'
                                                : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                    >
                                        Active ({bookings.filter(b => b.status === 'confirmed').length})
                                    </button>
                                    <button
                                        onClick={() => setBookingFilter('completed')}
                                        className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                                            bookingFilter === 'completed'
                                                ? 'bg-white text-blue-600 shadow-sm'
                                                : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                    >
                                        Completed ({bookings.filter(b => b.status === 'completed').length})
                                    </button>
                                    <button
                                        onClick={() => setBookingFilter('all')}
                                        className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                                            bookingFilter === 'all'
                                                ? 'bg-white text-blue-600 shadow-sm'
                                                : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                    >
                                        All ({bookings.length})
                                    </button>
                                </div>

                                {loadingBookings ? (
                                    <div className="flex items-center justify-center py-16">
                                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                                        <p className="ml-4 text-gray-600 text-lg">Loading bookings...</p>
                                    </div>
                                ) : getFilteredBookings().length === 0 ? (
                                    <div className="text-center py-16">
                                        <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-6" />
                                        <p className="text-gray-500 text-xl font-medium mb-2">
                                            No {bookingFilter === 'all' ? '' : bookingFilter + ' '}bookings found
                                        </p>
                                        <p className="text-gray-400 text-base">
                                            {bookingFilter === 'active' 
                                                ? 'Your upcoming and current car rentals will appear here'
                                                : bookingFilter === 'completed'
                                                ? 'Your past car rentals will appear here'
                                                : 'Your car rental bookings will appear here'
                                            }
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {getFilteredBookings().map((booking) => (
                                            <div key={booking._id} className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center mb-4">
                                                            <Car className="w-6 h-6 text-gray-400 mr-3" />
                                                            <h3 className="font-semibold text-gray-900 text-lg">
                                                                {booking.car ? `${booking.car.make} ${booking.car.model}` : 'Car details unavailable'}
                                                            </h3>
                                                            <span className={`ml-3 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                                                                {getStatusIcon(booking.status)}
                                                                <span className="ml-1 capitalize">{booking.status || 'Unknown'}</span>
                                                            </span>
                                                        </div>
                                                        
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-base text-gray-600">
                                                            <div className="flex items-center py-2">
                                                                <Calendar className="w-5 h-5 mr-2" />
                                                                <div>
                                                                    <span className="text-sm text-gray-500">Start:</span>
                                                                    <div className="font-medium text-gray-900">{formatBookingDate(booking.startDate)}</div>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center py-2">
                                                                <Calendar className="w-5 h-5 mr-2" />
                                                                <div>
                                                                    <span className="text-sm text-gray-500">End:</span>
                                                                    <div className="font-medium text-gray-900">{formatBookingDate(booking.endDate)}</div>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center py-2 md:col-span-2">
                                                                <DollarSign className="w-5 h-5 mr-2" />
                                                                <div>
                                                                    <span className="text-sm text-gray-500">Total Price:</span>
                                                                    <div className="font-semibold text-gray-900 text-lg">
                                                                        ${booking.totalPrice != null ? booking.totalPrice.toFixed(2) : 'N/A'}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    <button
                                                        onClick={() => handleDeleteBooking(booking._id)}
                                                        disabled={deletingBookingId === booking._id}
                                                        className="ml-6 flex items-center px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors font-medium"
                                                    >
                                                        <Trash2 className="w-4 h-4 mr-2" />
                                                        {deletingBookingId === booking._id ? 'Deleting...' : 'Delete'}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Reviews Section */}
                            <UserReviewsSection user={user} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfilePage;
