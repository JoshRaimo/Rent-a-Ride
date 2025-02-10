import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AvailableCars = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [cars, setCars] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false); // Ensure proper auth state tracking
    const [filters, setFilters] = useState({
        startDate: location.state?.startDate || '',
        startTime: location.state?.startTime || '12:00',
        endDate: location.state?.endDate || '',
        endTime: location.state?.endTime || '12:00',
    });

    // Effect to check authentication state dynamically
    useEffect(() => {
        const checkAuth = () => {
            const token = localStorage.getItem('token');
            setIsAuthenticated(!!token);
        };

        checkAuth(); // Run immediately
        window.addEventListener('storage', checkAuth); // Listen for storage updates
        return () => window.removeEventListener('storage', checkAuth); // Cleanup
    }, []);

    // Minimum allowed date (today)
    const today = new Date();
    const minDate = today.toISOString().split('T')[0];

    useEffect(() => {
        if (filters.startDate && filters.endDate) {
            fetchAvailableCars();
        }
    }, [filters.startDate, filters.endDate, filters.startTime, filters.endTime]);

    // Fetch available cars
    const fetchAvailableCars = async () => {
        if (!filters.startDate || !filters.endDate) {
            setError('Please select a start and end date.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/cars/available`, {
                params: filters,
            });
            setCars(response.data);
        } catch (err) {
            console.error('Error fetching available cars:', err);
            setError('Failed to load available cars.');
        } finally {
            setLoading(false);
        }
    };

    // Handle when a user clicks "Book Now"
    const handleBookNow = (car) => {
        navigate('/book-car', { state: { car, ...filters } });
    };

    // Handle when a user clicks "Login to Book"
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

    // Handle date/time changes
    const handleInputChange = (field, value) => {
        setFilters((prevFilters) => ({
            ...prevFilters,
            [field]: value,
        }));
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
                    min={minDate}
                />
                <input
                    type="time"
                    className="px-3 py-2 border border-gray-300 rounded-md"
                    value={filters.startTime}
                    onChange={(e) => handleInputChange('startTime', e.target.value)}
                />
                <input
                    type="date"
                    className="px-3 py-2 border border-gray-300 rounded-md"
                    value={filters.endDate}
                    onChange={(e) => handleInputChange('endDate', e.target.value)}
                    min={filters.startDate || minDate}
                />
                <input
                    type="time"
                    className="px-3 py-2 border border-gray-300 rounded-md"
                    value={filters.endTime}
                    onChange={(e) => handleInputChange('endTime', e.target.value)}
                />
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
                            <div key={car.carId} className="border border-gray-300 rounded-lg shadow p-4">
                                <h2 className="text-xl font-bold">
                                    {car.make} {car.model}
                                </h2>
                                <p>
                                    <strong>Year:</strong> {car.year}
                                </p>
                                <p>
                                    <strong>Price per Day:</strong> ${car.pricePerDay}
                                </p>
                                <p>
                                    <strong>Available:</strong> {car.availabilityStatus ? 'Yes' : 'No'}
                                </p>
                                {car.image && (
                                    <img
                                        src={car.image}
                                        alt={`${car.make} ${car.model}`}
                                        className="mt-2 w-full h-auto object-cover rounded-md"
                                        style={{ maxHeight: '200px' }}
                                    />
                                )}
                                {isAuthenticated ? (
                                    <button
                                        className="mt-3 px-4 py-2 rounded-md bg-green-500 text-white hover:bg-green-600"
                                        onClick={() => handleBookNow(car)}
                                    >
                                        Book Now
                                    </button>
                                ) : (
                                    <button
                                        className="mt-3 px-4 py-2 rounded-md bg-blue-500 text-white hover:bg-blue-600"
                                        onClick={handleLoginRedirect}
                                    >
                                        Login to Book
                                    </button>
                                )}
                            </div>
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