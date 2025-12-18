const API_URL = 'http://localhost:5000/api/warden/mess';

let wholeWeekMenu = [];

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadMenu();
});

function checkAuth() {
    const userStr = localStorage.getItem('user');
    if (!userStr) window.location.href = '../login.html';
    const user = JSON.parse(userStr);
    if (user.role !== 'warden' && user.role !== 'admin') {
        window.location.href = '../index.html';
    }
}

async function loadMenu() {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        const response = await fetch(API_URL, {
            headers: { 'Authorization': `Bearer ${user.token}` }
        });

        if (!response.ok) throw new Error('Failed to load menu');

        wholeWeekMenu = await response.json();

        // Load Monday by default
        populateForm('Monday');

    } catch (error) {
        console.error(error);
        alert('Error loading menu data.');
    }
}

function switchDay(day) {
    // Update tabs
    document.querySelectorAll('.day-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.id === `tab-${day}`) tab.classList.add('active');
    });

    // Update Form
    document.getElementById('currentDayTitle').innerText = `${day} Menu`;
    document.getElementById('currentDayInput').value = day;
    populateForm(day);
}

function populateForm(day) {
    const dayData = wholeWeekMenu.find(m => m.day === day) || {};

    document.getElementById('breakfastInput').value = dayData.breakfast || '';
    document.getElementById('lunchInput').value = dayData.lunch || '';
    document.getElementById('snacksInput').value = dayData.snacks || '';
    document.getElementById('dinnerInput').value = dayData.dinner || '';
}

async function saveMenu(e) {
    e.preventDefault();

    const day = document.getElementById('currentDayInput').value;
    const breakfast = document.getElementById('breakfastInput').value;
    const lunch = document.getElementById('lunchInput').value;
    const snacks = document.getElementById('snacksInput').value;
    const dinner = document.getElementById('dinnerInput').value;

    const payload = { day, breakfast, lunch, snacks, dinner };
    const user = JSON.parse(localStorage.getItem('user'));

    try {
        const response = await fetch(API_URL, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error('Failed to save menu');

        const updatedDay = await response.json();

        // Update local cache
        const index = wholeWeekMenu.findIndex(m => m.day === day);
        if (index !== -1) {
            wholeWeekMenu[index] = updatedDay;
        } else {
            wholeWeekMenu.push(updatedDay);
        }

        alert(`${day} menu updated successfully!`);

    } catch (error) {
        console.error(error);
        alert('Error saving menu.');
    }
}
