
const API_URL = 'http://localhost:5000/api/documents';

// Run on load
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadDocuments();
    setupUploadForm();
});

function checkAuth() {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
        window.location.href = '../login.html';
        return;
    }
    const user = JSON.parse(userStr);
    // document.getElementById('userName').innerText = `Hello, ${user.name.split(' ')[0]}`; // Handled by header.js or manually
}

async function loadDocuments() {
    const listContainer = document.querySelector('.doc-section ul');
    if (!listContainer) return;

    try {
        const user = JSON.parse(localStorage.getItem('user'));
        const response = await fetch(API_URL, {
            headers: { 'Authorization': `Bearer ${user.token}` }
        });

        if (!response.ok) throw new Error('Failed to fetch documents');
        const documents = await response.json();

        if (documents.length === 0) {
            listContainer.innerHTML = '<li style="padding:1rem; text-align:center; color:#64748b;">No documents found. Upload one!</li>';
            return;
        }

        listContainer.innerHTML = documents.map(doc => {
            const date = new Date(doc.createdAt).toLocaleDateString();

            // Icon mapping based on Type or Filename
            let iconClass = 'fa-file';
            let iconColor = '#64748b';

            if (doc.type === 'Marksheet') { iconClass = 'fa-graduation-cap'; iconColor = '#8b5cf6'; }
            else if (doc.type === 'Certificate') { iconClass = 'fa-certificate'; iconColor = '#eab308'; }
            else if (doc.type === 'Identity Proof') { iconClass = 'fa-id-card'; iconColor = '#3b82f6'; }
            else if (doc.fileUrl.endsWith('.pdf')) { iconClass = 'fa-file-pdf'; iconColor = '#ef4444'; }
            else { iconClass = 'fa-image'; iconColor = '#10b981'; }

            return `
            <li class="list-row-hover" style="padding: 1rem; border-bottom: 1px solid rgba(0,0,0,0.05); border-radius: 12px; display: flex; align-items: center; justify-content: space-between; transition: 0.3s; background: white; margin-bottom: 0.5rem; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                <div style="display: flex; flex-direction: column; gap: 2px;">
                    <span style="display: flex; align-items: center; gap: 10px; font-weight: 600; color: #1f2937;">
                        <i class="fa-solid ${iconClass}" style="color: ${iconColor}; font-size: 1.1rem;"></i> 
                        ${doc.title}
                    </span>
                    <span style="font-size: 0.75rem; color: #94a3b8; margin-left: 28px;">${doc.type} • ${date}</span>
                </div>
                
                <div style="display: flex; gap: 0.5rem;">
                     <!--
                     <button onclick="previewDocument('${doc.fileUrl}')" 
                        style="padding: 6px 12px; font-size: 0.8rem; border: none; background: #e2e8f0; border-radius: 6px; cursor: pointer; color: #475569; font-weight:500; transition: background 0.2s;">
                        <i class="fa-solid fa-eye"></i> Preview
                     </button>
                     -->
                     <a href="http://localhost:5000${doc.fileUrl}" target="_blank" download
                        style="padding: 6px 12px; font-size: 0.8rem; border: none; background: #3b82f6; border-radius: 6px; cursor: pointer; color: white; text-decoration:none; font-weight:500; display:flex; align-items:center; gap:5px; transition: background 0.2s;">
                        <i class="fa-solid fa-download"></i> Download
                     </a>
                     <button onclick="deleteDocument('${doc._id}')" 
                        style="padding: 6px 10px; font-size: 0.8rem; border: none; background: #fee2e2; border-radius: 6px; cursor: pointer; color: #ef4444; transition: background 0.2s;">
                        <i class="fa-solid fa-trash"></i>
                     </button>
                </div>
            </li>
            `;
        }).join('');

    } catch (error) {
        console.error(error);
        listContainer.innerHTML = '<li style="padding:1rem; text-align:center; color:red;">Error loading documents.</li>';
    }
}

function setupUploadForm() {
    const form = document.querySelector('.doc-section form');
    const fileInput = document.getElementById('fileInput');
    const previewArea = document.getElementById('previewArea');
    const titleInput = document.querySelector('input[type="text"]');

    // Using title input as doc name, but we might need a type selector too.
    // The previous HTML didn't have a TYPE selector, so I'll add one or default it to 'Other'.
    // Or I'll inject a selector dynamically if needed, but let's stick to the UI shown in screenshot which had "Document Name".

    // File Preview Listener
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const objectUrl = URL.createObjectURL(file);

            // Clear previous content and style
            previewArea.innerHTML = '';
            previewArea.style.borderColor = '#10b981';
            previewArea.style.background = '#ffffff'; // White bg for clarity
            previewArea.style.padding = '0';
            previewArea.style.overflow = 'hidden';

            if (file.type.startsWith('image/')) {
                const img = document.createElement('img');
                img.src = objectUrl;
                img.style.width = '100%';
                img.style.height = '100%';
                img.style.objectFit = 'contain';
                previewArea.appendChild(img);
            } else if (file.type === 'application/pdf') {
                const iframe = document.createElement('iframe');
                iframe.src = objectUrl; // + '#toolbar=0&navpanes=0'; // Optional: hide toolbar
                iframe.style.width = '100%';
                iframe.style.height = '100%';
                iframe.style.border = 'none';
                previewArea.appendChild(iframe);
            } else {
                // Fallback for other types
                previewArea.innerHTML = `
                    <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%;">
                        <i class="fa-solid fa-file-circle-check" style="font-size: 2rem; margin-bottom: 0.5rem; color: #10b981;"></i>
                        <span style="font-weight: 600; color: #2d3748;">${file.name}</span>
                        <span style="font-size: 0.8rem;">(${(file.size / 1024).toFixed(1)} KB)</span>
                    </div>
                `;
            }

            // Cleanup memory (optional but good practice, though tricky with iframes if revoked too soon)
            // setTimeout(() => URL.revokeObjectURL(objectUrl), 10000); 
        } else {
            previewArea.style.padding = ''; // Reset
            previewArea.innerHTML = `
                <i class="fa-solid fa-eye" style="font-size: 2rem; margin-bottom: 0.5rem; color: #cbd5e1;"></i>
                <span>No file selected</span>
              `;
            previewArea.style.borderColor = '#cbd5e1';
            previewArea.style.background = 'rgba(0,0,0,0.05)';
        }
    });

    form.onsubmit = async (e) => {
        e.preventDefault();
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerText;

        const file = fileInput.files[0];
        const title = titleInput.value;
        if (!file || !title) return alert('Please fill all fields');

        submitBtn.innerText = 'Uploading...';
        submitBtn.disabled = true;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', title);
        formData.append('type', 'Other'); // Default type for now as UI lacks selector
        formData.append('description', 'Uploaded via Dashboard');

        try {
            const user = JSON.parse(localStorage.getItem('user'));
            const res = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${user.token}` },
                body: formData
            });

            if (!res.ok) throw new Error('Upload failed');

            alert('Document Uploaded Successfully!');
            form.reset();
            previewArea.innerHTML = `<i class="fa-solid fa-eye" style="font-size: 2rem; margin-bottom: 0.5rem; color: #cbd5e1;"></i><span>No file selected</span>`;
            loadDocuments(); // Refresh list

        } catch (error) {
            alert('Error: ' + error.message);
        } finally {
            submitBtn.innerText = originalText;
            submitBtn.disabled = false;
        }
    };
}

async function deleteDocument(id) {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
        const user = JSON.parse(localStorage.getItem('user'));
        const res = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${user.token}` }
        });

        if (res.ok) {
            loadDocuments();
        } else {
            alert('Failed to delete');
        }
    } catch (e) {
        console.error(e);
    }
}
