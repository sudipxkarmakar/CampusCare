// Auth Check
const userStr = localStorage.getItem('user');
if (!userStr) window.location.href = '../login.html';
const user = JSON.parse(userStr);

document.addEventListener('DOMContentLoaded', () => {
    // 1. File Complaint Listener
    const complaintForm = document.getElementById('complaintForm');
    
    if (complaintForm) {
        // Auto-fill from Chatbot Redirect
        const draftTitle = sessionStorage.getItem('aiDraftTitle');
        const draftDesc = sessionStorage.getItem('aiDraftDesc');
        if (draftTitle && draftDesc) {
            document.getElementById('title').value = draftTitle;
            document.getElementById('description').value = draftDesc;
            sessionStorage.removeItem('aiDraftTitle');
            sessionStorage.removeItem('aiDraftDesc');
        }

        complaintForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = complaintForm.querySelector('button');
            const originalText = btn.innerText;
            btn.innerText = "Processing AI Analysis...";
            btn.disabled = true;

            const fileInput = document.getElementById('attachment');

            const formData = new FormData();
            formData.append('title', document.getElementById('title').value);
            formData.append('description', document.getElementById('description').value);
            formData.append('studentId', user._id);

            // Append File if present
            if (fileInput.files.length > 0) {
                formData.append('image', fileInput.files[0]);
            }

            try {
                // We use fetchWithAuth but handle the options properly for FormData.
                // FormData automatically sets the correct Content-Type with boundary.
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname === "" || window.location.protocol === 'file:';
        const API_BASE = (isLocal ? 'http://localhost:5000' : 'https://campuscare-backend-96cn.onrender.com');
                const res = await fetch(`${API_BASE}/api/complaints`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${user.token || localStorage.getItem('token')}`
                    },
                    body: formData
                }).then(r => r.json());
                if (res.complaint) {
                    // Show AI Result
                    alert(` Filed! \n${res.aiNote}`);
                    complaintForm.reset();
                    clearImagePreview();
                    loadComplaints(); // Refresh wall
                } else {
                    alert('Error filing complaint: ' + (res.message || JSON.stringify(res)));
                    console.error('Backend Response:', res);
                }
            } catch (err) {
                console.error(err);
                alert('Connection Failed');
            } finally {
                btn.innerText = originalText;
                btn.disabled = false;
            }
        });

        // Image Preview and Paste Logic
        const fileInput = document.getElementById('attachment');
        const previewContainer = document.getElementById('imagePreviewContainer');
        const previewImg = document.getElementById('imagePreview');
        const removeBtn = document.getElementById('removeAttachmentBtn');

        function clearImagePreview() {
            fileInput.value = ''; // Clear the input
            previewImg.src = '';
            if (previewContainer) previewContainer.style.display = 'none';
        }

        function handleImageSelection(file) {
            if (!file || !file.type.startsWith('image/')) return;
            
            const reader = new FileReader();
            reader.onload = function(e) {
                previewImg.src = e.target.result;
                if (previewContainer) previewContainer.style.display = 'block';
            };
            reader.readAsDataURL(file);
        }

        if (fileInput) {
            fileInput.addEventListener('change', function() {
                if (this.files && this.files.length > 0) {
                    handleImageSelection(this.files[0]);
                } else {
                    clearImagePreview();
                }
            });
        }

        if (removeBtn) {
            removeBtn.addEventListener('click', clearImagePreview);
        }

        // Handle Paste Events globally within the form area
        document.addEventListener('paste', function(e) {
            // Only handle paste if the complaint form is visible (this script is used on the complaints page)
            if (!complaintForm) return;

            const items = (e.clipboardData || e.originalEvent.clipboardData).items;
            let imageFile = null;

            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') === 0) {
                    imageFile = items[i].getAsFile();
                    break;
                }
            }

            if (imageFile && fileInput) {
                // Create a new FileList containing the pasted file
                const dataTransfer = new DataTransfer();
                // Add a default name for pasted images if it doesn't have a good one
                const file = new File([imageFile], `pasted_image_${Date.now()}.png`, { type: imageFile.type });
                dataTransfer.items.add(file);
                fileInput.files = dataTransfer.files;
                
                // Manually trigger the preview
                handleImageSelection(file);
            }
        });
    }

    // 2. Load Public Wall (Default)
    loadComplaints();

    // Init Tab Styles
    const tabPublic = document.getElementById('tab-public');
    if (tabPublic) {
        tabPublic.style.background = '#2d3748';
        tabPublic.style.color = '#fff';
    }

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

async function aiAutoFillComplaint() {
    const promptText = prompt("What is your complaint about? (e.g. 'Ragging by 3rd years in hostel')");
    if (!promptText) return;

    const userStr = localStorage.getItem('user');
    if (!userStr) return;
    const userObj = JSON.parse(userStr);
    const token = userObj.token || localStorage.getItem('token');

    // Show loading text in inputs
    const titleEl = document.getElementById('title');
    const descEl = document.getElementById('description');
    
    titleEl.value = "AI is drafting...";
    descEl.value = "Please wait...";

    try {
        const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:5000' : 'https://campuscare-backend-96cn.onrender.com');
        const response = await fetch(`${API_BASE}/api/ai/generate-complaint`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ prompt: promptText })
        });

        if (!response.ok) throw new Error("Failed to generate draft");
        
        const data = await response.json();
        titleEl.value = data.title || "";
        descEl.value = data.description || "";
    } catch (err) {
        console.error(err);
        alert("AI could not generate draft.");
        titleEl.value = "";
        descEl.value = "";
    }
}

async function loadComplaints() {
    const list = document.getElementById('complaint-list-full');
    if (!list) return;

    try {
        const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:5000' : 'https://campuscare-backend-96cn.onrender.com');
        const response = await fetch(`${API_BASE}/api/complaints`);

        if (!response.ok) {
            throw new Error(`Server Error: ${response.status}`);
        }

        let complaints = await response.json();

        // PRIVACY FILTER: Show all non-personal, BUT only show 'Personal' if it belongs to the logged-in user
        const userStrFilter = localStorage.getItem('user');
        const userFilterObj = userStrFilter ? JSON.parse(userStrFilter) : null;
        
        complaints = complaints.filter(c => {
            if (c.category !== 'Personal') return true;
            // For populated student object or raw string ID
            const studentId = c.student && c.student._id ? c.student._id : c.student;
            if (userFilterObj && studentId === userFilterObj._id) return true;
            return false;
        });

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
            const cursorStyle = 'pointer'; // Always clickable for toggle

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
                    <div class="complaint-images-container" style="display:flex; gap:10px; margin-top:10px;">
                        ${c.image ? `
                            <div class="image-section" style="width: 150px; background:rgba(255,255,255,0.3); padding:8px; border-radius:10px;">
                                <div class="image-label" style="font-size:0.65rem; color:#64748b; font-weight:700; text-transform:uppercase; margin-bottom:5px;">Reported Issue</div>
                                <img src="${API_BASE}${c.image}" class="complaint-img" style="height: 100px;" alt="Before" onclick="window.open(this.src)">
                            </div>
                        ` : ''}
                        ${c.afterImage ? `
                            <div class="image-section" style="width: 150px; background:rgba(16,185,129,0.1); padding:8px; border-radius:10px;">
                                <div class="image-label" style="font-size:0.65rem; color:#059669; font-weight:700; text-transform:uppercase; margin-bottom:5px;">Resolved Proof</div>
                                <img src="${API_BASE}${c.afterImage}" class="complaint-img" style="height: 100px;" alt="After" onclick="window.open(this.src)">
                            </div>
                        ` : ''}
                    </div>
                    
                    <div style="margin-top:1rem; border-top:1px solid rgba(0,0,0,0.05); padding-top:0.8rem; display:flex; justify-content:space-between; font-size:0.85rem; color:#94a3b8;">
                        <span><i class="fa-solid fa-user"></i> ${c.student?.name || 'Anonymous'}</span>
                        <div style="display:flex; align-items:center; gap:15px;">
                            <span>${new Date(c.createdAt).toLocaleDateString()}</span>
                            <button id="like-btn-${c._id}" onclick="upvote('${c._id}', this)" style="background:none; border:none; color:${likeColor}; cursor:${cursorStyle};">
                                <i class="fa-solid fa-thumbs-up"></i> <span id="count-${c._id}">${c.upvotes}</span>
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
        const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:5000' : 'https://campuscare-backend-96cn.onrender.com');
        const res = await fetch(`${API_BASE}/api/complaints/${id}/upvote`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`
            }
        });

        if (res.ok) {
            const data = await res.json();

            // Update Count
            const countSpan = document.getElementById(`count-${id}`);
            if (countSpan) countSpan.innerText = data.upvotes;

            // Update Button Style
            const btn = document.getElementById(`like-btn-${id}`) || btnElement;

            if (btn) {
                if (data.action === 'added') {
                    btn.style.color = '#3b82f6';
                } else {
                    btn.style.color = '#64748b';
                }
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
        const path = window.location.pathname;
        const isSub = path.includes('/student/') || path.includes('/teacher/') || path.includes('/hostel/') || path.includes('/complaints/') || path.includes('/warden/') || path.includes('/principal/');
        window.location.href = isSub ? '../login.html' : 'login.html';
        return;
    }
    const user = JSON.parse(userStr);
    const role = (user.role || '').toLowerCase();
    const path = window.location.pathname;
    const isSub = path.includes('/student/') || path.includes('/teacher/') || path.includes('/hostel/') || path.includes('/complaints/') || path.includes('/warden/') || path.includes('/principal/');
    const base = isSub ? '../' : '';

    if (role === 'student') window.location.href = base + 'student/index.html';
    else if (role === 'warden') window.location.href = base + 'warden/index.html';
    else if (role === 'principal' || role === 'dean') window.location.href = base + 'principal/index.html';
    else if (role === 'teacher' || role === 'hod') window.location.href = base + 'teacher/index.html';
    else if (role === 'hosteler') window.location.href = base + 'hostel/index.html';
    else window.location.href = base + 'index.html';
}

// --- TAB SWITCHING LOGIC ---
window.switchTab = function (tab) {
    const tabPublic = document.getElementById('tab-public');
    const tabMy = document.getElementById('tab-my');
    const viewPublic = document.getElementById('view-public');
    const viewMy = document.getElementById('view-my');

    if (tab === 'public') {
        tabPublic.style.background = '#2d3748'; // Active Dark
        tabPublic.style.color = '#fff';
        tabMy.style.background = 'rgba(255,255,255,0.5)';
        tabMy.style.color = '#64748b';

        viewPublic.style.display = 'block';
        viewMy.style.display = 'none';
    } else {
        tabMy.style.background = '#2d3748'; // Active Dark
        tabMy.style.color = '#fff';
        tabPublic.style.background = 'rgba(255,255,255,0.5)';
        tabPublic.style.color = '#64748b';

        viewPublic.style.display = 'none';
        viewMy.style.display = 'block';

        // Load My Complaints on first switch (or every time)
        loadMyComplaints();
    }
};

async function loadMyComplaints() {
    const list = document.getElementById('complaint-list-my');
    if (!list) return;

    const userStr = localStorage.getItem('user');
    if (!userStr) return;
    const user = JSON.parse(userStr);
    const token = localStorage.getItem('token') || user.token;

    try {
        const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:5000' : 'https://campuscare-backend-96cn.onrender.com');
        const response = await fetch(`${API_BASE}/api/complaints/my`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Failed to fetch personal complaints');
        const complaints = await response.json();

        if (complaints.length === 0) {
            list.innerHTML = '<p style="text-align:center; padding:2rem;">You haven\'t filed any complaints yet.</p>';
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

            // Privacy Badge
            let privacyBadge = '';
            if (c.category === 'Personal') {
                privacyBadge = '<span style="background:#f3e8ff; color:#6b21a8; padding:4px 8px; border-radius:8px; font-size:0.75rem; font-weight:bold; margin-left:8px;"><i class="fa-solid fa-lock"></i> PRIVATE</span>';
            }

            // Upvote Logic Check
            const upvotedBy = Array.isArray(c.upvotedBy) ? c.upvotedBy : [];
            const isLiked = user && user._id && upvotedBy.includes(user._id);
            const likeColor = isLiked ? '#3b82f6' : '#64748b';
            const cursorStyle = 'pointer';

            html += `
                 <div class="glass" style="padding:1.5rem; border-radius:15px; margin-bottom:1.5rem; border-left: 5px solid ${c.category === 'Personal' ? '#9333ea' : 'transparent'};">
                     <div style="display:flex; justify-content:space-between; align-items:start;">
                         <div>
                             <span class="badge ${badgeClass}" style="padding:4px 8px; border-radius:8px; font-size:0.75rem; font-weight:bold; text-transform:uppercase;">${c.priority} Priority</span>
                             <span style="font-size:0.8rem; color:#64748b; margin-left:8px;">${c.category}</span>
                             ${privacyBadge}
                             <h3 style="margin:0.8rem 0 0.5rem; font-size:1.2rem;">${c.title}</h3>
                         </div>
                         <div class="${statusColor}" style="font-size:0.85rem;">
                             <i class="fa-solid fa-circle" style="font-size:0.5rem; vertical-align:middle; margin-right:4px;"></i> ${statusText}
                         </div>
                     </div>
                     
                     <p style="color:#475569; font-size:0.95rem; line-height:1.5;">${c.description}</p>
                     <div class="complaint-images-container" style="display:flex; gap:10px; margin-top:10px;">
                        ${c.image ? `
                            <div class="image-section" style="width: 150px; background:rgba(255,255,255,0.3); padding:8px; border-radius:10px;">
                                <div class="image-label" style="font-size:0.65rem; color:#64748b; font-weight:700; text-transform:uppercase; margin-bottom:5px;">Reported Issue</div>
                                <img src="${API_BASE}${c.image}" class="complaint-img" style="height: 100px;" alt="Before" onclick="window.open(this.src)">
                            </div>
                        ` : ''}
                        ${c.afterImage ? `
                            <div class="image-section" style="width: 150px; background:rgba(16,185,129,0.1); padding:8px; border-radius:10px;">
                                <div class="image-label" style="font-size:0.65rem; color:#059669; font-weight:700; text-transform:uppercase; margin-bottom:5px;">Resolved Proof</div>
                                <img src="${API_BASE}${c.afterImage}" class="complaint-img" style="height: 100px;" alt="After" onclick="window.open(this.src)">
                            </div>
                        ` : ''}
                    </div>
                     
                     <div style="margin-top:1rem; border-top:1px solid rgba(0,0,0,0.05); padding-top:0.8rem; display:flex; justify-content:space-between; font-size:0.85rem; color:#94a3b8;">
                         <span><i class="fa-solid fa-calendar"></i> ${new Date(c.createdAt).toLocaleDateString()}</span>
                         <button id="like-btn-${c._id}" onclick="upvote('${c._id}', this)" style="background:none; border:none; color:${likeColor}; cursor:${cursorStyle};">
                             <i class="fa-solid fa-thumbs-up"></i> <span id="count-${c._id}">${c.upvotes || 0}</span> Upvotes
                         </button>
                     </div>
                     ${c.aiFeedback ? `<div style="margin-top:10px; background:#f0f9ff; padding:10px; border-radius:8px; font-size:0.85rem; color:#0369a1;"><i class="fa-solid fa-robot"></i> <strong>AI Note:</strong> ${c.aiFeedback}</div>` : ''}
                 </div>
             `;
        });
        list.innerHTML = html;

    } catch (error) {
        console.error(error);
        list.innerHTML = '<p style="text-align:center; color:red;">Failed to load your complaints.</p>';
    }
}
