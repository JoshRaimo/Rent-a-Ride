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

import {
    getToken,
    setToken,
    removeToken,
    decodeToken,
    isTokenExpired,
    logout,
} from './utils/auth';

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
        <div className="min-h-screen bg-secondary-color flex flex-col">
            {/* Navbar */}
            <header className="navbar shadow-md bg-white">
                <div className="container mx-auto flex justify-between items-center px-6 py-4">
                    {/* Logo */}
                    <h1 className="text-2xl font-bold text-primary-color">
                        <Link to="/">Rent-a-Ride</Link>
                    </h1>

                    {/* Navigation Links */}
                    <nav className="flex-1 flex justify-center">
                        <ul className="flex space-x-6">
                            <li>
                                <Link to="/" className="hover:text-blue-500 text-primary-color">
                                    Home
                                </Link>
                            </li>
                            <li>
                                <Link to="available-cars" className="hover:text-blue-500 text-pimary-color">
                                    Rent a Car
                                </Link>
                            </li>
                        </ul>
                    </nav>

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
                                    Profile
                                </Link>
                                <span className="text-text-color text-sm">{user?.username || 'User'}</span>
                                <button
                                    onClick={handleLogout}
                                    className="hover:text-red-500 text-primary-color text-sm"
                                >
                                    Logout
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 container mx-auto px-4 py-6">
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