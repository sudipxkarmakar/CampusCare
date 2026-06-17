import fetch from 'node-fetch';

const run = async () => {
    try {
        const res = await fetch('http://127.0.0.1:5000/api/achievements');
        console.log('Status:', res.status);
        const data = await res.json();
        console.log('Achievements count:', data.length);
        console.log('Achievements:', JSON.stringify(data, null, 2));
    } catch (e) {
        console.error(e);
    }
};

run();
