const API_URL = 'http://localhost:5000/api/assignments'; // Uses Assignment Controller

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('createNoteForm');
    if (form) {
        form.addEventListener('submit', handleCreateNote);
    }

    populateDropdowns();
    loadCreatedNotes();
});

function populateDropdowns() {
    const userStr = localStorage.getItem('user');
    if (!userStr) return;
    const user = JSON.parse(userStr);

    // 1. Department
    const deptSelect = document.getElementById('noteDept');
    if (deptSelect) {
        if (user.department) {
            deptSelect.innerHTML = `<option value="${user.department}">${user.department}</option>`;
        } else {
            deptSelect.innerHTML = `<option value="">No Dept Assigned</option>`;
        }
    }

    // 2. Subjects
    const subjectSelect = document.getElementById('noteSubject');
    if (subjectSelect) {
        if (user.teachingSubjects && user.teachingSubjects.length > 0) {
            subjectSelect.innerHTML = '<option value="">Select Subject</option>' +
                user.teachingSubjects.map(sub => `<option value="${sub}">${sub}</option>`).join('');
        } else {
            subjectSelect.innerHTML = `<option value="">No Subjects Assigned</option>`;
        }
    }

    // 3. Batches
    const batchSelect = document.getElementById('noteBatch');
    if (batchSelect) {
        if (user.teachingBatches && user.teachingBatches.length > 0) {
            batchSelect.innerHTML = '<option value="">Select Batch</option>' +
                user.teachingBatches.map(batch => {
                    const label = batch.startsWith('Batch') ? batch : `Batch ${batch}`;
                    const value = batch.replace('Batch ', '');
                    return `<option value="${value}">${label}</option>`;
                }).join('');
        } else {
            batchSelect.innerHTML = `<option value="">No Batches Assigned</option>`;
        }
    }
}

async function handleCreateNote(e) {
    e.preventDefault();

    const title = document.getElementById('noteTitle').value;
    const subject = document.getElementById('noteSubject').value;
    const department = document.getElementById('noteDept').value;
    const year = document.getElementById('noteYear').value;
    const batch = document.getElementById('noteBatch').value;
    const description = document.getElementById('noteDesc').value;
    const fileInput = document.getElementById('noteFile');

    if (!title || !subject || !batch || !department || !year || !fileInput.files[0]) {
        alert("Please ensure all fields are selected and a file is uploaded.");
        return;
    }

    const userStr = localStorage.getItem('user');
    const user = JSON.parse(userStr);

    // Prepare FormData
    const formData = new FormData();
    formData.append('type', 'note'); // Important flag
    formData.append('title', title);
    formData.append('subject', subject);
    formData.append('department', department);
    formData.append('year', year);
    formData.append('batch', batch);
    formData.append('description', description);
    formData.append('file', fileInput.files[0]);

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${user.token}`
                // Content-Type not set for FormData, browser sets boundary
            },
            body: formData
        });

        const data = await response.json();

        if (response.ok) {
            alert('Note uploaded successfully!');
            document.getElementById('createNoteForm').reset();
            // Re-populate department (as reset clears it)
            if (user.department) document.getElementById('noteDept').innerHTML = `<option value="${user.department}">${user.department}</option>`;
            loadCreatedNotes();
        } else {
            alert(data.message || 'Failed to upload note.');
        }

    } catch (error) {
        console.error('Error uploading note:', error);
        alert('Server error. Please try again.');
    }
}

async function loadCreatedNotes() {
    const tableBody = document.getElementById('notesTableBody');
    if (!tableBody) return;

    const userStr = localStorage.getItem('user');
    if (!userStr) {
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: red;">Please login.</td></tr>';
        return;
    }
    const user = JSON.parse(userStr);

    try {
        const response = await fetch(`${API_URL}/created`, {
            headers: {
                'Authorization': `Bearer ${user.token}`
            }
        });

        if (!response.ok) throw new Error('Failed to fetch resources');

        const allResources = await response.json();

        // Filter Notes
        const notes = allResources.filter(r => r.type === 'note');

        if (notes.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #64748b;">No notes shared yet.</td></tr>';
            return;
        }

        tableBody.innerHTML = notes.map(note => {
            const date = new Date(note.createdAt).toLocaleDateString('en-GB');

            let fileLink = '<span style="color:#94a3b8">No File</span>';
            if (note.link) {
                let href = note.link;
                if (href.startsWith('/')) href = 'http://localhost:5000' + href;
                fileLink = `<a href="${href}" target="_blank" style="color:#3b82f6; font-weight:600; text-decoration:none;"><i class="fa-solid fa-file-pdf"></i> View</a>`;
            }

            return `
            <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 1rem; color: #64748b;">${date}</td>
                <td style="padding: 1rem; color: #2d3748; font-weight: 500;">
                    ${note.title}
                    <div style="font-size: 0.8rem; color: #64748b;">${note.subject}</div>
                </td>
                <td style="padding: 1rem; color: #64748b;">${note.department} - ${note.batch}</td>
                <td style="padding: 1rem;">${fileLink}</td>
                <td style="padding: 1rem; text-align: center;">
                    <button onclick="deleteNote('${note._id}')" 
                        style="color: #ef4444; background: none; border: none; cursor: pointer;">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>
            `;
        }).join('');

    } catch (error) {
        console.error(error);
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: red;">Error loading notes.</td></tr>';
    }
}

async function deleteNote(id) {
    if (!confirm('Are you sure you want to delete this note?')) return;

    const userStr = localStorage.getItem('user');
    const user = JSON.parse(userStr);

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${user.token}` }
        });

        if (response.ok) {
            loadCreatedNotes();
        } else {
            alert('Failed to delete.');
        }
    } catch (error) {
        alert('Server Error');
    }
}
