import React from 'react';
import { User } from 'lucide-react';

const ProfileAvatar = ({ 
    user, 
    size = 'md', 
    className = '', 
    showFallback = true,
    onClick = null 
}) => {
    const sizeClasses = {
        xs: 'w-6 h-6 text-xs',
        sm: 'w-8 h-8 text-sm',
        md: 'w-12 h-12 text-lg',
        lg: 'w-16 h-16 text-xl',
        xl: 'w-20 h-20 text-2xl',
        '2xl': 'w-24 h-24 text-3xl',
        '3xl': 'w-32 h-32 text-4xl'
    };

    const iconSizes = {
        xs: 'w-3 h-3',
        sm: 'w-4 h-4',
        md: 'w-6 h-6',
        lg: 'w-8 h-8',
        xl: 'w-10 h-10',
        '2xl': 'w-12 h-12',
        '3xl': 'w-16 h-16'
    };

    const baseClasses = `${sizeClasses[size]} rounded-full overflow-hidden border-2 border-gray-200 ${className}`;
    const containerClasses = onClick ? `${baseClasses} cursor-pointer hover:border-blue-400 transition-colors` : baseClasses;

    return (
        <div className={containerClasses} onClick={onClick}>
            {user?.profilePicture ? (
                <img
                    src={user.profilePicture}
                    alt={`${user.username || 'User'}'s profile`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                        // Fallback if image fails to load
                        e.target.style.display = 'none';
                        if (e.target.nextSibling) {
                            e.target.nextSibling.style.display = 'flex';
                        }
                    }}
                />
            ) : null}
            
            {/* Fallback Avatar */}
            {showFallback && (
                <div className={`w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold ${user?.profilePicture ? 'hidden' : 'flex'}`}>
                    {user?.username ? (
                        user.username.charAt(0).toUpperCase()
                    ) : (
                        <User className={iconSizes[size]} />
                    )}
                </div>
            )}
        </div>
    );
};

export default ProfileAvatar;
