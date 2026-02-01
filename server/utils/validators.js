/* ========================================
   Server Validators
   ======================================== */

/**
 * Validate email format
 */
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate password strength
 * Returns error message or null if valid
 */
function validatePassword(password) {
    if (!password || password.length < 8) {
        return 'Password must be at least 8 characters';
    }

    if (!/[A-Z]/.test(password)) {
        return 'Password must contain at least one uppercase letter';
    }

    if (!/[a-z]/.test(password)) {
        return 'Password must contain at least one lowercase letter';
    }

    if (!/[0-9]/.test(password)) {
        return 'Password must contain at least one number';
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        return 'Password must contain at least one special character';
    }

    return null;
}

/**
 * Validate date format (YYYY-MM-DD)
 */
function validateDate(dateString) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateString)) return false;

    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
}

/**
 * Validate phone number (Indian format)
 */
function validatePhone(phone) {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone);
}

/**
 * Sanitize string input
 */
function sanitizeString(str) {
    if (!str) return '';
    return str
        .trim()
        .replace(/[<>]/g, '')
        .substring(0, 500);
}

/**
 * Validate amount
 */
function validateAmount(amount) {
    const num = parseFloat(amount);
    return !isNaN(num) && num > 0 && num <= 99999999.99;
}

module.exports = {
    validateEmail,
    validatePassword,
    validateDate,
    validatePhone,
    sanitizeString,
    validateAmount
};
