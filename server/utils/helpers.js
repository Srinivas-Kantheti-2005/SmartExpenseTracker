/* ========================================
   Server Helpers
   ======================================== */

const crypto = require('crypto');

/**
 * Generate UUID v4
 */
function generateUUID() {
    return crypto.randomUUID();
}

/**
 * Generate random token
 */
function generateToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
}

/**
 * Format currency
 */
function formatCurrency(amount, currency = 'INR', symbol = '₹') {
    return `${symbol} ${parseFloat(amount).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
}

/**
 * Format date for display
 */
function formatDate(dateString, format = 'DD/MM/YYYY') {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    switch (format) {
        case 'DD/MM/YYYY':
            return `${day}/${month}/${year}`;
        case 'MM/DD/YYYY':
            return `${month}/${day}/${year}`;
        case 'YYYY-MM-DD':
            return `${year}-${month}-${day}`;
        default:
            return `${day}/${month}/${year}`;
    }
}

/**
 * Get current month and year
 */
function getCurrentPeriod() {
    const now = new Date();
    return {
        month: now.getMonth() + 1,
        year: now.getFullYear()
    };
}

/**
 * Calculate percentage
 */
function calculatePercentage(part, total) {
    if (total === 0) return 0;
    return Math.round((part / total) * 100 * 10) / 10;
}

/**
 * Paginate array
 */
function paginate(array, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    return {
        data: array.slice(offset, offset + limit),
        pagination: {
            page,
            limit,
            total: array.length,
            pages: Math.ceil(array.length / limit)
        }
    };
}

/**
 * Sleep utility for async operations
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
    generateUUID,
    generateToken,
    formatCurrency,
    formatDate,
    getCurrentPeriod,
    calculatePercentage,
    paginate,
    sleep
};
