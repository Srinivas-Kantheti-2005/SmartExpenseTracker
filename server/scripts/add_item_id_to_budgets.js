// Update budgets table: add item_id, month, year
const Database = require('better-sqlite3');
const path = require('path');
const DB_PATH = path.join(__dirname, '../../database/expense_tracker.db');
const db = new Database(DB_PATH);

try {
    const columns = db.prepare("PRAGMA table_info(budgets)").all().map(c => c.name);

    if (!columns.includes('item_id')) {
        db.exec('ALTER TABLE budgets ADD COLUMN item_id VARCHAR(36) REFERENCES categories(id) ON DELETE SET NULL');
        console.log('✅ Added item_id column');
    }

    if (!columns.includes('month')) {
        db.exec('ALTER TABLE budgets ADD COLUMN month INTEGER');
        console.log('✅ Added month column');
    }

    if (!columns.includes('year')) {
        db.exec('ALTER TABLE budgets ADD COLUMN year INTEGER');
        console.log('✅ Added year column');
    }

} catch (e) {
    console.error('❌ Error updating database:', e.message);
} finally {
    db.close();
}
