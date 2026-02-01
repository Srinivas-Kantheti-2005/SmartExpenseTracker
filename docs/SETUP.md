# Smart Expense Tracker - Setup Guide

Complete guide to set up and run the Smart Expense Tracker application.

## Prerequisites

- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **SQLite** (comes pre-installed on macOS)
- **Modern browser** (Chrome, Firefox, Safari, Edge)

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/SmartExpenseTracker.git
cd SmartExpenseTracker
```

### 2. Set Up Database

```bash
# Navigate to database folder and run setup
cd database
./setup.sh
```

This creates `expense_tracker.db` with:
- ✅ 9 database tables
- ✅ 66 categories (expense + income)
- ✅ 2 demo users
- ✅ 28 sample transactions
- ✅ 8 budget entries

### 3. Install Dependencies

```bash
cd ..
npm install
```

### 4. Start Development Server

```bash
npm start
```

Opens at **http://localhost:3000**

## Demo Credentials

| Email | Password | Description |
|-------|----------|-------------|
| demo@smartexpense.com | Test@123 | Full demo data |
| test@example.com | Test@123 | Empty account |

## Project Structure

```
SmartExpenseTracker/
├── database/                  # SQLite database
│   ├── expense_tracker.db     # Database file
│   ├── setup.sh               # Setup script
│   ├── schemas/               # Table definitions
│   └── seeds/                 # Sample data
├── docs/                      # Documentation
│   ├── SETUP.md               # This file
│   └── DATABASE_SCHEMA.md     # Database schema
├── server/                    # Backend (future)
├── src/                       # Frontend source
│   ├── assets/                # Images, fonts
│   ├── css/                   # Stylesheets
│   │   ├── base/              # Variables, reset
│   │   ├── components/        # Reusable styles
│   │   └── pages/             # Page-specific
│   ├── js/                    # JavaScript
│   │   ├── config/            # Constants, schemas
│   │   ├── utils/             # Helpers
│   │   └── pages/             # Page controllers
│   └── pages/                 # HTML pages
│       ├── auth/              # Login, Register
│       ├── dashboard/         # Main dashboard
│       ├── transactions/      # Transaction list
│       ├── budget/            # Budget management
│       ├── analytics/         # Reports
│       ├── settings/          # Preferences
│       └── profile/           # User profile
├── .editorconfig              # Editor settings
├── .gitignore                 # Git ignore rules
├── package.json               # NPM config
└── README.md                  # Project overview
```

## Available Pages

| Page | Path | Description |
|------|------|-------------|
| Login | `/src/pages/auth/login.html` | User login |
| Register | `/src/pages/auth/register.html` | New user signup |
| Dashboard | `/src/pages/dashboard/` | Overview & charts |
| Transactions | `/src/pages/transactions/` | Add/edit transactions |
| Budget | `/src/pages/budget/` | Monthly budgets |
| Analytics | `/src/pages/analytics/` | Expense reports |
| Settings | `/src/pages/settings/` | App preferences |
| Profile | `/src/pages/profile/` | User profile |

## Database Commands

```bash
# Connect to database
sqlite3 database/expense_tracker.db

# View all tables
.tables

# View table schema
.schema users

# Query data
SELECT * FROM users;
SELECT * FROM transactions LIMIT 10;

# Exit
.quit
```

## Development Notes

### Current Storage
- Frontend uses **localStorage** for demo purposes
- SQLite database ready for backend integration

### To Connect Backend
1. Set up Node.js/Express server in `/server`
2. Connect to SQLite using `better-sqlite3` or similar
3. Create REST API endpoints
4. Update frontend to use API calls

## Troubleshooting

### Database not creating?
```bash
# Check SQLite is installed
sqlite3 --version

# Run setup manually
cd database
sqlite3 expense_tracker.db < schemas/create_tables.sql
```

### Pages not loading?
- Check file paths are correct
- Open browser console (F12) for errors
- Ensure you're accessing files via localhost, not file://

### Styles not applying?
- Hard refresh: Cmd+Shift+R (Mac) / Ctrl+Shift+R (Windows)
- Clear browser cache

## Support

For issues or feature requests, please open a GitHub issue.
