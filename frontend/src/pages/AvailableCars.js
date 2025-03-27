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
        priceMin: '',
        priceMax: '',
        year: '',
        make: '',
        model: '',
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
            // Add debounce to prevent too many API calls
            const timeoutId = setTimeout(() => {
                fetchAvailableCars();
            }, 500);
            return () => clearTimeout(timeoutId);
        }
    }, [filters]); // Simplified dependency array to watch all filter changes

    const fetchAvailableCars = async () => {
        if (!filters.startDate || !filters.endDate) {
            setError('Please select a start and end date.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Clean and prepare the filters
            const cleanedFilters = {
                startDate: filters.startDate,
                endDate: filters.endDate,
                startTime: filters.startTime,
                endTime: filters.endTime,
            };

            // Only add numeric filters if they have valid values
            if (filters.priceMin && !isNaN(filters.priceMin)) {
                cleanedFilters.priceMin = Number(filters.priceMin);
            }
            
            if (filters.priceMax && !isNaN(filters.priceMax)) {
                cleanedFilters.priceMax = Number(filters.priceMax);
            }
            
            if (filters.year && !isNaN(filters.year)) {
                cleanedFilters.year = Number(filters.year);
            }

            // Only add text filters if they're not empty strings
            if (filters.make?.trim()) {
                cleanedFilters.make = filters.make.trim();
            }
            
            if (filters.model?.trim()) {
                cleanedFilters.model = filters.model.trim();
            }

            const response = await axios.get(`${process.env.REACT_APP_API_URL}/cars/available`, {
                params: cleanedFilters
            });

            // Log for debugging
            console.log('Filters sent:', cleanedFilters);
            console.log('Cars received:', response.data);

            setCars(response.data);
        } catch (err) {
            console.error('Error fetching available cars:', err);
            setError('Failed to load available cars.');
        } finally {
            setLoading(false);
        }
    };

    const handleBookNow = (car) => {
        navigate('/book-car', { 
            state: { 
                car,  // Send full car object
                startDate: filters.startDate,
                startTime: filters.startTime,
                endDate: filters.endDate,
                endTime: filters.endTime
            } 
        });
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
        setFilters(prevFilters => ({
            ...prevFilters,
            [field]: value === '' ? '' : value
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

    const handleFilterReset = () => {
        setFilters(prev => ({
            startDate: prev.startDate,
            startTime: prev.startTime,
            endDate: prev.endDate,
            endTime: prev.endTime,
            priceMin: '',
            priceMax: '',
            year: '',
            make: '',
            model: '',
        }));
    };

    return (
        <div className="container mx-auto mt-10 p-6">
            <h2 className="text-3xl font-bold text-center text-primary-color mb-6">
                Available Cars for Rent
            </h2>

            <div className="flex flex-col md:flex-row gap-6">
                {/* Sidebar Filters */}
                <div className="w-full md:w-1/4 bg-white rounded-lg shadow-lg p-4 h-fit">
                    <h3 className="font-semibold text-lg mb-4">Filters</h3>
                    
                    {/* Date and Time Filters */}
                    <div className="mb-4">
                        <h4 className="font-medium mb-2">Rental Period</h4>
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
                    </div>

                    {/* Price Range */}
                    <div className="mb-4">
                        <h4 className="font-medium mb-2">Price Range</h4>
                        <div className="flex gap-2">
                            <input
                                type="number"
                                placeholder="Min"
                                className="w-1/2 px-3 py-2 border border-gray-300 rounded-md"
                                value={filters.priceMin}
                                onChange={(e) => handleInputChange('priceMin', e.target.value)}
                            />
                            <input
                                type="number"
                                placeholder="Max"
                                className="w-1/2 px-3 py-2 border border-gray-300 rounded-md"
                                value={filters.priceMax}
                                onChange={(e) => handleInputChange('priceMax', e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Year */}
                    <div className="mb-4">
                        <h4 className="font-medium mb-2">Year</h4>
                        <input
                            type="number"
                            placeholder="Year"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            value={filters.year}
                            onChange={(e) => handleInputChange('year', e.target.value)}
                        />
                    </div>

                    {/* Make and Model */}
                    <div className="mb-4">
                        <input
                            type="text"
                            placeholder="Make"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md mb-2"
                            value={filters.make}
                            onChange={(e) => handleInputChange('make', e.target.value)}
                        />
                        <input
                            type="text"
                            placeholder="Model"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            value={filters.model}
                            onChange={(e) => handleInputChange('model', e.target.value)}
                        />
                    </div>

                    {/* Reset Filters Button */}
                    <button
                        onClick={handleFilterReset}
                        className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-md transition duration-200"
                    >
                        Reset Filters
                    </button>
                </div>

                {/* Main Content */}
                <div className="w-full md:w-3/4">
                    {/* Error Message */}
                    {error && <p className="text-red-500 text-center mb-4">{error}</p>}

                    {/* Loading State */}
                    {loading ? (
                        <p className="text-center">Loading...</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
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
            </div>
        </div>
    );
};

export default AvailableCars;