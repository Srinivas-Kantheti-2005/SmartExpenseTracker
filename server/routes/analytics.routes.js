/* ========================================
   Analytics Routes
   ======================================== */

const express = require('express');
const router = express.Router();
const TransactionModel = require('../models/transaction.model');
const { authenticate } = require('../middleware/auth.middleware');

// GET /api/analytics/summary
router.get('/summary', authenticate, (req, res) => {
    const now = new Date();
    const { month = now.getMonth() + 1, year = now.getFullYear() } = req.query;

    const summary = TransactionModel.getMonthlySummary(req.user.id, parseInt(month), parseInt(year));

    const balance = summary.total_income - summary.total_expense;
    const savingsRate = summary.total_income > 0
        ? ((summary.total_income - summary.total_expense) / summary.total_income * 100).toFixed(1)
        : 0;

    res.json({
        success: true,
        data: {
            total_income: summary.total_income,
            total_expense: summary.total_expense,
            balance,
            savings_rate: parseFloat(savingsRate),
            month: parseInt(month),
            year: parseInt(year)
        }
    });
});

// GET /api/analytics/category-wise
router.get('/category-wise', authenticate, (req, res) => {
    const now = new Date();
    const { month = now.getMonth() + 1, year = now.getFullYear() } = req.query;

    const breakdown = TransactionModel.getCategoryBreakdown(req.user.id, parseInt(month), parseInt(year));

    const total = breakdown.reduce((sum, cat) => sum + cat.amount, 0);

    const data = breakdown.map(cat => ({
        ...cat,
        percentage: total > 0 ? parseFloat((cat.amount / total * 100).toFixed(1)) : 0
    }));

    res.json({
        success: true,
        data
    });
});

// GET /api/analytics/trends
router.get('/trends', authenticate, (req, res) => {
    const { months = 6, period = 'monthly' } = req.query;

    // Get last N months of data
    const trends = [];
    const now = new Date();

    for (let i = parseInt(months) - 1; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const month = date.getMonth() + 1;
        const year = date.getFullYear();

        const summary = TransactionModel.getMonthlySummary(req.user.id, month, year);

        trends.push({
            month,
            year,
            label: date.toLocaleString('default', { month: 'short', year: 'numeric' }),
            income: summary.total_income,
            expense: summary.total_expense,
            balance: summary.total_income - summary.total_expense
        });
    }

    res.json({
        success: true,
        data: trends
    });
});

module.exports = router;
