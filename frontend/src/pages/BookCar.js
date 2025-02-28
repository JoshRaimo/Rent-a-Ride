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
        <div className="container mx-auto mt-10 p-6 bg-white rounded-lg shadow-lg">
            <h2 className="text-3xl font-bold text-center text-primary-color mb-6">
                Confirm Your Booking
            </h2>

            {/* Display Car Details */}
            <div className="flex justify-center items-center">
                <div className="border p-4 rounded-lg shadow-lg w-full max-w-md bg-gray-100">
                    <img src={car.image} alt={car.make} className="w-full h-48 object-cover rounded-md" />
                    <h3 className="text-xl font-semibold text-center mt-2">{car.make} {car.model} ({car.year})</h3>
                    <p className="text-center text-gray-600">${car.pricePerDay} per day</p>
                </div>
            </div>

            <div className="flex justify-center mt-6">
                <button
                    className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition"
                    onClick={handleConfirmBooking}
                >
                    Confirm Booking
                </button>
            </div>
        </div>
    );
};

export default BookCar;