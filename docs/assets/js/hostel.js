const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:5000' : 'https://campuscare-backend-96cn.onrender.com') + '/api';

document.addEventListener('DOMContentLoaded', () => {
    // Auth Check
    const userStr = localStorage.getItem('user');
    if (!userStr) {
        // window.location.href = '../login.html'; // Optional: Redirect if strict
    } else {
        const user = JSON.parse(userStr);
        // document.getElementById('userName').innerText = `Hello, ${user.name}`;
        // Load User specific data like leaves if logged in
        loadMyLeaves();
    }

    loadMessMenu();
    loadHostelNotices();


    const leaveForm = document.getElementById('leaveForm');
    if (leaveForm) {
        leaveForm.addEventListener('submit', handleLeaveSubmit);
        prefillAiLeaveDraft();

        // Initialize Flatpickr Logic for Linked Dates
        const startDatePicker = flatpickr("#startDate", {
            enableTime: true,
            dateFormat: "Y-m-d H:i",
            altInput: true,
            altFormat: "d/m/Y H:i",
            minDate: "today",
            time_24hr: true,
            onChange: function (selectedDates, dateStr, instance) {
                // When start date updates, set end date's minDate to the start date
                // This prevents selecting an end date before the start date
                endDatePicker.set('minDate', dateStr);
            }
        });

        const endDatePicker = flatpickr("#endDate", {
            enableTime: true,
            dateFormat: "Y-m-d H:i",
            altInput: true,
            altFormat: "d/m/Y H:i",
            minDate: "today",
            time_24hr: true
        });
    }
});

function prefillAiLeaveDraft() {
    const type = sessionStorage.getItem('aiLeaveType');
    const reason = sessionStorage.getItem('aiLeaveReason');
    if (!type && !reason) return;

    const typeEl = document.getElementById('type');
    const reasonEl = document.getElementById('reason');
    if (typeEl && type) typeEl.value = type;
    if (reasonEl && reason) reasonEl.value = reason;

    sessionStorage.removeItem('aiLeaveType');
    sessionStorage.removeItem('aiLeaveReason');
}

async function loadMessMenu() {
    const tbody = document.querySelector('#mess-menu-table tbody');
    try {
        // Fetch from API (simulated for now if API not ready, but we made it)
        const res = await fetch(`${API_BASE}/hostel/mess`);
        if (!res.ok) throw new Error('Failed to load menu');

        const menu = await res.json();

        if (menu.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Menu not uploaded yet.</td></tr>';
            return;
        }

        // Sort by Day (Mon-Sun)
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        menu.sort((a, b) => days.indexOf(a.day) - days.indexOf(b.day));

        const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });

        tbody.innerHTML = menu.map(m => `
            <tr class="${m.day === today ? 'today-row' : ''}">
                <td>${m.day}</td>
                <td>${m.breakfast}</td>
                <td>${m.lunch}</td>
                <td>${m.snacks}</td>
                <td>${m.dinner}</td>
            </tr>
        `).join('');

    } catch (error) {
        console.error(error);
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Error loading menu.</td></tr>';
    }
}

async function handleLeaveSubmit(e) {
    e.preventDefault();
    const type = document.getElementById('type').value;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const reason = document.getElementById('reason').value;

    const userStr = localStorage.getItem('user');
    if (!userStr) {
        alert('Please login to apply for leave.');
        return;
    }
    const user = JSON.parse(userStr);

    try {
        const res = await fetch(`${API_BASE}/hostel/leave`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`
            },
            body: JSON.stringify({ type, startDate, endDate, reason })
        });

        if (res.ok) {
            alert('Leave Application Submitted!');
            document.getElementById('leaveForm').reset();
            loadMyLeaves();
        } else {
            alert('Failed to submit application.');
        }
    } catch (error) {
        console.error(error);
        alert('Error submitting leave.');
    }
}

async function loadMyLeaves() {
    const container = document.getElementById('leave-history');
    const statusBadge = document.getElementById('leave-status-count');

    const userStr = localStorage.getItem('user');
    if (!userStr) return;
    const user = JSON.parse(userStr);

    try {
        const res = await fetch(`${API_BASE}/hostel/my-leaves`, {
            headers: { 'Authorization': `Bearer ${user.token}` }
        });
        const leaves = await res.json();

        if (statusBadge) statusBadge.innerText = `${leaves.length} Applications`;

        if (leaves.length === 0) {
            container.innerHTML = '<p style="text-align:center; color:#64748b;">No history.</p>';
            return;
        }

        container.innerHTML = leaves.map(l => {
            const remarks = [];
            if (l.hodRemark) remarks.push(`<strong>HOD:</strong> ${l.hodRemark}`);
            if (l.wardenRemark) remarks.push(`<strong>Warden:</strong> ${l.wardenRemark}`);

            return `
            <div style="background:#f8fafc; padding:15px; margin-bottom:12px; border-radius:12px; border:1px solid #e2e8f0; display:flex; flex-direction:column; gap:10px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <strong style="color:#334155; font-size:0.95rem;">${l.type}</strong>
                        <div style="font-size:0.8rem; color:#64748b;">Applied: ${new Date(l.startDate).toLocaleDateString()}</div>
                    </div>
                    <span style="font-size:0.75rem; padding:4px 10px; border-radius:10px; background:${getStatusColor(l.status)}; color:white; font-weight:600; text-transform:uppercase; letter-spacing:0.5px;">
                        ${l.status}
                    </span>
                </div>
                ${remarks.length > 0 ? `
                <div style="background: #fff; padding: 10px; border-radius: 8px; border-left: 4px solid ${l.status.includes('Rejected') ? '#ef4444' : '#3b82f6'}; font-size: 0.85rem; color: #475569;">
                    ${remarks.join('<br>')}
                </div>
                ` : ''}
            </div>
            `;
        }).join('');

    } catch (error) {
        console.error(error);
    }
}

function getStatusColor(status) {
    if (status === 'Approved') return '#10b981'; // Green
    if (status.includes('Rejected')) return '#ef4444'; // Red
    return '#f59e0b'; // Amber (Pending / Approved by HOD)
}

async function loadHostelNotices() {
    const list = document.getElementById('hostel-notices-list');
    if (!list) return;

    const userStr = localStorage.getItem('user');
    if (!userStr) {
        list.innerHTML = '<p style="text-align:center; color:#64748b; padding:1rem;">Please login to view notices.</p>';
        return;
    }
    const user = JSON.parse(userStr);

    try {
        // Fetch notices with role=hosteler and user department
        const res = await fetch(`${API_BASE}/notices?role=hosteler&department=${user.department || ''}`, {
            headers: { 'Authorization': `Bearer ${user.token}` }
        });

        if (!res.ok) throw new Error('Failed to load notices');

        const notices = await res.json();

        if (notices.length === 0) {
            list.innerHTML = '<p style="text-align:center; color:#64748b; padding:1rem;">No new notices.</p>';
            return;
        }

        list.innerHTML = notices.map(n => `
            <div class="notice-card-item" onclick="openNoticeModal('${n._id}')">
                <div class="notice-content">
                    <h4>${n.title}</h4>
                    <p>${n.content.substring(0, 60)}${n.content.length > 60 ? '...' : ''}</p>
                    <div class="notice-date-badge">
                        ${new Date(n.date).toLocaleDateString()}
                    </div>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error(error);
        list.innerHTML = '<p style="text-align:center; color:#ef4444; padding:1rem;">Error loading notices.</p>';
    }
}

function getNoticeIcon(audience) {
    if (audience === 'student') return 'fa-graduation-cap';
    if (audience === 'teacher') return 'fa-chalkboard-user';
    if (audience === 'hosteler') return 'fa-bed';
    return 'fa-bullhorn';
}

function openNoticeModal(id) {
    // Optional: Implement a modal to show full notice details if needed
    // For now, simple alert or handled by a global modal if one exists
    // alert('Detailed view coming soon for notice: ' + id);
}
