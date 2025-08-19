// Express app setup extracted for testing
const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');

// Routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const carApiRoutes = require('./routes/carApiRoutes');
const carRoutes = require('./routes/carRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const jwtRoutes = require('./routes/jwtRoutes');
const imageRoutes = require('./routes/imageRoutes');
const profileImageRoutes = require('./routes/profileImageRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const statsRoutes = require('./routes/statsRoutes');

const app = express();

// CORS configuration: Allow both local and production frontend URLs
const allowedOrigins = [
  'http://localhost:3000',
  'https://rent-a-ride-mfvw.onrender.com',
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

// JSON parser
app.use(express.json());

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Backend is running!' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/carapi', carApiRoutes);
app.use('/api/cars', carRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/jwt', jwtRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/profile-images', profileImageRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/stats', statsRoutes);

// Error handling middleware
app.use(errorHandler);

module.exports = app;


