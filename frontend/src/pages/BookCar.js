import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { parseISO } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { useToast } from '../hooks/useToast';
import { useAuthModal } from '../contexts/AuthModalContext';
import CarListing from '../components/CarListing';
import ReviewDisplay from '../components/ReviewDisplay';

const BookCar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { notifyBookingMade } = useAuthModal();
    const { toast } = useToast();
    const EST_TIMEZONE = 'America/New_York';
    
    const car = location.state?.car || null;
    const carId = car?.carId || car?._id || null;
    const startDate = location.state?.startDate || null;
    const startTime = location.state?.startTime || null;
    const endDate = location.state?.endDate || null;
    const endTime = location.state?.endTime || null;

    if (!car || !carId || !startDate || !startTime || !endDate || !endTime) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center bg-white p-8 rounded-xl shadow-lg max-w-md mx-4">
                    <div className="text-red-500 text-6xl mb-4">
                        <i className="fas fa-exclamation-triangle"></i>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Missing Information</h2>
                    <p className="text-gray-600 mb-6">Please go back and select a car with valid dates and times.</p>
                    <button
                        onClick={() => navigate(-1)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-200"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    const handleConfirmBooking = async () => {
        try {
            const formattedStartTime = parseTime(startTime);
            const formattedEndTime = parseTime(endTime);

            if (!formattedStartTime || !formattedEndTime) {
                toast.error('Invalid time format. Please re-select the start and end times.', {
                    title: 'Invalid Time'
                });
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
            toast.success('Booking confirmed successfully!', {
                title: 'Booking Confirmed',
                action: {
                    label: 'View Profile',
                    onClick: () => navigate('/profile')
                }
            });
            notifyBookingMade(); // Call the new hook function

            // Add a small delay before navigation to ensure the toast is visible
            setTimeout(() => {
                navigate('/'); // Redirect to homepage
            }, 1500);

        } catch (error) {
            console.error('Error confirming booking:', error);
            toast.error(error.response?.data?.message || 'Failed to confirm booking. Please try again.', {
                title: 'Booking Error'
            });
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

    // Calculate total days and price
    const start = new Date(startDate);
    const end = new Date(endDate);
    const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const totalPrice = totalDays * car.pricePerDay;

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto px-4 max-w-6xl">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                        Confirm Your Booking
                    </h1>
                    <p className="text-xl text-gray-600">
                        Review your car selection and booking details
                    </p>
                </div>

                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Car Details - Using the modern CarListing component */}
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Selected Vehicle</h2>
                        <CarListing 
                            car={car} 
                            showEditDeleteButtons={false}
                            isDynamic={false}
                        />
                    </div>

                    {/* Booking Details Card */}
                    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Booking Summary</h2>
                        
                        {/* Pick-up Details */}
                        <div className="bg-blue-50 rounded-lg p-4 mb-6">
                            <div className="flex items-center mb-3">
                                <div className="bg-blue-500 text-white p-2 rounded-full mr-3">
                                    <i className="fas fa-arrow-up text-sm"></i>
                                </div>
                                <h3 className="text-lg font-semibold text-blue-900">Pick-up</h3>
                            </div>
                            <div className="ml-11">
                                <p className="text-2xl font-bold text-blue-900">
                                    {new Date(`${startDate}T12:00:00`).toLocaleDateString('en-US', { 
                                        weekday: 'long',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </p>
                                <p className="text-lg text-blue-700 font-medium">{startTime}</p>
                            </div>
                        </div>

                        {/* Drop-off Details */}
                        <div className="bg-green-50 rounded-lg p-4 mb-6">
                            <div className="flex items-center mb-3">
                                <div className="bg-green-500 text-white p-2 rounded-full mr-3">
                                    <i className="fas fa-arrow-down text-sm"></i>
                                </div>
                                <h3 className="text-lg font-semibold text-green-900">Drop-off</h3>
                            </div>
                            <div className="ml-11">
                                <p className="text-2xl font-bold text-green-900">
                                    {new Date(`${endDate}T12:00:00`).toLocaleDateString('en-US', { 
                                        weekday: 'long',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </p>
                                <p className="text-lg text-green-700 font-medium">{endTime}</p>
                            </div>
                        </div>

                        {/* Duration and Price Summary */}
                        <div className="bg-gray-50 rounded-lg p-4 mb-6">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-gray-600">Duration:</span>
                                <span className="font-semibold text-gray-900">
                                    {totalDays} {totalDays === 1 ? 'day' : 'days'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-gray-600">Rate per day:</span>
                                <span className="font-semibold text-gray-900">${car.pricePerDay}</span>
                            </div>
                            <hr className="my-3" />
                            <div className="flex justify-between items-center">
                                <span className="text-xl font-bold text-gray-900">Total Price:</span>
                                <span className="text-2xl font-bold text-green-600">${totalPrice}</span>
                            </div>
                        </div>

                        {/* Confirm Button */}
                        <button
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
                            onClick={handleConfirmBooking}
                        >
                            <i className="fas fa-check-circle mr-2"></i>
                            Confirm Booking
                        </button>

                        {/* Additional Info */}
                        <div className="mt-4 text-center text-sm text-gray-500">
                            <p>By confirming, you agree to our rental terms and conditions</p>
                        </div>
                    </div>
                </div>

                {/* Car Reviews Section */}
                <div className="mt-12">
                    <ReviewDisplay carId={carId} showTitle={true} />
                </div>
            </div>
        </div>
    );
};

export default BookCar;