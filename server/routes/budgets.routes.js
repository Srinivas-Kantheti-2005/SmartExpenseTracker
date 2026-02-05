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
    const budgets = BudgetModel.findAll(req.user.id);

    res.json({
        success: true,
        data: budgets
    });
});

// POST /api/budgets
router.post('/', authenticate, asyncHandler(async (req, res) => {
    const { category_id, amount, start_date, end_date } = req.body;

    if (!category_id || !amount || !start_date || !end_date) {
        throw new AppError('Category, amount, start date and end date are required', 400, 'VALIDATION_ERROR');
    }

    const budget = BudgetModel.create(req.user.id, req.body);

    res.status(201).json({
        success: true,
        data: budget
    });
}));

// PUT /api/budgets/:id
router.put('/:id', authenticate, (req, res) => {
    const budget = BudgetModel.update(req.params.id, req.user.id, req.body);

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
