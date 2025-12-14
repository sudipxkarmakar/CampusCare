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

    // Update Stats (Mock for now, or fetch from API)
    // Update Stats
    fetchStats();
});

async function fetchStats() {
    try {
        const noticeCountEl = document.getElementById('notice-count');
        if (noticeCountEl) {
            // Fetch notices based on user role
            const role = user.role === 'hosteler' ? 'hosteler' : 'student';
            const res = await fetch(`http://localhost:5000/api/notices?role=${role}`);
            if (res.ok) {
                const notices = await res.json();
                noticeCountEl.innerText = notices.length;
            } else {
                noticeCountEl.innerText = '-';
            }
        }
    } catch (error) {
        console.error("Failed to fetch stats:", error);
        const noticeCountEl = document.getElementById('notice-count');
        if (noticeCountEl) noticeCountEl.innerText = '!';
    }
}

// Logout Helper
function logout() {
    localStorage.removeItem('user');
    window.location.href = '../index.html';
}
