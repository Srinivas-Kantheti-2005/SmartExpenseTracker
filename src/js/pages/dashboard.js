/**
 * Dashboard JavaScript
 * Handles data fetching, month selection, and visualization for the Smart Expense Tracker.
 */

// ---------- CONFIG & STATE ----------
// ---------- CONFIG & STATE ----------
const API_BASE = "http://localhost:3004";
let currentUser = null;

try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
        currentUser = JSON.parse(userStr);
    } else {
        // Fallback: Try session storage
        const sessionUser = sessionStorage.getItem('user');
        if (sessionUser) {
            console.log("Restoring user from session storage...");
            currentUser = JSON.parse(sessionUser);
            // Restore to local storage
            localStorage.setItem('user', sessionUser);
            localStorage.setItem('isLoggedIn', 'true');
        }
    }
} catch (error) {
    console.error("Error parsing user from localStorage:", error);
    localStorage.removeItem('user'); // Clear invalid data
}

const CATEGORY_COLORS = {
    'Food & Dining': '#3b82f6',     // Blue
    'Shopping': '#f59e0b',          // Orange
    'Transport': '#8b5cf6',         // Purple
    'Bills & Utilities': '#ec4899', // Pink
    'Health & Medical': '#10b981',  // Green
    'Entertainment': '#f43f5e',     // Rose/Red
    'Others': '#94a3b8'             // Grey
};

let allTransactions = [];
let categories = [];
let items = [];

let dashboardData = {
    selectedDate: new Date(), // Current month/year
    summary: {
        income: 0,
        expense: 0,
        investment: 0,
        balance: 0
    },
    categoryExpenses: {}, // For donut chart
    recentTransactions: []
};

let expenseDonutChart = null;

// ---------- INIT ----------
const MAX_RETRIES = 3;

document.addEventListener('DOMContentLoaded', () => {
    // Check for login loop using reliable URL param
    const urlParams = new URLSearchParams(window.location.search);
    const fromLogin = urlParams.get('from') === 'login';

    if (!currentUser) {
        if (fromLogin) {
            console.error("Login Loop Detected: Redirected from login but no session found.");
            // Stop redirecting and show error
            document.body.innerHTML = `
                <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;color:#333;text-align:center;padding:20px;">
                    <div style="font-size:48px;margin-bottom:20px;">⚠️</div>
                    <h1 style="color:#ef4444;">Login Failed</h1>
                    <p style="max-width:400px;line-height:1.6;color:#666;">
                        Secure session creation failed. Your browser might be blocking local storage access.
                    </p>
                    <div style="margin-top:30px;display:flex;gap:15px;">
                        <button onclick="localStorage.clear(); sessionStorage.clear(); window.location.href='../auth/login.html'" 
                            style="padding:10px 20px;background:#3b82f6;color:white;border:none;border-radius:6px;cursor:pointer;font-weight:500;">
                            Try Again
                        </button>
                    </div>
                    <p style="margin-top:40px;font-size:12px;color:#94a3b8;">
                        Debug: Storage Access Denied or Quota Exceeded
                    </p>
                </div>
            `;
            return;
        }

        console.warn("No valid user found in dashboard. Redirecting to login.");
        window.location.href = '../auth/login.html';
        return;
    }

    // Clean up URL if from login
    if (fromLogin) {
        const url = new URL(window.location);
        url.searchParams.delete('from');
        window.history.replaceState({}, '', url);
    }

    console.log("Dashboard initialized for user:", currentUser.email);
    initDashboard();
});

async function initDashboard() {
    // Determine if we should load from localStorage or reset
    const navType = performance.getEntriesByType("navigation")[0]?.type;

    if (navType === 'reload') {
        const savedYear = localStorage.getItem('dashboardYear');
        const savedMonth = localStorage.getItem('dashboardMonth');
        if (savedYear !== null && savedMonth !== null) {
            dashboardData.selectedDate.setFullYear(parseInt(savedYear));
            dashboardData.selectedDate.setMonth(parseInt(savedMonth));
            console.log("Dashboard reloaded: Restored date", dashboardData.selectedDate);
        }
    } else {
        // Fresh navigate from sidebar or other pages -> Reset to current month
        dashboardData.selectedDate = new Date();
        localStorage.setItem('dashboardYear', dashboardData.selectedDate.getFullYear());
        localStorage.setItem('dashboardMonth', dashboardData.selectedDate.getMonth());
        console.log("Dashboard fresh navigation: Reset to today");
    }

    setupMonthSelector();
    await loadData();
    setupNavigation();
}

// ---------- DATA LOADING & PROCESSING ----------
async function loadData() {
    try {
        const [txRes, catRes, itemRes] = await Promise.all([
            fetch(`${API_BASE}/transactions?email=${currentUser.email}`),
            fetch(`${API_BASE}/categories?email=${currentUser.email}`),
            fetch(`${API_BASE}/items?email=${currentUser.email}`)
        ]);

        if (!txRes.ok || !catRes.ok || !itemRes.ok) throw new Error("Failed to fetch data");

        allTransactions = await txRes.json();
        categories = await catRes.json();
        items = await itemRes.json();

        processDashboardData();
    } catch (error) {
        console.error("Error loading dashboard data:", error);
    }
}

function processDashboardData() {
    const selectedMonth = dashboardData.selectedDate.getMonth();
    const selectedYear = dashboardData.selectedDate.getFullYear();

    // Map for quick lookup
    const catMap = {};
    categories.forEach(c => catMap[c.id] = { name: c.name, icon: c.icon });
    const itemMap = {};
    items.forEach(i => itemMap[i.id] = i.name);

    // Filter transactions for the selected month and year
    const monthlyTransactions = allTransactions.filter(tx => {
        const txDate = new Date(tx.date);
        return txDate.getMonth() === selectedMonth && txDate.getFullYear() === selectedYear;
    });

    // Reset summary
    dashboardData.summary = { income: 0, expense: 0, investment: 0, balance: 0 };
    dashboardData.categoryExpenses = {};

    monthlyTransactions.forEach(tx => {
        const amount = Number(tx.amount);
        const catData = catMap[tx.category_id] || { name: tx.category || 'Others', icon: '📦' };
        const itemName = itemMap[tx.item_id] || tx.item || '—';

        // Attach names for easier rendering later
        tx.categoryName = catData.name;
        tx.categoryIcon = catData.icon;
        tx.itemName = itemName;

        if (tx.type === 'income') {
            dashboardData.summary.income += amount;
        } else if (tx.type === 'expense') {
            dashboardData.summary.expense += amount;
            // Group by category for donut
            dashboardData.categoryExpenses[tx.categoryName] = (dashboardData.categoryExpenses[tx.categoryName] || 0) + amount;
        } else if (tx.type === 'investment') {
            dashboardData.summary.investment += amount;
        }
    });

    dashboardData.summary.balance = dashboardData.summary.income - dashboardData.summary.expense - dashboardData.summary.investment;

    // Get recent 5 transactions for this month (newest first)
    dashboardData.recentTransactions = [...monthlyTransactions]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);

    updateUI();
}

// ---------- UI UPDATES ----------
function updateUI() {
    updateSummaryCards();
    updateDonutChart();
    renderRecentTransactions();
}

function updateSummaryCards() {
    document.querySelector('#income-summary-card .card-amount').textContent = formatCurrency(dashboardData.summary.income);
    document.querySelector('#expense-summary-card .card-amount').textContent = formatCurrency(dashboardData.summary.expense);
    document.querySelector('#investment-summary-card .card-amount').textContent = formatCurrency(dashboardData.summary.investment);
    document.querySelector('#balance-summary-card .card-amount').textContent = formatCurrency(dashboardData.summary.balance);
}

function updateDonutChart() {
    const canvas = document.getElementById('expenseDonutChart');
    const chartContent = document.querySelector('.chart-content');
    const breakdownCard = document.querySelector('.breakdown-card');
    if (!canvas || !chartContent || !breakdownCard) return;

    const ctx = canvas.getContext('2d');
    const categories = Object.keys(dashboardData.categoryExpenses);
    const amounts = Object.values(dashboardData.categoryExpenses);
    const totalExpense = dashboardData.summary.expense;

    // Check for existing empty state and remove it
    const existingEmpty = breakdownCard.querySelector('.chart-empty-state');
    if (existingEmpty) existingEmpty.remove();

    if (totalExpense === 0 || categories.length === 0) {
        chartContent.style.display = 'none';
        const emptyState = document.createElement('div');
        emptyState.className = 'chart-empty-state';
        emptyState.innerHTML = `
            <span class="empty-icon-large">📭</span>
            <span class="empty-text-desc">No expenses recorded\nfor this month</span>
        `;
        breakdownCard.appendChild(emptyState);
        return;
    }

    chartContent.style.display = 'flex';
    // Center text update
    document.querySelector('.total-spent-amount').textContent = formatCurrency(totalExpense);

    const chartColors = categories.map(cat => CATEGORY_COLORS[cat] || CATEGORY_COLORS['Others']);

    if (expenseDonutChart) {
        expenseDonutChart.destroy();
    }

    expenseDonutChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: categories,
            datasets: [{
                data: amounts,
                backgroundColor: chartColors,
                borderWidth: 0,
                hoverOffset: 30
            }]
        },
        options: {
            cutout: '70%', // Increased width of the donut
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    position: 'nearest',
                    displayColors: true,
                    mode: 'nearest',
                    intersect: true,
                    yAlign: 'bottom',
                    xAlign: 'center',
                    boxWidth: 10,
                    boxHeight: 10,
                    boxBorderWidth: 0,
                    usePointStyle: false,
                    backgroundColor: 'rgba(0, 0, 0, 1)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    bodyFont: {
                        size: 14,
                        weight: '600'
                    },
                    padding: 12,
                    cornerRadius: 8,
                    caretPadding: 0, // Positioner handles spacing
                    caretSize: 6,
                    callbacks: {
                        title: () => '',
                        label: (context) => {
                            const percent = ((context.raw / totalExpense) * 100).toFixed(1);
                            return ` ${context.label}: ${formatCurrency(context.raw)} (${percent}%)`;
                        },
                        labelColor: (context) => {
                            const color = context.dataset.backgroundColor[context.dataIndex];
                            return {
                                borderColor: color,
                                backgroundColor: color,
                                borderWidth: 0,
                                borderRadius: 3
                            };
                        }
                    }
                }
            }
        }
    });

    // Render custom legend
    const legendData = categories.map((cat) => ({
        name: cat,
        percent: ((dashboardData.categoryExpenses[cat] / totalExpense) * 100).toFixed(1),
        color: CATEGORY_COLORS[cat] || CATEGORY_COLORS['Others']
    })).sort((a, b) => b.percent - a.percent);

    renderLegend(legendData);
}

function renderLegend(legendData) {
    const legendContainer = document.getElementById('chart-legend');
    if (!legendContainer) return;

    if (legendData.length === 0) {
        legendContainer.innerHTML = '<p style="text-align: center; color: #94a3b8; font-size: 13px; margin-top: 20px;">No expenses this month</p>';
        return;
    }

    legendContainer.innerHTML = legendData.map(item => `
        <div class="legend-item">
            <div class="legend-left">
                <span class="status-dot" style="background: ${item.color}"></span>
                <span class="category-name-text">${item.name}</span>
            </div>
            <span class="legend-percent">${item.percent}%</span>
        </div>
    `).join('');
}

function renderRecentTransactions() {
    const listContainer = document.getElementById('recent-transactions-list');
    if (!listContainer) return;

    if (dashboardData.recentTransactions.length === 0) {
        listContainer.innerHTML = '<p style="text-align: center; color: #94a3b8; padding: 40px; font-weight: 500;">No transactions found for this month.</p>';
        return;
    }

    listContainer.innerHTML = dashboardData.recentTransactions.map(tx => `
        <div class="recent-tx-row" onclick="navigateToTransactions('${tx.type}')">
            <div class="tx-main-info">
                <span class="tx-date">${formatDateSmall(tx.date)}</span>
                <span class="tx-category">${tx.categoryName}</span>
                <span class="tx-item">${tx.itemName}</span>
            </div>
            <span class="tx-amount-v2 ${tx.type}">${formatCurrency(tx.amount)}</span>
        </div>
    `).join('');
}

// ---------- MONTH SELECTOR (Custom Modal) ----------
function setupMonthSelector() {
    const monthText = document.getElementById('current-month-text');
    const prevBtn = document.getElementById('prev-month');
    const nextBtn = document.getElementById('next-month');
    const trigger = document.getElementById('date-display-trigger');
    const modal = document.getElementById('month-picker-modal');
    const yearDisplay = document.getElementById('picker-year-display');
    const prevYearBtn = document.getElementById('picker-prev-year');
    const nextYearBtn = document.getElementById('picker-next-year');
    const monthsGrid = document.getElementById('months-grid');

    let pickerYear = dashboardData.selectedDate.getFullYear();
    let isYearView = false;

    const monthNamesShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const updateDisplay = () => {
        const options = { month: 'long', year: 'numeric' };
        monthText.textContent = dashboardData.selectedDate.toLocaleDateString('en-US', options);

        // Save to localStorage
        localStorage.setItem('dashboardYear', dashboardData.selectedDate.getFullYear());
        localStorage.setItem('dashboardMonth', dashboardData.selectedDate.getMonth());

        processDashboardData();
    };

    const renderPicker = () => {
        yearDisplay.textContent = pickerYear;

        if (isYearView) {
            // Render 12 years around the current pickerYear
            const startYear = pickerYear - 5;
            let yearsHtml = '';
            for (let i = 0; i < 12; i++) {
                const year = startYear + i;
                const isActive = year === dashboardData.selectedDate.getFullYear();
                yearsHtml += `<button type="button" class="year-btn ${isActive ? 'active' : ''}" data-year="${year}">${year}</button>`;
            }
            monthsGrid.className = 'years-grid';
            monthsGrid.innerHTML = yearsHtml;
            prevYearBtn.textContent = '«'; // Double arrow for faster nav in year view
            nextYearBtn.textContent = '»';
        } else {
            monthsGrid.className = 'months-grid';
            monthsGrid.innerHTML = monthNamesShort.map((month, index) => {
                const isActive = pickerYear === dashboardData.selectedDate.getFullYear() && index === dashboardData.selectedDate.getMonth();
                return `<button type="button" class="month-btn ${isActive ? 'active' : ''}" data-month="${index}">${month}</button>`;
            }).join('');
            prevYearBtn.textContent = '‹';
            nextYearBtn.textContent = '›';
        }
    };

    // Toggle Modal
    if (trigger) {
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            modal.classList.toggle('active');
            if (modal.classList.contains('active')) {
                pickerYear = dashboardData.selectedDate.getFullYear();
                isYearView = false;
                renderPicker();
            }
        });
    }

    // Switch between Month and Year view
    if (yearDisplay) {
        yearDisplay.addEventListener('click', (e) => {
            e.stopPropagation();
            isYearView = !isYearView;
            renderPicker();
        });
    }

    // Close Modal on click outside
    document.addEventListener('click', (e) => {
        if (modal && !modal.contains(e.target) && !trigger.contains(e.target)) {
            modal.classList.remove('active');
        }
    });

    // Year Navigation
    if (prevYearBtn) {
        prevYearBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (isYearView) {
                pickerYear -= 12; // Jump 12 years
            } else {
                pickerYear--;
            }
            renderPicker();
        });
    }

    if (nextYearBtn) {
        nextYearBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (isYearView) {
                pickerYear += 12; // Jump 12 years
            } else {
                pickerYear++;
            }
            renderPicker();
        });
    }

    // Selection Handling
    if (monthsGrid) {
        monthsGrid.addEventListener('click', (e) => {
            e.stopPropagation();
            if (e.target.classList.contains('month-btn')) {
                const monthIndex = parseInt(e.target.dataset.month);
                dashboardData.selectedDate.setFullYear(pickerYear);
                dashboardData.selectedDate.setMonth(monthIndex);
                updateDisplay();
                modal.classList.remove('active');
            } else if (e.target.classList.contains('year-btn')) {
                pickerYear = parseInt(e.target.dataset.year);
                isYearView = false; // Switch back to month view
                renderPicker();
            }
        });
    }

    // Main navigation buttons (‹ ›)
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            dashboardData.selectedDate.setMonth(dashboardData.selectedDate.getMonth() - 1);
            updateDisplay();
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            dashboardData.selectedDate.setMonth(dashboardData.selectedDate.getMonth() + 1);
            updateDisplay();
        });
    }

    // Initial display
    updateDisplay();
}

// ---------- NAVIGATION ----------
function setupNavigation() {
    const cards = [
        { id: 'income-summary-card', type: 'income' },
        { id: 'expense-summary-card', type: 'expense' },
        { id: 'investment-summary-card', type: 'investment' },
        { id: 'balance-summary-card', type: 'all' }
    ];

    cards.forEach(card => {
        const el = document.getElementById(card.id);
        if (el) {
            el.addEventListener('click', () => {
                window.navigateToTransactions(card.type);
            });
        }
    });

    const viewAll = document.getElementById('view-all-tx');
    if (viewAll) {
        viewAll.addEventListener('click', (e) => {
            e.preventDefault();
            window.navigateToTransactions('all');
        });
    }
}

// Exposed to window for onclick handlers
window.navigateToTransactions = function (type) {
    const month = dashboardData.selectedDate.getMonth() + 1;
    const year = dashboardData.selectedDate.getFullYear();
    const formattedMonth = `${year}-${String(month).padStart(2, '0')}`;

    // Pass filters via URL parameters
    const params = new URLSearchParams();
    if (type !== 'all') params.append('type', type);
    params.append('month', formattedMonth);

    window.location.href = `../transactions/index.html?${params.toString()}`;
};

// ---------- UTILS ----------
function formatCurrency(amount) {
    return '₹' + Math.abs(amount).toLocaleString('en-IN');
}

function formatDateSmall(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
}