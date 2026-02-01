// Transactions Page JavaScript
// Handles CRUD operations via JSON Server

const API_URL = 'http://localhost:3004/transactions';
let transactions = [];
let editingId = null;
let currentUser = null;

document.addEventListener('DOMContentLoaded', function () {
    // Check authentication
    const userStr = localStorage.getItem('user');
    if (!userStr) {
        window.location.href = '../auth/login.html';
        return;
    }
    currentUser = JSON.parse(userStr);

    initTransactions();
});


// Income categories
const incomeCategories = [
    { value: 'salary', label: 'Salary', icon: '💰' },
    { value: 'bonus', label: 'Bonus', icon: '🎁' },
    { value: 'returns', label: 'Returns/Refunds', icon: '↩️' },
    { value: 'investment', label: 'Investment Returns', icon: '📈' },
    { value: 'freelance', label: 'Freelance', icon: '💼' },
    { value: 'other-income', label: 'Other Income', icon: '💵' }
];

// Expense categories
const expenseCategories = [
    { value: 'groceries', label: 'Food & Dining', icon: '🍽️' },
    { value: 'transport', label: 'Transport', icon: '🚗' },
    { value: 'housing', label: 'Housing', icon: '🏠' },
    { value: 'bills', label: 'Bills & Utilities', icon: '🧾' },
    { value: 'shopping', label: 'Shopping', icon: '🛍️' },
    { value: 'healthcare', label: 'Health & Medical', icon: '🏥' },
    { value: 'education', label: 'Education', icon: '📚' },
    { value: 'entertainment', label: 'Entertainment', icon: '🎬' },
    { value: 'personal', label: 'Personal Care', icon: '💅' },
    { value: 'travel', label: 'Travel', icon: '✈️' },
    { value: 'gifts', label: 'Gifts & Donations', icon: '🎁' },
    { value: 'emis', label: 'EMI / Loans', icon: '🏦' },
    { value: 'others', label: 'Others', icon: '📦' },
    { value: '__add_category__', label: '➕ Add Category', icon: '➕' }
];

// Subcategories for each expense category (for description suggestions)
const categorySubcategories = {
    'groceries': ['Groceries', 'Restaurants', 'Snacks', 'Food Delivery', '➕ Add Subcategory'],
    'transport': ['Fuel', 'Ride Hailing Services', 'Public Transport', '➕ Add Subcategory'],
    'housing': ['Rent', 'Maintenance', 'Electricity', 'Water', '➕ Add Subcategory'],
    'bills': ['Mobile Recharge', 'Internet', 'Gas', 'Subscriptions', '➕ Add Subcategory'],
    'shopping': ['Clothes', 'Accessories', 'Online Shopping', '➕ Add Subcategory'],
    'healthcare': ['Doctor Visits', 'Medicines', 'Insurance Premiums', '➕ Add Subcategory'],
    'education': ['College / School Fees', 'Courses', 'Books', '➕ Add Subcategory'],
    'entertainment': ['Movies', 'Games', 'Events', '➕ Add Subcategory'],
    'personal': ['Salon', 'Grooming', 'Cosmetics', '➕ Add Subcategory'],
    'travel': ['Trips', 'Hotels', 'Transportation', '➕ Add Subcategory'],
    'gifts': ['Gifts', 'Charity', 'Festivals', '➕ Add Subcategory'],
    'emis': ['Education Loan', 'Personal Loan', 'Credit Card EMI', '➕ Add Subcategory'],
    'others': ['Miscellaneous', 'Uncategorized Expenses', '➕ Add Subcategory']
};

// Subcategories for income categories
const incomeSubcategories = {
    'salary': ['Monthly Salary', 'Overtime Pay', 'Arrears'],
    'bonus': ['Annual Bonus', 'Performance Bonus', 'Festival Bonus'],
    'returns': ['Product Return', 'Tax Refund', 'Deposit Refund'],
    'investment': ['Dividend', 'Interest Income', 'Stock Returns', 'Mutual Fund Returns'],
    'freelance': ['Project Payment', 'Consulting Fee', 'Contract Work'],
    'other-income': ['Gift Received', 'Rental Income', 'Side Business']
};

function initTransactions() {
    const filterType = document.getElementById('filterType');
    const filterCategory = document.getElementById('filterCategory');
    const addBtn = document.querySelector('.btn-add-transaction');

    // Load transactions from API
    fetchTransactions();

    // Type filter change
    if (filterType) {
        filterType.addEventListener('change', function () {
            updateCategoryOptions(this.value);
            filterTransactions();
        });
    }

    // Category filter change
    if (filterCategory) {
        filterCategory.addEventListener('change', filterTransactions);
    }

    // Add transaction button
    if (addBtn) {
        addBtn.addEventListener('click', showAddModal);
    }

    // Create modal HTML
    createTransactionModal();

    // Attach edit/delete handlers
    attachActionHandlers();
}

async function fetchTransactions() {
    try {
        const response = await fetch(`${API_URL}?userId=${currentUser.id}`);
        if (!response.ok) throw new Error('Failed to fetch transactions');
        transactions = await response.json();

        // Ensure ID is string/number consistent
        transactions = transactions.map(t => ({ ...t, id: String(t.id) }));

        renderTransactions();
    } catch (error) {
        console.error('Error fetching transactions:', error);
        document.querySelector('.transactions-table tbody').innerHTML = `
            <tr><td colspan="6" style="text-align:center; color:red;">Failed to load transactions. Check connection.</td></tr>
        `;
    }
}

function updateCategoryOptions(type) {
    const filterCategory = document.getElementById('filterCategory');
    if (!filterCategory) return;

    filterCategory.innerHTML = '<option value="all">All Categories</option>';

    if (type === 'all' || type === 'income') {
        const incomeGroup = document.createElement('optgroup');
        incomeGroup.label = '💰 Income Categories';
        incomeCategories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.value;
            option.textContent = cat.label;
            incomeGroup.appendChild(option);
        });
        filterCategory.appendChild(incomeGroup);
    }

    if (type === 'all' || type === 'expense') {
        const expenseGroup = document.createElement('optgroup');
        expenseGroup.label = '💸 Expense Categories';
        expenseCategories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.value;
            option.textContent = cat.label;
            expenseGroup.appendChild(option);
        });
        filterCategory.appendChild(expenseGroup);
    }
}

// ... Modal Functions Same as Before ...

function createTransactionModal() {
    const modal = document.createElement('div');
    modal.id = 'transactionModal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3 id="modalTitle">Add Transaction</h3>
                <button class="modal-close" onclick="closeModal()">&times;</button>
            </div>
            <form id="transactionForm">
                <div class="form-group">
                    <label for="txDate">Date</label>
                    <input type="date" id="txDate" required>
                </div>
                <div class="form-group">
                    <label for="txType">Type</label>
                    <select id="txType" required>
                        <option value="">Select Type</option>
                        <option value="income">Income</option>
                        <option value="expense">Expense</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="txCategory">Category</label>
                    <select id="txCategory" required>
                        <option value="">Select Type First</option>
                    </select>
                </div>
                <div class="form-group" id="customCategoryGroup" style="display: none;">
                    <label for="txCustomCategory">New Category Name</label>
                    <input type="text" id="txCustomCategory" placeholder="Enter category name">
                </div>
                <div class="form-group">
                    <label for="txDescriptionSelect">Subcategory</label>
                    <select id="txDescriptionSelect" required>
                        <option value="">Select Category First</option>
                    </select>
                </div>
                <div class="form-group" id="customDescriptionGroup" style="display: none;">
                    <label for="txCustomDescription">Custom Description</label>
                    <input type="text" id="txCustomDescription" placeholder="Enter your custom description">
                </div>
                <div class="form-group">
                    <label for="txAmount">Amount (₹)</label>
                    <input type="number" id="txAmount" placeholder="Enter amount" min="0" step="0.01" required>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn-secondary" onclick="closeModal()">Cancel</button>
                    <button type="submit" class="btn-primary">Save</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('txType').addEventListener('change', function () {
        updateModalCategories(this.value);
        document.getElementById('txDescriptionSelect').innerHTML = '<option value="">Select Category First</option>';
        document.getElementById('customDescriptionGroup').style.display = 'none';
        document.getElementById('customCategoryGroup').style.display = 'none';
    });

    document.getElementById('txCategory').addEventListener('change', function () {
        const customCategoryGroup = document.getElementById('customCategoryGroup');
        const customCategoryInput = document.getElementById('txCustomCategory');
        const subcategoryGroup = document.getElementById('txDescriptionSelect').parentElement;

        if (this.value === '__add_category__') {
            customCategoryGroup.style.display = 'block';
            customCategoryInput.required = true;
            customCategoryInput.focus();
            subcategoryGroup.style.display = 'none';
            document.getElementById('txDescriptionSelect').required = false;
        } else {
            customCategoryGroup.style.display = 'none';
            customCategoryInput.required = false;
            customCategoryInput.value = '';
            subcategoryGroup.style.display = 'block';
            document.getElementById('txDescriptionSelect').required = true;
            updateDescriptionSuggestions(this.value, document.getElementById('txType').value);
        }
    });

    document.getElementById('txDescriptionSelect').addEventListener('change', function () {
        const customGroup = document.getElementById('customDescriptionGroup');
        const customInput = document.getElementById('txCustomDescription');
        const customLabel = document.querySelector('label[for="txCustomDescription"]');

        if (this.value === '__custom__' || this.value === '__add_subcategory__') {
            customGroup.style.display = 'block';
            customInput.required = true;
            if (this.value === '__add_subcategory__') {
                customLabel.textContent = 'New Subcategory Name';
                customInput.placeholder = 'Enter subcategory name';
            } else {
                customLabel.textContent = 'Custom Note';
                customInput.placeholder = 'Enter your custom note';
            }
            customInput.focus();
        } else {
            customGroup.style.display = 'none';
            customInput.required = false;
            customInput.value = '';
        }
    });

    document.getElementById('transactionForm').addEventListener('submit', handleFormSubmit);
}

function updateDescriptionSuggestions(category, type) {
    const descSelect = document.getElementById('txDescriptionSelect');
    const customGroup = document.getElementById('customDescriptionGroup');

    descSelect.innerHTML = '<option value="">Select Subcategory</option>';
    customGroup.style.display = 'none';

    if (!category || category === '__add_category__') return;

    const subcategories = type === 'income' ? incomeSubcategories[category] : categorySubcategories[category];

    if (subcategories && subcategories.length > 0) {
        subcategories.forEach(sub => {
            const option = document.createElement('option');
            if (sub.includes('Add Subcategory')) {
                option.value = '__add_subcategory__';
                option.textContent = sub;
            } else {
                option.value = sub;
                option.textContent = sub;
            }
            descSelect.appendChild(option);
        });
    }

    const separator = document.createElement('option');
    separator.disabled = true;
    separator.textContent = '──────────────';
    descSelect.appendChild(separator);

    const customOption = document.createElement('option');
    customOption.value = '__custom__';
    customOption.textContent = '✏️ Add Custom Note';
    descSelect.appendChild(customOption);
}

function updateModalCategories(type) {
    const categorySelect = document.getElementById('txCategory');
    categorySelect.innerHTML = '<option value="">Select Category</option>';

    const categories = type === 'income' ? incomeCategories : expenseCategories;
    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.value;
        option.textContent = `${cat.icon} ${cat.label}`;
        categorySelect.appendChild(option);
    });
}

function showAddModal() {
    editingId = null;
    document.getElementById('modalTitle').textContent = 'Add Transaction';
    document.getElementById('transactionForm').reset();
    document.getElementById('txDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('txCategory').innerHTML = '<option value="">Select Type First</option>';
    document.getElementById('txDescriptionSelect').innerHTML = '<option value="">Select Category First</option>';
    document.getElementById('customDescriptionGroup').style.display = 'none';
    document.getElementById('txCustomDescription').value = '';
    document.getElementById('transactionModal').classList.add('active');
}

function showEditModal(id) {
    // Ensure we handle numeric or string IDs
    const tx = transactions.find(t => String(t.id) === String(id));
    if (!tx) return;

    editingId = tx.id; // Store ID for update
    document.getElementById('modalTitle').textContent = 'Edit Transaction';
    document.getElementById('txDate').value = tx.date;
    document.getElementById('txType').value = tx.type;
    updateModalCategories(tx.type);
    document.getElementById('txCategory').value = tx.category;

    updateDescriptionSuggestions(tx.category, tx.type);

    const descSelect = document.getElementById('txDescriptionSelect');
    const subcategories = tx.type === 'income' ? incomeSubcategories[tx.category] : categorySubcategories[tx.category];

    if (subcategories && subcategories.includes(tx.description)) {
        descSelect.value = tx.description;
        document.getElementById('customDescriptionGroup').style.display = 'none';
    } else {
        descSelect.value = '__custom__';
        document.getElementById('customDescriptionGroup').style.display = 'block';
        document.getElementById('txCustomDescription').value = tx.description;
        document.getElementById('txCustomDescription').required = true;
    }

    document.getElementById('txAmount').value = tx.amount;
    document.getElementById('transactionModal').classList.add('active');
}

function closeModal() {
    document.getElementById('transactionModal').classList.remove('active');
    document.getElementById('customDescriptionGroup').style.display = 'none';
    document.getElementById('txCustomDescription').required = false;
    editingId = null;
}

async function handleFormSubmit(e) {
    e.preventDefault();

    const date = document.getElementById('txDate').value;
    const type = document.getElementById('txType').value;
    const category = document.getElementById('txCategory').value;
    const amount = parseFloat(document.getElementById('txAmount').value);

    // Get description
    const descSelect = document.getElementById('txDescriptionSelect').value;
    let description;
    if (descSelect === '__custom__' || descSelect === '__add_subcategory__') {
        description = document.getElementById('txCustomDescription').value;
    } else {
        description = descSelect;
    }

    const txData = {
        userId: currentUser.id,
        date,
        description,
        type,
        category,
        amount
    };

    try {
        if (editingId) {
            // UPDATE existing
            const response = await fetch(`${API_URL}/${editingId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(txData)
            });
            if (!response.ok) throw new Error('Failed to update transaction');
        } else {
            // CREATE new
            // Provide a string ID if needed, or let json-server handle it.
            // json-server auto-generates IDs if not provided, but we want unique IDs.
            // Best to let json-server handle ID generation, but 'id' field conflict might occur if we mixed types.
            // We will let json-server generate ID.
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(txData)
            });
            if (!response.ok) throw new Error('Failed to create transaction');
        }

        closeModal();
        fetchTransactions(); // Refresh list

    } catch (error) {
        console.error("Error saving transaction:", error);
        alert("Failed to save transaction. Please check the server.");
    }
}

async function deleteTransaction(id) {
    if (confirm('Are you sure you want to delete this transaction?')) {
        try {
            const response = await fetch(`${API_URL}/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Failed to delete transaction');
            fetchTransactions();
        } catch (error) {
            console.error("Error deleting transaction:", error);
            alert("Failed to delete transaction.");
        }
    }
}

function renderTransactions() {
    const tbody = document.querySelector('.transactions-table tbody');
    if (!tbody) return;

    const filterType = document.getElementById('filterType')?.value || 'all';
    const filterCategory = document.getElementById('filterCategory')?.value || 'all';

    let filtered = transactions;

    if (filterType !== 'all') {
        filtered = filtered.filter(t => t.type === filterType);
    }
    if (filterCategory !== 'all') {
        filtered = filtered.filter(t => t.category === filterCategory);
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px; color: #718096;">
                    No transactions found. Click "Add Transaction" to get started.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filtered.map(tx => {
        const catInfo = getCategoryInfo(tx.category, tx.type);
        const formattedDate = formatDate(tx.date);
        const formattedAmount = formatCurrency(tx.amount);
        // Ensure ID is passed as string to avoid JS big integer issues if any
        const safeId = String(tx.id);

        return `
            <tr data-id="${safeId}">
                <td>${formattedDate}</td>
                <td>${tx.description}</td>
                <td><span class="category-badge ${tx.type}">${catInfo.icon} ${catInfo.label}</span></td>
                <td><span class="type-badge type-${tx.type}">${tx.type === 'income' ? 'Income' : 'Expense'}</span></td>
                <td class="amount-${tx.type}">${tx.type === 'income' ? '+' : '-'} ${formattedAmount}</td>
                <td class="actions-cell">
                    <button class="btn-icon btn-edit" onclick="showEditModal('${safeId}')">✏️</button>
                    <button class="btn-icon btn-delete" onclick="deleteTransaction('${safeId}')">🗑️</button>
                </td>
            </tr>
        `;
    }).join('');
}

function getCategoryInfo(categoryValue, type) {
    const allCategories = type === 'income' ? incomeCategories : expenseCategories;
    const cat = allCategories.find(c => c.value === categoryValue);
    return cat || { label: categoryValue, icon: '📦' };
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    const settings = JSON.parse(localStorage.getItem('appSettings') || '{}');
    // Basic date formatting relative to settings, defaulting to readable string if complexity high
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatCurrency(amount) {
    // Reusing the global formatCurrency if available, else fallback
    if (window.formatCurrency) {
        return window.formatCurrency(amount);
    }
    return `₹ ${amount.toLocaleString('en-IN')}`;
}

function attachActionHandlers() {
    // Handled inline
}

function filterTransactions() {
    renderTransactions();
}

window.showEditModal = showEditModal;
window.deleteTransaction = deleteTransaction;
window.closeModal = closeModal;
