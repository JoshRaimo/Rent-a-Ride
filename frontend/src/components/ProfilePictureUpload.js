import React, { useState, useRef } from 'react';
import axios from 'axios';
import { Camera, Upload, Trash2, User, Loader } from 'lucide-react';
import { toast } from 'react-toastify';

const ProfilePictureUpload = ({ user, onProfileUpdate }) => {
    const [uploading, setUploading] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (file) {
            handleUpload(file);
        }
    };

    const handleUpload = async (file) => {
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
            toast.error('Please select a valid image file (JPEG, PNG, WEBP, or GIF)');
            return;
        }

        // Validate file size (5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            toast.error('File size must be less than 5MB');
            return;
        }

        setUploading(true);

        try {
            const formData = new FormData();
            formData.append('profilePicture', file);

            const response = await axios.post(
                `${process.env.REACT_APP_API_URL}/profile-images/upload`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                }
            );

            toast.success('Profile picture updated successfully!');
            
            // Update the user data in parent component
            if (onProfileUpdate && response.data.user) {
                onProfileUpdate(response.data.user);
            }

        } catch (error) {
            console.error('Error uploading profile picture:', error);
            toast.error(error.response?.data?.error || 'Failed to upload profile picture');
        } finally {
            setUploading(false);
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleDelete = async () => {
        if (!user?.profilePicture) {
            toast.error('No profile picture to delete');
            return;
        }

        setDeleting(true);

        try {
            const response = await axios.delete(
                `${process.env.REACT_APP_API_URL}/profile-images/delete`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                }
            );

            toast.success('Profile picture removed successfully!');
            
            // Update the user data in parent component
            if (onProfileUpdate && response.data.user) {
                onProfileUpdate(response.data.user);
            }

        } catch (error) {
            console.error('Error deleting profile picture:', error);
            toast.error(error.response?.data?.error || 'Failed to delete profile picture');
        } finally {
            setDeleting(false);
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="flex flex-col items-center space-y-4">
            {/* Profile Picture Display */}
            <div className="relative group">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-200 shadow-lg bg-gray-100 flex items-center justify-center">
                    {user?.profilePicture ? (
                        <img
                            src={user.profilePicture}
                            alt={`${user.username}'s profile`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                // Fallback if image fails to load
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                            }}
                        />
                    ) : null}
                    
                    {/* Fallback Avatar */}
                    <div 
                        className={`w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold ${
                            user?.profilePicture ? 'hidden' : 'flex'
                        }`}
                    >
                        {user?.username ? user.username.charAt(0).toUpperCase() : <User className="w-12 h-12" />}
                    </div>
                </div>

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <Camera className="w-8 h-8 text-white" />
                </div>
            </div>

            {/* Upload/Delete Buttons */}
            <div className="flex space-x-3">
                <button
                    onClick={triggerFileInput}
                    disabled={uploading || deleting}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {uploading ? (
                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                        <Upload className="w-4 h-4 mr-2" />
                    )}
                    {uploading ? 'Uploading...' : user?.profilePicture ? 'Change Photo' : 'Upload Photo'}
                </button>

                {user?.profilePicture && (
                    <button
                        onClick={handleDelete}
                        disabled={uploading || deleting}
                        className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {deleting ? (
                            <Loader className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <Trash2 className="w-4 h-4 mr-2" />
                        )}
                        {deleting ? 'Removing...' : 'Remove'}
                    </button>
                )}
            </div>

            {/* Hidden File Input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleFileSelect}
                className="hidden"
            />

            {/* Upload Guidelines */}
            <div className="text-center text-sm text-gray-500 max-w-xs">
                <p>Upload a profile picture (JPEG, PNG, WEBP, or GIF)</p>
                <p>Maximum file size: 5MB</p>
            </div>
        </div>
    );
};

export default ProfilePictureUpload;
