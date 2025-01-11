import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Register = () => {
    const [formData, setFormData] = useState({ username: '', email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false); // Added loading state
    const navigate = useNavigate();

    const handleChange = (e) =>
        setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true); // Show loading state
        setError(''); // Clear previous errors
        try {
            const response = await axios.post(
                `${process.env.REACT_APP_API_URL}/auth/register`,
                formData
            );

            // Show success toast
            toast.success(response.data.message || 'Registration successful! Redirecting...');

            // Redirect to login page
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            // Handle errors (network or server issues)
            console.error('Registration error:', err.response?.data?.error || 'Registration failed');
            if (!err.response) {
                setError('Network error. Please check your connection.');
                toast.error('Network error. Please check your connection.');
            } else {
                setError(err.response.data.error || 'Registration failed. Please try again.');
                toast.error(err.response.data.error || 'Registration failed.');
            }
        } finally {
            setLoading(false); // Hide loading state
        }
    };

    return (
        <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow">
            <h2 className="text-2xl font-bold mb-4 text-center">Register</h2>

            {/* Display error message */}
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

            {/* Display loading state */}
            {loading && <p className="text-blue-500 text-sm mb-4">Processing registration...</p>}

            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label className="block mb-1">Username</label>
                    <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border rounded"
                        placeholder="Enter username"
                        required
                    />
                </div>
                <div className="mb-4">
                    <label className="block mb-1">Email</label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border rounded"
                        placeholder="Enter email"
                        required
                    />
                </div>
                <div className="mb-4">
                    <label className="block mb-1">Password</label>
                    <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border rounded"
                        placeholder="Enter password"
                        required
                    />
                </div>
                <button
                    type="submit"
                    className={`w-full py-2 rounded text-white ${
                        loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
                    }`}
                    disabled={loading}
                >
                    {loading ? 'Processing...' : 'Register'}
                </button>
            </form>
        </div>
    );
};

export default Register;