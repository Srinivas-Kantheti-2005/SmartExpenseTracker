/* ========================================
   Transactions Page Controller
   ======================================== */
console.log('Transactions.js loaded');

(function () {
    const API_BASE = window.API_BASE_URL || 'http://localhost:5001/api';

    // --- State ---
    const params = new URLSearchParams(window.location.search);
    const typeParam = params.get('type');
    const monthParam = params.get('month'); // Expects YYYY-MM

    let currentYear, currentMonth;
    let activeTypeFilters = ['expense', 'income', 'investment']; // Default all

    // 1. Initialize Date from URL > LocalStorage > Today
    if (monthParam && monthParam.includes('-')) {
        const [year, month] = monthParam.split('-').map(Number);
        currentYear = year;
        currentMonth = month;
    } else {
        const navEntry = performance.getEntriesByType("navigation")[0];
        const navType = navEntry ? navEntry.type : 'navigate';

        if (navType === 'reload' || navType === 'back_forward') {
            const savedYear = localStorage.getItem('selectedTransactionYear');
            const savedMonth = localStorage.getItem('selectedTransactionMonth');
            currentYear = savedYear ? parseInt(savedYear) : new Date().getFullYear();
            currentMonth = savedMonth ? parseInt(savedMonth) : new Date().getMonth() + 1;
        } else {
            const today = new Date();
            currentYear = today.getFullYear();
            currentMonth = today.getMonth() + 1;
        }
    }

    // 2. Initialize Type Filter from URL > Default
    if (typeParam && ['income', 'expense', 'investment'].includes(typeParam.toLowerCase())) {
        activeTypeFilters = [typeParam.toLowerCase()];
    }

    // Sync localStorage immediately
    localStorage.setItem('selectedTransactionYear', currentYear);
    localStorage.setItem('selectedTransactionMonth', currentMonth);

    let currentUser = null;

    // Data Storage
    let monthTransactions = []; // All tx for the month
    let allCategories = [];
    let allItems = [];
    let allTypes = []; // [{id: 'type-1', name: 'Income'}, ...]

    // Filter State
    let activeCategoryFilter = '';
    let activeItemFilter = '';

    // Editing State
    let editingId = null; // ID of transaction currently being edited inline

    // Constants for Type Mapping (DB IDs vs String Keys)
    let DB_TYPE_ID_MAP = {}; // { 'type-1': 'income', 'type-2': 'expense', ... }

    // --- Initialization ---
    document.addEventListener('DOMContentLoaded', initTransactionsPage);

    async function initTransactionsPage() {
        // 1. Auth Check
        const userStr = localStorage.getItem('user');
        if (!userStr) {
            window.location.href = '../auth/login.html';
            return;
        }
        currentUser = JSON.parse(userStr);

        // 2. Logic handled at top of IIFE for currentYear, currentMonth, and activeTypeFilters

        // 3. Setup Event Listeners
        setupEventListeners();

        // 4. Initial Data Load (Types -> Categories -> Items -> Transactions)
        await loadMetadata();

        // 5. Setup UI Components
        initMonthPicker();
        initFormDatePicker(); // Initialize Flatpickr for Form
        updateMonthDisplay();

        // 6. Sync filter dropdown UI if parameter was passed
        if (typeParam) {
            const filterTypeEl = document.getElementById('filter-type');
            const logicalType = typeParam.toLowerCase();

            if (filterTypeEl && ['income', 'expense', 'investment'].includes(logicalType)) {
                console.log('Force applying type filter:', logicalType);
                filterTypeEl.value = logicalType;
                activeTypeFilters = [logicalType]; // Ensure the JS state is updated too

                // Refresh category options to match the selected type
                updateFilterCategoryOptions();
            }
        }

        // 7. Load Transactions (which calls renderTransactions internally)
        await loadTransactions();
    }

    // --- Data Loading ---

    // function getAuthHeaders() { ... } // Removed, using global window.getAuthHeaders

    async function loadMetadata() {
        try {
            // Fetch categories from new API (includes subcategories nested)
            const catRes = await fetch(`${API_BASE}/categories`, { headers: getAuthHeaders() });
            const catData = await catRes.json();

            if (!catData.success || !catData.data) {
                throw new Error(catData.error?.message || 'Failed to load categories');
            }

            // Transform API data to match expected format
            allCategories = [];
            allItems = [];

            catData.data.forEach(cat => {
                // Parent category
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
            });

            // Filters
            populateFilterCategoryDropdown();
            updateFilterItemOptions(null, activeTypeFilters);

            // Add Form
            updateFormCategoryOptions('expense');

        } catch (error) {
            console.error('Failed to load metadata:', error);
            alert('Failed to load necessary data. Please check server connection.');
        }
    }

    async function loadTransactions() {
        if (!currentUser) return;

        const startDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
        const lastDay = new Date(currentYear, currentMonth, 0).getDate();
        const endDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${lastDay}`;

        try {
            const url = `${API_BASE}/transactions?startDate=${startDate}&endDate=${endDate}`;
            const res = await fetch(url, { headers: getAuthHeaders() });
            const data = await res.json();

            if (data.success && data.data) {
                monthTransactions = data.data;
            } else {
                monthTransactions = [];
                console.error('Failed to load transactions:', data.error);
            }

            renderTransactions();
        } catch (error) {
            console.error('Error loading transactions:', error);
            monthTransactions = [];
            renderTransactions();
        }
    }

    // --- UI Logic ---

    function setupEventListeners() {
        // Month Navigation
        document.getElementById('prev-month').addEventListener('click', () => changeMonth(-1));
        document.getElementById('next-month').addEventListener('click', () => changeMonth(1));

        // Filters
        document.getElementById('filter-type').addEventListener('change', (e) => {
            const val = e.target.value;
            if (val === 'all') {
                activeTypeFilters = ['expense', 'income', 'investment'];
            } else {
                activeTypeFilters = [val];
            }

            activeCategoryFilter = "";
            activeItemFilter = "";
            document.getElementById('filter-category').value = "";
            document.getElementById('filter-item').value = "";

            updateFilterCategoryOptions();
            updateFilterItemOptions(null, activeTypeFilters);
            renderTransactions();
        });

        document.getElementById('filter-category').addEventListener('change', (e) => {
            activeCategoryFilter = e.target.value;
            activeItemFilter = "";
            document.getElementById('filter-item').value = "";
            updateFilterItemOptions(activeCategoryFilter, activeTypeFilters);
            renderTransactions();
        });

        document.getElementById('filter-item').addEventListener('change', (e) => {
            activeItemFilter = e.target.value;
            renderTransactions();
        });

        document.getElementById('clear-filters-btn').addEventListener('click', () => {
            document.getElementById('filter-type').value = 'all';
            activeTypeFilters = ['expense', 'income', 'investment'];
            document.getElementById('filter-category').value = "";
            activeCategoryFilter = "";
            document.getElementById('filter-item').value = "";
            activeItemFilter = "";

            updateFilterCategoryOptions();
            updateFilterItemOptions(null, activeTypeFilters);
            renderTransactions();
        });

        // Add Form Events
        document.getElementById('tx-type').addEventListener('change', (e) => {
            updateFormCategoryOptions(e.target.value);
        });
        document.getElementById('tx-category').addEventListener('change', (e) => {
            updateFormItemOptions(e.target.value);
        });
        // Date change is handled by flatpickr config 
        // removed tx-date change listener

        // Add Form Submit (Create Only)
        document.getElementById('transaction-form').addEventListener('submit', handleAddSubmit);

        // Reset Button
        document.getElementById('reset-btn').addEventListener('click', handleResetForm);
    }

    function handleResetForm() {
        document.getElementById('transaction-form').reset();

        // Set defaults
        document.getElementById('tx-type').value = 'expense';
        updateFormCategoryOptions('expense');

        // Reset Date constraints/value
        updateFormDateConstraints();
    }

    function initFormDatePicker() {
        if (typeof flatpickr !== 'undefined') {
            flatpickr("#tx-date", {
                dateFormat: "Y-m-d",
                altInput: true,
                altFormat: "d/m/Y",
                theme: "material_blue",
                defaultDate: new Date()
            });
        }
    }

    function initMonthPicker() {
        if (typeof flatpickr !== 'undefined') {
            const fp = flatpickr("#month-picker", {
                defaultDate: new Date(currentYear, currentMonth - 1, 1),
                plugins: [new monthSelectPlugin({ shorthand: true, dateFormat: "Y-m-d", altFormat: "F Y", theme: "material_blue" })],
                onChange: function (selectedDates) {
                    if (selectedDates.length > 0) {
                        currentYear = selectedDates[0].getFullYear();
                        currentMonth = selectedDates[0].getMonth() + 1;

                        // Save State
                        localStorage.setItem('selectedTransactionYear', currentYear);
                        localStorage.setItem('selectedTransactionMonth', currentMonth);

                        updateMonthDisplay();
                        loadTransactions();
                    }
                }
            });
            document.getElementById('calendar-icon-trigger').addEventListener('click', () => fp.toggle());
        }
    }

    function changeMonth(delta) {
        currentMonth += delta;
        if (currentMonth > 12) { currentMonth = 1; currentYear++; }
        else if (currentMonth < 1) { currentMonth = 12; currentYear--; }

        // Save State
        localStorage.setItem('selectedTransactionYear', currentYear);
        localStorage.setItem('selectedTransactionMonth', currentMonth);

        updateMonthDisplay();
        loadTransactions();
    }

    function updateMonthDisplay() {
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        document.getElementById('current-month').textContent = `${monthNames[currentMonth - 1]} ${currentYear}`;
        updateFormDateConstraints();
    }

    function updateFormDateConstraints() {
        const dateInput = document.getElementById('tx-date');

        const lastDay = new Date(currentYear, currentMonth, 0).getDate();
        const min = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
        const max = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${lastDay}`;

        // Update default date if needed, but don't restrict range
        if (dateInput._flatpickr) {
            // Remove constraints if any
            dateInput._flatpickr.set('minDate', undefined);
            dateInput._flatpickr.set('maxDate', undefined);

            // Smart Default Date: Try to match "Today's Day" (e.g. 2nd), clamped to month end
            const today = new Date();
            const targetDay = Math.min(today.getDate(), lastDay);
            const defaultDateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}`;

            dateInput._flatpickr.setDate(defaultDateStr);
        }
    }

    function validateDate(input) {
        const date = new Date(input.value);
        if (isNaN(date.getTime())) return;
        if (date.getFullYear() !== currentYear || (date.getMonth() + 1) !== currentMonth) {
            alert(`Please select a date within ${document.getElementById('current-month').textContent}`);
            input.value = input.min;
        }
    }

    // --- Helpers ---

    function getTypeId(logicalType) {
        return Object.keys(DB_TYPE_ID_MAP).find(id => DB_TYPE_ID_MAP[id] === logicalType);
    }

    function getLogicalType(id) {
        return DB_TYPE_ID_MAP[id] || 'expense';
    }

    function updateFormCategoryOptions(logicalType) {
        const catSelect = document.getElementById('tx-category');
        const itemSelect = document.getElementById('tx-item');

        catSelect.innerHTML = '<option value="" disabled selected>Select Category</option>';
        itemSelect.innerHTML = '<option value="" disabled selected>Select Item</option>';
        itemSelect.disabled = true;

        const typeId = getTypeId(logicalType);
        if (!typeId) return;

        const filteredCats = allCategories.filter(c => c.type_id == typeId || c.typeId == typeId);
        filteredCats.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat.id;
            opt.textContent = `${cat.icon || '📦'} ${cat.name}`;
            catSelect.appendChild(opt);
        });

        // Color coding Amount
        const amtInput = document.getElementById('tx-amount');
        amtInput.classList.remove('amount-expense', 'amount-income', 'amount-investment');
        amtInput.classList.add(`amount-${logicalType}`);

        // Button Color
        const btn = document.getElementById('add-btn');
        if (logicalType === 'income') btn.style.background = '#16a34a';
        else if (logicalType === 'investment') btn.style.background = '#2563eb';
        else btn.style.background = '#ef4444';
    }

    function updateFormItemOptions(categoryId) {
        const itemSelect = document.getElementById('tx-item');
        itemSelect.innerHTML = '<option value="" disabled selected>Select Item</option>';
        if (!categoryId) { itemSelect.disabled = true; return; }

        const filteredItems = allItems.filter(i => i.category_id == categoryId || i.categoryId == categoryId);
        if (filteredItems.length === 0) {
            const opt = document.createElement('option');
            opt.textContent = "No predefined items";
            opt.disabled = true;
            itemSelect.appendChild(opt);
            itemSelect.disabled = true;
        } else {
            itemSelect.disabled = false;
            filteredItems.forEach(item => {
                const opt = document.createElement('option');
                opt.value = item.id;
                opt.textContent = item.name;
                itemSelect.appendChild(opt);
            });
        }
    }

    function populateFilterCategoryDropdown() {
        updateFilterCategoryOptions();
    }

    function updateFilterCategoryOptions() {
        const select = document.getElementById('filter-category');
        select.innerHTML = '<option value="">All Categories</option>';
        activeTypeFilters.forEach(type => {
            const tId = getTypeId(type);
            if (!tId) return;
            const cats = allCategories.filter(c => c.type_id == tId || c.typeId == tId);
            if (cats.length > 0) {
                const group = document.createElement('optgroup');
                group.label = type.charAt(0).toUpperCase() + type.slice(1);
                cats.forEach(c => {
                    const opt = document.createElement('option');
                    opt.value = c.id;
                    opt.textContent = `${c.icon || '📦'} ${c.name}`;
                    group.appendChild(opt);
                });
                select.appendChild(group);
            }
        });
    }

    function updateFilterItemOptions(selectedCategoryId, activeTypes) {
        const itemSelect = document.getElementById('filter-item');
        itemSelect.innerHTML = '<option value="">All Items</option>';

        const isAllTypes = activeTypes.length > 1;
        const hasCategory = !!selectedCategoryId;
        if (isAllTypes && !hasCategory) { itemSelect.disabled = true; return; }

        let validCategoryIds = [];
        if (selectedCategoryId) {
            validCategoryIds = [selectedCategoryId.toString()];
        } else {
            const activeTypeIds = activeTypes.map(t => getTypeId(t)).filter(Boolean);
            validCategoryIds = allCategories
                .filter(c => activeTypeIds.includes(String(c.type_id || c.typeId)))
                .map(c => c.id.toString());
        }

        const filteredItems = allItems.filter(i => validCategoryIds.includes(String(i.category_id || i.categoryId)));
        if (filteredItems.length === 0) { itemSelect.disabled = true; return; }
        itemSelect.disabled = false;
        filteredItems.sort((a, b) => a.name.localeCompare(b.name));

        const catMap = {};
        allCategories.forEach(c => catMap[c.id] = c.name);
        const grouped = {};
        filteredItems.forEach(item => {
            const catName = catMap[item.category_id || item.categoryId] || 'Unknown';
            if (!grouped[catName]) grouped[catName] = [];
            grouped[catName].push(item);
        });

        Object.keys(grouped).sort().forEach(catName => {
            const group = document.createElement('optgroup');
            group.label = catName;
            grouped[catName].forEach(item => {
                const opt = document.createElement('option');
                opt.value = item.id;
                opt.textContent = item.name;
                group.appendChild(opt);
            });
            itemSelect.appendChild(group);
        });
    }

    // --- CRUD ---

    async function handleAddSubmit(e) {
        e.preventDefault();
        if (!currentUser) return;
        // Collect Form Data
        const type = document.getElementById('tx-type').value;
        const categoryId = document.getElementById('tx-category').value;
        const itemId = document.getElementById('tx-item').value;
        const date = document.getElementById('tx-date').value;
        const description = document.getElementById('tx-notes').value;
        const amount = parseFloat(document.getElementById('tx-amount').value);

        if (!categoryId || !date || isNaN(amount)) { alert('Please fill required fields'); return; }

        const payload = {
            userId: currentUser.id, type, date, amount, description,
            category_id: categoryId, item_id: itemId || null,
            email: currentUser.email // Link to email
        };

        try {
            const res = await fetch(`${API_BASE}/transactions`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                // Reset form
                document.getElementById('transaction-form').reset();
                document.getElementById('tx-type').value = 'expense';
                updateFormCategoryOptions('expense');
                updateFormDateConstraints();

                loadTransactions();
            } else { alert('Failed to save'); }
        } catch (error) { console.error('Error:', error); alert('Error saving transaction'); }
    }

    async function saveInlineEdit(id) {
        const row = document.querySelector(`tr[data-id="${id}"]`);
        if (!row) return;

        // Note: For flatpickr, the input value is usually updated correctly if altInput is used
        const date = row.querySelector('.edit-date').value; // Contains YYYY-MM-DD from flatpickr
        const type = row.querySelector('.edit-type').value;
        const categoryId = row.querySelector('.edit-category').value;
        const itemId = row.querySelector('.edit-item').value;
        const description = row.querySelector('.edit-notes').value;
        const amount = parseFloat(row.querySelector('.edit-amount').value);

        if (!categoryId || !date || isNaN(amount)) { alert('Please fill required fields'); return; }

        const payload = {
            userId: currentUser.id, type, date, amount, description,
            category_id: categoryId, item_id: itemId || null,
            email: currentUser.email // Link to email
        };

        try {
            const res = await fetch(`${API_BASE}/transactions/${id}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                editingId = null;
                loadTransactions();
            } else { alert('Failed to update'); }
        } catch (e) { console.error(e); alert('Update failed'); }
    }

    async function deleteTransaction(id) {
        if (!confirm("Delete this transaction?")) return;
        try {
            const res = await fetch(`${API_BASE}/transactions/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
            if (res.ok) loadTransactions();
            else alert('Failed to delete');
        } catch (error) { console.error('Delete error:', error); }
    }

    function startEdit(tx) {
        editingId = tx.id;
        renderTransactions();
    }

    function cancelEdit() {
        editingId = null;
        renderTransactions();
    }

    // --- Rendering ---

    function renderTransactions() {
        const tbody = document.getElementById('transactions-body');
        const emptyMonth = document.getElementById('empty-state-month');
        const emptyFilter = document.getElementById('empty-state-filter');
        const table = document.querySelector('.transactions-table');

        tbody.innerHTML = '';

        let displayList = monthTransactions;

        // Apply Filters
        const filtered = displayList.filter(tx => {
            let txType = (tx.type || '').toLowerCase();
            if (!txType && tx.type_id) txType = DB_TYPE_ID_MAP[tx.type_id] || 'expense';
            if (!txType) txType = 'expense';

            if (!activeTypeFilters.includes(txType)) return false;
            if (activeCategoryFilter && String(tx.category_id || tx.categoryId) !== activeCategoryFilter) return false;
            if (activeItemFilter && String(tx.item_id || tx.itemId) !== activeItemFilter) return false;
            return true;
        });

        if (monthTransactions.length === 0) {
            table.style.display = 'none';
            emptyMonth.style.display = 'flex';
            emptyFilter.style.display = 'none';
            return;
        }

        if (filtered.length === 0) {
            table.style.display = 'none';
            emptyMonth.style.display = 'none';
            emptyFilter.style.display = 'flex';
            return;
        }

        table.style.display = 'table';
        emptyMonth.style.display = 'none';
        emptyFilter.style.display = 'none';

        filtered.forEach(tx => {
            if (tx.id === editingId) {
                renderInlineEditRow(tbody, tx);
            } else {
                renderReadOnlyRow(tbody, tx);
            }
        });
    }

    function renderReadOnlyRow(tbody, tx) {
        const tr = document.createElement('tr');
        tr.setAttribute('data-id', tx.id);

        const d = new Date(tx.date);
        const dateStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });

        const catId = tx.category_id || tx.categoryId;
        const cat = allCategories.find(c => c.id == catId) || { name: 'Unknown', icon: '❓' };

        const itemId = tx.item_id || tx.itemId;
        const item = allItems.find(i => i.id == itemId) || { name: '—' };

        let type = (tx.type || '').toLowerCase();
        if (!type && tx.type_id) type = DB_TYPE_ID_MAP[tx.type_id] || 'expense';
        if (!type) type = 'expense';

        const amountFormatted = parseFloat(tx.amount).toLocaleString('en-IN', { style: 'currency', currency: 'INR' }).replace('₹', '');

        tr.innerHTML = `
            <td>${dateStr}</td>
            <td><span class="type-pill ${type}">${type}</span></td>
            <td>
                <div class="cat-cell">
                    <span class="cat-icon">${cat.icon || '📦'}</span>
                    <span>${cat.name}</span>
                </div>
            </td>
            <td>${item.name}</td>
            <td style="color: #64748b; font-size: 13px;">${tx.description || '—'}</td>
            <td class="amount-${type}">₹ ${amountFormatted}</td>
            <td class="actions-col">
                <div class="action-buttons">
                    <button class="action-btn edit" title="Edit">✏️</button>
                    <button class="action-btn delete" title="Delete">🗑️</button>
                </div>
            </td>
        `;

        tr.querySelector('.edit').addEventListener('click', () => startEdit(tx));
        tr.querySelector('.delete').addEventListener('click', () => deleteTransaction(tx.id));
        tbody.appendChild(tr);
    }

    function renderInlineEditRow(tbody, tx) {
        const tr = document.createElement('tr');
        tr.setAttribute('data-id', tx.id);
        tr.classList.add('editing-row');

        // Current Values
        let type = (tx.type || '').toLowerCase();
        if (!type && tx.type_id) type = DB_TYPE_ID_MAP[tx.type_id] || 'expense';
        if (!type) type = 'expense';
        const catId = tx.category_id || tx.categoryId;
        const itemId = tx.item_id || tx.itemId;

        // Note: Input type='text' for Flatpickr compatibility
        tr.innerHTML = `
            <td><input type="text" class="inline-edit-input edit-date" value="${tx.date}" style="width: 120px;"></td>
            <td>
                 <select class="inline-select edit-type">
                    <option value="expense" ${type === 'expense' ? 'selected' : ''}>Expense</option>
                    <option value="income" ${type === 'income' ? 'selected' : ''}>Income</option>
                    <option value="investment" ${type === 'investment' ? 'selected' : ''}>Investment</option>
                 </select>
            </td>
            <td>
                <select class="inline-select edit-category" style="width: 140px;">
                    <!-- Populated via JS -->
                </select>
            </td>
            <td>
                <select class="inline-select edit-item" style="width: 140px;">
                    <option value="">Select Item</option>
                </select>
            </td>
            <td><input type="text" class="inline-edit-input edit-notes" value="${tx.description || ''}" placeholder="Notes"></td>
            <td><input type="number" class="inline-edit-input edit-amount" value="${tx.amount}" step="0.01" style="width: 80px;"></td>
            <td class="actions-col">
                <div class="action-buttons">
                    <button class="action-btn save-btn" title="Save">✔</button>
                    <button class="action-btn cancel-btn" title="Cancel">✖</button>
                </div>
            </td>
        `;

        tbody.appendChild(tr);

        // Attach Listeners for this row
        const typeSelect = tr.querySelector('.edit-type');
        const catSelect = tr.querySelector('.edit-category');
        const itemSelect = tr.querySelector('.edit-item');
        const dateInput = tr.querySelector('.edit-date');
        const saveBtn = tr.querySelector('.save-btn');
        const cancelBtn = tr.querySelector('.cancel-btn');

        // Initialize Flatpickr for date
        if (typeof flatpickr !== 'undefined') {
            flatpickr(dateInput, {
                dateFormat: "Y-m-d",
                altInput: true,
                altFormat: "d M Y",
                displayFormat: "d M Y", // sometimes used depending on version
                defaultDate: tx.date || "today",
                theme: "material_blue"
            });
        }

        // Initial Populations
        populateInlineCategory(catSelect, typeSelect.value, catId);
        populateInlineItem(itemSelect, catSelect.value, itemId);

        // Events
        typeSelect.addEventListener('change', () => {
            populateInlineCategory(catSelect, typeSelect.value, null);
            populateInlineItem(itemSelect, catSelect.value, null);
        });

        catSelect.addEventListener('change', () => {
            populateInlineItem(itemSelect, catSelect.value, null);
        });

        saveBtn.addEventListener('click', () => saveInlineEdit(tx.id));
        cancelBtn.addEventListener('click', cancelEdit);
    }

    function populateInlineCategory(select, logicalType, selectedId) {
        select.innerHTML = '<option value="" disabled selected>Select</option>';
        const typeId = getTypeId(logicalType);
        if (!typeId) return;

        const cats = allCategories.filter(c => c.type_id == typeId || c.typeId == typeId);
        cats.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.textContent = c.name;
            if (String(c.id) === String(selectedId)) opt.selected = true;
            select.appendChild(opt);
        });

        // If existing selection not found (mismatched type), reset
        if (selectedId && !select.value) select.value = "";
    }

    function populateInlineItem(select, categoryId, selectedId) {
        select.innerHTML = '<option value="">Select Item</option>';
        if (!categoryId) { select.disabled = true; return; }
        select.disabled = false;

        const items = allItems.filter(i => i.category_id == categoryId || i.categoryId == categoryId);
        items.forEach(i => {
            const opt = document.createElement('option');
            opt.value = i.id;
            opt.textContent = i.name;
            if (String(i.id) === String(selectedId)) opt.selected = true;
            select.appendChild(opt);
        });
    }

})();
