import { render, screen } from '@testing-library/react';

// Mock react-router-dom to avoid resolver/env issues in tests
jest.mock('react-router-dom', () => {
  const React = require('react');
  return {
    BrowserRouter: ({ children }) => React.createElement(React.Fragment, null, children),
    Routes: ({ children }) => React.createElement(React.Fragment, null, children),
    Route: ({ element }) => element,
    Link: ({ children }) => React.createElement('a', null, children),
    useNavigate: () => () => {},
    useLocation: () => ({ pathname: '/' }),
  };
}, { virtual: true });

// Mock heavy pages to avoid importing axios and other deps during this test
jest.mock('./components/LoginModal', () => () => 'LoginModal');
jest.mock('./components/RegisterModal', () => () => 'RegisterModal');
jest.mock('./pages/HomePage', () => () => 'Home');
jest.mock('./pages/ProfilePage', () => () => 'Profile');
jest.mock('./pages/AdminDashboard', () => () => 'Admin');
jest.mock('./pages/AvailableCars', () => () => 'AvailableCars');
jest.mock('./pages/BookCar', () => () => 'BookCar');
jest.mock('./pages/CarManagement', () => () => 'CarManagement');
jest.mock('./pages/UserManagement', () => () => 'UserManagement');
jest.mock('./pages/BookingManagement', () => () => 'BookingManagement');
jest.mock('./components/ProtectedRoute', () => () => 'ProtectedRoute');

// Mock the AuthModalContext to avoid context issues
jest.mock('./contexts/AuthModalContext', () => ({
  AuthModalProvider: ({ children }) => children,
  useAuthModal: () => ({
    showLoginModal: false,
    showRegisterModal: false,
    openLoginModal: () => {},
    openRegisterModal: () => {},
    closeLoginModal: () => {},
    closeRegisterModal: () => {},
    getPreLoginLocation: () => null,
    clearPreLoginLocation: () => {},
    notifyBookingMade: () => {},
    clearBookingNotification: () => {},
  }),
}));

// Mock toastify to avoid side effects
jest.mock('react-toastify', () => ({ ToastContainer: () => null, toast: { success: () => {} } }));

import App from './App';

test('renders navbar links', () => {
  render(<App />);
  expect(screen.getByAltText(/Rent-a-Ride Logo/i)).toBeInTheDocument();
});


