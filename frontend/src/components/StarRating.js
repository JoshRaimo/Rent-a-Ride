import React from 'react';
import { Star } from 'lucide-react';

const StarRating = ({ 
    rating, 
    onRatingChange = null, 
    size = 'md', 
    showNumber = false,
    interactive = false,
    className = ''
}) => {
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6',
        xl: 'w-8 h-8'
    };

    const starSize = sizeClasses[size] || sizeClasses.md;

    const handleStarClick = (selectedRating) => {
        if (interactive && onRatingChange) {
            onRatingChange(selectedRating);
        }
    };

    const renderStars = () => {
        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;

        for (let i = 1; i <= 5; i++) {
            let starType = 'empty';
            
            if (i <= fullStars) {
                starType = 'full';
            } else if (i === fullStars + 1 && hasHalfStar) {
                starType = 'half';
            }

            stars.push(
                <div
                    key={i}
                    className={`relative ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
                    onClick={() => handleStarClick(i)}
                >
                    {starType === 'full' && (
                        <Star className={`${starSize} fill-yellow-400 text-yellow-400`} />
                    )}
                    {starType === 'half' && (
                        <>
                            <Star className={`${starSize} fill-gray-300 text-gray-300 absolute`} />
                            <div className="relative overflow-hidden" style={{ width: '50%' }}>
                                <Star className={`${starSize} fill-yellow-400 text-yellow-400`} />
                            </div>
                        </>
                    )}
                    {starType === 'empty' && (
                        <Star className={`${starSize} fill-gray-300 text-gray-300`} />
                    )}
                </div>
            );
        }

        return stars;
    };

    return (
        <div className={`flex items-center gap-1 ${className}`}>
            <div className="flex items-center gap-0.5">
                {renderStars()}
            </div>
            {showNumber && (
                <span className={`ml-2 ${size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-lg' : 'text-base'} text-gray-600`}>
                    {rating > 0 ? rating.toFixed(1) : '0.0'}
                </span>
            )}
        </div>
    );
};

export default StarRating;
