const API_URL = 'http://localhost:5000/api/complaints';

document.addEventListener('DOMContentLoaded', () => {
    loadMenteeComplaints();
});

async function loadMenteeComplaints() {
    const container = document.getElementById('menteeComplaintsList');
    if (!container) return;

    const userStr = localStorage.getItem('user');
    if (!userStr) return;
    const user = JSON.parse(userStr);

    try {
        const response = await fetch(`${API_URL}/mentees`, {
            headers: { 'Authorization': `Bearer ${user.token}` }
        });

        const complaints = await response.json();

        // Filter out "Resolved" ones if needed, or show all. User might want to see history.
        // Let's show all but maybe sort active first.

        if (complaints.length === 0) {
            container.innerHTML = '<div style="padding:1rem; text-align:center; color:#64748b;">No complaints from mentees found.</div>';
            return;
        }

        container.innerHTML = complaints.map(complaint => {
            const student = complaint.student || { name: 'Unknown', roomNumber: 'N/A' };

            // Determine badge color based on status
            let statusColor = '#3b82f6'; // Blue
            if (complaint.status === 'Resolved') statusColor = '#10b981'; // Green
            if (complaint.status === 'Escalated') statusColor = '#ef4444'; // Red

            return `
            <div style="background:white; padding:1.2rem; border-radius:12px; margin-bottom:1rem; border:1px solid #e2e8f0; box-shadow:0 2px 5px rgba(0,0,0,0.02);">
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <div>
                        <h3 style="margin:0 0 5px 0; color:#1f2937; font-size:1.1rem;">${complaint.title}</h3>
                        <p style="margin:0; color:#4b5563; font-size:0.9rem;">
                            <strong>From:</strong> ${student.name} (${student.rollNumber || 'N/A'})<br>
                            <span style="font-style:italic;">"${complaint.description}"</span>
                        </p>
                        <div style="margin-top:5px; font-size:0.8rem; color:#64748b;">Status: <span style="font-weight:bold; color:${statusColor}">${complaint.status}</span></div>
                    </div>
                    <span style="background:#f3e8ff; color:#6b21a8; font-size:0.75rem; padding:3px 8px; border-radius:10px; font-weight:700;">${complaint.category || 'General'}</span>
                </div>
                ${complaint.status !== 'Resolved' && complaint.status !== 'Escalated' ? `
                <div style="margin-top:1rem; padding-top:1rem; border-top:1px solid #f3f4f6; display:flex; justify-content:flex-end; gap:10px;">
                    <button onclick="updateStatus('${complaint._id}', 'Resolved')"
                        style="background:#10b981; color:white; border:none; padding:8px 16px; border-radius:6px; cursor:pointer; font-weight:600;">
                        <i class="fa-solid fa-check-double"></i> Approve & Solve
                    </button>
                    <button onclick="updateStatus('${complaint._id}', 'Escalated')"
                        style="background:white; color:#ef4444; border:1px solid #ef4444; padding:8px 16px; border-radius:6px; cursor:pointer; font-weight:600;">
                        Escalate
                    </button>
                </div>
                ` : ''}
            </div>
            `;
        }).join('');

    } catch (error) {
        console.error('Error loading mentee complaints:', error);
        container.innerHTML = '<div style="color:red; text-align:center;">Failed to load complaints</div>';
    }
}

async function updateStatus(id, status) {
    if (!confirm(`Mark this complaint as ${status}?`)) return;

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
            alert(`Complaint marked as ${status}`);
            loadMenteeComplaints(); // Refresh list
        } else {
            alert('Failed to update status');
        }
    } catch (error) {
        console.error(error);
        alert('Server error');
    }
}
