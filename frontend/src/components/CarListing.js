import React from 'react';

const CarListing = ({ car, onEdit, onDelete, showEditDeleteButtons, onBookNow, onLogin }) => {
    return (
        <div className="car-listing">
            <h2 className="text-xl font-bold">{car.make} {car.model} {car.year}</h2>
            <p style={{ textAlign: 'center' }}> <strong>${car.pricePerDay}/day</strong> </p>
            {car.image && (
                <img
                    src={car.image}
                    alt={`${car.make} ${car.model}`}
                    className="mt-2 w-full h-auto object-cover rounded-md"
                    style={{ maxHeight: '200px' }}
                />
            )}
            {showEditDeleteButtons && (
                <div className="button-group mt-4">
                    {onEdit && (
                        <button
                            className="edit-button"
                            onClick={() => onEdit(car)}
                        >
                            Edit
                        </button>
                    )}
                    {onDelete && (
                        <button
                            className="delete-button"
                            onClick={() => onDelete(car.carId)}
                        >
                            Delete
                        </button>
                    )}
                </div>
            )}
            {onBookNow && (
                <button
                    className="book-button mt-4"
                    onClick={() => onBookNow(car)}
                >
                    Book Now
                </button>
            )}
            {onLogin && (
                <button
                    className="login-button mt-4"
                    onClick={onLogin}
                >
                    Login to Book
                </button>
            )}
        </div>
    );
};

export default CarListing; 