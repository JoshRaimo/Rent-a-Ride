import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

const BookCar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { car, startDate, endDate } = location.state || {};

    if (!car) {
        return <p>No car selected. Please go back and select a car to book.</p>;
    }

    const handleConfirmBooking = async () => {
        try {
            const startDateTime = new Date(`${startDate}T${endDate}`);
            const endDateTime = new Date(`${endDate}T${endDate}`);

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
            <div className="border border-gray-300 rounded-lg shadow p-4">
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
                    <strong>Booking Dates:</strong> {startDate} to {endDate}
                </p>
                {car.image && (
                    <img
                        src={car.image}
                        alt={`${car.make} ${car.model}`}
                        className="mt-2 w-full h-auto object-cover rounded-md"
                        style={{ maxHeight: '200px' }}
                    />
                )}
                <button
                    className="mt-3 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                    onClick={handleConfirmBooking}
                >
                    Confirm Booking
                </button>
            </div>
        </div>
    );
};

export default BookCar;