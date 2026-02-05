/* ========================================
   Analytics Routes
   ======================================== */

const express = require('express');
const router = express.Router();
const { query } = require('../config/db');
const { authenticate } = require('../middleware/auth.middleware');

// GET /api/analytics/summary
router.get('/summary', authenticate, (req, res) => {
    const { startDate, endDate } = req.query;
    const userId = req.user.id;

    let sql = `
        SELECT 
            type,
            SUM(amount) as total,
            COUNT(*) as count
        FROM transactions 
        WHERE user_id = ?
    `;
    const params = [userId];

    if (startDate) {
        sql += ' AND date >= ?';
        params.push(startDate);
    }

    if (endDate) {
        sql += ' AND date <= ?';
        params.push(endDate);
    }

    sql += ' GROUP BY type';

    const summary = query(sql, params);

    res.json({
        success: true,
        data: summary
    });
});

// GET /api/analytics/category-breakdown
router.get('/category-breakdown', authenticate, (req, res) => {
    const { type, startDate, endDate } = req.query;
    const userId = req.user.id;

    let sql = `
        SELECT 
            c.id as category_id,
            c.name as category_name,
            c.icon,
            c.color,
            SUM(t.amount) as total,
            COUNT(t.id) as count
        FROM transactions t
        JOIN categories c ON t.category_id = c.id
        WHERE t.user_id = ?
    `;
    const params = [userId];

    if (type) {
        sql += ' AND t.type = ?';
        params.push(type);
    }

    if (startDate) {
        sql += ' AND t.date >= ?';
        params.push(startDate);
    }

    if (endDate) {
        sql += ' AND t.date <= ?';
        params.push(endDate);
    }

    sql += ' GROUP BY c.id, c.name, c.icon, c.color ORDER BY total DESC';

    const breakdown = query(sql, params);

    res.json({
        success: true,
        data: breakdown
    });
});

module.exports = router;
