// Node 22 has native fetch
async function testFetch() {
    try {
        console.log('Fetching assignments...');
        const response = await fetch('http://localhost:5000/api/assignments?dept=CSE&batch=2025');

        console.log('Status:', response.status);
        const text = await response.text();
        console.log('Response:', text.substring(0, 200));

    } catch (error) {
        console.error('Fetch Error:', error);
    }
}

testFetch();
