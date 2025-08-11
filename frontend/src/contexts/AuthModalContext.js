import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

const AuthModalContext = createContext();

export const useAuthModal = () => {
    const context = useContext(AuthModalContext);
    if (!context) {
        throw new Error('useAuthModal must be used within an AuthModalProvider');
    }
    return context;
};

export const AuthModalProvider = ({ children }) => {
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [preLoginLocation, setPreLoginLocation] = useState(null); // New state
    const [bookingMade, setBookingMade] = useState(false); // New state for tracking bookings
    
    // Use ref to store current value without causing re-renders
    const preLoginLocationRef = useRef(null);

    const openLoginModal = useCallback((location = null) => { // Modified signature
        setShowRegisterModal(false);
        setShowLoginModal(true);
        if (location) {
            setPreLoginLocation(location); // Store location
            preLoginLocationRef.current = location; // Also store in ref
        }
    }, []);

    const openRegisterModal = useCallback(() => {
        setShowLoginModal(false);
        setShowRegisterModal(true);
    }, []);

    const closeLoginModal = useCallback(() => setShowLoginModal(false), []);
    const closeRegisterModal = useCallback(() => setShowRegisterModal(false), []);
    
    const getPreLoginLocation = useCallback(() => preLoginLocationRef.current, []); // Use ref instead of state
    const clearPreLoginLocation = useCallback(() => {
        setPreLoginLocation(null);
        preLoginLocationRef.current = null;
    }, []);

    // New functions for booking management
    const notifyBookingMade = useCallback(() => setBookingMade(true), []);
    const clearBookingNotification = useCallback(() => setBookingMade(false), []);

    const value = {
        showLoginModal,
        showRegisterModal,
        openLoginModal,
        openRegisterModal,
        closeLoginModal,
        closeRegisterModal,
        getPreLoginLocation, // Added to value
        clearPreLoginLocation, // Added to value
        bookingMade, // Added to value
        notifyBookingMade, // Added to value
        clearBookingNotification, // Added to value
    };

    return (
        <AuthModalContext.Provider value={value}>
            {children}
        </AuthModalContext.Provider>
    );
};
