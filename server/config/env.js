/* ========================================
   Environment Configuration
   ======================================== */

require('dotenv').config();

module.exports = {
    // Server
    PORT: process.env.PORT || 5001,
    NODE_ENV: process.env.NODE_ENV || 'development',

    // JWT
    JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-key-change-in-production',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

    // Database
    DB_PATH: process.env.DB_PATH || './database/expense_tracker.db',

    // Security
    BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS) || 12,

    // Pagination
    DEFAULT_PAGE_SIZE: 100,
    MAX_PAGE_SIZE: 1000
};
