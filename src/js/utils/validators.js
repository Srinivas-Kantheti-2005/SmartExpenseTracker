/* ========================================
   Validator Utility Functions
   ======================================== */

// Validate email format
export function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Validate password strength
export function isValidPassword(password) {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return passwordRegex.test(password);
}

// Get password strength
export function getPasswordStrength(password) {
    let strength = 0;

    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;

    if (strength <= 2) return { level: 'weak', label: 'Weak', color: '#ef4444' };
    if (strength <= 4) return { level: 'medium', label: 'Medium', color: '#f59e0b' };
    return { level: 'strong', label: 'Strong', color: '#10b981' };
}

// Validate phone number (Indian format)
export function isValidPhone(phone) {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
}

// Validate amount
export function isValidAmount(amount) {
    const num = parseFloat(amount);
    return !isNaN(num) && num > 0 && isFinite(num);
}

// Validate date
export function isValidDate(dateString) {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
}

// Validate date is not in future
export function isNotFutureDate(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return date <= today;
}

// Validate required field
export function isRequired(value) {
    if (typeof value === 'string') {
        return value.trim().length > 0;
    }
    return value !== null && value !== undefined;
}

// Validate minimum length
export function hasMinLength(value, minLength) {
    return value && value.length >= minLength;
}

// Validate maximum length
export function hasMaxLength(value, maxLength) {
    return !value || value.length <= maxLength;
}

// Validate form field
export function validateField(value, rules = {}) {
    const errors = [];

    if (rules.required && !isRequired(value)) {
        errors.push('This field is required');
    }

    if (rules.email && value && !isValidEmail(value)) {
        errors.push('Please enter a valid email');
    }

    if (rules.password && value && !isValidPassword(value)) {
        errors.push('Password must be at least 8 characters with uppercase, lowercase, and number');
    }

    if (rules.minLength && value && !hasMinLength(value, rules.minLength)) {
        errors.push(`Must be at least ${rules.minLength} characters`);
    }

    if (rules.maxLength && value && !hasMaxLength(value, rules.maxLength)) {
        errors.push(`Must not exceed ${rules.maxLength} characters`);
    }

    if (rules.amount && value && !isValidAmount(value)) {
        errors.push('Please enter a valid amount');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}
