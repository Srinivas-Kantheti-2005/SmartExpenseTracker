/* ========================================
   Budget Page Controller
   ======================================== */
console.log('Budget.js loaded');

(function () { // Start IIFE

    const BUDGET_API_BASE = window.API_BASE_URL || 'http://localhost:5001/api';

    // State
    const navEntry = performance.getEntriesByType("navigation")[0];
    const navType = navEntry ? navEntry.type : 'navigate';

    let currentMonth, currentYear;

    if (navType === 'reload' || navType === 'back_forward') {
        const savedYear = localStorage.getItem('selectedBudgetYear');
        const savedMonth = localStorage.getItem('selectedBudgetMonth');
        currentMonth = savedMonth ? parseInt(savedMonth) : new Date().getMonth() + 1;
        currentYear = savedYear ? parseInt(savedYear) : new Date().getFullYear();
    } else {
        // Reset to Current Date on fresh navigation
        const today = new Date();
        currentMonth = today.getMonth() + 1;
        currentYear = today.getFullYear();
        // Update storage to reflect reset
        localStorage.setItem('selectedBudgetYear', currentYear);
        localStorage.setItem('selectedBudgetMonth', currentMonth);
    }
    let monthBudgets = [];
    let allCategories = [];
    let allItems = []; // All items
    let filteredItems = []; // Items for selected category
    let currentUser = null;
    let authToken = null;

    let editingBudgetId = null;
    let formTitle = null;
    let saveBtn = null;
    let cancelBtn = null;
    let formMonthPicker = null;

    // Safe Execution
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initBudgetPage);
    } else {
        initBudgetPage();
    }

    async function initBudgetPage() {
        console.log('Initializing Budget Page...');

        // Auth Check
        const userStr = localStorage.getItem('user');
        const token = localStorage.getItem('token'); // Get Token

        if (!userStr) {
            console.warn('No user/token found, redirecting...');
            window.location.href = '../auth/login.html';
            return;
        }

        try {
            currentUser = JSON.parse(userStr);
            authToken = token;
        } catch (e) {
            console.error('Invalid user data');
            window.location.href = '../auth/login.html';
            return;
        }

        formTitle = document.getElementById('form-title');
        saveBtn = document.getElementById('save-budget-btn');
        cancelBtn = document.getElementById('cancel-edit-btn');

        // Date state already initialized at top

        setupEventListeners();

        // 1. Load Categories FIRST
        await fetchCategories();

        // 2. Populate Categories
        populateCategorySelect();
        setupDependentDropdown();

        // 3. UI Updates
        updateMonthDisplay();

        // 4. Load Data
        loadBudgets();
    }

    function setupEventListeners() {
        document.getElementById('prev-month')?.addEventListener('click', () => changeMonth(-1));
        document.getElementById('next-month')?.addEventListener('click', () => changeMonth(1));

        if (typeof flatpickr !== 'undefined') {
            const fp = flatpickr("#month-picker", {
                dateFormat: "Y-m-d",
                defaultDate: `${currentYear}-${currentMonth}-01`,
                clickOpens: false,
                positionElement: document.querySelector('.date-display-container'),
                plugins: [
                    new monthSelectPlugin({
                        shorthand: true,
                        dateFormat: "Y-m-d",
                        altFormat: "F Y",
                        theme: "material_blue"
                    })
                ],
                onChange: function (selectedDates, dateStr, instance) {
                    if (selectedDates.length > 0) {
                        const date = selectedDates[0];
                        currentYear = date.getFullYear();
                        currentMonth = date.getMonth() + 1;

                        // Save State
                        localStorage.setItem('selectedBudgetYear', currentYear);
                        localStorage.setItem('selectedBudgetMonth', currentMonth);

                        updateMonthDisplay();
                        loadBudgets();
                    }
                }
            });

            const iconTrigger = document.getElementById('calendar-icon-trigger');
            if (iconTrigger) {
                iconTrigger.addEventListener('click', (e) => {
                    e.stopPropagation();
                    fp.toggle();
                });
            }

            window.updateFlatpickrDate = (year, month) => {
                fp.setDate(`${year}-${month}-01`, false);
            };

            // Form Month Picker
            const formMonthInput = document.getElementById('budget-month-display');
            if (formMonthInput) {
                formMonthPicker = flatpickr(formMonthInput, {
                    plugins: [
                        new monthSelectPlugin({
                            shorthand: true, // Short Month Names (Jan, Feb) in picker
                            dateFormat: "Y-m-d",
                            altFormat: "M-Y", // Jan-2026
                            theme: "material_blue"
                        })
                    ],
                    disableMobile: "true",
                    allowInput: true,
                    altInput: true,
                    altFormat: "M-Y", // Display shorthand month and year
                    dateFormat: "Y-m-d",
                    defaultDate: `${currentYear}-${currentMonth}-01`,
                });
            }
        }

        // Buttons
        const resetBtn = document.getElementById('reset-form-btn');
        if (resetBtn) resetBtn.addEventListener('click', resetForm);

        if (cancelBtn) cancelBtn.addEventListener('click', resetForm);

        const form = document.getElementById('budget-form');
        if (form) form.addEventListener('submit', handleFormSubmit);
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


        // Save State
        localStorage.setItem('selectedBudgetYear', currentYear);
        localStorage.setItem('selectedBudgetMonth', currentMonth);

        updateMonthDisplay();
        loadBudgets();
        resetForm();
    }

    function updateMonthDisplay() {
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        const shortMonthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        const displayEl = document.getElementById('current-month');
        if (displayEl) {
            displayEl.textContent = `${monthNames[currentMonth - 1]} ${currentYear}`;
        }
        if (window.updateFlatpickrDate) {
            window.updateFlatpickrDate(currentYear, currentMonth);
        }

        // Update the form display
        // Update the form display
        if (formMonthPicker) {
            formMonthPicker.setDate(`${currentYear}-${currentMonth}-01`, true);
        } else {
            // Fallback
            const formDisplay = document.getElementById('budget-month-display');
            if (formDisplay) {
                const shortMonthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                formDisplay.value = `${shortMonthNames[currentMonth - 1]}-${currentYear}`;
            }
        }
    }

    async function fetchCategories() {
        try {
            // Fetch categories from new API (includes subcategories nested)
            const catRes = await fetch(`${BUDGET_API_BASE}/categories`, { headers: getAuthHeaders() });
            const catData = await catRes.json();

            if (!catData.success || !catData.data) {
                throw new Error(catData.error?.message || 'Failed to load categories');
            }

            // Transform API data to match expected format - filter only expense
            allCategories = [];
            allItems = [];

            catData.data.forEach(cat => {
                // Only expense categories (budgets are for expenses)
                if (cat.type === 'expense') {
                    allCategories.push({
                        id: cat.id,
                        name: cat.name,
                        type: cat.type,
                        icon: cat.icon,
                        color: cat.color
                    });

                    // Subcategories (items)
                    if (cat.subcategories && cat.subcategories.length > 0) {
                        cat.subcategories.forEach(sub => {
                            allItems.push({
                                id: sub.id,
                                name: sub.name,
                                categoryId: cat.id
                            });
                        });
                    }
                }
            });

            console.log(`Loaded: ${allCategories.length} expense categories, ${allItems.length} items`);
        } catch (error) {
            console.error('Error fetching categories/items:', error);
            allCategories = [];
            allItems = [];
        }
    }

    function setupDependentDropdown() {
        const catSelect = document.getElementById('category-select');
        const itemSelect = document.getElementById('item-select');

        if (catSelect && itemSelect) {
            catSelect.addEventListener('change', () => {
                const categoryId = catSelect.value;
                populateItemSelect(categoryId);

                // Enable Month Picker if category selected
                if (formMonthPicker) {
                    const shouldDisable = !categoryId;
                    formMonthPicker.input.disabled = shouldDisable;
                    if (formMonthPicker.altInput) formMonthPicker.altInput.disabled = shouldDisable;
                }
            });
        }
    }

    function populateItemSelect(categoryId, selectedItemId = null) {
        const itemSelect = document.getElementById('item-select');
        if (!itemSelect) return;

        itemSelect.innerHTML = '<option value="" disabled selected>Select Item</option>';

        if (!categoryId) {
            itemSelect.disabled = true;
            return;
        }

        // Filter items for this category
        const items = allItems.filter(item => item.categoryId === categoryId);

        if (items.length === 0) {
            itemSelect.disabled = true;
            const option = document.createElement('option');
            option.text = "No items found";
            itemSelect.add(option);
            return;
        }

        itemSelect.disabled = false;
        items.forEach(item => {
            const option = document.createElement('option');
            option.value = item.id;
            option.text = item.name;
            itemSelect.add(option);
        });

        if (selectedItemId) {
            itemSelect.value = selectedItemId;
        }
    }

    function populateCategorySelect() {
        const select = document.getElementById('category-select');
        if (!select) {
            console.error('Category select element not found!');
            return;
        }

        const currentVal = select.value;
        select.innerHTML = '<option value="" disabled selected>Select Category</option>';

        if (!allCategories || allCategories.length === 0) {
            console.warn('No categories available to populate.');
            const option = document.createElement('option');
            option.disabled = true;
            option.textContent = "No categories found";
            select.appendChild(option);
            return;
        }

        allCategories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id;
            // Use cat.icon directly
            option.textContent = `${cat.icon || '📁'} ${cat.name}`;
            select.appendChild(option);
        });

        if (currentVal) select.value = currentVal;
        console.log(`Populated ${allCategories.length} categories.`);
    }

    function getAuthHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };
        const token = localStorage.getItem('token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
    }

    async function loadBudgets() {
        if (!currentUser) return;
        try {
            const res = await fetch(`${BUDGET_API_BASE}/budgets?userId=${currentUser.id}&month=${currentMonth}&year=${currentYear}`, {
                headers: getAuthHeaders()
            });
            const data = await res.json();
            monthBudgets = Array.isArray(data) ? data : (data.success ? data.data : []);

            // Sort by ID descending (Latest first)
            monthBudgets.sort((a, b) => b.id - a.id);

            renderBudgets();
        } catch (error) {
            console.error('Failed to load budgets:', error);
            monthBudgets = [];
            renderBudgets();
        }
    }

    function renderBudgets() {
        const tbody = document.getElementById('budget-list-body');
        const emptyState = document.getElementById('no-budgets-message');
        const table = document.querySelector('.budget-table');

        if (!tbody) return;
        tbody.innerHTML = '';

        if (monthBudgets.length === 0) {
            table.style.display = 'none';
            emptyState.style.display = 'flex'; // Use flex to maintain centering
            return;
        }

        table.style.display = 'table';
        emptyState.style.display = 'none';

        monthBudgets.forEach(budget => {
            const tr = document.createElement('tr');

            if (editingBudgetId === budget.id) {
                // RENDER INLINE EDIT ROW
                tr.classList.add('inline-edit-row');

                // Create Category Select
                let catOptions = allCategories.map(c =>
                    `<option value="${c.id}" ${c.id === budget.category_id ? 'selected' : ''}>${c.icon} ${c.name}</option>`
                ).join('');

                // Get items for the current budget category
                const items = allItems.filter(i => i.categoryId === budget.category_id);
                let itemOptions = items.map(i =>
                    `<option value="${i.id}" ${i.id === budget.item_id ? 'selected' : ''}>${i.name}</option>`
                ).join('');
                if (items.length === 0) itemOptions = '<option value="">No items found</option>';
                else itemOptions = '<option value="">None</option>' + itemOptions;

                if (items.length === 0) itemOptions = '<option value="">No items found</option>';
                else itemOptions = '<option value="">None</option>' + itemOptions;

                tr.innerHTML = `
                <td>
                    <input type="text" class="inline-month-picker" style="width: 100%; padding: 4px;" placeholder="Select Month">
                </td>
                <td>
                    <select class="inline-cat-select" style="width: 100%; padding: 4px;">
                        ${catOptions}
                    </select>
                </td>
                <td>
                    <select class="inline-item-select" style="width: 100%; padding: 4px;" ${items.length === 0 ? 'disabled' : ''}>
                        ${itemOptions}
                    </select>
                </td>
                <td>
                    <input type="number" class="inline-amount-input" value="${Number(budget.amount || budget.budget_amount).toFixed(2)}" step="0.01" style="width: 100%; padding: 4px;">
                </td>
                <td style="text-align: right;">
                    <div class="action-buttons" style="justify-content: flex-end;">
                        <button class="action-btn save-btn save-inline-btn" title="Save">✔</button>
                        <button class="action-btn cancel-btn cancel-inline-btn" title="Cancel">✖</button>
                    </div>
                </td>
                `;

                // Event Listeners for inline elements
                const catSelect = tr.querySelector('.inline-cat-select');
                const itemSelect = tr.querySelector('.inline-item-select');
                const monthInput = tr.querySelector('.inline-month-picker');

                // Initialize Month Picker
                const fp = flatpickr(monthInput, {
                    plugins: [
                        new monthSelectPlugin({
                            shorthand: true,
                            dateFormat: "Y-m-d",
                            altFormat: "M-Y",
                            theme: "material_blue"
                        })
                    ],
                    disableMobile: "true",
                    allowInput: true,
                    altInput: true,
                    defaultDate: new Date(budget.year, budget.month - 1, 1),
                });

                catSelect.addEventListener('change', () => {
                    const newCatId = catSelect.value;
                    const newItems = allItems.filter(i => i.categoryId === newCatId);
                    itemSelect.innerHTML = '<option value="">None</option>' + newItems.map(i =>
                        `<option value="${i.id}">${i.name}</option>`
                    ).join('');
                    itemSelect.disabled = newItems.length === 0;
                    if (newItems.length === 0) itemSelect.innerHTML = '<option value="">No items found</option>';
                });

                tr.querySelector('.save-inline-btn').addEventListener('click', () => saveInlineEdit(budget.id, tr));
                tr.querySelector('.cancel-inline-btn').addEventListener('click', () => {
                    editingBudgetId = null;
                    renderBudgets();
                });

            } else {
                // RENDER STATIC ROW
                const cat = allCategories.find(c => c.id === budget.category_id);
                const catName = cat ? cat.name : 'Unknown Category';
                const catIcon = cat ? cat.icon : '📁';

                const item = allItems.find(i => i.id === budget.item_id);
                const itemName = item ? item.name : '—';

                const amount = budget.budget_amount !== undefined ? budget.budget_amount : (budget.amount || 0);

                const bDate = new Date(budget.year, budget.month - 1);
                const monthStr = bDate.toLocaleString('default', { month: 'short' });

                tr.innerHTML = `
                <td style="color: #64748b; font-weight: 500;">${monthStr}-${budget.year}</td>
                <td>
                    <div class="category-cell">
                        <span class="category-icon">${catIcon}</span>
                        <span>${catName}</span>
                    </div>
                </td>
                <td>${itemName}</td>
                <td style="font-weight: 700;">₹ ${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td style="text-align: right;">
                    <div class="action-buttons" style="justify-content: flex-end;">
                        <button class="btn-icon edit-btn">✏️</button>
                        <button class="btn-icon delete-btn">🗑️</button>
                    </div>
                </td>
                `;

                tr.querySelector('.edit-btn').addEventListener('click', () => editBudget(budget));
                tr.querySelector('.delete-btn').addEventListener('click', () => deleteBudget(budget.id));
            }
            tbody.appendChild(tr);
        });
    }

    function editBudget(budget) {
        editingBudgetId = budget.id;
        renderBudgets();
    }

    function resetForm() {
        editingBudgetId = null;
        if (formTitle) formTitle.textContent = 'Add Budget';
        if (saveBtn) saveBtn.textContent = 'Add Budget';
        if (cancelBtn) cancelBtn.style.display = 'none';

        const catSelect = document.getElementById('category-select');
        const itemSelect = document.getElementById('item-select');

        if (catSelect) catSelect.value = "";
        if (itemSelect) {
            itemSelect.value = "";
            itemSelect.disabled = true;
            itemSelect.innerHTML = '<option value="" disabled selected>Select Item</option>';
        }
        document.getElementById('budget-amount').value = "";

        // Disable Month Picker on reset
        if (formMonthPicker) {
            formMonthPicker.input.disabled = true;
            if (formMonthPicker.altInput) formMonthPicker.altInput.disabled = true;
        }
    }

    async function handleFormSubmit(e) {
        e.preventDefault();
        if (!currentUser) return;

        const categoryId = document.getElementById('category-select').value;
        const itemId = document.getElementById('item-select').value;
        const amount = document.getElementById('budget-amount').value;

        if (!categoryId || !amount) {
            alert('Please fill in all fields');
            return;
        }

        // Determine Month/Year from Form Picker
        let targetMonth = currentMonth;
        let targetYear = currentYear;

        if (formMonthPicker && formMonthPicker.selectedDates.length > 0) {
            const d = formMonthPicker.selectedDates[0];
            targetMonth = d.getMonth() + 1;
            targetYear = d.getFullYear();
        }

        const payload = {
            userId: currentUser.id,
            email: currentUser.email,
            category_id: categoryId,
            item_id: itemId || null, // Include item_id
            amount: parseInt(amount),
            month: targetMonth,
            year: targetYear
        };

        try {
            let url = `${BUDGET_API_BASE}/budgets`;
            let method = 'POST';

            if (editingBudgetId) {
                url = `${BUDGET_API_BASE}/budgets/${editingBudgetId}`;
                method = 'PUT';
            }

            const res = await fetch(url, {
                method: method,
                headers: getAuthHeaders(),
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                resetForm();
                loadBudgets(); // Reload to show updated list
            } else {
                if (res.status === 401) {
                    alert('Session expired. Please login again.');
                    window.location.href = '../auth/login.html';
                    return;
                }

                let msg = `Failed to save budget (${res.status} ${res.statusText})`;
                try {
                    const d = await res.json();
                    if (d.error && d.error.message) {
                        msg = d.error.message;
                    } else if (d.message) {
                        msg = d.message;
                    }
                } catch (e) { }
                alert(msg);
            }
        } catch (error) {
            console.error('Error saving budget:', error);
            alert('An error occurred while saving.');
        }
    }

    async function deleteBudget(id) {
        if (!confirm('Are you sure you want to delete this budget?')) return;
        try {
            const res = await fetch(`${BUDGET_API_BASE}/budgets/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            if (res.ok) loadBudgets();
            else alert('Failed to delete budget');
        } catch (error) {
            console.error('Error deleting:', error);
            alert('An error occurred.');
        }
    }

    async function saveInlineEdit(id, tr) {
        const catSelect = tr.querySelector('.inline-cat-select');
        const itemSelect = tr.querySelector('.inline-item-select');
        const amountInput = tr.querySelector('.inline-amount-input');
        const monthPicker = tr.querySelector('.inline-month-picker')._flatpickr;

        const categoryId = catSelect.value;
        const itemId = itemSelect.value || null;
        let amount = parseFloat(amountInput.value);

        if (!categoryId) {
            alert('Please select a category');
            return;
        }
        if (isNaN(amount) || amount <= 0) {
            alert('Please enter a valid amount');
            return;
        }

        // Get Month/Year from picker
        const selectedDate = monthPicker.selectedDates[0];
        if (!selectedDate) {
            alert('Please select a month');
            return;
        }
        const newMonth = selectedDate.getMonth() + 1;
        const newYear = selectedDate.getFullYear();

        try {
            const res = await fetch(`${BUDGET_API_BASE}/budgets/${id}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    category_id: parseInt(categoryId),
                    item_id: itemId ? parseInt(itemId) : null,
                    amount: amount,
                    month: newMonth,
                    year: newYear
                })
            });
            if (res.ok) {
                editingBudgetId = null;
                loadBudgets();
            } else {
                alert('Failed to update budget');
            }
        } catch (error) {
            console.error('Error updating budget:', error);
            alert('An error occurred');
        }
    }

})(); // End IIFE
