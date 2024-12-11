import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage';
import CarListingsPage from './pages/CarListingsPage';

const App = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/cars" element={<CarListingsPage />} />
            </Routes>
        </Router>
    );
};

export default App;