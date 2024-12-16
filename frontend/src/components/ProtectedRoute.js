import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { isTokenExpired, getToken } from '../utils/auth'; // Import helper functions from utils

const ProtectedRoute = () => {
    const token = getToken(); // Get token from utils

    // Check if token exists and is valid
    if (!token || isTokenExpired()) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;