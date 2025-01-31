import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Login = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    // Validate email format
    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate email before sending request
        if (!validateEmail(email)) {
            setError('Please enter a valid email address.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await axios.post(
                `${process.env.REACT_APP_API_URL}/auth/login`,
                { email, password }
            );

            // Save token and user data to localStorage
            const { token, user } = response.data;
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));

            // Update parent state via callback
            onLoginSuccess(token);

            // Display success message
            toast.success('Login successful! Redirecting to profile page...');

            // Navigate to dashboard
            navigate('/profile');
        } catch (err) {
            console.error('Login error:', err.response?.data?.message || 'Login failed');
            setError(err.response?.data?.message || 'Invalid email or password');
            toast.error(err.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow">
            <h2 className="text-2xl font-bold mb-4 text-center">Login</h2>

            {/* Display error message */}
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label className="block mb-1">Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3 py-2 border rounded"
                        placeholder="Enter email"
                        required
                    />
                </div>
                <div className="mb-4">
                    <label className="block mb-1">Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
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
                    {loading ? 'Processing...' : 'Login'}
                </button>
            </form>
        </div>
    );
};

export default Login;