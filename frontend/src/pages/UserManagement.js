import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Users, Shield, Mail, Trash2, RotateCcw, UserCheck } from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import ProfileAvatar from '../components/ProfileAvatar';
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

    const filteredUsers = users.filter(user => 
        user.username.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="flex min-h-screen bg-gray-50">
            <AdminSidebar />
            <div className="flex-1 ml-20 p-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center mb-2">
                        <Users className="w-8 h-8 text-blue-600 mr-3" />
                        <h1 className="text-4xl font-bold text-gray-900">User Management</h1>
                    </div>
                    <p className="text-gray-600 text-lg">Manage user accounts, roles, and permissions</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-700">{error}</p>
                    </div>
                )}

                {/* Search and Stats */}
                <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 mb-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input 
                                type="text" 
                                placeholder="Search users by name or email..." 
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                                value={search} 
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center">
                                <UserCheck className="w-4 h-4 mr-1" />
                                <span>Total: {users.length}</span>
                            </div>
                            <div className="flex items-center">
                                <Shield className="w-4 h-4 mr-1" />
                                <span>Admins: {users.filter(u => u.role === 'admin').length}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Users Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredUsers.length > 0 ? (
                        filteredUsers.map(user => (
                            <div key={user._id} className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center">
                                        <ProfileAvatar user={user} size="md" className="mr-4" />
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900">{user.username}</h3>
                                            <div className="flex items-center text-sm text-gray-600">
                                                <Mail className="w-4 h-4 mr-1" />
                                                {user.email}
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        user.role === 'admin' 
                                            ? 'bg-purple-100 text-purple-800' 
                                            : 'bg-green-100 text-green-800'
                                    }`}>
                                        <div className="flex items-center">
                                            <Shield className="w-3 h-3 mr-1" />
                                            {user.role}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button 
                                        className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                                        onClick={() => resetPassword(user._id)}
                                    >
                                        <RotateCcw className="w-4 h-4 mr-1" />
                                        Reset Password
                                    </button>
                                    {user.role !== 'admin' && (
                                        <button 
                                            className="flex items-center justify-center px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                                            onClick={() => deleteUser(user._id)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full flex flex-col items-center justify-center py-12 text-gray-500">
                            <Users className="w-12 h-12 mb-4 text-gray-300" />
                            <p className="text-lg font-medium">No users found</p>
                            <p className="text-sm">Try adjusting your search criteria</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserManagement;