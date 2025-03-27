import React from 'react';
import { NavLink } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faUsers, faCar, faClipboardList } from '@fortawesome/free-solid-svg-icons';

const AdminSidebar = () => {
    return (
        <div className="admin-sidebar fixed left-0 bg-white shadow-md z-30 w-16" style={{
            top: "var(--navbar-height)",
            height: "calc(100vh - var(--navbar-height))"
        }}>
            <nav className="flex flex-col items-center space-y-4 p-4">
                <NavLink
                    to="/admin-dashboard"
                    className="sidebar-link"
                    activeClassName="active-link"
                >
                    <FontAwesomeIcon icon={faHome} size="2x" />
                </NavLink>
                <NavLink
                    to="/admin-dashboard/users"
                    className="sidebar-link"
                    activeClassName="active-link"
                >
                    <FontAwesomeIcon icon={faUsers} size="2x" />
                </NavLink>
                <NavLink
                    to="/admin-dashboard/cars"
                    className="sidebar-link"
                    activeClassName="active-link"
                >
                    <FontAwesomeIcon icon={faCar} size="2x" />
                </NavLink>
                <NavLink
                    to="/admin-dashboard/bookings"
                    className="sidebar-link"
                    activeClassName="active-link"
                >
                    <FontAwesomeIcon icon={faClipboardList} size="2x" />
                </NavLink>
            </nav>
        </div>
    );
};

export default AdminSidebar;
