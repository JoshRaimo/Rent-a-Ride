import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import CarListing from '../components/CarListing';
import { Range } from 'react-range';
import { formatInTimeZone, toDate } from 'date-fns-tz';
import { useAuthModal } from '../contexts/AuthModalContext';

const AvailableCars = ({ isAuthenticated }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { openLoginModal, bookingMade, clearBookingNotification } = useAuthModal();
    const EST_TIMEZONE = 'America/New_York';
    
    // Memoize date values to prevent infinite re-renders
    const now = useMemo(() => new Date(), []);
    const estNow = useMemo(() => toDate(now, { timeZone: EST_TIMEZONE }), [now]);
    const today = useMemo(() => new Date(estNow.getFullYear(), estNow.getMonth(), estNow.getDate()), [estNow]);
    const todayFormatted = useMemo(() => formatInTimeZone(today, EST_TIMEZONE, 'yyyy-MM-dd'), [today]);

    const getNextHalfHour = useCallback(() => {
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
    }, [estNow, EST_TIMEZONE]);

    const [cars, setCars] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [hasInitialized, setHasInitialized] = useState(false);

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

    // Handle date adjustment for late night times (same logic as homepage)
    useEffect(() => {
        if (!location.state?.startDate && !location.state?.endDate) {
            const nextHalfHour = new Date();
            const currentMinutes = now.getMinutes();
            const additionalMinutes = currentMinutes % 30 === 0 ? 30 : 0;
            nextHalfHour.setMinutes(Math.ceil(currentMinutes / 30) * 30 + additionalMinutes, 0, 0);

            // If current time will roll over to midnight or is after 11:30 PM
            if ((nextHalfHour.getHours() === 0 && nextHalfHour.getMinutes() === 0) || 
                (now.getHours() === 23 && now.getMinutes() >= 30)) {
                
                // Set start date to tomorrow (next day)
                const nextDay = new Date();
                nextDay.setDate(now.getDate() + 1);
                nextDay.setHours(0, 0, 0, 0);
                const nextDayFormatted = nextDay.toISOString().split('T')[0];
                
                // Set end date to the day after tomorrow
                const dayAfterNext = new Date(nextDay);
                dayAfterNext.setDate(nextDay.getDate() + 1);
                const dayAfterNextFormatted = dayAfterNext.toISOString().split('T')[0];
                
                setFilters(prev => ({
                    ...prev,
                    startDate: nextDayFormatted,
                    endDate: dayAfterNextFormatted,
                }));
            } else {
                // Set default end date to tomorrow if not already set
                const tomorrow = new Date(today);
                tomorrow.setDate(today.getDate() + 1);
                const tomorrowFormatted = tomorrow.toISOString().split('T')[0];
                
                setFilters(prev => ({
                    ...prev,
                    endDate: tomorrowFormatted,
                }));
            }
        }
    }, [location.state]); // Only depend on location.state changes

    const currentYear = useMemo(() => new Date().getFullYear(), []);
    const minYear = 1990;
    const maxPrice = 1000;

    // Memoize the fetch function to prevent recreation on every render
    const fetchAvailableCars = useCallback(async () => {
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

            setCars(response.data);
            setHasInitialized(true);
        } catch (err) {
            console.error('Error fetching available cars:', err);
            setError('Failed to load available cars.');
        } finally {
            setLoading(false);
        }
    }, [filters]);

    // Single useEffect for all data fetching logic
    useEffect(() => {
        // Only fetch if we have the required filter values
        if (filters.startDate && filters.endDate && filters.startTime && filters.endTime) {
            // Initial load or filter change
            if (!hasInitialized || filters.startDate !== location.state?.startDate || filters.endDate !== location.state?.endDate) {
                fetchAvailableCars();
            }
        }
    }, [filters.startDate, filters.endDate, filters.startTime, filters.endTime, hasInitialized, fetchAvailableCars, location.state]);

    // Handle booking notifications
    useEffect(() => {
        if (bookingMade && hasInitialized) {
            fetchAvailableCars();
            clearBookingNotification();
        }
    }, [bookingMade, hasInitialized, fetchAvailableCars, clearBookingNotification]);

    // Handle window focus (user returning to page)
    useEffect(() => {
        const handleFocus = () => {
            if (hasInitialized && filters.startDate && filters.endDate) {
                fetchAvailableCars();
            }
        };

        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [hasInitialized, filters.startDate, filters.endDate, fetchAvailableCars]);

    const handleBookNow = useCallback((car) => {
        navigate('/book-car', { 
            state: { 
                car,
                startDate: filters.startDate,
                startTime: filters.startTime,
                endDate: filters.endDate,
                endTime: filters.endTime
            } 
        });
    }, [navigate, filters.startDate, filters.startTime, filters.endDate, filters.endTime]);

    // Memoize the car data separately from authentication-dependent props
    const carData = useMemo(() => {
        if (loading || !cars.length) return null;
        return cars;
    }, [cars, loading]);

    // Memoize the car listings with stable props - separate authentication logic
    const carListings = useMemo(() => {
        if (!carData) return null;
        
        return carData.map((car, idx) => {
            // Create stable props that don't change with authentication (excluding key)
            const stableProps = {
                car,
                showEditDeleteButtons: false,
            };

            // Add authentication-dependent props separately
            if (isAuthenticated) {
                stableProps.onBookNow = handleBookNow;
                stableProps.onLogin = null;
            } else {
                stableProps.onBookNow = null;
                stableProps.onLogin = () => openLoginModal(location.pathname);
            }

            // Use a stable key that doesn't change with authentication
            return (
                <CarListing
                    key={`${car.carId}-${car.make}-${car.model}-${car.year}`}
                    {...stableProps}
                />
            );
        });
    }, [carData, isAuthenticated, openLoginModal, handleBookNow, location.pathname]);

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
        <div className="container mx-auto mt-6 md:mt-10 p-3 md:p-6 available-cars-page">
            <h2 className="text-2xl md:text-3xl font-bold text-center text-primary-color mb-4 md:mb-6">
                Available Cars for Rent
            </h2>

            <div className="flex flex-col lg:flex-row gap-4 md:gap-6">
                {/* Sidebar Filters */}
                <div className="w-full lg:w-1/4 bg-white rounded-lg shadow-lg p-4 h-fit order-2 lg:order-1">
                    <h3 className="font-semibold text-lg mb-4">Filters</h3>
                    
                    {/* Date and Time Filters */}
                    <div className="mb-4">
                        <h4 className="font-medium mb-2">Rental Period</h4>
                        <div className="grid grid-cols-2 md:grid-cols-1 gap-3 md:gap-4 mb-6">
                            <div className="col-span-2 md:col-span-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                                <input
                                    type="date"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                    value={filters.startDate}
                                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                                    min={todayFormatted}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                                <select
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                    value={filters.startTime}
                                    onChange={(e) => handleInputChange('startTime', e.target.value)}
                                >
                                    {generateTimeOptions(true).map((time, index) => (
                                        <option key={index} value={time.value}>{time.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="col-span-2 md:col-span-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                                <input
                                    type="date"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                    value={filters.endDate}
                                    onChange={(e) => handleInputChange('endDate', e.target.value)}
                                    min={filters.startDate || todayFormatted}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                                <select
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                    value={filters.endTime}
                                    onChange={(e) => handleInputChange('endTime', e.target.value)}
                                >
                                    {generateTimeOptions(false).map((time, index) => (
                                        <option key={index} value={time.value}>{time.label}</option>
                                    ))}
                                </select>
                            </div>
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
                                renderThumb={({ props, index }) => (
                                    <div
                                        key={`price-thumb-${index}`}
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
                                renderThumb={({ props, index }) => (
                                    <div
                                        key={`year-thumb-${index}`}
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
                <div className="w-full md:w-3/4 order-1 lg:order-2">
                    {/* Error Message */}
                    {error && <p className="text-red-500 text-center mb-4">{error}</p>}

                    {/* Loading State */}
                    {loading ? (
                        <div className="flex justify-center items-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-color"></div>
                        </div>
                    ) : (
                        <div className="featured-cars grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 max-w-7xl mx-auto">
                            {carListings}
                            {carListings === null && (
                                <div className="col-span-full text-center py-12">
                                    <p className="text-gray-500 text-lg">
                                        No cars available for the selected dates and times.
                                    </p>
                                    <p className="text-gray-400 text-sm mt-2">
                                        Try adjusting your filters or selecting different dates.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AvailableCars;