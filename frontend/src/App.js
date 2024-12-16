import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Login from './pages/Login';
import Register from './pages/Register';
import HomePage from './pages/HomePage';
import CarListingsPage from './pages/CarListingsPage';
import ProfilePage from './pages/ProfilePage';
import ProtectedRoute from './components/ProtectedRoute';

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

// Separate MainApp component
const MainApp = () => {
    const navigate = useNavigate();
    const [token, setTokenState] = useState(getToken());
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);

    /**
     * Validates the token and sets user state.
     */
    const validateToken = () => {
        const storedToken = getToken();

        if (!storedToken) {
            // No token present, avoid triggering notifications
            return;
        }

        if (isTokenExpired()) {
            console.warn('Token has expired. Logging out silently...');
            handleLogout(false); // Silent logout
        } else {
            const decoded = decodeToken();
            if (decoded) {
                setTokenState(storedToken);
                setUser(decoded);
            }
        }
    };

    /**
     * Handles user logout, optionally showing a notification.
     * @param {boolean} showNotification - Whether to show a logout notification.
     */
    const handleLogout = (showNotification = true) => {
        console.log('Logging out...');
        logout(navigate);
        setTokenState(null);
        setUser(null);
        if (showNotification) {
            toast.success('Logged out successfully!');
        }
    };

    /**
     * Handles successful login and updates the state.
     */
    const handleLoginSuccess = (newToken) => {
        setToken(newToken);
        const decoded = decodeToken();
        setTokenState(newToken);
        setUser(decoded);
        navigate('/');
    };

    /**
     * Updates the user state after profile updates.
     */
    const handleUserUpdate = (updatedUser) => {
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser)); // Sync user data in localStorage
    };

    // Validate token on component mount
    useEffect(() => {
        validateToken();
    }, []);

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
            <header className="bg-blue-600 text-white py-4 shadow-md">
                <div className="container mx-auto flex justify-between items-center px-4">
                    <h1 className="text-2xl font-bold">
                        <Link to="/">Rent-a-Ride</Link>
                    </h1>
                    <nav>
                        <ul className="flex space-x-4">
                            <li>
                                <Link to="/" className="hover:underline">
                                    Home
                                </Link>
                            </li>
                            <li>
                                <Link to="/cars" className="hover:underline">
                                    Cars
                                </Link>
                            </li>
                            {!token ? (
                                <>
                                    <li>
                                        <Link to="/login" className="hover:underline">
                                            Login
                                        </Link>
                                    </li>
                                    <li>
                                        <Link to="/register" className="hover:underline">
                                            Register
                                        </Link>
                                    </li>
                                </>
                            ) : (
                                <>
                                    <li>
                                        <Link to="/profile" className="hover:underline">
                                            Profile
                                        </Link>
                                    </li>
                                    <li>
                                        <span className="text-white font-semibold">
                                            {user?.username || 'User'}
                                        </span>
                                    </li>
                                    <li>
                                        <button
                                            onClick={() => handleLogout()}
                                            className="hover:underline text-red-500"
                                        >
                                            Logout
                                        </button>
                                    </li>
                                </>
                            )}
                        </ul>
                    </nav>
                </div>
            </header>

            <main className="flex-1 container mx-auto px-4 py-6">
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route
                        path="/login"
                        element={<Login onLoginSuccess={handleLoginSuccess} />}
                    />
                    <Route path="/register" element={<Register />} />
                    <Route path="/cars" element={<CarListingsPage />} />

                    <Route element={<ProtectedRoute />}>
                        <Route
                            path="/profile"
                            element={<ProfilePage onUpdateUser={handleUserUpdate} />}
                        />
                    </Route>
                </Routes>
            </main>

            <footer className="bg-gray-800 text-white py-4 text-center">
                <p className="text-sm">© 2024 Rent-a-Ride. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default App;