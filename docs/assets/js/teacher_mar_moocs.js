document.addEventListener('DOMContentLoaded', async () => {
    // Auth Check
    const userStr = localStorage.getItem('user');
    if (!userStr) {
        window.location.href = '../login.html';
        return;
    }
    const user = JSON.parse(userStr);

    // Additional generic role check if needed, but backend protects data anyway
    if (user.role !== 'teacher') {
        // Optional: redirect students back
    }

    if (document.getElementById('userName')) {
        document.getElementById('userName').innerText = user.name || 'Teacher';
    }

    await loadSubmissions(user.token);
});

async function loadSubmissions(token) {
    const marList = document.getElementById('mar-list');
    const moocList = document.getElementById('mooc-list');

    try {
        console.log("Fetching submissions...");
        const response = await api.fetchWithAuth('/mar-moocs/mentees');

        if (!response.ok) throw new Error('Failed to load submissions');

        const data = await response.json();
        console.log("Data received:", data);

        marList.innerHTML = '';
        moocList.innerHTML = '';

        if (!data || data.length === 0) {
            marList.innerHTML = '<li style="text-align:center; padding:1rem; color:#64748b;">No MAR submissions found.</li>';
            moocList.innerHTML = '<li style="text-align:center; padding:1rem; color:#64748b;">No MOOC submissions found.</li>';
            return;
        }

        const createCard = (item) => {
            const student = item.student || { name: 'Unknown Student', rollNumber: 'N/A' };

            // Determine Badge Color
            let badgeColor = '#f59e0b'; // Default Proposed
            if (item.status === 'Verified') badgeColor = '#10b981';
            if (item.status === 'Rejected') badgeColor = '#ef4444';

            // Generate Action Buttons ONLY if Status is Proposed
            let actionsHtml = '';
            if (item.status === 'Proposed') {
                actionsHtml = `
                    <div style="display:flex; gap:10px; width:100%; margin-top:10px;">
                        <button class="btn-action" style="background:#22c55e; flex:1;" onclick="updateStatus('${item._id}', 'Verified')">
                           <i class="fa-solid fa-check"></i> Approve
                        </button>
                        <button class="btn-action" style="background:#ef4444; flex:1;" onclick="toggleReject('${item._id}')">
                           <i class="fa-solid fa-xmark"></i> Reject
                        </button>
                    </div>
                    <div id="reject-box-${item._id}" style="display:none; width:100%; margin-top:5px;">
                        <input type="text" id="remark-${item._id}" class="reject-input" placeholder="Reason for rejection...">
                        <button class="btn-action" style="background:#ef4444; width:100%; margin-top:5px;" onclick="confirmReject('${item._id}')">Confirm Reject</button>
                    </div>
                `;
            } else {
                actionsHtml = `<div style="font-size:0.85rem; color:#64748b; font-style:italic; text-align:right; margin-top:5px;">
                    Status: <span style="font-weight:600; color:${badgeColor}">${item.status}</span>
                </div>`;
            }

            // Create List Item (New Design)
            const li = document.createElement('li');
            li.className = 'activity-item';

            li.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:flex-start; width:100%;">
                    <div>
                        <div class="student-info">${student.name} <span style="font-size:0.8rem; font-weight:400; color:#64748b;">(${student.rollNumber})</span></div>
                        <div style="font-weight:500; font-size:0.95rem; color:#4b5563;">${item.title}</div>
                    </div>
                    <div style="text-align:right;">
                        <span class="activity-points">${item.points} Pts</span>
                        <div style="font-size:0.75rem; color:#9ca3af; margin-top:2px;">${new Date(item.createdAt).toLocaleDateString()}</div>
                    </div>
                </div>

                <div style="display:flex; justify-content:space-between; align-items:center; width:100%; border-top:1px solid rgba(0,0,0,0.05); padding-top:8px;">
                     <a href="${item.certificateUrl || '#'}" target="_blank" style="text-decoration:none; color:#3b82f6; font-size:0.9rem; font-weight:500;">
                        <i class="fa-solid fa-file-invoice"></i> View Proof
                     </a>
                     ${item.status === 'Proposed' ? '<span style="font-size:0.75rem; color:#f59e0b; background:#fef3c7; padding:2px 6px; border-radius:4px;">Proposed</span>' : ''}
                </div>

                ${actionsHtml}
            `;
            return li;
        };

        let marCount = 0;
        let moocCount = 0;

        data.forEach(item => {
            if (item.category === 'mar') {
                marList.appendChild(createCard(item));
                marCount++;
            } else {
                moocList.appendChild(createCard(item));
                moocCount++;
            }
        });

        if (marCount === 0) marList.innerHTML = '<li style="text-align:center; padding:1rem; color:#64748b;">No MAR submissions found.</li>';
        if (moocCount === 0) moocList.innerHTML = '<li style="text-align:center; padding:1rem; color:#64748b;">No MOOC submissions found.</li>';

    } catch (error) {
        console.error(error);
        marList.innerHTML = '<li style="color:red; text-align:center;">Error loading data: ' + error.message + '</li>';
        moocList.innerHTML = '<li style="color:red; text-align:center;">Error loading data.</li>';
    }
}

// Helpers must be globally accessible for onclick events
window.toggleReject = (id) => {
    const box = document.getElementById(`reject-box-${id}`);
    box.style.display = box.style.display === 'none' ? 'block' : 'none';
};

window.updateStatus = async (id, status, remark = '') => {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        const res = await api.fetchWithAuth(`/mar-moocs/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status, remark })
        });

        if (res.ok) {
            alert(`Submission ${status}!`);
            loadSubmissions(user.token); // Refresh
        } else {
            alert('Update failed');
        }
    } catch (err) {
        console.error(err);
        alert('Error updating status');
    }
};

window.confirmReject = (id) => {
    const remark = document.getElementById(`remark-${id}`).value;
    if (!remark) return alert('Please enter a reason for rejection');
    updateStatus(id, 'Rejected', remark);
};
