/* ========================================
   Application Constants
   ======================================== */

export const APP_NAME = 'Smart Expense Tracker';
export const APP_VERSION = '1.0.0';

// Local Storage Keys
export const STORAGE_KEYS = {
    USER: 'user',
    TRANSACTIONS: 'transactions',
    TRANSACTIONS_VERSION: 'transactionsVersion',
    BUDGETS: 'budgets',
    SETTINGS: 'settings',
    THEME: 'theme'
};

// Currency Configuration
export const CURRENCY = {
    symbol: '₹',
    code: 'INR',
    locale: 'en-IN'
};

// Date Formats
export const DATE_FORMATS = {
    display: 'DD MMM YYYY',
    input: 'YYYY-MM-DD',
    short: 'DD/MM/YY'
};

// Pagination
export const PAGINATION = {
    defaultPageSize: 10,
    pageSizeOptions: [10, 25, 50, 100]
};

// Chart Colors
export const CHART_COLORS = {
    primary: '#667eea',
    secondary: '#764ba2',
    success: '#10b981',
    danger: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
    palette: [
        '#667eea', '#764ba2', '#f093fb', '#f5576c',
        '#4facfe', '#00f2fe', '#43e97b', '#38f9d7',
        '#fa709a', '#fee140', '#a8edea', '#fed6e3'
    ]
};

// Animation Durations (ms)
export const ANIMATION = {
    fast: 150,
    base: 300,
    slow: 500
};
