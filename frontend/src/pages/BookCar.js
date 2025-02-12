import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import CarListing from '../components/CarListing';

const BookCar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    
    const { car, startDate, startTime, endDate, endTime } = location.state || {};

    if (!car || !startDate || !startTime || !endDate || !endTime) {
        return <p>Error: Missing booking details. Please go back and select a car with valid dates and times.</p>;
    }

    const parseTime = (time) => {
        if (time.toLowerCase() === 'midnight') return '00:00';
        if (time.toLowerCase() === 'noon') return '12:00';
        return time;
    };

    const handleConfirmBooking = async () => {
        try {
            const startDateTime = new Date(`${startDate} ${parseTime(startTime)}`);
            const endDateTime = new Date(`${endDate} ${parseTime(endTime)}`);

            console.log('Start Date and Time:', startDateTime);
            console.log('End Date and Time:', endDateTime);

            if (isNaN(startDateTime) || isNaN(endDateTime)) {
                alert('Invalid date or time format.');
                return;
            }

            const now = new Date();
            if (startDateTime <= now) {
                alert('Start date must be in the future.');
                return;
            }

            if (startDateTime >= endDateTime) {
                alert('End date must be after the start date.');
                return;
            }

            const response = await axios.post(`${process.env.REACT_APP_API_URL}/bookings`, {
                carId: car.carId,
                startDate: startDateTime.toISOString(),
                endDate: endDateTime.toISOString(),
            }, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                }
            });

            if (response.status === 201) {
                alert('Booking confirmed!');
                navigate('/');
            }
        } catch (error) {
            console.error('Error confirming booking:', error.response?.data?.message || error.message);
            alert('Failed to confirm booking. Please try again.');
        }
    };

    return (
        <div className="container mx-auto mt-10 p-6 bg-white rounded-lg shadow-lg">
            <h2 className="text-3xl font-bold text-center text-primary-color mb-6">
                Confirm Your Booking
            </h2>
            <CarListing
                car={car}
                showEditDeleteButtons={false}
            />
            <button
                className="confirm-button"
                onClick={handleConfirmBooking}
            >
                Confirm Booking
            </button>
        </div>
    );
};

export default BookCar;