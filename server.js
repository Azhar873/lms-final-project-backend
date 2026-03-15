// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();

const app = express();

// Middleware
app.use(cors({
    origin: [
        'http://localhost:5173',
        'https://lms-final-project-frontend.vercel.app',
        process.env.CLIENT_URL
    ].filter(Boolean),
    credentials: true
}));
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/courses', require('./routes/courseRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/enroll', require('./routes/enrollmentRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));

// Health check
app.get('/', (req, res) => res.json({ message: '✅ LMS API is running', status: 'OK' }));

// Vercel Serverless Handler
const handler = async (req, res) => {
    try {
        await connectDB();
        app(req, res);
    } catch (err) {
        console.error('Serverless Handler Error:', err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

module.exports = handler;

// Only listen locally for dev
if (process.env.NODE_ENV !== "production") {
    const PORT = process.env.PORT || 5000;
    connectDB().then(() => {
        app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
    }).catch(err => {
        console.error('Failed to connect to DB, server not started:', err);
    });
}