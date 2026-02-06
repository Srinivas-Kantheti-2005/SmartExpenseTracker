/* ========================================
   Database Configuration
   ======================================== */

const Database = require('better-sqlite3');
const path = require('path');

// Database file path
const DB_PATH = path.join(__dirname, '../../database/expense_tracker.db');

let db = null;

/**
 * Initialize database connection
 */
function initDatabase() {
    return new Promise((resolve, reject) => {
        try {
            db = new Database(DB_PATH, {
                verbose: process.env.NODE_ENV === 'development' ? console.log : null
            });

            // Enable foreign keys
            db.pragma('foreign_keys = ON');

            console.log(`📦 Connected to SQLite: ${DB_PATH}`);
            resolve(db);
        } catch (error) {
            console.error('❌ Database connection failed:', error);
            reject(error);
        }
    });
}

/**
 * Get database instance
 */
function getDatabase() {
    if (!db) {
        throw new Error('Database not initialized. Call initDatabase() first.');
    }
    return db;
}

/**
 * Close database connection
 */
function closeDatabase() {
    if (db) {
        db.close();
        db = null;
        console.log('📦 Database connection closed');
    }
}

/**
 * Run a query and return all results
 */
function query(sql, params = []) {
    try {
        const stmt = getDatabase().prepare(sql);
        return stmt.all(...params);
    } catch (e) {
        console.error('❌ SQL Prepare Failed:', sql);
        throw e;
    }
}

/**
 * Run a query and return first result
 */
function queryOne(sql, params = []) {
    try {
        const stmt = getDatabase().prepare(sql);
        return stmt.get(...params);
    } catch (e) {
        console.error('❌ SQL Prepare Failed:', sql);
        throw e;
    }
}

/**
 * Execute a statement (INSERT, UPDATE, DELETE)
 */
function execute(sql, params = []) {
    try {
        const stmt = getDatabase().prepare(sql);
        return stmt.run(...params);
    } catch (e) {
        console.error('❌ SQL Prepare Failed:', sql);
        throw e;
    }
}

/**
 * Run multiple statements in a transaction
 */
function transaction(callback) {
    const db = getDatabase();
    return db.transaction(callback)();
}

module.exports = {
    initDatabase,
    getDatabase,
    closeDatabase,
    query,
    queryOne,
    execute,
    transaction
};
