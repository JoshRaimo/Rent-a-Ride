import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { parseISO } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { toast } from 'react-toastify';

const BookCar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const EST_TIMEZONE = 'America/New_York';
    
    const car = location.state?.car || null;
    const carId = car?.carId || car?._id || null;
    const startDate = location.state?.startDate || null;
    const startTime = location.state?.startTime || null;
    const endDate = location.state?.endDate || null;
    const endTime = location.state?.endTime || null;

    if (!car || !carId || !startDate || !startTime || !endDate || !endTime) {
        return (
            <div className="text-center text-red-500 mt-10">
                <p>Error: Missing booking details. Please go back and select a car with valid dates and times.</p>
            </div>
        );
    }

    const handleConfirmBooking = async () => {
        try {
            const formattedStartTime = parseTime(startTime);
            const formattedEndTime = parseTime(endTime);

            if (!formattedStartTime || !formattedEndTime) {
                toast.error('Invalid time format. Please re-select the start and end times.');
                return;
            }

            // Create date strings in ISO format
            const startDateTime = new Date(`${startDate}T${formattedStartTime}`);
            const endDateTime = new Date(`${endDate}T${formattedEndTime}`);

            // Format dates in EST timezone
            const startDateEST = formatInTimeZone(startDateTime, EST_TIMEZONE, "yyyy-MM-dd'T'HH:mm:ssXXX");
            const endDateEST = formatInTimeZone(endDateTime, EST_TIMEZONE, "yyyy-MM-dd'T'HH:mm:ssXXX");

            const response = await axios.post(`${process.env.REACT_APP_API_URL}/bookings`, {
                carId,
                startDate: startDateEST,
                endDate: endDateEST,
            }, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json',
                },
            });

            // Show success message
            toast.success('Booking confirmed successfully!');

            // Add a small delay before navigation to ensure the toast is visible
            setTimeout(() => {
                navigate('/'); // Redirect to homepage
            }, 1500);

        } catch (error) {
            console.error('Error confirming booking:', error);
            toast.error(error.response?.data?.message || 'Failed to confirm booking. Please try again.');
        }
    };

    const parseTime = (time) => {
        if (!time) return null;
        if (time.toLowerCase() === 'midnight') return '00:00';
        if (time.toLowerCase() === 'noon') return '12:00';
        
        // Convert 12-hour format to 24-hour format
        const [timeStr, period] = time.split(' ');
        const [hours, minutes] = timeStr.split(':');
        let hour = parseInt(hours, 10);
        
        if (period.toLowerCase() === 'pm' && hour !== 12) {
            hour += 12;
        } else if (period.toLowerCase() === 'am' && hour === 12) {
            hour = 0;
        }
        
        return `${hour.toString().padStart(2, '0')}:${minutes}`;
    };

    return (
        <div className="container mx-auto mt-10 p-6 max-w-4xl">
            <h2 className="hero-title mb-8">
                Confirm Your Booking
            </h2>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Car Details Card - Matching AvailableCars layout */}
                <div className="car-listing">
                    <h2>{car.make} {car.model} {car.year}</h2>
                    <img 
                        src={car.image} 
                        alt={`${car.make} ${car.model}`}
                        className="w-full h-auto object-cover rounded-lg"
                    />
                    <div className="mt-4">
                        <p className="car-price text-center">
                            ${car.pricePerDay} <span className="text-gray-600">per day</span>
                        </p>
                    </div>
                </div>

                {/* Booking Details Card */}
                <div className="car-listing">
                    <h2>Booking Details</h2>
                    <div className="space-y-4 mt-4">
                        <div>
                            <p className="text-gray-600">Pick-up</p>
                            <p className="font-semibold">
                                {new Date(`${startDate}T12:00:00`).toLocaleDateString('en-US', { 
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </p>
                            <p className="text-primary-color">{startTime}</p>
                        </div>
                        <div className="mt-4">
                            <p className="text-gray-600">Drop-off</p>
                            <p className="font-semibold">
                                {new Date(`${endDate}T12:00:00`).toLocaleDateString('en-US', { 
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </p>
                            <p className="text-primary-color">{endTime}</p>
                        </div>
                        
                        <div className="button-group">
                            <button
                                className="confirm-button w-full"
                                onClick={handleConfirmBooking}
                            >
                                Confirm Booking
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookCar;