import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

const BookCar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    
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

    // Convert selected time to 24-hour format for consistency
    const parseTime = (time) => {
        if (!time) return null;
        if (time.toLowerCase() === 'midnight') return '00:00';
        if (time.toLowerCase() === 'noon') return '12:00';
        return time.match(/^\d{1,2}:\d{2} (AM|PM)$/)
            ? new Date(`1970-01-01 ${time} EST`).toLocaleTimeString('en-US', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'America/New_York'
            })
            : null;
    };

    const handleConfirmBooking = async () => {
        try {
            const formattedStartTime = parseTime(startTime);
            const formattedEndTime = parseTime(endTime);

            if (!formattedStartTime || !formattedEndTime) {
                alert('Invalid time format. Please re-select the start and end times.');
                return;
            }

            // Ensure booking time is stored in EST (America/New_York)
            const startDateTime = new Date(`${startDate}T${formattedStartTime}:00`);
            const endDateTime = new Date(`${endDate}T${formattedEndTime}:00`);

            // Convert to EST before sending to the backend
            const startEST = new Intl.DateTimeFormat('en-US', {
                timeZone: 'America/New_York',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false,
            }).format(startDateTime);

            const endEST = new Intl.DateTimeFormat('en-US', {
                timeZone: 'America/New_York',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false,
            }).format(endDateTime);

            if (isNaN(startDateTime) || isNaN(endDateTime)) {
                alert('Invalid date or time selection. Please check your inputs.');
                return;
            }

            const response = await axios.post(`${process.env.REACT_APP_API_URL}/bookings`, {
                carId,
                startDate: startEST,
                endDate: endEST,
            }, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.status === 201) {
                alert('Booking confirmed! Redirecting...');
                navigate('/');
            }
        } catch (error) {
            console.error('Error confirming booking:', error.response?.data || error.message);
            alert(`Failed to confirm booking: ${error.response?.data?.message || 'Please try again.'}`);
        }
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