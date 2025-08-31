import React, { useEffect, useState, useMemo } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, useNavigate, useLocation } from 'react-router-dom';



import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import AdminDashboard from './pages/AdminDashboard';
import AvailableCars from './pages/AvailableCars';

import ProtectedRoute from './components/ProtectedRoute';
import BookCar from './pages/BookCar';
import CarManagement from './pages/CarManagement';
import UserManagement from './pages/UserManagement';
import BookingManagement from './pages/BookingManagement';
import ReviewManagement from './pages/ReviewManagement';
import NotificationDemo from './pages/NotificationDemo';

import {
    getToken,
    setToken,
    removeToken,
    decodeToken,
    isTokenExpired,
    logout,
} from './utils/auth';

import { LogOut, Menu, X } from 'lucide-react'; // Import menu icons
import LoginModal from './components/LoginModal';
import RegisterModal from './components/RegisterModal';
import { AuthModalProvider, useAuthModal } from './contexts/AuthModalContext';
import { NotificationProvider, useNotification } from './contexts/NotificationContext';
import { ChatProvider } from './contexts/ChatContext';
import Chat from './components/Chat';

const App = () => {
    return (
        <Router>
            <NotificationProvider position="top-right">
                <AuthModalProvider>
                    <ChatProvider>
                        <MainApp />
                    </ChatProvider>
                </AuthModalProvider>
            </NotificationProvider>
        </Router>
    );
};

const MainApp = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [token, setTokenState] = useState(getToken());
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const { 
        showLoginModal, 
        showRegisterModal, 
        openLoginModal, 
        openRegisterModal, 
        closeLoginModal, 
        closeRegisterModal,
        getPreLoginLocation,
        clearPreLoginLocation
    } = useAuthModal();

    const { success: showSuccess, error: showError, info: showInfo } = useNotification();

    // Memoize isAuthenticated to prevent unnecessary re-renders
    const isAuthenticated = useMemo(() => !!token, [token]);

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

    // Close mobile menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isMobileMenuOpen && !event.target.closest('.navbar')) {
                setIsMobileMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isMobileMenuOpen]);

    const handleLogout = (showNotification = true) => {
        logout(navigate);
        setTokenState(null);
        setUser(null);
        setIsMobileMenuOpen(false); // Close mobile menu on logout
        if (showNotification) {
            showSuccess('Logged out successfully!');
        }
    };

    const handleLoginSuccess = (newToken) => {
        setToken(newToken);
        const decoded = decodeToken();
        setTokenState(newToken);
        setUser(decoded);
        setIsMobileMenuOpen(false); // Close mobile menu on login
        
        // Close the login modal
        closeLoginModal();
        
        // Show welcome notification
        showSuccess(`Welcome back, ${decoded.username}!`, { 
            title: 'Login Successful' 
        });
        
        // Redirect to pre-login location if available
        const preLoginLocation = getPreLoginLocation();
        if (preLoginLocation && preLoginLocation !== '/') {
            navigate(preLoginLocation);
            clearPreLoginLocation();
        }
    };

    const handleUserUpdate = (updatedUser) => {
        setUser(updatedUser);
    };

    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false);
    };

    return (
        <div className="min-h-screen bg-secondary-color flex flex-col" style={{
            "--navbar-height": "5rem" // 80px
        }}>
            {/* Navbar */}
            <header className="navbar shadow-md bg-white z-40 fixed top-0 left-0 w-full" style={{ height: "var(--navbar-height)" }}>
                <div className="container mx-auto flex justify-between items-center px-4 md:px-6 h-full">
                    {/* Logo */}
                    <Link to="/" className="flex items-center space-x-2" onClick={closeMobileMenu}>
                        <img src="/rentaridelogo.png" alt="Rent-a-Ride Logo" className="h-10 md:h-12 w-auto transition-transform duration-300 hover:scale-110" />
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex space-x-4 items-center">
                         {!token ? (
                             <>
                                 <Link 
                                     to="#"
                                     onClick={(e) => {
                                         e.preventDefault();
                                         openLoginModal(location.pathname);
                                     }}
                                     className="hover:text-blue-500 text-sm"
                                 >
                                     Login
                                 </Link>
                                 <button 
                                     onClick={openRegisterModal}
                                     className="btn-signup"
                                 >
                                     Sign Up
                                 </button>
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

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden p-2 rounded-md hover:bg-gray-100 transition-colors"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        aria-label="Toggle mobile menu"
                    >
                        {isMobileMenuOpen ? (
                            <X className="w-6 h-6 text-primary-color" />
                        ) : (
                            <Menu className="w-6 h-6 text-primary-color" />
                        )}
                    </button>
                </div>

                {/* Mobile Menu Overlay */}
                {isMobileMenuOpen && (
                    <div className="md:hidden absolute top-full left-0 w-full bg-white shadow-lg border-t border-gray-200">
                        <div className="px-4 py-6 space-y-4">
                            {!token ? (
                                <>
                                    <button 
                                        onClick={() => {
                                            openLoginModal(location.pathname);
                                            closeMobileMenu();
                                        }}
                                        className="w-full text-left py-3 px-4 rounded-lg hover:bg-gray-50 text-primary-color font-medium"
                                    >
                                        Login
                                    </button>
                                    <button 
                                        onClick={() => {
                                            openRegisterModal();
                                            closeMobileMenu();
                                        }}
                                        className="w-full py-3 px-4 rounded-lg bg-primary-color text-white font-medium hover:bg-accent-color transition-colors"
                                    >
                                        Sign Up
                                    </button>
                                </>
                            ) : (
                                <>
                                    {user?.role === 'admin' && (
                                        <Link
                                            to="/admin-dashboard"
                                            className="block py-3 px-4 rounded-lg hover:bg-gray-50 text-primary-color font-medium"
                                            onClick={closeMobileMenu}
                                        >
                                            Admin Dashboard
                                        </Link>
                                    )}
                                    <Link
                                        to="/profile"
                                        className="block py-3 px-4 rounded-lg hover:bg-gray-50 text-primary-color font-medium"
                                        onClick={closeMobileMenu}
                                    >
                                        {user?.username || 'User'}
                                    </Link>
                                    <button
                                        onClick={() => {
                                            handleLogout();
                                            closeMobileMenu();
                                        }}
                                        className="w-full text-left py-3 px-4 rounded-lg hover:bg-gray-50 text-red-500 font-medium"
                                    >
                                        Logout
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </header>

            {/* Main Content */}
            <main className="flex-1 container mx-auto px-4 md:px-6 pt-20 pb-6">
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/available-cars" element={<AvailableCars isAuthenticated={isAuthenticated} />} />

                    <Route path="/book-car" element={<BookCar />} />
                    <Route path="/notifications" element={<NotificationDemo />} />

                    {user?.role === 'admin' && (
                        <>
                            <Route path="/admin-dashboard/*" element={<AdminDashboard />} />
                            <Route path="/admin-dashboard/cars" element={<CarManagement />} />
                            <Route path="/admin-dashboard/users" element={<UserManagement />} />
                            <Route path="/admin-dashboard/bookings" element={<BookingManagement />} />
                            <Route path="/admin-dashboard/reviews" element={<ReviewManagement />} />
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

            {/* Auth Modals */}
            <LoginModal 
                isOpen={showLoginModal}
                onClose={closeLoginModal}
                onLoginSuccess={handleLoginSuccess}
                onShowRegister={openRegisterModal}
            />
            <RegisterModal 
                isOpen={showRegisterModal}
                onClose={closeRegisterModal}
                onShowLogin={openLoginModal}
            />

            {/* Chat Component - Only show when authenticated */}
            {isAuthenticated && <Chat />}
        </div>
    );
};

export default App;