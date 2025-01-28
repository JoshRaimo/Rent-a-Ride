import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminDashboard = () => {
    const [cars, setCars] = useState([]);
    const [make, setMake] = useState('');
    const [models, setModels] = useState([]);
    const [selectedModel, setSelectedModel] = useState('');
    const [years, setYears] = useState([]);
    const [selectedYear, setSelectedYear] = useState('');
    const [price, setPrice] = useState('');
    const [availability, setAvailability] = useState(true);
    const [image, setImage] = useState(null);
    const [imageUrl, setImageUrl] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editCarId, setEditCarId] = useState(null);

    // Fetch all cars
    const fetchCars = async () => {
        try {
            const jwt = localStorage.getItem('carApiJwt'); // Retrieve JWT
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/cars`, {
                headers: {
                    Authorization: `Bearer ${jwt}`, // Include JWT in headers
                },
            });

            if (Array.isArray(response.data)) {
                setCars(response.data);
            } else if (response.data.cars && Array.isArray(response.data.cars)) {
                setCars(response.data.cars);
            } else {
                console.error('Unexpected API response format:', response.data);
            }
        } catch (error) {
            console.error('Error fetching cars:', error.message);
        }
    };

    useEffect(() => {
        fetchCars();
    }, []);

    // Fetch models based on make
    useEffect(() => {
        const fetchModels = async () => {
            if (!make) {
                setModels([]);
                return;
            }
            try {
                const jwt = localStorage.getItem('carApiJwt');
                const response = await axios.get(`${process.env.REACT_APP_API_URL}/carapi/models`, {
                    params: { make },
                    headers: { Authorization: `Bearer ${jwt}` },
                });
                setModels(response.data.data.map((model) => model.name));
            } catch (error) {
                console.error('Error fetching models:', error.message);
                setModels([]);
            }
        };
        fetchModels();
    }, [make]);

    // Fetch years based on make and model
    useEffect(() => {
        const fetchYears = async () => {
            if (!make || !selectedModel) {
                setYears([]);
                return;
            }

            try {
                const jwt = localStorage.getItem('carApiJwt');
                const response = await axios.get(`${process.env.REACT_APP_API_URL}/carapi/years`, {
                    params: { make, model: selectedModel },
                    headers: { Authorization: `Bearer ${jwt}` },
                });
                setYears(response.data);
            } catch (error) {
                console.error('Error fetching years:', error.message);
                setYears([]);
            }
        };
        fetchYears();
    }, [make, selectedModel]);

    // Handle image upload
    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setImage(file);

        const formData = new FormData();
        formData.append('image', file);

        try {
            const response = await axios.post(`${process.env.REACT_APP_API_URL}/images/upload`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            setImageUrl(response.data.imageUrl);
            alert('Image uploaded successfully!');
        } catch (error) {
            console.error('Error uploading image:', error.message);
            alert('Failed to upload image. Please try again.');
        }
    };

    // Handle add or update car
    const handleSubmit = async (e) => {
        e.preventDefault();

        const carData = {
            make,
            model: selectedModel,
            year: selectedYear,
            pricePerDay: price,
            availabilityStatus: availability,
            image: imageUrl,
        };

        try {
            if (isEditing) {
                await axios.put(`${process.env.REACT_APP_API_URL}/cars/${editCarId}`, carData);
                alert('Car updated successfully!');
            } else {
                await axios.post(`${process.env.REACT_APP_API_URL}/cars`, carData);
                alert('Car added successfully!');
            }

            resetForm();
            fetchCars();
        } catch (error) {
            console.error('Error submitting car data:', error.message);
            alert('Failed to add/update car.');
        }
    };

    // Handle delete car
    const handleDelete = async (carId) => {
        try {
            await axios.delete(`${process.env.REACT_APP_API_URL}/cars/${carId}`);
            alert('Car deleted successfully!');
            fetchCars();
        } catch (error) {
            console.error('Error deleting car:', error.message);
            alert('Failed to delete car.');
        }
    };

    // Handle edit car
    const handleEdit = (car) => {
        setMake(car.make);
        setSelectedModel(car.model);
        setSelectedYear(car.year);
        setPrice(car.pricePerDay);
        setAvailability(car.availabilityStatus);
        setImageUrl(car.image);
        setIsEditing(true);
        setEditCarId(car._id);
    };

    const resetForm = () => {
        setMake('');
        setModels([]);
        setSelectedModel('');
        setYears([]);
        setSelectedYear('');
        setPrice('');
        setAvailability(true);
        setImage(null);
        setImageUrl('');
        setIsEditing(false);
        setEditCarId(null);
    };

    return (
        <div className="container mx-auto mt-10 p-6 bg-white rounded shadow">
            <h2 className="text-3xl font-bold text-center mb-6">Admin Dashboard</h2>

            {/* Add Car Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block font-bold mb-2">Make</label>
                    <input
                        type="text"
                        className="w-full px-3 py-2 border rounded"
                        value={make}
                        onChange={(e) => setMake(e.target.value)}
                        placeholder="Enter car make"
                        required
                    />
                </div>
                <div>
                    <label className="block font-bold mb-2">Model</label>
                    <select
                        className="w-full px-3 py-2 border rounded"
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        required
                    >
                        <option value="">-- Select Model --</option>
                        {models.map((model, index) => (
                            <option key={index} value={model}>
                                {model}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block font-bold mb-2">Year</label>
                    <select
                        className="w-full px-3 py-2 border rounded"
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        required
                    >
                        <option value="">-- Select Year --</option>
                        {years.map((year, index) => (
                            <option key={index} value={year}>
                                {year}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block font-bold mb-2">Price Per Day</label>
                    <input
                        type="number"
                        className="w-full px-3 py-2 border rounded"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="Enter price per day"
                        required
                    />
                </div>
                <div>
                    <label className="block font-bold mb-2">Availability</label>
                    <select
                        className="w-full px-3 py-2 border rounded"
                        value={availability}
                        onChange={(e) => setAvailability(e.target.value === 'true')}
                    >
                        <option value="true">Available</option>
                        <option value="false">Unavailable</option>
                    </select>
                </div>
                <div>
                    <label className="block font-bold mb-2">Upload Picture</label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="w-full px-3 py-2 border rounded"
                    />
                </div>
                <button
                    type="submit"
                    className={`w-full ${isEditing ? 'bg-yellow-500' : 'bg-blue-500'} text-white px-4 py-2 rounded`}
                >
                    {isEditing ? 'Update Car' : 'Add Car'}
                </button>
            </form>

            {/* Car Listings */}
            <h3 className="text-xl font-bold mt-8">Car Listings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
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
                        <div className="mt-4 flex justify-between">
                            <button
                                className="bg-yellow-500 text-white px-4 py-2 rounded"
                                onClick={() => handleEdit(car)}
                            >
                                Edit
                            </button>
                            <button
                                className="bg-red-500 text-white px-4 py-2 rounded"
                                onClick={() => handleDelete(car._id)}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdminDashboard;