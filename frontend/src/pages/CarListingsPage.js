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
                const jwt = localStorage.getItem('carApiJwt'); // Retrieve JWT
                const response = await axios.get(`${process.env.REACT_APP_API_URL}/cars`, {
                    headers: {
                        Authorization: `Bearer ${jwt}`, // Include JWT in headers
                    },
                });

                // Check if response contains a cars array
                if (Array.isArray(response.data)) {
                    setCars(response.data); // Direct array
                } else if (response.data.cars && Array.isArray(response.data.cars)) {
                    setCars(response.data.cars); // Wrapped array
                } else {
                    console.error('Unexpected API response format:', response.data);
                    setError('Invalid data format received from server.');
                }
            } catch (err) {
                console.error('Error fetching cars:', err.response?.data || err.message);
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
        <div className="container mx-auto mt-10">
            <h1 className="text-3xl font-bold text-center mb-6">Car Listings</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cars.map((car) => (
                    <div key={car._id} className="border rounded shadow p-4">
                        <h2 className="text-xl font-bold">{car.make} {car.model}</h2>
                        <p><strong>Year:</strong> {car.year}</p>
                        <p><strong>Price per Day:</strong> ${car.pricePerDay}</p>
                        <p><strong>Available:</strong> {car.availabilityStatus ? 'Yes' : 'No'}</p>
                        {car.image && (
                            <img
                                src={car.image}
                                alt={`${car.make} ${car.model}`}
                                className="mt-2 w-full h-auto object-cover rounded"
                                style={{ maxHeight: '200px' }}
                            />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CarListingsPage;