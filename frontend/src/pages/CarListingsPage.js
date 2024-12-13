import React, { useEffect, useState } from 'react';
import axios from 'axios';

const CarListingsPage = () => {
    const [cars, setCars] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Fetch cars from the backend API
        const fetchCars = async () => {
            try {
                console.log('Fetching cars...'); // Debug
                const response = await axios.get(`${process.env.REACT_APP_API_URL}/cars`);
                console.log('API Response:', response.data); // Debug
                setCars(response.data);
            } catch (err) {
                console.error('Error fetching cars:', err); // Debug
                setError('Failed to fetch car listings.');
            } finally {
                setLoading(false);
            }
        };

        fetchCars();
    }, []);

    if (loading) return <p>Loading...</p>;
    if (error) return <p>{error}</p>;

    return (
        <div>
            <h1>Car Listings</h1>
            <div>
                {cars.map((car) => (
                    <div key={car._id} style={{ border: '1px solid #ccc', margin: '10px', padding: '10px' }}>
                        <h2>{car.make} {car.model}</h2>
                        <p>Year: {car.year}</p>
                        <p>Price per Day: ${car.pricePerDay}</p>
                        <p>Available: {car.availabilityStatus ? 'Yes' : 'No'}</p>
                        {car.image && <img src={car.image} alt={`${car.make} ${car.model}`} style={{ maxWidth: '200px' }} />}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CarListingsPage;