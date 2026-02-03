/* ========================================
   Category Configuration
   ======================================== */

// Expense Categories
export const expenseCategories = [
    { value: 'groceries', label: 'Food & Dining', icon: '🍽️' },
    { value: 'transport', label: 'Transport', icon: '🚗' },
    { value: 'housing', label: 'Housing', icon: '🏠' },
    { value: 'bills', label: 'Bills & Utilities', icon: '💡' },
    { value: 'shopping', label: 'Shopping', icon: '🛍️' },
    { value: 'healthcare', label: 'Health & Medical', icon: '🏥' },
    { value: 'education', label: 'Education', icon: '📚' },
    { value: 'entertainment', label: 'Entertainment', icon: '🎬' },
    { value: 'personal', label: 'Personal Care', icon: '💅' },
    { value: 'travel', label: 'Travel', icon: '✈️' },
    { value: 'gifts', label: 'Gifts & Donations', icon: '🎁' },
    { value: 'emis', label: 'EMI / Loans', icon: '🏦' },
    { value: 'others', label: 'Others', icon: '📦' },
    { value: '__add_category__', label: '➕ Add Category', icon: '➕' }
];

// Income Categories
export const incomeCategories = [
    { value: 'salary', label: 'Salary', icon: '💼' },
    { value: 'business', label: 'Business', icon: '🏢' },
    { value: 'freelance', label: 'Freelance', icon: '💻' },
    { value: 'interest', label: 'Interest', icon: '📈' },
    { value: 'rental', label: 'Rental Income', icon: '🏡' },
    { value: 'other-income', label: 'Other Income', icon: '💰' }
];

// Investment Categories
export const investmentCategories = [
    { value: 'stocks', label: 'Stocks', icon: '📊' },
    { value: 'mutualmodules', label: 'Mutual Funds', icon: '🧺' },
    { value: 'gold', label: 'Gold', icon: '⚱️' },
    { value: 'crypto', label: 'Crypto', icon: '₿' },
    { value: 'fd', label: 'Fixed Deposit', icon: '🏦' },
    { value: 'realestate', label: 'Real Estate', icon: '🏘️' },
    { value: 'other-investments', label: 'Other Investments', icon: '🗃️' }
];

// Subcategories for Expense Categories
export const categorySubcategories = {
    'groceries': ['Groceries', 'Restaurants', 'Snacks', 'Food Delivery', '➕ Add Subcategory'],
    'transport': ['Fuel', 'Ride Hailing', 'Public Transport', 'Vehicle Maintenance', '➕ Add Subcategory'],
    'housing': ['Rent', 'Maintenance', 'Electricity', 'Water', '➕ Add Subcategory'],
    'bills': ['Mobile Recharge', 'Internet', 'Gas', 'DTH / Cable', 'Subscriptions', '➕ Add Subcategory'],
    'shopping': ['Clothes', 'Accessories', 'Online Shopping', '➕ Add Subcategory'],
    'healthcare': ['Doctor Visits', 'Medicines', 'Insurance Premiums', '➕ Add Subcategory'],
    'education': ['School / College Fees', 'Courses', 'Books', '➕ Add Subcategory'],
    'entertainment': ['Movies', 'Games', 'Events', '➕ Add Subcategory'],
    'personal': ['Salon', 'Grooming', 'Cosmetics', 'Fitness / Gym', '➕ Add Subcategory'],
    'travel': ['Trips', 'Hotels', 'Transport', '➕ Add Subcategory'],
    'gifts': ['Gifts', 'Charity', '➕ Add Subcategory'],
    'emis': ['Education Loan', 'Personal Loan', 'Credit Card EMI', '➕ Add Subcategory'],
    'others': ['Miscellaneous', 'Uncategorized Expenses', '➕ Add Subcategory']
};

// Subcategories for Income Categories
export const incomeSubcategories = {
    'salary': ['Monthly Salary', 'Bonus', 'Incentives'],
    'business': ['Business Profit', 'Side Business'],
    'freelance': ['Client Work', 'Contract Work'],
    'interest': ['Bank Interest', 'FD Interest'],
    'rental': ['House Rent', 'Shop Rent'],
    'other-income': ['Cashback', 'Refunds']
};

// Subcategories for Investment Categories
export const investmentSubcategories = {
    'stocks': ['Equity', 'IPO'],
    'mutualmodules': ['SIP', 'Lump Sum'],
    'gold': ['Physical Gold', 'Digital Gold'],
    'crypto': ['Bitcoin', 'Altcoins'],
    'fd': ['Bank FD', 'Corporate FD'],
    'realestate': ['Land', 'Property'],
    'other-investments': ['Bonds', 'PPF / NPS']
};


// Category Mapping for Display
export const categoryMapping = {
    // Expense
    'groceries': { label: 'Food & Dining', icon: '🍽️' },
    'transport': { label: 'Transport', icon: '🚗' },
    'housing': { label: 'Housing', icon: '🏠' },
    'bills': { label: 'Bills & Utilities', icon: '💡' },
    'shopping': { label: 'Shopping', icon: '🛍️' },
    'healthcare': { label: 'Health & Medical', icon: '🏥' },
    'education': { label: 'Education', icon: '📚' },
    'entertainment': { label: 'Entertainment', icon: '🎬' },
    'personal': { label: 'Personal Care', icon: '💅' },
    'travel': { label: 'Travel', icon: '✈️' },
    'gifts': { label: 'Gifts & Donations', icon: '🎁' },
    'emis': { label: 'EMI / Loans', icon: '🏦' },
    'others': { label: 'Others', icon: '📦' },

    // Income
    'salary': { label: 'Salary', icon: '💼' },
    'business': { label: 'Business', icon: '🏢' },
    'freelance': { label: 'Freelance', icon: '💻' },
    'interest': { label: 'Interest', icon: '📈' },
    'rental': { label: 'Rental Income', icon: '🏡' },
    'other-income': { label: 'Other Income', icon: '💰' },

    // Investment
    'stocks': { label: 'Stocks', icon: '📊' },
    'mutualmodules': { label: 'Mutual Funds', icon: '🧺' },
    'gold': { label: 'Gold', icon: '⚱️' },
    'crypto': { label: 'Crypto', icon: '₿' },
    'fd': { label: 'Fixed Deposit', icon: '🏦' },
    'realestate': { label: 'Real Estate', icon: '🏘️' },
    'other-investments': { label: 'Other Investments', icon: '🗃️' }
};

// Get category info by value
export function getCategoryInfo(categoryValue) {
    return categoryMapping[categoryValue] || { label: categoryValue, icon: '📦' };
}

// Get all categories by type
export function getCategoriesByType(type) {
    if (type === 'income') return incomeCategories;
    if (type === 'investment') return investmentCategories;
    return expenseCategories;
}

// Get subcategories by category
export function getSubcategories(category, type) {
    if (type === 'income') {
        return incomeSubcategories[category] || [];
    }
    if (type === 'investment') {
        return investmentSubcategories[category] || [];
    }
    return categorySubcategories[category] || [];
}
