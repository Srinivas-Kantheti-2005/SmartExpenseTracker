/* ========================================
   Income Page Controller
   ======================================== */
console.log('Income.js loaded');

(function () { // Start IIFE

    const API_BASE = window.API_BASE_URL || 'http://localhost:5001/api';

    // State
    // State
    const navEntry = performance.getEntriesByType("navigation")[0];
    const navType = navEntry ? navEntry.type : 'navigate';

    let currentYear, currentMonth;

    if (navType === 'reload' || navType === 'back_forward') {
        const savedYear = localStorage.getItem('selectedIncomeYear');
        const savedMonth = localStorage.getItem('selectedIncomeMonth');
        currentYear = savedYear ? parseInt(savedYear) : new Date().getFullYear();
        currentMonth = savedMonth ? parseInt(savedMonth) : new Date().getMonth() + 1;
    } else {
        const today = new Date();
        currentYear = today.getFullYear();
        currentMonth = today.getMonth() + 1;
        // Update storage
        localStorage.setItem('selectedIncomeYear', currentYear);
        localStorage.setItem('selectedIncomeMonth', currentMonth);
    }
    let monthIncomes = [];
    let allCategories = [];
    let allItems = [];
    let currentUser = null;
    let editingId = null; // State for inline editing

    // Safe Execution
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initIncomePage);
    } else {
        initIncomePage();
    }

    async function initIncomePage() {
        console.log('Initializing Income Page...');

        // Auth Check
        const userStr = localStorage.getItem('user');
        const token = localStorage.getItem('token');

        if (!userStr) {
            console.warn('No user found, redirecting...');
            window.location.href = '../auth/login.html';
            return;
        }

        try {
            currentUser = JSON.parse(userStr);
        } catch (e) {
            console.error('Invalid user data');
            window.location.href = '../auth/login.html';
            return;
        }

        setupEventListeners();

        // 1. Load Categories FIRST
        await fetchCategories();

        // 2. Populate Categories
        populateCategorySelect();
        setupDependentDropdown();

        // 3. UI Updates
        updateMonthDisplay();

        // Set default date to today using Flatpickr
        const dateInput = document.getElementById('income-date');
        if (dateInput && typeof flatpickr !== 'undefined') {
            flatpickr(dateInput, {
                dateFormat: "Y-m-d",
                defaultDate: new Date(),
                altInput: true,
                altFormat: "d/m/Y", // e.g., 01/02/2026
                theme: "material_blue"
            });
            // Initially disable the date field until category is selected
            if (dateInput._flatpickr) {
                dateInput._flatpickr.input.disabled = true;
                if (dateInput._flatpickr.altInput) dateInput._flatpickr.altInput.disabled = true;
            } else {
                dateInput.disabled = true;
            }
        }

        // 4. Load Data
        loadIncomes();
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

                        // Save to localStorage
                        localStorage.setItem('selectedIncomeYear', currentYear);
                        localStorage.setItem('selectedIncomeMonth', currentMonth);

                        updateMonthDisplay();
                        loadIncomes();
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
        }

        // Buttons
        const resetBtn = document.getElementById('reset-form-btn');
        if (resetBtn) resetBtn.addEventListener('click', resetForm);

        const form = document.getElementById('income-form');
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
        // Save to localStorage
        localStorage.setItem('selectedIncomeYear', currentYear);
        localStorage.setItem('selectedIncomeMonth', currentMonth);

        updateMonthDisplay();
        loadIncomes();
    }

    function updateMonthDisplay() {
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        const displayEl = document.getElementById('current-month');
        if (displayEl) {
            displayEl.textContent = `${monthNames[currentMonth - 1]} ${currentYear}`;
        }
        if (window.updateFlatpickrDate) {
            window.updateFlatpickrDate(currentYear, currentMonth);
        }
    }

    /* --- Data Fetching --- */

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

    async function fetchCategories() {
        try {
            // Fetch categories from new API (includes subcategories nested)
            const catRes = await fetch(`${API_BASE}/categories`, { headers: getAuthHeaders() });
            const catData = await catRes.json();

            if (!catData.success || !catData.data) {
                throw new Error(catData.error?.message || 'Failed to load categories');
            }

            // Transform API data to match expected format - filter only income
            allCategories = [];
            allItems = [];

            catData.data.forEach(cat => {
                // Only income categories
                if (cat.type === 'income') {
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

            console.log(`Loaded: ${allCategories.length} income categories, ${allItems.length} items`);
            window.catFetchError = null;

        } catch (error) {
            console.error('Error fetching categories/items:', error);
            window.catFetchError = error.message;
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
            });
        }
    }

    function populateCategorySelect() {
        const select = document.getElementById('category-select');
        if (!select) return;

        // Default option
        select.innerHTML = '<option value="" disabled selected>Select Category</option>';

        if (allCategories.length === 0) {
            const option = document.createElement('option');
            option.disabled = true;
            // Check if we have a global error
            if (window.catFetchError) {
                option.textContent = "Error: " + window.catFetchError;
            } else {
                option.textContent = "No income categories found";
            }
            select.appendChild(option);
            return;
        }

        allCategories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id;
            // Use cat.icon directly
            option.textContent = `${cat.icon || '💰'} ${cat.name}`;
            select.appendChild(option);
        });
    }

    function populateItemSelect(categoryId) {
        const itemSelect = document.getElementById('item-select');
        const dateInput = document.getElementById('income-date');
        if (!itemSelect) return;

        itemSelect.innerHTML = '<option value="" disabled selected>Select Item</option>';

        if (!categoryId) {
            itemSelect.disabled = true;
            if (dateInput) {
                if (dateInput._flatpickr) {
                    dateInput._flatpickr.input.disabled = true;
                    if (dateInput._flatpickr.altInput) dateInput._flatpickr.altInput.disabled = true;
                } else {
                    dateInput.disabled = true;
                }
            }
            return;
        }

        // Enable fields when category is selected
        itemSelect.disabled = false;
        if (dateInput) {
            if (dateInput._flatpickr) {
                dateInput._flatpickr.input.disabled = false;
                if (dateInput._flatpickr.altInput) dateInput._flatpickr.altInput.disabled = false;
            } else {
                dateInput.disabled = false;
            }
        }

        // Filter items for this category
        // Handle both camelCase and snake_case
        const items = allItems.filter(item => {
            const cId = item.categoryId || item.category_id;
            return cId == categoryId;
        });

        if (items.length === 0) {
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
    }

    async function loadIncomes() {
        if (!currentUser) return;
        try {
            // Calculate Start and End Date for the month
            // Format: YYYY-MM-DD
            const startDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
            // Get last day of month
            const lastDay = new Date(currentYear, currentMonth, 0).getDate();
            const endDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${lastDay}`;

            // Fetch Transactions with type=income
            // Use date_gte and date_lte for range filtering in json-server
            // Add userId to filter by current user
            const url = `${API_BASE}/transactions?userId=${currentUser.id}&type=income&date_gte=${startDate}&date_lte=${endDate}&_sort=date&_order=desc`;

            console.log('Fetching incomes from:', url);

            const res = await fetch(url, { headers: getAuthHeaders() });
            const data = await res.json();

            // Handle both simple array and data wrapper
            monthIncomes = Array.isArray(data) ? data : (data.data || []);
            if (!Array.isArray(monthIncomes)) monthIncomes = [];

            console.log(`Loaded ${monthIncomes.length} incomes for ${startDate} to ${endDate}`);

            // Client-side sort: Latest Date First, then Latest ID First (stable)
            monthIncomes.sort((a, b) => {
                const dateDiff = new Date(b.date) - new Date(a.date);
                if (dateDiff !== 0) return dateDiff;
                return b.id - a.id;
            });

            renderIncomes();
            calculateTotalIncome();

        } catch (error) {
            console.error('Failed to load incomes:', error);
            monthIncomes = [];
            renderIncomes();
            calculateTotalIncome();
        }
    }


    function calculateTotalIncome() {
        const total = monthIncomes.reduce((sum, inc) => sum + (parseFloat(inc.amount) || 0), 0);
        const display = document.getElementById('total-income-display');
        if (display) {
            display.textContent = `₹ ${total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
    }

    function renderIncomes() {
        const tbody = document.getElementById('income-list-body');
        const emptyState = document.getElementById('no-incomes-message');
        const table = document.querySelector('.income-table');

        if (!tbody) return;
        tbody.innerHTML = '';

        if (monthIncomes.length === 0) {
            table.style.display = 'none';
            emptyState.style.display = 'flex';
            return;
        }

        table.style.display = 'table';
        emptyState.style.display = 'none';

        monthIncomes.forEach(inc => {
            const tr = document.createElement('tr');
            const isEditing = editingId === inc.id;

            if (isEditing) {
                // --- EDIT MODE ---
                tr.classList.add('editing-row');

                // Category Options
                const catsOptions = allCategories.map(c =>
                    `<option value="${c.id}" ${c.id == inc.category_id ? 'selected' : ''}>${c.icon} ${c.name}</option>`
                ).join('');

                // Item Options (Filtered by current category)
                const currentCatItems = allItems.filter(i => (i.categoryId || i.category_id) == inc.category_id);
                let itemsOptions = currentCatItems.map(i =>
                    `<option value="${i.id}" ${i.id == inc.item_id ? 'selected' : ''}>${i.name}</option>`
                ).join('');

                // If no items, show select
                if (currentCatItems.length === 0) itemsOptions = '<option value="" disabled>No Items</option>';

                tr.innerHTML = `
                <td><input type="date" id="edit-date-${inc.id}" value="${inc.date}" class="single-line-input" style="height: 36px !important; padding: 0 8px;"></td>
                <td>
                    <div class="select-wrapper">
                        <select id="edit-cat-${inc.id}" style="height: 36px !important; padding-right: 32px;">${catsOptions}</select>
                    </div>
                </td>
                <td>
                    <div class="select-wrapper">
                        <select id="edit-item-${inc.id}" style="height: 36px !important; padding-right: 32px;">${itemsOptions}</select>
                    </div>
                </td>
                <td><input type="text" id="edit-desc-${inc.id}" value="${inc.description || ''}" class="single-line-input" style="height: 36px !important;"></td>
                <td><input type="number" id="edit-amount-${inc.id}" value="${Number(inc.amount).toFixed(2)}" class="single-line-input edit-amount-input" step="0.01" style="height: 36px !important; font-weight: 700; color: #15803d;"></td>
                <td style="text-align: right;">
                    <div class="action-buttons">
                        <button class="action-btn save-btn" title="Save">✔</button>
                        <button class="action-btn cancel-btn" title="Cancel">✖</button>
                    </div>
                </td>
            `;

                // Editing Listeners
                const catSelect = tr.querySelector(`#edit-cat-${inc.id}`);
                const itemSelect = tr.querySelector(`#edit-item-${inc.id}`);
                const saveBtn = tr.querySelector('.save-btn');
                const cancelBtn = tr.querySelector('.cancel-btn');
                const dateInput = tr.querySelector(`#edit-date-${inc.id}`);

                // Initialize Flatpickr for Edit Date
                if (typeof flatpickr !== 'undefined' && dateInput) {
                    flatpickr(dateInput, {
                        dateFormat: "Y-m-d",
                        defaultDate: inc.date,
                        altInput: true,
                        altFormat: "d/m/Y",
                        theme: "material_blue"
                    });
                }

                // Dynamic Item Filter
                catSelect.addEventListener('change', (e) => {
                    const newCatId = e.target.value;
                    const newItems = allItems.filter(i => (i.categoryId || i.category_id) == newCatId);
                    itemSelect.innerHTML = newItems.length
                        ? newItems.map(i => `<option value="${i.id}">${i.name}</option>`).join('')
                        : '<option value="" disabled selected>No Items</option>';
                });

                saveBtn.addEventListener('click', () => updateIncome(inc.id));
                cancelBtn.addEventListener('click', () => cancelEditing());

            } else {
                // --- VIEW MODE ---
                let catName = 'Unknown';
                let catIcon = '💰';
                const cat = allCategories.find(c => c.id == inc.category_id);
                if (cat) { catName = cat.name; catIcon = cat.icon; }
                else if (inc.category && inc.category.name) { catName = inc.category.name; catIcon = inc.category.icon || '💰'; }

                let itemName = '—';
                const item = allItems.find(i => i.id == inc.item_id);
                if (item) itemName = item.name;
                else if (inc.item && inc.item.name) itemName = inc.item.name;

                const dateObj = new Date(inc.date);
                const dateStr = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });

                tr.innerHTML = `
                <td>${dateStr}</td>
                <td>
                    <div class="category-cell">
                        <span class="category-icon">${catIcon}</span>
                        <span>${catName}</span>
                    </div>
                </td>
                <td>${itemName}</td>
                <td style="color: #64748b; font-size: 13px;">${inc.description || '—'}</td>
                <td class="amount-positive">₹ ${Number(inc.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td style="text-align: right;">
                    <div class="action-buttons">
                        <button class="btn-icon edit-btn" title="Edit">✏️</button>
                        <button class="btn-icon delete-btn" title="Delete">🗑️</button>
                    </div>
                </td>
            `;

                tr.querySelector('.edit-btn').addEventListener('click', () => startEditing(inc.id));
                tr.querySelector('.delete-btn').addEventListener('click', () => deleteIncome(inc.id));
            }

            tbody.appendChild(tr);
        });
    }

    function startEditing(id) {
        editingId = id;
        renderIncomes();
    }

    function cancelEditing() {
        editingId = null;
        renderIncomes();
    }

    async function updateIncome(id) {
        const date = document.getElementById(`edit-date-${id}`).value;
        const catId = document.getElementById(`edit-cat-${id}`).value;
        const itemId = document.getElementById(`edit-item-${id}`).value;
        const desc = document.getElementById(`edit-desc-${id}`).value;
        const amount = document.getElementById(`edit-amount-${id}`).value;

        if (!catId || !amount || !date) {
            alert('Please fill required fields');
            return;
        }

        try {
            const url = `${API_BASE}/transactions/${id}`;
            const res = await fetch(url, {
                method: 'PATCH',
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: currentUser.id,
                    email: currentUser.email,
                    date,
                    category_id: catId,
                    item_id: itemId || null,
                    description: desc,
                    amount: Number(amount)
                })
            });

            if (res.ok) {
                editingId = null;
                loadIncomes();
            } else {
                console.error('Update failed');
                alert('Failed to update income');
            }
        } catch (error) {
            console.error('Error updating income:', error);
        }
    }

    async function handleFormSubmit(e) {
        e.preventDefault();

        if (!currentUser || !currentUser.id) {
            alert('User session invalid. Please login again.');
            return;
        }

        const categoryId = document.getElementById('category-select').value;
        const itemId = document.getElementById('item-select').value;
        const dateVal = document.getElementById('income-date').value;
        const amount = document.getElementById('income-amount').value;
        const note = document.getElementById('income-note').value;

        if (!categoryId || !dateVal || !amount) {
            alert('Please fill in required fields');
            return;
        }

        const payload = {
            userId: currentUser.id,
            email: currentUser.email,
            type: 'income',
            category_id: categoryId,
            item_id: itemId || null,
            date: dateVal,
            amount: parseFloat(amount),
            description: note
        };

        console.log('Sending Payload:', payload);

        try {
            const res = await fetch(`${API_BASE}/transactions`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                resetForm();
                const addedMonth = new Date(dateVal).getMonth() + 1;
                const addedYear = new Date(dateVal).getFullYear();

                if (addedMonth === currentMonth && addedYear === currentYear) {
                    loadIncomes();
                } else {
                    alert('Income added successfully to another month.');
                }
            } else {
                // Read text ONLY ONCE to avoid "body used" errors
                const rawText = await res.text();
                let msg = 'Failed to add income';

                try {
                    const d = JSON.parse(rawText);
                    console.error('Server Error JSON:', d);
                    msg = d.message || d.error || JSON.stringify(d) || msg;
                } catch (parseErr) {
                    console.error('Server Error Text:', rawText);
                    msg = rawText || msg; // Use raw text if available
                }

                alert(`Error (${res.status}): ${msg}`);
            }
        } catch (error) {
            console.error('Error adding income:', error);
            alert('Error: ' + error.message);
        }
    }

    async function deleteIncome(id) {
        if (!confirm('Are you sure you want to delete this income record?')) return;

        try {
            const res = await fetch(`${API_BASE}/transactions/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (res.ok) {
                loadIncomes();
            } else {
                alert('Failed to delete income');
            }
        } catch (error) {
            console.error('Error deleting income:', error);
            alert('An error occurred.');
        }
    }

    function resetForm() {
        const catSelect = document.getElementById('category-select');
        const itemSelect = document.getElementById('item-select');

        if (catSelect) catSelect.value = "";
        if (itemSelect) {
            itemSelect.value = "";
            itemSelect.disabled = true;
            itemSelect.innerHTML = '<option value="" disabled selected>Select Item</option>';
        }

        document.getElementById('income-amount').value = "";
        document.getElementById('income-note').value = "";

        // Reset date to today using Flatpickr and disable it
        const dateInput = document.getElementById('income-date');
        if (dateInput) {
            if (dateInput._flatpickr) {
                dateInput._flatpickr.setDate(new Date());
                dateInput._flatpickr.input.disabled = true;
                if (dateInput._flatpickr.altInput) dateInput._flatpickr.altInput.disabled = true;
            } else {
                dateInput.valueAsDate = new Date();
                dateInput.disabled = true;
            }
        }
    }

})();
