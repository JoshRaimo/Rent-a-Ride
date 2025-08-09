import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CarSearch = () => {
    const [carMakes, setCarMakes] = useState([]);
    const [carModels, setCarModels] = useState([]);
    const [filteredModels, setFilteredModels] = useState([]);
    const [selectedMake, setSelectedMake] = useState('');
    const [selectedModel, setSelectedModel] = useState('');
    const [error, setError] = useState('');

    // Fetch car makes on component mount
    useEffect(() => {
        const fetchMakes = async () => {
            try {
                setError('');
                const response = await axios.get(`${process.env.REACT_APP_API_URL}/carapi/makes`);
                const makes = response.data.data.map((make) => make.name);
                setCarMakes(makes);
            } catch (error) {
                console.error('Error fetching car makes:', error.response?.data || error.message);
                setError('Failed to load car makes. Please try again.');
            }
        };
    
        fetchMakes();
    }, []);

    // Fetch car models when a make is selected
    const fetchModels = async (make) => {
        setCarModels([]);
        setFilteredModels([]);
        setSelectedMake(make);
        setSelectedModel('');
        if (!make) return;

        try {
            setError('');
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/carapi/models`, {
                params: { make },
            });

            // Update car models
            const models = response.data.data.map((model) => model.name); // Adjust based on response structure
            setCarModels(models);
            setFilteredModels(models);
        } catch (error) {
            console.error('Error fetching car models:', error.response?.data || error.message);
            setError('Failed to load car models. Please try again.');
        }
    };

    return (
        <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow">
            <h2 className="text-2xl font-bold mb-6 text-center">Car Search</h2>
            {error && <p className="text-red-500 mb-4">{error}</p>}
            <div className="mb-4">
                <label htmlFor="make" className="block mb-2 font-bold">Select Make</label>
                <select
                    id="make"
                    className="w-full px-3 py-2 border rounded"
                    value={selectedMake}
                    onChange={(e) => fetchModels(e.target.value)}
                >
                    <option value="">-- Select Make --</option>
                    {carMakes.map((make, index) => (
                        <option key={index} value={make}>
                            {make}
                        </option>
                    ))}
                </select>
            </div>

            {selectedMake && carModels.length > 0 && (
                <div className="mb-4">
                    <label htmlFor="model" className="block mb-2 font-bold">Select Model</label>
                    <select
                        id="model"
                        className="w-full px-3 py-2 border rounded"
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                    >
                        <option value="">-- Select Model --</option>
                        {carModels.map((model, index) => (
                            <option key={index} value={model}>
                                {model}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {selectedModel && (
                <div className="mt-4">
                    <h3 className="text-lg font-bold">Selected Car:</h3>
                    <p>
                        <span className="font-bold">Make:</span> {selectedMake}
                    </p>
                    <p>
                        <span className="font-bold">Model:</span> {selectedModel}
                    </p>
                </div>
            )}
        </div>
    );
};

export default CarSearch;