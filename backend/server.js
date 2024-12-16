// Import required modules
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes'); // New User Routes
const carRoutes = require('./routes/carRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware to handle CORS
app.use(
    cors({
        origin: process.env.CLIENT_URL || '*', // Allows CORS for the specified client URL or all origins
    })
);

// Middleware to parse incoming JSON requests
app.use(express.json());

// Log all incoming requests for debugging
app.use((req, res, next) => {
    console.log(`[${req.method}] ${req.url}`);
    if (Object.keys(req.body).length) {
        console.log('Request Body:', req.body); // Log body only if it exists
    }
    next();
});

// Health check route
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Backend is running!' });
});

// API Routes
app.use('/api/auth', authRoutes); // Authentication Routes
app.use('/api/users', userRoutes); // User Management Routes
app.use('/api/cars', carRoutes); // Car Management Routes
app.use('/api/bookings', bookingRoutes); // Booking Routes

// Serve React frontend
const frontendPath = path.join(__dirname, '../frontend/build');
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
    .connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
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