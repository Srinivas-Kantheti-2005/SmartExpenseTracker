# Smart Expense Tracker 💰

A modern, intuitive expense tracking application with beautiful UI and comprehensive financial management features.

![Smart Expense Tracker](src/assets/images/logo.png)

## ✨ Features

- **Dashboard** - Overview of income, expenses, and spending patterns
- **Transactions** - Add, edit, and track all financial transactions
- **Categories** - 13 expense + 6 income categories with subcategories
- **Budgets** - Set monthly budgets and track progress
- **Analytics** - Visual reports and spending insights
- **Dark Mode** - Eye-friendly dark theme support
- **Responsive** - Works on desktop, tablet, and mobile

## 🚀 Quick Start

```bash
# 1. Set up database
cd database && ./setup.sh && cd ..

# 2. Install dependencies
npm install

# 3. Start development server
npm start
```

Opens at **http://localhost:3000**

## 📂 Project Structure

```
SmartExpenseTracker/
├── database/                  # SQLite Database
│   ├── expense_tracker.db     # Database file
│   ├── setup.sh               # One-click setup
│   ├── schemas/               # Table definitions
│   └── seeds/                 # Sample data
├── docs/                      # Documentation
│   ├── SETUP.md               # Setup guide
│   └── DATABASE_SCHEMA.md     # DB documentation
├── server/                    # Backend (Node.js)
├── src/                       # Frontend
│   ├── assets/images/         # Logo, icons
│   ├── css/
│   │   ├── base/              # Variables, reset
│   │   ├── components/        # Buttons, cards, forms
│   │   └── pages/             # Page styles
│   ├── js/
│   │   ├── config/            # Constants, schemas
│   │   ├── utils/             # Helpers, formatters
│   │   └── pages/             # Page controllers
│   └── pages/
│       ├── auth/              # Login, Register
│       ├── dashboard/         # Main dashboard
│       ├── transactions/      # Transaction management
│       ├── budget/            # Budget tracking
│       ├── analytics/         # Reports
│       ├── settings/          # Preferences
│       └── profile/           # User profile
├── .editorconfig
├── .gitignore
├── package.json
└── README.md
```

## 🗄️ Database

SQLite database with 9 tables:

| Table | Description |
|-------|-------------|
| `users` | User accounts |
| `user_settings` | Preferences |
| `categories` | 66 expense/income categories |
| `transactions` | Financial records |
| `budgets` | Monthly budgets |
| `sessions` | Login sessions |
| `password_reset_tokens` | Recovery tokens |
| `recurring_transactions` | Auto-repeat entries |
| `audit_logs` | Activity tracking |

```bash
# Connect to database
sqlite3 database/expense_tracker.db
```

## 🔐 Demo Credentials

| Email | Password |
|-------|----------|
| demo@smartexpense.com | Test@123 |
| test@example.com | Test@123 |

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Database**: SQLite
- **Fonts**: Inter (Google Fonts)
- **Icons**: Emoji-based

## 📱 Pages

| Page | Description |
|------|-------------|
| Login | Secure user authentication |
| Register | New account creation with validation |
| Dashboard | Financial overview with charts |
| Transactions | Add/edit income & expenses |
| Budget | Set and track monthly budgets |
| Analytics | Spending reports and trends |
| Settings | Currency, theme, notifications |
| Profile | User information management |

## 🎨 Design Features

- Glassmorphism UI elements
- Gradient backgrounds
- Smooth animations
- Responsive layout
- Toast notifications
- Dark mode support

## 📋 License

MIT License - Feel free to use for personal or commercial projects.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/NewFeature`)
3. Commit changes (`git commit -m 'Add NewFeature'`)
4. Push to branch (`git push origin feature/NewFeature`)
5. Open Pull Request
