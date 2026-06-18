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

document.addEventListener('DOMContentLoaded', () => {
    // Hero Greeting
    const greeting = document.getElementById('teacher-greeting');
    if (greeting) {
        const firstName = user.name ? user.name.split(' ')[0] : 'Faculty';
        const prefix = user.role === 'hod' ? 'Prof.' : (user.gender === 'female' ? 'Ms.' : 'Mr.'); // Simplistic prefix
        // Alternatively, just use the name:
        greeting.innerHTML = `Good morning, ${firstName}! 👋`;
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

    // Fetch dynamic content
    fetchTeacherRoutine();
    fetchOfficialNotices();
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

async function fetchTeacherRoutine() {
    const listEl = document.getElementById('todays-schedule-list');
    if (!listEl) return;

    try {
        const res = await fetch(`${API_URL}/routine/teacher`, {
            headers: { 'Authorization': `Bearer ${user.token || localStorage.getItem('token')}` }
        });
        
        if (!res.ok) throw new Error('Failed to fetch routine');
        const routineData = await res.json();

        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const today = days[new Date().getDay()];
        const todaysClasses = routineData.filter(r => r.day === today);

        if (todaysClasses.length === 0) {
            listEl.innerHTML = `<div style="padding:16px; text-align:center; color:var(--text-muted);">No classes scheduled for today! 🎉</div>`;
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
            const slot = c.timeSlot.split(' - ')[0]; // Show start time
            
            const bgColors = ['#ede9fe', '#d1fae5', '#e0f2fe', '#ffedd5'];
            const textColors = ['#7c3aed', '#059669', '#0284c7', '#ea580c'];
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

        // Update top stat
        const classStatEl = document.getElementById('stat-classes');
        if(classStatEl) classStatEl.innerText = todaysClasses.length;

    } catch (error) {
        console.error('Error fetching routine:', error);
    }
}

async function fetchOfficialNotices() {
    const listEl = document.getElementById('official-notices-list');
    if (!listEl) return;

    try {
        const res = await fetch(`${API_URL}/notices?role=${user.role}&department=${user.department || ''}`);
        if (!res.ok) throw new Error('Failed to fetch notices');
        const notices = await res.json();
        
        const generalNotices = notices.filter(n => n.audience === 'general' || n.audience === 'teachers').slice(0, 3);
        
        if (generalNotices.length === 0) {
            listEl.innerHTML = `<div style="text-align:center; padding: 20px; color:var(--text-muted);">No official notices.</div>`;
            return;
        }

        let html = '';
        generalNotices.forEach((n, i) => {
            const bgColors = ['#ffedd5', '#e0f2fe', '#ede9fe'];
            const textColors = ['#ea580c', '#0284c7', '#7c3aed'];
            const icons = ['fa-bullhorn', 'fa-file-contract', 'fa-calendar'];
            
            const bg = bgColors[i % bgColors.length];
            const tc = textColors[i % textColors.length];
            const icon = icons[i % icons.length];
            const d = new Date(n.date || n.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

            html += `
            <div class="notice-item">
                <div style="background: ${bg}; color: ${tc}; width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1rem; flex-shrink: 0;"><i class="fa-solid ${icon}"></i></div>
                <div class="notice-info" style="flex: 1;">
                  <h4 style="font-size: 0.85rem; margin-bottom: 2px; color: var(--text-dark);">${n.title}</h4>
                  <p style="font-size: 0.75rem; color: var(--text-muted); margin: 0;">${d}</p>
                </div>
                <i class="fa-solid fa-chevron-right" style="color: var(--text-muted); font-size: 0.7rem;"></i>
            </div>`;
        });
        listEl.innerHTML = html;
    } catch (error) {
        console.error('Error fetching official notices:', error);
    }
}
