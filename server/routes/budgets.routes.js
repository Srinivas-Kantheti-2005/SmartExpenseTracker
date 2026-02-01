/* ========================================
   Budgets Routes
   ======================================== */

const express = require('express');
const router = express.Router();
const BudgetModel = require('../models/budget.model');
const { authenticate } = require('../middleware/auth.middleware');
const { asyncHandler, AppError } = require('../middleware/error.middleware');

// GET /api/budgets
router.get('/', authenticate, (req, res) => {
    const now = new Date();
    const { month = now.getMonth() + 1, year = now.getFullYear() } = req.query;

    const budgets = BudgetModel.getWithSpent(req.user.id, parseInt(month), parseInt(year));

    res.json({
        success: true,
        data: budgets
    });
});

// GET /api/budgets/alerts
router.get('/alerts', authenticate, (req, res) => {
    const now = new Date();
    const { month = now.getMonth() + 1, year = now.getFullYear() } = req.query;

    const alerts = BudgetModel.getAlerts(req.user.id, parseInt(month), parseInt(year));

    res.json({
        success: true,
        data: alerts
    });
});

// POST /api/budgets
router.post('/', authenticate, asyncHandler(async (req, res) => {
    const { category_id, amount, month, year } = req.body;

    if (!category_id || !amount || !month || !year) {
        throw new AppError('Category, amount, month and year are required', 400, 'VALIDATION_ERROR');
    }

    if (amount <= 0) {
        throw new AppError('Amount must be greater than 0', 400, 'VALIDATION_ERROR');
    }

    const budget = BudgetModel.upsert(req.user.id, req.body);

    res.status(201).json({
        success: true,
        data: budget
    });
}));

// DELETE /api/budgets/:id
router.delete('/:id', authenticate, (req, res) => {
    const deleted = BudgetModel.delete(req.params.id, req.user.id);

    if (!deleted) {
        throw new AppError('Budget not found', 404, 'NOT_FOUND');
    }

    res.json({
        success: true,
        message: 'Budget deleted'
    });
});

module.exports = router;
