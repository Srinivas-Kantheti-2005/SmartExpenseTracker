const API_URL = 'http://localhost:3004';
let currentType = null;
let allTypes = [];
let allCategories = [];
let allItems = [];
const currentUser = JSON.parse(localStorage.getItem('user'));

document.addEventListener('DOMContentLoaded', async () => {
    if (!currentUser) {
        window.location.href = '../auth/login.html';
        return;
    }
    // Initial Load
    await fetchData();
    initializeTabs();
    renderContent();
    setupEventListeners();
});

async function fetchData() {
    try {
        const [typesRes, catsRes, subsRes] = await Promise.all([
            fetch(`${API_URL}/types`),
            fetch(`${API_URL}/categories?email=${currentUser.email}`),
            fetch(`${API_URL}/items?email=${currentUser.email}`)
        ]);

        allTypes = await typesRes.json();
        allCategories = await catsRes.json();
        allItems = await subsRes.json();

        // Default to first type if not set or if current type was deleted
        if ((!currentType || !allTypes.find(t => t.id === currentType.id)) && allTypes.length > 0) {
            currentType = allTypes[0];
        }
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}


function initializeTabs() {
    const tabsContainer = document.getElementById('type-tabs');
    tabsContainer.innerHTML = '';

    allTypes.forEach(type => {
        const tab = document.createElement('div');
        const colorClass = getTypeColorClass(type.name);
        tab.className = `type-tab ${colorClass} ${currentType && currentType.id === type.id ? 'active' : ''}`;

        // Tab Content with Actions
        tab.innerHTML = `
            <div class="tab-content">
                 <span>${type.icon || getTypeIcon(type.name)}</span> ${type.name}
            </div>
            <div class="tab-actions">
                <button class="action-btn edit-btn" onclick="event.stopPropagation(); openEditTypeModal('${type.id}')">✏️</button>
            </div>
        `;

        tab.onclick = () => switchType(type);
        tabsContainer.appendChild(tab);
    });
}

function getTypeColorClass(name) {
    if (name.toLowerCase().includes('income')) return 'tab-income';
    if (name.toLowerCase().includes('expense')) return 'tab-expense';
    if (name.toLowerCase().includes('investment')) return 'tab-investment';
    return '';
}

function getTypeIcon(name) {
    if (name.includes('Income')) return '💰';
    if (name.includes('Expense')) return '💸';
    if (name.includes('Investment')) return '📈';
    return '📁';
}

function switchType(type) {
    currentType = type;
    initializeTabs();
    renderContent();
}

function renderContent() {
    const container = document.getElementById('categories-container');
    container.innerHTML = '';

    if (!currentType) return;

    // Filter categories by current type
    const typeCategories = allCategories.filter(cat => cat.typeId === currentType.id);

    typeCategories.forEach(category => {
        const card = createCategoryCard(category);
        container.appendChild(card);
    });
}

function createCategoryCard(category) {
    const card = document.createElement('div');
    card.className = 'category-card';

    // Get items for this category
    const items = allItems.filter(item => item.categoryId === category.id);

    card.innerHTML = `
        <div class="category-header">
            <div class="category-info">
                <span class="category-icon">${category.icon || '📁'}</span>
                <span class="category-title">${category.name}</span>
            </div>
            <div class="category-actions">
                <button class="action-btn edit-btn" onclick="openEditCategoryModal('${category.id}')">✏️</button>
                <button class="action-btn delete-btn" onclick="openDeleteCategoryModal('${category.id}')">🗑️</button>
            </div>
        </div>
        <div class="subcategory-list">
            ${items.map(item => `
                <div class="subcategory-item">
                    <div class="subcategory-left">
                        <span>${item.name}</span>
                    </div>
                    <div class="subcategory-actions">
                        <button class="action-btn edit-btn" onclick="openEditItemModal('${item.id}')">✏️</button>
                        <button class="action-btn delete-btn" onclick="openDeleteItemModal('${item.id}')">🗑️</button>
                    </div>
                </div>
            `).join('')}
        </div>
        <button class="add-subcategory-btn" onclick="openAddItemModal('${category.id}')">+ Add item</button>
    `;

    return card;
}

// --- Modal & CRUD Logic ---

const modal = document.getElementById('categoryModal');
const deleteModal = document.getElementById('deleteModal');
const form = document.getElementById('categoryForm');

// State for Modal
let editingItem = null; // { id, type: 'type' | 'category' | 'item' }
let deletingItem = null; // { id, type: 'type' | 'category' | 'item' }

function openModal(title) {
    document.getElementById('modalTitle').innerText = title;
    modal.classList.add('active');
}

function closeModal() {
    modal.classList.remove('active');
    form.reset();
    editingItem = null;
}

function setupEventListeners() {
    document.querySelectorAll('.modal-close, .close-modal-btn').forEach(el => el.onclick = closeModal);
    document.querySelectorAll('.close-delete-btn').forEach(el => el.onclick = () => deleteModal.classList.remove('active'));

    const iconInput = document.getElementById('itemIcon');
    iconInput.addEventListener('input', (e) => {
        const val = e.target.value;
        const emojis = val.match(/\p{Emoji_Presentation}|\p{Extended_Pictographic}/gu);
        if (emojis && emojis.length > 0) {
            e.target.value = emojis[emojis.length - 1]; // Keep only the last typed emoji
        } else {
            e.target.value = ''; // Clear if no emoji
        }
    });

    window.onclick = (e) => {
        if (e.target === modal) closeModal();
        if (e.target === deleteModal) deleteModal.classList.remove('active');
    };

    // Color Sync Logic
    const colorPicker = document.getElementById('itemColor');
    const colorHex = document.getElementById('itemColorHex');

    colorPicker.addEventListener('input', (e) => {
        colorHex.value = e.target.value.toUpperCase();
    });

    colorHex.addEventListener('input', (e) => {
        let val = e.target.value;
        if (!val.startsWith('#')) {
            val = '#' + val;
        }
        // Validate Hex
        if (/^#[0-9A-F]{6}$/i.test(val)) {
            colorPicker.value = val;
        }
    });

    colorHex.addEventListener('blur', (e) => {
        let val = e.target.value;
        if (!val.startsWith('#')) val = '#' + val;
        if (!/^#[0-9A-F]{6}$/i.test(val)) {
            // Revert to picker value if invalid
            e.target.value = colorPicker.value.toUpperCase();
        } else {
            e.target.value = val.toUpperCase();
        }
    });
}

// ADD Category
document.getElementById('add-category-btn').onclick = () => {
    if (!currentType) {
        alert("Please select a type first.");
        return;
    }
    editingItem = { type: 'category', isNew: true };
    document.getElementById('parentType').value = 'type';
    document.getElementById('parentId').value = currentType.id;
    document.getElementById('icon-group').style.display = 'flex';
    document.getElementById('color-group').style.display = 'none'; // Types don't use color in this context usually, or do they? User said "category scheme db". Income/Expense types don't usually have color field in DB schema shown above, only categories. Wait, looking at DB schema, types don't have color. Categories do.
    // Correction: User request said "in edit/new category card". It implies Categories.
    // Types might not need color. I'll hide it for types for now unless user asked for it.
    // Re-reading: "update category scheme db. add color to db."
    // So only Categories.
    document.getElementById('itemIcon').required = true;
    document.getElementById('itemName').placeholder = "Enter Category";
    openModal('Add New Category');
};

// EDIT Type
window.openEditTypeModal = (id) => {
    const type = allTypes.find(t => t.id === id);
    if (!type) return;
    editingItem = { type: 'type', isNew: false, id: id };
    document.getElementById('itemName').value = type.name;
    document.getElementById('itemIcon').value = type.icon || '';
    document.getElementById('icon-group').style.display = 'flex';
    document.getElementById('color-group').style.display = 'none'; // Hide color for Types
    document.getElementById('itemIcon').required = true;
    document.getElementById('itemName').placeholder = "Enter Type";
    openModal('Edit Type');
}

// EDIT Category
window.openEditCategoryModal = (id) => {
    const cat = allCategories.find(c => c.id === id);
    if (!cat) return;
    editingItem = { type: 'category', isNew: false, id: id };
    document.getElementById('itemName').value = cat.name;
    document.getElementById('itemIcon').value = cat.icon || '';
    const colorVal = cat.color || '#4f46e5';
    document.getElementById('itemColor').value = colorVal;
    document.getElementById('itemColorHex').value = colorVal.toUpperCase();
    document.getElementById('icon-group').style.display = 'flex';
    document.getElementById('color-group').style.display = 'flex'; // Show color for Categories
    document.getElementById('itemIcon').required = true;
    document.getElementById('itemName').placeholder = "Enter Category";
    openModal('Edit Category');
};

// ADD Category - update to show color
document.getElementById('add-category-btn').onclick = () => {
    if (!currentType) {
        alert("Please select a type first.");
        return;
    }
    editingItem = { type: 'category', isNew: true };
    document.getElementById('parentType').value = 'type';
    document.getElementById('parentId').value = currentType.id;
    document.getElementById('icon-group').style.display = 'flex';
    document.getElementById('color-group').style.display = 'flex'; // Show color

    // Determine default color based on type
    let defaultColor = '#4f46e5'; // Default Blue
    if (currentType.name.toLowerCase().includes('income')) defaultColor = '#2ECC71'; // Green
    else if (currentType.name.toLowerCase().includes('expense')) defaultColor = '#F4A261'; // Orange/Red-ish (User said Red but provided #F4A261 for Food which is Orange, but Expense usually Red. User's list had expense as #F4A261 start. Wait, user request said "expense -> red(default color)". But previous list had various. I should stick to a standard Red? Or matches the first expense item? The user provided list had #F4A261 for Food. Let's use a standard Red #E76F51 as per user request "expense -> red". Actually the user list had #E76F51 for Bills. Let's use #E76F51 for Red. And Blue #2563EB for investment.)
    // Correction: User said "income -> green", "expense -> red", "investment -> blue".
    // I will use:
    // Income: #2ECC71 (Green)
    // Expense: #E76F51 (Red-ish/Terracotta - from their list for Bills) or just standard Red #FF0000? Better to use their theme. #E76F51 is good.
    // Investment: #2563EB (Blue - from Stocks)

    if (currentType.name.toLowerCase().includes('income')) defaultColor = '#2ECC71';
    else if (currentType.name.toLowerCase().includes('expense')) defaultColor = '#E76F51';
    else if (currentType.name.toLowerCase().includes('investment')) defaultColor = '#2563EB';

    document.getElementById('itemIcon').value = '';
    document.getElementById('itemColor').value = defaultColor;
    document.getElementById('itemColorHex').value = defaultColor.toUpperCase();
    document.getElementById('itemIcon').required = true;
    document.getElementById('itemName').placeholder = "Enter Category";
    document.getElementById('itemName').value = '';
    openModal('Add New Category');
};

// ADD Item
window.openAddItemModal = (categoryId) => {
    editingItem = { type: 'item', isNew: true };
    document.getElementById('parentType').value = 'category';
    document.getElementById('parentId').value = categoryId;
    document.getElementById('icon-group').style.display = 'none';
    document.getElementById('color-group').style.display = 'none'; // Hide color for Items
    document.getElementById('itemIcon').required = false;
    document.getElementById('itemName').placeholder = "Enter Item";
    openModal('Add Item');
};

// EDIT Item
window.openEditItemModal = (id) => {
    const item = allItems.find(s => s.id === id);
    if (!item) return;
    editingItem = { type: 'item', isNew: false, id: id };
    document.getElementById('itemName').value = item.name;
    document.getElementById('icon-group').style.display = 'none';
    document.getElementById('color-group').style.display = 'none'; // Hide color for Items
    document.getElementById('itemIcon').required = false;
    document.getElementById('itemName').placeholder = "Enter Item";
    openModal('Edit Item');
};

// Form Sorting
form.onsubmit = async (e) => {
    e.preventDefault();
    const name = document.getElementById('itemName').value;
    const icon = document.getElementById('itemIcon').value;
    // Use Hex Input value (normalized)
    let color = document.getElementById('itemColorHex').value;
    if (!color.startsWith('#')) color = '#' + color;

    // Fallback if somehow empty or invalid, use picker
    if (!/^#[0-9A-F]{6}$/i.test(color)) {
        color = document.getElementById('itemColor').value;
    }

    const parentId = document.getElementById('parentId').value;

    if (!editingItem) return;

    // Validation: Check empty fields
    if (!name.trim()) return;

    try {
        if (editingItem.type === 'type') {
            const payload = { name, icon };

            await fetch(`${API_URL}/types/${editingItem.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

        } else if (editingItem.type === 'category') {
            const payload = {
                name,
                icon,
                color, // Save color
                typeId: editingItem.isNew ? parentId : undefined, // Only need typeId for new
                email: currentUser.email // Link to user
            };

            // Keep existing typeId if editing
            if (!editingItem.isNew) {
                const exist = allCategories.find(c => c.id === editingItem.id);
                payload.typeId = exist.typeId;
            }

            if (editingItem.isNew) {
                await fetch(`${API_URL}/categories`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...payload, id: crypto.randomUUID() })
                });
            } else {
                await fetch(`${API_URL}/categories/${editingItem.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            }

        } else if (editingItem.type === 'item') {
            const payload = {
                name,
                categoryId: editingItem.isNew ? parentId : undefined,
                email: currentUser.email // Link to user
            };

            if (!editingItem.isNew) {
                const exist = allItems.find(s => s.id === editingItem.id);
                payload.categoryId = exist.categoryId;
            }

            if (editingItem.isNew) {
                await fetch(`${API_URL}/items`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...payload, id: crypto.randomUUID() })
                });
            } else {
                await fetch(`${API_URL}/items/${editingItem.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            }
        }

        const savedType = editingItem.type; // Store before nulling
        closeModal();
        await fetchData();

        // If type changed, re-init tabs
        if (savedType === 'type') initializeTabs();
        else renderContent();

    } catch (error) {
        console.error('Error saving:', error);
        alert('Failed to save changes');
    }
};

// DELETE Logic
window.openDeleteTypeModal = (id) => {
    const type = allTypes.find(t => t.id === id);
    if (!type) return;
    deletingItem = { type: 'type', id };
    document.getElementById('deleteItemName').innerText = type.name;
    deleteModal.classList.add('active');
}

window.openDeleteCategoryModal = (id) => {
    const cat = allCategories.find(c => c.id === id);
    deletingItem = { type: 'category', id };
    document.getElementById('deleteItemName').innerText = cat.name;
    deleteModal.classList.add('active');
};

window.openDeleteItemModal = (id) => {
    const item = allItems.find(s => s.id === id);
    deletingItem = { type: 'item', id };
    document.getElementById('deleteItemName').innerText = item.name;
    deleteModal.classList.add('active');
};

document.getElementById('confirmDeleteBtn').onclick = async () => {
    if (!deletingItem) return;

    try {
        let endpoint = '';
        if (deletingItem.type === 'type') endpoint = 'types';
        else if (deletingItem.type === 'category') endpoint = 'categories';
        else if (deletingItem.type === 'item') endpoint = 'items';

        await fetch(`${API_URL}/${endpoint}/${deletingItem.id}`, { method: 'DELETE' });

        deleteModal.classList.remove('active');
        // If deleted current type, we need to handle that
        const wasType = deletingItem.type === 'type';
        const deletedId = deletingItem.id;

        deletingItem = null;
        await fetchData();

        if (wasType) {
            if (currentType && currentType.id === deletedId) {
                // Current type was deleted, fetch picks a new one or null
                // fetchData already handles defaulting to first.
            }
            initializeTabs();
            renderContent();
        } else {
            renderContent();
        }

    } catch (error) {
        console.error('Error deleting:', error);
        alert('Failed to delete item');
    }
};
