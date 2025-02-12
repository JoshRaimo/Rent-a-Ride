import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import CarListing from '../components/CarListing';

const AvailableCars = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [cars, setCars] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const [filters, setFilters] = useState({
        startDate: location.state?.startDate || '',
        startTime: location.state?.startTime || '',
        endDate: location.state?.endDate || '',
        endTime: location.state?.endTime || '',
    });

    useEffect(() => {
        const checkAuth = () => {
            const token = localStorage.getItem('token');
            setIsAuthenticated(!!token);
        };

        checkAuth();
        window.addEventListener('storage', checkAuth);
        return () => window.removeEventListener('storage', checkAuth);
    }, []);

    const today = new Date();
    const todayFormatted = today.toISOString().split('T')[0];

    useEffect(() => {
        if (filters.startDate && filters.endDate) {
            fetchAvailableCars();
        }
    }, [filters.startDate, filters.endDate, filters.startTime, filters.endTime]);

    const fetchAvailableCars = async () => {
        if (!filters.startDate || !filters.endDate || !filters.startTime || !filters.endTime) {
            setError('Please select a start and end date and time.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/cars/available`, {
                params: {
                    startDate: filters.startDate,
                    startTime: filters.startTime,
                    endDate: filters.endDate,
                    endTime: filters.endTime,
                },
            });

            // **Filter out already booked cars**
            const availableCars = response.data.filter((car) => !car.isBooked);
            setCars(availableCars);
        } catch (err) {
            console.error('Error fetching available cars:', err);
            setError('Failed to load available cars.');
        } finally {
            setLoading(false);
        }
    };

    const handleBookNow = (car) => {
        navigate('/book-car', { state: { car, ...filters } });
    };

    const handleLoginRedirect = () => {
        toast.warn('You must be logged in to book a car.', {
            position: 'top-center',
            autoClose: 3000,
            hideProgressBar: true,
            closeOnClick: true,
            pauseOnHover: false,
            draggable: false,
        });

        setTimeout(() => {
            navigate('/login');
        }, 3000);
    };

    const handleInputChange = (field, value) => {
        setFilters((prevFilters) => ({
            ...prevFilters,
            [field]: value,
        }));
    };

    // Generate time options in 30-minute intervals with "Midnight" and "Noon" labels
    const generateTimeOptions = () => {
        const options = [];
        for (let hour = 0; hour < 24; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                const time = new Date();
                time.setHours(hour, minute, 0, 0);
                let label = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

                if (label === '12:00 AM') label = 'Midnight';
                if (label === '12:00 PM') label = 'Noon';

                options.push({ value: label, label });
            }
        }
        return options;
    };

    return (
        <div className="container mx-auto mt-10 p-6 bg-white rounded-lg shadow-lg">
            <h2 className="text-3xl font-bold text-center text-primary-color mb-6">
                Available Cars for Rent
            </h2>

            {/* Date and Time Filters */}
            <div className="flex flex-wrap justify-center gap-4 mb-6">
                <input
                    type="date"
                    className="px-3 py-2 border border-gray-300 rounded-md"
                    value={filters.startDate}
                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                    min={todayFormatted}
                />

                <select
                    className="px-3 py-2 border border-gray-300 rounded-md"
                    value={filters.startTime}
                    onChange={(e) => handleInputChange('startTime', e.target.value)}
                >
                    <option value="">Select Time</option>
                    {generateTimeOptions().map((time, index) => (
                        <option key={index} value={time.value}>{time.label}</option>
                    ))}
                </select>

                <input
                    type="date"
                    className="px-3 py-2 border border-gray-300 rounded-md"
                    value={filters.endDate}
                    onChange={(e) => handleInputChange('endDate', e.target.value)}
                    min={filters.startDate || todayFormatted}
                />

                <select
                    className="px-3 py-2 border border-gray-300 rounded-md"
                    value={filters.endTime}
                    onChange={(e) => handleInputChange('endTime', e.target.value)}
                >
                    <option value="">Select Time</option>
                    {generateTimeOptions().map((time, index) => (
                        <option key={index} value={time.value}>{time.label}</option>
                    ))}
                </select>
            </div>

            {/* Error Message */}
            {error && <p className="text-red-500 text-center">{error}</p>}

            {/* Loading State */}
            {loading ? (
                <p className="text-center">Loading...</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {cars.length > 0 ? (
                        cars.map((car) => (
                            <CarListing
                                key={car.carId}
                                car={car}
                                showEditDeleteButtons={false}
                                onBookNow={isAuthenticated ? handleBookNow : null}
                                onLogin={!isAuthenticated ? handleLoginRedirect : null}
                            />
                        ))
                    ) : (
                        <p className="text-center text-gray-500">
                            No cars available for the selected dates and times.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};

export default AvailableCars;