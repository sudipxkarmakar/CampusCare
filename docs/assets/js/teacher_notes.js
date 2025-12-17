const API_URL = 'http://localhost:5000/api/content/note'; // NEW Endpoint

document.addEventListener('DOMContentLoaded', () => {
    // Check Auth
    const userStr = localStorage.getItem('user');
    if (!userStr) {
        alert('Please login first.');
        window.location.href = '../login.html';
        return;
    }
    const user = JSON.parse(userStr);
    document.getElementById('userName').innerText = `Hello, ${user.name}`;
    document.getElementById('userAvatar').src = `https://ui-avatars.com/api/?name=${user.name}&background=random`;

    // Check Mentor Access for SubBatch
    if (user.menteesSubBatches && user.menteesSubBatches.length > 0) {
        const subBatchContainer = document.getElementById('subBatchContainer');
        if (subBatchContainer) subBatchContainer.style.display = 'block';
    }

    const form = document.getElementById('createNoteForm');
    if (form) {
        form.addEventListener('submit', handleCreateNote);
    }

    loadNotes();
});

async function handleCreateNote(e) {
    e.preventDefault();

    const title = document.getElementById('noteTitle').value;
    const description = document.getElementById('noteDesc').value;
    const department = document.getElementById('noteDept').value;
    const year = document.getElementById('noteYear').value;
    const batch = document.getElementById('noteBatch').value;
    const subBatch = document.getElementById('noteSubBatch').value;
    const fileInput = document.getElementById('noteFile');
    const file = fileInput.files[0];

    // Basic Validation
    if (!title || !department || !year || !batch) {
        alert("Please fill in all required fields.");
        return;
    }

    if (!file) {
        alert("Please attach a PDF file.");
        return;
    }

    const userStr = localStorage.getItem('user');
    const user = JSON.parse(userStr);

    try {
        const formData = new FormData();
        formData.append('subject', "General Resource");
        formData.append('topic', title);
        formData.append('description', description);
        formData.append('department', department);
        formData.append('year', year);
        formData.append('batch', batch);
        if (subBatch) formData.append('subBatch', subBatch);
        formData.append('file', file);

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${user.token}`
            },
            body: formData
        });

        const data = await response.json();

        if (response.ok) {
            alert('Note shared successfully!');
            document.getElementById('createNoteForm').reset();
            loadNotes();
        } else {
            alert(data.message || 'Failed to share note.');
        }
    } catch (error) {
        console.error('Error sharing note:', error);
        alert('Server error. Please try again.');
    }
}

async function loadNotes() {
    const tableBody = document.getElementById('notesTableBody');
    if (!tableBody) return;

    const userStr = localStorage.getItem('user');
    const user = JSON.parse(userStr);

    try {
        const response = await fetch(`${API_URL}/created`, {
            headers: { 'Authorization': `Bearer ${user.token}` }
        });

        if (!response.ok) throw new Error('Failed to fetch notes');

        const allItems = await response.json();
        // The API now returns only notes, and the Note model doesn't have a 'type' field by default.
        // So we shouldn't filter by type unless we added it in the backend.
        const notes = allItems;

        if (notes.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem; color: #64748b;">No notes shared yet.</td></tr>';
            return;
        }

        tableBody.innerHTML = notes.map(note => {
            const date = new Date(note.createdAt).toISOString().split('T')[0];

            // Map Backend Fields (Note model uses 'topic' and 'fileUrl')
            const title = note.topic || note.title || 'Untitled';
            const link = note.fileUrl || note.link;

            let fileLink = '<span style="color:#94a3b8">No File</span>';
            let fileName = 'No File';

            if (link) {
                let href = link;
                if (href.startsWith('/')) {
                    href = 'http://localhost:5000' + href;
                    fileName = link.split('/').pop();
                } else {
                    // If it's a full URL
                    fileName = link.split('/').pop();
                }
                fileLink = `<a href="${href}" target="_blank" style="color: #3b82f6; font-weight: 600; text-decoration: none; display:flex; align-items:center; gap:5px;">
                                <i class="fa-solid fa-file-pdf"></i> ${fileName.substring(0, 20)}...
                            </a>`;
            }

            // Department badge style
            let deptBadge = `<span style="background:#e0f2fe; color:#0369a1; padding:2px 8px; border-radius:12px; font-size:0.8rem;">${note.department} - ${note.batch}</span>`;

            return `
            <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 1rem; color: #64748b;">${date}</td>
                <td style="padding: 1rem; color: #2d3748; font-weight: 600;">${title}</td>
                <td style="padding: 1rem;">${deptBadge}</td>
                <td style="padding: 1rem;">${fileLink}</td>
                <td style="padding: 1rem; text-align: center;">
                    <button onclick="deleteNote('${note._id}')" style="background:none; border:none; color:#ef4444; cursor:pointer;" title="Delete">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>
            `;
        }).join('');

    } catch (error) {
        console.error('Error:', error);
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: red;">Error loading notes.</td></tr>';
    }
}

async function deleteNote(id) {
    if (!confirm('Are you sure you want to delete this?')) return;

    const userStr = localStorage.getItem('user');
    const user = JSON.parse(userStr);

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${user.token}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            alert('Deleted successfully.');
            loadNotes();
        } else {
            alert(data.message || 'Failed to delete.');
        }
    } catch (e) {
        console.error(e);
        alert('Error deleting resource.');
    }
}
