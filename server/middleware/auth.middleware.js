/* ========================================
   Authentication Middleware
   ======================================== */

const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');
const { queryOne } = require('../config/db');

/**
 * Verify JWT token and attach user to request
 */
function authenticate(req, res, next) {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'No token provided'
                }
            });
        }

        const token = authHeader.split(' ')[1];

        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET);

        // Check if user still exists
        const user = queryOne('SELECT id, email, name, is_active FROM users WHERE id = ?', [decoded.userId]);

        if (!user) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'User not found'
                }
            });
        }

        if (!user.is_active) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Account is deactivated'
                }
            });
        }

        // Attach user to request
        req.user = {
            id: user.id,
            email: user.email,
            name: user.name
        };

        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'TOKEN_EXPIRED',
                    message: 'Token has expired'
                }
            });
        }

        return res.status(401).json({
            success: false,
            error: {
                code: 'UNAUTHORIZED',
                message: 'Invalid token'
            }
        });
    }
}

/**
 * Optional authentication - doesn't fail if no token
 */
function optionalAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, JWT_SECRET);

            const user = queryOne('SELECT id, email, name FROM users WHERE id = ? AND is_active = 1', [decoded.userId]);

            if (user) {
                req.user = user;
            }
        }
    } catch (error) {
        // Ignore errors for optional auth
    }

    next();
}

module.exports = {
    authenticate,
    optionalAuth
};
