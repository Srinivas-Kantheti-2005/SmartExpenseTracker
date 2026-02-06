const http = require('http');

function post(url, body, headers = {}) {
    return new Promise((resolve, reject) => {
        const bodyStr = JSON.stringify(body);
        const req = http.request(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(bodyStr),
                ...headers
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(data) }));
        });
        req.on('error', reject);
        req.write(bodyStr);
        req.end();
    });
}

async function run() {
    try {
        console.log('Logging in...');
        const login = await post('http://localhost:5001/api/auth/login', {
            email: 'tester@test.com',
            password: 'password'
        });

        if (login.status !== 200) {
            console.error('Login failed:', login.body);
            return;
        }

        const token = login.body.data.token;
        const userId = login.body.data.user.id;
        console.log('User ID:', userId);

        console.log('Creating transaction...');
        const tx = await post('http://localhost:5001/api/transactions', {
            type: 'expense',
            amount: 50.5,
            category_id: 'c9889787-a082-4374-ac8f-8cad1c4bcc4b',
            date: '2026-02-06',
            description: 'API Test'
        }, { 'Authorization': `Bearer ${token}` });

        console.log('TX Response Status:', tx.status);
        console.log('TX Response Body:', JSON.stringify(tx.body, null, 2));
    } catch (err) {
        console.error('Error:', err);
    }
}

run();
