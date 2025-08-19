import React from 'react';
import { useNavigate } from 'react-router-dom';
import StarRating from './StarRating';

const CarListing = React.memo(({ car, onEdit, onDelete, showEditDeleteButtons, onBookNow, onLogin, isDynamic = false }) => {
    const navigate = useNavigate();

    // Format price with commas for thousands
    const formatPrice = (price) => {
        return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    };

    // Get car status color and text
    const getStatusInfo = (availabilityStatus) => {
        if (availabilityStatus) {
            return { color: 'text-green-600', bgColor: 'bg-green-100', text: 'Available' };
        }
        return { color: 'text-red-600', bgColor: 'bg-red-100', text: 'Unavailable' };
    };

    const statusInfo = getStatusInfo(car.availabilityStatus);

    return (
        <div className={`car-listing bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 group ${isDynamic ? 'dynamic' : ''}`}>
            {/* Header Section */}
            <div className="mb-4">
                <div className="flex items-start justify-between mb-2">
                    <h2 className="text-xl font-bold text-gray-900 leading-tight flex-1">
                        {car.make} {car.model}
                    </h2>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.color}`}>
                        {statusInfo.text}
                    </span>
                </div>
                <div className="flex items-center justify-between">
                    <p className="text-lg text-gray-600 font-medium">{car.year}</p>
                    {/* Rating Display */}
                    {car.averageRating > 0 && (
                        <div className="flex items-center gap-1">
                            <StarRating rating={car.averageRating} size="sm" showNumber={true} />
                            <span className="text-xs text-gray-500 ml-1">
                                ({car.reviewCount} review{car.reviewCount !== 1 ? 's' : ''})
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Image Section */}
            {car.image ? (
                <div className="relative overflow-hidden rounded-lg mb-4 group-hover:scale-[1.02] transition-transform duration-300">
                    <div className="w-full h-48 md:h-56 bg-gray-50 rounded-lg flex items-center justify-center image-container p-2">
                        <img
                            src={car.image}
                            alt={`${car.make} ${car.model} ${car.year}`}
                            className="w-full h-full object-contain rounded-lg"
                            onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                            }}
                        />
                        <div className="hidden absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg items-center justify-center">
                            <div className="text-center">
                                <i className="fas fa-car text-4xl text-gray-400 mb-2"></i>
                                <p className="text-gray-500 text-sm">Image not available</p>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg h-48 md:h-56 mb-4 flex items-center justify-center">
                    <div className="text-center">
                        <i className="fas fa-car text-4xl text-gray-400 mb-2"></i>
                        <p className="text-gray-500 text-sm">No image available</p>
                    </div>
                </div>
            )}

            {/* Price Section */}
            <div className="text-center mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-100">
                <p className="text-3xl font-bold text-green-700 mb-1">
                    ${formatPrice(car.pricePerDay)}
                </p>
                <p className="text-sm text-green-600 font-medium">per day</p>
            </div>

            {/* Car Details Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6 text-sm">
                <div className="flex items-center space-x-2">
                    <i className="fas fa-tag text-gray-400 w-4"></i>
                    <span className="text-gray-600">{car.make}</span>
                </div>
                <div className="flex items-center space-x-2">
                    <i className="fas fa-car text-gray-400 w-4"></i>
                    <span className="text-gray-600">{car.model}</span>
                </div>
                <div className="flex items-center space-x-2">
                    <i className="fas fa-calendar text-gray-400 w-4"></i>
                    <span className="text-gray-600">{car.year}</span>
                </div>
                <div className="flex items-center space-x-2">
                    <i className="fas fa-dollar-sign text-gray-400 w-4"></i>
                    <span className="text-gray-600">${formatPrice(car.pricePerDay)}/day</span>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
                {showEditDeleteButtons && (
                    <div className="flex justify-between items-center">
                        {onEdit && (
                            <button
                                className="edit-button bg-amber-500 hover:bg-amber-600 text-white font-medium py-2.5 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                                onClick={() => onEdit(car)}
                            >
                                <i className="fas fa-edit text-sm"></i>
                                <span>Edit</span>
                            </button>
                        )}
                        {onDelete && (
                            <button
                                className="delete-button bg-red-500 hover:bg-red-600 text-white font-medium py-2.5 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                                onClick={() => onDelete(car.carId)}
                            >
                                <i className="fas fa-trash text-sm"></i>
                                <span>Delete</span>
                            </button>
                        )}
                    </div>
                )}
                
                {onBookNow && (
                    <button
                        className="book-button w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2 shadow-md hover:shadow-lg"
                        onClick={() => onBookNow(car)}
                    >
                        <i className="fas fa-calendar-check text-sm"></i>
                        <span>Book Now</span>
                    </button>
                )}
                
                {onLogin && (
                    <button
                        className="login-button w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2 shadow-md hover:shadow-lg"
                        onClick={onLogin}
                    >
                        <i className="fas fa-sign-in-alt text-sm"></i>
                        <span>Login to Book</span>
                    </button>
                )}
            </div>
        </div>
    );
});

CarListing.displayName = 'CarListing';

export default CarListing; 