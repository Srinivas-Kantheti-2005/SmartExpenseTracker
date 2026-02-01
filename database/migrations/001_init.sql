-- ============================================
-- Migration 001: Initial Schema
-- Smart Expense Tracker Database
-- Created: 2026-01-31
-- ============================================

-- This migration creates the initial database structure
-- Run with: sqlite3 expense_tracker.db < migrations/001_init.sql

.read ../schema/create_tables.sql

-- Migration metadata
CREATE TABLE IF NOT EXISTS migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO migrations (name) VALUES ('001_init');
