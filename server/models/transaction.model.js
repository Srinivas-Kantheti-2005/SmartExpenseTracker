/* ========================================
   Transaction Model
   ======================================== */

const { query, queryOne, execute } = require('../config/db');
const { generateUUID } = require('../utils/helpers');

const TransactionModel = {
    /**
     * Find all transactions with filters (Isolated to User)
     */
    findAll(userId, filters = {}) {
        let sql = 'SELECT * FROM transactions WHERE user_id = ?';
        const params = [userId];

        if (filters.type) {
            sql += ' AND type = ?';
            params.push(filters.type);
        }

        if (filters.category_id) {
            sql += ' AND category_id = ?';
            params.push(filters.category_id);
        }

        if (filters.item_id) {
            sql += ' AND item_id = ?';
            params.push(filters.item_id);
        }

        if (filters.startDate) {
            sql += ' AND date >= ?';
            params.push(filters.startDate);
        }

        if (filters.endDate) {
            sql += ' AND date <= ?';
            params.push(filters.endDate);
        }

        sql += ' ORDER BY date DESC, created_at DESC';

        if (filters.limit) {
            sql += ' LIMIT ?';
            params.push(filters.limit);
        }

        if (filters.offset) {
            sql += ' OFFSET ?';
            params.push(filters.offset);
        }

        return query(sql, params);
    },

    /**
     * Count transactions with filters (Isolated to User)
     */
    count(userId, filters = {}) {
        let sql = 'SELECT COUNT(*) as count FROM transactions WHERE user_id = ?';
        const params = [userId];

        if (filters.type) {
            sql += ' AND type = ?';
            params.push(filters.type);
        }

        if (filters.category_id) {
            sql += ' AND category_id = ?';
            params.push(filters.category_id);
        }

        if (filters.item_id) {
            sql += ' AND item_id = ?';
            params.push(filters.item_id);
        }

        if (filters.startDate) {
            sql += ' AND date >= ?';
            params.push(filters.startDate);
        }

        if (filters.endDate) {
            sql += ' AND date <= ?';
            params.push(filters.endDate);
        }

        const result = queryOne(sql, params);
        return result?.count || 0;
    },

    /**
     * Find transaction by ID (Isolated to User)
     */
    findById(id, userId) {
        return queryOne('SELECT * FROM transactions WHERE id = ? AND user_id = ?', [id, userId]);
    },

    /**
     * Create transaction
     */
    create(userId, data) {
        const id = generateUUID();

        execute(`
            INSERT INTO transactions (id, user_id, type, amount, category_id, item_id, date, description, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `, [id, userId, data.type, data.amount, data.category_id, data.item_id || null, data.date, data.description || '']);

        return this.findById(id, userId);
    },

    /**
     * Update transaction (Isolated to User)
     */
    update(id, userId, updates) {
        const allowedFields = ['type', 'amount', 'category_id', 'item_id', 'date', 'description'];
        const fields = [];
        const values = [];

        for (let [key, value] of Object.entries(updates)) {
            if (allowedFields.includes(key)) {
                fields.push(`${key} = ?`);
                values.push(value);
            }
        }

        if (fields.length === 0) return null;

        values.push(id, userId);
        execute(`UPDATE transactions SET ${fields.join(', ')}, updated_at = datetime('now') WHERE id = ? AND user_id = ?`, values);
        return this.findById(id, userId);
    },

    /**
     * Delete transaction (Isolated to User)
     */
    delete(id, userId) {
        const result = execute('DELETE FROM transactions WHERE id = ? AND user_id = ?', [id, userId]);
        return result.changes > 0;
    }
};

module.exports = TransactionModel;
