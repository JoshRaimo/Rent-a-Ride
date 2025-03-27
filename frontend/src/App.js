import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Login from './pages/Login';
import Register from './pages/Register';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import AdminDashboard from './pages/AdminDashboard';
import AvailableCars from './pages/AvailableCars';
import ProtectedRoute from './components/ProtectedRoute';
import BookCar from './pages/BookCar';
import CarManagement from './pages/CarManagement';
import UserManagement from './pages/UserManagement';
import BookingManagement from './pages/BookingManagement';

import {
    getToken,
    setToken,
    removeToken,
    decodeToken,
    isTokenExpired,
    logout,
} from './utils/auth';

import { LogOut } from 'lucide-react'; // Import logout icon

const App = () => {
    return (
        <Router>
            <MainApp />
            <ToastContainer position="top-right" autoClose={3000} />
        </Router>
    );
};

const MainApp = () => {
    const navigate = useNavigate();
    const [token, setTokenState] = useState(getToken());
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);

    useEffect(() => {
        const validateToken = () => {
            const storedToken = getToken();
            if (!storedToken) return;

            if (isTokenExpired()) {
                handleLogout(false);
            } else {
                const decoded = decodeToken();
                if (decoded) {
                    setTokenState(storedToken);
                    setUser(decoded);
                }
            }
        };

        validateToken();
    }, []);

    const handleLogout = (showNotification = true) => {
        logout(navigate);
        setTokenState(null);
        setUser(null);
        if (showNotification) {
            toast.success('Logged out successfully!');
        }
    };

    const handleLoginSuccess = (newToken) => {
        setToken(newToken);
        const decoded = decodeToken();
        setTokenState(newToken);
        setUser(decoded);
        navigate('/');
    };

    const handleUserUpdate = (updatedUser) => {
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
    };

    return (
        <div className="min-h-screen bg-secondary-color flex flex-col" style={{
            "--navbar-height": "5rem" // 80px
        }}>
            {/* Navbar */}
            <header className="navbar shadow-md bg-white z-40 fixed top-0 left-0 w-full" style={{ height: "var(--navbar-height)" }}>
                <div className="container mx-auto flex justify-between items-center px-6 h-full">
                    {/* Logo */}
                    <Link to="/" className="flex items-center space-x-2">
                        <img src="/rentaridelogo.png" alt="Rent-a-Ride Logo" className="h-12 w-auto transition-transform duration-300 hover:scale-110" />
                    </Link>

                    {/* Spacer to balance layout */}
                    <div className="flex-1" />

                    {/* Authentication/Profile Links */}
                    <div className="flex space-x-4 items-center">
                        {!token ? (
                            <>
                                <Link to="/login" className="hover:text-blue-500 text-primary-color text-sm">
                                    Login
                                </Link>
                                <Link to="/register" className="btn-signup">
                                    Sign Up
                                </Link>
                            </>
                        ) : (
                            <>
                                {user?.role === 'admin' && (
                                    <Link
                                        to="/admin-dashboard"
                                        className="hover:text-blue-500 text-primary-color text-sm"
                                    >
                                        Admin Dashboard
                                    </Link>
                                )}
                                                                <Link
                                    to="/profile"
                                    className="hover:text-blue-500 text-primary-color text-sm"
                                >
                                    {user?.username || 'User'}
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="hover:text-red-500 text-primary-color text-sm"
                                    title="Logout"
                                >
                                    <LogOut className="w-5 h-5" />
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 container mx-auto px-4 pt-20 pb-6">
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/login" element={<Login onLoginSuccess={handleLoginSuccess} />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/available-cars" element={<AvailableCars />} />
                    <Route path="/book-car" element={<BookCar />} />

                    {user?.role === 'admin' && (
                        <>
                            <Route path="/admin-dashboard/*" element={<AdminDashboard />} />
                            <Route path="/admin-dashboard/cars" element={<CarManagement />} />
                            <Route path="/admin-dashboard/users" element={<UserManagement />} />
                            <Route path="/admin-dashboard/bookings" element={<BookingManagement />} />
                        </>
                    )}

                    <Route element={<ProtectedRoute />}>
                        <Route
                            path="/profile"
                            element={<ProfilePage onUpdateUser={handleUserUpdate} />}
                        />
                    </Route>
                </Routes>
            </main>
        </div>
    );
};

export default App;