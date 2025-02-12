import React, { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import CarManagement from './CarManagement';

const AdminDashboard = () => {
    const [userCount, setUserCount] = useState(0);
    const [carCount, setCarCount] = useState(0);
    const [bookingCount, setBookingCount] = useState(0);

    useEffect(() => {
        // Fetch user count
        fetch('/api/stats/users/count')
            .then(response => response.json())
            .then(data => setUserCount(data.count))
            .catch(error => console.error('Error fetching user count:', error));

        // Fetch car count
        fetch('/api/stats/cars/count')
            .then(response => response.json())
            .then(data => setCarCount(data.count))
            .catch(error => console.error('Error fetching car count:', error));

        // Fetch booking count
        fetch('/api/stats/bookings/count')
            .then(response => response.json())
            .then(data => setBookingCount(data.count))
            .catch(error => console.error('Error fetching booking count:', error));
    }, []);

    return (
        <div className="flex">
            <AdminSidebar />
            <div className="main-content p-6 bg-white rounded-lg shadow-lg">
                <Routes>
                    <Route path="/" element={
                        <div className="text-center">
                            <h2 className="text-3xl font-bold text-primary-color mb-6">Admin Dashboard</h2>
                            <button className="btn-primary mb-4">
                                Users: {userCount}
                            </button>
                            <button className="btn-primary mb-4">
                                Cars: {carCount}
                            </button>
                            <button className="btn-primary">
                                Bookings: {bookingCount}
                            </button>
                        </div>
                    } />
                    <Route path="cars" element={<CarManagement />} />
                    {/* Add routes for users and bookings management */}
                </Routes>
            </div>
        </div>
    );
};

export default AdminDashboard;