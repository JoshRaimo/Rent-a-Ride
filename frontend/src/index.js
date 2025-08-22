import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './global.css';
import { initializePerformanceMonitoring } from './utils/performance';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);

// Initialize performance monitoring
initializePerformanceMonitoring();