/* ========================================
   Budget Model
   ======================================== */

const { query, queryOne, execute } = require('../config/db');
const { generateUUID } = require('../utils/helpers');

const BudgetModel = {
    /**
     * Get budgets for a month
     */
    getMonthly(userId, month, year) {
        return query(`
            SELECT b.*, c.name as category_name, c.icon as category_icon, c.color as category_color
            FROM budgets b
            JOIN categories c ON b.category_id = c.id
            WHERE b.user_id = ? AND b.month = ? AND b.year = ? AND b.is_active = 1
            ORDER BY c.name
        `, [userId, month, year]);
    },

    /**
     * Get budget with spent amount calculated
     */
    getWithSpent(userId, month, year) {
        return query(`
            SELECT 
                b.*,
                c.name as category_name,
                c.icon as category_icon,
                c.color as category_color,
                COALESCE(SUM(t.amount), 0) as spent_amount,
                b.budget_amount - COALESCE(SUM(t.amount), 0) as remaining,
                ROUND(COALESCE(SUM(t.amount), 0) * 100.0 / b.budget_amount, 1) as percentage
            FROM budgets b
            JOIN categories c ON b.category_id = c.id
            LEFT JOIN transactions t ON t.category_id = b.category_id 
                AND t.user_id = b.user_id
                AND t.type = 'expense'
                AND strftime('%m', t.transaction_date) = printf('%02d', b.month)
                AND strftime('%Y', t.transaction_date) = CAST(b.year AS TEXT)
            WHERE b.user_id = ? AND b.month = ? AND b.year = ? AND b.is_active = 1
            GROUP BY b.id
            ORDER BY percentage DESC
        `, [userId, month, year]);
    },

    /**
     * Find budget by ID
     */
    findById(id, userId) {
        return queryOne('SELECT * FROM budgets WHERE id = ? AND user_id = ?', [id, userId]);
    },

    /**
     * Create or update budget
     */
    upsert(userId, data) {
        const existing = queryOne(`
            SELECT id FROM budgets 
            WHERE user_id = ? AND category_id = ? AND month = ? AND year = ?
        `, [userId, data.category_id, data.month, data.year]);

        if (existing) {
            execute(`
                UPDATE budgets 
                SET budget_amount = ?, alert_threshold = ?, updated_at = datetime('now')
                WHERE id = ?
            `, [data.amount, data.alert_threshold || 80, existing.id]);
            return this.findById(existing.id, userId);
        } else {
            const id = generateUUID();
            execute(`
                INSERT INTO budgets (id, user_id, email, category_id, budget_amount, month, year, alert_threshold, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
            `, [id, userId, data.email, data.category_id, data.amount, data.month, data.year, data.alert_threshold || 80]);
            return this.findById(id, userId);
        }
    },

    /**
     * Delete budget
     */
    delete(id, userId) {
        const result = execute('UPDATE budgets SET is_active = 0 WHERE id = ? AND user_id = ?', [id, userId]);
        return result.changes > 0;
    },

    /**
     * Get budget alerts (over threshold)
     */
    getAlerts(userId, month, year) {
        return query(`
            SELECT 
                b.*,
                c.name as category_name,
                COALESCE(SUM(t.amount), 0) as spent_amount,
                ROUND(COALESCE(SUM(t.amount), 0) * 100.0 / b.budget_amount, 1) as percentage
            FROM budgets b
            JOIN categories c ON b.category_id = c.id
            LEFT JOIN transactions t ON t.category_id = b.category_id 
                AND t.user_id = b.user_id
                AND t.type = 'expense'
                AND strftime('%m', t.transaction_date) = printf('%02d', b.month)
                AND strftime('%Y', t.transaction_date) = CAST(b.year AS TEXT)
            WHERE b.user_id = ? AND b.month = ? AND b.year = ? AND b.is_active = 1
            GROUP BY b.id
            HAVING percentage >= b.alert_threshold
            ORDER BY percentage DESC
        `, [userId, month, year]);
    }
};

module.exports = BudgetModel;
