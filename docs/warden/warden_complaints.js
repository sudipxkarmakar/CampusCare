
const BACKEND_PORT = 5000;
const BACKEND_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? `${window.location.protocol}//${window.location.hostname}:${BACKEND_PORT}`
    : 'https://campuscare-backend-96cn.onrender.com';
const API_BASE_URL = BACKEND_URL + '/api';

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

        const res = await fetch(`${API_BASE_URL}/warden/complaints?t=${Date.now()}`, {
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
                
                <div class="complaint-images-container">
                    ${c.image ? `
                        <div class="image-section">
                            <div class="image-label"><i class="fa-solid fa-camera"></i> Reported Issue</div>
                            <img src="${BACKEND_URL}${c.image}" class="complaint-img" onclick="window.open(this.src)">
                        </div>
                    ` : ''}
                    ${isResolved ? `
                        <div class="image-section" style="border-color: #10b981; background: rgba(16, 185, 129, 0.05);">
                            <div class="image-label" style="color:#10b981;"><i class="fa-solid fa-circle-check"></i> Resolved Proof</div>
                            ${(c.resolutionImage || c.afterImage) ? `
                                <img src="${BACKEND_URL}${c.resolutionImage || c.afterImage}" class="complaint-img" onclick="window.open(this.src)">
                            ` : `
                                <div style="height:120px; display:flex; flex-direction:column; align-items:center; justify-content:center; color:#059669; font-size:0.75rem; font-weight:600; text-align:center; gap:5px; background:#fff; border-radius:8px;">
                                    <i class="fa-solid fa-image-slash" style="font-size:1.2rem; opacity:0.5;"></i>
                                    <span>No proof image attached</span>
                                </div>
                            `}
                        </div>
                    ` : ''}
                </div>
            </div>
            <div class="complaint-actions">
                ${!isResolved && !isUplifted ? `
                    <button class="btn-action resolve" id="resolve-btn-${c._id}" onclick="showResolveUI('${c._id}')">
                        <i class="fa-solid fa-check"></i> Resolve
                    </button>
                    <div id="resolve-ui-${c._id}" class="resolve-upload-container">
                        <div class="image-label">Upload Proof of Work</div>
                        <div class="file-input-wrapper">
                            <input type="file" id="proof-image-${c._id}" accept="image/*" onchange="previewResolveImage(this, '${c._id}')">
                        </div>
                        <!-- Preview Container -->
                        <div id="preview-container-${c._id}" style="margin-top:10px; display:none;">
                            <img id="preview-img-${c._id}" style="width:100px; height:70px; object-fit:cover; border-radius:5px; border:1px solid #ddd;">
                            <div style="font-size:0.6rem; color:#64748b;">Image Attached</div>
                        </div>

                        <button class="confirm-resolve-btn" onclick="confirmResolve('${c._id}')">
                            Confirm Resolution
                        </button>
                        <button class="btn-secondary" style="width:100%; margin-top:5px;" onclick="hideResolveUI('${c._id}')">Cancel</button>
                    </div>
                ` : `<button class="btn-secondary" disabled>Issue Resolved</button>`}
            </div>
        `;
        list.appendChild(div);
    });
}

function previewResolveImage(input, id) {
    const file = input.files[0];
    const previewContainer = document.getElementById(`preview-container-${id}`);
    const previewImg = document.getElementById(`preview-img-${id}`);

    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            previewImg.src = e.target.result;
            previewContainer.style.display = 'block';
        };
        reader.readAsDataURL(file);
    } else {
        previewContainer.style.display = 'none';
    }
}

function showResolveUI(id) {
    document.getElementById(`resolve-ui-${id}`).classList.add('active');
    document.getElementById(`resolve-btn-${id}`).style.display = 'none';
}

function hideResolveUI(id) {
    document.getElementById(`resolve-ui-${id}`).classList.remove('active');
    document.getElementById(`resolve-btn-${id}`).style.display = 'inline-flex';
}

async function confirmResolve(id) {
    const fileInput = document.getElementById(`proof-image-${id}`);
    const file = fileInput.files[0];

    if (!file) {
        if (!confirm('Resolve without proof image? (Recommended to upload proof)')) return;
    } else {
        console.log('DEBUG: File to upload:', file.name, file.size);
    }

    const formData = new FormData();
    if (file) {
        formData.append('resolutionImage', file);
        console.log('DEBUG: FormData created with field: resolutionImage');
        console.log('- File Name:', file.name);
        console.log('- File Size:', file.size);
    } else {
        alert('Please attach a proof image before confirming.');
        return;
    }

    try {
        const userStr = localStorage.getItem('user');
        const token = userStr ? JSON.parse(userStr).token : null;

        console.log('DEBUG: Sending PUT request to resolution endpoint...');

        const res = await fetch(`${API_BASE_URL}/warden/complaints/${id}/resolve`, {
            method: 'PUT',
            headers: { 
                'Authorization': `Bearer ${token}`
                // Note: Content-Type is NOT set manually to allow browser to set boundary
            },
            body: formData
        });

        if (res.ok) {
            const data = await res.json();
            console.log('DEBUG: Resolve Success. Data received:', data);
            
            // If the server didn't return an afterImage, something is wrong on the backend
            if (!data.afterImage) {
                console.error('DEBUG: WARNING! Server returned Resolve success but NO afterImage was in the response.');
            }

            console.log('Refreshing list in 1500ms (ensuring DB propagation)...');
            setTimeout(() => fetchComplaints(), 1500);
        } else {
            const data = await res.json();
            console.error('DEBUG: Resolve Failed:', data);
            alert(data.message || 'Failed to resolve');
        }
    } catch (error) {
        console.error(error);
        alert('Server error resolving complaint');
    }
}

// Global Paste Listener for Resolution Proof
document.addEventListener('paste', (e) => {
    const items = (e.clipboardData || e.originalEvent.clipboardData).items;
    let imageFile = null;

    for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') === 0) {
            imageFile = items[i].getAsFile();
            break;
        }
    }

    if (imageFile) {
        // Find the active/visible resolve UI
        const activeResolveUI = document.querySelector('.resolve-upload-container.active');
        if (activeResolveUI) {
            const id = activeResolveUI.id.replace('resolve-ui-', '');
            const fileInput = document.getElementById(`proof-image-${id}`);
            
            if (fileInput) {
                const dataTransfer = new DataTransfer();
                const file = new File([imageFile], `resolve_proof_${Date.now()}.png`, { type: imageFile.type });
                dataTransfer.items.add(file);
                fileInput.files = dataTransfer.files;
                
                // Trigger preview
                previewResolveImage(fileInput, id);
                
                // Optional: visual feedback
                console.log('Image pasted successfully into:', id);
            }
        }
    }
});

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
    if (s === 'Resolved') return '#10b981'; // Green
    if (s === 'In Progress' || s === 'Under Progress' || s === 'Escalated') return '#3b82f6'; // Blue
    if (s === 'Submitted' || s === 'Unresolved' || s === 'Reported' || s === 'Pending') return '#ef4444'; // Red
    return '#ef4444';
}

// Old resolveComplaint kept as fallback or removed
async function resolveComplaint(id) {
    // Redirect to show UI
    showResolveUI(id);
}


