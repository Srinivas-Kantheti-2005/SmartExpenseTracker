/* ========================================
   Update Categories Table Schema
   Add support for 'investment' type
   ======================================== */

const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '../../database/expense_tracker.db');
const db = new Database(DB_PATH);

console.log('🔧 Updating categories table schema...\n');

try {
    // Start transaction
    db.exec('BEGIN TRANSACTION');

    // 1. Create backup of existing data
    console.log('📦 Backing up existing data...');
    db.exec(`
        CREATE TABLE categories_backup AS 
        SELECT * FROM categories
    `);

    // 2. Drop old table
    console.log('🗑️  Dropping old table...');
    db.exec('DROP TABLE categories');

    // 3. Create new table with updated constraint
    console.log('✨ Creating new table with investment support...');
    db.exec(`
        CREATE TABLE categories (
            id VARCHAR(36) PRIMARY KEY,
            user_id VARCHAR(36),
            name VARCHAR(100) NOT NULL,
            type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense', 'investment')),
            icon VARCHAR(10),
            color VARCHAR(20),
            is_default BOOLEAN DEFAULT FALSE,
            is_active BOOLEAN DEFAULT TRUE,
            parent_id VARCHAR(36),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
        )
    `);

    // 4. Restore data
    console.log('↩️  Restoring existing data...');
    db.exec(`
        INSERT INTO categories 
        SELECT * FROM categories_backup
    `);

    // 5. Recreate indexes
    console.log('🔍 Recreating indexes...');
    db.exec('CREATE INDEX idx_categories_user ON categories(user_id)');
    db.exec('CREATE INDEX idx_categories_type ON categories(type)');

    // 6. Drop backup table
    db.exec('DROP TABLE categories_backup');

    // Commit transaction
    db.exec('COMMIT');

    console.log('\n✅ Schema update complete!');
    console.log('   - Added support for "investment" type');
    console.log('   - All existing data preserved');

} catch (error) {
    db.exec('ROLLBACK');
    console.error('❌ Error updating schema:', error);
    process.exit(1);
} finally {
    db.close();
}
