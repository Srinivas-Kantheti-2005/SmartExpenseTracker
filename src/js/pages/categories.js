const API_URL = 'http://localhost:3004';
let currentType = null;
let allTypes = [];
let allCategories = [];
let allItems = [];

document.addEventListener('DOMContentLoaded', async () => {
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
            fetch(`${API_URL}/categories`),
            fetch(`${API_URL}/items`)
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

    window.onclick = (e) => {
        if (e.target === modal) closeModal();
        if (e.target === deleteModal) deleteModal.classList.remove('active');
    };
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
    document.getElementById('icon-group').style.display = 'block';
    openModal('Add New Category');
};

// EDIT Type
window.openEditTypeModal = (id) => {
    const type = allTypes.find(t => t.id === id);
    if (!type) return;
    editingItem = { type: 'type', isNew: false, id: id };
    document.getElementById('itemName').value = type.name;
    document.getElementById('itemIcon').value = type.icon || '';
    document.getElementById('icon-group').style.display = 'block';
    openModal('Edit Type');
}

// EDIT Category
window.openEditCategoryModal = (id) => {
    const cat = allCategories.find(c => c.id === id);
    if (!cat) return;
    editingItem = { type: 'category', isNew: false, id: id };
    document.getElementById('itemName').value = cat.name;
    document.getElementById('itemIcon').value = cat.icon || '';
    document.getElementById('icon-group').style.display = 'block';
    openModal('Edit Category');
};

// ADD Item
window.openAddItemModal = (categoryId) => {
    editingItem = { type: 'item', isNew: true };
    document.getElementById('parentType').value = 'category';
    document.getElementById('parentId').value = categoryId;
    document.getElementById('icon-group').style.display = 'none';
    openModal('Add Item');
};

// EDIT Item
window.openEditItemModal = (id) => {
    const item = allItems.find(s => s.id === id);
    if (!item) return;
    editingItem = { type: 'item', isNew: false, id: id };
    document.getElementById('itemName').value = item.name;
    document.getElementById('icon-group').style.display = 'none';
    openModal('Edit Item');
};

// Form Sorting
form.onsubmit = async (e) => {
    e.preventDefault();
    const name = document.getElementById('itemName').value;
    const icon = document.getElementById('itemIcon').value;
    const parentId = document.getElementById('parentId').value;

    if (!editingItem) return;

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
                typeId: editingItem.isNew ? parentId : undefined // Only need typeId for new
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
                categoryId: editingItem.isNew ? parentId : undefined
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
