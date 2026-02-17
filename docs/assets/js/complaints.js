// Auth Check
const userStr = localStorage.getItem('user');
if (!userStr) window.location.href = '../login.html';
const user = JSON.parse(userStr);

document.addEventListener('DOMContentLoaded', () => {
    // 1. File Complaint Listener
    const complaintForm = document.getElementById('complaintForm');
    if (complaintForm) {
        complaintForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = complaintForm.querySelector('button');
            const originalText = btn.innerText;
            btn.innerText = "Processing AI Analysis...";
            btn.disabled = true;

            const fileInput = document.getElementById('attachment');
            let attachmentData = null;

            // Simple File Read if present
            if (fileInput.files.length > 0) {
                const file = fileInput.files[0];
                // For MVP: We won't actually upload to S3, just mock it or send filename
                attachmentData = {
                    name: file.name,
                    size: file.size,
                    type: file.type
                };
            }

            const data = {
                title: document.getElementById('title').value,
                description: document.getElementById('description').value,
                studentId: user._id,
                attachment: attachmentData
            };

            try {
                const res = await api.post('/complaints', data);
                if (res.complaint) {
                    // Show AI Result
                    alert(` Filed! \n${res.aiNote}`);
                    complaintForm.reset();
                    loadComplaints(); // Refresh wall
                } else {
                    alert('Error filing complaint');
                }
            } catch (err) {
                console.error(err);
                alert('Connection Failed');
            } finally {
                btn.innerText = originalText;
                btn.disabled = false;
            }
        });
    }

    // 2. Load Public Wall
    loadComplaints();

    // 3. Logout Logic
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('user');
            window.location.href = '../index.html';
        });
    }
});

async function loadComplaints() {
    const list = document.getElementById('complaint-list-full');
    if (!list) return;

    try {
        const response = await fetch('http://localhost:5000/api/complaints');

        if (!response.ok) {
            throw new Error(`Server Error: ${response.status}`);
        }

        const complaints = await response.json();

        if (complaints.length === 0) {
            list.innerHTML = '<p style="text-align:center; padding:2rem;">No complaints found.</p>';
            return;
        }

        let html = '';
        complaints.forEach(c => {
            // Priority Badge Color
            let badgeClass = 'bg-blue-100 text-blue-800';
            if (c.priority === 'High') badgeClass = 'bg-orange-100 text-orange-800';
            if (c.priority === 'Urgent') badgeClass = 'bg-red-100 text-red-800';

            // Status Color Logic
            let statusColor = 'text-gray-500';
            let statusText = c.status ? c.status.toUpperCase() : 'UNKNOWN';

            if (c.status === 'Resolved') {
                statusColor = 'text-green-600 font-bold';
            } else if (c.status === 'In Progress') {
                statusColor = 'text-yellow-600 font-bold';
            } else if (c.status === 'Submitted' || c.status === 'Pending') {
                statusColor = 'text-red-600 font-bold';
            }

            // Upvote Logic Check
            const upvotedBy = Array.isArray(c.upvotedBy) ? c.upvotedBy : [];
            const isLiked = user && user._id && upvotedBy.includes(user._id);
            const likeColor = isLiked ? '#3b82f6' : '#64748b'; // Blue if liked, Gray if not
            const cursorStyle = isLiked ? 'default' : 'pointer';
            const clickAction = isLiked ? '' : `onclick="upvote('${c._id}')"`;

            html += `
                <div class="glass" style="padding:1.5rem; border-radius:15px; margin-bottom:1.5rem;">
                    <div style="display:flex; justify-content:space-between; align-items:start;">
                        <div>
                            <span class="badge ${badgeClass}" style="padding:4px 8px; border-radius:8px; font-size:0.75rem; font-weight:bold; text-transform:uppercase;">${c.priority} Priority</span>
                            <span style="font-size:0.8rem; color:#64748b; margin-left:8px;">${c.category}</span>
                            <h3 style="margin:0.8rem 0 0.5rem; font-size:1.2rem;">${c.title}</h3>
                        </div>
                        <div class="${statusColor}" style="font-size:0.85rem;">
                            <i class="fa-solid fa-circle" style="font-size:0.5rem; vertical-align:middle; margin-right:4px;"></i> ${statusText}
                        </div>
                    </div>
                    
                    <p style="color:#475569; font-size:0.95rem; line-height:1.5;">${c.description}</p>
                    
                    <div style="margin-top:1rem; border-top:1px solid rgba(0,0,0,0.05); padding-top:0.8rem; display:flex; justify-content:space-between; font-size:0.85rem; color:#94a3b8;">
                        <span><i class="fa-solid fa-user"></i> ${c.student?.name || 'Anonymous'}</span>
                        <div style="display:flex; align-items:center; gap:15px;">
                            <span>${new Date(c.createdAt).toLocaleDateString()}</span>
                            <button ${clickAction ? `onclick="upvote('${c._id}', this)"` : ''} style="background:none; border:none; color:${likeColor}; cursor:${cursorStyle};">
                                <i class="fa-solid fa-thumbs-up"></i> ${c.upvotes}
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
        list.innerHTML = html;

    } catch (err) {
        console.error("Failed to load complaints:", err);
        list.innerHTML = `
            <div style="text-align:center; padding:2rem; color:#ef4444;">
                <i class="fa-solid fa-server" style="font-size:2rem; margin-bottom:1rem;"></i>
                <p><strong>Connection Error</strong></p>
                <p style="font-size:0.9rem;">Could not fetch live complaints. Ensure server is running.</p>
            </div>
        `;
    }
}

async function upvote(id, btnElement) {
    const userStr = localStorage.getItem('user');
    if (!userStr) return;
    const user = JSON.parse(userStr);

    try {
        const res = await fetch(`http://localhost:5000/api/complaints/${id}/upvote`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`
            }
        });

        if (res.ok) {
            const data = await res.json();

            // Update the button that was clicked
            // If btnElement is passed, use it. Otherwise find it.
            let btn = btnElement;
            if (!btn) {
                // Fallback selector
                // Since we don't have unique IDs on buttons in the loop in complaints.js aside from the generic structure
                // We might need to select via onclick attribute if possible, or rely on passing 'this'
                btn = document.querySelector(`button[onclick="upvote('${id}')"]`);
            }

            if (btn) {
                if (data.action === 'added') {
                    btn.style.color = '#3b82f6';
                    btn.innerHTML = `<i class="fa-solid fa-thumbs-up"></i> ${data.upvotes}`;
                } else {
                    btn.style.color = '#64748b'; // Gray
                    btn.innerHTML = `<i class="fa-solid fa-thumbs-up"></i> ${data.upvotes}`;
                }
                // Ensure click is NOT disabled
                btn.onclick = function () { upvote(id, this); };
                btn.style.cursor = 'pointer';
            }
        } else {
            const err = await res.json();
            alert(err.message || "Failed to upvote");
        }
    } catch (e) { console.error(e); }
}

function goToDashboard() {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
        window.location.href = '../login.html';
        return;
    }
    const user = JSON.parse(userStr);
    const role = (user.role || '').toLowerCase();

    if (role === 'student') window.location.href = '../student/index.html';
    else if (role === 'teacher') window.location.href = '../teacher/index.html';
    else if (role === 'hosteler') window.location.href = '../hostel/index.html';
    else window.location.href = '../index.html';
}
