/* ========================================
   Budget Model
   ======================================== */

const { query, queryOne, execute } = require('../config/db');
const { generateUUID } = require('../utils/helpers');

const BudgetModel = {
    /**
     * Find all budgets for a user
     */
    findAll(userId) {
        return query(`
            SELECT * FROM budgets 
            WHERE user_id = ? 
            ORDER BY created_at DESC
        `, [userId]);
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
            INSERT INTO budgets (id, user_id, category_id, amount, period, start_date, end_date, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `, [id, userId, data.category_id, data.amount, data.period || 'monthly', data.start_date, data.end_date]);

        return this.findById(id, userId);
    },

    /**
     * Update budget
     */
    update(id, userId, updates) {
        const allowedFields = ['amount', 'period', 'start_date', 'end_date'];
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
        execute(`UPDATE budgets SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`, values);
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
