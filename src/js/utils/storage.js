/* ========================================
   Storage Utility Functions
   ======================================== */

import { STORAGE_KEYS } from '../config/constants.js';

// Get item from localStorage with JSON parsing
export function getItem(key) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    } catch (error) {
        console.error(`Error reading ${key} from localStorage:`, error);
        return null;
    }
}

// Set item in localStorage with JSON stringification
export function setItem(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        console.error(`Error writing ${key} to localStorage:`, error);
        return false;
    }
}

// Remove item from localStorage
export function removeItem(key) {
    try {
        localStorage.removeItem(key);
        return true;
    } catch (error) {
        console.error(`Error removing ${key} from localStorage:`, error);
        return false;
    }
}

// Clear all app data from localStorage
export function clearAllData() {
    Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
    });
}

// Transactions
export function getTransactions() {
    return getItem(STORAGE_KEYS.TRANSACTIONS) || [];
}

export function saveTransactions(transactions) {
    return setItem(STORAGE_KEYS.TRANSACTIONS, transactions);
}

export function addTransaction(transaction) {
    const transactions = getTransactions();
    transaction.id = Date.now();
    transactions.unshift(transaction);
    return saveTransactions(transactions);
}

export function updateTransaction(id, updatedData) {
    const transactions = getTransactions();
    const index = transactions.findIndex(t => t.id === id);
    if (index !== -1) {
        transactions[index] = { ...transactions[index], ...updatedData };
        return saveTransactions(transactions);
    }
    return false;
}

export function deleteTransaction(id) {
    const transactions = getTransactions();
    const filtered = transactions.filter(t => t.id !== id);
    return saveTransactions(filtered);
}

// User
export function getUser() {
    return getItem(STORAGE_KEYS.USER);
}

export function saveUser(user) {
    return setItem(STORAGE_KEYS.USER, user);
}

export function clearUser() {
    return removeItem(STORAGE_KEYS.USER);
}

// Settings
export function getSettings() {
    return getItem(STORAGE_KEYS.SETTINGS) || {
        currency: '₹',
        theme: 'light',
        notifications: true
    };
}

export function saveSettings(settings) {
    return setItem(STORAGE_KEYS.SETTINGS, settings);
}

// Theme
export function getTheme() {
    return localStorage.getItem(STORAGE_KEYS.THEME) || 'light';
}

export function saveTheme(theme) {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
}
