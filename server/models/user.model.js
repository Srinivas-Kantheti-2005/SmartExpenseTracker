/* ========================================
   User Model
   ======================================== */

const bcrypt = require('bcrypt');
const { query, queryOne, execute } = require('../config/db');
const { generateUUID } = require('../utils/helpers');
const { BCRYPT_ROUNDS } = require('../config/env');

const UserModel = {
    /**
     * Find user by email
     */
    findByEmail(email) {
        return queryOne('SELECT * FROM users WHERE email = ?', [email]);
    },

    /**
     * Find user by ID
     */
    findById(id) {
        return queryOne('SELECT * FROM users WHERE id = ?', [id]);
    },

    /**
     * Create new user
     */
    async create(data) {
        const { name, email, password } = data;
        const id = generateUUID();
        const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

        execute(`
            INSERT INTO users (id, name, email, password_hash, created_at)
            VALUES (?, ?, ?, ?, datetime('now'))
        `, [id, name, email, hashedPassword]);

        return this.findById(id);
    },

    /**
     * Verify password
     */
    async verifyPassword(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    },

    /**
     * Update user profile
     */
    update(id, updates) {
        const allowedFields = ['name', 'avatar'];
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
        execute(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
        return this.findById(id);
    }
};

module.exports = UserModel;
