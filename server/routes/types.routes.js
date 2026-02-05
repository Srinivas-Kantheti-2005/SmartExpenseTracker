/* ========================================
   Types Routes
   ======================================== */

const express = require('express');
const router = express.Router();
const { optionalAuth } = require('../middleware/auth.middleware');

// GET /api/types
router.get('/', optionalAuth, (req, res) => {
    const types = [
        { id: 'type-1', name: 'Income' },
        { id: 'type-2', name: 'Expense' },
        { id: 'type-3', name: 'Investment' }
    ];

    res.json(types);
});

module.exports = router;
