const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/authRoutes');
const carRoutes = require('./routes/carRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check route
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Backend is running!' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/cars', carRoutes);
app.use('/api/bookings', bookingRoutes);

// Serve React frontend
const frontendPath = path.join(__dirname, './frontend');
app.use(express.static(frontendPath));

app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'), (err) => {
        if (err) {
            console.error('Error serving frontend:', err.message);
            res.status(500).send('An error occurred while serving the frontend.');
        }
    });
});

// Error handling middleware
app.use(errorHandler);

// Connect to MongoDB
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log('MongoDB connected successfully');
        app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    })
    .catch((err) => {
        console.error('MongoDB connection error:', err.message);
        process.exit(1); // Exit process on connection failure
    });

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('Shutting down gracefully...');
    try {
        await mongoose.connection.close();
        console.log('MongoDB connection closed');
        process.exit(0);
    } catch (err) {
        console.error('Error during shutdown:', err.message);
        process.exit(1);
    }
});