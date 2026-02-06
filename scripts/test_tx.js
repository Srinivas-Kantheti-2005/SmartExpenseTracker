const fetch = require('node-fetch');

async function testCreateTransaction() {
    const API_BASE = 'http://localhost:5001/api';

    // 1. Login to get token
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'tester@test.com', password: 'password' }) // Use valid credentials
    });

    const loginData = await loginRes.json();
    if (!loginData.success) {
        console.error('Login failed:', loginData.error);
        return;
    }

    const token = loginData.data.token;
    const userId = loginData.data.user.id;

    // 2. Add transaction
    const payload = {
        userId: userId,
        type: 'expense',
        date: '2026-02-06',
        amount: 100,
        category_id: 'c9889787-a082-4374-ac8f-8cad1c4bcc4b', // Salary category from earlier check
        description: 'Test transaction'
    };

    const res = await fetch(`${API_BASE}/transactions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
    });

    const data = await res.json();
    console.log('Response Status:', res.status);
    console.log('Response Body:', JSON.stringify(data, null, 2));
}

testCreateTransaction();
