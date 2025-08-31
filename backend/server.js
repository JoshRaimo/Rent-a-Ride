// Import required modules
const mongoose = require('mongoose');
const path = require('path');
const express = require('express');
const http = require('http');
require('dotenv').config();

// Import the express app and socket server
const app = require('./app');
const SocketServer = require('./socket/socketServer');
const PORT = process.env.PORT || 5000;

// Note: Routes and middleware are mounted in app.js

// Create HTTP server
const server = http.createServer(app);

// Initialize WebSocket server
const socketServer = new SocketServer(server);

// Connect WebSocket server to chat controller
app.setSocketServer(socketServer);

// Connect to MongoDB
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log('MongoDB connected successfully');
        server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
        console.log('WebSocket server initialized');
    })
    .catch((err) => {
        console.error('MongoDB connection error:', err.message);
        process.exit(1);
    });

// Serve React frontend **after API routes**
const frontendPath = path.join(__dirname, '../frontend/build');
app.use(express.static(frontendPath));

app.get('*', (req, res) => {
    if (req.originalUrl.startsWith('/api')) {
        return res.status(404).json({ message: 'API route not found' });
    }
    res.sendFile(path.join(frontendPath, 'index.html'), (err) => {
        if (err) {
            res.status(500).send('An error occurred while serving the frontend.');
        }
    });
});

// Graceful shutdown
process.on('SIGINT', async () => {
    try {
        await mongoose.connection.close();
        console.log('MongoDB connection closed');
        process.exit(0);
    } catch (err) {
        console.error('Error during shutdown:', err.message);
        process.exit(1);
    }
});
