/**
 * Shared Header Utilities & Global Config
 * Handles:
 * 1. Global API Configuration & Auth Headers
 * 2. Displaying logged-in user name and avatar in the header.
 */

// Global Configuration
window.API_BASE_URL = 'http://localhost:5001/api';

window.getAuthHeaders = function () {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

document.addEventListener('DOMContentLoaded', function () {
    renderHeader(); // 1. Render Structure
    updateUserProfile(); // 2. Update Dynamic Data
});

/**
 * Dynamically injects the global header structure
 */
function renderHeader() {
    const headerEl = document.querySelector('header.top-header');
    if (!headerEl) return;

    headerEl.innerHTML = `
        <div class="header-card card-logo">
            <img src="../../assets/images/logo.png" alt="Logo">
            <h3>Smart Expense Tracker</h3>
        </div>
        <div class="header-card card-date" id="header-calendar-trigger">
            <span class="calendar-icon">🗓️</span>
            <div class="date-info">
                <span class="day"></span>
                <span class="date-no"></span>
                <span class="month"></span>
                <span class="year"></span>
            </div>
        </div>
        <div class="header-card card-user">
            <span class="user-name">User Name</span>
            <div class="user-avatar">
                <span class="avatar"></span>
            </div>
        </div>
    `;

    // Initialize calendar immediately if date-update.js is already loaded
    if (typeof initHeaderCalendar === 'function') {
        initHeaderCalendar();
    }
}

function updateUserProfile() {
    // Get user from localStorage (cached session)
    const userStr = localStorage.getItem('user');
    if (!userStr) return;

    const user = JSON.parse(userStr);

    // Update Name
    const nameEl = document.querySelector('.user-name');
    if (nameEl) nameEl.textContent = user.name;

    // Update Avatar
    const avatarEl = document.querySelector('.user-avatar .avatar');
    if (avatarEl) {
        avatarEl.innerHTML = ''; // Clear previous content

        if (user.avatar) {
            // Check if avatar is an image URL or base64 string
            if (user.avatar.startsWith('http') || user.avatar.startsWith('data:image')) {
                // Render as image
                const img = document.createElement('img');
                img.src = user.avatar;
                img.alt = 'Avatar';
                img.style.width = '100%';
                img.style.height = '100%';
                img.style.borderRadius = '50%';
                img.style.objectFit = 'cover';
                avatarEl.appendChild(img);
            } else {
                // Render as emoji/text
                avatarEl.textContent = user.avatar;
                avatarEl.style.fontSize = "24px";
            }
        } else {
            // Default emoji
            avatarEl.textContent = "👨‍💻";
            avatarEl.style.fontSize = "24px";
        }

        // Common styles
        avatarEl.style.display = "flex";
        avatarEl.style.alignItems = "center";
        avatarEl.style.justifyContent = "center";
        avatarEl.style.height = "100%";
        avatarEl.style.width = "100%";
    }
}

