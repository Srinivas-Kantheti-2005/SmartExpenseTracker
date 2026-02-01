/* ========================================
   Smart Expense Tracker - Server Entry Point
   ======================================== */

const express = require('express');
const cors = require('cors');
const path = require('path');

// Config
const { PORT, NODE_ENV } = require('./config/env');
const { initDatabase } = require('./config/db');

// Middleware
const { errorHandler } = require('./middleware/error.middleware');

// Routes
const authRoutes = require('./routes/auth.routes');
const transactionsRoutes = require('./routes/transactions.routes');
const categoriesRoutes = require('./routes/categories.routes');
const budgetsRoutes = require('./routes/budgets.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const networthRoutes = require('./routes/networth.routes');

// Initialize Express app
const app = express();

// ==========================================
// Middleware
// ==========================================

// Parse JSON bodies
app.use(express.json());

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Enable CORS
app.use(cors({
    origin: NODE_ENV === 'production'
        ? 'https://smartexpense.com'
        : 'http://localhost:3000',
    credentials: true
}));

// Serve static files from frontend
app.use(express.static(path.join(__dirname, '../src')));

// ==========================================
// API Routes
// ==========================================

app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/budgets', budgetsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/networth', networthRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: NODE_ENV
    });
});

// ==========================================
// Serve Frontend (SPA fallback)
// ==========================================

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../src/pages/index.html'));
});

// ==========================================
// Error Handling
// ==========================================

app.use(errorHandler);

// ==========================================
// Start Server
// ==========================================

const startServer = async () => {
    try {
        // Initialize database connection
        await initDatabase();
        console.log('✅ Database connected');

        // Start listening
        app.listen(PORT, () => {
            console.log(`
🚀 Smart Expense Tracker Server
================================
📍 URL: http://localhost:${PORT}
🌍 Environment: ${NODE_ENV}
📊 API: http://localhost:${PORT}/api
================================
            `);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

startServer();

module.exports = app;
