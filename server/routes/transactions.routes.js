/* ========================================
   Transactions Routes
   ======================================== */

const express = require('express');
const router = express.Router();
const TransactionModel = require('../models/transaction.model');
const { authenticate } = require('../middleware/auth.middleware');
const { asyncHandler, AppError } = require('../middleware/error.middleware');
const { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } = require('../config/env');

// GET /api/transactions
router.get('/', authenticate, (req, res) => {
    const { type, category, startDate, endDate, page = 1, limit = DEFAULT_PAGE_SIZE } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    const filters = {
        type,
        category_id: category,
        startDate,
        endDate,
        limit: limitNum,
        offset
    };

    const transactions = TransactionModel.findAll(req.user.id, filters);
    const total = TransactionModel.count(req.user.id, filters);

    res.json({
        success: true,
        data: transactions,
        pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            pages: Math.ceil(total / limitNum)
        }
    });
});

// GET /api/transactions/:id
router.get('/:id', authenticate, (req, res) => {
    const transaction = TransactionModel.findById(req.params.id, req.user.id);

    if (!transaction) {
        throw new AppError('Transaction not found', 404, 'NOT_FOUND');
    }

    res.json({
        success: true,
        data: transaction
    });
});

// POST /api/transactions
router.post('/', authenticate, asyncHandler(async (req, res) => {
    const { type, amount, category_id, date } = req.body;

    if (!type || !amount || !category_id || !date) {
        throw new AppError('Type, amount, category and date are required', 400, 'VALIDATION_ERROR');
    }

    if (!['income', 'expense', 'investment'].includes(type)) {
        throw new AppError('Type must be income, expense, or investment', 400, 'VALIDATION_ERROR');
    }

    if (amount <= 0) {
        throw new AppError('Amount must be greater than 0', 400, 'VALIDATION_ERROR');
    }

    const transaction = TransactionModel.create(req.user.id, req.body);

    res.status(201).json({
        success: true,
        data: transaction
    });
}));

// PUT /api/transactions/:id
router.put('/:id', authenticate, asyncHandler(async (req, res) => {
    const existing = TransactionModel.findById(req.params.id, req.user.id);

    if (!existing) {
        throw new AppError('Transaction not found', 404, 'NOT_FOUND');
    }

    const transaction = TransactionModel.update(req.params.id, req.user.id, req.body);

    res.json({
        success: true,
        data: transaction
    });
}));

// DELETE /api/transactions/:id
router.delete('/:id', authenticate, (req, res) => {
    const deleted = TransactionModel.delete(req.params.id, req.user.id);

    if (!deleted) {
        throw new AppError('Transaction not found', 404, 'NOT_FOUND');
    }

    res.json({
        success: true,
        message: 'Transaction deleted'
    });
});

module.exports = router;
