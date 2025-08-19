import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import CarListing from '../components/CarListing';
import { formatInTimeZone, toDate } from 'date-fns-tz'
import { useToast } from '../hooks/useToast';
import { Search, Calendar, Clock, MapPin, Star, Shield, Zap, Users, Award, Phone, Mail, Instagram, Linkedin } from 'lucide-react';

const HomePage = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
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
    const generateTimeOptions = useCallback((isStartTime = false) => {
        const options = [];
        const isToday = startDate === todayFormatted;
        const isSameDay = startDate === endDate;
        const nextHalfHourInfo = getNextHalfHour();

        // Parse the selected start time to get hour and minute for comparison
        let startHour = 0, startMinute = 0;
        if (!isStartTime && startTime && isSameDay) {
            const startTimeDate = new Date();
            if (startTime === 'Midnight') {
                startHour = 0;
                startMinute = 0;
            } else if (startTime === 'Noon') {
                startHour = 12;
                startMinute = 0;
            } else {
                // Parse time like "4:30 AM" or "2:00 PM"
                const [time, period] = startTime.split(' ');
                const [hourStr, minuteStr] = time.split(':');
                let hour = parseInt(hourStr, 10);
                const minute = parseInt(minuteStr, 10);
                
                if (period === 'PM' && hour !== 12) {
                    hour += 12;
                } else if (period === 'AM' && hour === 12) {
                    hour = 0;
                }
                
                startHour = hour;
                startMinute = minute;
            }
        }

        for (let hour = 0; hour < 24; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                const time = new Date();
                time.setHours(hour, minute, 0, 0);
                let label = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

                if (label === '12:00 AM') label = 'Midnight';
                if (label === '12:00 PM') label = 'Noon';

                let shouldInclude = true;

                // Filter for start time on today's date
                if (isStartTime && isToday) {
                    shouldInclude = hour > estNow.getHours() || 
                        (hour === estNow.getHours() && minute >= Math.ceil(estNow.getMinutes() / 30) * 30);
                }

                // Filter for end time when same day as start date
                if (!isStartTime && isSameDay) {
                    // End time must be after start time (at least 30 minutes later)
                    if (hour < startHour || (hour === startHour && minute <= startMinute)) {
                        shouldInclude = false;
                    }
                }

                if (shouldInclude) {
                    options.push({ value: label, label });
                }
            }
        }
        return options;
    }, [startDate, endDate, startTime, todayFormatted, estNow]);

    // Adjust end time when start time changes on the same day
    useEffect(() => {
        if (startDate === endDate && startTime) {
            const endTimeOptions = generateTimeOptions(false);
            
            // Check if current end time is still valid
            const isCurrentEndTimeValid = endTimeOptions.some(option => option.value === endTime);
            
            if (!isCurrentEndTimeValid && endTimeOptions.length > 0) {
                // Set to the first available end time option
                setEndTime(endTimeOptions[0].value);
            }
        }
    }, [startTime, startDate, endDate, generateTimeOptions]);

    const validateDates = () => {
        if (!startDate || !endDate || !startTime || !endTime) {
            toast.error('Please enter valid start and end dates and times.', {
                title: 'Invalid Input'
            });
            return false;
        }

        const startDateTime = new Date(`${startDate}T${startTime}`);
        const endDateTime = new Date(`${endDate}T${endTime}`);
        const now = new Date();

        if (startDateTime <= now) {
            toast.error('Start date and time must be in the future.', {
                title: 'Invalid Date'
            });
            return false;
        }

        if (endDateTime <= startDateTime) {
            toast.error('End date and time must be after the start time.', {
                title: 'Invalid Date Range'
            });
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
            {/* Enhanced Hero Section */}
            <section className="hero-section relative overflow-hidden pb-8">
                {/* Remove background with gradient overlay */}
                {/* <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900"></div> */}
                {/* <div className="absolute inset-0 bg-black opacity-30"></div> */}
                
                {/* Hero content */}
                <div className="relative z-10 container mx-auto px-2 sm:px-4 lg:px-8 py-12 md:py-16 text-center">
                    <div className="max-w-5xl mx-auto">
                        {/* Main heading with enhanced typography */}
                        <h1 className="hero-title text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
                            Find Your Perfect
                            <span className="block bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                Ride
                            </span>
                        </h1>
                        
                        {/* Subtitle */}
                        <p className="hero-subtitle text-xl md:text-2xl text-gray-700 mb-8 max-w-3xl mx-auto leading-relaxed font-medium">
                            Experience luxury, comfort, and adventure with our premium car rental service
                        </p>

                        {/* Enhanced Search Bar */}
                        <div className="search-container bg-white/95 backdrop-blur-sm rounded-2xl p-6 md:p-8 shadow-2xl max-w-6xl mx-auto">
                            <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-6 flex items-center justify-center">
                                <Search className="w-5 h-5 mr-2 text-blue-600" />
                                Plan Your Journey
                            </h3>
                            
                            {/* Search Form */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                                {/* Start Date */}
                                <div className="sm:col-span-1">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                                        <Calendar className="w-4 h-4 mr-2 text-blue-600" />
                                        Start Date
                                    </label>
                                    <input
                                        type="date"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        min={todayFormatted}
                                    />
                                </div>
                                
                                {/* Start Time */}
                                <div className="sm:col-span-1">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                                        <Clock className="w-4 h-4 mr-2 text-blue-600" />
                                        Start Time
                                    </label>
                                    <select
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm"
                                        value={startTime}
                                        onChange={(e) => setStartTime(e.target.value)}
                                    >
                                        {generateTimeOptions(true).map((time, index) => (
                                            <option key={index} value={time.value}>{time.label}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* End Date */}
                                <div className="sm:col-span-1">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                                        <Calendar className="w-4 h-4 mr-2 text-blue-600" />
                                        End Date
                                    </label>
                                    <input
                                        type="date"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        min={startDate || todayFormatted}
                                    />
                                </div>
                                
                                {/* End Time */}
                                <div className="sm:col-span-1">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                                        <Clock className="w-4 h-4 mr-2 text-blue-600" />
                                        End Time
                                    </label>
                                    <select
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm"
                                        value={endTime}
                                        onChange={(e) => setEndTime(e.target.value)}
                                    >
                                        {generateTimeOptions(false).map((time, index) => (
                                            <option key={index} value={time.value}>{time.label}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Search Button */}
                                <div className="sm:col-span-2 lg:col-span-1">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2 opacity-0">Search</label>
                                    <button 
                                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center"
                                        onClick={handleSearch}
                                    >
                                        <Search className="w-5 h-5 mr-2" />
                                        Search Cars
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Why Choose Us Section */}
            <section className="py-8 border-t border-gray-100">
                <div className="container mx-auto px-2 sm:px-4 lg:px-8">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            Why Choose Rent-a-Ride?
                        </h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            We're committed to providing you with the best car rental experience
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 max-w-7xl mx-auto">
                        {[
                            { icon: Shield, title: 'Trusted & Secure', description: 'Safe and reliable service with comprehensive insurance' },
                            { icon: Zap, title: 'Instant Booking', description: 'Book your car in minutes with our streamlined process' },
                            { icon: Users, title: '24/7 Support', description: 'Round-the-clock customer service when you need it' },
                            { icon: Award, title: 'Premium Quality', description: 'Well-maintained vehicles for your comfort and safety' }
                        ].map((feature, idx) => (
                            <div key={idx} className="text-center group">
                                <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 mb-4">
                                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                                        <feature.icon className="w-8 h-8 text-white" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                                    <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Enhanced Featured Cars Section */}
            <section className="py-16 border-t border-gray-100 bg-gray-50/30">
                <div className="container mx-auto px-2 sm:px-4 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            Featured Vehicles
                        </h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
                            Discover our most popular cars, perfect for any occasion
                        </p>
                        <button 
                            onClick={() => navigate('/available-cars')}
                            className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200 transform hover:scale-105"
                        >
                            View All Cars
                            <MapPin className="w-5 h-5 ml-2" />
                        </button>
                    </div>
                    
                    {loading ? (
                        <div className="flex justify-center items-center py-16">
                            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
                        </div>
                    ) : (
                        <div className="featured-cars grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-7xl mx-auto">
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
                </div>
            </section>

            {/* Enhanced How It Works Section */}
            <section className="py-16 border-t border-gray-100">
                <div className="container mx-auto px-2 sm:px-4 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
                            How It Works
                        </h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Get your perfect car in just three simple steps
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
                        {[
                            { 
                                icon: Search, 
                                title: 'Search & Select', 
                                description: 'Browse our extensive fleet and choose your perfect vehicle',
                                step: '01'
                            },
                            { 
                                icon: Calendar, 
                                title: 'Book & Confirm', 
                                description: 'Reserve your car with our secure and easy booking system',
                                step: '02'
                            },
                            { 
                                icon: MapPin, 
                                title: 'Pick Up & Drive', 
                                description: 'Collect your car and enjoy your journey with confidence',
                                step: '03'
                            }
                        ].map((step, idx) => (
                            <div key={idx} className="text-center relative">
                                <div className="bg-white border border-gray-200 p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-sm font-bold text-white">
                                        {step.step}
                                    </div>
                                    <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <step.icon className="w-8 h-8 text-white" />
                                    </div>
                                    <h3 className="text-xl font-semibold mb-3 text-gray-900">{step.title}</h3>
                                    <p className="text-gray-600 leading-relaxed">{step.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Enhanced Testimonials Section */}
            <section className="py-16 border-t border-gray-100 bg-gray-50/30">
                <div className="container mx-auto px-2 sm:px-4 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            What Our Customers Say
                        </h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Join thousands of satisfied customers who trust us for their car rental needs
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-6xl mx-auto">
                        {[
                            { 
                                name: 'John Doe', 
                                feedback: 'Exceptional service! The car was in perfect condition and the booking process was incredibly smooth. Will definitely use Rent-a-Ride again!',
                                rating: 5,
                                title: 'Happy Customer'
                            },
                            { 
                                name: 'Jane Smith', 
                                feedback: 'Amazing experience from start to finish. The customer support team was helpful and the vehicle exceeded my expectations.',
                                rating: 5,
                                title: 'Satisfied Renter'
                            }
                        ].map((testimonial, idx) => (
                            <div key={idx} className="bg-white border border-gray-200 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                                <div className="flex items-center mb-4">
                                    {[...Array(testimonial.rating)].map((_, i) => (
                                        <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                                    ))}
                                </div>
                                <p className="text-gray-700 mb-6 leading-relaxed italic">"{testimonial.feedback}"</p>
                                <div className="flex items-center">
                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
                                        {testimonial.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{testimonial.name}</h3>
                                        <p className="text-sm text-gray-600">{testimonial.title}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Enhanced Footer Section */}
            <footer className="bg-gray-900 text-white border-t border-gray-700 mt-12 rounded-3xl">
                <div className="container mx-auto px-2 sm:px-4 lg:px-8 py-16">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 mb-12 max-w-6xl mx-auto">
                        <div className="text-center md:text-left">
                            <div className="flex items-center justify-center md:justify-start mb-6">
                                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mr-4">
                                    <MapPin className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="text-2xl font-bold text-white">Rent-a-Ride</h3>
                            </div>
                            <p className="text-gray-300 leading-relaxed text-lg">
                                Your trusted partner for premium car rentals. Experience luxury, comfort, and adventure with our exceptional service.
                            </p>
                        </div>
                        <div className="text-center md:text-left">
                            <h3 className="text-xl font-bold mb-6 text-blue-400 flex items-center justify-center md:justify-start">
                                <Phone className="w-5 h-5 mr-2" />
                                Contact Us
                            </h3>
                            <div className="space-y-4 text-gray-300">
                                <div className="flex items-center justify-center md:justify-start group">
                                    <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center mr-3 group-hover:bg-blue-600 transition-colors duration-200">
                                        <Phone className="w-4 h-4 text-blue-400 group-hover:text-white" />
                                    </div>
                                    <span className="text-lg">+1 (617) 461-0054</span>
                                </div>
                                <div className="flex items-center justify-center md:justify-start group">
                                    <a 
                                        href="mailto:Joshraimo@gmail.com"
                                        className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center mr-3 group-hover:bg-blue-600 transition-colors duration-200"
                                    >
                                        <Mail className="w-4 h-4 text-blue-400 group-hover:text-white" />
                                    </a>
                                    <span className="text-lg">Joshraimo@gmail.com</span>
                                </div>
                            </div>
                        </div>
                        <div className="text-center md:text-left">
                            <h3 className="text-xl font-bold mb-6 text-blue-400 flex items-center justify-center md:justify-start">
                                <Users className="w-5 h-5 mr-2" />
                                Follow Us
                            </h3>
                            <div className="flex justify-center md:justify-start gap-4">
                                <a 
                                    href="https://www.instagram.com/josh.raimo/" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="w-14 h-14 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 rounded-full flex items-center justify-center transition-all duration-200 transform hover:scale-110 hover:shadow-lg"
                                >
                                    <Instagram className="w-7 h-7 text-white" />
                                </a>
                                <a 
                                    href="https://www.linkedin.com/in/josh-raimo-31262024b/" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="w-14 h-14 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-full flex items-center justify-center transition-all duration-200 transform hover:scale-110 hover:shadow-lg"
                                >
                                    <Linkedin className="w-7 h-7 text-white" />
                                </a>
                            </div>
                        </div>
                    </div>
                    
                    {/* Additional Footer Content */}
                    <div className="border-t border-gray-700 pt-8">
                        <div className="text-center">
                            <p className="text-gray-400 text-sm">
                                &copy; 2025 Rent-a-Ride. All rights reserved.
                            </p>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default HomePage;