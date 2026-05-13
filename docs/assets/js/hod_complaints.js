const BACKEND_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? `http://${window.location.hostname}:5000`
    : 'https://campuscare-backend-96cn.onrender.com';

const API_BASE = BACKEND_URL;
const API_URL = API_BASE + '/api/hod';

let allComplaints = [];

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadComplaints();
    
    const searchInput = document.getElementById('complaintSearch');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const filtered = allComplaints.filter(c => 
                c.title.toLowerCase().includes(term) || 
                (c.student && c.student.name.toLowerCase().includes(term))
            );
            renderComplaints(filtered);
        });
    }
});

async function loadComplaints() {
    const tableBody = document.getElementById('complaintsTableBody');
    const userStr = localStorage.getItem('user');
    if (!userStr) {
        window.location.href = '../login.html';
        return;
    }
    const user = JSON.parse(userStr);

    try {
        const response = await fetch(`${API_URL}/complaints?t=${Date.now()}`, {
            headers: { 'Authorization': `Bearer ${user.token}` }
        });

        if (!response.ok) throw new Error('Failed to fetch complaints');

        allComplaints = await response.json();
        renderComplaints(allComplaints);

    } catch (error) {
        console.error(error);
        if (tableBody) {
            tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:red; padding:2rem;">Error: ${error.message}</td></tr>`;
        }
    }
}

function renderComplaints(complaints) {
    const tableBody = document.getElementById('complaintsTableBody');
    if (!tableBody) return;

    if (complaints.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:3rem; color:#64748b;">No complaints available for your department.</td></tr>';
        return;
    }

    tableBody.innerHTML = complaints.map(c => {
        const isResolved = c.status === 'Resolved';
        const date = new Date(c.createdAt).toLocaleDateString();
        
        return `
        <tr style="border-bottom: 1px solid #f8fafc; transition: background 0.2s; cursor: pointer;" onmouseover="this.style.background='#fbfcfe'" onmouseout="this.style.background='transparent'">
            <td style="padding: 1rem 1.5rem;">
                <div style="font-weight: 700; color: #1e293b; font-size:0.95rem;">${c.student?.name || 'Anonymous'}</div>
                <div style="font-size: 0.75rem; color: #94a3b8; font-weight:600;">${c.student?.rollNumber || 'N/A'}</div>
            </td>
            <td style="padding: 1rem 1.5rem;">
                <div style="font-weight: 500; color: #334155; font-size:0.9rem;">${c.title}</div>
            </td>
            <td style="padding: 1rem 1.5rem;">
                <span class="badge ${getCategoryBadge(c.category)}" style="font-size:0.7rem; padding:4px 10px; border-radius:20px; font-weight:700; text-transform:uppercase;">${c.category}</span>
            </td>
            <td style="padding: 1rem 1.5rem; text-align:center;">
                <div style="display:flex; justify-content:center; gap:10px;">
                    <!-- Photo 1: Reported by Student -->
                    <div style="position:relative; width:45px; height:45px; border-radius:8px; overflow:hidden; border:1px solid #e2e8f0; background:#f8fafc;" title="Before">
                        ${c.image ? `
                            <img src="${API_BASE}${c.image}" style="width:100%; height:100%; object-fit:cover; cursor:pointer;" onclick="window.open(this.src)">
                        ` : `
                            <i class="fa-solid fa-image" style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); color:#cbd5e1; font-size:0.8rem;"></i>
                        `}
                    </div>
                    <!-- Photo 2: Resolution Proof -->
                    <div style="position:relative; width:45px; height:45px; border-radius:8px; overflow:hidden; border:${isResolved ? '2px solid #10b981' : '1px dashed #cbd5e1'}; background:${isResolved ? '#ecfdf5' : '#fff'};" title="After">
                        ${(c.resolutionImage || c.afterImage) ? `
                            <img src="${API_BASE}${c.resolutionImage || c.afterImage}" style="width:100%; height:100%; object-fit:cover; cursor:pointer;" onclick="window.open(this.src)">
                        ` : `
                            <i class="fa-solid fa-camera" style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); color:#cbd5e1; font-size:0.8rem;"></i>
                        `}
                    </div>
                </div>
            </td>
            <td style="padding: 1rem 1.5rem;">
                <span style="font-size: 0.7rem; font-weight: 800; color: white; background: ${getStatusColor(c.status)}; padding: 4px 10px; border-radius: 50px; text-transform: uppercase; letter-spacing: 0.02em;">
                    ${c.status}
                </span>
            </td>
            <td style="padding: 1rem 1.5rem;">
                ${!isResolved ? `
                    <button onclick="openResolveModal('${c._id}')" style="padding: 6px 12px; background: #3b82f6; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 0.8rem; font-weight: 600; display: flex; align-items: center; gap: 5px;">
                        <i class="fa-solid fa-check"></i> Resolve
                    </button>
                ` : `
                    <button onclick="openResolveModal('${c._id}', true)" style="padding: 6px 12px; background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; border-radius: 8px; cursor: pointer; font-size: 0.8rem; font-weight: 600;">
                        View Proof
                    </button>
                `}
            </td>
        </tr>
        `;
    }).join('');
}

// Resolution Modal Logic
function openResolveModal(id, viewOnly = false) {
    const complaint = allComplaints.find(c => c._id === id);
    if (!complaint) return;

    // Create Modal if not exists
    let modal = document.getElementById('resolveModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'resolveModal';
        modal.className = 'glass';
        modal.style = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:9999; display:none; align-items:center; justify-content:center; backdrop-filter:blur(5px);";
        document.body.appendChild(modal);
    }

    modal.innerHTML = `
        <div style="background:white; width:90%; max-width:500px; border-radius:24px; padding:2rem; box-shadow:0 25px 50px -12px rgba(0,0,0,0.25); position:relative; animation: modalPop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);">
            <button onclick="closeResolveModal()" style="position:absolute; top:20px; right:20px; background:none; border:none; font-size:1.5rem; color:#94a3b8; cursor:pointer;"><i class="fa-solid fa-times"></i></button>
            
            <h2 style="margin:0; color:#1e293b; font-size:1.5rem;">${viewOnly ? 'Resolution Proof' : 'Resolve Complaint'}</h2>
            <p style="color:#64748b; margin:10px 0 20px 0; font-size:0.9rem;">${complaint.title}</p>

            <div style="background:#f8fafc; padding:1.5rem; border-radius:16px; margin-bottom:1.5rem;">
                <div style="font-size:0.75rem; color:#94a3b8; font-weight:700; text-transform:uppercase; margin-bottom:10px;">Issue Description</div>
                <p style="margin:0; color:#334155; font-size:0.95rem; line-height:1.6;">${complaint.description}</p>
                ${complaint.image ? `
                    <div style="margin-top:15px;">
                        <div style="font-size:0.65rem; color:#94a3b8; font-weight:700; text-transform:uppercase; margin-bottom:5px;">Reported Photo</div>
                        <img src="${API_BASE}${complaint.image}" style="width:100%; height:150px; object-fit:cover; border-radius:12px; border:1px solid #e2e8f0; cursor:pointer;" onclick="window.open(this.src)">
                    </div>
                ` : ''}
            </div>

            ${viewOnly ? `
                <div style="background:#f0fdf4; border:2px solid #bbf7d0; padding:1.5rem; border-radius:16px;">
                    <div style="font-size:0.75rem; color:#166534; font-weight:700; text-transform:uppercase; margin-bottom:10px; display:flex; align-items:center; gap:5px;">
                        <i class="fa-solid fa-check-circle"></i> After Resolution
                    </div>
                    ${(complaint.resolutionImage || complaint.afterImage) ? `
                        <img src="${API_BASE}${complaint.resolutionImage || complaint.afterImage}" style="width:100%; height:200px; object-fit:cover; border-radius:12px; cursor:pointer;" onclick="window.open(this.src)">
                    ` : `
                        <div style="padding:20px; text-align:center; color:#166534; font-size:0.9rem;">No photo proof attached during resolution.</div>
                    `}
                </div>
            ` : `
                <div style="background:#eff6ff; border:2px dashed #3b82f6; padding:1.5rem; border-radius:16px;">
                    <div style="font-size:0.85rem; font-weight:700; color:#1e40af; margin-bottom:15px;">Upload Resolution Proof</div>
                    <input type="file" id="modal-proof-image" accept="image/*" onchange="previewModalImage(this)" style="width:100%; font-size:0.9rem;">
                    
                    <div id="modal-preview-container" style="margin-top:15px; display:none; position:relative;">
                        <img id="modal-preview-img" style="width:100%; height:150px; object-fit:cover; border-radius:12px; border:1px solid #bfdbfe;">
                        <p style="font-size:0.7rem; color:#3b82f6; margin-top:5px; text-align:center; font-weight:600;">Image Captured Ready</p>
                    </div>

                    <button onclick="confirmModalResolve('${id}')" style="width:100%; margin-top:20px; padding:12px; background:#10b981; color:white; border:none; border-radius:12px; cursor:pointer; font-weight:700; font-size:1rem; box-shadow:0 4px 12px rgba(16,185,129,0.2);">Confirm Resolution</button>
                </div>
            `}
        </div>
    `;

    modal.style.display = 'flex';
}

function closeResolveModal() {
    const modal = document.getElementById('resolveModal');
    if (modal) modal.style.display = 'none';
}

function previewModalImage(input) {
    const file = input.files[0];
    const previewContainer = document.getElementById('modal-preview-container');
    const previewImg = document.getElementById('modal-preview-img');

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

async function confirmModalResolve(id) {
    const fileInput = document.getElementById('modal-proof-image');
    const file = fileInput.files[0];

    if (!file) {
        alert('Please attach a proof image to confirm resolution.');
        return;
    }

    const formData = new FormData();
    formData.append('resolutionImage', file);

    try {
        const userStr = localStorage.getItem('user');
        const token = userStr ? JSON.parse(userStr).token : null;

        const res = await fetch(`${API_URL}/complaints/${id}/resolve`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });

        if (res.ok) {
            closeResolveModal();
            loadComplaints();
        } else {
            const data = await res.json();
            alert(data.message || 'Failed to resolve');
        }
    } catch (error) {
        console.error(error);
        alert('Server error');
    }
}

function getCategoryBadge(cat) {
    if (cat === 'Disciplinary') return 'badge-red';
    if (['Electrical', 'Sanitation', 'Civil'].includes(cat)) return 'badge-yellow';
    return 'badge-blue';
}

function getStatusColor(s) {
    if (s === 'Resolved') return '#10b981';
    if (s === 'In Progress') return '#3b82f6';
    if (s === 'Submitted') return '#3b82f6'; // Match the blue in your screenshot
    return '#64748b';
}

function checkAuth() {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
        window.location.href = '../login.html';
        return;
    }
    const user = JSON.parse(userStr);
    if (user.role !== 'hod' && user.role !== 'admin') {
        window.location.href = '../index.html';
        return;
    }

    const userNameEl = document.getElementById('userName');
    if (userNameEl) userNameEl.innerText = `Hello, ${user.name}`;

    window.toggleProfileMenu = function () {
        const menu = document.getElementById('profileMenu');
        if (menu) menu.style.display = menu.style.display === 'flex' ? 'none' : 'flex';
    }
    window.logout = function () {
        localStorage.clear();
        window.location.href = '../login.html';
    }
}

// Global Paste Support for Modal
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
        const fileInput = document.getElementById('modal-proof-image');
        if (fileInput && document.getElementById('resolveModal').style.display === 'flex') {
            const dataTransfer = new DataTransfer();
            const file = new File([imageFile], `resolve_paste_${Date.now()}.png`, { type: imageFile.type });
            dataTransfer.items.add(file);
            fileInput.files = dataTransfer.files;
            previewModalImage(fileInput);
        }
    }
});
