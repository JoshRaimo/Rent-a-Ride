import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Select from 'react-select';
import AdminSidebar from '../components/AdminSidebar';
import CarListing from '../components/CarListing';

const CarManagement = () => {
    const [cars, setCars] = useState([]);
    const [makes, setMakes] = useState([]);
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
    const [carId, setCarId] = useState('');

    const makeOptions = makes;
    const modelOptions = models.map(model => ({ value: model, label: model }));
    const yearOptions = years.map(year => ({ value: year, label: year }));

    // Fetch car makes from carapi
    useEffect(() => {
        const fetchMakes = async () => {
            try {
                const jwt = localStorage.getItem('carApiJwt');
                const response = await axios.get(`${process.env.REACT_APP_API_URL}/carapi/makes`, {
                    headers: { Authorization: `Bearer ${jwt}` },
                });
                setMakes(response.data.data.map((make) => ({ value: make.name, label: make.name })));
            } catch (error) {
                console.error('Error fetching makes:', error.message);
                setMakes([]);
            }
        };
        fetchMakes();
    }, []);

    // Define availability options
    const availabilityOptions = [
        { value: true, label: 'Available' },
        { value: false, label: 'Unavailable' },
    ];

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
        } catch (error) {
            console.error('Error uploading image:', error.message);
            alert('Failed to upload image. Please try again.');
        }
    };

    // Handle add or update car
    const handleSubmit = async (e) => {
        e.preventDefault();
    
        try {
            const carData = {
                make,
                model: selectedModel,
                year: selectedYear,
                pricePerDay: price,
                availabilityStatus: true,
                image: imageUrl,
            };
    
            let response;
            if (isEditing) {
                response = await axios.put(`${process.env.REACT_APP_API_URL}/cars/${editCarId}`, carData);
            } else {
                response = await axios.post(`${process.env.REACT_APP_API_URL}/cars`, carData);
            }
    
            if (response.data.carId) {
                setCarId(response.data.carId);
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
        setImageUrl(car.image);
        setIsEditing(true);
        setEditCarId(car.carId);
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
        <div className="flex">
            <AdminSidebar />
            <div className="flex-1 ml-20 mt-16 p-6 bg-white rounded-lg shadow-lg">
                <h2 className="text-3xl font-bold text-center text-primary-color mb-6">Admin Dashboard</h2>

                {/* Add Car Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block font-bold mb-2">Make</label>
                        <Select
                            options={makes}
                            value={makes.find(option => option.value === make)}
                            onChange={(selectedOption) => setMake(selectedOption ? selectedOption.value : '')}
                            isClearable
                            placeholder="Select or type make"
                        />
                    </div>
                    <div>
                        <label className="block font-bold mb-2">Model</label>
                        <Select
                            options={modelOptions}
                            value={modelOptions.find(option => option.value === selectedModel)}
                            onChange={(selectedOption) => setSelectedModel(selectedOption ? selectedOption.value : '')}
                            isClearable
                            placeholder="Select or type model"
                        />
                    </div>
                    <div>
                        <label className="block font-bold mb-2">Year</label>
                        <Select
                            options={yearOptions}
                            value={yearOptions.find(option => option.value === selectedYear)}
                            onChange={(selectedOption) => setSelectedYear(selectedOption ? selectedOption.value : '')}
                            isClearable
                            placeholder="Select or type year"
                        />
                    </div>
                    <div>
                        <label className="block font-bold mb-2">Price Per Day</label>
                        <input
                            type="text"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            placeholder="Enter price per day"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                    </div>
                    <div>
                        <label className="block font-bold mb-2">Upload Picture</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                    </div>
                    <button
                        type="submit"
                        className={`w-full ${isEditing ? 'bg-yellow-500' : 'bg-blue-500'} text-white px-4 py-2 rounded-md`}
                    >
                        {isEditing ? 'Update Car' : 'Add Car'}
                    </button>
                </form>

                {/* Car Listings */}
                <h3 className="text-xl font-bold text-center text-primary-color mt-8">Car Listings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                    {cars.map((car) => (
                        <CarListing
                            key={car.carId}
                            car={car}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            showEditDeleteButtons={true}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CarManagement;