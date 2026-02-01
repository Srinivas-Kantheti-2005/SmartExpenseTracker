/* ========================================
   Auth Routes
   ======================================== */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const UserModel = require('../models/user.model');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/env');
const { asyncHandler, AppError } = require('../middleware/error.middleware');
const { authenticate } = require('../middleware/auth.middleware');
const { validateEmail, validatePassword } = require('../utils/validators');

// POST /api/auth/register
router.post('/register', asyncHandler(async (req, res) => {
    const { name, email, password, phone } = req.body;

    // Validation
    if (!name || !email || !password) {
        throw new AppError('Name, email and password are required', 400, 'VALIDATION_ERROR');
    }

    if (!validateEmail(email)) {
        throw new AppError('Invalid email format', 400, 'VALIDATION_ERROR');
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
        throw new AppError(passwordError, 400, 'VALIDATION_ERROR');
    }

    // Check if email exists
    const existing = UserModel.findByEmail(email);
    if (existing) {
        throw new AppError('Email already registered', 409, 'CONFLICT');
    }

    // Create user
    const user = await UserModel.create({ name, email, password, phone });

    res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: UserModel.sanitize(user)
    });
}));

// POST /api/auth/login
router.post('/login', asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new AppError('Email and password are required', 400, 'VALIDATION_ERROR');
    }

    // Find user
    const user = UserModel.findByEmail(email);
    if (!user) {
        throw new AppError('Invalid credentials', 401, 'UNAUTHORIZED');
    }

    // Verify password
    const isValid = await UserModel.verifyPassword(password, user.password_hash);
    if (!isValid) {
        throw new AppError('Invalid credentials', 401, 'UNAUTHORIZED');
    }

    // Check if active
    if (!user.is_active) {
        throw new AppError('Account is deactivated', 401, 'UNAUTHORIZED');
    }

    // Update last login
    UserModel.updateLastLogin(user.id);

    // Generate token
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    res.json({
        success: true,
        token,
        user: UserModel.sanitize(user)
    });
}));

// POST /api/auth/logout
router.post('/logout', authenticate, (req, res) => {
    // In a real app, you'd invalidate the token here
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
});

// GET /api/auth/me
router.get('/me', authenticate, (req, res) => {
    const user = UserModel.findById(req.user.id);
    const settings = UserModel.getSettings(req.user.id);

    res.json({
        success: true,
        data: {
            ...UserModel.sanitize(user),
            settings
        }
    });
});

// PUT /api/auth/profile
router.put('/profile', authenticate, asyncHandler(async (req, res) => {
    const user = UserModel.update(req.user.id, req.body);
    res.json({
        success: true,
        data: UserModel.sanitize(user)
    });
}));

// PUT /api/auth/settings
router.put('/settings', authenticate, (req, res) => {
    const settings = UserModel.updateSettings(req.user.id, req.body);
    res.json({
        success: true,
        data: settings
    });
});

module.exports = router;
