// Check Auth
const userStr = localStorage.getItem('user');
if (!userStr) {
    window.location.href = '../login.html';
}

const user = JSON.parse(userStr);

if (user.role !== 'teacher' && user.role !== 'hod') {
    alert("Access Denied: Teachers & HODs Only");
    window.location.href = '../index.html';
}

var API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:5000' : 'https://campuscare-backend-96cn.onrender.com') + '/api';

// Calendar state & events (matching student portal)
let currentCalendarDate = new Date();
const calendarEvents = {
    '2026-05-01': { type: 'holiday', title: 'May Day / Labour Day', desc: 'College campus closed in observance of International Workers\' Day.' },
    '2026-05-08': { type: 'holiday', title: 'Rabindranath Tagore Jayanti', desc: 'Celebration of the birth anniversary of Rabindranath Tagore. Holiday declared.' },
    '2026-05-15': { type: 'event', title: 'Mid-Sem Exams Start', desc: 'Spring semester mid-term examinations commence for all departments.' },
    '2026-05-18': { type: 'event', title: 'Guest Lecture: AI Trends', desc: 'Dr. Anita Sen will give a seminar on "Modern Trends in Generative AI" in Seminar Hall 1 at 2:00 PM.' },
    '2026-05-20': { type: 'event', title: 'Annual Cultural Fest', desc: '"Sanskriti 2026" - The annual cultural festival of CampusCare starting from 10:00 AM.' },
    '2026-05-21': { type: 'event', title: 'Cultural Fest Day 2', desc: 'Concerts, dances, and prize distribution ceremony for Sanskriti 2026.' },
    '2026-05-25': { type: 'holiday', title: 'Buddha Purnima', desc: 'Public holiday on the occasion of Buddha Purnima.' },
    '2026-04-15': { type: 'holiday', title: 'Bengali New Year (Poila Baisakh)', desc: 'Subho Noboborsho! College closed.' },
    '2026-04-22': { type: 'event', title: 'Tech Fest "Tantra"', desc: 'Annual national-level coding and robotics contest.' },
    '2026-06-05': { type: 'event', title: 'World Environment Day', desc: 'Tree plantation drive and poster exhibition on campus.' },
    '2026-08-15': { type: 'holiday', title: 'Independence Day', desc: 'Flag hoisting ceremony at Main Lawn at 8:30 AM.' }
};

// Complaint data cache
let allTeacherComplaints = { myStudents: [], myMentees: [], general: [] };
let currentComplaintFilter = 'my-students';

// Notice data cache
let allNotices = [];

function getCalendarTooltip() {
    let tooltip = document.getElementById('calendar-tooltip');
    if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.id = 'calendar-tooltip';
        tooltip.className = 'cal-tooltip';
        document.body.appendChild(tooltip);
    }
    return tooltip;
}

document.addEventListener('DOMContentLoaded', () => {
    // Hero Greeting
    const greeting = document.getElementById('teacher-greeting');
    if (greeting) {
        const firstName = user.name ? user.name.split(' ')[0] : 'Faculty';
        const hour = new Date().getHours();
        let salutation = 'Good morning';
        let icon = '☀️';
        if (hour >= 12 && hour < 17) { salutation = 'Good afternoon'; icon = '☀️'; }
        else if (hour >= 17) { salutation = 'Good evening'; icon = '🌙'; }
        greeting.innerHTML = `${salutation}, <span style="color: var(--primary); font-weight: 800;">${firstName}</span>!<br><span style="font-size: 2.2rem; display: inline-block; margin-top: 8px;">${icon}</span>`;
    }

    // Top Right Profile
    const userNameEl = document.getElementById('userName');
    const userDeptEl = document.getElementById('userDept') || document.getElementById('userRole');
    if (userNameEl) userNameEl.innerText = `Hi, ${user.name ? user.name.split(' ')[0] : 'Faculty'} 👋`;
    if (userDeptEl) userDeptEl.innerText = user.department || 'Department';

    // Profile Dropdown Info
    const userDetailsEl = document.getElementById('userDetails');
    if (userDetailsEl) {
        userDetailsEl.innerHTML = `
            <strong>${user.name || 'User'}</strong><br>
            <span style="font-size:0.8rem; color:var(--text-muted);">${user.identifier || user.email || 'ID Not Available'}</span><br>
            <span style="font-size:0.8rem; background:var(--primary-light); color:var(--primary); padding:2px 6px; border-radius:4px; font-weight:600; margin-top:8px; display:inline-block; text-transform:capitalize;">${user.role}</span>
        `;
    }

    // Bind complaint filter tabs
    const filterTabs = document.querySelectorAll('.complaints-filter-tabs .filter-tab');
    filterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            filterTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentComplaintFilter = tab.dataset.filter;
            renderComplaints();
        });
    });

    // Bind tab clicks for Notices
    const noticeTabs = document.querySelectorAll('#notice-filter-tabs .assignment-tab');
    noticeTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            noticeTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            renderNotices(tab.dataset.filter);
        });
    });

    // Initialize Calendar
    initCalendar();

    // Fetch dynamic content
    fetchTeacherRoutine();
    fetchOfficialNotices();
    fetchTeacherStats();
    fetchTeacherComplaints();
    fetchTeacherAssignments();
});

// Global Logout Function
window.logout = function () {
    localStorage.removeItem('user');
    window.location.href = '../index.html';
};

// Toggle Profile Dropdown
window.toggleProfileMenu = function () {
    const menu = document.getElementById('profileMenu');
    if (menu) {
        menu.style.display = menu.style.display === 'flex' ? 'none' : 'flex';
    }
};

// ── CALENDAR (matching student portal) ──
function initCalendar() {
    renderCalendar();
    const prevBtn = document.getElementById('prev-month');
    const nextBtn = document.getElementById('next-month');
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
            renderCalendar();
        });
    }
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
            renderCalendar();
        });
    }
}

function renderCalendar() {
    const monthYearEl = document.getElementById('calendar-month-year');
    const daysContainer = document.getElementById('calendar-days-container');
    if (!monthYearEl || !daysContainer) return;

    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    monthYearEl.textContent = `${monthNames[month]} ${year}`;
    daysContainer.innerHTML = '';

    const dayNames = ["Su","Mo","Tu","We","Th","Fr","Sa"];
    dayNames.forEach(d => {
        const el = document.createElement('div');
        el.className = 'cal-day-name';
        el.textContent = d;
        daysContainer.appendChild(el);
    });

    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevTotalDays = new Date(year, month, 0).getDate();
    const today = new Date();

    for (let i = firstDay - 1; i >= 0; i--) {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'cal-day muted';
        dayDiv.textContent = prevTotalDays - i;
        daysContainer.appendChild(dayDiv);
    }

    for (let i = 1; i <= totalDays; i++) {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'cal-day';
        dayDiv.textContent = i;

        if (today.getDate() === i && today.getMonth() === month && today.getFullYear() === year) {
            dayDiv.classList.add('active');
        }

        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const dayEvent = calendarEvents[dateStr];
        if (dayEvent) {
            dayDiv.classList.add(dayEvent.type === 'holiday' ? 'holiday-day' : 'event-day');
            dayDiv.addEventListener('mouseenter', () => {
                const tooltip = getCalendarTooltip();
                tooltip.innerHTML = `
                    <span class="cal-tooltip-type ${dayEvent.type}">${dayEvent.type}</span>
                    <div class="cal-tooltip-title">${dayEvent.title}</div>
                    <div class="cal-tooltip-desc">${dayEvent.desc}</div>
                `;
                const rect = dayDiv.getBoundingClientRect();
                tooltip.style.left = `${rect.left + window.scrollX + rect.width / 2}px`;
                tooltip.style.top = `${rect.top + window.scrollY - 10}px`;
                tooltip.style.transform = 'translate(-50%, -100%)';
                tooltip.classList.add('show');
            });
            dayDiv.addEventListener('mouseleave', () => {
                getCalendarTooltip().classList.remove('show');
            });
        }
        daysContainer.appendChild(dayDiv);
    }

    const totalCellsAdded = firstDay + totalDays;
    const remainingCells = 42 - totalCellsAdded;
    for (let i = 1; i <= remainingCells; i++) {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'cal-day muted';
        dayDiv.textContent = i;
        daysContainer.appendChild(dayDiv);
    }
}

// ── TODAY'S SCHEDULE ──
async function fetchTeacherRoutine() {
    const listEl = document.getElementById('todays-schedule-list');
    if (!listEl) return;

    try {
        const res = await fetch(`${API_URL}/routine/teacher`, {
            headers: { 'Authorization': `Bearer ${user.token || localStorage.getItem('token')}` }
        });
        if (!res.ok) throw new Error('Failed to fetch routine');
        const routineData = await res.json();

        const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
        const today = days[new Date().getDay()];
        const todaysClasses = routineData.filter(r => r.day === today);

        if (todaysClasses.length === 0) {
            listEl.innerHTML = `<div style="padding:16px; text-align:center; color:var(--text-muted);">No classes scheduled for today! 🎉</div>`;
            const classStatEl = document.getElementById('stat-classes');
            if (classStatEl) classStatEl.innerText = '0';
            return;
        }

        const parseStartTime = (slot) => {
            const startStr = slot.split(' - ')[0];
            const [hStr, mStr] = startStr.split(':');
            let h = parseInt(hStr);
            const m = parseInt(mStr);
            if (h >= 1 && h <= 6) h += 12;
            return h * 60 + m;
        };

        todaysClasses.sort((a, b) => parseStartTime(a.timeSlot) - parseStartTime(b.timeSlot));

        let html = '';
        todaysClasses.forEach((c, i) => {
            const subjectName = c.subject ? c.subject.name : c.subjectName;
            const room = c.room || 'TBA';
            const slot = c.timeSlot.split(' - ')[0];
            const bgColors = ['#ede9fe','#d1fae5','#e0f2fe','#ffedd5'];
            const textColors = ['#7c3aed','#059669','#0284c7','#ea580c'];
            const bg = bgColors[i % bgColors.length];
            const textC = textColors[i % textColors.length];

            html += `
            <div class="list-item-compact">
                <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600; width: 65px;">${slot}</div>
                <div style="flex: 1; padding: 0 12px;">
                    <h4 style="font-size: 0.85rem; margin: 0; color: var(--text-dark);">${subjectName}</h4>
                </div>
                <span style="background: ${bg}; color: ${textC}; padding: 2px 8px; border-radius: 10px; font-size: 0.7rem; font-weight: 700;">Room ${room}</span>
            </div>`;
        });
        listEl.innerHTML = html;

        const classStatEl = document.getElementById('stat-classes');
        if (classStatEl) classStatEl.innerText = todaysClasses.length;

    } catch (error) {
        console.error('Error fetching routine:', error);
    }
}

// ── OFFICIAL NOTICES ──
async function fetchOfficialNotices() {
    const listEl = document.getElementById('official-notices-list');
    if (!listEl) return;

    try {
        const res = await fetch(`${API_URL}/notices?role=${user.role}&department=${user.department || ''}`);
        if (!res.ok) throw new Error('Failed to fetch notices');
        const notices = await res.json();
        
        const mockNotices = [
            { title: '🧹 Hostel Cleaning Drive Notice', content: 'All hostel residents are hereby informed that a hostel cleaning...', createdAt: '2025-12-18T10:00:00.000Z', audience: 'hosteler' },
            { title: '🎄 Christmas Tree Decora...', content: 'All interested hostelers are invited to participate in the Christmas...', createdAt: '2025-12-15T09:00:00.000Z', audience: 'hosteler' },
            { title: 'Submit Project Report', content: 'Everyone must bring their project report for final submission', createdAt: '2025-12-22T10:00:00.000Z', audience: 'personal' },
            { title: 'Teachers metting', content: 'This is to inform all teaching staff that a departmental meeting will...', createdAt: '2025-12-18T11:00:00.000Z', audience: 'personal' },
            { title: 'CA-2 Submission', content: 'All students of the IT Department are hereby informed that Project...', createdAt: '2025-12-18T08:00:00.000Z', audience: 'personal' },
            { title: 'Teachers Meeting Regardi...', content: 'All teaching faculty members are informed that a meeting will be...', createdAt: '2025-12-15T11:00:00.000Z', audience: 'personal' }
        ];
        allNotices = [...notices, ...mockNotices];
        
        // Inject event dates into calendar
        let calendarUpdated = false;
        notices.forEach(n => {
            let eventDate = n.date;
            let eventType = n.eventType || 'event';
            
            if (n.content && n.content.includes('[EVENT_META:')) {
                const match = n.content.match(/\[EVENT_META:(.*?)\]/);
                if (match && match[1]) {
                    try {
                        const meta = JSON.parse(match[1]);
                        if (meta.date) eventDate = meta.date;
                        if (meta.eventType) eventType = meta.eventType;
                    } catch(e) {}
                }
            }

            if (eventDate) {
                const dateStr = eventDate.split('T')[0];
                if (typeof calendarEvents !== 'undefined' && !calendarEvents[dateStr]) {
                    let rawDesc = n.content || n.description || 'View notice for details.';
                    let plainDesc = rawDesc.replace(/<[^>]*>?/gm, '').substring(0, 100);
                    if (rawDesc.length > 100) plainDesc += '...';
                    calendarEvents[dateStr] = { type: eventType, title: n.title || 'Notice Event', desc: plainDesc };
                    calendarUpdated = true;
                }
            }
        });
        if (calendarUpdated && typeof renderCalendar === 'function') {
            renderCalendar();
        }

        renderNotices('general');
    } catch (error) {
        console.error('Error fetching official notices:', error);
    }
}

function renderNotices(filterType) {
    const listEl = document.getElementById('official-notices-list');
    if (!listEl) return;

    let filtered = [];
    if (filterType === 'personal') {
        filtered = allNotices.filter(n => n.audience !== 'general' && n.audience !== 'hosteler');
    } else if (filterType === 'hosteler') {
        filtered = allNotices.filter(n => n.audience === 'hosteler');
    } else {
        filtered = allNotices.filter(n => n.audience === 'general');
    }

    if (filtered.length === 0) {
        listEl.innerHTML = `<div style="text-align:center; padding: 20px; color:var(--text-muted);">No ${filterType} notices.</div>`;
        return;
    }

    let html = '';
    filtered.slice(0, 5).forEach((n, i) => {
        const bgColors = ['#e0e7ff', '#fef3c7', '#d1fae5'];
        const textColors = ['#4f46e5', '#f59e0b', '#10b981'];
        const icons = ['fa-user-tie', 'fa-file-invoice', 'fa-envelope'];
        
        const bg = bgColors[i % bgColors.length];
        const tc = textColors[i % textColors.length];
        const icon = icons[i % icons.length];
        const d = new Date(n.date || n.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

        html += `
        <div class="notice-item notice-item-clickable fade-in stagger-${(i % 4) + 1}" data-id="${n._id || i}" style="display:flex; gap:12px; align-items:center; padding:12px; border:1px solid var(--border-color); border-radius:var(--radius-md); background:var(--bg-color); cursor:pointer; text-decoration:none !important; color:inherit; transition: transform 0.15s, box-shadow 0.15s;" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='var(--shadow-sm)'" onmouseout="this.style.transform='none';this.style.boxShadow='none'">
            <div style="background:${bg}; color:${tc}; width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; flex-shrink: 0;"><i class="fa-solid ${icon}"></i></div>
            <div class="notice-info" style="min-width: 0; flex:1;">
                <h4 style="font-size: 0.9rem; margin-bottom: 4px; color: var(--text-dark);">${n.title}</h4>
                <p style="font-size: 0.8rem; color: var(--text-muted); margin: 0; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">${n.content}</p>
            </div>
            <div class="notice-date" style="font-size: 0.75rem; font-weight: 600; color: var(--text-muted);">${d}</div>
        </div>`;
    });
    listEl.innerHTML = html;

    document.querySelectorAll('#official-notices-list .notice-item-clickable').forEach(item => {
        item.addEventListener('click', () => {
            const noticeId = item.dataset.id;
            const notice = filtered.find((n, index) => (n._id === noticeId || index.toString() === noticeId));
            if (notice && typeof window.showDetailPopup === 'function') {
                const dStr = new Date(notice.date || notice.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
                window.showDetailPopup(notice.title || 'Notice', '', notice.content || '', dStr, notice.audience || 'General');
            }
        });
    });
}

// ── STATS (Students, Mentees, Tasks) ──
async function fetchTeacherStats() {
    // Fetch students count
    try {
        const res = await fetch(`${API_URL}/teacher/all-students`, {
            headers: { 'Authorization': `Bearer ${user.token}` }
        });
        if (res.ok) {
            const students = await res.json();
            const el = document.getElementById('stat-students');
            if (el) el.innerText = students.length;
        }
    } catch (e) { console.error('Stats students error:', e); }

    // Fetch mentees count
    try {
        const res = await fetch(`${API_URL}/teacher/my-mentees`, {
            headers: { 'Authorization': `Bearer ${user.token}` }
        });
        if (res.ok) {
            const mentees = await res.json();
            const el = document.getElementById('stat-mentees');
            if (el) el.innerText = mentees.length;
        }
    } catch (e) { console.error('Stats mentees error:', e); }

    // Fetch pending tasks (MAR/MOOC approvals)
    try {
        const res = await fetch(`${API_URL}/mar-moocs/mentees`, {
            headers: { 'Authorization': `Bearer ${user.token}` }
        });
        if (res.ok) {
            const items = await res.json();
            const pending = Array.isArray(items) ? items.filter(i => i.status === 'Proposed').length : 0;
            const el = document.getElementById('stat-tasks');
            if (el) el.innerText = pending;
        }
    } catch (e) {
        const el = document.getElementById('stat-tasks');
        if (el) el.innerText = '0';
    }
}

// ── COMPLAINTS WITH FILTER TABS ──
async function fetchTeacherComplaints() {
    const listEl = document.getElementById('recent-complaints-list');
    if (!listEl) return;

    try {
        // Fetch general/public complaints
        const genRes = await fetch(`${API_URL}/complaints?public=true`);
        const genData = genRes.ok ? await genRes.json() : [];
        allTeacherComplaints.general = genData.slice(0, 8);
    } catch (e) { console.error('General complaints error:', e); }

    try {
        // Fetch mentee complaints
        const menteeRes = await fetch(`${API_URL}/complaints/mentees`, {
            headers: { 'Authorization': `Bearer ${user.token}` }
        });
        const menteeData = menteeRes.ok ? await menteeRes.json() : [];
        allTeacherComplaints.myMentees = menteeData.slice(0, 8);
    } catch (e) { console.error('Mentee complaints error:', e); }

    try {
        // Fetch all complaints, filter by teacher's students (department match)
        const allRes = await fetch(`${API_URL}/complaints`);
        const allData = allRes.ok ? await allRes.json() : [];
        allTeacherComplaints.myStudents = allData
            .filter(c => c.student && c.student.department === user.department)
            .slice(0, 8);
    } catch (e) { console.error('Student complaints error:', e); }

    renderComplaints();
}

function renderComplaints() {
    const listEl = document.getElementById('recent-complaints-list');
    if (!listEl) return;

    let data = [];
    if (currentComplaintFilter === 'my-students') data = allTeacherComplaints.myStudents;
    else if (currentComplaintFilter === 'my-mentees') data = allTeacherComplaints.myMentees;
    else data = allTeacherComplaints.general;

    if (!data || data.length === 0) {
        listEl.innerHTML = `<div style="text-align:center; padding:20px; color:var(--text-muted);"><i class="fa-solid fa-check-circle" style="font-size:1.5rem; margin-bottom:8px; opacity:0.5; display:block;"></i>No complaints found.</div>`;
        return;
    }

    listEl.innerHTML = data.map((c, i) => {
        const studentName = c.student ? c.student.name : 'Anonymous';
        const statusColors = { 'Resolved': '#10b981', 'In Progress': '#3b82f6', 'Under Progress': '#3b82f6', 'Escalated': '#8b5cf6' };
        const sColor = statusColors[c.status] || '#ef4444';
        const catBg = ['#ffedd5','#e0f2fe','#ede9fe','#fce7f3'];
        const catTc = ['#ea580c','#0284c7','#7c3aed','#db2777'];

        return `
        <a href="../modules/complaints/resolve.html" style="display:flex; gap:12px; align-items:flex-start; padding:12px; border:1px solid var(--border-color); border-radius:var(--radius-md); background:var(--bg-color); text-decoration:none !important; color:inherit; cursor:pointer; transition: transform 0.15s, box-shadow 0.15s;" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='var(--shadow-sm)'" onmouseout="this.style.transform='none';this.style.boxShadow='none'">
            <div style="background:${catBg[i%4]}; color:${catTc[i%4]}; width:36px; height:36px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:0.9rem; flex-shrink:0;">
                <i class="fa-solid fa-triangle-exclamation"></i>
            </div>
            <div style="flex:1; min-width:0;">
                <h4 style="font-size:0.85rem; margin:0 0 2px 0; color:var(--text-dark); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${c.title}</h4>
                <p style="font-size:0.72rem; color:var(--text-muted); margin:0;">${studentName} · ${c.category || 'General'}</p>
            </div>
            <span style="font-size:0.65rem; font-weight:700; color:${sColor}; background:${sColor}15; padding:2px 8px; border-radius:10px; white-space:nowrap;">${c.status || 'Pending'}</span>
        </a>`;
    }).join('');
}

// ── ASSIGNMENTS PREVIEW ──
async function fetchTeacherAssignments() {
    const listEl = document.getElementById('assignments-list');
    if (!listEl) return;

    try {
        const res = await fetch(`${API_URL}/assignments/created`, {
            headers: { 'Authorization': `Bearer ${user.token}` }
        });
        if (!res.ok) throw new Error('Failed');
        const assignments = await res.json();
        const list = assignments.filter(a => a.type !== 'note').slice(0, 6);

        if (list.length === 0) {
            listEl.innerHTML = `<div style="text-align:center; padding:20px; color:var(--text-muted);"><i class="fa-solid fa-file-circle-check" style="font-size:1.5rem; margin-bottom:8px; opacity:0.5; display:block;"></i>No assignments created yet.</div>`;
            return;
        }

        listEl.innerHTML = list.map((a, i) => {
            const due = a.deadline ? new Date(a.deadline).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : 'No deadline';
            const isPast = a.deadline && new Date(a.deadline) < new Date();
            const bgColors = ['#e0f2fe','#ede9fe','#d1fae5','#fef3c7','#fce7f3','#ffedd5'];
            const tcColors = ['#0284c7','#7c3aed','#059669','#d97706','#db2777','#ea580c'];

            return `
            <a href="../modules/assignments/post.html" style="display:flex; gap:12px; align-items:center; padding:12px; border:1px solid var(--border-color); border-radius:var(--radius-md); background:var(--bg-color); text-decoration:none !important; color:inherit; transition: transform 0.15s, box-shadow 0.15s;" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='var(--shadow-sm)'" onmouseout="this.style.transform='none';this.style.boxShadow='none'">
                <div style="background:${bgColors[i%6]}; color:${tcColors[i%6]}; width:36px; height:36px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:0.9rem; flex-shrink:0;">
                    <i class="fa-solid fa-file-pen"></i>
                </div>
                <div style="flex:1; min-width:0;">
                    <h4 style="font-size:0.85rem; margin:0 0 2px 0; color:var(--text-dark); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${a.title}</h4>
                    <p style="font-size:0.72rem; color:var(--text-muted); margin:0;">${a.subject || ''} · ${a.batch ? 'Batch ' + a.batch : ''}</p>
                </div>
                <span style="font-size:0.65rem; font-weight:700; color:${isPast ? '#ef4444' : '#059669'}; background:${isPast ? '#fef2f2' : '#ecfdf5'}; padding:2px 8px; border-radius:10px; white-space:nowrap;">${due}</span>
            </a>`;
        }).join('');
    } catch (error) {
        console.error('Error fetching assignments:', error);
        if (listEl) listEl.innerHTML = `<div style="text-align:center; padding:20px; color:var(--text-muted);">Could not load assignments.</div>`;
    }
}
