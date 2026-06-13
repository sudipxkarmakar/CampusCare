// Check Auth
const userStr = localStorage.getItem('user');
if (!userStr) {
    window.location.href = '../login.html';
    throw new Error("Redirecting to login...");
}

const user = JSON.parse(userStr);

if (user.role !== 'student' && user.role !== 'hosteler') {
    alert("Access Denied: Students & Hostelers Only");
    window.location.href = '../index.html';
}

// Global state for filtering
let allAssignments = [];
let allNotices = [];
let currentCalendarDate = new Date();

const calendarEvents = {
    // format: 'YYYY-MM-DD'
    '2026-05-01': { type: 'holiday', title: 'May Day / Labour Day', desc: 'College campus closed in observance of International Workers\' Day.' },
    '2026-05-08': { type: 'holiday', title: 'Rabindranath Tagore Jayanti', desc: 'Celebration of the birth anniversary of Rabindranath Tagore. Holiday declared.' },
    '2026-05-15': { type: 'event', title: 'Mid-Sem Exams Start', desc: 'Spring semester mid-term examinations commence for all departments.' },
    '2026-05-18': { type: 'event', title: 'Guest Lecture: AI Trends', desc: 'Dr. Anita Sen will give a seminar on "Modern Trends in Generative AI" in Seminar Hall 1 at 2:00 PM.' },
    '2026-05-20': { type: 'event', title: 'Annual Cultural Fest', desc: '"Sanskriti 2026" - The annual cultural festival of CampusCare starting from 10:00 AM.' },
    '2026-05-21': { type: 'event', title: 'Cultural Fest Day 2', desc: 'Concerts, dances, and prize distribution ceremony for Sanskriti 2026.' },
    '2026-05-25': { type: 'holiday', title: 'Buddha Purnima', desc: 'Public holiday on the occasion of Buddha Purnima.' },
    
    // Other months for navigation testing
    '2026-04-15': { type: 'holiday', title: 'Bengali New Year (Poila Baisakh)', desc: 'Subho Noboborsho! College closed.' },
    '2026-04-22': { type: 'event', title: 'Tech Fest "Tantra"', desc: 'Annual national-level coding and robotics contest.' },
    '2026-06-05': { type: 'event', title: 'World Environment Day', desc: 'Tree plantation drive and poster exhibition on campus.' },
    '2026-08-15': { type: 'holiday', title: 'Independence Day', desc: 'Flag hoisting ceremony at Main Lawn at 8:30 AM.' }
};

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

var API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname === '' || window.location.protocol === 'file:' ? 'http://localhost:5000' : 'https://campuscare-backend-96cn.onrender.com') + '/api';

// Welcome Greeting Generator
function getGreetingText(name) {
    const hour = new Date().getHours();
    let salutation = "Good morning";
    let icon = "☀️";
    
    if (hour >= 5 && hour < 12) {
        salutation = "Good morning";
        icon = "☀️";
    } else if (hour >= 12 && hour < 17) {
        salutation = "Good afternoon";
        icon = "☀️";
    } else {
        salutation = "Good evening";
        icon = "🌙";
    }
    
    return `${salutation}, <span style="color: var(--primary); font-weight: 800;">${name}</span>!<br><span style="font-size: 2.2rem; display: inline-block; margin-top: 8px;">${icon}</span>`;
}

// Update UI
document.addEventListener('DOMContentLoaded', () => {
    // Update Header/Hero greeting initially
    const greeting = document.getElementById('student-greeting');
    if (greeting) {
        const firstName = user.name ? user.name.split(' ')[0] : 'Student';
        greeting.innerHTML = getGreetingText(firstName);
    }

    // Bind tab clicks for Assignments
    const assignTabs = document.querySelectorAll('#assignment-filter-tabs .assignment-tab');
    assignTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            assignTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            renderAssignments(tab.dataset.filter);
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

    // Helpdesk module click
    const helpdeskBtn = document.getElementById('helpdesk-module-btn');
    if (helpdeskBtn) {
        helpdeskBtn.addEventListener('click', () => {
            if (typeof toggleModal === 'function') toggleModal('sos-modal');
        });
    }

    // Initialize Calendar
    initCalendar();

    // Fetch and Sync data
    refreshUserProfile();
    fetchStats();
    fetchNotices();
    fetchRoutine();
});

// Profile refresher
async function refreshUserProfile() {
    try {
        const res = await fetch(`${API_URL}/auth/profile`, {
            headers: { 'Authorization': `Bearer ${user.token}` }
        });
        if (res.ok) {
            const latestProfile = await res.json();
            // Merge token
            latestProfile.token = user.token;
            localStorage.setItem('user', JSON.stringify(latestProfile));
            
            // Force dynamic role display update
            if (window.checkAuthState) window.checkAuthState();

            // Sync greeting name if changed
            const greeting = document.getElementById('student-greeting');
            if (greeting) {
                const firstName = latestProfile.name ? latestProfile.name.split(' ')[0] : 'Student';
                greeting.innerHTML = getGreetingText(firstName);
            }
            
            // Sync Active Sem
            const activeSemEl = document.getElementById('active-sem-val');
            if (activeSemEl && latestProfile.semester) {
                activeSemEl.textContent = `Semester ${latestProfile.semester}`;
            }
        }
    } catch (error) {
        console.error('Error refreshing profile:', error);
    }
}

// Dynamic Calendar logic
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

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    monthYearEl.textContent = `${monthNames[month]} ${year}`;

    daysContainer.innerHTML = '';

    const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
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

    // Fill preceding month days
    for (let i = firstDay - 1; i >= 0; i--) {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'cal-day muted';
        dayDiv.textContent = prevTotalDays - i;
        daysContainer.appendChild(dayDiv);
    }

    // Fill current month days
    for (let i = 1; i <= totalDays; i++) {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'cal-day';
        dayDiv.textContent = i;

        if (today.getDate() === i && today.getMonth() === month && today.getFullYear() === year) {
            dayDiv.classList.add('active');
        }

        // Check for holiday / event
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
                const tooltip = getCalendarTooltip();
                tooltip.classList.remove('show');
            });
        }

        daysContainer.appendChild(dayDiv);
    }

    // Fill succeeding month days to standard 42-grid size
    const totalCellsAdded = firstDay + totalDays;
    const remainingCells = 42 - totalCellsAdded;
    for (let i = 1; i <= remainingCells; i++) {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'cal-day muted';
        dayDiv.textContent = i;
        daysContainer.appendChild(dayDiv);
    }
}

async function fetchRoutine() {
    const listEl = document.getElementById('todays-classes-list');
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 45000);

        const res = await fetch(`${API_URL}/routine/student`, {
            headers: { 'Authorization': `Bearer ${user.token}` },
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!res.ok) throw new Error('Failed to fetch routine');
        const routineData = await res.json();

        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const today = days[new Date().getDay()];
        const todaysClasses = routineData.filter(r => r.day === today);

        if (!listEl) return;

        if (todaysClasses.length === 0) {
            listEl.innerHTML = `<div style="padding:16px; text-align:center; color:var(--text-muted); border:1px solid var(--border-color); border-radius:var(--radius-md);">No classes scheduled for today! 🎉</div>`;
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

        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        let activeClass = todaysClasses.find(c => currentMinutes <= parseStartTime(c.timeSlot));

        let html = '';
        todaysClasses.forEach((c, i) => {
            const subjectName = c.subject ? c.subject.name : c.subjectName;
            const teacherName = c.teacher ? c.teacher.name : c.teacherName;
            const slot = c.timeSlot;
            const isNext = (c === activeClass);
            
            const bgColors = ['#d1fae5', '#fef3c7', '#e0e7ff', '#fce7f3'];
            const textColors = ['#10b981', '#f59e0b', '#4f46e5', '#ec4899'];
            const icons = ['fa-chalkboard-user', 'fa-database', 'fa-code', 'fa-laptop-code'];
            
            const bg = bgColors[i % bgColors.length];
            const textC = textColors[i % textColors.length];
            const icon = icons[i % icons.length];
            
            let wrapperStyle = `display:flex; gap:16px; align-items:center; padding:16px; border-radius:var(--radius-md); background:var(--bg-color); border:1px solid var(--border-color);`;
            let titleText = subjectName;

            if (isNext) {
                wrapperStyle = `display:flex; gap:16px; align-items:center; padding:16px; border-radius:var(--radius-md); background:var(--primary-light); border:1px solid var(--primary); text-decoration:none; color:var(--text-dark);`;
                titleText = "Next: " + subjectName;
            }

            html += `
            <${isNext ? 'a href="routine.html?view=today"' : 'div'} style="${wrapperStyle}">
                <div style="width:48px; height:48px; border-radius:var(--radius-sm); background:${bg}; color:${textC}; display:flex; align-items:center; justify-content:center; font-size:1.5rem;">
                <i class="fa-solid ${icon}"></i>
                </div>
                <div style="flex:1;">
                <h4 style="margin:0 0 4px 0; font-size:1rem;">${titleText}</h4>
                <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.75rem;">
                    <span style="color:var(--text-muted)">${slot}</span>
                    <span style="background:${bg}; color:${textC}; padding:2px 8px; border-radius:var(--radius-full); font-weight:600;">${teacherName || "No Teacher"}</span>
                </div>
                </div>
            </${isNext ? 'a' : 'div'}>`;
        });
        listEl.innerHTML = html;

    } catch (error) {
        console.error('Error fetching routine:', error);
        if (listEl) listEl.innerHTML = `<div style="padding:16px; text-align:center; color:var(--danger); border:1px solid var(--danger); border-radius:var(--radius-md);">Failed to load routine.</div>`;
    }
}

// Stats & Assignments fetch
async function fetchStats() {
    try {
        const res = await fetch(`${API_URL}/content/my-content`, {
            headers: { 'Authorization': `Bearer ${user.token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch content');
        const data = await res.json();
        allAssignments = data.assignments || [];
        
        // Update Stats values dynamically
        const cgpaEl = document.getElementById('cgpa-val');
        if(cgpaEl) {
            const cgpa = data.cgpa || user.cgpa || (user.academicInfo ? user.academicInfo.cgpa : '3.67');
            cgpaEl.innerHTML = `${cgpa} <span style="font-size:0.8rem; color:var(--text-muted); font-weight:400;">/4.00</span>`;
        }
        const attEl = document.getElementById('attendance-val');
        if(attEl) {
            const att = data.attendance || user.attendance || (user.academicInfo ? user.academicInfo.attendance : '92');
            attEl.textContent = `${att}%`;
        }
        const credEl = document.getElementById('credits-val');
        if(credEl) {
            const cred = data.credits || user.credits || (user.academicInfo ? user.academicInfo.creditsEarned : '86');
            credEl.textContent = cred;
        }

        // Calculate dynamic assignment progress stats
        const totalAssign = allAssignments.length;
        const submittedAssign = allAssignments.filter(a => a.submitted).length;
        const pendingAssign = totalAssign - submittedAssign;
        const percent = totalAssign > 0 ? Math.round((submittedAssign / totalAssign) * 100) : 0;
        
        // Update Academic Progress widgets
        const pieChart = document.getElementById('progress-pie-chart');
        const percentEl = document.getElementById('progress-percentage');
        const submittedEl = document.getElementById('progress-submitted-count');
        const pendingEl = document.getElementById('progress-pending-count');
        
        if (percentEl) percentEl.textContent = `${percent}%`;
        if (submittedEl) submittedEl.textContent = submittedAssign;
        if (pendingEl) pendingEl.textContent = pendingAssign;
        if (pieChart) {
            pieChart.style.background = `conic-gradient(var(--primary) 0% ${percent}%, var(--border-color) ${percent}% 100%)`;
        }

        // Update Assignment module badge count
        const assignBadge = document.getElementById('assign-badge-count');
        if (assignBadge) {
            assignBadge.textContent = pendingAssign;
            assignBadge.style.display = pendingAssign > 0 ? 'flex' : 'none';
        }

        renderAssignments('pending');

    } catch (error) {
        console.error('Error fetching stats:', error);
    }
}

function renderAssignments(filterType) {
    const listEl = document.getElementById('assignments-list');
    if (!listEl) return;

    let filtered = [];
    if (filterType === 'pending') {
        filtered = allAssignments.filter(a => !a.submitted);
    } else {
        filtered = allAssignments.filter(a => a.submitted);
    }

    // Update pending count in tab and dot
    const pendingCount = allAssignments.filter(a => !a.submitted).length;
    const pendingTab = document.querySelector('#assignment-filter-tabs .assignment-tab[data-filter="pending"]');
    if (pendingTab) pendingTab.textContent = `Pending (${pendingCount})`;

    const dot = document.getElementById('assignment-dot');
    if (dot) dot.style.display = pendingCount > 0 ? 'inline-block' : 'none';

    if (filtered.length === 0) {
        listEl.innerHTML = `<div style="text-align:center; padding: 20px; color:var(--text-muted);">No ${filterType} assignments!</div>`;
        return;
    }

    let html = '';
    filtered.slice(0, 3).forEach((a, i) => {
        const bgColors = ['#e0f2fe', '#fce7f3', '#fef3c7'];
        const textColors = ['#0ea5e9', '#ec4899', '#f59e0b'];
        const icons = ['fa-file-lines', 'fa-flask', 'fa-calculator'];
        
        const bg = bgColors[i % bgColors.length];
        const tc = textColors[i % textColors.length];
        const icon = icons[i % icons.length];
        const due = a.dueDate ? new Date(a.dueDate).toLocaleDateString() : 'N/A';

        // HTML representing item. Dynamic click previews enabled via .assignment-item-clickable
        html += `
        <div class="notice-item assignment-item-clickable fade-in stagger-${(i % 4) + 1}" data-id="${a._id}" style="cursor: pointer;">
            <div style="background:${bg}; color:${tc}; width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; flex-shrink: 0;"><i class="fa-solid ${icon}"></i></div>
            <div class="notice-info" style="min-width: 0; flex:1;">
                <h4 style="font-size: 0.9rem; margin-bottom: 4px; color: var(--text-dark);">${a.title}</h4>
                <p style="font-size: 0.8rem; color: var(--text-muted); margin: 0;">${a.subject || 'Subject'}</p>
            </div>
            <div class="notice-date" style="font-size: 0.75rem; font-weight: 600; color: ${filterType === 'pending' ? 'var(--danger)' : 'var(--success)'};">
                ${filterType === 'pending' ? 'Due: ' + due : 'Submitted'}
            </div>
        </div>`;
    });
    listEl.innerHTML = html;

    // Attach Click handlers for Preview
    document.querySelectorAll('.assignment-item-clickable').forEach(item => {
        item.addEventListener('click', () => {
            const id = item.dataset.id;
            const assignment = allAssignments.find(a => a._id === id);
            if (assignment) {
                document.getElementById('modal-assign-title').textContent = assignment.title;
                document.getElementById('modal-assign-subject').textContent = assignment.subject || 'Subject';
                document.getElementById('modal-assign-due').textContent = 'Due: ' + (assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'N/A');
                document.getElementById('modal-assign-desc').textContent = assignment.description || 'No description provided.';
                document.getElementById('modal-assign-teacher').textContent = 'Posted by: ' + (assignment.teacher ? assignment.teacher.name : 'Faculty');
                if (typeof toggleModal === 'function') toggleModal('assignment-detail-modal');
            }
        });
    });
}

// Notice fetch
async function fetchNotices() {
    try {
        const res = await fetch(`${API_URL}/notices?role=${user.role}&userId=${user._id}&department=${user.department || ''}`);
        if (!res.ok) throw new Error('Failed to fetch notices');
        allNotices = await res.json();
        
        const personalNotices = allNotices.filter(n => n.audience !== 'general');
        const count = personalNotices.length;
        
        const noticeCountEl = document.getElementById('notice-count');
        if (noticeCountEl) {
            noticeCountEl.textContent = count;
            noticeCountEl.style.display = count > 0 ? 'block' : 'none';
        }

        renderNotices('personal');
    } catch (error) {
        console.error('Error fetching notices:', error);
    }
}

function renderNotices(filterType) {
    const listEl = document.getElementById('personal-notices-list');
    if (!listEl) return;

    let filtered = [];
    if (filterType === 'personal') {
        filtered = allNotices.filter(n => n.audience !== 'general');
    } else {
        filtered = allNotices.filter(n => n.audience === 'general');
    }

    if (filtered.length === 0) {
        listEl.innerHTML = `<div style="text-align:center; padding: 20px; color:var(--text-muted);">No ${filterType} notices.</div>`;
        return;
    }

    let html = '';
    filtered.slice(0, 3).forEach((n, i) => {
        const bgColors = ['#e0e7ff', '#fef3c7', '#d1fae5'];
        const textColors = ['#4f46e5', '#f59e0b', '#10b981'];
        const icons = ['fa-user-tie', 'fa-file-invoice', 'fa-envelope'];
        
        const bg = bgColors[i % bgColors.length];
        const tc = textColors[i % textColors.length];
        const icon = icons[i % icons.length];
        const d = new Date(n.date || n.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

        // HTML notice item. Dynamic click previews enabled via .notice-item-clickable
        html += `
        <div class="notice-item notice-item-clickable fade-in stagger-${(i % 4) + 1}" data-id="${n._id}" style="cursor: pointer;">
            <div style="background:${bg}; color:${tc}; width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; flex-shrink: 0;"><i class="fa-solid ${icon}"></i></div>
            <div class="notice-info" style="min-width: 0; flex:1;">
                <h4 style="font-size: 0.9rem; margin-bottom: 4px; color: var(--text-dark);">${n.title}</h4>
                <p style="font-size: 0.8rem; color: var(--text-muted); margin: 0; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">${n.content}</p>
            </div>
            <div class="notice-date" style="font-size: 0.75rem; font-weight: 600;">${d}</div>
        </div>`;
    });
    listEl.innerHTML = html;

    // Attach click listeners for preview
    document.querySelectorAll('.notice-item-clickable').forEach(item => {
        item.addEventListener('click', () => {
            const id = item.dataset.id;
            const notice = allNotices.find(n => n._id === id);
            if (notice) {
                document.getElementById('modal-notice-title').textContent = notice.title;
                const date = new Date(notice.date || notice.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
                document.getElementById('modal-notice-meta').textContent = `${date} | ${notice.audience.toUpperCase()}`;
                document.getElementById('modal-notice-content').textContent = notice.content;
                if (typeof toggleModal === 'function') toggleModal('notice-detail-modal');
            }
        });
    });
}

// Logout Helper
function logout() {
    localStorage.removeItem('user');
    window.location.href = '../index.html';
}
