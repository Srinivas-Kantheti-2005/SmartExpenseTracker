// =======================
// Dashboard JS – Expense Donut Chart
// =======================

// =======================
// Auto Updating Date
// =======================

function updateDateUI() {
    const now = new Date();

    const dayNames = [
        "Sunday", "Monday", "Tuesday",
        "Wednesday", "Thursday", "Friday", "Saturday"
    ];

    const monthNames = [
        "January", "February", "March", "April",
        "May", "June", "July", "August",
        "September", "October", "November", "December"
    ];

    const dayEl = document.querySelector(".day");
    const dateEl = document.querySelector(".date-no");
    const monthEl = document.querySelector(".month");
    const yearEl = document.querySelector(".year");

    if (!dayEl || !dateEl || !monthEl || !yearEl) return;

    dayEl.textContent = dayNames[now.getDay()];
    dateEl.textContent = String(now.getDate()).padStart(2, "0");
    monthEl.textContent = monthNames[now.getMonth()];
    yearEl.textContent = now.getFullYear();
}

// Run once when page loads
updateDateUI();

// Calculate milliseconds until next midnight
function msUntilMidnight() {
    const now = new Date();
    const midnight = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1, // next day
        0, 0, 0, 0
    );
    return midnight - now;
}

// Update exactly at midnight, then every 24 hours
setTimeout(() => {
    updateDateUI();
    setInterval(updateDateUI, 24 * 60 * 60 * 1000);
}, msUntilMidnight());

// User Profile Update is handled by header-utils.js


// ---------- STATE MANAGEMENT ----------
let transactions = [];
let totalIncome = 0;
let totalExpense = 0;
let investments = 0;
let balance = 0;
let categoryExpenses = {};

const DB_TRANSACTIONS_URL = "http://localhost:3004/transactions";

// ---------- FETCH DATA ----------
async function loadDashboardData() {
    try {
        const response = await fetch(DB_TRANSACTIONS_URL);
        if (!response.ok) throw new Error("Failed to fetch data");

        transactions = await response.json();
        processData();
        updateSummaryCards();
        renderChart();
        renderTodayExpenses();
    } catch (error) {
        console.error("Error loading dashboard data:", error);
    }
}

// Process raw transactions into totals and category breakdown
function processData() {
    // Reset totals
    totalIncome = 0;
    totalExpense = 0;
    investments = 0;
    categoryExpenses = {};

    transactions.forEach(tx => {
        const amount = Number(tx.amount);

        if (tx.type === 'income') {
            totalIncome += amount;
        } else if (tx.type === 'expense') {
            totalExpense += amount;

            // Add to category total
            const cat = tx.category || 'Others'; // normalized key
            // Map backend category keys to display labels using existing map if possible
            let displayLabel = "Others";

            // Simple reverse lookup or normalization could go here. 
            // For now, we aggregate by the raw category key and will map it during chart render.

            // We'll trust the category key from the DB matches our keys roughly
            if (categoryExpenses[tx.category]) {
                categoryExpenses[tx.category] += amount;
            } else {
                categoryExpenses[tx.category] = amount;
            }
        } else if (tx.type === 'investment') {
            investments += amount;
        }
    });

    balance = totalIncome - totalExpense - investments;
}

// ---------- CHART DATA PREPARATION ----------
// We need to map the dynamic categoryExpenses object to the labels/data arrays expected by Chart.js
function getChartData() {
    // Standardize keys to match our colorMap
    // Note: In a real app, we'd have a stronger category management system.
    // For this refactor, we attempt to map the DB category keys to our display labels.

    // In db.json, categories might be "food", "transport" etc.
    // We map them to "Food & Dining", "Transport" etc for the chart.

    const displayData = {};

    Object.keys(categoryExpenses).forEach(key => {
        // Find matching mapping or default
        const mapEntry = categoryMapping[key];
        const label = mapEntry ? mapEntry.label : key; // Fallback to key if no map found

        if (displayData[label]) {
            displayData[label] += categoryExpenses[key];
        } else {
            displayData[label] = categoryExpenses[key];
        }
    });

    return {
        labels: Object.keys(displayData),
        data: Object.values(displayData)
    };
}


const colorMap = {
    "Food & Dining": "#FF6B6B",
    "Transport": "#FF7F50",
    "Housing": "#8B5CF6",
    "Bills & Utilities": "#FFA94D",
    "Shopping": "#FF85A1",
    "Health & Medical": "#6BCB77",
    "Education": "#3B82F6",
    "Entertainment": "#EC4899",
    "Personal Care": "#FFCA3A",
    "Travel": "#14B8A6",
    "Gifts & Donations": "#F472B6",
    "EMI / Loans": "#EF4444",
    "Others": "#9CA3AF"
};

// Default budget for now
const monthlyBudget = 50000;
let budgetPercentage = 0;

// ---------- CENTER TEXT + HOVER ----------
let centerHovered = false;

const centerTextPlugin = {
    id: "centerText",
    beforeDraw(chart) {
        const { ctx, width, height } = chart;

        ctx.save();
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.fillStyle = centerHovered ? "#e63946" : "#000";

        if (centerHovered) {
            ctx.font = "bold 16px Arial";
            ctx.fillText(
                `₹${totalExpense.toLocaleString()} used`,
                width / 2,
                height / 2 - 10
            );

            ctx.font = "bold 12px Arial";
            if (budgetPercentage !== null) {
                ctx.fillText(
                    `${budgetPercentage}% of budget`,
                    width / 2,
                    height / 2 + 12
                );
            }
        } else {
            ctx.font = "bold 16px Arial";
            ctx.fillText(
                `₹${totalExpense.toLocaleString()}`,
                width / 2,
                height / 2 - 8
            );
            ctx.font = "11px Arial";
            ctx.fillText(
                "used",
                width / 2,
                height / 2 + 10
            );
        }

        ctx.restore();
    }
};

// ---------- INIT CHART ----------
const canvas = document.getElementById("categoryExpenseDonut");

if (canvas) {
    const ctx = canvas.getContext("2d");

    // Recalculate chart data
    const chartData = getChartData();
    const backgroundColors = chartData.labels.map(l => colorMap[l] || "#9CA3AF");

    // Update budget percentage
    budgetPercentage = monthlyBudget > 0 ? Math.round((totalExpense / monthlyBudget) * 100) : 0;

    const donutChart = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: chartData.labels,
            datasets: [{
                data: chartData.data,
                backgroundColor: backgroundColors,
                borderWidth: 0,
                hoverOffset: 10
            }]
        },
        plugins: [centerTextPlugin],
        options: {
            responsive: true,
            cutout: "65%",
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label(context) {
                            const percentage = Math.round((context.raw / totalExpense) * 100);
                            return `${context.label}: ₹${context.raw.toLocaleString()} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });

    // Function to re-render chart explicitly if needed
    function renderChart() {
        if (!canvas) return;

        const chartData = getChartData();
        const backgroundColors = chartData.labels.map(l => colorMap[l] || "#9CA3AF");

        const chartInstance = Chart.getChart(canvas);
        if (chartInstance) {
            chartInstance.data.labels = chartData.labels;
            chartInstance.data.datasets[0].data = chartData.data;
            chartInstance.data.datasets[0].backgroundColor = backgroundColors;
            chartInstance.update();
        }
    }


    // ---------- CENTER HOVER DETECTION ----------
    canvas.addEventListener("mousemove", (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const dx = x - donutChart.width / 2;
        const dy = y - donutChart.height / 2;
        const distance = Math.sqrt(dx * dx + dy * dy);

        const innerRadius =
            donutChart.getDatasetMeta(0).data[0].innerRadius;

        const prev = centerHovered;
        centerHovered = distance < innerRadius;

        if (prev !== centerHovered) {
            donutChart.options.cutout = centerHovered ? "60%" : "65%";
            donutChart.update();
        }
    });

    canvas.addEventListener("mouseleave", () => {
        centerHovered = false;
        donutChart.options.cutout = "65%";
        donutChart.update();
    });
}

// =======================
// Render Today's Expense Breakdown
// =======================

// Category mapping from transaction value to display info
const categoryMapping = {
    'emis': { label: 'EMI / Loans', icon: '🏦' },
    'bills': { label: 'Bills & Utilities', icon: '💡' },
    'groceries': { label: 'Food & Dining', icon: '🍽️' },
    'healthcare': { label: 'Health & Medical', icon: '🏥' },
    'transport': { label: 'Transport', icon: '🚗' },
    'housing': { label: 'Housing', icon: '🏠' },
    'shopping': { label: 'Shopping', icon: '🛍️' },
    'education': { label: 'Education', icon: '📚' },
    'entertainment': { label: 'Entertainment', icon: '🎬' },
    'personal': { label: 'Personal Care', icon: '💅' },
    'travel': { label: 'Travel', icon: '✈️' },
    'gifts': { label: 'Gifts & Donations', icon: '🎁' },
    'others': { label: 'Others', icon: '📦' }
};

// Get today's date in YYYY-MM-DD format
function getTodayDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Format currency based on settings
function formatCurrency(amount) {
    const settings = JSON.parse(localStorage.getItem('appSettings') || '{}');
    const currency = settings.currency || 'inr';

    const symbols = {
        inr: '₹',
        usd: '$',
        eur: '€',
        gbp: '£'
    };

    const symbol = symbols[currency] || '₹';
    return `${symbol} ${amount.toLocaleString('en-IN')}`;
}

// Load and render today's expenses
function renderTodayExpenses() {
    const expenseListContainer = document.querySelector(".expense-list");
    if (!expenseListContainer) return;

    // Data is already loaded in 'transactions' variable by loadDashboardData()
    // but renderTodayExpenses might fail if called before loadDashboardData() finishes.
    // So we use the global transactions array which should be populated.

    // If empty (maybe first load), we don't need sample data anymore as we have a real DB.

    // Get today's date
    const today = getTodayDate();

    // Filter for today's expenses only
    const todayExpenses = transactions.filter(tx =>
        tx.date === today && tx.type === 'expense'
    );

    // Sort by amount (highest first)
    todayExpenses.sort((a, b) => b.amount - a.amount);

    if (todayExpenses.length === 0) {
        expenseListContainer.innerHTML = `
            <div class="expense-empty">
                <span class="empty-icon">📭</span>
                <p>No expenses recorded today</p>
                <span class="empty-hint">Add transactions to see them here</span>
            </div>
        `;
        return;
    }

    expenseListContainer.innerHTML = todayExpenses.map(tx => {
        const catInfo = categoryMapping[tx.category] || { label: tx.category, icon: '📦' };
        // Use subcategory if available, otherwise fall back to description
        const subcategory = tx.subcategory || tx.description || '';
        // Use note if available
        const note = tx.note || '';
        return `
            <div class="expense-item">
                <span class="category-icon">${catInfo.icon}</span>
                <div class="category-info">
                    <span class="category-name">${catInfo.label}</span>
                    <span class="subcategory-name">${subcategory}</span>
                </div>
                <span class="expense-note">${note}</span>
                <span class="category-amount expense">${formatCurrency(tx.amount)}</span>
            </div>
        `;
    }).join("");
}

// Initial Render (will be empty specific charts, wait for fetch)
renderTodayExpenses();

// Start Data Load
loadDashboardData();

// =======================
// Logout Button Logic & User Profile
// Handled by src/js/utils/header-utils.js
// =======================

// =======================
// Update summary cards
// =======================
function updateSummaryCards() {
    const monthlyIncome = totalIncome;
    const monthlyExpense = totalExpense;
    const monthlyInvestments = investments;
    const monthlyBalance = balance;

    document.getElementById("income-card").querySelector("p").textContent = `₹ ${monthlyIncome.toLocaleString()}`;
    document.getElementById("expense-card").querySelector("p").textContent = `₹ ${monthlyExpense.toLocaleString()}`;
    document.getElementById("investment-card").querySelector("p").textContent = `₹ ${monthlyInvestments.toLocaleString()}`;
    document.getElementById("balance-card").querySelector("p").textContent = `₹ ${monthlyBalance.toLocaleString()}`;
}

// updateSummaryCards(); // Called inside loadDashboardData