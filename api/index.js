// ============================================
// Vercel Serverless Function Handler
// Entry point for /api/* routes
// ============================================

const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');

const app = express();

// ========== Middleware ==========
app.use(cors({
    origin: true,
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ========== Routes ==========
app.use('/api/auth', authRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'NextGate API is running',
        timestamp: new Date().toISOString()
    });
});

// Export for Vercel
module.exports = app;
