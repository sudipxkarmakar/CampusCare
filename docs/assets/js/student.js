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

async function fetchRoutine() {
    try {
        const titleEl = document.getElementById('routine-title');
        const subjectEl = document.getElementById('routine-subject');
        const teacherEl = document.getElementById('routine-teacher');
        const timeEl = document.getElementById('routine-time');

        // 1. Fetch Routine
        const res = await fetch(`http://localhost:5000/api/routine/student`, {
            headers: { 'Authorization': `Bearer ${user.token}` }
        });

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
        // Helper to parse "09:30 - 10:30" start time to minutes
        const parseStartTime = (slot) => {
            const startStr = slot.split(' - ')[0]; // "09:30"
            const [hStr, mStr] = startStr.split(':');
            let h = parseInt(hStr);
            const m = parseInt(mStr);

            // Handle 12-hour format approximate logic (School hours 7am - 6pm)
            if (h >= 1 && h <= 6) h += 12; // 01:30 -> 13:30

            return h * 60 + m;
        };

        todaysClasses.sort((a, b) => parseStartTime(a.timeSlot) - parseStartTime(b.timeSlot));

        // 5. Find "Active" Class (Next or Current logic)
        // User Logic: "Till 9.30 point at that subject, from 9.31 point to next"
        // This means: Display the FIRST class where (Now_Minutes <= Start_Minutes)
        // If Now=9:00, Start=9:30 -> True. Display.
        // If Now=9:30, Start=9:30 -> True. Display.
        // If Now=9:31, Start=9:30 -> False. Check Next.

        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        // Find the first class that satisfies the condition
        let activeClass = todaysClasses.find(c => currentMinutes <= parseStartTime(c.timeSlot));

        // Display Logic
        if (activeClass) {
            const subjectName = activeClass.subject ? activeClass.subject.name : activeClass.subjectName;
            const teacherName = activeClass.teacher ? activeClass.teacher.name : activeClass.teacherName;
            const slot = activeClass.timeSlot; // "09:30 - 10:30"

            // Determine if it is "Next" or "Starting Now"
            const startMins = parseStartTime(slot);
            const diff = startMins - currentMinutes;

            let statusText = "Upcoming Class";
            if (diff <= 0) statusText = "Starting Now";
            else if (diff <= 60) statusText = `Starts in ${diff} mins`;

            // Override title if user wants "Today's First Class" style, but "Next Class" is more accurate
            if (titleEl) titleEl.textContent = (diff <= 0) ? "Current Class" : "Next Class";

            if (subjectEl) subjectEl.textContent = subjectName;
            if (teacherEl) teacherEl.textContent = teacherName || "No Teacher Assigned";
            if (timeEl) timeEl.textContent = `Time: ${slot}`;

        } else {
            // No more classes satisfying condition (all started > 1 min ago)
            // Check if there are ANY classes today that we missed? 
            // If currentMinutes > last_class_start, assume day is over.

            if (titleEl) titleEl.textContent = "Today's Status";
            if (subjectEl) subjectEl.textContent = "Classes Done";
            if (teacherEl) teacherEl.textContent = "Relax and Review";
            if (timeEl) timeEl.textContent = "See you tomorrow!";
        }

    } catch (error) {
        console.error('Error fetching routine:', error);
        const subjectEl = document.getElementById('routine-subject');
        if (subjectEl) subjectEl.textContent = "Error";
    }
}

async function fetchStats() {
    try {
        // Fetch Content (Assignments + Notes)
        // matching logic of assignments.html
        const res = await fetch(`http://localhost:5000/api/content/my-content`, {
            headers: { 'Authorization': `Bearer ${user.token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch content');

        const data = await res.json();
        const assignments = data.assignments || [];

        // Filter Pending (Only Assignments, not submitted)
        // Note: Backend now populates 'submitted' field correctly
        const pendingCount = assignments.filter(a => !a.submitted).length;

        // Update DOM
        const pendingCard = document.querySelector('a[href="assignments.html"] .stat-value');
        if (pendingCard) pendingCard.textContent = pendingCount < 10 ? `0${pendingCount}` : pendingCount;

    } catch (error) {
        console.error('Error fetching stats:', error);
    }
}

async function fetchNotices() {
    try {
        const res = await fetch(`http://localhost:5000/api/notices?role=${user.role}&userId=${user._id}`);
        if (!res.ok) throw new Error('Failed to fetch notices');
        const notices = await res.json();
        const count = notices.length;

        const noticeCountEl = document.getElementById('notice-count');
        if (noticeCountEl) {
            noticeCountEl.textContent = count < 10 ? `0${count}` : count;
        }
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
