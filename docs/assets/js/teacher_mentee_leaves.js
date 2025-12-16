const API_URL = 'http://localhost:5000/api/leaves';

document.addEventListener('DOMContentLoaded', () => {
    loadLeaveRequests();
});

async function loadLeaveRequests() {
    const container = document.getElementById('leaveRequestsList');
    if (!container) return;

    const userStr = localStorage.getItem('user');
    if (!userStr) return;
    const user = JSON.parse(userStr);

    try {
        const response = await fetch(`${API_URL}/mentees`, {
            headers: { 'Authorization': `Bearer ${user.token}` }
        });

        const leaves = await response.json();

        if (leaves.length === 0) {
            container.innerHTML = '<div style="padding:1rem; text-align:center; color:#64748b;">No pending leave applications.</div>';
            return;
        }

        container.innerHTML = leaves.map(leave => {
            const student = leave.student || { name: 'Unknown', roomNumber: 'N/A' };
            const startDate = new Date(leave.startDate).toLocaleDateString();
            const endDate = new Date(leave.endDate).toLocaleDateString();

            let statusColor = '#f59e0b'; // Pending - Orange
            if (leave.status === 'Approved') statusColor = '#10b981'; // Green
            if (leave.status === 'Rejected') statusColor = '#ef4444'; // Red

            return `
            <div style="background:white; padding:1.2rem; border-radius:12px; margin-bottom:1rem; border-left:5px solid ${statusColor}; box-shadow:0 2px 5px rgba(0,0,0,0.05);">
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <div>
                        <h3 style="margin:0 0 5px 0; color:#1f2937; font-size:1.1rem;">${leave.type} Request</h3>
                        <p style="margin:0; color:#4b5563; font-size:0.9rem;">
                            <strong>Student:</strong> ${student.name} (Room ${student.roomNumber || 'N/A'})<br>
                            <strong>Date:</strong> ${startDate} to ${endDate}<br>
                            <strong>Reason:</strong> "${leave.reason}"
                        </p>
                        <div style="margin-top:5px; font-size:0.8rem; color:#64748b;">Status: <span style="font-weight:bold; color:${statusColor}">${leave.status}</span></div>
                    </div>
                </div>
                ${leave.status === 'Pending' ? `
                <div style="margin-top:1rem; padding-top:1rem; border-top:1px solid #f3f4f6; display:flex; justify-content:flex-end; gap:10px;">
                    <button onclick="updateStatus('${leave._id}', 'Approved')"
                        style="background:#10b981; color:white; border:none; padding:8px 16px; border-radius:6px; cursor:pointer; font-weight:600;">
                        <i class="fa-solid fa-check"></i> Approve
                    </button>
                    <button onclick="updateStatus('${leave._id}', 'Rejected')"
                        style="background:#ef4444; color:white; border:none; padding:8px 16px; border-radius:6px; cursor:pointer; font-weight:600;">
                        Reject
                    </button>
                </div>
                ` : ''}
            </div>
            `;
        }).join('');

    } catch (error) {
        console.error('Error loading leaves:', error);
        container.innerHTML = `<div style="color:red; text-align:center;">Failed to load requests: ${error.message}</div>`;
    }
}

async function updateStatus(id, status) {
    if (!confirm(`Are you sure you want to ${status} this request?`)) return;

    const userStr = localStorage.getItem('user');
    const user = JSON.parse(userStr);

    try {
        const response = await fetch(`${API_URL}/${id}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`
            },
            body: JSON.stringify({ status })
        });

        if (response.ok) {
            alert(`Request ${status}`);
            loadLeaveRequests(); // Refresh list
        } else {
            alert('Failed to update status');
        }
    } catch (error) {
        console.error(error);
        alert('Server error');
    }
}
