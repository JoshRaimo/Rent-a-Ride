import React from 'react';

const CarTable = ({ cars, onEdit, onDelete }) => (
    <table>
        <thead>
            <tr>
                <th>Make</th>
                <th>Model</th>
                <th>Year</th>
                <th>Price Per Day</th>
                <th>Availability</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody>
            {cars.map((car) => (
                <tr key={car.id}>
                    <td>{car.make}</td>
                    <td>{car.model}</td>
                    <td>{car.year}</td>
                    <td>{car.pricePerDay}</td>
                    <td>{car.availabilityStatus ? 'Available' : 'Unavailable'}</td>
                    <td>
                        <button onClick={() => onEdit(car)}>Edit</button>
                        <button onClick={() => onDelete(car.id)}>Delete</button>
                    </td>
                </tr>
            ))}
        </tbody>
    </table>
);

export default CarTable;