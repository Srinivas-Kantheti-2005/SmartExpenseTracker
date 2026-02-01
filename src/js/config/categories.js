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
    { value: 'bonus', label: 'Bonus', icon: '🎉' },
    { value: 'returns', label: 'Returns / Refunds', icon: '↩️' },
    { value: 'investment', label: 'Investment Returns', icon: '📈' },
    { value: 'freelance', label: 'Freelance / Side Income', icon: '💻' },
    { value: 'other-income', label: 'Other Income', icon: '💰' }
];

// Subcategories for Expense Categories
export const categorySubcategories = {
    'groceries': ['Groceries', 'Restaurants', 'Snacks', 'Food Delivery', '➕ Add Subcategory'],
    'transport': ['Fuel', 'Ride Hailing Services', 'Public Transport', '➕ Add Subcategory'],
    'housing': ['Rent', 'Maintenance', 'Electricity', 'Water', '➕ Add Subcategory'],
    'bills': ['Mobile Recharge', 'Internet', 'Gas', 'Subscriptions', '➕ Add Subcategory'],
    'shopping': ['Clothes', 'Accessories', 'Online Shopping', '➕ Add Subcategory'],
    'healthcare': ['Doctor Visits', 'Medicines', 'Insurance Premiums', '➕ Add Subcategory'],
    'education': ['College / School Fees', 'Courses', 'Books', '➕ Add Subcategory'],
    'entertainment': ['Movies', 'Games', 'Events', '➕ Add Subcategory'],
    'personal': ['Salon', 'Grooming', 'Cosmetics', '➕ Add Subcategory'],
    'travel': ['Trips', 'Hotels', 'Transportation', '➕ Add Subcategory'],
    'gifts': ['Gifts', 'Charity', 'Festivals', '➕ Add Subcategory'],
    'emis': ['Education Loan', 'Personal Loan', 'Credit Card EMI', '➕ Add Subcategory'],
    'others': ['Miscellaneous', 'Uncategorized Expenses', '➕ Add Subcategory']
};

// Subcategories for Income Categories
export const incomeSubcategories = {
    'salary': ['Monthly Salary', 'Overtime Pay', 'Arrears'],
    'bonus': ['Annual Bonus', 'Performance Bonus', 'Festival Bonus'],
    'returns': ['Product Return', 'Tax Refund', 'Deposit Refund'],
    'investment': ['Dividend', 'Interest Income', 'Stock Returns', 'Mutual Fund Returns'],
    'freelance': ['Project Payment', 'Consulting Fee', 'Contract Work'],
    'other-income': ['Gift Received', 'Rental Income', 'Side Business']
};

// Category Mapping for Display
export const categoryMapping = {
    'emis': { label: 'EMI / Loans', icon: '🏦' },
    'bills': { label: 'Bills & Utilities', icon: '💡' },
    'groceries': { label: 'Food & Dining', icon: '🍽️' },
    'healthcare': { label: 'Health & Medical', icon: '🏥' },
    'transport': { label: 'Transport', icon: '🚗' },
    'housing': { label: 'Housing', icon: '🏠' },
    'shopping': { label: 'Shopping', icon: '🛍️' },
    'education': { label: 'Education', icon: '📚' },
    'entertainment': { label: 'Entertainment', icon: '🎬' },
    'personal': { label: 'Personal Care', icon: '💅' },
    'travel': { label: 'Travel', icon: '✈️' },
    'gifts': { label: 'Gifts & Donations', icon: '🎁' },
    'others': { label: 'Others', icon: '📦' },
    'salary': { label: 'Salary', icon: '💼' },
    'bonus': { label: 'Bonus', icon: '🎉' },
    'returns': { label: 'Returns / Refunds', icon: '↩️' },
    'investment': { label: 'Investment Returns', icon: '📈' },
    'freelance': { label: 'Freelance', icon: '💻' },
    'other-income': { label: 'Other Income', icon: '💰' }
};

// Get category info by value
export function getCategoryInfo(categoryValue) {
    return categoryMapping[categoryValue] || { label: categoryValue, icon: '📦' };
}

// Get all categories by type
export function getCategoriesByType(type) {
    return type === 'income' ? incomeCategories : expenseCategories;
}

// Get subcategories by category
export function getSubcategories(category, type) {
    if (type === 'income') {
        return incomeSubcategories[category] || [];
    }
    return categorySubcategories[category] || [];
}
