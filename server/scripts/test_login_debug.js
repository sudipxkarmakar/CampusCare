import fetch from 'node-fetch';

const login = async (identifier, password, role, department) => {
    const url = 'http://localhost:5001/api/auth/login';
    const body = { identifier, password, role };
    if (department) body.department = department;

    console.log(`Attempting login: Role=${role}, ID=${identifier}, Dept=${department || 'N/A'}`);

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const data = await res.json();
        console.log(`Status: ${res.status}`);
        console.log('Response:', data);
    } catch (e) {
        console.error('Error:', e.message);
    }
};

// Test Case 1: Correct Credentials (shubh, ECE) - NO Department sent (Should Success)
login('10800222013', '123456', 'student');

// Test Case 2: Correct Credentials but WRONG Department sent (CSE) (Should Fail)
// This simulates the stale input bug
setTimeout(() => {
    login('10800222013', '123456', 'student', 'CSE');
}, 1000);
