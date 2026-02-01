-- ============================================
-- Sample User Data for Testing
-- ============================================

-- Demo User
INSERT INTO users (id, email, password_hash, name, phone, is_active, is_verified, created_at) VALUES
('user-001', 'demo@smartexpense.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.E4DBxqQs.NqGPi', 'Demo User', '9876543210', TRUE, TRUE, '2026-01-01 00:00:00');

-- Test User
INSERT INTO users (id, email, password_hash, name, phone, is_active, is_verified, created_at) VALUES
('user-002', 'test@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.E4DBxqQs.NqGPi', 'Test User', '9876543211', TRUE, TRUE, '2026-01-15 00:00:00');

-- Note: Password hash is for 'Test@123' using bcrypt
-- In production, always hash passwords properly

-- ============================================
-- User Settings for Demo User
-- ============================================
INSERT INTO user_settings (id, user_id, currency, currency_symbol, theme, notifications_email, notifications_budget) VALUES
('settings-001', 'user-001', 'INR', '₹', 'light', TRUE, TRUE),
('settings-002', 'user-002', 'INR', '₹', 'dark', TRUE, TRUE);
