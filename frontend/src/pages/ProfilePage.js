import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const ProfilePage = ({ onUpdateUser }) => {
    const [user, setUser] = useState(null);
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(
                    `${process.env.REACT_APP_API_URL}/users/profile`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setUser(response.data);
                setUsername(response.data.username);
                setEmail(response.data.email);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching profile:', error.message);
                toast.error('Failed to fetch profile.');
                setLoading(false);
            }
        };

        fetchUserProfile();
    }, []);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        try {
            setUpdating(true);
            const token = localStorage.getItem('token');
            const response = await axios.put(
                `${process.env.REACT_APP_API_URL}/users/profile`,
                { username, email },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Update localStorage and notify parent component
            const updatedUser = response.data.user;
            localStorage.setItem('user', JSON.stringify(updatedUser));
            onUpdateUser(updatedUser); // Update App state immediately

            toast.success('Profile updated successfully!');
        } catch (error) {
            console.error('Error updating profile:', error.message);
            toast.error('Failed to update profile.');
        } finally {
            setUpdating(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        try {
            setUpdating(true);
            const token = localStorage.getItem('token');
            await axios.put(
                `${process.env.REACT_APP_API_URL}/users/change-password`,
                { currentPassword, newPassword },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            toast.success('Password updated successfully!');
            setCurrentPassword('');
            setNewPassword('');
        } catch (error) {
            console.error('Error changing password:', error.message);
            toast.error(error.response?.data?.message || 'Failed to change password.');
        } finally {
            setUpdating(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow">
            <h1 className="text-2xl font-bold mb-6 text-center">Profile</h1>

            {loading ? (
                <p className="text-center text-blue-500">Loading profile...</p>
            ) : (
                <>
                    <form onSubmit={handleUpdateProfile} className="mb-8">
                        <div className="mb-4">
                            <label className="block mb-1">Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-3 py-2 border rounded"
                                placeholder="Enter your username"
                                required
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block mb-1">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-3 py-2 border rounded"
                                placeholder="Enter your email"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className={`w-full py-2 rounded text-white ${
                                updating
                                    ? 'bg-blue-400 cursor-not-allowed'
                                    : 'bg-blue-500 hover:bg-blue-600'
                            }`}
                            disabled={updating}
                        >
                            {updating ? 'Updating...' : 'Update Profile'}
                        </button>
                    </form>

                    <div className="border-t pt-6">
                        <h2 className="text-xl font-bold mb-4">Change Password</h2>
                        <form onSubmit={handleChangePassword}>
                            <div className="mb-4">
                                <label className="block mb-1">Current Password</label>
                                <input
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    className="w-full px-3 py-2 border rounded"
                                    placeholder="Enter current password"
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block mb-1">New Password</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full px-3 py-2 border rounded"
                                    placeholder="Enter new password"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                className={`w-full py-2 rounded text-white ${
                                    updating
                                        ? 'bg-blue-400 cursor-not-allowed'
                                        : 'bg-blue-500 hover:bg-blue-600'
                                }`}
                                disabled={updating}
                            >
                                {updating ? 'Updating Password...' : 'Change Password'}
                            </button>
                        </form>
                    </div>
                </>
            )}
        </div>
    );
};

export default ProfilePage;
