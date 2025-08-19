import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { User, Mail, Shield, Edit2, Save, X } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import ProfilePictureUpload from './ProfilePictureUpload';

const UserProfile = () => {
    const { toast } = useToast();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        email: ''
    });

    useEffect(() => {
        fetchUserProfile();
    }, []);

    const fetchUserProfile = async () => {
        try {
            const response = await axios.get(
                `${process.env.REACT_APP_API_URL}/users/profile`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                }
            );
            setUser(response.data);
            setFormData({
                username: response.data.username,
                email: response.data.email
            });
        } catch (error) {
            console.error('Error fetching user profile:', error);
            toast.error('Failed to load profile', {
                title: 'Loading Error'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleProfileUpdate = (updatedUser) => {
        setUser(updatedUser);
    };

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSave = async () => {
        try {
            const response = await axios.put(
                `${process.env.REACT_APP_API_URL}/users/profile`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                }
            );
            setUser(response.data.user);
            setEditing(false);
            toast.success('Profile updated successfully!', {
                title: 'Profile Updated'
            });
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error('Failed to update profile', {
                title: 'Update Failed'
            });
        }
    };

    const handleCancel = () => {
        setFormData({
            username: user.username,
            email: user.email
        });
        setEditing(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="ml-4 text-gray-600 text-lg">Loading profile...</p>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-600">Failed to load profile</p>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto p-6">
            <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-8 text-center text-white">
                    <h1 className="text-2xl font-bold mb-2">User Profile</h1>
                    <p className="opacity-90">Manage your account information</p>
                </div>

                <div className="p-6">
                    {/* Profile Picture Section */}
                    <div className="mb-8">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 text-center">Profile Picture</h2>
                        <ProfilePictureUpload user={user} onProfileUpdate={handleProfileUpdate} />
                    </div>

                    {/* Profile Information */}
                    <div className="border-t pt-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold text-gray-900">Account Information</h2>
                            {!editing ? (
                                <button
                                    onClick={() => setEditing(true)}
                                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    <Edit2 className="w-4 h-4 mr-2" />
                                    Edit Profile
                                </button>
                            ) : (
                                <div className="flex space-x-2">
                                    <button
                                        onClick={handleSave}
                                        className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                    >
                                        <Save className="w-4 h-4 mr-2" />
                                        Save
                                    </button>
                                    <button
                                        onClick={handleCancel}
                                        className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                                    >
                                        <X className="w-4 h-4 mr-2" />
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            {/* Username */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <User className="w-4 h-4 inline mr-1" />
                                    Username
                                </label>
                                {editing ? (
                                    <input
                                        type="text"
                                        name="username"
                                        value={formData.username}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                ) : (
                                    <p className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                                        {user.username}
                                    </p>
                                )}
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <Mail className="w-4 h-4 inline mr-1" />
                                    Email Address
                                </label>
                                {editing ? (
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                ) : (
                                    <p className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                                        {user.email}
                                    </p>
                                )}
                            </div>

                            {/* Role (Read-only) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <Shield className="w-4 h-4 inline mr-1" />
                                    Account Role
                                </label>
                                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                        user.role === 'admin' 
                                            ? 'bg-purple-100 text-purple-800' 
                                            : 'bg-green-100 text-green-800'
                                    }`}>
                                        <Shield className="w-3 h-3 mr-1" />
                                        {user.role}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserProfile;
