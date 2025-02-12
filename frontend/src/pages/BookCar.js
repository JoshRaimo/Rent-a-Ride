import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

const BookCar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    
    // Ensure we get all necessary data from location.state
    const { car, startDate, startTime, endDate, endTime } = location.state || {};

    if (!car || !startDate || !startTime || !endDate || !endTime) {
        return <p>Error: Missing booking details. Please go back and select a car with valid dates and times.</p>;
    }

    const handleConfirmBooking = async () => {
        try {
            const startDateTime = new Date(`${startDate}T${startTime}`);
            const endDateTime = new Date(`${endDate}T${endTime}`);

            console.log('Start Date and Time:', startDateTime);
            console.log('End Date and Time:', endDateTime);

            if (startDateTime <= new Date()) {
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
            <div className="car-listing">
                <h2>{car.make} {car.model} {car.year}</h2>
                <p><strong>Price per Day:</strong> ${car.pricePerDay}</p>
                <p><strong>Booking Dates:</strong> {startDate} ({startTime}) to {endDate} ({endTime})</p>
                {car.image && (
                    <img
                        src={car.image}
                        alt={`${car.make} ${car.model}`}
                    />
                )}
                <button
                    className="confirm-button"
                    onClick={handleConfirmBooking}
                >
                    Confirm Booking
                </button>
            </div>
        </div>
    );
};

export default BookCar;