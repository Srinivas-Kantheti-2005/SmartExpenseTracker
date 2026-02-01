/* ========================================
   Frontend Date Utilities
   ======================================== */

/**
 * Format date for display
 */
function formatDate(dateString, format = 'short') {
    const date = new Date(dateString);

    switch (format) {
        case 'short':
            return date.toLocaleDateString('en-IN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        case 'long':
            return date.toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
        case 'relative':
            return getRelativeTime(date);
        default:
            return date.toLocaleDateString();
    }
}

/**
 * Get relative time (e.g., "2 days ago")
 */
function getRelativeTime(date) {
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
        return days === 1 ? 'Yesterday' : `${days} days ago`;
    }
    if (hours > 0) {
        return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
    }
    if (minutes > 0) {
        return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`;
    }
    return 'Just now';
}

/**
 * Get current date in YYYY-MM-DD format
 */
function getCurrentDate() {
    return new Date().toISOString().split('T')[0];
}

/**
 * Get first day of month
 */
function getMonthStart(date = new Date()) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * Get last day of month
 */
function getMonthEnd(date = new Date()) {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

/**
 * Get month name
 */
function getMonthName(monthIndex, format = 'long') {
    const date = new Date(2000, monthIndex);
    return date.toLocaleString('default', { month: format });
}

/**
 * Check if date is today
 */
function isToday(date) {
    const today = new Date();
    const d = new Date(date);
    return d.toDateString() === today.toDateString();
}

/**
 * Update displayed date in UI
 */
function updateDateDisplay() {
    const dateElements = document.querySelectorAll('[data-current-date]');
    const today = new Date();

    dateElements.forEach(el => {
        const format = el.dataset.currentDate || 'long';
        el.textContent = formatDate(today, format);
    });
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        formatDate,
        getRelativeTime,
        getCurrentDate,
        getMonthStart,
        getMonthEnd,
        getMonthName,
        isToday,
        updateDateDisplay
    };
}
