/* ========================================
   Environment Configuration
   ======================================== */

require('dotenv').config();

module.exports = {
    // Server
    PORT: process.env.PORT || 3000,
    NODE_ENV: process.env.NODE_ENV || 'development',

    // JWT
    JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-key-change-in-production',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

    // Database
    DB_PATH: process.env.DB_PATH || './database/expense_tracker.db',

    // Security
    BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS) || 12,

    // Rate Limiting
    RATE_LIMIT_WINDOW: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutes
    RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX) || 100,

    // Pagination
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100
};
