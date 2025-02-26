import React, { useEffect, useState } from 'react';
import { Link, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import AdminSidebar from '../components/AdminSidebar';
import CarManagement from './CarManagement';
import UserManagement from './UserManagement';
import BookingManagement from './BookingManagement';

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
        <div className="flex">
            {/* Sidebar */}
            <AdminSidebar />

            {/* Main Content - Adjusted to Center Content */}
            <div className="flex-1 flex flex-col items-center justify-center p-6">
                <h2 className="text-3xl font-bold text-primary-color mb-6 text-center">
                    Admin Dashboard
                </h2>

                {error && <p className="text-red-500 text-center">{error}</p>}

                {loading ? (
                    <p className="text-center">Loading...</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
                        {/* Users Card */}
                        <Link
                            to="/admin-dashboard/users"
                            className="bg-blue-500 text-white p-6 rounded-lg shadow-md hover:bg-blue-600 transition text-center"
                        >
                            <h3 className="text-2xl font-bold">Users</h3>
                            <p className="text-4xl mt-2">{userCount !== null ? userCount : 'N/A'}</p>
                        </Link>

                        {/* Cars Card */}
                        <Link
                            to="/admin-dashboard/cars"
                            className="bg-green-500 text-white p-6 rounded-lg shadow-md hover:bg-green-600 transition text-center"
                        >
                            <h3 className="text-2xl font-bold">Cars</h3>
                            <p className="text-4xl mt-2">{carCount !== null ? carCount : 'N/A'}</p>
                        </Link>

                        {/* Bookings Card */}
                        <Link
                            to="/admin-dashboard/bookings"
                            className="bg-yellow-500 text-white p-6 rounded-lg shadow-md hover:bg-yellow-600 transition text-center"
                        >
                            <h3 className="text-2xl font-bold">Bookings</h3>
                            <p className="text-4xl mt-2">{bookingCount !== null ? bookingCount : 'N/A'}</p>
                        </Link>
                    </div>
                )}

                <Routes>
                    <Route path="cars" element={<CarManagement />} />
                    <Route path="users" element={<UserManagement />} />
                    <Route path="bookings" element={<BookingManagement />} />
                </Routes>
            </div>
        </div>
    );
};

export default AdminDashboard;