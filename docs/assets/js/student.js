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
let allLeaves = [];
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

    // Hosteler-specific dashboard row
    if (user.role === 'hosteler') {
        // Show hosteler-only module buttons inside My Modules & Actions
        const hostelerModules = document.querySelectorAll('.hosteler-only-module');
        hostelerModules.forEach(mod => {
            mod.style.display = 'flex';
        });

        const specialRow = document.getElementById('hosteler-special-row');
        if (specialRow) {
            specialRow.style.display = 'grid';
        }
        fetchStudentMessMenu();
        fetchLeaves();
        fetchEmergencyContacts();

        // Bind widget leave form
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const todayStr = `${yyyy}-${mm}-${dd}`;
        
        const startInput = document.getElementById('widgetLeaveStart');
        const endInput = document.getElementById('widgetLeaveEnd');
        if (startInput) {
            startInput.min = todayStr;
            startInput.addEventListener('change', () => {
                if (endInput) {
                    endInput.min = startInput.value;
                    if (endInput.value && endInput.value < startInput.value) {
                        endInput.value = startInput.value;
                    }
                }
            });
        }
        if (endInput) endInput.min = todayStr;

        const widgetLeaveForm = document.getElementById('widgetLeaveForm');
        if (widgetLeaveForm) {
            widgetLeaveForm.addEventListener('submit', submitWidgetLeave);
        }
    } else {
        // Student role
        const gatePassCard = document.getElementById('gate-pass-card');
        if (gatePassCard) {
            gatePassCard.style.display = 'none';
            const row3 = gatePassCard.parentElement;
            if (row3) {
                row3.style.gridTemplateColumns = '1fr 1fr';
            }
        }
        // Hide hostel notice filter tab
        const hostelNoticeTab = document.querySelector('#notice-filter-tabs [data-filter="hosteler"]');
        if (hostelNoticeTab) {
            hostelNoticeTab.style.display = 'none';
        }
    }

    // CSP event handler bindings
    document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        logout();
    });
    document.getElementById('firstAidBtn')?.addEventListener('click', () => {
        alert('Requesting First Aid Kit... Warden Notified!');
    });
    document.getElementById('needBloodBtn')?.addEventListener('click', () => {
        const bg = prompt('Please enter the required Blood Group (e.g. O+):');
        if (bg) alert(`Broadcasting Blood Requirement (${bg}) Alert to Campus!`);
    });
    document.getElementById('panicBtn')?.addEventListener('click', () => {
        alert('Panic Signal Sent with Location!');
    });
    document.getElementById('askAiBtn')?.addEventListener('click', () => {
        if (typeof askAI === 'function') askAI();
    });
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

        const qParams = new URLSearchParams({
            department: user.department || '',
            year: user.year || '',
            batch: user.batch || '',
            semester: user.semester || ''
        });
        const res = await fetch(`${API_URL}/routine/student?${qParams.toString()}`, {
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
                const subLink = document.getElementById('modal-assign-submissions-link');
                if (subLink) {
                    subLink.href = `../modules/assignments/view.html?assignmentId=${assignment._id}`;
                }
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
        const notices = await res.json();
        
        // Inject event dates into calendar before cleaning content
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

        notices.forEach(n => {
            if (n.content) n.content = n.content.replace(/\[EVENT_META:.*?\]/g, '').trim();
            if (n.title) n.title = n.title.replace(/\[EVENT_META:.*?\]/g, '').trim();
        });

        let filteredNotices = notices;
        if (user.role !== 'hosteler') {
            filteredNotices = notices.filter(n => n.audience !== 'hosteler');
        }
        
        const mockNotices = [
            { title: '🧹 Hostel Cleaning Drive Notice', content: 'All hostel residents are hereby informed that a hostel cleaning...', createdAt: '2025-12-18T10:00:00.000Z', audience: 'hosteler' },
            { title: '🎄 Christmas Tree Decora...', content: 'All interested hostelers are invited to participate in the Christmas...', createdAt: '2025-12-15T09:00:00.000Z', audience: 'hosteler' },
            { title: 'Submit Project Report', content: 'Everyone must bring their project report for final submission', createdAt: '2025-12-22T10:00:00.000Z', audience: 'personal' },
            { title: 'Teachers metting', content: 'This is to inform all teaching staff that a departmental meeting will...', createdAt: '2025-12-18T11:00:00.000Z', audience: 'personal' },
            { title: 'CA-2 Submission', content: 'All students of the IT Department are hereby informed that Project...', createdAt: '2025-12-18T08:00:00.000Z', audience: 'personal' },
            { title: 'Teachers Meeting Regardi...', content: 'All teaching faculty members are informed that a meeting will be...', createdAt: '2025-12-15T11:00:00.000Z', audience: 'personal' }
        ];
        allNotices = [...filteredNotices, ...mockNotices];
        
        const personalNotices = allNotices.filter(n => n.audience !== 'general');
        const count = personalNotices.length;
        
        const noticeCountEl = document.getElementById('notice-count');
        if (noticeCountEl) {
            noticeCountEl.textContent = count;
            noticeCountEl.style.display = count > 0 ? 'flex' : 'none';
        }

        renderNotices('general');
    } catch (error) {
        console.error('Error fetching notices:', error);
    }
}

function renderNotices(filterType) {
    const listEl = document.getElementById('personal-notices-list');
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
        <div class="notice-item notice-item-clickable fade-in stagger-${(i % 4) + 1}" data-id="${n._id || i}" style="cursor: pointer; transition: all 0.2s;" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='var(--shadow-sm)'" onmouseout="this.style.transform='none';this.style.boxShadow='none'">
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
    document.querySelectorAll('#personal-notices-list .notice-item-clickable').forEach(item => {
        item.addEventListener('click', () => {
            const id = item.dataset.id;
            const notice = filtered.find((n, index) => (n._id === id || index.toString() === id));
            if (notice && typeof window.showDetailPopup === 'function') {
                const date = new Date(notice.date || notice.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
                window.showDetailPopup(notice.title || 'Notice', '', notice.content || '', date, notice.audience || 'General');
            }
        });
    });
}

// Logout Helper
function logout() {
    localStorage.removeItem('user');
    window.location.href = '../index.html';
}
window.logout = logout;

// Gate Pass / Leaves Widget Functions
async function fetchLeaves() {
    try {
        const res = await fetch(`${API_URL}/hostel/my-leaves`, {
            headers: { 'Authorization': `Bearer ${user.token}` }
        });
        if (res.ok) {
            allLeaves = await res.json();
            renderLeavesWidget();
        }
    } catch (error) {
        console.error('Error fetching leaves:', error);
    }
}

function renderLeavesWidget() {
    const statusContainer = document.getElementById('leave-status-container');
    if (!statusContainer) return;

    if (!allLeaves || allLeaves.length === 0) {
        statusContainer.innerHTML = `
            <div style="text-align:center; padding: 24px; color:var(--text-muted); display:flex; flex-direction:column; align-items:center; gap:12px;">
                <div style="width:48px; height:48px; border-radius:50%; background:rgba(79, 70, 229, 0.1); color:var(--primary); display:flex; align-items:center; justify-content:center; font-size:1.5rem;">
                    <i class="fa-solid fa-stamp"></i>
                </div>
                <div>
                    <h4 style="margin:0 0 4px 0; font-size:0.95rem; color:var(--text-dark);">No Leave Requests</h4>
                    <p style="margin:0; font-size:0.8rem; color:var(--text-muted);">You have not applied for any leaves yet.</p>
                </div>
            </div>`;
        return;
    }

    let html = '<div style="display:flex; flex-direction:column; gap:12px; height: 100%; justify-content: flex-start; width: 100%;">';
    // Show only the 4 most recent requests
    allLeaves.slice(0, 4).forEach((l, i) => {
        let icon = 'fa-stamp';
        let bg = 'rgba(79, 70, 229, 0.1)';
        let tc = 'var(--primary)';
        if (l.type === 'Night Out') {
            icon = 'fa-moon';
            bg = 'rgba(79, 70, 229, 0.1)';
            tc = 'var(--primary)';
        } else if (l.type === 'Home Visit') {
            icon = 'fa-house-chimney';
            bg = 'rgba(16, 185, 129, 0.1)';
            tc = 'var(--success)';
        } else if (l.type === 'Medical') {
            icon = 'fa-kit-medical';
            bg = 'rgba(239, 68, 68, 0.1)';
            tc = 'var(--danger)';
        }

        const statusText = l.status || 'Pending';
        let statusStyle = '';
        if (statusText.includes('Approved')) {
            statusStyle = 'background: #e6fbf1; color: #03a85a; border: 1px solid #a3e9c5;';
        } else if (statusText.includes('Rejected')) {
            statusStyle = 'background: #fdf2f2; color: #e02424; border: 1px solid #f8b4b4;';
        } else {
            statusStyle = 'background: #fffbeb; color: #d97706; border: 1px solid #fcd34d;';
        }

        const startDate = l.startDate ? new Date(l.startDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : '--';
        
        html += `
        <div style="display:flex; gap:16px; padding: 14px; border-radius: var(--radius-md); background: white; border: 1px solid var(--border-color); transition: all 0.2s; align-items: center; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.02);" class="leave-status-item-clickable" data-id="${l._id}">
            <div style="background:${bg}; color:${tc}; width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; flex-shrink: 0;">
                <i class="fa-solid ${icon}"></i>
            </div>
            <div style="min-width: 0; flex:1;">
                <h4 style="font-size: 0.95rem; margin:0 0 2px 0; color: var(--text-dark); font-weight:700;">${l.type}</h4>
                <p style="font-size: 0.8rem; color: var(--text-muted); margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${l.reason || 'No reason provided'}</p>
                <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 4px; font-weight: 500;"><i class="fa-regular fa-calendar" style="margin-right: 4px;"></i>${startDate}</div>
            </div>
            <div style="text-align: right; flex-shrink: 0;">
                <span style="${statusStyle} padding: 4px 10px; border-radius: var(--radius-full); font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; display: inline-block;">${statusText}</span>
            </div>
        </div>`;
    });
    html += '</div>';
    statusContainer.innerHTML = html;

    // Attach click listeners for preview
    statusContainer.querySelectorAll('.leave-status-item-clickable').forEach(item => {
        item.addEventListener('click', () => {
            const id = item.dataset.id;
            const leave = allLeaves.find(l => l._id === id);
            if (leave) {
                showStudentLeaveDetailsModal(leave);
            }
        });
    });
}

async function submitWidgetLeave(e) {
    e.preventDefault();
    const type = document.getElementById('widgetLeaveType').value;
    const startDate = document.getElementById('widgetLeaveStart').value;
    const endDate = document.getElementById('widgetLeaveEnd').value;
    const reason = document.getElementById('widgetLeaveReason').value;

    try {
        const res = await fetch(`${API_URL}/hostel/leave`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`
            },
            body: JSON.stringify({ type, startDate, endDate, reason })
        });

        if (res.ok) {
            alert('Leave Application Submitted Successfully!');
            document.getElementById('widgetLeaveForm').reset();
            // Refresh leave status list
            fetchLeaves();
        } else {
            const data = await res.json();
            alert(data.message || 'Failed to submit application.');
        }
    } catch (error) {
        console.error(error);
        alert('Error submitting leave.');
    }
}

function showStudentLeaveDetailsModal(leave) {
    const studentName = user.name || 'Student';
    const rollNo = user.rollNumber || 'N/A';
    const roomNo = user.roomNumber || 'N/A';
    const hostelName = user.hostelName || 'N/A';
    const dept = user.department || 'N/A';
    
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(studentName)}&background=random`;
    
    const fromDate = leave.startDate ? new Date(leave.startDate).toLocaleDateString() : '--';
    const toDate = leave.endDate ? new Date(leave.endDate).toLocaleDateString() : '--';
    
    const type = leave.type || 'Leave';
    const reason = leave.reason || '--';
    
    const hodStatus = leave.hodStatus || 'Pending';
    const wardenStatus = leave.wardenStatus || 'Pending';

    let hodBadgeHtml = '';
    if (hodStatus === 'Approved') {
      hodBadgeHtml = `<span style="background: #d1fae5; color: #065f46; padding: 4px 10px; border-radius: var(--radius-sm); font-size: 0.75rem; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;"><i class="fa-solid fa-circle-check"></i> Approved</span>`;
    } else if (hodStatus === 'Rejected') {
      hodBadgeHtml = `<span style="background: #fee2e2; color: #991b1b; padding: 4px 10px; border-radius: var(--radius-sm); font-size: 0.75rem; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;"><i class="fa-solid fa-circle-xmark"></i> Rejected</span>`;
    } else {
      hodBadgeHtml = `<span style="background: #fef3c7; color: #92400e; padding: 4px 10px; border-radius: var(--radius-sm); font-size: 0.75rem; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;"><i class="fa-solid fa-clock"></i> Pending</span>`;
    }
    if (leave.hodRemark) {
      hodBadgeHtml += `<div style="font-size: 0.85rem; color: #b91c1c; margin-top: 8px; font-style: normal; font-weight: 600; background: #fee2e2; padding: 8px 12px; border-radius: 8px; border-left: 4px solid #ef4444; width: 100%; box-sizing: border-box; display: block; margin-bottom: 4px;">Reason: "${leave.hodRemark}"</div>`;
    }

    let wardenBadgeHtml = '';
    if (wardenStatus === 'Approved') {
      wardenBadgeHtml = `<span style="background: #d1fae5; color: #065f46; padding: 4px 10px; border-radius: var(--radius-sm); font-size: 0.75rem; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;"><i class="fa-solid fa-circle-check"></i> Approved</span>`;
    } else if (wardenStatus === 'Rejected') {
      wardenBadgeHtml = `<span style="background: #fee2e2; color: #991b1b; padding: 4px 10px; border-radius: var(--radius-sm); font-size: 0.75rem; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;"><i class="fa-solid fa-circle-xmark"></i> Rejected</span>`;
    } else {
      wardenBadgeHtml = `<span style="background: #fef3c7; color: #92400e; padding: 4px 10px; border-radius: var(--radius-sm); font-size: 0.75rem; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;"><i class="fa-solid fa-clock"></i> Pending</span>`;
    }
    if (leave.wardenRemark) {
      wardenBadgeHtml += `<div style="font-size: 0.85rem; color: #b91c1c; margin-top: 8px; font-style: normal; font-weight: 600; background: #fee2e2; padding: 8px 12px; border-radius: 8px; border-left: 4px solid #ef4444; width: 100%; box-sizing: border-box; display: block; margin-bottom: 4px;">Reason: "${leave.wardenRemark}"</div>`;
    }

    let typeBadgeColor = 'background: #e0f2fe; color: #0369a1;';
    if (type === 'Home Visit') {
      typeBadgeColor = 'background: #ede9fe; color: #7c3aed;';
    } else if (type === 'Medical') {
      typeBadgeColor = 'background: #fee2e2; color: #b91c1c;';
    }

    const modalId = `leaveModal-${leave._id}`;
    let modal = document.getElementById(modalId);
    if (!modal) {
      modal = document.createElement('div');
      modal.id = modalId;
      modal.style.position = 'fixed';
      modal.style.top = '0';
      modal.style.left = '0';
      modal.style.width = '100vw';
      modal.style.height = '100vh';
      modal.style.backgroundColor = 'rgba(15, 23, 42, 0.6)';
      modal.style.backdropFilter = 'blur(4px)';
      modal.style.display = 'flex';
      modal.style.alignItems = 'center';
      modal.style.justifyContent = 'center';
      modal.style.zIndex = '9990';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <style>
        @keyframes modalFadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      </style>
      <div style="background: white; border-radius: 20px; width: 90%; max-width: 580px; max-height: 90vh; overflow-y: auto; padding: 28px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); position: relative; animation: modalFadeIn 0.3s ease-out; font-family: 'Inter', sans-serif;">
        <!-- Close Button -->
        <button type="button" class="closeModalBtn" style="position: absolute; top: 20px; right: 20px; background: #f1f5f9; border: none; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #64748b; transition: all 0.2s;">
          <i class="fa-solid fa-xmark"></i>
        </button>

        <h3 style="margin: 0 0 20px 0; font-size: 1.4rem; font-weight: 800; color: #0f172a; font-family: 'Poppins', sans-serif;">Leave Request Details</h3>

        <!-- Student Profile Banner -->
        <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 20px; background: #f8fafc; padding: 16px; border-radius: 12px; border: 1px solid #e2e8f0;">
          <img src="${avatarUrl}" style="width: 50px; height: 50px; border-radius: 50%; border: 2px solid #cbd5e1; object-fit: cover;">
          <div>
            <h4 style="margin: 0; font-size: 1.1rem; font-weight: 800; color: var(--text-dark);">${studentName}</h4>
            <p style="margin: 2px 0 0 0; font-size: 0.85rem; color: var(--text-muted); font-weight: 500;">
              Roll: ${rollNo} | Dept: ${dept}
            </p>
          </div>
        </div>

        <!-- Details Grid -->
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 20px; font-size: 0.9rem; color: #475569;">
          <div><strong>Leave Type:</strong> <span style="${typeBadgeColor} padding: 2px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase;">${type}</span></div>
          <div><strong>Duration:</strong> <span style="font-weight: 650; color: var(--text-dark);">${fromDate} to ${toDate}</span></div>
          <div><strong>Hostel Name:</strong> ${hostelName}</div>
          <div><strong>Room Number:</strong> ${roomNo}</div>
        </div>

        <!-- Reason -->
        <div style="margin-bottom: 20px;">
          <strong style="font-size: 0.9rem; color: var(--text-dark); display: block; margin-bottom: 6px;">Reason for Leave:</strong>
          <div style="font-size: 0.92rem; color: #334155; line-height: 1.5; background: #f8fafc; border: 1px solid #e2e8f0; padding: 14px; border-radius: 12px; white-space: pre-wrap; word-break: break-word;">${reason}</div>
        </div>

        <!-- Status Badges -->
        <div style="display: flex; gap: 20px; flex-wrap: wrap; border-top: 1px solid #f1f5f9; padding-top: 16px;">
          <div><strong style="font-size: 0.8rem; color: #64748b; font-weight: 700; text-transform: uppercase; display: block; margin-bottom: 6px;">HOD Status:</strong> ${hodBadgeHtml}</div>
          <div><strong style="font-size: 0.8rem; color: #64748b; font-weight: 700; text-transform: uppercase; display: block; margin-bottom: 6px;">Warden Status:</strong> ${wardenBadgeHtml}</div>
        </div>
      </div>
    `;

    const closeModal = () => { modal.remove(); };
    modal.querySelector('.closeModalBtn').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
}

// Fetch Mess Menu for Hosteler
async function fetchStudentMessMenu() {
    const container = document.getElementById('today-mess-menu-container');
    if (!container) return;

    try {
        const res = await fetch(`${API_URL}/hostel/mess`, {
            headers: { 'Authorization': `Bearer ${user.token}` }
        });
        if (res.ok) {
            const menu = await res.json();
            const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
            const today = daysOfWeek[new Date().getDay()];
            const todayData = menu.find(m => m.day === today);

            if (!todayData || (!todayData.breakfast && !todayData.lunch && !todayData.snacks && !todayData.dinner)) {
                container.innerHTML = `
                    <div style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 16px 0;">
                        No menu set for today (${today}).
                    </div>`;
                return;
            }

            const meals = [
                { name: 'Breakfast', icon: 'fa-mug-hot', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', value: todayData.breakfast },
                { name: 'Lunch', icon: 'fa-bowl-food', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', value: todayData.lunch },
                { name: 'Snacks', icon: 'fa-cookie-bite', color: '#ec4899', bg: 'rgba(236, 72, 153, 0.1)', value: todayData.snacks },
                { name: 'Dinner', icon: 'fa-plate-wheat', color: '#6366f1', bg: 'rgba(99, 102, 241, 0.1)', value: todayData.dinner }
            ];

            let html = '';
            meals.forEach(m => {
                const valText = m.value ? m.value : 'Not set';
                html += `
                    <div class="complaint-item" style="display: flex; gap: 12px; align-items: center; padding: 10px; border: 1px solid var(--border-color); border-radius: var(--radius-md); background: var(--bg-color); transition: all 0.2s;">
                        <div style="background: ${m.bg}; color: ${m.color}; width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 0.9rem; flex-shrink: 0;">
                            <i class="fa-solid ${m.icon}"></i>
                        </div>
                        <div style="flex: 1; min-width: 0;">
                            <h4 style="font-size: 0.75rem; margin: 0 0 2px 0; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;">${m.name}</h4>
                            <p style="font-size: 0.85rem; font-weight: 600; color: var(--text-dark); margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${valText}">${valText}</p>
                        </div>
                    </div>`;
            });
            container.innerHTML = html;
        } else {
            throw new Error('Response not ok');
        }
    } catch (e) {
        console.error('Error fetching mess menu:', e);
        container.innerHTML = `
            <div style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 12px 0;">
                Failed to load today's mess menu.
            </div>`;
    }
}

async function fetchEmergencyContacts() {
    const container = document.getElementById('emergency-contacts-container');
    if (!container) return;
    try {
        const res = await fetch(`${API_URL.replace('/warden', '')}/hostel/contacts`);
        if (res.ok) {
            const contacts = await res.json();
            let html = '';
            contacts.forEach((c, idx) => {
                const bgClass = c.color === 'danger' ? 'rgba(239, 68, 68, 0.1)' : 
                                c.color === 'warning' ? 'rgba(245, 158, 11, 0.1)' : 
                                c.color === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(79, 70, 229, 0.1)';
                const textC = c.color === 'danger' ? 'var(--danger)' : 
                              c.color === 'warning' ? 'var(--warning)' : 
                              c.color === 'success' ? 'var(--success)' : 'var(--primary)';
                const cleanPhone = c.phone.replace(/[^\d+]/g, '');
                html += `
                <div class="complaint-item" style="display: flex; gap: 12px; align-items: center; padding: 10px; border: 1px solid var(--border-color); border-radius: var(--radius-md); background: var(--bg-color);">
                  <div style="background: ${bgClass}; color: ${textC}; width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 0.9rem; flex-shrink: 0;">
                    <i class="fa-solid ${c.icon || 'fa-phone'}"></i>
                  </div>
                  <div style="flex: 1; min-width: 0;">
                    <h4 style="font-size: 0.85rem; margin: 0 0 2px 0; color: var(--text-dark); font-weight: 600;">${c.name}</h4>
                    <p style="font-size: 0.75rem; color: var(--text-muted); margin: 0;">${c.phone}</p>
                  </div>
                  <a href="#" class="emergency-wa-link" data-name="${c.name}" data-phone="${cleanPhone}" style="color: #25D366; font-size: 1.25rem; display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; transition: transform 0.2s; text-decoration: none !important;" onmouseenter="this.style.transform='scale(1.2)';" onmouseleave="this.style.transform='scale(1)';">
                    <i class="fa-brands fa-whatsapp"></i>
                  </a>
                </div>`;
            });
            container.innerHTML = html;

            // Bind click events to open AI Draft modal
            container.querySelectorAll('.emergency-wa-link').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    openEmergencyWaDraftModal(link.dataset.name, link.dataset.phone);
                });
            });
        }
    } catch (error) {
        console.error('Error fetching emergency contacts:', error);
    }
}

function openEmergencyWaDraftModal(name, phone) {
    let modal = document.getElementById('studentWaDraftModal');
    if (!modal) {
        const modalHtml = `
        <div id="studentWaDraftModal" style="display: none; position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); z-index: 9999; align-items: center; justify-content: center; padding: 16px;">
          <div style="background: white; border-radius: 16px; max-width: 500px; width: 100%; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); display: flex; flex-direction: column; overflow: hidden; border: 1px solid #e2e8f0; animation: modalFadeIn 0.3s ease-out;">
            <div style="background: linear-gradient(135deg, #128C7E, #075E54); padding: 20px; color: white; display: flex; align-items: center; justify-content: space-between;">
              <div style="display: flex; align-items: center; gap: 10px;">
                <i class="fa-brands fa-whatsapp" style="font-size: 1.5rem;"></i>
                <h3 style="margin: 0; font-size: 1.2rem; font-weight: 700; font-family: 'Poppins', sans-serif;" id="studentWaDraftModalTitle">Draft WhatsApp Message</h3>
              </div>
              <button type="button" id="studentWaDraftCloseBtn" style="background: transparent; border: none; color: white; font-size: 1.25rem; cursor: pointer; opacity: 0.8; line-height: 1;">&times;</button>
            </div>
            
            <div style="padding: 24px; display: flex; flex-direction: column; gap: 16px;">
              <div>
                <label style="display: block; font-weight: 700; font-size: 0.85rem; color: #475569; margin-bottom: 6px;">Message Draft:</label>
                <textarea id="studentWaDraftTextarea" rows="6" style="width: 100%; padding: 12px; border-radius: 10px; border: 1px solid #cbd5e1; outline: none; font-size: 0.9rem; font-family: inherit; resize: vertical;" placeholder="Type or generate your message here..."></textarea>
              </div>

              <div style="border-top: 1px solid #e2e8f0; padding-top: 16px;">
                <label style="display: block; font-weight: 700; font-size: 0.85rem; color: #475569; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
                  <i class="fa-solid fa-robot" style="color: #075E54;"></i> Draft Assistant
                </label>
                <div style="display: flex; gap: 8px;">
                  <input type="text" id="studentWaAiPrompt" placeholder="Describe the message to prepare..." style="flex: 1; padding: 8px 12px; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 0.85rem; outline: none;">
                  <button type="button" id="studentWaAiDraftBtn" style="background: #075E54; color: white; border: none; padding: 8px 16px; border-radius: 8px; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.2s; display: flex; align-items: center;">
                    <span id="studentWaAiBtnText">Generate</span>
                    <i class="fa-solid fa-spinner fa-spin" id="studentWaAiSpinner" style="display: none; margin-left: 6px;"></i>
                  </button>
                </div>
              </div>

              <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 8px;">
                <button type="button" id="studentWaCancelBtn" style="background: #f1f5f9; border: 1px solid #cbd5e1; padding: 10px 18px; border-radius: 8px; font-size: 0.9rem; font-weight: 600; color: #475569; cursor: pointer; transition: all 0.2s;">Cancel</button>
                <button type="button" id="studentWaSendBtn" style="background: #25D366; border: none; padding: 10px 18px; border-radius: 8px; font-size: 0.9rem; font-weight: 700; color: white; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all 0.2s; box-shadow: 0 4px 6px -1px rgba(37, 211, 102, 0.2);">
                  Send <i class="fa-solid fa-paper-plane"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
        <style>
          @keyframes modalFadeIn {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
          }
        </style>
        `;
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = modalHtml;
        document.body.appendChild(tempDiv.firstElementChild);
        if (tempDiv.querySelector('style')) {
            document.head.appendChild(tempDiv.querySelector('style'));
        }

        modal = document.getElementById('studentWaDraftModal');
    }

    const closeBtn = document.getElementById('studentWaDraftCloseBtn');
    const cancelBtn = document.getElementById('studentWaCancelBtn');
    const sendBtn = document.getElementById('studentWaSendBtn');
    const aiDraftBtn = document.getElementById('studentWaAiDraftBtn');
    const aiPromptInput = document.getElementById('studentWaAiPrompt');
    const textarea = document.getElementById('studentWaDraftTextarea');

    document.getElementById('studentWaDraftModalTitle').textContent = `Draft Message to ${name}`;
    let defaultMsg = `Hello ${name},\n\nI wanted to reach out to you regarding...`;
    textarea.value = defaultMsg;
    modal.style.display = 'flex';
    aiPromptInput.value = '';
    aiPromptInput.focus();

    const closeWaModal = () => {
        modal.style.display = 'none';
    };

    closeBtn.onclick = closeWaModal;
    cancelBtn.onclick = closeWaModal;
    
    // Send handler
    sendBtn.onclick = () => {
        const text = textarea.value.trim();
        const cleanPhone = phone.replace(/[^\d]/g, '');
        window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
        closeWaModal();
    };

    // AI Generate handler
    aiDraftBtn.onclick = async () => {
        const promptText = aiPromptInput.value.trim();
        if (!promptText) return alert('Please enter a prompt for the AI Assistant.');

        const btnText = document.getElementById('studentWaAiBtnText');
        const spinner = document.getElementById('studentWaAiSpinner');
        
        btnText.style.display = 'none';
        spinner.style.display = 'inline-block';
        aiDraftBtn.disabled = true;

        try {
            const contextPrompt = `Draft a brief, professional message from a student to ${name} with the following context: "${promptText}". Use clear, direct sentences, keeping in mind the message will be sent via WhatsApp.`;
            
            const res = await fetch(`${API_URL}/ai/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token || ''}`
                },
                body: JSON.stringify({
                    text: contextPrompt,
                    clientContext: {
                        targetName: name,
                        userRole: user.role
                    }
                })
            });

            if (!res.ok) throw new Error();
            const data = await res.json();
            let reply = '';
            if (data && data.response) {
                if (typeof data.response === 'string') {
                    reply = data.response;
                } else if (typeof data.response === 'object' && data.response.message) {
                    reply = data.response.message;
                } else {
                    reply = JSON.stringify(data.response);
                }
            }
            reply = reply.replace(/\*\*/g, '*'); // Convert markdown bold to WhatsApp bold
            textarea.value = reply;
        } catch (error) {
            console.error(error);
            alert('Failed to generate draft with AI.');
        } finally {
            btnText.style.display = 'inline-block';
            spinner.style.display = 'none';
            aiDraftBtn.disabled = false;
        }
    };
}
