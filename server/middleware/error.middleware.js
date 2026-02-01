/* ========================================
   Error Handling Middleware
   ======================================== */

/**
 * Global error handler
 */
function errorHandler(err, req, res, next) {
    console.error('❌ Error:', err);

    // Default error
    let statusCode = err.statusCode || 500;
    let errorCode = err.code || 'SERVER_ERROR';
    let message = err.message || 'An unexpected error occurred';
    let details = err.details || null;

    // Handle specific error types
    if (err.name === 'ValidationError') {
        statusCode = 400;
        errorCode = 'VALIDATION_ERROR';
    }

    if (err.name === 'SyntaxError' && err.type === 'entity.parse.failed') {
        statusCode = 400;
        errorCode = 'INVALID_JSON';
        message = 'Invalid JSON in request body';
    }

    // Don't expose internal errors in production
    if (process.env.NODE_ENV === 'production' && statusCode === 500) {
        message = 'An unexpected error occurred';
        details = null;
    }

    res.status(statusCode).json({
        success: false,
        error: {
            code: errorCode,
            message,
            ...(details && { details })
        }
    });
}

/**
 * 404 Not Found handler
 */
function notFoundHandler(req, res) {
    res.status(404).json({
        success: false,
        error: {
            code: 'NOT_FOUND',
            message: `Route ${req.method} ${req.path} not found`
        }
    });
}

/**
 * Async handler wrapper to catch errors
 */
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

/**
 * Create custom error
 */
class AppError extends Error {
    constructor(message, statusCode = 500, code = 'SERVER_ERROR', details = null) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
    }
}

module.exports = {
    errorHandler,
    notFoundHandler,
    asyncHandler,
    AppError
};
