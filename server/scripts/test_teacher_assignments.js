
const BASE_URL = 'http://localhost:5000/api';

async function testTeacherAssignments() {
    try {
        console.log('1. Logging in as Teacher...');
        const uniqueId = Date.now().toString().slice(-11); // Last 11 digits of timestamp
        const employeeId = `T${uniqueId}`; // Starts with T, + 11 digits
        const teacherEmail = `teachertest${uniqueId}@example.com`;
        const password = 'password123';

        console.log(`   Trying Valid details: ID=${employeeId}, Email=${teacherEmail}`);

        // Register
        const regRes = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Test Teacher',
                email: teacherEmail,
                password: password,
                role: 'teacher',
                department: 'CSE',
                employeeId: employeeId
            })
        });

        let token;
        if (regRes.ok) {
            const data = await regRes.json();
            token = data.token;
            console.log('   Registered new teacher successfully.');
        } else {
            const err = await regRes.json();
            console.log('   Registration failed:', err);
            console.log('   Trying login...');

            const loginRes = await fetch(`${BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    identifier: employeeId,
                    password: password,
                    role: 'teacher'
                })
            });
            const data = await loginRes.json();

            if (!loginRes.ok) {
                console.error('   LOGIN FAILED:', data);
                throw new Error('Login failed');
            }
            token = data.token;
        }

        if (!token) {
            throw new Error('Failed to get token');
        }
        console.log('   Token received.');

        console.log('2. Fetching Created Assignments...');
        const res = await fetch(`${BASE_URL}/assignments/created`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log('   Status:', res.status);
        if (res.status !== 200) {
            const text = await res.text();
            console.log('   Error Response:', text);
            throw new Error('API failed with status ' + res.status);
        }

        const assignments = await res.json();
        console.log('   Success! Assignments found:', assignments.length);

        // Also test the submissions endpoint if we have an assignment (or mock one)
        // Ignoring for now, just checking if route exists.

    } catch (error) {
        console.error('FAILURE:', error);
    }
}

testTeacherAssignments();
