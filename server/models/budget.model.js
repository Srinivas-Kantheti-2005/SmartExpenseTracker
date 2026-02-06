/* ========================================
   Budget Model
   ======================================== */

const { query, queryOne, execute } = require('../config/db');
const { generateUUID } = require('../utils/helpers');

const BudgetModel = {
    /**
     * Find all budgets for a user with filters
     */
    findAll(userId, filters = {}) {
        let sql = 'SELECT * FROM budgets WHERE user_id = ?';
        const params = [userId];

        if (filters.month) {
            sql += ' AND month = ?';
            params.push(filters.month);
        }

        if (filters.year) {
            sql += ' AND year = ?';
            params.push(filters.year);
        }

        if (filters.category_id) {
            sql += ' AND category_id = ?';
            params.push(filters.category_id);
        }

        sql += ' ORDER BY created_at DESC';

        return query(sql, params);
    },

    /**
     * Find budget by ID
     */
    findById(id, userId) {
        return queryOne('SELECT * FROM budgets WHERE id = ? AND user_id = ?', [id, userId]);
    },

    /**
     * Create budget
     */
    create(userId, data) {
        const id = generateUUID();

        execute(`
            INSERT INTO budgets (id, user_id, category_id, item_id, amount, period, start_date, end_date, month, year, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `, [
            id,
            userId,
            data.category_id,
            data.item_id || null,
            data.amount,
            data.period || 'monthly',
            data.start_date,
            data.end_date,
            data.month,
            data.year
        ]);

        return this.findById(id, userId);
    },

    /**
     * Update budget
     */
    update(id, userId, updates) {
        const allowedFields = ['amount', 'period', 'start_date', 'end_date', 'item_id', 'month', 'year'];
        const fields = [];
        const values = [];

        for (const [key, value] of Object.entries(updates)) {
            if (allowedFields.includes(key)) {
                fields.push(`${key} = ?`);
                values.push(value);
            }
        }

        if (fields.length === 0) return null;

        values.push(id, userId);
        execute(`UPDATE budgets SET ${fields.join(', ')}, updated_at = datetime('now') WHERE id = ? AND user_id = ?`, values);
        return this.findById(id, userId);
    },

    /**
     * Delete budget
     */
    delete(id, userId) {
        const result = execute('DELETE FROM budgets WHERE id = ? AND user_id = ?', [id, userId]);
        return result.changes > 0;
    }
};

module.exports = BudgetModel;
