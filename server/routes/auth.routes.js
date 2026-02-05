/* ========================================
   Authentication Routes
   ======================================== */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const UserModel = require('../models/user.model');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/env');
const { asyncHandler, AppError } = require('../middleware/error.middleware');
const { isValidEmail, isValidPassword } = require('../utils/validators');

// POST /api/auth/register
router.post('/register', asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
        throw new AppError('All fields are required', 400, 'VALIDATION_ERROR');
    }

    if (!isValidEmail(email)) {
        throw new AppError('Invalid email format', 400, 'VALIDATION_ERROR');
    }

    if (!isValidPassword(password)) {
        throw new AppError('Password must be at least 6 characters', 400, 'VALIDATION_ERROR');
    }

    // Check if user exists
    const existingUser = UserModel.findByEmail(email);
    if (existingUser) {
        throw new AppError('Email already registered', 409, 'USER_EXISTS');
    }

    // Create user
    const user = await UserModel.create({ name, email, password });

    // Generate token
    const token = jwt.sign(
        { id: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
        success: true,
        data: {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                avatar: user.avatar_url
            },
            token
        }
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
        throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    // Verify password
    const isValid = await UserModel.verifyPassword(password, user.password_hash);
    if (!isValid) {
        throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    // Generate token
    const token = jwt.sign(
        { id: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
        success: true,
        data: {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                avatar: user.avatar_url
            },
            token
        }
    });
}));

module.exports = router;
