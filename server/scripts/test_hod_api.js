import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000/api';

async function testHodApi() {
    // 1. Login
    try {
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                identifier: 'hod.it@campuscare.com',
                password: 'password123'
            })
        });

        if (loginRes.status === 401) {
            console.log('Login failed with password123, trying 123456');
            const retryRes = await fetch(`${BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    identifier: 'hod.it@campuscare.com',
                    password: '123456'
                })
            });
            return handleLogin(retryRes);
        }

        return handleLogin(loginRes);

    } catch (err) {
        console.error('Network/Script Error:', err);
    }
}

async function handleLogin(res) {
    if (!res.ok) {
        console.error('Login Failed:', res.status, res.statusText);
        const txt = await res.text();
        console.log('Response:', txt);
        return;
    }

    const data = await res.json();
    console.log('Login Success. Token acquired.');
    const token = data.token;

    // 2. Fetch Students
    console.log('\n--- Testing /hod/students ---');
    const studentRes = await fetch(`${BASE_URL}/hod/students`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log('Status:', studentRes.status);
    if (!studentRes.ok) {
        const errTxt = await studentRes.text();
        console.log('Error Body:', errTxt);
    } else {
        const students = await studentRes.json();
        console.log(`Success! Got ${students.length} students.`);
    }

    // 3. Fetch Teachers
    console.log('\n--- Testing /hod/teachers ---');
    const teacherRes = await fetch(`${BASE_URL}/hod/teachers`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log('Status:', teacherRes.status);
    if (!teacherRes.ok) {
        const errTxt = await teacherRes.text();
        console.log('Error Body:', errTxt);
    } else {
        const teachers = await teacherRes.json();
        console.log(`Success! Got ${teachers.length} teachers.`);
    }
}

testHodApi();
