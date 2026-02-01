/**
 * Shared Header Utilities
 * Handles:
 * 1. Displaying logged-in user name and avatar in the header.
 * 2. Handling Logout functionality.
 */

document.addEventListener('DOMContentLoaded', function () {
    updateUserProfile();
    attachLogoutHandler();
});

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

function attachLogoutHandler() {
    const logoutBtn = document.querySelector(".logout-item");

    if (logoutBtn) {
        // Remove any existing listeners by cloning (optional, but safer if multiple scripts attach)
        // For now, we assume this is the primary handler.

        logoutBtn.addEventListener("click", function (event) {
            event.preventDefault();

            const confirmLogout = confirm("Are you sure you want to logout?");
            if (confirmLogout) {
                // Visual feedback
                document.body.style.transition = "opacity 0.5s ease";
                document.body.style.opacity = "0";

                // Clear session
                localStorage.removeItem('user');
                localStorage.removeItem('isLoggedIn');

                // Redirect to login
                setTimeout(() => {
                    // Navigate to login.html relative to current page location
                    // We assume we are in src/pages/[feature]/index.html
                    // So ../auth/login.html is correct.
                    window.location.href = "../auth/login.html";
                }, 500);
            }
        });
    }
}
