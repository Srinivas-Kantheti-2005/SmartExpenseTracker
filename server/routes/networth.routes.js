/* ========================================
   Net Worth Routes
   ======================================== */

const express = require('express');
const router = express.Router();
const InvestmentModel = require('../models/investment.model');
const { authenticate } = require('../middleware/auth.middleware');
const { asyncHandler, AppError } = require('../middleware/error.middleware');

// GET /api/networth
router.get('/', authenticate, (req, res) => {
    const networth = InvestmentModel.getNetWorth(req.user.id);

    res.json({
        success: true,
        data: networth
    });
});

// GET /api/networth/investments
router.get('/investments', authenticate, (req, res) => {
    const investments = InvestmentModel.findAll(req.user.id);

    res.json({
        success: true,
        data: investments
    });
});

// POST /api/networth/investments
router.post('/investments', authenticate, asyncHandler(async (req, res) => {
    const { name, type, initial_value } = req.body;

    if (!name || !type || !initial_value) {
        throw new AppError('Name, type and initial value are required', 400, 'VALIDATION_ERROR');
    }

    if (!['asset', 'liability'].includes(type)) {
        throw new AppError('Type must be asset or liability', 400, 'VALIDATION_ERROR');
    }

    const investment = InvestmentModel.create(req.user.id, req.body);

    res.status(201).json({
        success: true,
        data: investment
    });
}));

// PUT /api/networth/investments/:id
router.put('/investments/:id', authenticate, (req, res) => {
    const { current_value } = req.body;

    if (!current_value) {
        throw new AppError('Current value is required', 400, 'VALIDATION_ERROR');
    }

    const investment = InvestmentModel.updateValue(req.params.id, req.user.id, current_value);

    if (!investment) {
        throw new AppError('Investment not found', 404, 'NOT_FOUND');
    }

    res.json({
        success: true,
        data: investment
    });
});

// DELETE /api/networth/investments/:id
router.delete('/investments/:id', authenticate, (req, res) => {
    const deleted = InvestmentModel.delete(req.params.id, req.user.id);

    if (!deleted) {
        throw new AppError('Investment not found', 404, 'NOT_FOUND');
    }

    res.json({
        success: true,
        message: 'Investment deleted'
    });
});

module.exports = router;
