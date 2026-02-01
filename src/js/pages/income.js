/* ========================================
   Income Page Controller
   ======================================== */
console.log('Income.js loaded');

(function () { // Start IIFE

    const API_BASE = 'http://localhost:3004'; // Standard API Base

    // State
    // State
    const savedYear = localStorage.getItem('selectedIncomeYear');
    const savedMonth = localStorage.getItem('selectedIncomeMonth');

    let currentYear = savedYear ? parseInt(savedYear) : new Date().getFullYear();
    let currentMonth = savedMonth ? parseInt(savedMonth) : new Date().getMonth() + 1;
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
            // Helper to try paths
            const fetchWithFallback = async (endpoint) => {
                // Try /api/endpoint first
                let url = `${API_BASE}/${endpoint}`;
                let res = await fetch(url, { headers: getAuthHeaders() });

                // If 404, try root path (fallback for json-server default)
                if (res.status === 404) {
                    console.warn(`404 at ${url}, trying fallback to root...`);
                    const fallbackUrl = url.replace('/api', '');
                    res = await fetch(fallbackUrl, { headers: getAuthHeaders() });
                }

                if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
                return res.json();
            };

            // 1. Fetch Types
            const typesData = await fetchWithFallback('types');
            const types = Array.isArray(typesData) ? typesData : (typesData.data || []);

            // Find "Income" type ID
            const incomeType = types.find(t => t.name.toLowerCase() === 'income');
            const incomeTypeId = incomeType ? incomeType.id : 'type-1';

            // 2. Fetch All Categories
            const catData = await fetchWithFallback('categories');
            const categories = Array.isArray(catData) ? catData : (catData.data || []);

            // 3. Filter for Income Categories
            allCategories = categories.filter(cat => {
                const tId = cat.typeId || cat.type_id;
                return tId == incomeTypeId;
            });

            // 4. Fetch All Items
            const itemsDataRaw = await fetchWithFallback('items');
            const itemsList = Array.isArray(itemsDataRaw) ? itemsDataRaw : (itemsDataRaw.data || []);

            allItems = itemsList;

            console.log(`Loaded: ${allCategories.length} categories, ${allItems.length} items. Auth Type: ${incomeTypeId}`);
            // Clear error if success
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
        if (!itemSelect) return;

        itemSelect.innerHTML = '<option value="" disabled selected>Select Item</option>';

        if (!categoryId) {
            itemSelect.disabled = true;
            return;
        }

        // Filter items for this category
        // Handle both camelCase and snake_case
        const items = allItems.filter(item => {
            const cId = item.categoryId || item.category_id;
            return cId == categoryId;
        });

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

        // Sync "Add Income" Form Date
        const incomeDateInput = document.getElementById('income-date');
        if (incomeDateInput && incomeDateInput._flatpickr) {
            // Use today's day number, projected into the selected month
            // Handle edge cases where selected month has fewer days than today's day (e.g. 31st -> 28th Feb)
            const today = new Date();
            const worldDay = today.getDate();
            const daysInTargetMonth = new Date(currentYear, currentMonth, 0).getDate();
            const targetDay = Math.min(worldDay, daysInTargetMonth);

            const newDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}`;
            incomeDateInput._flatpickr.setDate(newDate);
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
            // Helper to try paths
            const fetchWithFallback = async (endpoint) => {
                // Try /api/endpoint first
                let url = `${API_BASE}/${endpoint}`;
                let res = await fetch(url, { headers: getAuthHeaders() });

                // If 404, try root path (fallback for json-server default)
                if (res.status === 404) {
                    console.warn(`404 at ${url}, trying fallback to root...`);
                    const fallbackUrl = url.replace('/api', '');
                    res = await fetch(fallbackUrl, { headers: getAuthHeaders() });
                }

                if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
                return res.json();
            };

            // 1. Fetch Types
            const typesData = await fetchWithFallback('types');
            const types = Array.isArray(typesData) ? typesData : (typesData.data || []);

            // Find "Income" type ID
            const incomeType = types.find(t => t.name.toLowerCase() === 'income');
            const incomeTypeId = incomeType ? incomeType.id : 'type-1';

            // 2. Fetch All Categories
            const catData = await fetchWithFallback('categories');
            const categories = Array.isArray(catData) ? catData : (catData.data || []);

            // 3. Filter for Income Categories
            allCategories = categories.filter(cat => {
                const tId = cat.typeId || cat.type_id;
                return tId == incomeTypeId;
            });

            // 4. Fetch All Items
            const itemsDataRaw = await fetchWithFallback('items');
            const itemsList = Array.isArray(itemsDataRaw) ? itemsDataRaw : (itemsDataRaw.data || []);

            allItems = itemsList;

            console.log(`Loaded: ${allCategories.length} categories, ${allItems.length} items. Auth Type: ${incomeTypeId}`);
            // Clear error if success
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
        if (!itemSelect) return;

        itemSelect.innerHTML = '<option value="" disabled selected>Select Item</option>';

        if (!categoryId) {
            itemSelect.disabled = true;
            return;
        }

        // Filter items for this category
        // Handle both camelCase and snake_case
        const items = allItems.filter(item => {
            const cId = item.categoryId || item.category_id;
            return cId == categoryId;
        });

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
    }

    // (Duplicates removed)

    function calculateTotalIncome() {
        const total = monthIncomes.reduce((sum, inc) => sum + (parseFloat(inc.amount) || 0), 0);
        const display = document.getElementById('total-income-display');
        if (display) {
            display.textContent = `₹ ${total.toLocaleString()}`;
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
                <td><input type="number" id="edit-amount-${inc.id}" value="${inc.amount}" class="single-line-input edit-amount-input" style="height: 36px !important; font-weight: 700; color: #15803d;"></td>
                <td style="text-align: right;">
                    <div class="action-buttons">
                        <button class="btn-icon save-btn" style="color: #15803d; background: #f0fdf4;" title="Save">💾</button>
                        <button class="btn-icon cancel-btn" style="color: #64748b;" title="Cancel">❌</button>
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
                <td class="amount-positive">+ ₹ ${Number(inc.amount).toLocaleString()}</td>
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

        // Reset date to today using Flatpickr
        const dateInput = document.getElementById('income-date');
        if (dateInput && dateInput._flatpickr) {
            dateInput._flatpickr.setDate(new Date());
        } else if (dateInput) {
            dateInput.valueAsDate = new Date();
        }
    }

})();
