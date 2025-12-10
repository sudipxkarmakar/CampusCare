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
                    alert(`✅ Filed! \n${res.aiNote}`);
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
    const list = document.getElementById('complaint-list');
    if (!list) return;

    try {
        const response = await fetch('http://localhost:5000/api/complaints');
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

            // Status Badge
            let statusColor = 'text-gray-500';
            if (c.status === 'Resolved') statusColor = 'text-green-600 font-bold';

            html += `
                <div class="glass" style="padding:1.5rem; border-radius:15px; margin-bottom:1.5rem;">
                    <div style="display:flex; justify-content:space-between; align-items:start;">
                        <div>
                            <span class="badge ${badgeClass}" style="padding:4px 8px; border-radius:8px; font-size:0.75rem; font-weight:bold; text-transform:uppercase;">${c.priority} Priority</span>
                            <span style="font-size:0.8rem; color:#64748b; margin-left:8px;">${c.category}</span>
                            <h3 style="margin:0.8rem 0 0.5rem; font-size:1.2rem;">${c.title}</h3>
                        </div>
                        <div class="${statusColor}" style="font-size:0.85rem;">
                            ${c.status.toUpperCase()}
                        </div>
                    </div>
                    
                    <p style="color:#475569; font-size:0.95rem; line-height:1.5;">${c.description}</p>
                    
                    <div style="margin-top:1rem; border-top:1px solid rgba(0,0,0,0.05); padding-top:0.8rem; display:flex; justify-content:space-between; font-size:0.85rem; color:#94a3b8;">
                        <span><i class="fa-solid fa-user"></i> ${c.student?.name || 'Anonymous'}</span>
                        <div style="display:flex; align-items:center; gap:15px;">
                            <span>${new Date(c.createdAt).toLocaleDateString()}</span>
                            <button onclick="upvote('${c._id}')" style="background:none; border:none; color:#64748b; cursor:pointer;">
                                <i class="fa-solid fa-thumbs-up"></i> ${c.upvotes}
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
        list.innerHTML = html;

    } catch (err) {
        console.warn("Using Mock Complaints Data (Server Offline)");
        const mockComplaints = [
            {
                priority: 'High',
                category: 'Electrical',
                title: 'Sparking socket in Room 302',
                status: 'Pending',
                description: 'The main switchboard is sparking whenever the fan is turned on. Dangerous!',
                student: { name: 'Rahul Verma' },
                createdAt: new Date().toISOString(),
                upvotes: 5
            },
            {
                priority: 'Medium',
                category: 'Hygiene',
                title: 'Water cooler not clean',
                status: 'Resolved',
                description: 'The second floor water cooler has algae growth. Please clean it.',
                student: { name: 'Amit Singh' },
                createdAt: new Date(Date.now() - 86400000).toISOString(),
                upvotes: 12
            },
            {
                priority: 'Low',
                category: 'Furniture',
                title: 'Broken chair',
                status: 'Pending',
                description: 'One chair leg is loose in the common room.',
                student: { name: 'Priya D.' },
                createdAt: new Date(Date.now() - 172800000).toISOString(),
                upvotes: 2
            }
        ];

        // Render Mock Data
        let html = '';
        mockComplaints.forEach(c => {
            let badgeClass = 'bg-blue-100 text-blue-800';
            if (c.priority === 'High') badgeClass = 'bg-orange-100 text-orange-800';
            if (c.priority === 'Urgent') badgeClass = 'bg-red-100 text-red-800';

            let statusColor = 'text-gray-500';
            if (c.status === 'Resolved') statusColor = 'text-green-600 font-bold';

            html += `
                <div class="glass" style="padding:1.5rem; border-radius:15px; margin-bottom:1.5rem;">
                    <div style="display:flex; justify-content:space-between; align-items:start;">
                        <div>
                            <span class="badge ${badgeClass}" style="padding:4px 8px; border-radius:8px; font-size:0.75rem; font-weight:bold; text-transform:uppercase;">${c.priority} Priority</span>
                            <span style="font-size:0.8rem; color:#64748b; margin-left:8px;">${c.category}</span>
                            <h3 style="margin:0.8rem 0 0.5rem; font-size:1.2rem;">${c.title}</h3>
                        </div>
                        <div class="${statusColor}" style="font-size:0.85rem;">
                            ${c.status.toUpperCase()}
                        </div>
                    </div>
                    
                    <p style="color:#475569; font-size:0.95rem; line-height:1.5;">${c.description}</p>
                    
                    <div style="margin-top:1rem; border-top:1px solid rgba(0,0,0,0.05); padding-top:0.8rem; display:flex; justify-content:space-between; font-size:0.85rem; color:#94a3b8;">
                        <span><i class="fa-solid fa-user"></i> ${c.student?.name || 'Anonymous'}</span>
                        <div style="display:flex; align-items:center; gap:15px;">
                            <span>${new Date(c.createdAt).toLocaleDateString()}</span>
                            <button onclick="upvote('${c._id || 'mock'}')" style="background:none; border:none; color:#64748b; cursor:pointer;">
                                <i class="fa-solid fa-thumbs-up"></i> ${c.upvotes}
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
        list.innerHTML = html;
    }
}

async function upvote(id) {
    try {
        await fetch(`http://localhost:5000/api/complaints/${id}/upvote`, { method: 'PUT' });
        loadComplaints();
    } catch (e) { console.error(e); }
}
