# Smart Expense Tracker - Database

This folder contains all database schemas, migrations, and seed data for the Smart Expense Tracker application.

## 📁 Folder Structure

```
database/
├── README.md              # This file
├── schemas/               # Table creation scripts
│   └── create_tables.sql  # Complete schema with all tables
├── seeds/                 # Sample/default data
│   ├── categories.sql     # Default expense & income categories
│   ├── users.sql          # Demo user accounts
│   ├── transactions.sql   # Sample transactions
│   └── budgets.sql        # Sample budget data
└── migrations/            # Database migration scripts (future)
```

## 📊 Database Tables

| Table | Description |
|-------|-------------|
| `users` | User account information |
| `user_settings` | User preferences (currency, theme, etc.) |
| `categories` | Expense and income categories |
| `transactions` | All financial transactions |
| `budgets` | Monthly budget by category |
| `sessions` | Active user sessions |
| `password_reset_tokens` | Password reset requests |
| `recurring_transactions` | Recurring transaction templates |
| `audit_logs` | Action tracking for security |

## 🚀 Quick Start

### Option 1: SQLite (Recommended for development)

```bash
# Install SQLite if not already installed
# macOS: Already installed
# Windows: Download from https://sqlite.org/download.html

# Create database and run schema
cd database
sqlite3 expense_tracker.db < schemas/create_tables.sql

# Load seed data
sqlite3 expense_tracker.db < seeds/categories.sql
sqlite3 expense_tracker.db < seeds/users.sql
sqlite3 expense_tracker.db < seeds/transactions.sql
sqlite3 expense_tracker.db < seeds/budgets.sql
```

### Option 2: MySQL

```bash
# Create database
mysql -u root -p -e "CREATE DATABASE expense_tracker;"

# Run schema
mysql -u root -p expense_tracker < schemas/create_tables.sql

# Load seed data
mysql -u root -p expense_tracker < seeds/categories.sql
mysql -u root -p expense_tracker < seeds/users.sql
mysql -u root -p expense_tracker < seeds/transactions.sql
mysql -u root -p expense_tracker < seeds/budgets.sql
```

### Option 3: PostgreSQL

```bash
# Create database
createdb expense_tracker

# Run schema
psql expense_tracker < schemas/create_tables.sql

# Load seed data
psql expense_tracker < seeds/categories.sql
psql expense_tracker < seeds/users.sql
psql expense_tracker < seeds/transactions.sql
psql expense_tracker < seeds/budgets.sql
```

## 🔐 Demo Credentials

| Email | Password | Notes |
|-------|----------|-------|
| demo@smartexpense.com | Test@123 | Full demo data |
| test@example.com | Test@123 | Empty account |

## 📈 Entity Relationship Diagram

```
┌─────────────┐       ┌──────────────┐       ┌─────────────┐
│   users     │──────<│ user_settings│       │  categories │
└─────────────┘       └──────────────┘       └─────────────┘
       │                                            │
       │               ┌──────────────┐             │
       └──────────────>│ transactions │<────────────┘
       │               └──────────────┘
       │
       │               ┌──────────────┐
       └──────────────>│   budgets    │<────────────┐
       │               └──────────────┘             │
       │                                            │
       │               ┌──────────────┐             │
       └──────────────>│  sessions    │             │
       │               └──────────────┘             │
       │                                            │
       │               ┌──────────────────────┐     │
       └──────────────>│ password_reset_tokens│     │
                       └──────────────────────┘     │
                                                    │
                       ┌───────────────────────┐    │
                       │ recurring_transactions│────┘
                       └───────────────────────┘
```

## 🔄 Migrations

For future schema changes, add migration files in the `migrations/` folder:

```
migrations/
├── 001_initial_schema.sql
├── 002_add_tags_to_transactions.sql
└── 003_add_payment_methods.sql
```

## 📝 Notes

- All IDs use UUID format (VARCHAR(36))
- Passwords are stored as bcrypt hashes
- Timestamps use ISO 8601 format
- Amounts are stored as DECIMAL(15, 2) for precision
- Categories support hierarchical structure (parent_id)
