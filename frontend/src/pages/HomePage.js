import React from 'react';
import { Link } from 'react-router-dom';

const HomePage = () => {
    return (
        <div style={{ textAlign: 'center', padding: '20px' }}>
            <h1>Welcome to Rent-a-Ride</h1>
            <p>Your go-to platform for renting cars with ease and convenience.</p>
            
            <div style={{ marginTop: '20px' }}>
                <Link to="/cars" style={{ textDecoration: 'none', color: '#fff' }}>
                    <button
                        style={{
                            padding: '10px 20px',
                            backgroundColor: '#007BFF',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '5px',
                            fontSize: '16px',
                            cursor: 'pointer',
                        }}
                    >
                        Browse Cars
                    </button>
                </Link>
            </div>
        </div>
    );
};

export default HomePage;