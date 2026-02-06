require('dotenv').config();
const Database = require('better-sqlite3');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const dbPath = path.join(__dirname, '../../database/expense_tracker.db');
const db = new Database(dbPath);

console.log('🔄 Starting category reorganization...\n');

// Backup existing categories
console.log('📦 Backing up existing categories...');
const existingCategories = db.prepare('SELECT * FROM categories WHERE user_id IS NULL').all();
console.log(`   Found ${existingCategories.length} existing default categories\n`);

// Delete existing default categories
console.log('🗑️  Deleting existing default categories...');
db.prepare('DELETE FROM categories WHERE user_id IS NULL').run();
console.log('   ✅ Deleted\n');

// New category structure
const categoryData = [
    // INCOME (6 categories)
    {
        type: 'income', name: 'Salary', icon: '💰', color: '#10b981',
        subcategories: ['Monthly Salary', 'Bonus', 'Incentives']
    },
    {
        type: 'income', name: 'Business', icon: '💼', color: '#059669',
        subcategories: ['Business Profit', 'Side Business']
    },
    {
        type: 'income', name: 'Freelance', icon: '💻', color: '#34d399',
        subcategories: ['Client Work', 'Contract Work']
    },
    {
        type: 'income', name: 'Interest', icon: '📈', color: '#6ee7b7',
        subcategories: ['Bank Interest', 'FD Interest']
    },
    {
        type: 'income', name: 'Rental Income', icon: '🏠', color: '#a7f3d0',
        subcategories: ['House Rent', 'Shop Rent']
    },
    {
        type: 'income', name: 'Other Income', icon: '💵', color: '#d1fae5',
        subcategories: ['Cashback', 'Refunds']
    },

    // EXPENSE (13 categories)
    {
        type: 'expense', name: 'Food & Dining', icon: '🍔', color: '#ef4444',
        subcategories: ['Groceries', 'Restaurants', 'Snacks', 'Food Delivery']
    },
    {
        type: 'expense', name: 'Transport', icon: '🚗', color: '#dc2626',
        subcategories: ['Fuel', 'Ride Hailing', 'Public Transport', 'Vehicle Maintenance']
    },
    {
        type: 'expense', name: 'Housing', icon: '🏡', color: '#f87171',
        subcategories: ['Rent', 'Maintenance', 'Electricity', 'Water']
    },
    {
        type: 'expense', name: 'Bills & Utilities', icon: '📱', color: '#fca5a5',
        subcategories: ['Mobile Recharge', 'Internet', 'Gas', 'DTH / Cable', 'Subscriptions']
    },
    {
        type: 'expense', name: 'Shopping', icon: '🛍️', color: '#fecaca',
        subcategories: ['Clothes', 'Accessories', 'Online Shopping']
    },
    {
        type: 'expense', name: 'Health & Medical', icon: '🏥', color: '#f59e0b',
        subcategories: ['Doctor Visits', 'Medicines', 'Insurance Premiums']
    },
    {
        type: 'expense', name: 'Education', icon: '📚', color: '#d97706',
        subcategories: ['School / College Fees', 'Courses', 'Books']
    },
    {
        type: 'expense', name: 'Entertainment', icon: '🎬', color: '#fbbf24',
        subcategories: ['Movies', 'Games', 'Events']
    },
    {
        type: 'expense', name: 'Personal Care', icon: '💅', color: '#fcd34d',
        subcategories: ['Salon', 'Grooming', 'Cosmetics', 'Fitness / Gym']
    },
    {
        type: 'expense', name: 'Travel', icon: '✈️', color: '#fde68a',
        subcategories: ['Trips', 'Hotels', 'Transport']
    },
    {
        type: 'expense', name: 'Gifts & Donations', icon: '🎁', color: '#fef3c7',
        subcategories: ['Gifts', 'Charity']
    },
    {
        type: 'expense', name: 'EMIs / Loans', icon: '💳', color: '#b91c1c',
        subcategories: ['Education Loan', 'Personal Loan', 'Credit Card EMI']
    },
    {
        type: 'expense', name: 'Others', icon: '📦', color: '#991b1b',
        subcategories: ['Miscellaneous', 'Uncategorized Expenses']
    },

    // INVESTMENT (7 categories)
    {
        type: 'investment', name: 'Stocks', icon: '📊', color: '#3b82f6',
        subcategories: ['Equity', 'IPO']
    },
    {
        type: 'investment', name: 'Mutual Funds', icon: '📉', color: '#2563eb',
        subcategories: ['SIP', 'Lump Sum']
    },
    {
        type: 'investment', name: 'Gold', icon: '🪙', color: '#60a5fa',
        subcategories: ['Physical Gold', 'Digital Gold']
    },
    {
        type: 'investment', name: 'Crypto', icon: '₿', color: '#93c5fd',
        subcategories: ['Bitcoin', 'Altcoins']
    },
    {
        type: 'investment', name: 'Fixed Deposit', icon: '🏦', color: '#bfdbfe',
        subcategories: ['Bank FD', 'Corporate FD']
    },
    {
        type: 'investment', name: 'Real Estate', icon: '🏢', color: '#dbeafe',
        subcategories: ['Land', 'Property']
    },
    {
        type: 'investment', name: 'Other Investments', icon: '💎', color: '#eff6ff',
        subcategories: ['Bonds', 'PPF / NPS']
    }
];

// Insert categories and subcategories
console.log('📝 Creating new category structure...\n');

const insertCategory = db.prepare(`
    INSERT INTO categories (id, name, type, icon, color, is_default, is_active, parent_id, user_id, created_at)
    VALUES (?, ?, ?, ?, ?, TRUE, TRUE, ?, NULL, datetime('now'))
`);

let totalCategories = 0;
let totalSubcategories = 0;

categoryData.forEach(cat => {
    const categoryId = uuidv4();
    insertCategory.run(categoryId, cat.name, cat.type, cat.icon, cat.color, null);
    totalCategories++;

    console.log(`✅ ${cat.icon} ${cat.name} (${cat.type})`);

    // Insert subcategories
    cat.subcategories.forEach(subName => {
        const subId = uuidv4();
        insertCategory.run(subId, subName, cat.type, cat.icon, cat.color, categoryId);
        totalSubcategories++;
        console.log(`   └─ ${subName}`);
    });
    console.log('');
});

// Verification
console.log('🔍 Verification:\n');
const catCount = db.prepare('SELECT COUNT(*) as count FROM categories WHERE user_id IS NULL AND parent_id IS NULL').get();
const subCount = db.prepare('SELECT COUNT(*) as count FROM categories WHERE user_id IS NULL AND parent_id IS NOT NULL').get();

console.log(`   Parent Categories: ${catCount.count} (expected: 26)`);
console.log(`   Subcategories: ${subCount.count} (expected: 70)`);
console.log(`   Total: ${catCount.count + subCount.count} (expected: 96)`);

if (catCount.count === 26 && subCount.count === 70) {
    console.log('\n✅ Category reorganization completed successfully!');
} else {
    console.log('\n⚠️  Warning: Count mismatch!');
}

db.close();
