/**
 * Dashboard JavaScript
 * Handles data fetching, month selection, and visualization for the Smart Expense Tracker.
 */

// ---------- CONFIG & STATE ----------
const API_BASE = window.API_BASE_URL || "http://localhost:5000/api";
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
document.addEventListener('DOMContentLoaded', () => {
    // Check user session
    const userStr = localStorage.getItem('user');
    if (userStr) {
        const currentUser = JSON.parse(userStr);
        console.log("Dashboard initialized for user:", currentUser.email);
    } else {
        console.warn("No logged in user found.");
    }

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
        const headers = getAuthHeaders();
        const [txRes, catRes] = await Promise.all([
            fetch(`${API_BASE}/transactions`, { headers }),
            fetch(`${API_BASE}/categories`, { headers })
        ]);

        if (!txRes.ok || !catRes.ok) throw new Error("Failed to fetch data");

        const txData = await txRes.json();
        allTransactions = txData.data || [];

        const catData = await catRes.json();
        const rawCategories = catData.data || [];

        // Transform API data to match Transactions page format (extract items from subcategories)
        categories = [];
        items = [];
        rawCategories.forEach(cat => {
            categories.push({
                id: cat.id,
                name: cat.name,
                type: cat.type,
                icon: cat.icon,
                color: cat.color
            });

            if (cat.subcategories && cat.subcategories.length > 0) {
                cat.subcategories.forEach(sub => {
                    items.push({
                        id: sub.id,
                        name: sub.name,
                        categoryId: cat.id
                    });
                });
            }
        });

        processDashboardData();
    } catch (error) {
        console.error("Error loading dashboard data:", error);
    }
}

function processDashboardData() {
    const selectedMonth = dashboardData.selectedDate.getMonth();
    const selectedYear = dashboardData.selectedDate.getFullYear();

    // Filter transactions for the selected month and year
    const monthlyTransactions = allTransactions.filter(tx => {
        const txDate = new Date(tx.date);
        return txDate.getMonth() === selectedMonth && txDate.getFullYear() === selectedYear;
    });

    // Reset summary
    dashboardData.summary = { income: 0, expense: 0, investment: 0, balance: 0 };
    dashboardData.categoryExpenses = {};

    // Process all transactions for the month with robust lookups
    const processedTransactions = monthlyTransactions.map(tx => {
        const amount = Number(tx.amount);

        // Find category info (loose equality as in transactions.js)
        const catId = tx.category_id || tx.categoryId;
        const cat = categories.find(c => c.id == catId);
        const categoryName = cat ? cat.name : (tx.category || 'Others');
        const categoryIcon = cat ? cat.icon : '📦';

        // Find item info (loose equality as in transactions.js)
        const itemId = tx.item_id || tx.itemId;
        const itemObj = items.find(i => i.id == itemId);
        const itemName = itemObj ? itemObj.name : (tx.item || '—');

        // Update summary totals
        const type = (tx.type || '').toLowerCase();
        if (type === 'income') {
            dashboardData.summary.income += amount;
        } else if (type === 'expense') {
            dashboardData.summary.expense += amount;
            dashboardData.categoryExpenses[categoryName] = (dashboardData.categoryExpenses[categoryName] || 0) + amount;
        } else if (type === 'investment') {
            dashboardData.summary.investment += amount;
        }

        return {
            ...tx,
            categoryName,
            categoryIcon,
            itemName,
            amount,
            type
        };
    });

    dashboardData.summary.balance = dashboardData.summary.income - dashboardData.summary.expense - dashboardData.summary.investment;

    // Latest 5 transactions for the month (sorted by date desc)
    dashboardData.recentTransactions = [...processedTransactions]
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
    const categoryLabels = Object.keys(dashboardData.categoryExpenses);
    const amounts = Object.values(dashboardData.categoryExpenses);
    const totalExpense = dashboardData.summary.expense;

    // Check for existing empty state and remove it
    const existingEmpty = breakdownCard.querySelector('.chart-empty-state');
    if (existingEmpty) existingEmpty.remove();

    if (totalExpense === 0 || categoryLabels.length === 0) {
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
    document.querySelector('.total-spent-amount').textContent = formatCurrency(totalExpense);

    const chartColors = categoryLabels.map(catLabel => {
        const cat = categories.find(c => c.name === catLabel);
        return cat?.color || CATEGORY_COLORS[catLabel] || CATEGORY_COLORS['Others'];
    });

    if (expenseDonutChart) {
        expenseDonutChart.destroy();
    }

    expenseDonutChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: categoryLabels,
            datasets: [{
                data: amounts,
                backgroundColor: chartColors,
                borderWidth: 0,
                hoverOffset: 30
            }]
        },
        options: {
            cutout: '70%',
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
                    backgroundColor: 'rgba(0, 0, 0, 1)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    bodyFont: { size: 14, weight: '600' },
                    padding: 12,
                    cornerRadius: 8,
                    caretPadding: 0,
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

    const legendData = categoryLabels.map((catLabel) => {
        const cat = categories.find(c => c.name === catLabel);
        return {
            name: catLabel,
            percent: ((dashboardData.categoryExpenses[catLabel] / totalExpense) * 100).toFixed(1),
            color: cat?.color || CATEGORY_COLORS[catLabel] || CATEGORY_COLORS['Others']
        };
    }).sort((a, b) => b.percent - a.percent);

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
        listContainer.innerHTML = `
            <div class="chart-empty-state">
                <span class="empty-icon-large">📭</span>
                <span class="empty-text-desc" style="color: #94a3b8; font-weight: 700;">No transactions for this month</span>
            </div>`;
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

    const monthNamesShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    let pickerYear = dashboardData.selectedDate.getFullYear();
    let isYearView = false;

    const updateDisplay = () => {
        const options = { month: 'long', year: 'numeric' };
        monthText.textContent = dashboardData.selectedDate.toLocaleDateString('en-US', options);

        localStorage.setItem('dashboardYear', dashboardData.selectedDate.getFullYear());
        localStorage.setItem('dashboardMonth', dashboardData.selectedDate.getMonth());

        processDashboardData();
    };

    const renderPicker = () => {
        yearDisplay.textContent = pickerYear;

        if (isYearView) {
            const startYear = pickerYear - 5;
            let yearsHtml = '';
            for (let i = 0; i < 12; i++) {
                const year = startYear + i;
                const isActive = year === dashboardData.selectedDate.getFullYear();
                yearsHtml += `<button type="button" class="year-btn ${isActive ? 'active' : ''}" data-year="${year}">${year}</button>`;
            }
            monthsGrid.className = 'years-grid';
            monthsGrid.innerHTML = yearsHtml;
            prevYearBtn.textContent = '«';
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
        modal.addEventListener('click', (e) => e.stopPropagation());
    }

    if (yearDisplay) {
        yearDisplay.addEventListener('click', (e) => {
            e.stopPropagation();
            isYearView = !isYearView;
            renderPicker();
        });
    }

    document.addEventListener('click', (e) => {
        if (modal && !modal.contains(e.target) && !trigger.contains(e.target)) {
            modal.classList.remove('active');
        }
    });

    if (prevYearBtn) {
        prevYearBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (isYearView) pickerYear -= 12; else pickerYear--;
            renderPicker();
        });
    }

    if (nextYearBtn) {
        nextYearBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (isYearView) pickerYear += 12; else pickerYear++;
            renderPicker();
        });
    }

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
                isYearView = false;
                renderPicker();
            }
        });
    }

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

    const params = new URLSearchParams();
    if (type !== 'all') params.append('type', type);
    params.append('month', formattedMonth);

    window.location.href = `../transactions/index.html?${params.toString()}`;
};

// ---------- UTILS ----------
function formatCurrency(amount) {
    return '₹ ' + Math.abs(amount).toLocaleString('en-IN');
}

function formatDateSmall(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
}