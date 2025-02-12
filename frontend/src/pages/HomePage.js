import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const HomePage = () => {
    const navigate = useNavigate();
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [startTime, setStartTime] = useState('Midnight');
    const [endTime, setEndTime] = useState('Midnight');

    // Get current date and time
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayFormatted = today.toISOString().split("T")[0];

    // Generate time options in 30-minute intervals with Noon and Midnight labels
    const generateTimeOptions = () => {
        const options = [];
        for (let hour = 0; hour < 24; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                const time = new Date();
                time.setHours(hour, minute, 0, 0);
                let label = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

                if (label === '12:00 AM') label = 'Midnight';
                if (label === '12:00 PM') label = 'Noon';

                options.push({ value: label, label });
            }
        }
        return options;
    };

    // Handle Search Button Click
    const handleSearch = () => {
        if (!startDate || !endDate || !startTime || !endTime) {
            alert('Please enter valid start and end dates and times.');
            return;
        }

        const selectedStartDateTime = new Date(`${startDate} ${startTime}`);
        const selectedEndDateTime = new Date(`${endDate} ${endTime}`);

        if (selectedStartDateTime < now) {
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
                        {generateTimeOptions().map((time, index) => (
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
                        {generateTimeOptions().map((time, index) => (
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
                <div className="featured-cars grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto px-4">
                    {[1, 2, 3].map((car, idx) => (
                        <div key={idx} className="card">
                            <div className="card-img">
                                <span>Car Image</span>
                            </div>
                            <div className="card-body">
                                <h3 className="card-title">
                                    Car Model {car}
                                </h3>
                                <p className="card-text">${50 + car * 15}/day</p>
                                <button className="btn-primary mt-4">
                                    View Details
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
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
            <footer className="footer bg-footer-bg-color text-white">
                <div className="grid-cols-footer max-w-7xl mx-auto px-4">
                    <div>
                        <h3 className="font-bold mb-2">Rent-a-Ride</h3>
                        <p>Find your perfect ride for any occasion.</p>
                    </div>
                    <div>
                        <h3 className="font-bold mb-2">Quick Links</h3>
                        <ul>
                            <li>Home</li>
                            <li>Cars</li>
                            <li>About Us</li>
                            <li>Contact</li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-bold mb-2">Contact Us</h3>
                        <p>+1 (617) 461-0054</p>
                        <p>Joshraimo@gmail.com</p>
                    </div>
                    <div>
                        <h3 className="font-bold mb-2">Follow Us</h3>
                        <p>Social Media Links</p>
                    </div>
                </div>
                <p className="mt-4 text-sm">&copy; 2025 Rent-a-Ride. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default HomePage;