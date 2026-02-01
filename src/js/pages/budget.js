/* ========================================
   Budget Page Controller
   ======================================== */

document.addEventListener('DOMContentLoaded', function () {
    initBudgetPage();
});

// Current displayed month/year
let currentMonth = new Date().getMonth() + 1;
let currentYear = new Date().getFullYear();

function initBudgetPage() {
    loadBudgets();
    setupEventListeners();
    updateMonthDisplay();
}

function setupEventListeners() {
    // Month navigation
    document.getElementById('prev-month')?.addEventListener('click', () => changeMonth(-1));
    document.getElementById('next-month')?.addEventListener('click', () => changeMonth(1));

    // Add budget button
    document.getElementById('add-budget-btn')?.addEventListener('click', showAddBudgetModal);
}

function changeMonth(delta) {
    currentMonth += delta;

    if (currentMonth > 12) {
        currentMonth = 1;
        currentYear++;
    } else if (currentMonth < 1) {
        currentMonth = 12;
        currentYear--;
    }

    updateMonthDisplay();
    loadBudgets();
}

function updateMonthDisplay() {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];

    const displayEl = document.getElementById('current-month');
    if (displayEl) {
        displayEl.textContent = `${monthNames[currentMonth - 1]} ${currentYear}`;
    }
}

function loadBudgets() {
    // For now, load from localStorage
    const budgets = getBudgetsFromStorage();
    renderBudgets(budgets);
    updateBudgetSummary(budgets);
}

function getBudgetsFromStorage() {
    const stored = localStorage.getItem('budgets');
    if (!stored) return getDefaultBudgets();

    const all = JSON.parse(stored);
    return all.filter(b => b.month === currentMonth && b.year === currentYear);
}

function getDefaultBudgets() {
    return [
        { id: 1, category: 'Food & Dining', icon: '🍽️', color: '#FF6B6B', amount: 10000, spent: 7500 },
        { id: 2, category: 'Transport', icon: '🚗', color: '#FF7F50', amount: 5000, spent: 3500 },
        { id: 3, category: 'Bills & Utilities', icon: '💡', color: '#FFA94D', amount: 3000, spent: 2100 },
        { id: 4, category: 'Shopping', icon: '🛍️', color: '#FF85A1', amount: 5000, spent: 6000 },
        { id: 5, category: 'Entertainment', icon: '🎬', color: '#F093FB', amount: 3000, spent: 1500 }
    ];
}

function renderBudgets(budgets) {
    const container = document.getElementById('budget-categories');
    if (!container) return;

    container.innerHTML = budgets.map(budget => {
        const percentage = Math.round((budget.spent / budget.amount) * 100);
        const remaining = budget.amount - budget.spent;
        const status = percentage >= 100 ? 'danger' : percentage >= 80 ? 'warning' : 'safe';

        return `
            <div class="budget-category-card" data-id="${budget.id}">
                <div class="budget-category-header">
                    <div class="budget-category-info">
                        <div class="budget-category-icon" style="background: ${budget.color}20">
                            ${budget.icon}
                        </div>
                        <div>
                            <div class="budget-category-name">${budget.category}</div>
                            <div class="budget-category-amounts">
                                Remaining: ₹ ${Math.abs(remaining).toLocaleString()}
                                ${remaining < 0 ? '(Over)' : ''}
                            </div>
                        </div>
                    </div>
                    <div class="budget-amount">
                        <div class="budget-spent">₹ ${budget.spent.toLocaleString()}</div>
                        <div class="budget-limit">of ₹ ${budget.amount.toLocaleString()}</div>
                    </div>
                </div>
                <div class="budget-progress">
                    <div class="budget-progress-bar ${status}" style="width: ${Math.min(percentage, 100)}%"></div>
                </div>
                <div class="budget-percentage">${percentage}%</div>
            </div>
        `;
    }).join('');
}

function updateBudgetSummary(budgets) {
    const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
    const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
    const remaining = totalBudget - totalSpent;

    document.getElementById('total-budget')?.textContent &&
        (document.getElementById('total-budget').textContent = `₹ ${totalBudget.toLocaleString()}`);
    document.getElementById('total-spent')?.textContent &&
        (document.getElementById('total-spent').textContent = `₹ ${totalSpent.toLocaleString()}`);
    document.getElementById('total-remaining')?.textContent &&
        (document.getElementById('total-remaining').textContent = `₹ ${remaining.toLocaleString()}`);
}

function showAddBudgetModal() {
    // Implementation for adding budget
    console.log('Add budget modal');
}
