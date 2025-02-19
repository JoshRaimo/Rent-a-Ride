import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminSidebar from '../components/AdminSidebar';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('user');
    const [isEditing, setIsEditing] = useState(false);
    const [editUserId, setEditUserId] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/users/all`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error.message);
            setError('Failed to load users.');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const userData = { username, email, password, role };

            if (isEditing) {
                await axios.put(`${process.env.REACT_APP_API_URL}/users/update/${editUserId}`, userData, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                });
            } else {
                await axios.post(`${process.env.REACT_APP_API_URL}/users/add`, userData, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                });
            }
            resetForm();
            fetchUsers();
        } catch (error) {
            console.error('Error submitting user data:', error.response?.data?.message || error.message);
            setError('Failed to save user. Please try again.');
        }
    };

    const handleDelete = async (userId) => {
        try {
            await axios.delete(`${process.env.REACT_APP_API_URL}/users/delete/${userId}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });
            fetchUsers();
        } catch (error) {
            console.error('Error deleting user:', error.message);
        }
    };

    const handleEdit = (user) => {
        setUsername(user.username);
        setEmail(user.email);
        setPassword(''); // Reset password for security
        setRole(user.role);
        setIsEditing(true);
        setEditUserId(user._id);
    };

    const resetForm = () => {
        setUsername('');
        setEmail('');
        setPassword('');
        setRole('user');
        setIsEditing(false);
        setEditUserId(null);
    };

    return (
        <div className="flex">
            <AdminSidebar />
            <div className="flex-1 ml-20 mt-16 p-6 bg-white rounded-lg shadow-lg">
                <h2 className="text-3xl font-bold text-center text-primary-color mb-6">User Management</h2>
                {error && <p className="text-red-500">{error}</p>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block font-bold mb-2">Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter username"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            required
                        />
                    </div>
                    <div>
                        <label className="block font-bold mb-2">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter email"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            required
                        />
                    </div>
                    <div>
                        <label className="block font-bold mb-2">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder={isEditing ? "Enter new password (leave blank to keep unchanged)" : "Enter password"}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            required={!isEditing} // Only required for new users
                        />
                    </div>
                    <div>
                        <label className="block font-bold mb-2">Role</label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                    <button
                        type="submit"
                        className={`w-full ${isEditing ? 'bg-yellow-500' : 'bg-blue-500'} text-white px-4 py-2 rounded-md`}
                    >
                        {isEditing ? 'Update User' : 'Add User'}
                    </button>
                </form>
                <h3 className="text-xl font-bold text-center text-primary-color mt-8">User List</h3>
                <table className="min-w-full bg-white border border-gray-300">
                    <thead>
                        <tr className="bg-gray-200">
                            <th className="py-2 border">Username</th>
                            <th className="py-2 border">Email</th>
                            <th className="py-2 border">Role</th>
                            <th className="py-2 border">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Array.isArray(users) && users.map((user) => (
                            <tr key={user._id} className="text-center border">
                                <td className="py-2 border">{user.username}</td>
                                <td className="py-2 border">{user.email}</td>
                                <td className="py-2 border">{user.role}</td>
                                <td className="py-2 border">
                                    <button
                                        onClick={() => handleEdit(user)}
                                        className="bg-yellow-500 text-white px-2 py-1 rounded-md mx-1"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(user._id)}
                                        className="bg-red-500 text-white px-2 py-1 rounded-md mx-1"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UserManagement;