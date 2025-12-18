
const API_BASE_URL = 'http://localhost:5000/api';
let allNotices = [];

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    fetchNotices();
});

function checkAuth() {
    const userStr = localStorage.getItem('user');
    if (!userStr) window.location.href = '../login.html';
    const user = JSON.parse(userStr);
    if (user.role !== 'warden') {
        window.location.href = '../index.html';
    }
}

async function fetchNotices() {
    const listContainer = document.getElementById('notices-list');
    const user = JSON.parse(localStorage.getItem('user'));

    try {
        // Fetch notices with role=warden to see everything relevant (add timestamp to prevent cache)
        const res = await fetch(`${API_BASE_URL}/notices?role=warden&userId=${user._id}&_t=${Date.now()}`, {
            headers: { 'Authorization': `Bearer ${user.token}` }
        });

        if (!res.ok) throw new Error('Failed to fetch notices');

        allNotices = await res.json();
        console.log('Fetched Notices:', allNotices);
        renderNotices('all');

    } catch (error) {
        console.error('Error fetching notices:', error);
        listContainer.innerHTML = `<p style="text-align:center; color:red;">Error loading notices: ${error.message}</p>`;
    }
}

function filterNotices(type, btn) {
    if (btn) {
        // Reset all buttons
        document.querySelectorAll('.filter-btn').forEach(b => {
            b.classList.remove('active');
            b.style.background = 'transparent';
            b.style.color = '#64748b';
        });

        // Activate clicked button
        btn.classList.add('active');
        btn.style.background = '#3b82f6';
        btn.style.color = 'white';
    }
    renderNotices(type);
}

function renderNotices(filterType) {
    const listContainer = document.getElementById('notices-list');

    // Filter Logic: Case insensitive, with logical grouping
    const filtered = allNotices.filter(n => {
        const nAudience = (n.audience || '').trim().toLowerCase();
        const fType = filterType.toLowerCase();

        if (fType === 'all') return true;

        // Teachers Filter: Shows 'teacher' and 'hod'
        if (fType === 'teacher') {
            return nAudience === 'teacher' || nAudience === 'hod';
        }

        // Students Filter: Shows 'student'
        if (fType === 'student') {
            return nAudience === 'student';
        }

        // Hostelers Filter: Shows 'hosteler'
        if (fType === 'hosteler') {
            return nAudience === 'hosteler';
        }

        // General Filter: Shows 'general' or 'public'
        if (fType === 'general') {
            return nAudience === 'general' || nAudience === 'public';
        }

        // Fallback for strict match
        return nAudience === fType;
    });

    if (filtered.length === 0) {
        listContainer.innerHTML = `
            <div style="text-align:center; padding:2rem; color:#94a3b8;">
                <i class="fa-regular fa-folder-open" style="font-size:2rem; margin-bottom:1rem;"></i>
                <p>No notices found for this category.</p>
            </div>`;
        return;
    }

    const user = JSON.parse(localStorage.getItem('user'));

    // Clear container
    listContainer.innerHTML = '';

    filtered.forEach(notice => {
        const dateObj = new Date(notice.date);
        const day = dateObj.getDate();
        const month = dateObj.toLocaleString('default', { month: 'short' }).toUpperCase();

        const isMyPost = notice.postedBy === user._id;

        let badgeColor = '#64748b';
        const aud = (notice.audience || 'general').toLowerCase();

        if (aud === 'hosteler') badgeColor = '#f59e0b';
        else if (aud === 'student') badgeColor = '#3b82f6';
        else if (aud === 'teacher' || aud === 'hod') badgeColor = '#ef4444'; // Red for teachers/hod
        else if (aud === 'general') badgeColor = '#10b981';

        const div = document.createElement('div');
        div.className = 'notice-item';
        div.style.cssText = `
            display: flex; 
            background: white; 
            padding: 1.5rem; 
            border-radius: 16px; 
            margin-bottom: 1rem; 
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
            transition: transform 0.2s;
            border-left: 4px solid ${badgeColor};
        `;

        div.innerHTML = `
            <div class="notice-date" style="
                display: flex; 
                flex-direction: column; 
                align-items: center; 
                justify-content: center; 
                padding-right: 1.5rem; 
                border-right: 1px solid #e2e8f0; 
                min-width: 70px;
                margin-right: 1.5rem;">
                <div style="font-size:1.8rem; font-weight:700; color:${badgeColor}; line-height:1;">${day}</div>
                <div style="font-size:0.9rem; font-weight:600; color:#64748b; text-transform:uppercase;">${month}</div>
            </div>
            
            <div class="notice-content" style="flex: 1;">
                <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:0.5rem;">
                    <h3 style="margin:0; color:#1e293b; font-size:1.1rem; font-weight:600;">${notice.title}</h3>
                    <div style="display:flex; gap:10px; align-items:center;">
                        <span style="background:${badgeColor}; color:white; padding:4px 10px; border-radius:6px; font-size:0.7rem; font-weight:700; text-transform:uppercase; letter-spacing:0.5px;">
                            ${notice.audience}
                        </span>
                        ${isMyPost ?
                `<button onclick="deleteNotice('${notice._id}')" style="
                            color:#ef4444; 
                            background:#fef2f2; 
                            border:none; 
                            border-radius:6px;
                            width:30px; 
                            height:30px; 
                            cursor:pointer; 
                            display:flex; 
                            align-items:center; 
                            justify-content:center;
                            transition: all 0.2s;" 
                            title="Delete Notice"
                            onmouseover="this.style.background='#fee2e2'"
                            onmouseout="this.style.background='#fef2f2'">
                            <i class="fa-solid fa-trash" style="font-size:0.9rem;"></i>
                        </button>` : ''}
                    </div>
                </div>
                
                <p style="color:#475569; font-size:0.95rem; line-height:1.6; margin:0; white-space: pre-wrap;">${notice.content}</p>
            </div>
        `;
        listContainer.appendChild(div);
    });
}

async function postNotice() {
    const title = document.getElementById('notice-title').value.trim();
    const content = document.getElementById('notice-content').value.trim();
    const audience = document.getElementById('notice-audience').value;
    const user = JSON.parse(localStorage.getItem('user'));

    if (!title || !content) return alert('Please fill in title and content');

    try {
        const res = await fetch(`${API_BASE_URL}/notices`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`
            },
            body: JSON.stringify({
                title, content, audience, userId: user._id
            })
        });

        if (res.ok) {
            alert('Notice Posted!');
            document.getElementById('notice-title').value = '';
            document.getElementById('notice-content').value = '';
            fetchNotices(); // Refresh
        } else {
            const err = await res.json();
            alert('Error: ' + err.message);
        }
    } catch (error) {
        console.error(error);
        alert('Server Error');
    }
}

async function deleteNotice(id) {
    if (!confirm('Delete this notice?')) return;
    const user = JSON.parse(localStorage.getItem('user'));

    try {
        const res = await fetch(`${API_BASE_URL}/notices/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${user.token}` }
        });

        if (res.ok) {
            fetchNotices();
        } else {
            alert('Failed to delete');
        }
    } catch (error) {
        console.error(error);
    }
}
