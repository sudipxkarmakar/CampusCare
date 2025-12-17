const API_URL = 'http://localhost:5000/api/complaints';

document.addEventListener('DOMContentLoaded', () => {
    loadComplaints();
});

async function loadComplaints() {
    const menteeListContainer = document.getElementById('menteeComplaintsList');
    const againstMeListContainer = document.getElementById('complaintsAgainstMeList');

    if (!menteeListContainer || !againstMeListContainer) return;

    const userStr = localStorage.getItem('user');
    if (!userStr) return;
    const user = JSON.parse(userStr);

    try {
        const response = await fetch(`${API_URL}/mentees`, {
            headers: { 'Authorization': `Bearer ${user.token}` }
        });

        const complaints = await response.json();

        if (complaints.length === 0) {
            menteeListContainer.innerHTML = '<div style="padding:1rem; text-align:center; color:#64748b;">No complaints found.</div>';
            againstMeListContainer.innerHTML = '<div style="padding:1rem; text-align:center; color:#64748b;">No complaints found.</div>';
            return;
        }

        // Split into two categories
        const complaintsByMentees = [];
        const complaintsAgainstMe = [];

        complaints.forEach(c => {
            // Note: A complaint could strictly be both if a mentee complains against their own mentor. 
            // We prioritize showing it in "Against Me" as that requires defensive action? 
            // Or both? Let's show in both if applicable, or prioritize Against Me.

            let isAgainstMe = false;
            if (c.againstUser && (c.againstUser === user._id || c.againstUser._id === user._id)) {
                complaintsAgainstMe.push(c);
                isAgainstMe = true;
            }

            // If it's NOT explicitly against me, but by my mentee, it goes to "Reported by Mentee"
            // Or should it appear in both? For clarity, let's put it in By Mentees as well if the student is a mentee.
            // But checking againstUser first is safer.

            if (!isAgainstMe && c.student) {
                // We assume the backend filtered correctly for mentees, so if it's not against me, it must be by a mentee
                complaintsByMentees.push(c);
            } else if (isAgainstMe && c.student) {
                // It is against me, and by a student (maybe mentee). 
                // Let's NOT duplicate it in the "Reported by Mentees" section to avoid confusion.
            }
        });

        renderComplaints(menteeListContainer, complaintsByMentees, 'mentee', user);
        renderComplaints(againstMeListContainer, complaintsAgainstMe, 'against', user);

    } catch (error) {
        console.error('Error loading complaints:', error);
        menteeListContainer.innerHTML = '<div style="color:red; text-align:center;">Failed to load complaints</div>';
    }
}

function renderComplaints(container, complaints, type, user) {
    if (complaints.length === 0) {
        container.innerHTML = '<div style="padding:1rem; text-align:center; color:#64748b;">No complaints in this category.</div>';
        return;
    }

    container.innerHTML = complaints.map(complaint => {
        const student = complaint.student || { name: 'Unknown', roomNumber: 'N/A', rollNumber: 'N/A' };

        let statusColor = '#3b82f6'; // Blue
        if (complaint.status === 'Resolved') statusColor = '#10b981'; // Green
        if (complaint.status === 'In Progress') statusColor = '#f59e0b'; // Orange
        if (complaint.isUplifted) statusColor = '#8b5cf6'; // Purple

        const isResolved = complaint.status === 'Resolved';
        const isUplifted = complaint.isUplifted;

        return `
        <div style="background:white; padding:1.2rem; border-radius:12px; margin-bottom:1rem; border:1px solid #e2e8f0; box-shadow:0 2px 5px rgba(0,0,0,0.02);">
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <div>
                    <h3 style="margin:0 0 5px 0; color:#1f2937; font-size:1.1rem;">${complaint.title}</h3>
                    <p style="margin:0; color:#4b5563; font-size:0.9rem;">
                        <strong>From:</strong> ${student.name} (${student.rollNumber})<br>
                        <span style="font-style:italic;">"${complaint.description}"</span>
                    </p>
                    <div style="margin-top:5px; font-size:0.8rem; color:#64748b;">
                        Status: <span style="font-weight:bold; color:${statusColor}">${complaint.status}${isUplifted ? ` (Uplifted to ${complaint.upliftedTo})` : ''}</span>
                    </div>
                </div>
                <span style="background:#f3e8ff; color:#6b21a8; font-size:0.75rem; padding:3px 8px; border-radius:10px; font-weight:700;">${complaint.category || 'General'}</span>
            </div>
            ${!isResolved ? `
            <div style="margin-top:1rem; padding-top:1rem; border-top:1px solid #f3f4f6; display:flex; justify-content:flex-end; gap:10px;">
                <button onclick="updateStatus('${complaint._id}', 'Resolved')"
                    style="background:#10b981; color:white; border:none; padding:8px 16px; border-radius:6px; cursor:pointer; font-weight:600;">
                    <i class="fa-solid fa-check-double"></i> Solve
                </button>
                ${!isUplifted ? `
                <button onclick="upliftComplaint('${complaint._id}')"
                    style="background:white; color:#ef4444; border:1px solid #ef4444; padding:8px 16px; border-radius:6px; cursor:pointer; font-weight:600;">
                    <i class="fa-solid fa-arrow-up-from-bracket"></i> Uplift
                </button>
                ` : ''}
            </div>
            ` : ''}
        </div>
        `;
    }).join('');
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
            loadComplaints();
        } else {
            alert('Failed to update status');
        }
    } catch (error) {
        console.error(error);
        alert('Server error');
    }
}

async function upliftComplaint(id) {
    const target = prompt("Uplift to which authority? (Type: HOD, Warden, or Principal)");
    if (!target) return;

    if (!['HOD', 'Warden', 'Principal'].includes(target)) {
        alert("Invalid Authority. Please type exactly: HOD, Warden, or Principal");
        return;
    }

    const userStr = localStorage.getItem('user');
    const user = JSON.parse(userStr);

    try {
        const response = await fetch(`${API_URL}/${id}/uplift`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`
            },
            body: JSON.stringify({ target })
        });

        if (response.ok) {
            alert(`Complaint Uplifted to ${target} successfully.`);
            loadComplaints();
        } else {
            const data = await response.json();
            alert(data.message || 'Failed to uplift complaint');
        }

    } catch (error) {
        console.error(error);
        alert('Server Error during uplift');
    }
}
