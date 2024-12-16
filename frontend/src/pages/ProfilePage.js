import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const ProfilePage = ({ onUpdateUser }) => {
    const [user, setUser] = useState(null);
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get('http://localhost:5000/api/users/profile', {
                    headers: { Authorization: `Bearer ${token}` },
                });
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
                'http://localhost:5000/api/users/profile',
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

    return (
        <div className="max-w-3xl mx-auto mt-10 p-6 bg-white rounded shadow">
            <h1 className="text-3xl font-bold mb-6 text-center">Profile Page</h1>

            {loading ? (
                <p className="text-center">Loading profile...</p>
            ) : (
                <form onSubmit={handleUpdateProfile}>
                    <div className="mb-4">
                        <label className="block mb-1 font-semibold">Username</label>
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
                        <label className="block mb-1 font-semibold">Email</label>
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
                        className={`w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 ${
                            updating ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        disabled={updating}
                    >
                        {updating ? 'Updating...' : 'Update Profile'}
                    </button>
                </form>
            )}
        </div>
    );
};

export default ProfilePage;