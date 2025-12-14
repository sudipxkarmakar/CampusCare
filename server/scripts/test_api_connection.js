const testConnection = async () => {
    try {
        console.log('📡 Testing Connection to http://localhost:5000/api/notices?role=public ...');

        const response = await fetch('http://localhost:5000/api/notices?role=public');

        console.log(`Response Status: ${response.status} ${response.statusText}`);

        if (response.ok) {
            const data = await response.json();
            console.log('✅ Success! Data received:', data);
        } else {
            console.log('❌ Server returned an error.');
            const text = await response.text();
            console.log('Error Body:', text);
        }

    } catch (error) {
        console.error('❌ Network Error (Server might be down or blocked):', error.message);
        if (error.cause) console.error('Cause:', error.cause);
    }
};

testConnection();
