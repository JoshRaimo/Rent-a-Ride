import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
    
    // Use refs to prevent unnecessary re-renders
    const initializationRef = useRef({ initialized: false, lastFilters: null });
    const yearRangeRef = useRef(null);
    const carsRef = useRef([]);
    const filtersInitializedRef = useRef(false);
    const resetInProgressRef = useRef(false);
    
    // Memoize date values to prevent infinite re-renders
    const now = useMemo(() => new Date(), []);
    const estNow = useMemo(() => toDate(now, { timeZone: EST_TIMEZONE }), [now]);
    const today = useMemo(() => new Date(estNow.getFullYear(), estNow.getMonth(), estNow.getDate()), [estNow]);
    const todayFormatted = useMemo(() => formatInTimeZone(today, EST_TIMEZONE, 'yyyy-MM-dd'), [today]);
    const currentYear = useMemo(() => new Date().getFullYear(), []);

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
    const [filterLoading, setFilterLoading] = useState(false);
    const [resetLoading, setResetLoading] = useState(false);
    const [error, setError] = useState(null);
    const [hasInitialized, setHasInitialized] = useState(false);
    
    // Add state for makes and models
    const [makes, setMakes] = useState([]);
    const [models, setModels] = useState([]);
    const [yearRange, setYearRange] = useState(null);
    const [isYearRangeCached, setIsYearRangeCached] = useState(false);

    // Cache key for year range data
    const YEAR_RANGE_CACHE_KEY = 'rent-a-ride-year-range-cache';
    const YEAR_RANGE_CACHE_TIMESTAMP_KEY = 'rent-a-ride-year-range-timestamp';
    
    // Cache key for price range data
    const PRICE_RANGE_CACHE_KEY = 'rent-a-ride-price-range-cache';
    const PRICE_RANGE_CACHE_TIMESTAMP_KEY = 'rent-a-ride-price-range-timestamp';

    const [filters, setFilters] = useState({
        startDate: location.state?.startDate || todayFormatted,
        startTime: location.state?.startTime || '12:00 PM',
        endDate: location.state?.endDate || (() => {
            const tomorrow = toDate(new Date(today), { timeZone: EST_TIMEZONE });
            tomorrow.setDate(today.getDate() + 1);
            return formatInTimeZone(tomorrow, EST_TIMEZONE, 'yyyy-MM-dd');
        })(),
        endTime: location.state?.endTime || 'Midnight',
        priceRange: [0, 1000],
        yearRange: null,
        make: '',
        model: '',
    });

    // Function to get cached year range
    const getCachedYearRange = useCallback(() => {
        try {
            const cached = localStorage.getItem(YEAR_RANGE_CACHE_KEY);
            const timestamp = localStorage.getItem(YEAR_RANGE_CACHE_TIMESTAMP_KEY);
            
            if (cached && timestamp) {
                const parsedCache = JSON.parse(cached);
                const cacheAge = Date.now() - parseInt(timestamp);
                const cacheMaxAge = 24 * 60 * 60 * 1000; // 24 hours
                
                if (cacheAge < cacheMaxAge) {
                    return parsedCache;
                }
            }
        } catch (error) {
            console.error('Error reading cached year range:', error);
        }
        return null;
    }, []);

    // Function to cache year range data
    const cacheYearRange = useCallback((data) => {
        try {
            localStorage.setItem(YEAR_RANGE_CACHE_KEY, JSON.stringify(data));
            localStorage.setItem(YEAR_RANGE_CACHE_TIMESTAMP_KEY, Date.now().toString());
        } catch (error) {
            console.error('Error caching year range:', error);
        }
    }, []);

    // Function to check if we need to refresh year range
    const shouldRefreshYearRange = useCallback((newData) => {
        const cached = getCachedYearRange();
        if (!cached) return true;
        
        return cached.minYear !== newData.minYear || cached.maxYear !== newData.maxYear;
    }, [getCachedYearRange]);

    // Function to clear year range cache
    const clearYearRangeCache = useCallback(() => {
        try {
            localStorage.removeItem(YEAR_RANGE_CACHE_KEY);
            localStorage.removeItem(YEAR_RANGE_CACHE_TIMESTAMP_KEY);
        } catch (error) {
            console.error('Error clearing year range cache:', error);
        }
    }, []);

    // Function to refresh year range cache
    const refreshYearRangeCache = useCallback(async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/cars/year-range`);
            const { minYear, maxYear, nextYear, currentYear, availableYears } = response.data;
            
            let adjustedMinYear = minYear;
            let adjustedMaxYear = maxYear;
            
            if (minYear === maxYear) {
                adjustedMinYear = Math.max(1990, minYear - 1);
                adjustedMaxYear = Math.min(currentYear + 1, maxYear + 1);
            }
            
            const newYearRange = { 
                minYear: adjustedMinYear, 
                maxYear: adjustedMaxYear, 
                nextYear, 
                currentYear, 
                availableYears 
            };
            
            if (shouldRefreshYearRange(newYearRange)) {
                setYearRange(newYearRange);
                setFilters(prev => ({
                    ...prev,
                    yearRange: [adjustedMinYear, adjustedMaxYear]
                }));
                cacheYearRange(newYearRange);
                setIsYearRangeCached(false);
            } else {
                setIsYearRangeCached(true);
            }
        } catch (error) {
            console.error('Error refreshing year range cache:', error);
        }
    }, [shouldRefreshYearRange, cacheYearRange]);

    // Price range cache functions
    const getCachedPriceRange = useCallback(() => {
        try {
            const cached = localStorage.getItem(PRICE_RANGE_CACHE_KEY);
            const timestamp = localStorage.getItem(PRICE_RANGE_CACHE_TIMESTAMP_KEY);
            
            if (!cached || !timestamp) return null;
            
            // Cache valid for 1 hour (prices change less frequently than years)
            const cacheAge = Date.now() - parseInt(timestamp);
            const maxAge = 60 * 60 * 1000; // 1 hour
            
            if (cacheAge > maxAge) {
                clearPriceRangeCache();
                return null;
            }
            
            return JSON.parse(cached);
        } catch (error) {
            console.error('Error reading price range cache:', error);
            return null;
        }
    }, []);

    const cachePriceRange = useCallback((data) => {
        try {
            localStorage.setItem(PRICE_RANGE_CACHE_KEY, JSON.stringify(data));
            localStorage.setItem(PRICE_RANGE_CACHE_TIMESTAMP_KEY, Date.now().toString());
        } catch (error) {
            console.error('Error caching price range:', error);
        }
    }, []);

    const clearPriceRangeCache = useCallback(() => {
        try {
            localStorage.removeItem(PRICE_RANGE_CACHE_KEY);
            localStorage.removeItem(PRICE_RANGE_CACHE_TIMESTAMP_KEY);
        } catch (error) {
            console.error('Error clearing price range cache:', error);
        }
    }, []);

    const refreshPriceRangeCache = useCallback(async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/cars/price-range`);
            const data = response.data;
            cachePriceRange(data);
            setPriceRange(data);
            return data;
        } catch (error) {
            console.error('Error refreshing price range cache:', error);
            return null;
        }
    }, [cachePriceRange]);

    // Expose cache clearing functions globally
    useEffect(() => {
        window.clearYearRangeCache = clearYearRangeCache;
        window.clearPriceRangeCache = clearPriceRangeCache;
        return () => {
            delete window.clearYearRangeCache;
            delete window.clearPriceRangeCache;
        };
    }, [clearYearRangeCache, clearPriceRangeCache]);

    // Set initial start time
    useEffect(() => {
        if (!location.state?.startTime) {
            setFilters(prev => ({
                ...prev,
                startTime: getNextHalfHour().time
            }));
        }
    }, [location.state?.startTime, getNextHalfHour]);

    // Fetch models based on make from actual car data
    useEffect(() => {
        const fetchModels = async () => {
            if (!filters.make) {
                setModels([]);
                return;
            }
            try {
                const response = await axios.get(`${process.env.REACT_APP_API_URL}/cars/available`, {
                    params: {
                        startDate: filters.startDate || todayFormatted,
                        endDate: filters.endDate || (() => {
                            const tomorrow = toDate(new Date(today), { timeZone: EST_TIMEZONE });
                            tomorrow.setDate(today.getDate() + 1);
                            return formatInTimeZone(tomorrow, EST_TIMEZONE, 'yyyy-MM-dd');
                        })(),
                        startTime: filters.startTime || '12:00 PM',
                        endTime: filters.endTime || 'Midnight',
                        make: filters.make
                    }
                });
                
                const availableCars = response.data;
                const carsOfMake = availableCars.filter(car => car.make === filters.make);
                const uniqueModels = [...new Set(carsOfMake.map(car => car.model))].sort();
                
                setModels(uniqueModels.map(model => ({ modelId: model, name: model })));
            } catch (error) {
                console.error('Error fetching models:', error.message);
                setModels([]);
            }
        };
        fetchModels();
    }, [filters.make, filters.startDate, filters.endDate, filters.startTime, filters.endTime, todayFormatted, today, EST_TIMEZONE]);

    // Handle date adjustment for late night times
    useEffect(() => {
        if (!location.state?.startDate && !location.state?.endDate) {
            const nextHalfHour = new Date();
            const currentMinutes = now.getMinutes();
            const additionalMinutes = currentMinutes % 30 === 0 ? 30 : 0;
            nextHalfHour.setMinutes(Math.ceil(currentMinutes / 30) * 30 + additionalMinutes, 0, 0);

            if ((nextHalfHour.getHours() === 0 && nextHalfHour.getMinutes() === 0) || 
                (now.getHours() === 23 && now.getMinutes() >= 30)) {
                
                const nextDay = new Date();
                nextDay.setDate(now.getDate() + 1);
                nextDay.setHours(0, 0, 0, 0);
                const nextDayFormatted = nextDay.toISOString().split('T')[0];
                
                const dayAfterNext = new Date(nextDay);
                dayAfterNext.setDate(nextDay.getDate() + 1);
                const dayAfterNextFormatted = dayAfterNext.toISOString().split('T')[0];
                
                setFilters(prev => ({
                    ...prev,
                    startDate: nextDayFormatted,
                    endDate: dayAfterNextFormatted,
                }));
            } else {
                const tomorrow = new Date(today);
                tomorrow.setDate(today.getDate() + 1);
                const tomorrowFormatted = tomorrow.toISOString().split('T')[0];
                
                setFilters(prev => ({
                    ...prev,
                    endDate: tomorrowFormatted,
                }));
            }
        }
    }, [location.state, now, today]);

    // Dynamic price range state
    const [priceRange, setPriceRange] = useState({ minPrice: 0, maxPrice: 1000 }); // Default fallback values

    // Define fetchAvailableCars function before it's used in useEffect hooks
    const fetchAvailableCars = useCallback(async () => {
        if (!filters.startDate || !filters.endDate) {
            setError('Please select a start and end date.');
            return;
        }

        // Prevent multiple simultaneous requests during initial load
        if (loading && !hasInitialized) {
            return;
        }

        // Use filter loading state for filter operations to prevent main loading flicker
        if (hasInitialized) {
            // Remove filter loading state for seamless transitions
            // setFilterLoading(true);
        } else {
            setLoading(true);
        }
        setError(null);

        try {
            const cleanedFilters = {
                startDate: filters.startDate,
                endDate: filters.endDate,
                startTime: filters.startTime,
                endTime: filters.endTime,
                priceMin: filters.priceRange[0],
                priceMax: filters.priceRange[1],
                yearMin: filters.yearRange ? filters.yearRange[0] : undefined,
                yearMax: filters.yearRange ? filters.yearRange[1] : undefined,
                make: filters.make?.trim() || undefined,
                model: filters.model?.trim() || undefined,
            };

            const response = await axios.get(`${process.env.REACT_APP_API_URL}/cars/available`, {
                params: cleanedFilters
            });

            // Use ref to prevent circular dependency and only update if data actually changed
            const currentCars = carsRef.current;
            const newCars = response.data || [];
            
            // Check if data actually changed to prevent unnecessary updates
            const hasChanged = !currentCars || 
                currentCars.length !== newCars.length ||
                JSON.stringify(currentCars.map(c => c.carId).sort()) !== JSON.stringify(newCars.map(c => c.carId).sort());
            
            if (hasChanged) {
                carsRef.current = newCars;
                setCars(newCars);
            }
            
            setHasInitialized(true);
        } catch (err) {
            console.error('Error fetching available cars:', err);
            setError('Failed to load available cars.');
        } finally {
            if (hasInitialized) {
                // Remove filter loading state for seamless transitions
                // setFilterLoading(false);
            } else {
                setLoading(false);
            }
        }
    }, [filters, loading, hasInitialized]); // Removed cars dependency

    // Consolidated initialization effect - prevents cascading re-renders
    useEffect(() => {
        const initializePage = async () => {
            if (initializationRef.current.initialized) return;
            initializationRef.current.initialized = true;
            
            try {
                setLoading(true);
                
                // First, try to load from cache for instant display
                const cachedYearRange = getCachedYearRange();
                const cachedPriceRange = getCachedPriceRange();
                
                if (cachedYearRange) {
                    yearRangeRef.current = cachedYearRange;
                    setYearRange(cachedYearRange);
                    setFilters(prev => ({
                        ...prev,
                        yearRange: [cachedYearRange.minYear, cachedYearRange.maxYear]
                    }));
                    setIsYearRangeCached(true);
                }
                
                if (cachedPriceRange) {
                    setPriceRange(cachedPriceRange);
                    setFilters(prev => ({
                        ...prev,
                        priceRange: [0, cachedPriceRange.maxPrice]
                    }));
                }
                
                // Fetch all initial data in parallel
                const [yearRangeResponse, priceRangeResponse, makesResponse, initialCarsResponse] = await Promise.all([
                    axios.get(`${process.env.REACT_APP_API_URL}/cars/year-range`),
                    axios.get(`${process.env.REACT_APP_API_URL}/cars/price-range`),
                    axios.get(`${process.env.REACT_APP_API_URL}/cars/available`, {
                        params: {
                            startDate: todayFormatted,
                            endDate: (() => {
                                const tomorrow = toDate(new Date(today), { timeZone: EST_TIMEZONE });
                                tomorrow.setDate(today.getDate() + 1);
                                return formatInTimeZone(tomorrow, EST_TIMEZONE, 'yyyy-MM-dd');
                            })(),
                            startTime: '12:00 PM',
                            endTime: 'Midnight'
                        }
                    }),
                    axios.get(`${process.env.REACT_APP_API_URL}/cars/available`, {
                        params: {
                            startDate: todayFormatted,
                            endDate: (() => {
                                const tomorrow = toDate(new Date(today), { timeZone: EST_TIMEZONE });
                                tomorrow.setDate(today.getDate() + 1);
                                return formatInTimeZone(tomorrow, EST_TIMEZONE, 'yyyy-MM-dd');
                            })(),
                            startTime: '12:00 PM',
                            endTime: 'Midnight'
                        }
                    })
                ]);
                
                // Process year range data
                const { minYear, maxYear, nextYear, currentYear, availableYears } = yearRangeResponse.data;
                let adjustedMinYear = minYear;
                let adjustedMaxYear = maxYear;
                
                if (minYear === maxYear) {
                    adjustedMinYear = Math.max(1990, minYear - 1);
                    adjustedMaxYear = Math.min(currentYear + 1, maxYear + 1);
                }
                
                const newYearRange = { 
                    minYear: adjustedMinYear, 
                    maxYear: adjustedMaxYear, 
                    nextYear, 
                    currentYear, 
                    availableYears 
                };
                
                // Process makes data
                const availableCars = makesResponse.data;
                const uniqueMakes = [...new Set(availableCars.map(car => car.make))].sort();
                
                // Batch all state updates to prevent flickering
                if (!cachedYearRange || 
                    cachedYearRange.minYear !== adjustedMinYear || 
                    cachedYearRange.maxYear !== adjustedMaxYear) {
                    
                    yearRangeRef.current = newYearRange;
                    setYearRange(newYearRange);
                    setFilters(prev => ({
                        ...prev,
                        yearRange: [adjustedMinYear, adjustedMaxYear]
                    }));
                    cacheYearRange(newYearRange);
                    setIsYearRangeCached(false);
                } else {
                    setIsYearRangeCached(true);
                }
                
                // Process price range data
                const newPriceRange = priceRangeResponse.data;
                if (!cachedPriceRange || 
                    cachedPriceRange.maxPrice !== newPriceRange.maxPrice || 
                    cachedPriceRange.minPrice !== newPriceRange.minPrice) {
                    
                    setPriceRange(newPriceRange);
                    setFilters(prev => ({
                        ...prev,
                        priceRange: [0, newPriceRange.maxPrice]
                    }));
                    cachePriceRange(newPriceRange);
                }
                
                setMakes(uniqueMakes.map(make => ({ makeId: make, name: make })));
                carsRef.current = initialCarsResponse.data;
                setCars(initialCarsResponse.data);
                
                // Mark filters as initialized to prevent unnecessary filter change detection
                filtersInitializedRef.current = true;
                
            } catch (error) {
                console.error('Error during page initialization:', error);
                setError('Failed to initialize page data.');
            } finally {
                setLoading(false);
                setHasInitialized(true);
            }
        };
        
        if (!hasInitialized) {
            initializePage();
        }
    }, [hasInitialized, getCachedYearRange, getCachedPriceRange, cacheYearRange, cachePriceRange, todayFormatted, today, EST_TIMEZONE]);
    
    // Watch for filter changes and auto-search - optimized to prevent flickering
    useEffect(() => {
        // Skip entirely if reset is in progress to avoid conflicts
        if (resetInProgressRef.current) {
            return;
        }
        
        // Only watch for filter changes after everything is properly initialized
        if (hasInitialized && filtersInitializedRef.current && filters.startDate && filters.endDate && filters.startTime && filters.endTime) {
            // Check if filters actually changed before starting any timeout
            const currentFilters = JSON.stringify({
                make: filters.make,
                model: filters.model,
                priceRange: filters.priceRange,
                yearRange: filters.yearRange
            });
            
            // Only proceed if filters actually changed and we're not in reset mode
            if (initializationRef.current && initializationRef.current.lastFilters !== currentFilters && !resetInProgressRef.current) {
                const timeoutId = setTimeout(() => {
                    // Triple-check that reset is not in progress and filters haven't changed
                    if (resetInProgressRef.current) {
                        return;
                    }
                    
                    const latestFilters = JSON.stringify({
                        make: filters.make,
                        model: filters.model,
                        priceRange: filters.priceRange,
                        yearRange: filters.yearRange
                    });
                    
                    if (latestFilters === currentFilters && !loading && !resetInProgressRef.current) {
                        initializationRef.current.lastFilters = currentFilters;
                        fetchAvailableCars();
                    }
                }, 500);
                
                return () => clearTimeout(timeoutId);
            }
        }
    }, [filters.priceRange, filters.yearRange, filters.make, filters.model]);

    // Handle booking notifications
    useEffect(() => {
        if (bookingMade && hasInitialized) {
            fetchAvailableCars();
            clearBookingNotification();
        }
    }, [bookingMade, hasInitialized, fetchAvailableCars, clearBookingNotification]);

    // Handle window focus
    useEffect(() => {
        const handleFocus = () => {
            if (hasInitialized && filters.startDate && filters.endDate) {
                fetchAvailableCars();
            }
            
            // Check if year range cache needs refresh (every 6 hours)
            const cached = getCachedYearRange();
            if (cached) {
                const cacheAge = Date.now() - parseInt(localStorage.getItem(YEAR_RANGE_CACHE_TIMESTAMP_KEY) || '0');
                const refreshThreshold = 6 * 60 * 60 * 1000; // 6 hours
                
                if (cacheAge > refreshThreshold) {
                    refreshYearRangeCache();
                }
            }
        };

        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [hasInitialized, filters.startDate, filters.endDate, fetchAvailableCars, getCachedYearRange, refreshYearRangeCache]);

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

    // Generate stable keys for car listings to prevent unnecessary re-renders
    const generateCarKey = useCallback((car) => {
        return `${car.carId}-${car.make}-${car.model}-${car.year}-${car.price}`;
    }, []);

    // Memoize the car data with better dependency tracking
    const carData = useMemo(() => {
        if (loading || !cars.length) return null;
        return cars;
    }, [cars, loading]);

    // Memoize the car listings with better stability - prevent unnecessary re-renders
    const carListings = useMemo(() => {
        if (!carData) return null;
        
        return carData.map((car) => {
            // Create stable props object to prevent unnecessary re-renders
            const stableProps = {
                car,
                showEditDeleteButtons: false,
                key: generateCarKey(car),
            };

            if (isAuthenticated) {
                stableProps.onBookNow = handleBookNow;
                stableProps.onLogin = null;
            } else {
                stableProps.onBookNow = null;
                stableProps.onLogin = () => openLoginModal(location.pathname);
            }

            return (
                <CarListing
                    key={stableProps.key}
                    {...stableProps}
                />
            );
        });
    }, [carData, isAuthenticated, handleBookNow, openLoginModal, location.pathname, generateCarKey]);

    const handleInputChange = useCallback((field, value) => {
        setFilters(prevFilters => ({
            ...prevFilters,
            [field]: value === '' ? '' : value
        }));
    }, []);

    // Generate time options in 30-minute intervals
    const generateTimeOptions = useCallback((isStartTime = false) => {
        const options = [];
        const isToday = filters.startDate === todayFormatted;

        for (let hour = 0; hour < 24; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                const time = new Date();
                time.setHours(hour, minute, 0, 0);
                let label = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

                if (label === '12:00 AM') label = 'Midnight';
                if (label === '12:00 PM') label = 'Noon';

                if (!isStartTime || !isToday || 
                    (hour > estNow.getHours() || 
                    (hour === estNow.getHours() && minute >= Math.ceil(estNow.getMinutes() / 30) * 30))) {
                    options.push({ value: label, label });
                }
            }
        }
        return options;
    }, [filters.startDate, todayFormatted, estNow]);

    const handleRangeChange = useCallback((field, values) => {
        setFilters(prev => ({
            ...prev,
            [field]: values
        }));
    }, []);

    // Create a dedicated reset fetch function to avoid conflicts with the normal filter logic
    const fetchCarsForReset = useCallback(async () => {
        if (!filters.startDate || !filters.endDate) {
            setError('Please select a start and end date.');
            return;
        }

        setError(null);

        try {
            const cleanedFilters = {
                startDate: filters.startDate,
                endDate: filters.endDate,
                startTime: filters.startTime,
                endTime: filters.endTime,
                priceMin: 0,
                priceMax: priceRange.maxPrice,
                yearMin: yearRange ? yearRange.minYear : undefined,
                yearMax: yearRange ? yearRange.maxYear : undefined,
                make: undefined,
                model: undefined,
            };

            const response = await axios.get(`${process.env.REACT_APP_API_URL}/cars/available`, {
                params: cleanedFilters
            });

            const newCars = response.data || [];
            setCars(newCars);
            carsRef.current = newCars;

        } catch (error) {
            console.error('Error fetching cars for reset:', error);
            setError('Failed to fetch available cars. Please try again.');
            setCars([]);
            carsRef.current = [];
        }
    }, [filters.startDate, filters.endDate, filters.startTime, filters.endTime, priceRange.maxPrice, yearRange]);

    const handleFilterReset = useCallback(async () => {
        // Mark reset as in progress to prevent conflicts (no UI feedback for seamless experience)
        // setResetLoading(true);
        resetInProgressRef.current = true;
        
        try {
            // Clear the last filters reference first to prevent conflicts
            if (initializationRef.current) {
                initializationRef.current.lastFilters = null;
            }
            
            // Create the reset filter values
            const resetFilterValues = {
                priceRange: [0, priceRange.maxPrice],
                yearRange: yearRange ? [yearRange.minYear, yearRange.maxYear] : null,
                make: '',
                model: '',
            };
            
            // Batch all filter resets into a single state update to prevent flickering
            setFilters(prev => ({
                ...prev,
                ...resetFilterValues
            }));
            
            // Clear models in a separate update to avoid cascading effects
            setModels([]);
            
            // Small delay to ensure all state updates are processed before fetch
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Use the dedicated reset fetch function instead of the regular one
            await fetchCarsForReset();
            
            // Update lastFilters to reflect the reset state after successful fetch
            const resetFilters = JSON.stringify({
                make: '',
                model: '',
                priceRange: [0, priceRange.maxPrice],
                yearRange: yearRange ? [yearRange.minYear, yearRange.maxYear] : null
            });
            
            if (initializationRef.current) {
                initializationRef.current.lastFilters = resetFilters;
            }
            
        } catch (error) {
            console.error('Error during filter reset:', error);
        } finally {
            // Reset the flags after operation is complete
            resetInProgressRef.current = false;
            // setResetLoading(false);
        }
    }, [priceRange.maxPrice, yearRange, fetchCarsForReset]);

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
                                max={priceRange.maxPrice}
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
                                                                                            width: `${(filters.priceRange[1] - filters.priceRange[0]) / priceRange.maxPrice * 100}%`,
                                            left: `${filters.priceRange[0] / priceRange.maxPrice * 100}%`,
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
                        {yearRange ? (
                            <div className="px-2 py-4">
                                <div className="flex justify-between mb-2">
                                    <span className="text-sm text-gray-600">{filters.yearRange ? filters.yearRange[0] : yearRange.minYear}</span>
                                    <span className="text-sm text-gray-600">{filters.yearRange ? filters.yearRange[1] : yearRange.maxYear}</span>
                                </div>
                                <Range
                                    step={1}
                                    min={yearRange.minYear}
                                    max={yearRange.maxYear}
                                    values={filters.yearRange || [yearRange.minYear, yearRange.maxYear]}
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
                                                    width: `${(filters.yearRange ? filters.yearRange[1] : yearRange.maxYear) - (filters.yearRange ? filters.yearRange[0] : yearRange.minYear) / (yearRange.maxYear - yearRange.minYear) * 100}%`,
                                                    left: `${(filters.yearRange ? filters.yearRange[0] : yearRange.minYear) - yearRange.minYear / (yearRange.maxYear - yearRange.minYear) * 100}%`,
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
                        ) : null}
                    </div>

                    {/* Make and Model */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Make</label>
                        <div className="relative">
                            <input
                                type="text"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                value={filters.make}
                                onChange={(e) => {
                                    const input = e.target.value;
                                    const validMakes = makes.map(m => m.name.toLowerCase());
                                    const isValidInput = validMakes.some(make => 
                                        make.startsWith(input.toLowerCase())
                                    );
                                    
                                    if (isValidInput || input === '') {
                                        handleInputChange('make', input);
                                        setFilters(prev => ({ ...prev, model: '' }));
                                        setModels([]);
                                    }
                                }}
                                placeholder="Select make"
                                list="make-options"
                            />
                            <datalist id="make-options">
                                {makes.map(make => (
                                    <option key={make.makeId} value={make.name} />
                                ))}
                            </datalist>
                        </div>
                        <label className="block text-sm font-medium text-gray-700 mt-2 mb-1">Model</label>
                        <div className="relative">
                            <input
                                type="text"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                value={filters.model}
                                onChange={(e) => {
                                    const input = e.target.value;
                                    if (filters.make) {
                                        const validModels = models.map(m => m.name.toLowerCase());
                                        const isValidInput = validModels.some(model => 
                                            model.startsWith(input.toLowerCase())
                                        );
                                        
                                        if (isValidInput || input === '') {
                                            handleInputChange('model', input);
                                        }
                                    }
                                }}
                                placeholder="Select model"
                                disabled={!filters.make}
                                list="model-options"
                            />
                            <datalist id="model-options">
                                {models.map(model => (
                                    <option key={model.modelId} value={model.name} />
                                ))}
                            </datalist>
                        </div>
                    </div>

                    {/* Reset Filters Button */}
                    <button
                        onClick={handleFilterReset}
                        className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-md transition duration-200 mb-3"
                    >
                        Reset Filters
                    </button>
                    
                    {/* Search Button */}
                    <button
                        onClick={fetchAvailableCars}
                        className="w-full bg-primary-color hover:bg-primary-color-dark text-white font-semibold py-2 px-4 rounded-md transition duration-200"
                    >
                        Search Cars
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
                        <div className="relative">
                            {/* Stable car grid container to prevent flickering */}
                            <div className="featured-cars grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 max-w-7xl mx-auto min-h-[400px]">
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
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AvailableCars;