/* ========================================
   Investment Model
   ======================================== */

const { query, queryOne, execute } = require('../config/db');
const { generateUUID } = require('../utils/helpers');

const InvestmentModel = {
    /**
     * Find all investments for a user
     */
    findAll(userId) {
        return query(`
            SELECT * FROM transactions 
            WHERE user_id = ? AND type = 'investment'
            ORDER BY date DESC
        `, [userId]);
    },

    /**
     * Get investment summary
     */
    getSummary(userId) {
        return queryOne(`
            SELECT 
                COUNT(*) as total_investments,
                SUM(amount) as total_invested
            FROM transactions 
            WHERE user_id = ? AND type = 'investment'
        `, [userId]);
    }
};

module.exports = InvestmentModel;
