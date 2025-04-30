import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import CarListing from '../components/CarListing';
import { Range } from 'react-range';
import { formatInTimeZone, toDate } from 'date-fns-tz';

const AvailableCars = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const EST_TIMEZONE = 'America/New_York';

    // Get current date and time in EST
    const now = new Date();
    const estNow = toDate(now, { timeZone: EST_TIMEZONE });
    const today = new Date(estNow.getFullYear(), estNow.getMonth(), estNow.getDate());
    const todayFormatted = formatInTimeZone(today, EST_TIMEZONE, 'yyyy-MM-dd');

    const getNextHalfHour = () => {
        const nextHalfHour = toDate(new Date(), { timeZone: EST_TIMEZONE });
        const currentMinutes = estNow.getMinutes();
        const additionalMinutes = currentMinutes % 30 === 0 ? 30 : 0;
        nextHalfHour.setMinutes(Math.ceil(currentMinutes / 30) * 30 + additionalMinutes, 0, 0);

        let label = formatInTimeZone(nextHalfHour, EST_TIMEZONE, 'h:mm aa');
        if (label === '12:00 AM') label = 'Midnight';
        if (label === '12:00 PM') label = 'Noon';

        return {
            time: label,
            isNextDay: nextHalfHour.getHours() === 0 && nextHalfHour.getMinutes() === 0
        };
    };

    const [cars, setCars] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const [filters, setFilters] = useState({
        startDate: location.state?.startDate || todayFormatted,
        startTime: location.state?.startTime || getNextHalfHour().time,
        endDate: location.state?.endDate || '',
        endTime: location.state?.endTime || '',
        priceRange: [0, 1000],
        yearRange: [1990, new Date().getFullYear()],
        make: '',
        model: '',
    });

    const currentYear = new Date().getFullYear();
    const minYear = 1990; // Adjust this based on your needs
    const maxPrice = 1000; // Adjust this based on your maximum price

    useEffect(() => {
        const checkAuth = () => {
            const token = localStorage.getItem('token');
            setIsAuthenticated(!!token);
        };

        checkAuth();
        window.addEventListener('storage', checkAuth);
        return () => window.removeEventListener('storage', checkAuth);
    }, []);

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
            const cleanedFilters = {
                startDate: filters.startDate,
                endDate: filters.endDate,
                startTime: filters.startTime,
                endTime: filters.endTime,
                priceMin: filters.priceRange[0],
                priceMax: filters.priceRange[1],
                yearMin: filters.yearRange[0],
                yearMax: filters.yearRange[1],
                make: filters.make?.trim() || undefined,
                model: filters.model?.trim() || undefined,
            };

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

    // Generate time options in 30-minute intervals with Noon and Midnight labels
    const generateTimeOptions = (isStartTime = false) => {
        const options = [];
        const isToday = filters.startDate === todayFormatted;
        const nextHalfHourInfo = getNextHalfHour();

        for (let hour = 0; hour < 24; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                const time = new Date();
                time.setHours(hour, minute, 0, 0);
                let label = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

                if (label === '12:00 AM') label = 'Midnight';
                if (label === '12:00 PM') label = 'Noon';

                // Only filter times for start time on today's date
                if (!isStartTime || !isToday || 
                    (hour > estNow.getHours() || 
                    (hour === estNow.getHours() && minute >= Math.ceil(estNow.getMinutes() / 30) * 30))) {
                    options.push({ value: label, label });
                }
            }
        }
        return options;
    };

    // Filter time options based on selected date
    const getTimeOptions = () => {
        return generateTimeOptions();
    };

    const handleRangeChange = (field, values) => {
        setFilters(prev => ({
            ...prev,
            [field]: values
        }));
    };

    const handleFilterReset = () => {
        setFilters(prev => ({
            startDate: prev.startDate,
            startTime: prev.startTime,
            endDate: prev.endDate,
            endTime: prev.endTime,
            priceRange: [0, maxPrice],
            yearRange: [minYear, currentYear],
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
                                {generateTimeOptions(true).map((time, index) => (
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
                                {generateTimeOptions(false).map((time, index) => (
                                    <option key={index} value={time.value}>{time.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Price Range */}
                    <div className="mb-6">
                        <h4 className="font-medium mb-2">Price Range ($ per day)</h4>
                        <div className="px-2 py-4">
                            <div className="flex justify-between mb-2">
                                <span className="text-sm text-gray-600">${filters.priceRange[0]}</span>
                                <span className="text-sm text-gray-600">${filters.priceRange[1]}</span>
                            </div>
                            <Range
                                step={10}
                                min={0}
                                max={maxPrice}
                                values={filters.priceRange}
                                onChange={(values) => handleRangeChange('priceRange', values)}
                                renderTrack={({ props, children }) => (
                                    <div
                                        {...props}
                                        className="h-1 w-full bg-gray-200 rounded-full"
                                        style={{
                                            ...props.style,
                                        }}
                                    >
                                        <div
                                            className="h-full bg-primary-color rounded-full"
                                            style={{
                                                width: `${(filters.priceRange[1] - filters.priceRange[0]) / maxPrice * 100}%`,
                                                left: `${filters.priceRange[0] / maxPrice * 100}%`,
                                                position: 'absolute',
                                            }}
                                        />
                                        {children}
                                    </div>
                                )}
                                renderThumb={({ props }) => (
                                    <div
                                        {...props}
                                        className="h-4 w-4 rounded-full bg-white border-2 border-primary-color focus:outline-none"
                                        style={{
                                            ...props.style,
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                                        }}
                                    />
                                )}
                            />
                        </div>
                    </div>

                    {/* Year Range */}
                    <div className="mb-6">
                        <h4 className="font-medium mb-2">Year Range</h4>
                        <div className="px-2 py-4">
                            <div className="flex justify-between mb-2">
                                <span className="text-sm text-gray-600">{filters.yearRange[0]}</span>
                                <span className="text-sm text-gray-600">{filters.yearRange[1]}</span>
                            </div>
                            <Range
                                step={1}
                                min={minYear}
                                max={currentYear}
                                values={filters.yearRange}
                                onChange={(values) => handleRangeChange('yearRange', values)}
                                renderTrack={({ props, children }) => (
                                    <div
                                        {...props}
                                        className="h-1 w-full bg-gray-200 rounded-full"
                                        style={{
                                            ...props.style,
                                        }}
                                    >
                                        <div
                                            className="h-full bg-primary-color rounded-full"
                                            style={{
                                                width: `${(filters.yearRange[1] - filters.yearRange[0]) / (currentYear - minYear) * 100}%`,
                                                left: `${(filters.yearRange[0] - minYear) / (currentYear - minYear) * 100}%`,
                                                position: 'absolute',
                                            }}
                                        />
                                        {children}
                                    </div>
                                )}
                                renderThumb={({ props }) => (
                                    <div
                                        {...props}
                                        className="h-4 w-4 rounded-full bg-white border-2 border-primary-color focus:outline-none"
                                        style={{
                                            ...props.style,
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                                        }}
                                    />
                                )}
                            />
                        </div>
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