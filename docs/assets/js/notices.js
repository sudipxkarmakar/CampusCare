const API_URL = 'http://localhost:5000/api/notices';

document.addEventListener('DOMContentLoaded', () => {
    loadNotices();

    const createForm = document.getElementById('createNoticeForm');
    if (createForm) {
        createForm.addEventListener('submit', handleCreateNotice);
    }
});

async function loadNotices() {
    const noticeList = document.getElementById('noticeList');
    if (!noticeList) return;

    // Get User Role from LocalStorage
    const userStr = localStorage.getItem('user');
    let role = 'public';
    let token = '';

    if (userStr) {
        const user = JSON.parse(userStr);
        role = user.role || 'public';
        token = user.token;

        // Normalize role if needed (though backend sends correct lowercase usually)
        if (role === 'Hosteler') role = 'hosteler';
        if (role === 'Student') role = 'student';
        if (role === 'Teacher') role = 'teacher';
    }

    try {
        const response = await fetch(`${API_URL}?role=${role}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }

        const notices = await response.json();

        if (Array.isArray(notices) && notices.length === 0) {
            noticeList.innerHTML = '<div style="text-align: center; color: #64748b; padding: 2rem;">No notices found for your role (' + role + ').</div>';
            return;
        }

        noticeList.innerHTML = notices.map(notice => {
            const date = new Date(notice.date);
            const day = date.getDate();
            const month = date.toLocaleString('default', { month: 'short' }).toUpperCase();

            // Audience Badge Color
            let badgeColor = '#64748b'; // Gray
            if (notice.audience === 'student') badgeColor = '#3b82f6'; // Blue
            if (notice.audience === 'teacher') badgeColor = '#ef4444'; // Red
            if (notice.audience === 'hosteler') badgeColor = '#f59e0b'; // Amber
            if (notice.audience === 'general') badgeColor = '#10b981'; // Green

            return `
            <div class="notice-item">
                <div class="notice-date">
                    <div style="font-size:1.5rem; color:${badgeColor};">${day}</div>
                    <div>${month}</div>
                </div>
                <div class="notice-content">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <strong style="font-size:1.1rem; color:#2d3748;">${notice.title}</strong>
                        <span style="font-size:0.7rem; background:${badgeColor}; color:white; padding:2px 6px; border-radius:4px; text-transform:uppercase;">${notice.audience}</span>
                    </div>
                    <span>${notice.content}</span>
                </div>
            </div>
            `;
        }).join('');

    } catch (error) {
        console.error('Error loading notices:', error);
        noticeList.innerHTML = '<div style="text-align: center; color: #ef4444; padding: 2rem;">Failed to load notices.</div>';
    }
}

async function handleCreateNotice(e) {
    e.preventDefault();

    const title = document.getElementById('noticeTitle').value;
    const content = document.getElementById('noticeContent').value;
    const audience = document.getElementById('noticeAudience').value;

    const userStr = localStorage.getItem('user');
    if (!userStr) {
        alert('You must be logged in to post notices.');
        return;
    }
    const user = JSON.parse(userStr);

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`
            },
            body: JSON.stringify({
                title,
                content,
                audience,
                userId: user.id // Assuming ID is in token/user obj
            })
        });

        if (response.ok) {
            alert('Notice posted successfully!');
            document.getElementById('createNoticeForm').reset();
            loadNotices(); // Refresh list
        } else {
            const data = await response.json();
            alert(data.message || 'Failed to post notice');
        }
    } catch (error) {
        console.error('Error posting notice:', error);
        alert('Error posting notice');
    }
}
