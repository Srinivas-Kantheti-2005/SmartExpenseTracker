// =======================
// Dashboard JS – Pie Chart
// =======================

// ---------- DATA ----------
const totalIncome = 80000;

const categoryValues = {
    EMIs: 15000,
    "Bills & Utilities": 4500,
    Groceries: 7000,
    Healthcare: 2000,
    Transport: 3500,
    Savings: 14000,
    Subscriptions: 1200,
    Personal: 4000,
    Shopping: 6000,
    Others: 2800
};

// ---------- CALCULATIONS ----------
// Expense INCLUDES savings
const expense = Object.values(categoryValues)
    .reduce((sum, value) => sum + value, 0);

const expenseRatio = Math.round((expense / totalIncome) * 100);

// Remaining AFTER expense (incl savings)
const remaining = totalIncome - expense;

// ---------- CHART DATA ----------
const labels = [...Object.keys(categoryValues), "Remaining"];
const data = [...Object.values(categoryValues), remaining];

const colorMap = {
    EMIs: "#FF6B6B",
    "Bills & Utilities": "#FFA94D",
    Groceries: "#FFD93D",
    Healthcare: "#6BCB77",
    Transport: "#FF7F50",
    Savings: "#4D96FF",
    Subscriptions: "#9B5DE5",
    Personal: "#FFCA3A",
    Shopping: "#FF85A1",
    Others: "#9CA3AF",
    Remaining: "#2ECC71"
};

const backgroundColors = labels.map(l => colorMap[l]);

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
                `₹${expense.toLocaleString()} / ₹${totalIncome.toLocaleString()}`,
                width / 2,
                height / 2 - 10
            );

            ctx.font = "bold 14px Arial";
            ctx.fillText(
                `(${expenseRatio}%)`,
                width / 2,
                height / 2 + 12
            );
        } else {
            ctx.font = "bold 16px Arial";
            ctx.fillText(
                `₹${expense.toLocaleString()} / ₹${totalIncome.toLocaleString()}`,
                width / 2,
                height / 2
            );
        }

        ctx.restore();
    }
};

// ---------- INIT CHART ----------
const canvas = document.getElementById("categoryPieChart");

if (canvas) {
    const ctx = canvas.getContext("2d");

    const pieChart = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels,
            datasets: [{
                data,
                backgroundColor: backgroundColors,
                borderWidth: 0,
                hoverOffset: 10
            }]
        },
        plugins: [centerTextPlugin],
        options: {
            responsive: true,
            cutout: "60%",
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label(context) {
                            return `${context.label} : ₹${context.raw.toLocaleString()}`;
                        }
                    }
                }
            }
        }
    });

    // ---------- CENTER HOVER DETECTION ----------
    canvas.addEventListener("mousemove", (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const dx = x - pieChart.width / 2;
        const dy = y - pieChart.height / 2;
        const distance = Math.sqrt(dx * dx + dy * dy);

        const innerRadius =
            pieChart.getDatasetMeta(0).data[0].innerRadius;

        const prev = centerHovered;
        centerHovered = distance < innerRadius;

        if (prev !== centerHovered) {
            pieChart.options.cutout = centerHovered ? "55%" : "60%";
            pieChart.update();
        }
    });

    canvas.addEventListener("mouseleave", () => {
        centerHovered = false;
        pieChart.options.cutout = "60%";
        pieChart.update();
    });
}

// =======================
// Income vs Expense Graph JS (FINAL)
// =======================

// X-axis labels
const months = [
    "Jan","Feb","Mar","Apr","May","Jun",
    "Jul","Aug","Sep","Oct","Nov","Dec"
];

// Monthly bars (slight income variability)
const monthlyIncome = [
    70000, 72000, 71000, 78000, 80000, 76000,
    83000, 82000, 79000, 85000, 88000, 90000
];

// Monthly expenses (some months > income)
const monthlyExpense = [
    52000, 75000, 68000, 81000, 79000, 82000,
    78000, 86000, 83000, 80000, 91000, 88000
];

// Avg / trend lines (smoother, realistic)
const avgIncomeTrend = [
    71000, 72000, 73500, 76000, 78000, 79000,
    80500, 82000, 83500, 85500, 87500, 89500
];

const avgExpenseTrend = [
    60000, 63000, 66000, 70000, 72000, 74000,
    76000, 78000, 80000, 82000, 84500, 86500
];

// Canvas
const graphCanvas = document.getElementById("incomeExpenseChart");

if (graphCanvas) {
    new Chart(graphCanvas, {
        data: {
            labels: months,
            datasets: [
                {
                    type: "bar",
                    label: "Income",
                    data: monthlyIncome,
                    backgroundColor: "#28a745"
                },
                {
                    type: "bar",
                    label: "Expense",
                    data: monthlyExpense,
                    backgroundColor: "#dc3545"
                },
                {
                    type: "line",
                    label: "Avg Income",
                    data: avgIncomeTrend,
                    borderColor: "#6fcf97",
                    borderWidth: 2,
                    tension: 0.3,
                    pointRadius: 0
                },
                {
                    type: "line",
                    label: "Avg Expense",
                    data: avgExpenseTrend,
                    borderColor: "#f28b82",
                    borderWidth: 2,
                    tension: 0.3,
                    pointRadius: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,

            interaction: {
                mode: "nearest",
                intersect: false
            },

            plugins: {
                legend: { display: false },

                tooltip: {
                    callbacks: {

                        title(tooltipItems) {
                            const datasetType = tooltipItems[0].dataset.type;
                            return datasetType === "line"
                                ? ""
                                : tooltipItems[0].label;
                        },

                        label(ctx) {
                            return `${ctx.dataset.label}: ₹${ctx.raw.toLocaleString()}`;
                        }
                    }
                }
            },

            scales: {
                x: {
                    grid: { display: false }
                },
                y: {
                    grid: { display: false },
                    ticks: {
                        callback(value) {
                            return `₹${value / 1000}k`;
                        }
                    }
                }
            }
        }
    });
}

// =======================
// Logout Button Logic
// =======================
const logoutBtn = document.querySelector(".logout-btn");

if(logoutBtn) {
    logoutBtn.addEventListener("click", function (event) {
        event.preventDefault();

        const confirmLogout = confirm("Are you sure want to logout?");
        if(confirmLogout) {

            document.body.style.transition = "opacity 0.5s ease";
            document.body.style.opacity = "0";

            setTimeout(() => {
                window.location.href = "login.html";
            }, 1500);
        }
    });
}