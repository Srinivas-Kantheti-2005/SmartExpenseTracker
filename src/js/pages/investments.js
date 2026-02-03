/* ========================================
   Investments Page Controller
   ======================================== */
console.log('Investments.js loaded');

(function () { // Start IIFE

    const API_BASE = window.API_BASE_URL || 'http://localhost:5000/api';

    // State
    // State
    const navEntry = performance.getEntriesByType("navigation")[0];
    const navType = navEntry ? navEntry.type : 'navigate';

    let currentYear, currentMonth;

    if (navType === 'reload' || navType === 'back_forward') {
        const savedYear = localStorage.getItem('selectedInvestmentYear');
        const savedMonth = localStorage.getItem('selectedInvestmentMonth');
        currentYear = savedYear ? parseInt(savedYear) : new Date().getFullYear();
        currentMonth = savedMonth ? parseInt(savedMonth) : new Date().getMonth() + 1;
    } else {
        const today = new Date();
        currentYear = today.getFullYear();
        currentMonth = today.getMonth() + 1;
        // Update storage
        localStorage.setItem('selectedInvestmentYear', currentYear);
        localStorage.setItem('selectedInvestmentMonth', currentMonth);
    }
    let monthInvestments = [];
    let allCategories = [];
    let allItems = [];
    let currentUser = null;
    let editingId = null; // State for inline editing

    // Safe Execution
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initInvestmentPage);
    } else {
        initInvestmentPage();
    }

    async function initInvestmentPage() {
        console.log('Initializing Investment Page...');

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
        const dateInput = document.getElementById('investment-date');
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
        loadInvestments();
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
                        localStorage.setItem('selectedInvestmentYear', currentYear);
                        localStorage.setItem('selectedInvestmentMonth', currentMonth);

                        updateMonthDisplay();
                        loadInvestments();
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

        const form = document.getElementById('investment-form');
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
        localStorage.setItem('selectedInvestmentYear', currentYear);
        localStorage.setItem('selectedInvestmentMonth', currentMonth);

        updateMonthDisplay();
        loadInvestments();
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

        // Sync "Add Investment" Form Date
        const investmentDateInput = document.getElementById('investment-date');
        if (investmentDateInput && investmentDateInput._flatpickr) {
            // Use today's day number, projected into the selected month
            // Handle edge cases where selected month has fewer days than today's day (e.g. 31st -> 28th Feb)
            const today = new Date();
            const worldDay = today.getDate();
            const daysInTargetMonth = new Date(currentYear, currentMonth, 0).getDate();
            const targetDay = Math.min(worldDay, daysInTargetMonth);

            const newDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}`;
            investmentDateInput._flatpickr.setDate(newDate);
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

            // Find "Investment" type ID
            const investmentType = types.find(t => t.name.toLowerCase() === 'investments' || t.name.toLowerCase() === 'investment');
            // If strictly "Investments" is used in DB, this will match. Logic supports "investment" too.
            // CAUTION: Defaulting to 'type-3' (often expenses/others) if not found, but ideally should error.
            // Let's assume there is an 'Investments' type in the DB.
            const investmentTypeId = investmentType ? investmentType.id : null;

            // 2. Fetch All Categories
            const catData = await fetchWithFallback(`categories?email=${currentUser.email}`);
            const categories = Array.isArray(catData) ? catData : (catData.data || []);

            // 3. Filter for Investment Categories
            if (investmentTypeId) {
                allCategories = categories.filter(cat => {
                    const tId = cat.typeId || cat.type_id;
                    return tId == investmentTypeId;
                });
            } else {
                console.warn("Investment type not found in DB. Showing no categories.");
                allCategories = [];
            }


            // 4. Fetch All Items
            const itemsDataRaw = await fetchWithFallback(`items?email=${currentUser.email}`);
            const itemsList = Array.isArray(itemsDataRaw) ? itemsDataRaw : (itemsDataRaw.data || []);

            allItems = itemsList;

            console.log(`Loaded: ${allCategories.length} categories, ${allItems.length} items. Auth Type: ${investmentTypeId}`);
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
                option.textContent = "No investment categories found";
            }
            select.appendChild(option);
            return;
        }

        allCategories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id;
            // Use cat.icon directly
            option.textContent = `${cat.icon || '📈'} ${cat.name}`;
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

    async function loadInvestments() {
        if (!currentUser) return;
        try {
            // Calculate Start and End Date for the month
            // Format: YYYY-MM-DD
            const startDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
            // Get last day of month
            const lastDay = new Date(currentYear, currentMonth, 0).getDate();
            const endDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${lastDay}`;

            // Fetch Transactions with type=investment (or whatever logic for investments)
            // Use date_gte and date_lte for range filtering in json-server
            // Add userId to filter by current user
            // Assuming 'investment' or 'investments' is the type. Using 'investment' here based on singular convention.
            // IMPORTANT: If 'investments' is the type in DB (plural), this needs to match.
            // Based on sidebar links, maybe 'investments'?
            // Let's safely try 'investment' unless we know otherwise.
            const url = `${API_BASE}/transactions?userId=${currentUser.id}&type=investment&date_gte=${startDate}&date_lte=${endDate}&_sort=date&_order=desc`;

            console.log('Fetching investments from:', url);

            const res = await fetch(url, { headers: getAuthHeaders() });
            const data = await res.json();

            // Handle both simple array and data wrapper
            monthInvestments = Array.isArray(data) ? data : (data.data || []);
            if (!Array.isArray(monthInvestments)) monthInvestments = [];

            console.log(`Loaded ${monthInvestments.length} investments for ${startDate} to ${endDate}`);

            // Client-side sort: Latest Date First, then Latest ID First (stable)
            monthInvestments.sort((a, b) => {
                const dateDiff = new Date(b.date) - new Date(a.date);
                if (dateDiff !== 0) return dateDiff;
                return b.id - a.id;
            });

            renderInvestments();
            calculateTotalInvestment();

        } catch (error) {
            console.error('Failed to load investments:', error);
            monthInvestments = [];
            renderInvestments();
            calculateTotalInvestment();
        }
    }

    function calculateTotalInvestment() {
        const total = monthInvestments.reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);
        const display = document.getElementById('total-investment-display');
        if (display) {
            display.textContent = `₹ ${total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
    }

    function renderInvestments() {
        const tbody = document.getElementById('investment-list-body');
        const emptyState = document.getElementById('no-investments-message');
        const table = document.querySelector('.investment-table');

        if (!tbody) return;
        tbody.innerHTML = '';

        if (monthInvestments.length === 0) {
            table.style.display = 'none';
            emptyState.style.display = 'flex';
            return;
        }

        table.style.display = 'table';
        emptyState.style.display = 'none';

        monthInvestments.forEach(inv => {
            const tr = document.createElement('tr');
            const isEditing = editingId === inv.id;

            if (isEditing) {
                // --- EDIT MODE ---
                tr.classList.add('editing-row');

                // Category Options
                const catsOptions = allCategories.map(c =>
                    `<option value="${c.id}" ${c.id == inv.category_id ? 'selected' : ''}>${c.icon} ${c.name}</option>`
                ).join('');

                // Item Options (Filtered by current category)
                const currentCatItems = allItems.filter(i => (i.categoryId || i.category_id) == inv.category_id);
                let itemsOptions = currentCatItems.map(i =>
                    `<option value="${i.id}" ${i.id == inv.item_id ? 'selected' : ''}>${i.name}</option>`
                ).join('');

                // If no items, show select
                if (currentCatItems.length === 0) itemsOptions = '<option value="" disabled>No Items</option>';

                tr.innerHTML = `
                <td><input type="date" id="edit-date-${inv.id}" value="${inv.date}" class="single-line-input" style="height: 36px !important; padding: 0 8px;"></td>
                <td>
                    <div class="select-wrapper">
                        <select id="edit-cat-${inv.id}" style="height: 36px !important; padding-right: 32px;">${catsOptions}</select>
                    </div>
                </td>
                <td>
                    <div class="select-wrapper">
                        <select id="edit-item-${inv.id}" style="height: 36px !important; padding-right: 32px;">${itemsOptions}</select>
                    </div>
                </td>
                <td><input type="text" id="edit-desc-${inv.id}" value="${inv.description || ''}" class="single-line-input" style="height: 36px !important;"></td>
                <td><input type="number" id="edit-amount-${inv.id}" value="${Number(inv.amount).toFixed(2)}" class="single-line-input edit-amount-input" step="0.01" style="height: 36px !important; font-weight: 700; color: #1d4ed8;"></td>
                <td style="text-align: right;">
                    <div class="action-buttons">
                        <button class="action-btn save-btn" title="Save">✔</button>
                        <button class="action-btn cancel-btn" title="Cancel">✖</button>
                    </div>
                </td>
            `;

                // Editing Listeners
                const catSelect = tr.querySelector(`#edit-cat-${inv.id}`);
                const itemSelect = tr.querySelector(`#edit-item-${inv.id}`);
                const saveBtn = tr.querySelector('.save-btn');
                const cancelBtn = tr.querySelector('.cancel-btn');
                const dateInput = tr.querySelector(`#edit-date-${inv.id}`);

                // Initialize Flatpickr for Edit Date
                if (typeof flatpickr !== 'undefined' && dateInput) {
                    flatpickr(dateInput, {
                        dateFormat: "Y-m-d",
                        defaultDate: inv.date,
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

                saveBtn.addEventListener('click', () => updateInvestment(inv.id));
                cancelBtn.addEventListener('click', () => cancelEditing());

            } else {
                // --- VIEW MODE ---
                let catName = 'Unknown';
                let catIcon = '📈';
                const cat = allCategories.find(c => c.id == inv.category_id);
                if (cat) { catName = cat.name; catIcon = cat.icon; }
                else if (inv.category && inv.category.name) { catName = inv.category.name; catIcon = inv.category.icon || '📈'; }

                let itemName = '—';
                const item = allItems.find(i => i.id == inv.item_id);
                if (item) itemName = item.name;
                else if (inv.item && inv.item.name) itemName = inv.item.name;

                const dateObj = new Date(inv.date);
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
                <td style="color: #64748b; font-size: 13px;">${inv.description || '—'}</td>
                <td class="amount-positive">₹ ${Number(inv.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td style="text-align: right;">
                    <div class="action-buttons">
                        <button class="btn-icon edit-btn" title="Edit">✏️</button>
                        <button class="btn-icon delete-btn" title="Delete">🗑️</button>
                    </div>
                </td>
            `;

                tr.querySelector('.edit-btn').addEventListener('click', () => startEditing(inv.id));
                tr.querySelector('.delete-btn').addEventListener('click', () => deleteInvestment(inv.id));
            }

            tbody.appendChild(tr);
        });
    }

    function startEditing(id) {
        editingId = id;
        renderInvestments();
    }

    function cancelEditing() {
        editingId = null;
        renderInvestments();
    }

    async function updateInvestment(id) {
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
                loadInvestments();
            } else {
                console.error('Update failed');
                alert('Failed to update investment');
            }
        } catch (error) {
            console.error('Error updating investment:', error);
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
        const dateVal = document.getElementById('investment-date').value;
        const amount = document.getElementById('investment-amount').value;
        const note = document.getElementById('investment-note').value;

        if (!categoryId || !dateVal || !amount) {
            alert('Please fill in required fields');
            return;
        }

        const payload = {
            userId: currentUser.id,
            email: currentUser.email,
            type: 'investment',
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
                    loadInvestments();
                } else {
                    alert('Investment added successfully to another month.');
                }
            } else {
                // Read text ONLY ONCE to avoid "body used" errors
                const rawText = await res.text();
                let msg = 'Failed to add investment';

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
            console.error('Error adding investment:', error);
            alert('Error: ' + error.message);
        }
    }

    async function deleteInvestment(id) {
        if (!confirm('Are you sure you want to delete this investment record?')) return;

        try {
            const res = await fetch(`${API_BASE}/transactions/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (res.ok) {
                loadInvestments();
            } else {
                alert('Failed to delete investment');
            }
        } catch (error) {
            console.error('Error deleting investment:', error);
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

        document.getElementById('investment-amount').value = "";
        document.getElementById('investment-note').value = "";

        // Reset date to today using Flatpickr
        const dateInput = document.getElementById('investment-date');
        if (dateInput && dateInput._flatpickr) {
            dateInput._flatpickr.setDate(new Date());
        } else if (dateInput) {
            dateInput.valueAsDate = new Date();
        }
    }

})();
