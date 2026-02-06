// Populate month and year from start_date
const Database = require('better-sqlite3');
const path = require('path');
const DB_PATH = path.join(__dirname, '../../database/expense_tracker.db');
const db = new Database(DB_PATH);

try {
    const budgets = db.prepare("SELECT id, start_date FROM budgets WHERE month IS NULL OR year IS NULL").all();

    const updateStmt = db.prepare("UPDATE budgets SET month = ?, year = ? WHERE id = ?");

    db.transaction(() => {
        for (const budget of budgets) {
            if (budget.start_date) {
                const date = new Date(budget.start_date);
                const month = date.getMonth() + 1;
                const year = date.getFullYear();
                updateStmt.run(month, year, budget.id);
            }
        }
    })();

    console.log(`✅ Populated month/year for ${budgets.length} budget records`);

} catch (e) {
    console.error('❌ Error populating month/year:', e.message);
} finally {
    db.close();
}
