
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
        // Fetch notices with role=warden to see everything relevant
        const res = await fetch(`${API_BASE_URL}/notices?role=warden&userId=${user._id}`, {
            headers: { 'Authorization': `Bearer ${user.token}` }
        });

        if (!res.ok) throw new Error('Failed to fetch notices');

        allNotices = await res.json();
        renderNotices('all');

    } catch (error) {
        console.error('Error fetching notices:', error);
        listContainer.innerHTML = `<p style="text-align:center; color:red;">Error loading notices: ${error.message}</p>`;
    }
}

function filterNotices(type, btn) {
    if (btn) {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    }
    renderNotices(type);
}

function renderNotices(filterType) {
    const listContainer = document.getElementById('notices-list');
    listContainer.innerHTML = '';

    const filtered = allNotices.filter(n => {
        if (filterType === 'all') return true;
        return n.audience === filterType;
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

    filtered.forEach(notice => {
        const date = new Date(notice.date).toLocaleDateString('en-GB', {
            day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        const isMyPost = notice.postedBy === user._id;

        let badgeColor = '#64748b';
        if (notice.audience === 'hosteler') badgeColor = '#10b981'; // Green
        else if (notice.audience === 'student') badgeColor = '#3b82f6'; // Blue
        else if (notice.audience === 'teacher') badgeColor = '#8b5cf6'; // Purple
        else if (notice.audience === 'general') badgeColor = '#f59e0b'; // Orange

        const div = document.createElement('div');
        div.className = 'notice-card';
        div.style.cssText = `background:white; padding:1.5rem; border-radius:12px; border-left: 5px solid ${badgeColor}; box-shadow: 0 2px 4px rgba(0,0,0,0.05); margin-bottom: 0.5rem;`;

        div.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:0.8rem;">
                <h3 style="margin:0; color:#1e293b; font-size:1.1rem;">${notice.title}</h3>
                <span style="background:${badgeColor}20; color:${badgeColor}; padding:2px 8px; border-radius:4px; font-size:0.75rem; font-weight:600; text-transform:uppercase;">
                    ${notice.audience}
                </span>
            </div>
            <p style="color:#475569; font-size:0.95rem; margin-bottom:1rem; white-space: pre-wrap;">${notice.content}</p>
            <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.8rem; color:#94a3b8;">
                <span><i class="fa-regular fa-clock"></i> ${date}</span>
                ${isMyPost ?
                `<button onclick="deleteNotice('${notice._id}')" style="color:#ef4444; background:none; border:none; cursor:pointer;" title="Delete">
                        <i class="fa-solid fa-trash"></i> Delete
                    </button>` : ''}
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
