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
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:2rem; color:#64748b;">No pending requests.</td></tr>';
            return;
        }

        tableBody.innerHTML = leaves.map(leave => {
            const startDate = new Date(leave.startDate).toLocaleDateString();
            const endDate = new Date(leave.endDate).toLocaleDateString();

            let hodStatusHtml = '';
            let hStatus = leave.hodStatus;

            // Fallback for legacy data or mixed tracking
            if (!hStatus) {
                if (leave.status === 'Approved by HOD' || leave.status === 'Approved') {
                    hStatus = 'Approved';
                } else if (leave.status === 'Rejected by HOD') {
                    hStatus = 'Rejected';
                } else {
                    hStatus = 'Pending';
                }
            }

            if (hStatus === 'Approved') {
                hodStatusHtml = `<div><i class="fa-solid fa-check-circle" style="color:green;"></i> Approved</div>`;
            } else if (hStatus === 'Rejected') {
                hodStatusHtml = `<div><i class="fa-solid fa-circle-xmark" style="color:#ef4444;"></i> Rejected</div>`;
            } else {
                hodStatusHtml = `<div><i class="fa-solid fa-hourglass-half" style="color:orange;"></i> Pending</div>`;
            }

            if (leave.hodRemark) {
                hodStatusHtml += `<div style="font-size:0.75rem; color:#64748b; margin-top:2px;">"${leave.hodRemark}"</div>`;
            }

            let approveBtnText = 'Issue Pass';
            let approveBtnIcon = 'fa-stamp';
            let approveBtnAction = 'Issue Gate Pass for this student?';
            let btnStyle = 'background:#10b981;'; // Green

            if (hStatus !== 'Approved') {
                approveBtnText = 'Issue Pass (Direct)';
                approveBtnIcon = 'fa-bolt'; // Bolt icon for instant action
                approveBtnAction = 'Directly issue Gate Pass? (HOD has not approved yet)';
                btnStyle = 'background:#f59e0b;'; // Amber/Orange to indicate override
            }

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
                    ${hodStatusHtml}
                </td>
                <td style="padding:1rem;">
                    <div style="display:flex; gap:10px;">
                        <button onclick="approveLeave('${leave._id}', '${approveBtnAction}')" 
                            style="${btnStyle} color:white; border:none; padding:6px 12px; border-radius:6px; cursor:pointer; font-weight:600;" title="Issue Gate Pass">
                            <i class="fa-solid ${approveBtnIcon}"></i> ${approveBtnText}
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

async function approveLeave(id, confirmMsg) {
    if (!confirm(confirmMsg || 'Issue Gate Pass for this student?')) return;
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
            alert(action === 'approve' ? 'Approved successfully' : 'Rejected successfully');
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
