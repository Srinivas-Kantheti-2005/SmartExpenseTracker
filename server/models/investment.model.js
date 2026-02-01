/* ========================================
   Investment Model
   ======================================== */

const { query, queryOne, execute } = require('../config/db');
const { generateUUID } = require('../utils/helpers');

const InvestmentModel = {
    /**
     * Get all investments for user
     */
    findAll(userId) {
        return query(`
            SELECT * FROM investments
            WHERE user_id = ? AND is_active = 1
            ORDER BY created_at DESC
        `, [userId]);
    },

    /**
     * Get investment by ID
     */
    findById(id, userId) {
        return queryOne('SELECT * FROM investments WHERE id = ? AND user_id = ?', [id, userId]);
    },

    /**
     * Get net worth summary
     */
    getNetWorth(userId) {
        const assets = query(`
            SELECT name, type, current_value as value
            FROM investments
            WHERE user_id = ? AND is_active = 1 AND type = 'asset'
        `, [userId]);

        const liabilities = query(`
            SELECT name, type, current_value as value
            FROM investments
            WHERE user_id = ? AND is_active = 1 AND type = 'liability'
        `, [userId]);

        const totalAssets = assets.reduce((sum, a) => sum + a.value, 0);
        const totalLiabilities = liabilities.reduce((sum, l) => sum + l.value, 0);

        return {
            total_assets: totalAssets,
            total_liabilities: totalLiabilities,
            net_worth: totalAssets - totalLiabilities,
            assets,
            liabilities
        };
    },

    /**
     * Create investment/asset/liability
     */
    create(userId, data) {
        const id = generateUUID();

        execute(`
            INSERT INTO investments (id, user_id, name, type, category, initial_value, current_value, notes, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `, [id, userId, data.name, data.type, data.category || null, data.initial_value, data.current_value || data.initial_value, data.notes || null]);

        return this.findById(id, userId);
    },

    /**
     * Update investment value
     */
    updateValue(id, userId, currentValue) {
        execute(`
            UPDATE investments SET current_value = ?, updated_at = datetime('now')
            WHERE id = ? AND user_id = ?
        `, [currentValue, id, userId]);
        return this.findById(id, userId);
    },

    /**
     * Delete investment
     */
    delete(id, userId) {
        const result = execute('UPDATE investments SET is_active = 0 WHERE id = ? AND user_id = ?', [id, userId]);
        return result.changes > 0;
    }
};

module.exports = InvestmentModel;
