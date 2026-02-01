-- ============================================
-- Default Categories Seed Data
-- ============================================

-- System user ID for default categories (no user association)
-- NULL user_id means it's a default category available to all users

-- ============================================
-- EXPENSE CATEGORIES
-- ============================================

-- Food & Dining
INSERT INTO categories (id, user_id, name, type, icon, color, is_default) VALUES
('cat-exp-001', NULL, 'Food & Dining', 'expense', '🍽️', '#FF6B6B', TRUE);

INSERT INTO categories (id, user_id, name, type, icon, color, is_default, parent_id) VALUES
('cat-exp-001-1', NULL, 'Groceries', 'expense', '🛒', '#FF6B6B', TRUE, 'cat-exp-001'),
('cat-exp-001-2', NULL, 'Restaurants', 'expense', '🍔', '#FF6B6B', TRUE, 'cat-exp-001'),
('cat-exp-001-3', NULL, 'Snacks', 'expense', '🍿', '#FF6B6B', TRUE, 'cat-exp-001'),
('cat-exp-001-4', NULL, 'Food Delivery', 'expense', '🛵', '#FF6B6B', TRUE, 'cat-exp-001');

-- Transport
INSERT INTO categories (id, user_id, name, type, icon, color, is_default) VALUES
('cat-exp-002', NULL, 'Transport', 'expense', '🚗', '#FF7F50', TRUE);

INSERT INTO categories (id, user_id, name, type, icon, color, is_default, parent_id) VALUES
('cat-exp-002-1', NULL, 'Fuel', 'expense', '⛽', '#FF7F50', TRUE, 'cat-exp-002'),
('cat-exp-002-2', NULL, 'Ride Hailing Services', 'expense', '🚕', '#FF7F50', TRUE, 'cat-exp-002'),
('cat-exp-002-3', NULL, 'Public Transport', 'expense', '🚌', '#FF7F50', TRUE, 'cat-exp-002');

-- Housing
INSERT INTO categories (id, user_id, name, type, icon, color, is_default) VALUES
('cat-exp-003', NULL, 'Housing', 'expense', '🏠', '#9B5DE5', TRUE);

INSERT INTO categories (id, user_id, name, type, icon, color, is_default, parent_id) VALUES
('cat-exp-003-1', NULL, 'Rent', 'expense', '🏠', '#9B5DE5', TRUE, 'cat-exp-003'),
('cat-exp-003-2', NULL, 'Maintenance', 'expense', '🔧', '#9B5DE5', TRUE, 'cat-exp-003'),
('cat-exp-003-3', NULL, 'Electricity', 'expense', '💡', '#9B5DE5', TRUE, 'cat-exp-003'),
('cat-exp-003-4', NULL, 'Water', 'expense', '💧', '#9B5DE5', TRUE, 'cat-exp-003');

-- Bills & Utilities
INSERT INTO categories (id, user_id, name, type, icon, color, is_default) VALUES
('cat-exp-004', NULL, 'Bills & Utilities', 'expense', '💡', '#FFA94D', TRUE);

INSERT INTO categories (id, user_id, name, type, icon, color, is_default, parent_id) VALUES
('cat-exp-004-1', NULL, 'Mobile Recharge', 'expense', '📱', '#FFA94D', TRUE, 'cat-exp-004'),
('cat-exp-004-2', NULL, 'Internet', 'expense', '🌐', '#FFA94D', TRUE, 'cat-exp-004'),
('cat-exp-004-3', NULL, 'Gas', 'expense', '🔥', '#FFA94D', TRUE, 'cat-exp-004'),
('cat-exp-004-4', NULL, 'Subscriptions', 'expense', '📺', '#FFA94D', TRUE, 'cat-exp-004');

-- Shopping
INSERT INTO categories (id, user_id, name, type, icon, color, is_default) VALUES
('cat-exp-005', NULL, 'Shopping', 'expense', '🛍️', '#FF85A1', TRUE);

INSERT INTO categories (id, user_id, name, type, icon, color, is_default, parent_id) VALUES
('cat-exp-005-1', NULL, 'Clothes', 'expense', '👕', '#FF85A1', TRUE, 'cat-exp-005'),
('cat-exp-005-2', NULL, 'Accessories', 'expense', '👜', '#FF85A1', TRUE, 'cat-exp-005'),
('cat-exp-005-3', NULL, 'Online Shopping', 'expense', '📦', '#FF85A1', TRUE, 'cat-exp-005');

-- Health & Medical
INSERT INTO categories (id, user_id, name, type, icon, color, is_default) VALUES
('cat-exp-006', NULL, 'Health & Medical', 'expense', '🏥', '#6BCB77', TRUE);

INSERT INTO categories (id, user_id, name, type, icon, color, is_default, parent_id) VALUES
('cat-exp-006-1', NULL, 'Doctor Visits', 'expense', '👨‍⚕️', '#6BCB77', TRUE, 'cat-exp-006'),
('cat-exp-006-2', NULL, 'Medicines', 'expense', '💊', '#6BCB77', TRUE, 'cat-exp-006'),
('cat-exp-006-3', NULL, 'Insurance Premiums', 'expense', '🏥', '#6BCB77', TRUE, 'cat-exp-006');

-- Education
INSERT INTO categories (id, user_id, name, type, icon, color, is_default) VALUES
('cat-exp-007', NULL, 'Education', 'expense', '📚', '#4FACFE', TRUE);

INSERT INTO categories (id, user_id, name, type, icon, color, is_default, parent_id) VALUES
('cat-exp-007-1', NULL, 'College / School Fees', 'expense', '🎓', '#4FACFE', TRUE, 'cat-exp-007'),
('cat-exp-007-2', NULL, 'Courses', 'expense', '💻', '#4FACFE', TRUE, 'cat-exp-007'),
('cat-exp-007-3', NULL, 'Books', 'expense', '📖', '#4FACFE', TRUE, 'cat-exp-007');

-- Entertainment
INSERT INTO categories (id, user_id, name, type, icon, color, is_default) VALUES
('cat-exp-008', NULL, 'Entertainment', 'expense', '🎬', '#F093FB', TRUE);

INSERT INTO categories (id, user_id, name, type, icon, color, is_default, parent_id) VALUES
('cat-exp-008-1', NULL, 'Movies', 'expense', '🎥', '#F093FB', TRUE, 'cat-exp-008'),
('cat-exp-008-2', NULL, 'Games', 'expense', '🎮', '#F093FB', TRUE, 'cat-exp-008'),
('cat-exp-008-3', NULL, 'Events', 'expense', '🎪', '#F093FB', TRUE, 'cat-exp-008');

-- Personal Care
INSERT INTO categories (id, user_id, name, type, icon, color, is_default) VALUES
('cat-exp-009', NULL, 'Personal Care', 'expense', '💅', '#FFCA3A', TRUE);

INSERT INTO categories (id, user_id, name, type, icon, color, is_default, parent_id) VALUES
('cat-exp-009-1', NULL, 'Salon', 'expense', '💇', '#FFCA3A', TRUE, 'cat-exp-009'),
('cat-exp-009-2', NULL, 'Grooming', 'expense', '🧴', '#FFCA3A', TRUE, 'cat-exp-009'),
('cat-exp-009-3', NULL, 'Cosmetics', 'expense', '💄', '#FFCA3A', TRUE, 'cat-exp-009');

-- Travel
INSERT INTO categories (id, user_id, name, type, icon, color, is_default) VALUES
('cat-exp-010', NULL, 'Travel', 'expense', '✈️', '#00F2FE', TRUE);

INSERT INTO categories (id, user_id, name, type, icon, color, is_default, parent_id) VALUES
('cat-exp-010-1', NULL, 'Trips', 'expense', '🗺️', '#00F2FE', TRUE, 'cat-exp-010'),
('cat-exp-010-2', NULL, 'Hotels', 'expense', '🏨', '#00F2FE', TRUE, 'cat-exp-010'),
('cat-exp-010-3', NULL, 'Transportation', 'expense', '🚆', '#00F2FE', TRUE, 'cat-exp-010');

-- Gifts & Donations
INSERT INTO categories (id, user_id, name, type, icon, color, is_default) VALUES
('cat-exp-011', NULL, 'Gifts & Donations', 'expense', '🎁', '#FA709A', TRUE);

INSERT INTO categories (id, user_id, name, type, icon, color, is_default, parent_id) VALUES
('cat-exp-011-1', NULL, 'Gifts', 'expense', '🎀', '#FA709A', TRUE, 'cat-exp-011'),
('cat-exp-011-2', NULL, 'Charity', 'expense', '❤️', '#FA709A', TRUE, 'cat-exp-011'),
('cat-exp-011-3', NULL, 'Festivals', 'expense', '🎉', '#FA709A', TRUE, 'cat-exp-011');

-- EMI / Loans
INSERT INTO categories (id, user_id, name, type, icon, color, is_default) VALUES
('cat-exp-012', NULL, 'EMI / Loans', 'expense', '🏦', '#667EEA', TRUE);

INSERT INTO categories (id, user_id, name, type, icon, color, is_default, parent_id) VALUES
('cat-exp-012-1', NULL, 'Education Loan', 'expense', '🎓', '#667EEA', TRUE, 'cat-exp-012'),
('cat-exp-012-2', NULL, 'Personal Loan', 'expense', '💳', '#667EEA', TRUE, 'cat-exp-012'),
('cat-exp-012-3', NULL, 'Credit Card EMI', 'expense', '💳', '#667EEA', TRUE, 'cat-exp-012');

-- Others
INSERT INTO categories (id, user_id, name, type, icon, color, is_default) VALUES
('cat-exp-013', NULL, 'Others', 'expense', '📦', '#9CA3AF', TRUE);

INSERT INTO categories (id, user_id, name, type, icon, color, is_default, parent_id) VALUES
('cat-exp-013-1', NULL, 'Miscellaneous', 'expense', '📦', '#9CA3AF', TRUE, 'cat-exp-013'),
('cat-exp-013-2', NULL, 'Uncategorized Expenses', 'expense', '❓', '#9CA3AF', TRUE, 'cat-exp-013');

-- ============================================
-- INCOME CATEGORIES
-- ============================================

INSERT INTO categories (id, user_id, name, type, icon, color, is_default) VALUES
('cat-inc-001', NULL, 'Salary', 'income', '💼', '#10B981', TRUE),
('cat-inc-002', NULL, 'Bonus', 'income', '🎉', '#10B981', TRUE),
('cat-inc-003', NULL, 'Returns / Refunds', 'income', '↩️', '#10B981', TRUE),
('cat-inc-004', NULL, 'Investment Returns', 'income', '📈', '#10B981', TRUE),
('cat-inc-005', NULL, 'Freelance / Side Income', 'income', '💻', '#10B981', TRUE),
('cat-inc-006', NULL, 'Other Income', 'income', '💰', '#10B981', TRUE);

-- Income subcategories
INSERT INTO categories (id, user_id, name, type, icon, color, is_default, parent_id) VALUES
('cat-inc-001-1', NULL, 'Monthly Salary', 'income', '💵', '#10B981', TRUE, 'cat-inc-001'),
('cat-inc-001-2', NULL, 'Overtime Pay', 'income', '⏰', '#10B981', TRUE, 'cat-inc-001'),
('cat-inc-001-3', NULL, 'Arrears', 'income', '📋', '#10B981', TRUE, 'cat-inc-001'),
('cat-inc-004-1', NULL, 'Dividend', 'income', '💎', '#10B981', TRUE, 'cat-inc-004'),
('cat-inc-004-2', NULL, 'Interest Income', 'income', '🏦', '#10B981', TRUE, 'cat-inc-004'),
('cat-inc-004-3', NULL, 'Stock Returns', 'income', '📊', '#10B981', TRUE, 'cat-inc-004');
