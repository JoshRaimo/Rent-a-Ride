import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import CarListing from '../components/CarListing';
import { formatInTimeZone, toDate } from 'date-fns-tz'
import { toast } from 'react-toastify';

const HomePage = () => {
    const navigate = useNavigate();
    const EST_TIMEZONE = 'America/New_York';

    // Get current date and time in EST
    const now = new Date();
    const estNow = toDate(now, { timeZone: EST_TIMEZONE });
    const today = new Date(estNow.getFullYear(), estNow.getMonth(), estNow.getDate());
    const todayFormatted = formatInTimeZone(today, EST_TIMEZONE, 'yyyy-MM-dd');

    // Get tomorrow's date in EST
    const tomorrow = toDate(new Date(today), { timeZone: EST_TIMEZONE });
    tomorrow.setDate(today.getDate() + 1);
    const tomorrowFormatted = formatInTimeZone(tomorrow, EST_TIMEZONE, 'yyyy-MM-dd');

    const getNextHalfHour = () => {
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
    };

    const [startDate, setStartDate] = useState(todayFormatted);
    const [endDate, setEndDate] = useState(tomorrowFormatted);
    const [startTime, setStartTime] = useState(getNextHalfHour().time);
    const [endTime, setEndTime] = useState('Midnight');

    // Handle date adjustment for late night times
    useEffect(() => {
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
            
            setStartDate(nextDayFormatted);
            setEndDate(dayAfterNextFormatted);
        }
    }, []);

    const [featuredCars, setFeaturedCars] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFeaturedCars = async () => {
            setLoading(true);
            try {
                const response = await axios.get(`${process.env.REACT_APP_API_URL}/cars/available`, {
                    params: {
                        startDate: todayFormatted,
                        endDate: tomorrowFormatted,
                    },
                });
                setFeaturedCars(response.data.slice(0, 3)); // Get the first three cars
            } catch (err) {
                console.error('Error fetching featured cars:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchFeaturedCars();
    }, [todayFormatted, tomorrowFormatted]);

    // Generate time options in 30-minute intervals with Noon and Midnight labels
    const generateTimeOptions = (isStartTime = false) => {
        const options = [];
        const isToday = startDate === todayFormatted;
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

    const validateDates = () => {
        if (!startDate || !endDate || !startTime || !endTime) {
            toast.error('Please enter valid start and end dates and times.');
            return false;
        }

        const startDateTime = new Date(`${startDate}T${startTime}`);
        const endDateTime = new Date(`${endDate}T${endTime}`);
        const now = new Date();

        if (startDateTime <= now) {
            toast.error('Start date and time must be in the future.');
            return false;
        }

        if (endDateTime <= startDateTime) {
            toast.error('End date and time must be after the start time.');
            return false;
        }

        return true;
    };

    // Handle Search Button Click
    const handleSearch = () => {
        if (!validateDates()) return;

        const parseTime = (time) => {
            if (time.toLowerCase() === 'midnight') return '00:00';
            if (time.toLowerCase() === 'noon') return '12:00';
            return time;
        };

        const selectedStartDateTime = toDate(
            new Date(`${startDate} ${parseTime(startTime)}`),
            { timeZone: EST_TIMEZONE }
        );
        const selectedEndDateTime = toDate(
            new Date(`${endDate} ${parseTime(endTime)}`),
            { timeZone: EST_TIMEZONE }
        );
        const estNow = toDate(new Date(), { timeZone: EST_TIMEZONE });

        if (selectedStartDateTime <= estNow) {
            alert('Start date and time must be in the future.');
            return;
        }

        if (selectedEndDateTime <= selectedStartDateTime) {
            alert('End date and time must be after the start time.');
            return;
        }

        navigate('/available-cars', { state: { startDate, startTime, endDate, endTime } });
    };

    return (
        <div className="homepage">
            {/* Hero Section */}
            <section className="hero bg-white shadow-lg rounded-lg p-10 mx-auto max-w-4xl text-center">
                <h1 className="hero-title text-4xl font-bold text-primary-color">
                    Find Your Perfect Ride
                </h1>
                <p className="hero-subtitle text-lg text-gray-600 mt-2">
                    Rent the car of your dreams for your next adventure
                </p>
                <div className="search-bar flex flex-col md:flex-row justify-center gap-4 mt-6">
                    
                    {/* Start Date Input */}
                    <input
                        type="date"
                        className="border border-gray-300 rounded-md p-3 w-full md:w-auto"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        min={todayFormatted}
                    />
                    
                    {/* Start Time Dropdown */}
                    <select
                        className="border border-gray-300 rounded-md p-3 w-full md:w-auto"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                    >
                        {generateTimeOptions(true).map((time, index) => (
                            <option key={index} value={time.value}>{time.label}</option>
                        ))}
                    </select>

                    {/* End Date Input */}
                    <input
                        type="date"
                        className="border border-gray-300 rounded-md p-3 w-full md:w-auto"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        min={startDate || todayFormatted}
                    />
                    
                    {/* End Time Dropdown */}
                    <select
                        className="border border-gray-300 rounded-md p-3 w-full md:w-auto"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                    >
                        {generateTimeOptions(false).map((time, index) => (
                            <option key={index} value={time.value}>{time.label}</option>
                        ))}
                    </select>

                    {/* Search Button */}
                    <button className="btn-primary" onClick={handleSearch}>
                        Search Cars
                    </button>
                </div>
            </section>

            {/* Featured Cars Section */}
            <section className="py-12 bg-secondary-color">
                <h2 className="text-3xl font-bold text-center text-primary-color mb-8">
                    Featured Cars
                </h2>
                {loading ? (
                    <p className="text-center">Loading...</p>
                ) : (
                    <div className="featured-cars grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto px-4">
                        {featuredCars.map((car, idx) => (
                            <CarListing
                                key={idx}
                                car={car}
                                showEditDeleteButtons={false}
                                onBookNow={null}
                                onLogin={null}
                            />
                        ))}
                    </div>
                )}
            </section>

            {/* How It Works Section */}
            <section className="bg-gray-100 py-12">
                <h2 className="text-3xl font-bold text-center text-primary-color mb-8">
                    How It Works
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto px-4">
                    {[
                        { title: 'Search', description: 'Find the perfect car for your needs', icon: '🔍' },
                        { title: 'Book', description: 'Reserve your car with easy booking', icon: '📅' },
                        { title: 'Drive', description: 'Pick up your car and enjoy your ride', icon: '🚗' },
                    ].map((step, idx) => (
                        <div key={idx} className="text-center">
                            <div className="text-4xl mb-4">{step.icon}</div>
                            <h3 className="text-xl font-semibold text-primary-color mb-2">{step.title}</h3>
                            <p className="text-text-color">{step.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Testimonials Section */}
            <section className="py-12 bg-secondary-color">
                <h2 className="text-3xl font-bold text-center text-primary-color mb-8">
                    What Our Customers Say
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-6xl mx-auto px-4">
                    {[
                        { name: 'John Doe', feedback: 'Great service and amazing cars. Will definitely use again!' },
                        { name: 'Jane Smith', feedback: 'Smooth booking process and excellent customer support.' },
                    ].map((testimonial, idx) => (
                        <div key={idx} className="card p-6">
                            <p className="card-text mb-4">{testimonial.feedback}</p>
                            <h3 className="card-title">{testimonial.name}</h3>
                            <p className="text-sm text-gray-500">
                                {idx === 0 ? 'Happy Customer' : 'Satisfied Renter'}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Footer Section */}
            <footer className="footer bg-footer-bg-color text-white rounded-lg" style={{ width: '99.5%', margin: '0 auto' }}>
                <div className="max-w-7xl mx-auto px-4 py-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                        <div className="text-center">
                            <h3 className="font-bold mb-4">Rent-a-Ride</h3>
                            <p>Find your perfect ride for any occasion.</p>
                        </div>
                        <div className="text-center">
                            <h3 className="font-bold mb-4">Contact Us</h3>
                            <p>+1 (617) 461-0054</p>
                            <p>Joshraimo@gmail.com</p>
                        </div>
                        <div className="text-center">
                            <h3 className="font-bold mb-4">Follow Us</h3>
                            <div className="flex justify-center gap-4">
                                <a 
                                    href="https://www.instagram.com/josh.raimo/" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-white hover:text-gray-300"
                                >
                                    <i className="fab fa-instagram text-4xl"></i>
                                </a>
                                <a 
                                    href="https://www.linkedin.com/in/josh-raimo-31262024b/" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-white hover:text-gray-300"
                                >
                                    <i className="fab fa-linkedin text-4xl"></i>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="border-t border-gray-700 w-full">
                    <div className="max-w-7xl mx-auto px-4 py-4">
                        <p className="text-sm text-center">&copy; 2025 Rent-a-Ride. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default HomePage;