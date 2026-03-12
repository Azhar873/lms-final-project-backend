const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');

dotenv.config();

const app = express();

// Middleware
app.use(cors({
    origin: process.env.NODE_ENV === "production"
        ? 'https://your-frontend.vercel.app'
        : 'http://localhost:5173',
    credentials: true,
}));
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));

// Serve static files (optional, for dev only)
if (process.env.NODE_ENV !== "production") {
    app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
}

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/courses', require('./routes/courseRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/enroll', require('./routes/enrollmentRoutes'));

// Health check
app.get('/', (req, res) => {
    res.json({ message: '✅ LMS API is running', status: 'OK' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        message: err.message || 'Internal Server Error',
    });
});

// Lazy DB connection for serverless
let isConnected = false;
const serverlessHandler = async (req, res) => {
    if (!isConnected) {
        await connectDB();
        isConnected = true;
    }
    app(req, res);
};

module.exports = serverlessHandler;

// Only listen locally
if (process.env.NODE_ENV !== "production") {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`🚀 LMS API Server running on http://localhost:${PORT}`);
    });
}