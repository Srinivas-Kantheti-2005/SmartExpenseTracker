/**
 * Sidebar Utilities
 * Handles dynamic rendering of the sidebar to ensure consistency across all pages.
 */

document.addEventListener('DOMContentLoaded', () => {
    renderSidebar();
    attachLogoutHandler(); // Attach logout handler after rendering
});

function renderSidebar() {
    const sidebarContainer = document.querySelector('aside.sidebar');
    if (!sidebarContainer) return;

    // Standard Sidebar HTML
    const sidebarHTML = `
        <nav class="sidebar-menu">
            <!-- Main Navigation -->
            <a href="../dashboard/index.html" class="menu-item" data-page="dashboard"><span class="icon">🏠</span><span class="label">Dashboard</span></a>
            <a href="../transactions/index.html" class="menu-item" data-page="transactions"><span class="icon">💳</span><span class="label">Transactions</span></a>
            <a href="../income/index.html" class="menu-item" data-page="income"><span class="icon">💸</span><span class="label">Income</span></a>
            <a href="../investments/index.html" class="menu-item" data-page="investments"><span class="icon">📈</span><span class="label">Investments</span></a>
            <a href="../budget/index.html" class="menu-item" data-page="budget"><span class="icon">💰</span><span class="label">Budget</span></a>
            <a href="../analytics/index.html" class="menu-item" data-page="analytics"><span class="icon">📊</span><span class="label">Analytics</span></a>
            <a href="../networth/index.html" class="menu-item" data-page="networth"><span class="icon">💎</span><span class="label">Net Worth</span></a>
            <a href="../categories/index.html" class="menu-item" data-page="categories"><span class="icon">📁</span><span class="label">Categories</span></a>

            <!-- Separator -->
            <div class="sidebar-separator"></div>

            <!-- User/Account Items -->
            <a href="../profile/index.html" class="menu-item" data-page="profile"><span class="icon">👤</span><span class="label">Profile</span></a>
            <a href="../settings/index.html" class="menu-item" data-page="settings"><span class="icon">⚙️</span><span class="label">Settings</span></a>
            <a href="../auth/login.html" class="menu-item logout-item"><span class="icon">🚪</span><span class="label">Logout</span></a>
        </nav>
    `;

    sidebarContainer.innerHTML = sidebarHTML;

    // Highlight Active Menu Item
    const currentPage = getCurrentPage();
    const activeLink = sidebarContainer.querySelector(`.menu-item[data-page="${currentPage}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
}

function getCurrentPage() {
    const path = window.location.pathname;
    // Extract folder name (e.g., /pages/dashboard/index.html -> dashboard)
    const match = path.match(/\/pages\/([^/]+)\//);
    return match ? match[1] : '';
}

function attachLogoutHandler() {
    // Re-implement logout logic here since header-utils might run before sidebar exists,
    // or we can rely on header-utils if it uses event delegation. 
    // But header-utils attaches to .logout-item directly. 
    // Since sidebar is now dynamic, we must re-attach or use delegation.
    // Simplest is to copy the logic here or make header-utils exportable/global.
    // For now, let's copy the simple logic to be self-contained in sidebar-utils or 
    // rely on header-utils being included and running *after* this.
    // But header-utils runs on DOMContentLoaded too. Race condition.
    // Better to include the logic here for the sidebar logout item.

    const logoutBtn = document.querySelector(".logout-item");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", function (event) {
            event.preventDefault();
            const confirmLogout = confirm("Are you sure you want to logout?");
            if (confirmLogout) {
                document.body.style.transition = "opacity 0.5s ease";
                document.body.style.opacity = "0";
                localStorage.removeItem('user');
                localStorage.removeItem('isLoggedIn');
                setTimeout(() => {
                    window.location.href = "../auth/login.html";
                }, 500);
            }
        });
    }
}
