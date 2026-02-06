const { initDatabase } = require('../server/config/db');
const TransactionModel = require('../server/models/transaction.model');

async function testModel() {
    try {
        await initDatabase();
        console.log('Database initialized');

        const userId = 'd395c886-1f1d-4cb5-8446-2f8a039abef7';
        const data = {
            type: 'expense',
            amount: 50.5,
            category_id: 'c9889787-a082-4374-ac8f-8cad1c4bcc4b',
            date: '2026-02-06',
            description: 'Model Direct Test'
        };

        console.log('Creating transaction...');
        const tx = TransactionModel.create(userId, data);
        console.log('Transaction created successfully:', tx);

        // Test Investment
        const invData = {
            type: 'investment',
            amount: 1000,
            category_id: 'c9889787-a082-4374-ac8f-8cad1c4bcc4b', // Using same category for test
            date: '2026-02-06',
            description: 'Investment Test'
        };
        console.log('Creating investment...');
        const inv = TransactionModel.create(userId, invData);
        console.log('Investment created successfully:', inv);

    } catch (err) {
        console.error('Error during model test:', err);
    }
}

testModel();
