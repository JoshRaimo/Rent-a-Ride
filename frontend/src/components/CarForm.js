import React, { useState, useEffect } from 'react';

const CarForm = ({ onSave, carToEdit }) => {
    const [make, setMake] = useState('');
    const [model, setModel] = useState('');
    const [year, setYear] = useState('');
    const [price, setPrice] = useState('');
    const [availability, setAvailability] = useState(true);

    useEffect(() => {
        if (carToEdit) {
            setMake(carToEdit.make);
            setModel(carToEdit.model);
            setYear(carToEdit.year);
            setPrice(carToEdit.pricePerDay);
            setAvailability(carToEdit.availabilityStatus);
        }
    }, [carToEdit]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({ make, model, year, pricePerDay: price, availabilityStatus: availability, id: carToEdit?.id });
    };

    return (
        <form onSubmit={handleSubmit}>
            <input type="text" placeholder="Make" value={make} onChange={(e) => setMake(e.target.value)} required />
            <input type="text" placeholder="Model" value={model} onChange={(e) => setModel(e.target.value)} required />
            <input type="number" placeholder="Year" value={year} onChange={(e) => setYear(e.target.value)} required />
            <input type="number" placeholder="Price Per Day" value={price} onChange={(e) => setPrice(e.target.value)} required />
            <select value={availability} onChange={(e) => setAvailability(e.target.value === 'true')}>
                <option value="true">Available</option>
                <option value="false">Unavailable</option>
            </select>
            <button type="submit">{carToEdit ? 'Update Car' : 'Add Car'}</button>
        </form>
    );
};

export default CarForm;