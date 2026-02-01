/* ========================================
   User Model
   ======================================== */

const { query, queryOne, execute } = require('../config/db');
const bcrypt = require('bcrypt');
const { BCRYPT_ROUNDS } = require('../config/env');
const { generateUUID } = require('../utils/helpers');

const UserModel = {
    /**
     * Find user by ID
     */
    findById(id) {
        return queryOne('SELECT * FROM users WHERE id = ?', [id]);
    },

    /**
     * Find user by email
     */
    findByEmail(email) {
        return queryOne('SELECT * FROM users WHERE email = ? COLLATE NOCASE', [email.toLowerCase()]);
    },

    /**
     * Create new user
     */
    async create(userData) {
        const id = generateUUID();
        const passwordHash = await bcrypt.hash(userData.password, BCRYPT_ROUNDS);

        execute(`
            INSERT INTO users (id, email, password_hash, name, phone, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `, [id, userData.email.toLowerCase(), passwordHash, userData.name, userData.phone || null]);

        // Create default settings
        execute(`
            INSERT INTO user_settings (id, user_id)
            VALUES (?, ?)
        `, [generateUUID(), id]);

        return this.findById(id);
    },

    /**
     * Verify password
     */
    async verifyPassword(plainPassword, hashedPassword) {
        return bcrypt.compare(plainPassword, hashedPassword);
    },

    /**
     * Update user
     */
    update(id, updates) {
        const allowedFields = ['name', 'phone', 'avatar_url'];
        const fields = [];
        const values = [];

        for (const [key, value] of Object.entries(updates)) {
            if (allowedFields.includes(key)) {
                fields.push(`${key} = ?`);
                values.push(value);
            }
        }

        if (fields.length === 0) return null;

        fields.push("updated_at = datetime('now')");
        values.push(id);

        execute(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
        return this.findById(id);
    },

    /**
     * Update last login timestamp
     */
    updateLastLogin(id) {
        execute("UPDATE users SET last_login = datetime('now') WHERE id = ?", [id]);
    },

    /**
     * Get user settings
     */
    getSettings(userId) {
        return queryOne('SELECT * FROM user_settings WHERE user_id = ?', [userId]);
    },

    /**
     * Update user settings
     */
    updateSettings(userId, settings) {
        const allowedFields = ['currency', 'currency_symbol', 'theme', 'date_format',
            'notifications_email', 'notifications_budget', 'notifications_bills'];
        const fields = [];
        const values = [];

        for (const [key, value] of Object.entries(settings)) {
            if (allowedFields.includes(key)) {
                fields.push(`${key} = ?`);
                values.push(value);
            }
        }

        if (fields.length === 0) return null;

        fields.push("updated_at = datetime('now')");
        values.push(userId);

        execute(`UPDATE user_settings SET ${fields.join(', ')} WHERE user_id = ?`, values);
        return this.getSettings(userId);
    },

    /**
     * Sanitize user object (remove sensitive data)
     */
    sanitize(user) {
        if (!user) return null;
        const { password_hash, ...safeUser } = user;
        return safeUser;
    }
};

module.exports = UserModel;
