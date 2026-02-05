/* ========================================
   Net Worth Routes
   ======================================== */

const express = require('express');
const router = express.Router();
const { query, queryOne } = require('../config/db');
const { authenticate } = require('../middleware/auth.middleware');

// GET /api/networth
router.get('/', authenticate, (req, res) => {
    const userId = req.user.id;

    const totalIncome = queryOne(`
        SELECT COALESCE(SUM(amount), 0) as total 
        FROM transactions 
        WHERE user_id = ? AND type = 'income'
    `, [userId]);

    const totalExpense = queryOne(`
        SELECT COALESCE(SUM(amount), 0) as total 
        FROM transactions 
        WHERE user_id = ? AND type = 'expense'
    `, [userId]);

    const totalInvestment = queryOne(`
        SELECT COALESCE(SUM(amount), 0) as total 
        FROM transactions 
        WHERE user_id = ? AND type = 'investment'
    `, [userId]);

    const netWorth = totalIncome.total - totalExpense.total;
    const totalAssets = totalIncome.total + totalInvestment.total;

    res.json({
        success: true,
        data: {
            income: totalIncome.total,
            expenses: totalExpense.total,
            investments: totalInvestment.total,
            netWorth,
            totalAssets
        }
    });
});

module.exports = router;
