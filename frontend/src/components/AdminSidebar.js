import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Car, Calendar } from 'lucide-react';

const AdminSidebar = () => {
    return (
        <div className="admin-sidebar fixed left-0 bg-white shadow-lg border-r border-gray-200 z-30 w-20" style={{
            top: "var(--navbar-height)",
            height: "calc(100vh - var(--navbar-height))"
        }}>
            <nav className="flex flex-col items-center space-y-2 p-4">
                <NavLink
                    to="/admin-dashboard"
                    end
                    className={({ isActive }) =>
                        `group relative flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 ${
                            isActive 
                                ? 'bg-blue-100 text-blue-600 shadow-md' 
                                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                        }`
                    }
                >
                    <LayoutDashboard className="w-6 h-6" />
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                        Dashboard
                    </div>
                </NavLink>
                
                <NavLink
                    to="/admin-dashboard/users"
                    className={({ isActive }) =>
                        `group relative flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 ${
                            isActive 
                                ? 'bg-blue-100 text-blue-600 shadow-md' 
                                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                        }`
                    }
                >
                    <Users className="w-6 h-6" />
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                        Users
                    </div>
                </NavLink>
                
                <NavLink
                    to="/admin-dashboard/cars"
                    className={({ isActive }) =>
                        `group relative flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 ${
                            isActive 
                                ? 'bg-blue-100 text-blue-600 shadow-md' 
                                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                        }`
                    }
                >
                    <Car className="w-6 h-6" />
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                        Cars
                    </div>
                </NavLink>
                
                <NavLink
                    to="/admin-dashboard/bookings"
                    className={({ isActive }) =>
                        `group relative flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 ${
                            isActive 
                                ? 'bg-blue-100 text-blue-600 shadow-md' 
                                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                        }`
                    }
                >
                    <Calendar className="w-6 h-6" />
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                        Bookings
                    </div>
                </NavLink>
            </nav>
        </div>
    );
};

export default AdminSidebar;
