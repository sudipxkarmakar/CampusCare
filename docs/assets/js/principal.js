var API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:5000' : 'https://campuscare-backend-96cn.onrender.com') + '/api/principal';

document.addEventListener('DOMContentLoaded', () => {
    loadDashboardStats();
    setupProfile();
});

// Welcome Greeting Generator
function getGreetingText(name) {
    const hour = new Date().getHours();
    let salutation = "Good morning";
    let icon = "🏛️";
    
    if (hour >= 5 && hour < 12) {
        salutation = "Good morning";
        icon = "🏛️";
    } else if (hour >= 12 && hour < 17) {
        salutation = "Good afternoon";
        icon = "🏛️";
    } else {
        salutation = "Good evening";
        icon = "🏛️";
    }
    
    return `${salutation}, <span style="color: var(--primary); font-weight: 800;">${name}</span>! ${icon}`;
}

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

        // Populate DOM dynamically (No hardcoding)
        if (document.getElementById('totalStudents'))
            document.getElementById('totalStudents').innerText = data.studentCount !== undefined ? data.studentCount : 0;
        if (document.getElementById('totalTeachers'))
            document.getElementById('totalTeachers').innerText = data.teacherCount !== undefined ? data.teacherCount : 0;
        if (document.getElementById('activeLeaves'))
            document.getElementById('activeLeaves').innerText = data.activeLeaves !== undefined ? data.activeLeaves : 0;
        if (document.getElementById('openComplaints'))
            document.getElementById('openComplaints').innerText = data.openComplaints !== undefined ? data.openComplaints : 0;
        if (document.getElementById('totalHODs'))
            document.getElementById('totalHODs').innerText = data.hodCount !== undefined ? data.hodCount : 0;
        if (document.getElementById('totalWardens'))
            document.getElementById('totalWardens').innerText = data.wardenCount !== undefined ? data.wardenCount : 0;

    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
    }
}

function setupProfile() {
    const userStr = localStorage.getItem('user');
    if (userStr) {
        const user = JSON.parse(userStr);
        
        // Update greeting
        const greetingEl = document.getElementById('principal-greeting');
        if (greetingEl) {
            const firstName = user.name ? user.name.split(' ')[0] : 'Principal';
            greetingEl.innerHTML = getGreetingText(firstName);
        }

        // Set navbar user profiles
        const userProfileEl = document.getElementById('userProfile');
        if (userProfileEl) userProfileEl.style.display = 'flex';
        
        const userNameEl = document.getElementById('userName');
        if (userNameEl) userNameEl.innerText = `Hi, ${user.name ? user.name.split(' ')[0] : 'Principal'}`;
        
        const userDetailsEl = document.getElementById('userDetails');
        if (userDetailsEl) {
            userDetailsEl.innerHTML = `<strong>${user.role.toUpperCase()}</strong><br>${user.email}<br>Campus Authority`;
        }
    }
}
