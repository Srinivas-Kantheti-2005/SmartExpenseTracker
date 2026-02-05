/* ========================================
   Helper Utilities
   ======================================== */

const crypto = require('crypto');

/**
 * Generate UUID v4
 */
function generateUUID() {
    return crypto.randomUUID();
}

/**
 * Format date to YYYY-MM-DD
 */
function formatDate(date) {
    return new Date(date).toISOString().split('T')[0];
}

/**
 * Sanitize object by removing undefined/null values
 */
function sanitize(obj) {
    return Object.fromEntries(
        Object.entries(obj).filter(([_, v]) => v != null)
    );
}

module.exports = {
    generateUUID,
    formatDate,
    sanitize
};
