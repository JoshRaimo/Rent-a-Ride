import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import CarManagement from './CarManagement';

const AdminDashboard = () => {
    return (
        <div className="flex">
            <AdminSidebar />
            <div className="main-content p-6 bg-white rounded-lg shadow-lg">
                <Routes>
                    <Route path="/" element={
                        <div className="text-center">
                            <h2 className="text-3xl font-bold text-primary-color mb-6">Admin Dashboard</h2>
                            <button className="btn-primary mb-4">
                                Users: {/* Add user count logic */}
                            </button>
                            <button className="btn-primary mb-4">
                                Cars: {/* Add car count logic */}
                            </button>
                            <button className="btn-primary">
                                Bookings: {/* Add booking count logic */}
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