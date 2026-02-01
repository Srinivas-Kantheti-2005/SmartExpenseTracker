/* ========================================
   Transaction Model
   ======================================== */

const { query, queryOne, execute } = require('../config/db');
const { generateUUID } = require('../utils/helpers');

const TransactionModel = {
    /**
     * Find transaction by ID
     */
    findById(id, userId) {
        return queryOne(`
            SELECT t.*, c.name as category_name, c.icon as category_icon
            FROM transactions t
            LEFT JOIN categories c ON t.category_id = c.id
            WHERE t.id = ? AND t.user_id = ?
        `, [id, userId]);
    },

    /**
     * Get all transactions for user with filters
     */
    findAll(userId, filters = {}) {
        let sql = `
            SELECT t.*, c.name as category_name, c.icon as category_icon
            FROM transactions t
            LEFT JOIN categories c ON t.category_id = c.id
            WHERE t.user_id = ?
        `;
        const params = [userId];

        // Apply filters
        if (filters.type) {
            sql += ' AND t.type = ?';
            params.push(filters.type);
        }

        if (filters.category_id) {
            sql += ' AND t.category_id = ?';
            params.push(filters.category_id);
        }

        if (filters.startDate) {
            sql += ' AND t.transaction_date >= ?';
            params.push(filters.startDate);
        }

        if (filters.endDate) {
            sql += ' AND t.transaction_date <= ?';
            params.push(filters.endDate);
        }

        // Order and pagination
        sql += ' ORDER BY t.transaction_date DESC, t.created_at DESC';

        if (filters.limit) {
            sql += ' LIMIT ?';
            params.push(filters.limit);

            if (filters.offset) {
                sql += ' OFFSET ?';
                params.push(filters.offset);
            }
        }

        return query(sql, params);
    },

    /**
     * Get transaction count
     */
    count(userId, filters = {}) {
        let sql = 'SELECT COUNT(*) as total FROM transactions WHERE user_id = ?';
        const params = [userId];

        if (filters.type) {
            sql += ' AND type = ?';
            params.push(filters.type);
        }

        if (filters.startDate) {
            sql += ' AND transaction_date >= ?';
            params.push(filters.startDate);
        }

        if (filters.endDate) {
            sql += ' AND transaction_date <= ?';
            params.push(filters.endDate);
        }

        return queryOne(sql, params).total;
    },

    /**
     * Create new transaction
     */
    create(userId, data) {
        const id = generateUUID();

        execute(`
            INSERT INTO transactions 
            (id, user_id, category_id, type, amount, description, subcategory, note, 
             transaction_date, payment_method, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `, [
            id, userId, data.category_id, data.type, data.amount,
            data.description || null, data.subcategory || null, data.note || null,
            data.date, data.payment_method || null
        ]);

        return this.findById(id, userId);
    },

    /**
     * Update transaction
     */
    update(id, userId, updates) {
        const allowedFields = ['category_id', 'type', 'amount', 'description',
            'subcategory', 'note', 'transaction_date', 'payment_method'];
        const fields = [];
        const values = [];

        for (const [key, value] of Object.entries(updates)) {
            if (allowedFields.includes(key)) {
                fields.push(`${key} = ?`);
                values.push(value);
            }
        }

        if (fields.length === 0) return null;

        fields.push("updated_at = datetime('now')");
        values.push(id, userId);

        execute(`UPDATE transactions SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`, values);
        return this.findById(id, userId);
    },

    /**
     * Delete transaction
     */
    delete(id, userId) {
        const result = execute('DELETE FROM transactions WHERE id = ? AND user_id = ?', [id, userId]);
        return result.changes > 0;
    },

    /**
     * Get monthly summary
     */
    getMonthlySummary(userId, month, year) {
        return queryOne(`
            SELECT 
                COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
                COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expense
            FROM transactions
            WHERE user_id = ?
            AND strftime('%m', transaction_date) = ?
            AND strftime('%Y', transaction_date) = ?
        `, [userId, month.toString().padStart(2, '0'), year.toString()]);
    },

    /**
     * Get category-wise breakdown
     */
    getCategoryBreakdown(userId, month, year) {
        return query(`
            SELECT 
                c.name as category,
                c.icon,
                c.color,
                SUM(t.amount) as amount
            FROM transactions t
            JOIN categories c ON t.category_id = c.id
            WHERE t.user_id = ?
            AND t.type = 'expense'
            AND strftime('%m', t.transaction_date) = ?
            AND strftime('%Y', t.transaction_date) = ?
            GROUP BY c.id
            ORDER BY amount DESC
        `, [userId, month.toString().padStart(2, '0'), year.toString()]);
    }
};

module.exports = TransactionModel;
