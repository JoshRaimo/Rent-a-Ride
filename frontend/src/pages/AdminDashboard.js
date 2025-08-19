import React, { useEffect, useState } from 'react';
import { Link, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import { Users, Car, Calendar, TrendingUp, Activity, BarChart3 } from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import CarManagement from './CarManagement';
import UserManagement from './UserManagement';
import BookingManagement from './BookingManagement';
import ReviewManagement from './ReviewManagement';

const AdminDashboard = () => {
    const [userCount, setUserCount] = useState(null);
    const [carCount, setCarCount] = useState(null);
    const [bookingCount, setBookingCount] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    setError('Unauthorized: No token found.');
                    setLoading(false);
                    return;
                }

                const headers = { Authorization: `Bearer ${token}` };

                const [users, cars, bookings] = await Promise.all([
                    axios.get(`${process.env.REACT_APP_API_URL}/stats/users/count`, { headers }),
                    axios.get(`${process.env.REACT_APP_API_URL}/stats/cars/count`, { headers }),
                    axios.get(`${process.env.REACT_APP_API_URL}/stats/bookings/count`, { headers }),
                ]);

                setUserCount(users.data.count);
                setCarCount(cars.data.count);
                setBookingCount(bookings.data.count);
            } catch (err) {
                console.error('Error fetching stats:', err.response?.data || err.message);
                setError(err.response?.data?.message || 'Failed to load dashboard stats.');
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Sidebar */}
            <AdminSidebar />

            {/* Main Content */}
            <div className="flex-1 ml-20 p-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center mb-2">
                        <BarChart3 className="w-8 h-8 text-blue-600 mr-3" />
                        <h1 className="text-4xl font-bold text-gray-900">Admin Dashboard</h1>
                    </div>
                    <p className="text-gray-600 text-lg">Welcome back! Here's what's happening with your rental business today.</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-700 flex items-center">
                            <Activity className="w-5 h-5 mr-2" />
                            {error}
                        </p>
                    </div>
                )}

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        <p className="ml-4 text-gray-600 text-lg">Loading dashboard data...</p>
                    </div>
                ) : (
                    <>
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            {/* Users Card */}
                            <Link
                                to="/admin-dashboard/users"
                                className="group bg-white p-6 rounded-xl shadow-md hover:shadow-xl border border-gray-200 hover:border-blue-300 transition-all duration-300 transform hover:-translate-y-1"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-500 text-sm font-medium uppercase tracking-wide">Total Users</p>
                                        <p className="text-3xl font-bold text-gray-900 mt-2">
                                            {userCount !== null ? userCount.toLocaleString() : 'N/A'}
                                        </p>
                                        <div className="flex items-center mt-2">
                                            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                                            <span className="text-green-500 text-sm font-medium">Active</span>
                                        </div>
                                    </div>
                                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                                        <Users className="w-6 h-6 text-blue-600" />
                                    </div>
                                </div>
                            </Link>

                            {/* Cars Card */}
                            <Link
                                to="/admin-dashboard/cars"
                                className="group bg-white p-6 rounded-xl shadow-md hover:shadow-xl border border-gray-200 hover:border-green-300 transition-all duration-300 transform hover:-translate-y-1"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-500 text-sm font-medium uppercase tracking-wide">Available Cars</p>
                                        <p className="text-3xl font-bold text-gray-900 mt-2">
                                            {carCount !== null ? carCount.toLocaleString() : 'N/A'}
                                        </p>
                                        <div className="flex items-center mt-2">
                                            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                                            <span className="text-green-500 text-sm font-medium">In Fleet</span>
                                        </div>
                                    </div>
                                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                                        <Car className="w-6 h-6 text-green-600" />
                                    </div>
                                </div>
                            </Link>

                            {/* Bookings Card */}
                            <Link
                                to="/admin-dashboard/bookings"
                                className="group bg-white p-6 rounded-xl shadow-md hover:shadow-xl border border-gray-200 hover:border-purple-300 transition-all duration-300 transform hover:-translate-y-1"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-500 text-sm font-medium uppercase tracking-wide">Total Bookings</p>
                                        <p className="text-3xl font-bold text-gray-900 mt-2">
                                            {bookingCount !== null ? bookingCount.toLocaleString() : 'N/A'}
                                        </p>
                                        <div className="flex items-center mt-2">
                                            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                                            <span className="text-green-500 text-sm font-medium">All Time</span>
                                        </div>
                                    </div>
                                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                                        <Calendar className="w-6 h-6 text-purple-600" />
                                    </div>
                                </div>
                            </Link>
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Link
                                    to="/admin-dashboard/cars"
                                    className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors group"
                                >
                                    <Car className="w-5 h-5 text-gray-600 group-hover:text-blue-600 mr-3" />
                                    <span className="text-gray-700 group-hover:text-blue-700 font-medium">Manage Cars</span>
                                </Link>
                                <Link
                                    to="/admin-dashboard/users"
                                    className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors group"
                                >
                                    <Users className="w-5 h-5 text-gray-600 group-hover:text-blue-600 mr-3" />
                                    <span className="text-gray-700 group-hover:text-blue-700 font-medium">Manage Users</span>
                                </Link>
                                <Link
                                    to="/admin-dashboard/bookings"
                                    className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors group"
                                >
                                    <Calendar className="w-5 h-5 text-gray-600 group-hover:text-blue-600 mr-3" />
                                    <span className="text-gray-700 group-hover:text-blue-700 font-medium">View Bookings</span>
                                </Link>
                            </div>
                        </div>
                    </>
                )}

                <Routes>
                    <Route path="cars" element={<CarManagement />} />
                    <Route path="users" element={<UserManagement />} />
                    <Route path="bookings" element={<BookingManagement />} />
                    <Route path="reviews" element={<ReviewManagement />} />
                </Routes>
            </div>
        </div>
    );
};

export default AdminDashboard;