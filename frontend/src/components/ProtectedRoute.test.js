import React from 'react';
import { render, screen } from '@testing-library/react';
// Mock react-router-dom to keep tests isolated and avoid env-specific resolver issues
jest.mock('react-router-dom', () => {
  const React = require('react');
  return {
    MemoryRouter: ({ children }) => React.createElement(React.Fragment, null, children),
    Routes: ({ children }) => React.createElement(React.Fragment, null, children),
    Route: ({ element }) => element,
    Navigate: ({ to }) => React.createElement('div', null, `Navigate:${to}`),
    Outlet: ({ children }) => React.createElement('div', null, children ?? 'Outlet'),
  };
}, { virtual: true });
import ProtectedRoute from './ProtectedRoute';

jest.mock('../utils/auth', () => ({
  getToken: jest.fn(),
  isTokenExpired: jest.fn(),
}));

const { getToken, isTokenExpired } = require('../utils/auth');

function renderProtectedRoute() {
  return render(<ProtectedRoute />);
}

test('redirects to /login when no token', () => {
  getToken.mockReturnValue(null);
  isTokenExpired.mockReturnValue(true);
  renderProtectedRoute();
  expect(screen.getByText('Navigate:/login')).toBeInTheDocument();
});

test('renders child route when token is valid', () => {
  getToken.mockReturnValue('token');
  isTokenExpired.mockReturnValue(false);
  renderProtectedRoute();
  expect(screen.getByText('Outlet')).toBeInTheDocument();
});


