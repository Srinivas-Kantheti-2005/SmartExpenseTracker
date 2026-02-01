-- ============================================
-- Sample Budgets for Demo User
-- January 2026
-- ============================================

INSERT INTO budgets (id, user_id, category_id, budget_amount, spent_amount, month, year, alert_threshold) VALUES
-- Food & Dining Budget
('budget-001', 'user-001', 'cat-exp-001', 10000.00, 7950.00, 1, 2026, 80),

-- Transport Budget
('budget-002', 'user-001', 'cat-exp-002', 5000.00, 3470.00, 1, 2026, 80),

-- Bills & Utilities Budget
('budget-003', 'user-001', 'cat-exp-004', 3000.00, 1926.00, 1, 2026, 80),

-- Housing Budget
('budget-004', 'user-001', 'cat-exp-003', 30000.00, 28000.00, 1, 2026, 90),

-- EMI / Loans Budget
('budget-005', 'user-001', 'cat-exp-012', 15000.00, 14000.00, 1, 2026, 85),

-- Health & Medical Budget
('budget-006', 'user-001', 'cat-exp-006', 3000.00, 1250.00, 1, 2026, 80),

-- Entertainment Budget
('budget-007', 'user-001', 'cat-exp-008', 3000.00, 1249.00, 1, 2026, 80),

-- Shopping Budget
('budget-008', 'user-001', 'cat-exp-005', 5000.00, 6000.00, 1, 2026, 80);

-- Note: Shopping is over budget (spent 6000 on 5000 budget)
