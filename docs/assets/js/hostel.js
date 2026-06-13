var API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:5000' : 'https://campuscare-backend-96cn.onrender.com') + '/api';

let allHostelNotices = [];

document.addEventListener('DOMContentLoaded', () => {
    // Auth Check
    const userStr = localStorage.getItem('user');
    if (!userStr) {
        // window.location.href = '../login.html'; // Optional: Redirect if strict
    } else {
        const user = JSON.parse(userStr);
        
        // Update greeting
        const greetingEl = document.getElementById('hosteler-greeting');
        if (greetingEl) {
            const firstName = user.name ? user.name.split(' ')[0] : 'Hosteler';
            greetingEl.innerHTML = getGreetingText(firstName);
        }

        // Set hostel stats
        const roomNoEl = document.getElementById('room-number-val');
        if (roomNoEl) roomNoEl.innerText = user.roomNumber || 'N/A';

        const hostelNameEl = document.getElementById('hostel-name-val');
        if (hostelNameEl) hostelNameEl.innerText = user.hostelName || 'N/A';

        // Load user leave history
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
    
    return `${salutation}, <span style="color: var(--warning); font-weight: 800;">${name}</span>!<br><span style="font-size: 2.2rem; display: inline-block; margin-top: 8px;">${icon}</span>`;
}

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
    if (!tbody) return;
    try {
        const res = await fetch(`${API_BASE}/hostel/mess`);
        if (!res.ok) throw new Error('Failed to load menu');

        const menu = await res.json();

        if (menu.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Menu not uploaded yet.</td></tr>';
            return;
        }

        // Sort by Day (Mon-Sun)
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        menu.sort((a, b) => days.indexOf(a.day) - days.indexOf(b.day));

        const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });

        tbody.innerHTML = menu.map(m => `
            <tr class="${m.day === today ? 'today-row' : ''}">
                <td style="font-weight: 600;">${m.day}</td>
                <td>${m.breakfast}</td>
                <td>${m.lunch}</td>
                <td>${m.snacks}</td>
                <td>${m.dinner}</td>
            </tr>
        `).join('');

    } catch (error) {
        console.error(error);
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Error loading menu.</td></tr>';
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
    if (!container) return;

    const userStr = localStorage.getItem('user');
    if (!userStr) return;
    const user = JSON.parse(userStr);

    try {
        const res = await fetch(`${API_BASE}/hostel/my-leaves`, {
            headers: { 'Authorization': `Bearer ${user.token}` }
        });
        const leaves = await res.json();

        if (statusBadge) statusBadge.innerText = `${leaves.length} Applications`;

        // Calculate Stats
        let approvedCount = 0;
        let pendingCount = 0;
        leaves.forEach(l => {
            if (l.status === 'Approved') {
                approvedCount++;
            } else if (l.status.includes('Pending') || l.status === 'Submitted') {
                pendingCount++;
            }
        });

        const approvedEl = document.getElementById('approvedLeavesCount');
        if (approvedEl) approvedEl.innerText = approvedCount;

        const pendingEl = document.getElementById('pendingLeavesCount');
        if (pendingEl) pendingEl.innerText = pendingCount;

        if (leaves.length === 0) {
            container.innerHTML = '<p style="text-align:center; color:#64748b; padding: 1rem;">No leave history.</p>';
            return;
        }

        container.innerHTML = leaves.map(l => {
            const remarks = [];
            if (l.hodRemark) remarks.push(`<strong>HOD:</strong> ${l.hodRemark}`);
            if (l.wardenRemark) remarks.push(`<strong>Warden:</strong> ${l.wardenRemark}`);

            return `
            <div style="background:#f8fafc; padding:15px; border-radius:12px; border:1px solid #e2e8f0; display:flex; flex-direction:column; gap:10px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <strong style="color:#334155; font-size:0.95rem;">${l.type}</strong>
                        <div style="font-size:0.8rem; color:#64748b; margin-top: 2px;">
                            From: ${new Date(l.startDate).toLocaleString()} | To: ${new Date(l.endDate).toLocaleString()}
                        </div>
                    </div>
                    <span style="font-size:0.75rem; padding:4px 10px; border-radius:10px; background:${getStatusColor(l.status)}; color:white; font-weight:600; text-transform:uppercase; letter-spacing:0.5px;">
                        ${l.status}
                    </span>
                </div>
                ${l.reason ? `
                <div style="font-size:0.85rem; color:#475569; background: white; padding: 8px 12px; border-radius: 6px; border: 1px dashed #e2e8f0;">
                    <strong>Reason:</strong> ${l.reason}
                </div>
                ` : ''}
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
        container.innerHTML = '<p style="text-align:center; color:#ef4444; padding: 1rem;">Error loading leave applications.</p>';
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
        const res = await fetch(`${API_BASE}/notices?role=hosteler&department=${user.department || ''}`, {
            headers: { 'Authorization': `Bearer ${user.token}` }
        });

        if (!res.ok) throw new Error('Failed to load notices');

        allHostelNotices = await res.json();

        if (allHostelNotices.length === 0) {
            list.innerHTML = '<p style="text-align:center; color:#64748b; padding:1rem;">No new notices.</p>';
            return;
        }

        list.innerHTML = allHostelNotices.map(n => `
            <div class="notice-card-item" onclick="openNoticeModal('${n._id}')">
                <div class="notice-icon-box">
                    <i class="fa-solid ${getNoticeIcon(n.audience)}"></i>
                </div>
                <div class="notice-content" style="flex: 1;">
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
    const notice = allHostelNotices.find(n => n._id === id);
    if (notice) {
        document.getElementById('modal-notice-title').textContent = notice.title;
        document.getElementById('modal-notice-meta').textContent = `${new Date(notice.date).toLocaleDateString()} | Target: ${notice.audience.toUpperCase()}`;
        document.getElementById('modal-notice-content').textContent = notice.content;
        
        // standard helper call
        if (typeof toggleModal === 'function') {
            toggleModal('notice-detail-modal');
        }
    }
}
