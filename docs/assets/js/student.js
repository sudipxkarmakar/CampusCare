// Check Auth
const userStr = localStorage.getItem('user');
if (!userStr) {
    window.location.href = '../login.html';
}

const user = JSON.parse(userStr);

if (user.role !== 'student' && user.role !== 'hosteler') {
    alert("Access Denied: Students & Hostelers Only");
    window.location.href = '../index.html';
}

// Update UI
document.addEventListener('DOMContentLoaded', () => {
    // Update Header/Hero
    const heroSub = document.querySelector('.hero-sub');
    if (heroSub) {
        heroSub.innerText = `Hello ${user.name}  (${user.department} - ${user.batch})`;
    }

    // Update Stats
    fetchStats();
});

async function fetchStats() {
    try {
        // Fetch Assignments
        const res = await fetch(`http://localhost:5000/api/assignments?dept=${user.department}&batch=${user.batch}&section=${user.section}`);
        if (!res.ok) throw new Error('Failed to fetch assignments');

        const assignments = await res.json();

        // Filter Pending (Future Deadline)
        const pendingCount = assignments.filter(a => new Date(a.deadline) > new Date()).length;

        // Update DOM
        const pendingCard = document.querySelector('a[href="assignments.html"] .stat-value');
        if (pendingCard) pendingCard.textContent = pendingCount < 10 ? `0${pendingCount}` : pendingCount;

    } catch (error) {
        console.error('Error fetching stats:', error);
    }
}

// Logout Helper
function logout() {
    localStorage.removeItem('user');
    window.location.href = '../index.html';
}
