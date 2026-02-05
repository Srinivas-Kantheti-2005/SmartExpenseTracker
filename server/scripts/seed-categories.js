/* ========================================
   Seed Default Categories Script
   Run this to populate default categories for all users
   ======================================== */

const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const DB_PATH = path.join(__dirname, '../../database/expense_tracker.db');
const db = new Database(DB_PATH);

function generateUUID() {
    return crypto.randomUUID();
}

// Default category structure
const DEFAULT_CATEGORIES = {
    income: [
        { name: 'Salary', icon: '💼', color: '#2ECC71', items: ['Monthly Salary', 'Bonus', 'Incentives'] },
        { name: 'Business', icon: '🏢', color: '#27AE60', items: ['Business Profit', 'Side Business'] },
        { name: 'Freelance', icon: '💻', color: '#6FCF97', items: ['Client Work', 'Contract Work'] },
        { name: 'Interest', icon: '📈', color: '#7CB342', items: ['Bank Interest', 'FD Interest'] },
        { name: 'Rental Income', icon: '🏡', color: '#16A085', items: ['House Rent', 'Shop Rent'] },
        { name: 'Other Income', icon: '🧾', color: '#A8E6CF', items: ['Cashback', 'Refunds'] }
    ],
    expense: [
        { name: 'Food & Dining', icon: '🍽️', color: '#F4A261', items: ['Groceries', 'Restaurants', 'Snacks', 'Food Delivery'] },
        { name: 'Transport', icon: '🚗', color: '#9B7EDE', items: ['Fuel', 'Ride Hailing', 'Public Transport', 'Vehicle Maintenance'] },
        { name: 'Housing', icon: '🏡', color: '#A68A64', items: ['Rent', 'Maintenance', 'Electricity', 'Water'] },
        { name: 'Bills & Utilities', icon: '💡', color: '#E76F51', items: ['Mobile Recharge', 'Internet', 'Gas', 'DTH / Cable', 'Subscriptions'] },
        { name: 'Shopping', icon: '🛍️', color: '#E9C46A', items: ['Clothes', 'Accessories', 'Online Shopping'] },
        { name: 'Health & Medical', icon: '🏥', color: '#2A9D8F', items: ['Doctor Visits', 'Medicines', 'Insurance Premiums'] },
        { name: 'Education', icon: '🎓', color: '#4CC9F0', items: ['School / College Fees', 'Courses', 'Books'] },
        { name: 'Entertainment', icon: '🎬', color: '#6C91C2', items: ['Movies', 'Games', 'Events'] },
        { name: 'Personal Care', icon: '💆', color: '#F2A1C7', items: ['Salon', 'Grooming', 'Cosmetics', 'Fitness / Gym'] },
        { name: 'Travel', icon: '✈️', color: '#577590', items: ['Trips', 'Hotels', 'Transport'] },
        { name: 'Gifts & Donations', icon: '🎁', color: '#B983FF', items: ['Gifts', 'Charity'] },
        { name: 'EMIs / Loans', icon: '🏦', color: '#8D99AE', items: ['Education Loan', 'Personal Loan', 'Credit Card EMI'] },
        { name: 'Others', icon: '📌', color: '#CED4DA', items: ['Miscellaneous', 'Uncategorized Expenses'] }
    ],
    investment: [
        { name: 'Stocks', icon: '📊', color: '#2563EB', items: ['Equity', 'IPO'] },
        { name: 'Mutual Funds', icon: '🧺', color: '#3B82F6', items: ['SIP', 'Lump Sum'] },
        { name: 'Gold', icon: '⚱️', color: '#64748B', items: ['Physical Gold', 'Digital Gold'] },
        { name: 'Crypto', icon: '₿', color: '#4F46E5', items: ['Bitcoin', 'Altcoins'] },
        { name: 'Fixed Deposit', icon: '🏦', color: '#1E40AF', items: ['Bank FD', 'Corporate FD'] },
        { name: 'Real Estate', icon: '🏘️', color: '#475569', items: ['Land', 'Property'] },
        { name: 'Other Investments', icon: '🗃️', color: '#94A3B8', items: ['Bonds', 'PPF / NPS'] }
    ]
};

console.log('🌱 Starting category seeding...\n');

try {
    // Delete existing default categories
    const deleteStmt = db.prepare('DELETE FROM categories WHERE is_default = 1');
    const deleted = deleteStmt.run();
    console.log(`✅ Deleted ${deleted.changes} existing default categories\n`);

    let totalCategories = 0;
    let totalItems = 0;

    // Seed each type
    for (const [type, categories] of Object.entries(DEFAULT_CATEGORIES)) {
        console.log(`📂 Seeding ${type} categories...`);

        categories.forEach(cat => {
            const catId = generateUUID();

            // Insert parent category
            const catStmt = db.prepare(`
                INSERT INTO categories (id, user_id, name, type, icon, color, is_default, parent_id, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
            `);

            catStmt.run(catId, null, cat.name, type, cat.icon, cat.color, 1, null);
            totalCategories++;
            console.log(`  ✓ ${cat.icon} ${cat.name}`);

            // Insert items (subcategories)
            if (cat.items && cat.items.length > 0) {
                const itemStmt = db.prepare(`
                    INSERT INTO categories (id, user_id, name, type, icon, color, is_default, parent_id, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
                `);

                cat.items.forEach(itemName => {
                    const itemId = generateUUID();
                    itemStmt.run(itemId, null, itemName, type, cat.icon, cat.color, 1, catId);
                    totalItems++;
                });
                console.log(`    └─ ${cat.items.length} items`);
            }
        });
        console.log('');
    }

    console.log('✅ Seeding complete!');
    console.log(`📊 Summary:`);
    console.log(`   - Categories: ${totalCategories}`);
    console.log(`   - Items: ${totalItems}`);
    console.log(`   - Total: ${totalCategories + totalItems}`);

} catch (error) {
    console.error('❌ Error seeding categories:', error);
    process.exit(1);
} finally {
    db.close();
}
