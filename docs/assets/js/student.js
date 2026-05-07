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
    fetchNotices();
    fetchRoutine();
});

const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:5000' : 'https://campuscare-backend-96cn.onrender.com') + '/api';

async function fetchRoutine() {
    try {
        const titleEl = document.getElementById('routine-title');
        const subjectEl = document.getElementById('routine-subject');
        const teacherEl = document.getElementById('routine-teacher');
        const timeEl = document.getElementById('routine-time');

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 45000); // 45s timeout for Render wake

        const res = await fetch(`${API_URL}/routine/student`, {
            headers: { 'Authorization': `Bearer ${user.token}` },
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!res.ok) throw new Error('Failed to fetch routine');
        const routineData = await res.json();

        // 2. Get Today's Day
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const today = days[new Date().getDay()];

        // 3. Filter Classes for Today
        const todaysClasses = routineData.filter(r => r.day === today);

        if (todaysClasses.length === 0) {
            if (titleEl) titleEl.textContent = "Today's Status";
            if (subjectEl) subjectEl.textContent = "No Classes";
            if (teacherEl) teacherEl.textContent = "Enjoy your day off!";
            if (timeEl) timeEl.textContent = "";
            return;
        }

        // 4. Sort Classes by Time (Just in case)
        const parseStartTime = (slot) => {
            const startStr = slot.split(' - ')[0]; // "09:30"
            const [hStr, mStr] = startStr.split(':');
            let h = parseInt(hStr);
            const m = parseInt(mStr);
            if (h >= 1 && h <= 6) h += 12;
            return h * 60 + m;
        };

        todaysClasses.sort((a, b) => parseStartTime(a.timeSlot) - parseStartTime(b.timeSlot));

        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        let activeClass = todaysClasses.find(c => currentMinutes <= parseStartTime(c.timeSlot));

        if (activeClass) {
            const subjectName = activeClass.subject ? activeClass.subject.name : activeClass.subjectName;
            const teacherName = activeClass.teacher ? activeClass.teacher.name : activeClass.teacherName;
            const slot = activeClass.timeSlot;

            const startMins = parseStartTime(slot);
            const diff = startMins - currentMinutes;

            let statusText = "Upcoming Class";
            if (diff <= 0) statusText = "Starting Now";
            else if (diff <= 60) statusText = `Starts in ${diff} mins`;

            if (titleEl) titleEl.textContent = (diff <= 0) ? "Current Class" : "Next Class";
            if (subjectEl) subjectEl.textContent = subjectName;
            if (teacherEl) teacherEl.textContent = teacherName || "No Teacher Assigned";
            if (timeEl) timeEl.textContent = `Time: ${slot}`;
        } else {
            if (titleEl) titleEl.textContent = "Today's Status";
            if (subjectEl) subjectEl.textContent = "Classes Done";
            if (teacherEl) teacherEl.textContent = "Relax and Review";
            if (timeEl) timeEl.textContent = "See you tomorrow!";
        }

    } catch (error) {
        console.error('Error fetching routine:', error);
        const subjectEl = document.getElementById('routine-subject');
        if (subjectEl) subjectEl.textContent = error.name === 'AbortError' ? "Network Timeout" : "Error";
    } finally {
        // Ensure "Loading..." is cleared if it fails
        const subjectEl = document.getElementById('routine-subject');
        if (subjectEl && subjectEl.textContent === 'Loading...') subjectEl.textContent = "Not Available";
    }
}

// Stats fetch
async function fetchStats() {
    try {
        const res = await fetch(`${API_URL}/content/my-content`, {
            headers: { 'Authorization': `Bearer ${user.token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch content');
        const data = await res.json();
        const assignments = data.assignments || [];
        const pendingCount = assignments.filter(a => !a.submitted).length;
        const pendingCard = document.querySelector('a[href="assignments.html"] .stat-value');
        if (pendingCard) pendingCard.textContent = pendingCount < 10 ? `0${pendingCount}` : pendingCount;
    } catch (error) {
        console.error('Error fetching stats:', error);
    }
}

// Notice fetch
async function fetchNotices() {
    try {
        const res = await fetch(`${API_URL}/notices?role=${user.role}&userId=${user._id}&department=${user.department || ''}`);
        if (!res.ok) throw new Error('Failed to fetch notices');
        const notices = await res.json();
        const personalNotices = notices.filter(n => n.audience !== 'general');
        const count = personalNotices.length;
        const noticeCountEl = document.getElementById('notice-count');
        if (noticeCountEl) noticeCountEl.textContent = count < 10 ? `0${count}` : count;
    } catch (error) {
        console.error('Error fetching notices:', error);
        const noticeCountEl = document.getElementById('notice-count');
        if (noticeCountEl) noticeCountEl.textContent = "00";
    }
}

// Logout Helper
function logout() {
    localStorage.removeItem('user');
    window.location.href = '../index.html';
}
