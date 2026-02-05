/* ========================================
   Items Routes (Subcategories)
   ======================================== */

const express = require('express');
const router = express.Router();
const { query } = require('../config/db');
const { optionalAuth } = require('../middleware/auth.middleware');

// GET /api/items
router.get('/', optionalAuth, (req, res) => {
    const userId = req.user?.id || null;

    const items = query(`
        SELECT * FROM categories 
        WHERE parent_id IS NOT NULL AND is_active = 1
        AND (is_default = 1 OR user_id = ?)
        ORDER BY name
    `, [userId]);

    res.json(items);
});

module.exports = router;
