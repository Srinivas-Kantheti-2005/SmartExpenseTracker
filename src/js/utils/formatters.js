/* ========================================
   Formatter Utility Functions
   ======================================== */

import { CURRENCY } from '../config/constants.js';

// Format amount as currency
export function formatCurrency(amount, options = {}) {
    const {
        symbol = CURRENCY.symbol,
        locale = CURRENCY.locale,
        decimals = 0
    } = options;

    const formatted = new Intl.NumberFormat(locale, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(Math.abs(amount));

    return `${symbol}${formatted}`;
}

// Format date for display
export function formatDate(dateString, options = {}) {
    const {
        format = 'medium' // 'short', 'medium', 'long', 'full'
    } = options;

    const date = new Date(dateString);

    const formats = {
        short: { day: '2-digit', month: '2-digit', year: '2-digit' },
        medium: { day: 'numeric', month: 'short', year: 'numeric' },
        long: { day: 'numeric', month: 'long', year: 'numeric' },
        full: { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
    };

    return date.toLocaleDateString('en-IN', formats[format] || formats.medium);
}

// Get relative time (e.g., "2 hours ago")
export function getRelativeTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);

    if (months > 0) return `${months} month${months > 1 ? 's' : ''} ago`;
    if (weeks > 0) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
}

// Get today's date in YYYY-MM-DD format
export function getTodayDate() {
    return new Date().toISOString().split('T')[0];
}

// Get month name from date
export function getMonthName(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long' });
}

// Format percentage
export function formatPercentage(value, decimals = 1) {
    return `${value.toFixed(decimals)}%`;
}

// Format number with commas
export function formatNumber(number) {
    return new Intl.NumberFormat('en-IN').format(number);
}

// Truncate text with ellipsis
export function truncateText(text, maxLength = 50) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// Capitalize first letter
export function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// Title case
export function toTitleCase(str) {
    if (!str) return '';
    return str.split(' ').map(capitalize).join(' ');
}
