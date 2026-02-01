-- ============================================
-- Sample Transactions for Demo User
-- January 2026
-- ============================================

-- Income Transactions
INSERT INTO transactions (id, user_id, category_id, type, amount, description, subcategory, note, transaction_date) VALUES
('txn-001', 'user-001', 'cat-inc-001', 'income', 80000.00, 'Monthly Salary', 'Monthly Salary', 'January salary credited', '2026-01-01'),
('txn-002', 'user-001', 'cat-inc-002', 'income', 15000.00, 'Performance Bonus', 'Performance Bonus', 'Q4 performance bonus', '2026-01-05');

-- Expense Transactions - Food & Dining
INSERT INTO transactions (id, user_id, category_id, type, amount, description, subcategory, note, transaction_date) VALUES
('txn-010', 'user-001', 'cat-exp-001', 'expense', 3500.00, 'Weekly Groceries', 'Groceries', 'Weekly vegetables from DMart', '2026-01-07'),
('txn-011', 'user-001', 'cat-exp-001', 'expense', 1200.00, 'Dinner', 'Restaurants', 'Family dinner at restaurant', '2026-01-10'),
('txn-012', 'user-001', 'cat-exp-001', 'expense', 450.00, 'Zomato Order', 'Food Delivery', 'Biryani from Paradise', '2026-01-15'),
('txn-013', 'user-001', 'cat-exp-001', 'expense', 2800.00, 'Weekly Groceries', 'Groceries', 'Monthly grocery stock', '2026-01-21');

-- Expense Transactions - Transport
INSERT INTO transactions (id, user_id, category_id, type, amount, description, subcategory, note, transaction_date) VALUES
('txn-020', 'user-001', 'cat-exp-002', 'expense', 3000.00, 'Petrol', 'Fuel', 'Full tank refill', '2026-01-08'),
('txn-021', 'user-001', 'cat-exp-002', 'expense', 320.00, 'Ola Ride', 'Ride Hailing Services', 'Office to home - Ola', '2026-01-12'),
('txn-022', 'user-001', 'cat-exp-002', 'expense', 150.00, 'Metro', 'Public Transport', 'Metro recharge', '2026-01-18');

-- Expense Transactions - Bills & Utilities
INSERT INTO transactions (id, user_id, category_id, type, amount, description, subcategory, note, transaction_date) VALUES
('txn-030', 'user-001', 'cat-exp-004', 'expense', 599.00, 'Mobile Recharge', 'Mobile Recharge', 'Jio monthly plan', '2026-01-03'),
('txn-031', 'user-001', 'cat-exp-004', 'expense', 999.00, 'Internet Bill', 'Internet', 'ACT Fibernet', '2026-01-05'),
('txn-032', 'user-001', 'cat-exp-004', 'expense', 199.00, 'Netflix', 'Subscriptions', 'Monthly subscription', '2026-01-07'),
('txn-033', 'user-001', 'cat-exp-004', 'expense', 129.00, 'Spotify', 'Subscriptions', 'Music subscription', '2026-01-07');

-- Expense Transactions - Housing
INSERT INTO transactions (id, user_id, category_id, type, amount, description, subcategory, note, transaction_date) VALUES
('txn-040', 'user-001', 'cat-exp-003', 'expense', 25000.00, 'Rent', 'Rent', 'January rent payment', '2026-01-01'),
('txn-041', 'user-001', 'cat-exp-003', 'expense', 2500.00, 'Electricity Bill', 'Electricity', 'TSSPDCL bill', '2026-01-10'),
('txn-042', 'user-001', 'cat-exp-003', 'expense', 500.00, 'Water Bill', 'Water', 'HMWSSB bill', '2026-01-10');

-- Expense Transactions - EMI / Loans
INSERT INTO transactions (id, user_id, category_id, type, amount, description, subcategory, note, transaction_date) VALUES
('txn-050', 'user-001', 'cat-exp-012', 'expense', 8500.00, 'Education Loan EMI', 'Education Loan', 'HDFC education loan', '2026-01-05'),
('txn-051', 'user-001', 'cat-exp-012', 'expense', 5500.00, 'Credit Card Bill', 'Credit Card EMI', 'ICICI credit card', '2026-01-15');

-- Expense Transactions - Health & Medical
INSERT INTO transactions (id, user_id, category_id, type, amount, description, subcategory, note, transaction_date) VALUES
('txn-060', 'user-001', 'cat-exp-006', 'expense', 800.00, 'Doctor Consultation', 'Doctor Visits', 'General checkup', '2026-01-12'),
('txn-061', 'user-001', 'cat-exp-006', 'expense', 450.00, 'Medicines', 'Medicines', 'Monthly vitamins', '2026-01-12');

-- Expense Transactions - Entertainment
INSERT INTO transactions (id, user_id, category_id, type, amount, description, subcategory, note, transaction_date) VALUES
('txn-070', 'user-001', 'cat-exp-008', 'expense', 600.00, 'Movie Tickets', 'Movies', 'Weekend movie with friends', '2026-01-18'),
('txn-071', 'user-001', 'cat-exp-008', 'expense', 499.00, 'Gaming', 'Games', 'Steam game purchase', '2026-01-20');

-- Expense Transactions - Shopping
INSERT INTO transactions (id, user_id, category_id, type, amount, description, subcategory, note, transaction_date) VALUES
('txn-080', 'user-001', 'cat-exp-005', 'expense', 2500.00, 'Amazon Order', 'Online Shopping', 'Headphones', '2026-01-22'),
('txn-081', 'user-001', 'cat-exp-005', 'expense', 3500.00, 'Clothes', 'Clothes', 'Winter jacket', '2026-01-25');

-- Today's Transactions (January 31, 2026)
INSERT INTO transactions (id, user_id, category_id, type, amount, description, subcategory, note, transaction_date) VALUES
('txn-090', 'user-001', 'cat-exp-001', 'expense', 1850.00, 'Groceries', 'Groceries', 'Weekly vegetables from DMart', '2026-01-31'),
('txn-091', 'user-001', 'cat-exp-002', 'expense', 320.00, 'Cab Ride', 'Ride Hailing Services', 'Office to home - Ola', '2026-01-31'),
('txn-092', 'user-001', 'cat-exp-001', 'expense', 280.00, 'Swiggy Order', 'Food Delivery', 'Lunch order', '2026-01-31'),
('txn-093', 'user-001', 'cat-exp-008', 'expense', 150.00, 'Coffee', 'Movies', 'Starbucks with friends', '2026-01-31');
