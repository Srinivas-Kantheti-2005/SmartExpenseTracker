/* ========================================
   Categories Routes
   ======================================== */

const express = require('express');
const router = express.Router();
const CategoryModel = require('../models/category.model');
const { authenticate, optionalAuth } = require('../middleware/auth.middleware');
const { asyncHandler, AppError } = require('../middleware/error.middleware');

// GET /api/categories
router.get('/', optionalAuth, (req, res) => {
    const { type } = req.query;
    const userId = req.user?.id || null;

    let categories;
    if (type) {
        categories = CategoryModel.getByType(type, userId);
    } else {
        categories = CategoryModel.getAllWithSubcategories(userId);
    }

    res.json({
        success: true,
        data: categories
    });
});

// POST /api/categories
router.post('/', authenticate, asyncHandler(async (req, res) => {
    const { name, type } = req.body;

    if (!name || !type) {
        throw new AppError('Name and type are required', 400, 'VALIDATION_ERROR');
    }

    if (!['income', 'expense'].includes(type)) {
        throw new AppError('Type must be income or expense', 400, 'VALIDATION_ERROR');
    }

    const category = CategoryModel.create(req.user.id, req.body);

    res.status(201).json({
        success: true,
        data: category
    });
}));

// PUT /api/categories/:id
router.put('/:id', authenticate, (req, res) => {
    const category = CategoryModel.update(req.params.id, req.user.id, req.body);

    if (!category) {
        throw new AppError('Category not found or cannot be updated', 404, 'NOT_FOUND');
    }

    res.json({
        success: true,
        data: category
    });
});

// DELETE /api/categories/:id
router.delete('/:id', authenticate, (req, res) => {
    const deleted = CategoryModel.delete(req.params.id, req.user.id);

    if (!deleted) {
        throw new AppError('Category not found', 404, 'NOT_FOUND');
    }

    res.json({
        success: true,
        message: 'Category deleted'
    });
});

module.exports = router;
