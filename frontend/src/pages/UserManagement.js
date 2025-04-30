import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminSidebar from '../components/AdminSidebar';
import { toast } from 'react-toastify';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/users`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error.response?.data?.message || error.message);
            setError('Failed to load users.');
        }
    };

    const resetPassword = async (userId) => {
        try {
            const response = await axios.patch(
                `${process.env.REACT_APP_API_URL}/users/${userId}/reset-password`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                }
            );
            toast.success(response.data.message);
        } catch (err) {
            console.error('Error resetting password:', err);
            toast.error(err.response?.data?.message || 'Failed to reset password');
        }
    };

    const deleteUser = async (userId) => {
        toast.info(
            <div>
                <p>Are you sure you want to delete this user?</p>
                <div className="mt-2">
                    <button
                        className="bg-red-500 text-white px-4 py-2 rounded mr-2"
                        onClick={() => {
                            handleDeleteConfirm(userId);
                            toast.dismiss();
                        }}
                    >
                        Delete
                    </button>
                    <button
                        className="bg-gray-500 text-white px-4 py-2 rounded"
                        onClick={() => toast.dismiss()}
                    >
                        Cancel
                    </button>
                </div>
            </div>,
            {
                autoClose: false,
                closeOnClick: false,
                draggable: false,
                closeButton: false
            }
        );
    };

    const handleDeleteConfirm = async (userId) => {
        try {
            await axios.delete(`${process.env.REACT_APP_API_URL}/users/${userId}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });
            fetchUsers(); // Refresh users list
            toast.success('User deleted successfully');
        } catch (err) {
            console.error('Error deleting user:', err);
            toast.error('Failed to delete user');
        }
    };

    return (
        <div className="flex">
            <AdminSidebar />
            <div className="flex-1 ml-20 mt-16 p-6 bg-white rounded-lg shadow-lg">
                <h2 className="text-3xl font-bold text-center text-primary-color mb-6">User Management</h2>
                {error && <p className="text-red-500">{error}</p>}
                <input 
                    type="text" 
                    placeholder="Search users..." 
                    className="border p-2 rounded w-full mb-4" 
                    value={search} 
                    onChange={(e) => setSearch(e.target.value)}
                />
                <h3 className="text-xl font-bold text-center text-primary-color mt-8">User List</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {users.filter(user => user.username.toLowerCase().includes(search.toLowerCase()))
                        .map(user => (
                            <div key={user._id} className="border p-4 rounded shadow-md">
                                <h2 className="text-lg font-semibold">{user.username}</h2>
                                <p>Email: {user.email}</p>
                                <p>Role: {user.role}</p>
                                <button 
                                    className="bg-blue-500 text-white p-2 rounded mt-2"
                                    onClick={() => resetPassword(user._id)}
                                >
                                    Reset Password
                                </button>
                                {user.role !== 'admin' && (
                                    <button 
                                        className="bg-red-500 text-white p-2 rounded mt-2 ml-2"
                                        onClick={() => deleteUser(user._id)}
                                    >
                                        Delete User
                                    </button>
                                )}
                            </div>
                        ))}
                </div>
            </div>
        </div>
    );
};

export default UserManagement;