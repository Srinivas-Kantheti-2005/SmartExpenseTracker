/* ========================================
   Category Model
   ======================================== */

const { query, queryOne, execute } = require('../config/db');
const { generateUUID } = require('../utils/helpers');

const CategoryModel = {
    /**
     * Get all categories with subcategories (prioritizes user-specific)
     */
    getAllWithSubcategories(userId = null) {
        // Get parent categories - user-specific OR defaults (excluding defaults if user has custom version)
        const categories = query(`
            SELECT c.* FROM categories c
            WHERE c.parent_id IS NULL AND c.is_active = 1
            AND (
                c.user_id = ? 
                OR (c.is_default = 1 AND c.user_id IS NULL AND NOT EXISTS (
                    SELECT 1 FROM categories uc 
                    WHERE uc.user_id = ? 
                    AND uc.name = c.name 
                    AND uc.type = c.type 
                    AND uc.parent_id IS NULL
                    AND uc.is_active = 1
                ))
            )
            ORDER BY c.order_index
        `, [userId, userId]);

        return categories.map(cat => ({
            ...cat,
            subcategories: query(`
                SELECT * FROM categories 
                WHERE parent_id = ? AND is_active = 1
                ORDER BY order_index
            `, [cat.id])
        }));
    },

    /**
     * Get categories by type (prioritizes user-specific)
     */
    getByType(type, userId = null) {
        return query(`
            SELECT c.* FROM categories c
            WHERE c.type = ? AND c.parent_id IS NULL AND c.is_active = 1
            AND (
                c.user_id = ? 
                OR (c.is_default = 1 AND c.user_id IS NULL AND NOT EXISTS (
                    SELECT 1 FROM categories uc 
                    WHERE uc.user_id = ? 
                    AND uc.name = c.name 
                    AND uc.type = c.type 
                    AND uc.parent_id IS NULL
                    AND uc.is_active = 1
                ))
            )
            ORDER BY c.order_index
        `, [type, userId, userId]);
    },

    /**
     * Find category by ID
     */
    findById(id) {
        return queryOne('SELECT * FROM categories WHERE id = ?', [id]);
    },

    /**
     * Create user copy of a default category (copy-on-write)
     */
    createUserCopy(categoryId, userId) {
        const original = this.findById(categoryId);
        if (!original) return null;

        const newId = generateUUID();

        // Copy parent category
        execute(`
            INSERT INTO categories (id, user_id, name, type, icon, color, is_default, parent_id, order_index, created_at)
            VALUES (?, ?, ?, ?, ?, ?, 0, NULL, ?, datetime('now'))
        `, [newId, userId, original.name, original.type, original.icon, original.color, original.order_index]);

        // Copy subcategories
        const subcategories = query('SELECT * FROM categories WHERE parent_id = ? AND is_active = 1', [categoryId]);
        subcategories.forEach(sub => {
            const subId = generateUUID();
            execute(`
                INSERT INTO categories (id, user_id, name, type, icon, color, is_default, parent_id, order_index, created_at)
                VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, datetime('now'))
            `, [subId, userId, sub.name, sub.type, sub.icon, sub.color, newId, sub.order_index]);
        });

        return this.findById(newId);
    },

    /**
     * Create custom category
     */
    create(userId, data) {
        const id = generateUUID();

        execute(`
            INSERT INTO categories (id, user_id, name, type, icon, color, is_default, parent_id, order_index, created_at)
            VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, datetime('now'))
        `, [id, userId, data.name, data.type, data.icon || '📦', data.color || '#9CA3AF', data.parent_id || null, data.order_index || 999]);

        return this.findById(id);
    },

    /**
     * Update category (with copy-on-write for defaults)
     */
    update(id, userId, updates) {
        const category = this.findById(id);
        if (!category) return null;

        // If it's a default category, create a user copy first
        if (category.is_default && category.user_id === null) {
            const userCopy = this.createUserCopy(id, userId);
            if (!userCopy) return null;
            id = userCopy.id; // Update the new copy instead
        }

        // Verify user owns this category
        const ownedCategory = queryOne('SELECT * FROM categories WHERE id = ? AND user_id = ?', [id, userId]);
        if (!ownedCategory) return null;

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

        values.push(id);
        execute(`UPDATE categories SET ${fields.join(', ')} WHERE id = ?`, values);
        return this.findById(id);
    },

    /**
     * Soft delete category (only user-owned)
     */
    delete(id, userId) {
        const result = execute('UPDATE categories SET is_active = 0 WHERE id = ? AND user_id = ?', [id, userId]);
        return result.changes > 0;
    }
};

module.exports = CategoryModel;
