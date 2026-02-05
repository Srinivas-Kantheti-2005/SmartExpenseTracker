/* ========================================
   Category Model
   ======================================== */

const { query, queryOne, execute } = require('../config/db');
const { generateUUID } = require('../utils/helpers');

const CategoryModel = {
    /**
     * Get all categories with subcategories
     */
    getAllWithSubcategories(userId = null) {
        const categories = query(`
            SELECT * FROM categories 
            WHERE parent_id IS NULL AND is_active = 1
            AND (is_default = 1 OR user_id = ?)
            ORDER BY name
        `, [userId]);

        return categories.map(cat => ({
            ...cat,
            subcategories: query(`
                SELECT * FROM categories 
                WHERE parent_id = ? AND is_active = 1
                ORDER BY name
            `, [cat.id])
        }));
    },

    /**
     * Get categories by type
     */
    getByType(type, userId = null) {
        return query(`
            SELECT * FROM categories 
            WHERE type = ? AND parent_id IS NULL AND is_active = 1
            AND (is_default = 1 OR user_id = ?)
            ORDER BY name
        `, [type, userId]);
    },

    /**
     * Find category by ID
     */
    findById(id) {
        return queryOne('SELECT * FROM categories WHERE id = ?', [id]);
    },

    /**
     * Create custom category
     */
    create(userId, data) {
        const id = generateUUID();

        execute(`
            INSERT INTO categories (id, user_id, name, type, icon, color, parent_id, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `, [id, userId, data.name, data.type, data.icon || '📦', data.color || '#9CA3AF', data.parent_id || null]);

        return this.findById(id);
    },

    /**
     * Update category
     */
    update(id, userId, updates) {
        const allowedFields = ['name', 'icon', 'color'];
        const fields = [];
        const values = [];

        for (const [key, value] of Object.entries(updates)) {
            if (allowedFields.includes(key)) {
                fields.push(`${key} = ?`);
                values.push(value);
            }
        }

        if (fields.length === 0) return null;

        values.push(id, userId);
        execute(`UPDATE categories SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`, values);
        return this.findById(id);
    },

    /**
     * Soft delete category
     */
    delete(id, userId) {
        const result = execute('UPDATE categories SET is_active = 0 WHERE id = ? AND user_id = ?', [id, userId]);
        return result.changes > 0;
    }
};

module.exports = CategoryModel;
