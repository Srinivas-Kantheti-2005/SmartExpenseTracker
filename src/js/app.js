/* ========================================
   Smart Expense Tracker - Main Application
   ======================================== */

// Import utilities
import { getTheme, saveTheme, getUser } from './utils/storage.js';

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initNavigation();
    checkAuth();
});

// Initialize theme from saved preference
function initTheme() {
    const savedTheme = getTheme();
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
    }

    // Listen for theme toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
}

// Toggle dark/light theme
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    saveTheme(isDark ? 'dark' : 'light');
}

// Initialize navigation active states
function initNavigation() {
    const currentPath = window.location.pathname;
    const navItems = document.querySelectorAll('.nav-item');

    navItems.forEach(item => {
        const href = item.getAttribute('href');
        if (href && currentPath.includes(href.replace('../', '').replace('./', ''))) {
            item.classList.add('active');
        }
    });
}

// Check authentication state
function checkAuth() {
    const user = getUser();
    const publicPages = ['/auth/login.html', '/auth/register.html', '/login.html', '/register.html'];
    const currentPath = window.location.pathname;

    const isPublicPage = publicPages.some(page => currentPath.includes(page));

    if (!user && !isPublicPage) {
        // Redirect to login if not authenticated
        window.location.href = '../auth/login.html';
    }
}

// Export for use in other modules
export { toggleTheme, initTheme };
