const API_URL = 'http://localhost:5000/api/principal';

document.addEventListener('DOMContentLoaded', () => {
    loadDashboardStats();
    setupProfile();
});

async function loadDashboardStats() {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
        window.location.href = '../login.html';
        return;
    }
    const user = JSON.parse(userStr);

    // Verify Role
    if (user.role !== 'principal' && user.role !== 'admin') {
        alert('Unauthorized Access');
        window.location.href = '../index.html';
        return;
    }

    try {
        const response = await fetch(`${API_URL}/dashboard`, {
            headers: {
                'Authorization': `Bearer ${user.token}`
            }
        });

        if (!response.ok) throw new Error('Failed to load stats');

        const data = await response.json();

        // Populate DOM
        if (document.getElementById('totalStudents'))
            document.getElementById('totalStudents').innerText = data.studentCount;
        if (document.getElementById('totalTeachers'))
            document.getElementById('totalTeachers').innerText = data.teacherCount;
        if (document.getElementById('activeLeaves'))
            document.getElementById('activeLeaves').innerText = data.activeLeaves;
        if (document.getElementById('openComplaints'))
            document.getElementById('openComplaints').innerText = data.openComplaints;

    } catch (error) {
        console.error(error);
    }
}

function setupProfile() {
    const userStr = localStorage.getItem('user');
    if (userStr) {
        const user = JSON.parse(userStr);
        document.getElementById('userProfile').style.display = 'flex';
        document.getElementById('userName').innerText = user.name;
        document.getElementById('userDetails').innerHTML = `<strong>${user.role.toUpperCase()}</strong><br>${user.email}<br>Campus Admin`;
    }
}

function toggleProfileMenu() {
    const menu = document.getElementById('profileMenu');
    menu.style.display = menu.style.display === 'flex' ? 'none' : 'flex';
}

function logout() {
    localStorage.removeItem('user');
    window.location.href = '../index.html';
}
