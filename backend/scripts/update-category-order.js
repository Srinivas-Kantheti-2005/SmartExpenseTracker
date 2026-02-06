require('dotenv').config();
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../database/expense_tracker.db');
const db = new Database(dbPath);

console.log('🔄 Updating category order indices...\n');

// Define the correct order for each type
const categoryOrder = {
    income: [
        'Salary',
        'Business',
        'Freelance',
        'Interest',
        'Rental Income',
        'Other Income'
    ],
    expense: [
        'Food & Dining',
        'Transport',
        'Housing',
        'Bills & Utilities',
        'Shopping',
        'Health & Medical',
        'Education',
        'Entertainment',
        'Personal Care',
        'Travel',
        'Gifts & Donations',
        'EMIs / Loans',
        'Others'
    ],
    investment: [
        'Stocks',
        'Mutual Funds',
        'Gold',
        'Crypto',
        'Fixed Deposit',
        'Real Estate',
        'Other Investments'
    ]
};

const updateOrder = db.prepare('UPDATE categories SET order_index = ? WHERE id = ?');

let updated = 0;

// Update parent categories
for (const [type, names] of Object.entries(categoryOrder)) {
    names.forEach((name, index) => {
        const category = db.prepare('SELECT id FROM categories WHERE name = ? AND type = ? AND parent_id IS NULL AND user_id IS NULL').get(name, type);
        if (category) {
            updateOrder.run(index + 1, category.id);
            updated++;
            console.log(`✅ ${name} (${type}) → order: ${index + 1}`);

            // Update subcategories order
            const subcategories = db.prepare('SELECT id, name FROM categories WHERE parent_id = ? ORDER BY created_at').all(category.id);
            subcategories.forEach((sub, subIndex) => {
                updateOrder.run(subIndex + 1, sub.id);
                console.log(`   └─ ${sub.name} → order: ${subIndex + 1}`);
            });
        }
    });
    console.log('');
}

console.log(`\n✅ Updated ${updated} parent categories with order indices`);

db.close();
