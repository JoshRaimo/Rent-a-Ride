// Express app setup extracted for testing
const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');

// Lightweight performance middleware (no external dependencies)
const {
  performanceMonitor,
  memoryMonitor,
  requestCounter,
  errorMonitor,
  getPerformanceStats
} = require('./middleware/performance');

// Simple caching middleware
const {
  cacheAvailableCars,
  cacheCarDetails,
  cacheStats,
  cacheYearRange,
  cachePriceRange,
  cacheRoutes
} = require('./middleware/simpleCache');

// Compression middleware
const compression = require('./middleware/compression');

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
const chatRoutes = require('./routes/chatRoutes');

// Chat controller for WebSocket integration
const { setSocketServer } = require('./controllers/chatController');

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

// Performance middleware (apply early)
app.use(compression);
app.use(performanceMonitor);
app.use(memoryMonitor);
app.use(requestCounter);
app.use(errorMonitor);

// JSON parser
app.use(express.json({ limit: '10mb' })); // Limit JSON payload size

// Health check route with performance info
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Backend is running!',
    memory: req.memoryInfo || 'Not available',
    timestamp: new Date().toISOString()
  });
});

// Performance stats endpoint
app.get('/api/performance', getPerformanceStats);

// API Routes with caching
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/carapi', carApiRoutes);
app.use('/api/cars', carRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/jwt', jwtRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/profile-images', profileImageRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/stats', cacheStats, statsRoutes); // Cache stats for 1 hour
app.use('/api/chat', chatRoutes);

// WebSocket integration function (will be called from server.js)
app.setSocketServer = setSocketServer;

// Cache management routes
const cacheRouter = express.Router();
cacheRoutes(cacheRouter);
app.use('/api/cache', cacheRouter);

// Error handling middleware
app.use(errorHandler);

module.exports = app;


