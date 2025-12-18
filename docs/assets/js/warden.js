const API_URL = 'http://localhost:5000/api/warden';

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
    if (user.role !== 'warden' && user.role !== 'admin') {
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
        if (document.getElementById('hostelerCountVal'))
            document.getElementById('hostelerCountVal').innerText = data.hostelerCount;

        const leaveBadge = document.getElementById('leaveCountBadge');
        if (leaveBadge) {
            leaveBadge.innerText = data.pendingLeaves;
            if (data.pendingLeaves > 0) leaveBadge.style.display = 'flex';
            else leaveBadge.style.display = 'none';
        }

    } catch (error) {
        console.error(error);
        if (document.getElementById('hostelerCountVal'))
            document.getElementById('hostelerCountVal').innerText = '-';
    }
}

function setupProfile() {
    const userStr = localStorage.getItem('user');
    if (userStr) {
        const user = JSON.parse(userStr);
        document.getElementById('userProfile').style.display = 'flex';
        document.getElementById('userName').innerText = user.name;
        document.getElementById('userDetails').innerHTML = `<strong>${user.role.toUpperCase()}</strong><br>${user.email}<br>${user.hostelName || 'Hostel Admin'}`;
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
