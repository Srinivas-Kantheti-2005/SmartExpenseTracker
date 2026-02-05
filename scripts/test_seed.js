const { initDatabase, execute, query, getDatabase } = require('../server/config/db');
const CategoryModel = require('../server/models/category.model');
const UserModel = require('../server/models/user.model');
const { generateUUID } = require('../server/utils/helpers');

async function testSeeding() {
    try {
        await initDatabase();
        console.log('Database initialized');

        // Create a temp user
        const userId = generateUUID();
        const email = `test_${Date.now()}@test.com`;
        console.log('Creating temp user:', userId, email);

        // Manually insert user to bypass full creation logic for speed, but we need the foreign key
        execute(`INSERT INTO users (id, name, email, password_hash, created_at, updated_at) VALUES (?, 'Test User', ?, 'hash', datetime('now'), datetime('now'))`, [userId, email]);

        // Test Seeding
        console.log('Seeding defaults...');
        CategoryModel.seedDefaults(userId);

        // Verify Parents
        const parents = query('SELECT * FROM categories WHERE user_id = ? AND parent_id IS NULL', [userId]);
        console.log(`Found ${parents.length} parent categories`);

        const expectedParents = {
            'Salary': '#2ECC71',
            'Business': '#27AE60',
            'Food & Dining': '#F4A261',
            'Stocks': '#2563EB'
        };

        for (const [name, color] of Object.entries(expectedParents)) {
            const cat = parents.find(p => p.name === name);
            if (cat) {
                if (cat.color === color) {
                    console.log(`✅ Parent '${name}' has correct color ${color}`);
                } else {
                    console.error(`❌ Parent '${name}' has WRONG color ${cat.color} (expected ${color})`);
                }
            } else {
                console.error(`❌ Parent '${name}' NOT FOUND`);
            }
        }

        // Verify Subcategories
        const salary = parents.find(p => p.name === 'Salary');
        if (salary) {
            const subs = query('SELECT * FROM categories WHERE parent_id = ?', [salary.id]);
            console.log(`'Salary' has ${subs.length} subcategories:`, subs.map(s => s.name).join(', '));
            if (subs.map(s => s.name).includes('Bonus')) {
                console.log('✅ Subcategory "Bonus" found under Salary');
            } else {
                console.error('❌ Subcategory "Bonus" NOT found under Salary');
            }
        }

        // Verify Custom Create Default Color
        console.log('Testing custom category creation...');
        const customCat = CategoryModel.create(userId, { name: 'My Custom Income', type: 'income' });
        if (customCat.color === '#2ECC71') {
            console.log('✅ Custom Income category got default green color');
        } else {
            console.error(`❌ Custom Income category got wrong color: ${customCat.color}`);
        }

        // Cleanup
        console.log('Cleaning up...');
        execute('DELETE FROM users WHERE id = ?', [userId]);
        console.log('Done.');

    } catch (error) {
        console.error('Test Failed:', error);
    }
}

testSeeding();
