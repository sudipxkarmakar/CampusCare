
const API_BASE_URL = 'http://localhost:5000/api';

document.addEventListener('DOMContentLoaded', () => {
    fetchComplaints();
});

let allComplaints = [];

async function fetchComplaints() {
    try {
        // Fix: Retrieve token from 'user' object in localStorage
        const userStr = localStorage.getItem('user');
        let token = null;
        if (userStr) {
            const user = JSON.parse(userStr);
            token = user.token;
        }

        if (!token) {
            document.getElementById('complaintList').innerHTML = '<p style="text-align:center; color:red;">Please login to view complaints.</p>';
            return;
        }

        const res = await fetch(`${API_BASE_URL}/warden/complaints`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (res.ok) {
            allComplaints = data;
            renderComplaints(allComplaints);
        } else {
            console.error(data.message);
            document.getElementById('complaintList').innerHTML = `<p style="text-align:center; color:red;">Error: ${data.message}</p>`;
        }
    } catch (error) {
        console.error('Error fetching complaints:', error);
        document.getElementById('complaintList').innerHTML = `<p style="text-align:center; color:red;">Server Error. Put backend online.</p>`;
    }
}

// Filter Logic
document.getElementById('priorityFilter').addEventListener('change', (e) => {
    const filter = e.target.value;
    if (filter === 'All') {
        renderComplaints(allComplaints);
    } else {
        const filtered = allComplaints.filter(c => c.priority === filter);
        renderComplaints(filtered);
    }
});

function renderComplaints(complaints) {
    const list = document.getElementById('complaintList');
    list.innerHTML = '';

    if (complaints.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-check-circle" style="font-size:3rem; color:#10b981; margin-bottom:1rem;"></i>
                <h3>All Clear!</h3>
                <p>No complaints to address right now.</p>
            </div>`;
        return;
    }

    complaints.forEach(c => {
        const div = document.createElement('div');
        div.className = `complaint-card ${c.category === 'Disciplinary' ? 'disciplinary' : ''}`;

        const isResolved = c.status === 'Resolved';
        const isUplifted = c.isUplifted;

        div.innerHTML = `
            <div class="complaint-header">
                <div>
                    <span class="badge ${getCategoryBadge(c.category)}">${c.category}</span>
                    <span class="badge ${getPriorityBadge(c.priority)}">${c.priority}</span>
                    <h3 style="margin:5px 0;">${c.title}</h3>
                    <small style="color:#64748b;">
                        By: <strong>${c.student?.name || 'Unknown'}</strong> (${c.student?.roomNumber || 'N/A'})
                        &bull; ${new Date(c.createdAt).toLocaleDateString('en-GB')}
                    </small>
                </div>
                <div style="text-align:right;">
                    <strong style="color: ${getStatusColor(c.status)}">${c.status}</strong>
                    ${isUplifted ? `<div class="uplift-info">Forwarded to ${c.upliftedTo}</div>` : ''}
                </div>
            </div>
            <div class="complaint-body">
                <p>${c.description}</p>
                ${c.againstUser ? `<p class="alert-box"><strong>⚠️ Against:</strong> ${c.againstUser.name}</p>` : ''}
            </div>
            <div class="complaint-actions">
                ${!isResolved && !isUplifted ? `
                    <button class="btn-action resolve" onclick="resolveComplaint('${c._id}')">
                        <i class="fa-solid fa-check"></i> Resolve
                    </button>
                ` : '<button class="btn-secondary" disabled>Action Taken</button>'}
            </div>
        `;
        list.appendChild(div);
    });
}

function getCategoryBadge(cat) {
    if (cat === 'Disciplinary') return 'badge-red';
    if (['Electrical', 'Sanitation'].includes(cat)) return 'badge-yellow';
    return 'badge-blue';
}

function getPriorityBadge(p) {
    if (p === 'Urgent' || p === 'High') return 'badge-red';
    if (p === 'Medium') return 'badge-yellow';
    return 'badge-green';
}

function getStatusColor(s) {
    if (s === 'Resolved') return '#10b981';
    if (s === 'In Progress') return '#f59e0b';
    return '#64748b';
}

async function resolveComplaint(id) {
    if (!confirm('Mark this complaint as Resolved?')) return;

    try {
        const userStr = localStorage.getItem('user');
        const token = userStr ? JSON.parse(userStr).token : null;

        const res = await fetch(`${API_BASE_URL}/warden/complaints/${id}/resolve`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            fetchComplaints();
        } else {
            alert('Failed to resolve');
        }
    } catch (error) {
        console.error(error);
    }
}


