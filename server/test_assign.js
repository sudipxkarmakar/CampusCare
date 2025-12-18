import fs from 'fs';

// Node 18+ has fetch. If not, this might fail, but let's try.
// If it fails, I'll use http module.

const token = fs.readFileSync('token.txt', 'utf-8').trim();
const subjectId = '69419584206934ae1a628255';
const teacherId = '69419583206934ae1a62823b';

console.log('Testing assignment for Subject:', subjectId);
console.log('Token:', token.substring(0, 10) + '...');

async function test() {
    try {
        const res = await fetch(`http://localhost:5000/api/hod/subjects/${subjectId}/assign`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ teacherId, batch: 'Batch 1' })
        });

        console.log('Status:', res.status);
        const data = await res.json();
        console.log('Response:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Fetch Error:', error);
    }
}

test();
