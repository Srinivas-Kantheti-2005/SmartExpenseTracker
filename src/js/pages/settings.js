// Settings JavaScript - Handles persistence across pages & Database Sync
const API_URL = 'http://localhost:3004/users';
let currentUser = null;

document.addEventListener('DOMContentLoaded', async function () {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
        // Allow page-specific scripts to handle auth/redirects
        return;
    }
    currentUser = JSON.parse(userStr);

    await syncSettingsFromDB();
    initSettingsPage();
});

async function syncSettingsFromDB() {
    try {
        const response = await fetch(`${API_URL}/${currentUser.id}`);
        if (!response.ok) throw new Error('Failed to fetch user settings');

        const userData = await response.json();

        // If user has settings in DB, update localStorage
        if (userData.settings) {
            localStorage.setItem('appSettings', JSON.stringify(userData.settings));
            loadSettings(); // Apply them immediately
        }
    } catch (error) {
        console.error('Error syncing settings:', error);
    }
}

function loadSettings() {
    const settings = JSON.parse(localStorage.getItem('appSettings') || '{}');

    // Apply dark mode
    if (settings.darkMode) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }

    // Update currency symbols across the page
    updateCurrencyDisplay(settings.currency || 'inr');
}

function initSettingsPage() {
    const currencySelect = document.querySelector('.setting-select');
    const dateFormatSelect = document.querySelectorAll('.setting-select')[1];
    const darkModeToggle = document.getElementById('darkMode');

    // Load current settings
    const settings = JSON.parse(localStorage.getItem('appSettings') || '{}');

    // Set currency
    if (currencySelect && settings.currency) {
        currencySelect.value = settings.currency;
    }

    // Set date format
    if (dateFormatSelect && settings.dateFormat) {
        dateFormatSelect.value = settings.dateFormat;
    }

    // Set dark mode
    if (darkModeToggle) {
        darkModeToggle.checked = settings.darkMode || false;
    }

    // Currency change handler
    if (currencySelect) {
        currencySelect.addEventListener('change', function () {
            updateAndSave('currency', this.value);
            showToast('Currency updated successfully!');
        });
    }

    // Date format change handler
    if (dateFormatSelect) {
        dateFormatSelect.addEventListener('change', function () {
            updateAndSave('dateFormat', this.value);
            showToast('Date format updated successfully!');
        });
    }

    // Dark mode toggle handler
    if (darkModeToggle) {
        darkModeToggle.addEventListener('change', function () {
            updateAndSave('darkMode', this.checked);
            document.body.classList.toggle('dark-mode', this.checked);
            showToast(this.checked ? 'Dark mode enabled!' : 'Dark mode disabled!');
        });
    }

    // Email notifications handler
    const emailToggle = document.getElementById('emailNotif');
    if (emailToggle) {
        emailToggle.checked = settings.emailNotifications !== false;
        emailToggle.addEventListener('change', function () {
            updateAndSave('emailNotifications', this.checked);
            showToast('Email notification settings updated!');
        });
    }

    // Budget alerts handler
    const budgetToggle = document.getElementById('budgetAlerts');
    if (budgetToggle) {
        budgetToggle.checked = settings.budgetAlerts !== false;
        budgetToggle.addEventListener('change', function () {
            updateAndSave('budgetAlerts', this.checked);
            showToast('Budget alert settings updated!');
        });
    }

    // Bill reminders handler
    const billToggle = document.getElementById('billReminders');
    if (billToggle) {
        billToggle.checked = settings.billReminders !== false;
        billToggle.addEventListener('change', function () {
            updateAndSave('billReminders', this.checked);
            showToast('Bill reminder settings updated!');
        });
    }

    // Two-factor handler
    const twoFactorToggle = document.getElementById('twoFactor');
    if (twoFactorToggle) {
        twoFactorToggle.checked = settings.twoFactor || false;
        twoFactorToggle.addEventListener('change', function () {
            updateAndSave('twoFactor', this.checked);
            showToast(this.checked ? 'Two-factor authentication enabled!' : 'Two-factor authentication disabled!');
        });
    }
}

async function updateAndSave(key, value) {
    // 1. Update LocalStorage (for immediate UI responsiveness)
    const settings = JSON.parse(localStorage.getItem('appSettings') || '{}');
    settings[key] = value;
    localStorage.setItem('appSettings', JSON.stringify(settings));

    // 2. Update UI if needed
    if (key === 'currency') updateCurrencyDisplay(value);

    // 3. Sync to Database
    try {
        await fetch(`${API_URL}/${currentUser.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ settings: settings })
        });
    } catch (error) {
        console.error('Failed to save settings to DB:', error);
        showToast('⚠ Failed to save to server (Local change only)');
    }
}

function updateCurrencyDisplay(currency) {
    const symbols = {
        inr: '₹',
        usd: '$',
        eur: '€',
        gbp: '£'
    };

    const symbol = symbols[currency] || '₹';

    // Update all currency displays on the page
    document.querySelectorAll('.summary-cards p, .stat-value, .category-amount').forEach(el => {
        let text = el.textContent;
        // Simple regex replace for existing symbols
        if (text.includes('₹')) el.textContent = text.replace('₹', symbol);
        else if (text.includes('$')) el.textContent = text.replace('$', symbol);
        else if (text.includes('€')) el.textContent = text.replace('€', symbol);
        else if (text.includes('£')) el.textContent = text.replace('£', symbol);
        // Fallback if no symbol found but known it's a currency field
        else if (!isNaN(parseFloat(text))) el.textContent = `${symbol} ${text}`;
    });
}

function showToast(message) {
    // Remove existing toast
    const existingToast = document.querySelector('.toast');
    if (existingToast) existingToast.remove();

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);

    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Export for other pages
window.loadSettings = loadSettings;
window.formatCurrency = function (amount) {
    const settings = JSON.parse(localStorage.getItem('appSettings') || '{}');
    const currency = settings.currency || 'inr';

    const symbols = {
        inr: '₹',
        usd: '$',
        eur: '€',
        gbp: '£'
    };

    return `${symbols[currency] || '₹'} ${amount.toLocaleString('en-IN')}`;
};
