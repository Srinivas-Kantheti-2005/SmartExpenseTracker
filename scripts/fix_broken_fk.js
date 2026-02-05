const { getDatabase, execute, initDatabase } = require('../server/config/db');

async function fixBrokenForeignKeys() {
    console.log('Starting migration to fix broken foreign keys...');

    try {
        await initDatabase();
        const db = getDatabase();

        db.pragma('foreign_keys = OFF');

        const transaction = db.transaction(() => {
            // 1. Transactions
            console.log('Migrating transactions...');
            // Check if temp table exists from failed run and drop if so
            db.exec('DROP TABLE IF EXISTS transactions_temp');

            db.exec('ALTER TABLE transactions RENAME TO transactions_temp');
            // Drop old indexes to free up names
            db.exec('DROP INDEX IF EXISTS idx_transactions_user');
            db.exec('DROP INDEX IF EXISTS idx_transactions_date');
            db.exec('DROP INDEX IF EXISTS idx_transactions_type');
            db.exec('DROP INDEX IF EXISTS idx_transactions_category');

            db.exec(`
                CREATE TABLE transactions (
                    id VARCHAR(36) PRIMARY KEY,
                    user_id VARCHAR(36) NOT NULL,
                    category_id VARCHAR(36) NOT NULL,
                    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
                    amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
                    description VARCHAR(255),
                    subcategory VARCHAR(100),
                    note TEXT,
                    transaction_date DATE NOT NULL,
                    payment_method VARCHAR(50),
                    is_recurring BOOLEAN DEFAULT FALSE,
                    recurring_frequency VARCHAR(20),
                    tags VARCHAR(255),
                    attachment_url VARCHAR(500),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
                )
            `);

            db.exec(`CREATE INDEX idx_transactions_user ON transactions(user_id)`);
            db.exec(`CREATE INDEX idx_transactions_date ON transactions(transaction_date)`);
            db.exec(`CREATE INDEX idx_transactions_type ON transactions(type)`);
            db.exec(`CREATE INDEX idx_transactions_category ON transactions(category_id)`);

            // Copy data
            db.exec('INSERT INTO transactions SELECT * FROM transactions_temp');
            db.exec('DROP TABLE transactions_temp');


            // 2. Budgets
            console.log('Migrating budgets...');
            db.exec('DROP TABLE IF EXISTS budgets_temp');
            db.exec('ALTER TABLE budgets RENAME TO budgets_temp');
            db.exec('DROP INDEX IF EXISTS idx_budgets_user_month');

            db.exec(`
                CREATE TABLE budgets (
                    id VARCHAR(36) PRIMARY KEY,
                    user_id VARCHAR(36) NOT NULL,
                    category_id VARCHAR(36) NOT NULL,
                    budget_amount DECIMAL(15, 2) NOT NULL CHECK (budget_amount > 0),
                    spent_amount DECIMAL(15, 2) DEFAULT 0,
                    month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
                    year INT NOT NULL,
                    alert_threshold INT DEFAULT 80 CHECK (alert_threshold BETWEEN 0 AND 100),
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
                    email VARCHAR(255),
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
                    UNIQUE(user_id, category_id, month, year)
                )
            `);

            db.exec(`CREATE INDEX idx_budgets_user_month ON budgets(user_id, month, year)`);

            // Copy data
            db.exec('INSERT INTO budgets SELECT * FROM budgets_temp');
            db.exec('DROP TABLE budgets_temp');


            // 3. Recurring Transactions
            console.log('Migrating recurring_transactions...');
            db.exec('DROP TABLE IF EXISTS recurring_transactions_temp');
            db.exec('ALTER TABLE recurring_transactions RENAME TO recurring_transactions_temp');
            db.exec('DROP INDEX IF EXISTS idx_recurring_user');
            db.exec('DROP INDEX IF EXISTS idx_recurring_next');

            db.exec(`
                CREATE TABLE recurring_transactions (
                    id VARCHAR(36) PRIMARY KEY,
                    user_id VARCHAR(36) NOT NULL,
                    category_id VARCHAR(36) NOT NULL,
                    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
                    amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
                    description VARCHAR(255),
                    subcategory VARCHAR(100),
                    frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
                    start_date DATE NOT NULL,
                    end_date DATE,
                    next_occurrence DATE,
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
                )
            `);

            db.exec(`CREATE INDEX idx_recurring_user ON recurring_transactions(user_id)`);
            db.exec(`CREATE INDEX idx_recurring_next ON recurring_transactions(next_occurrence)`);

            // Copy data
            db.exec('INSERT INTO recurring_transactions SELECT * FROM recurring_transactions_temp');
            db.exec('DROP TABLE recurring_transactions_temp');

        });

        transaction();

        db.pragma('foreign_keys = ON');
        console.log('✅ Migration successful!');

    } catch (error) {
        console.error('❌ Migration failed:', error);
    }
}

fixBrokenForeignKeys();
