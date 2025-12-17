const API_URL = 'http://localhost:5000/api/warden';
let currentRejectId = null;

document.addEventListener('DOMContentLoaded', loadLeaves);

async function loadLeaves() {
    const tableBody = document.getElementById('leavesTableBody');
    const userStr = localStorage.getItem('user');
    if (!userStr) return;
    const user = JSON.parse(userStr);

    try {
        const response = await fetch(`${API_URL}/leaves`, {
            headers: { 'Authorization': `Bearer ${user.token}` }
        });

        if (!response.ok) throw new Error('Failed to fetch');

        const leaves = await response.json();

        if (leaves.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:2rem; color:#64748b;">No pending approvals from HOD.</td></tr>';
            return;
        }

        tableBody.innerHTML = leaves.map(leave => {
            const startDate = new Date(leave.startDate).toLocaleDateString();
            const endDate = new Date(leave.endDate).toLocaleDateString();

            return `
            <tr style="border-bottom:1px solid #f1f5f9;">
                <td style="padding:1rem;">
                    <div style="font-weight:600; color:#2d3748;">${leave.student?.name || 'Unknown'}</div>
                    <div style="font-size:0.8rem; color:#64748b;">Room: ${leave.student?.roomNumber || 'N/A'}</div>
                    <div style="font-size:0.75rem; color:#94a3b8;">${leave.student?.hostelName || ''}</div>
                </td>
                <td style="padding:1rem;">
                    <span style="background:#d1fae5; color:#047857; padding:2px 8px; border-radius:10px; font-size:0.8rem; font-weight:600;">${leave.type}</span>
                </td>
                <td style="padding:1rem; font-size:0.9rem;">${startDate} - ${endDate}</td>
                 <td style="padding:1rem; font-size:0.8rem; color:#475569;">
                    <div><i class="fa-solid fa-check-circle" style="color:green;"></i> HOD Approved</div>
                    <div>${leave.hodRemark ? `"${leave.hodRemark}"` : ''}</div>
                </td>
                <td style="padding:1rem;">
                    <div style="display:flex; gap:10px;">
                        <button onclick="approveLeave('${leave._id}')" 
                            style="background:#10b981; color:white; border:none; padding:6px 12px; border-radius:6px; cursor:pointer; font-weight:600;">
                            <i class="fa-solid fa-stamp"></i> Issue Pass
                        </button>
                        <button onclick="openRejectModal('${leave._id}')" 
                            style="background:#ef4444; color:white; border:none; padding:6px 12px; border-radius:6px; cursor:pointer; font-weight:600;">
                            <i class="fa-solid fa-xmark"></i> Reject
                        </button>
                    </div>
                </td>
            </tr>
            `;
        }).join('');

    } catch (error) {
        console.error(error);
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:red;">Error loading leaves.</td></tr>';
    }
}

async function approveLeave(id) {
    if (!confirm('Issue Gate Pass for this student?')) return;
    await processAction(id, 'approve');
}

function openRejectModal(id) {
    currentRejectId = id;
    document.getElementById('rejectModal').style.display = 'flex';
}

function closeRejectModal() {
    currentRejectId = null;
    document.getElementById('rejectModal').style.display = 'none';
    document.getElementById('rejectRemark').value = '';
}

async function confirmReject() {
    const remark = document.getElementById('rejectRemark').value;
    if (!remark) {
        alert('Please provide a reason for rejection.');
        return;
    }
    await processAction(currentRejectId, 'reject', remark);
    closeRejectModal();
}

async function processAction(id, action, remark = '') {
    const userStr = localStorage.getItem('user');
    const user = JSON.parse(userStr);

    try {
        const response = await fetch(`${API_URL}/leaves/${id}/action`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`
            },
            body: JSON.stringify({ action, remark })
        });

        if (response.ok) {
            alert(action === 'approve' ? 'Gate Pass Issued Successfully' : 'Rejected successfully');
            loadLeaves();
        } else {
            const data = await response.json();
            alert(data.message || 'Action failed');
        }
    } catch (error) {
        console.error(error);
        alert('Server Error');
    }
}
