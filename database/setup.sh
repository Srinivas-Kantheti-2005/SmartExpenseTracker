#!/bin/bash

# ============================================
# Smart Expense Tracker - Database Setup Script
# ============================================

echo "🚀 Smart Expense Tracker - Database Setup"
echo "=========================================="

# Check for SQLite
if ! command -v sqlite3 &> /dev/null; then
    echo "❌ SQLite is not installed. Please install SQLite first."
    echo "   macOS: brew install sqlite"
    echo "   Ubuntu: sudo apt install sqlite3"
    exit 1
fi

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DB_FILE="$SCRIPT_DIR/expense_tracker.db"

# Remove existing database if exists
if [ -f "$DB_FILE" ]; then
    echo "⚠️  Existing database found. Removing..."
    rm "$DB_FILE"
fi

echo "📦 Creating database..."

# Create tables
echo "   Creating tables..."
sqlite3 "$DB_FILE" < "$SCRIPT_DIR/schemas/create_tables.sql"

# Load seed data
echo "   Loading categories..."
sqlite3 "$DB_FILE" < "$SCRIPT_DIR/seeds/categories.sql"

echo "   Loading users..."
sqlite3 "$DB_FILE" < "$SCRIPT_DIR/seeds/users.sql"

echo "   Loading transactions..."
sqlite3 "$DB_FILE" < "$SCRIPT_DIR/seeds/transactions.sql"

echo "   Loading budgets..."
sqlite3 "$DB_FILE" < "$SCRIPT_DIR/seeds/budgets.sql"

echo ""
echo "✅ Database created successfully!"
echo "📍 Location: $DB_FILE"
echo ""
echo "📊 Tables created:"
sqlite3 "$DB_FILE" ".tables"
echo ""
echo "👤 Demo credentials:"
echo "   Email: demo@smartexpense.com"
echo "   Password: Test@123"
echo ""
echo "🔗 To connect: sqlite3 $DB_FILE"
