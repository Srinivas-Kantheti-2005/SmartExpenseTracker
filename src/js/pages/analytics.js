/* ========================================
   Analytics Page Controller
   ======================================== */

document.addEventListener('DOMContentLoaded', function () {
    initAnalyticsPage();
});

let currentPeriod = 'monthly';
let selectedMonth = new Date().getMonth() + 1;
let selectedYear = new Date().getFullYear();

function initAnalyticsPage() {
    loadAnalytics();
    setupEventListeners();
    initCharts();
}

function setupEventListeners() {
    // Period buttons
    document.querySelectorAll('.period-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentPeriod = btn.dataset.period;
            loadAnalytics();
        });
    });
}

function loadAnalytics() {
    loadSummary();
    loadCategoryBreakdown();
    loadTrends();
}

function loadSummary() {
    // Load from localStorage or API
    const transactions = getTransactionsFromStorage();

    const income = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const expense = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    const balance = income - expense;
    const savingsRate = income > 0 ? ((income - expense) / income * 100).toFixed(1) : 0;

    updateSummaryCard('income', income);
    updateSummaryCard('expense', expense);
    updateSummaryCard('balance', balance);
    updateSummaryCard('savings-rate', savingsRate + '%');
}

function updateSummaryCard(id, value) {
    const el = document.getElementById(`summary-${id}`);
    if (el) {
        if (typeof value === 'number') {
            el.textContent = '₹ ' + value.toLocaleString('en-IN');
        } else {
            el.textContent = value;
        }
    }
}

function loadCategoryBreakdown() {
    const transactions = getTransactionsFromStorage();
    const expenses = transactions.filter(t => t.type === 'expense');

    // Group by category
    const categoryTotals = {};
    expenses.forEach(t => {
        if (!categoryTotals[t.category]) {
            categoryTotals[t.category] = { amount: 0, icon: t.icon || '📦', color: t.color || '#9CA3AF' };
        }
        categoryTotals[t.category].amount += t.amount;
    });

    const total = expenses.reduce((sum, t) => sum + t.amount, 0);

    const breakdown = Object.entries(categoryTotals)
        .map(([name, data]) => ({
            name,
            ...data,
            percentage: ((data.amount / total) * 100).toFixed(1)
        }))
        .sort((a, b) => b.amount - a.amount);

    renderCategoryBreakdown(breakdown, total);
}

function renderCategoryBreakdown(breakdown, total) {
    const container = document.getElementById('category-list');
    if (!container) return;

    container.innerHTML = breakdown.map(cat => `
        <div class="category-item">
            <div class="category-color" style="background: ${cat.color}"></div>
            <div class="category-details">
                <div class="category-name">${cat.name}</div>
                <div class="category-bar">
                    <div class="category-bar-fill" style="width: ${cat.percentage}%; background: ${cat.color}"></div>
                </div>
            </div>
            <div class="category-amount">
                <div>₹ ${cat.amount.toLocaleString()}</div>
                <div class="category-percentage">${cat.percentage}%</div>
            </div>
        </div>
    `).join('');
}

function loadTrends() {
    // Load trend data for charts
    const trends = getLast6MonthsTrends();
    updateTrendChart(trends);
}

function getLast6MonthsTrends() {
    const trends = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        trends.push({
            month: date.toLocaleString('default', { month: 'short' }),
            income: Math.random() * 100000 + 50000,
            expense: Math.random() * 60000 + 40000
        });
    }

    return trends;
}

function initCharts() {
    // Initialize chart placeholders
    // Actual chart implementation would use Chart.js or similar
    console.log('Charts initialized');
}

function updateTrendChart(trends) {
    // Update chart with trend data
    console.log('Trend chart updated', trends);
}

function getTransactionsFromStorage() {
    const stored = localStorage.getItem('transactions');
    return stored ? JSON.parse(stored) : [];
}
