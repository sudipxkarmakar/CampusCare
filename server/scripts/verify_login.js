
const verifyLogin = async () => {
    try {
        console.log('Attempting login...');
        const response = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                identifier: 'CSE-2025-045',
                password: 'password123'
            })
        });

        const data = await response.json();
        console.log('Status Code:', response.status);
        console.log('Response Body:', JSON.stringify(data, null, 2));

        if (response.ok) {
            console.log('Login verification SUCCESSFUL!');
        } else {
            console.log('Login verification FAILED.');
        }

    } catch (error) {
        console.error('Error during verification:', error);
    }
};

verifyLogin();
