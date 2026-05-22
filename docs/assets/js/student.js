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

// Global state for filtering
let allAssignments = [];
let allNotices = [];

// Update UI
document.addEventListener('DOMContentLoaded', () => {
    // Update Header/Hero
    const greeting = document.getElementById('student-greeting');
    if (greeting) {
        const firstName = user.name ? user.name.split(' ')[0] : 'Student';
        greeting.innerHTML = `Good morning, ${firstName}! ☀️`;
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

    // Update Stats
    fetchStats();
    fetchNotices();
    fetchRoutine();
});

const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:5000' : 'https://campuscare-backend-96cn.onrender.com') + '/api';

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
            cgpaEl.innerHTML = `${cgpa} <span style="font-size:0.8rem; color:var(--text-muted);">/4.00</span>`;
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

        // Using Notice-item style layout
        html += `
        <div class="notice-item fade-in stagger-${(i % 4) + 1}">
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
            noticeCountEl.textContent = count < 10 ? `0${count}` : count;
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

        // Using Notice-item style layout
        html += `
        <div class="notice-item fade-in stagger-${(i % 4) + 1}">
            <div style="background:${bg}; color:${tc}; width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; flex-shrink: 0;"><i class="fa-solid ${icon}"></i></div>
            <div class="notice-info" style="min-width: 0; flex:1;">
                <h4 style="font-size: 0.9rem; margin-bottom: 4px; color: var(--text-dark);">${n.title}</h4>
                <p style="font-size: 0.8rem; color: var(--text-muted); margin: 0; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">${n.content}</p>
            </div>
            <div class="notice-date" style="font-size: 0.75rem; font-weight: 600;">${d}</div>
        </div>`;
    });
    listEl.innerHTML = html;
}

// Logout Helper
function logout() {
    localStorage.removeItem('user');
    window.location.href = '../index.html';
}
