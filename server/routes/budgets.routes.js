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
    const { month, year } = req.query;
    const budgets = BudgetModel.findAll(req.user.id, {
        month: month ? parseInt(month) : null,
        year: year ? parseInt(year) : null
    });

    res.json({
        success: true,
        data: budgets
    });
});

// POST /api/budgets
router.post('/', authenticate, asyncHandler(async (req, res) => {
    const { category_id, amount, month, year } = req.body;

    if (!category_id || !amount || !month || !year) {
        throw new AppError('Category, amount, month and year are required', 400, 'VALIDATION_ERROR');
    }

    // Calculate start/end dates for DB consistency
    const start_date = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const end_date = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

    const budget = BudgetModel.create(req.user.id, {
        ...req.body,
        start_date,
        end_date
    });

    res.status(201).json({
        success: true,
        data: budget
    });
}));

// PUT /api/budgets/:id
router.put('/:id', authenticate, (req, res) => {
    const { month, year } = req.body;
    let updates = { ...req.body };

    if (month && year) {
        const start_date = `${year}-${String(month).padStart(2, '0')}-01`;
        const lastDay = new Date(year, month, 0).getDate();
        const end_date = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;
        updates.start_date = start_date;
        updates.end_date = end_date;
    }

    const budget = BudgetModel.update(req.params.id, req.user.id, updates);

    if (!budget) {
        throw new AppError('Budget not found', 404, 'NOT_FOUND');
    }

    res.json({
        success: true,
        data: budget
    });
});

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
