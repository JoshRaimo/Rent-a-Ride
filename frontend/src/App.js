import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage';
import CarListingsPage from './pages/CarListingsPage';

const App = () => {
    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
            <header className="bg-blue-600 text-white py-4 shadow-md">
                <h1 className="text-center text-2xl font-bold">Rent-a-Ride</h1>
            </header>
            <main className="flex-1">
                <Router>
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/cars" element={<CarListingsPage />} />
                    </Routes>
                </Router>
            </main>
            <footer className="bg-gray-800 text-white py-4 text-center">
                <p className="text-sm">© 2024 Rent-a-Ride. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default App;