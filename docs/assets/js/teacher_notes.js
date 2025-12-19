const API_URL = 'http://localhost:5000/api/notes'; // Now uses Note Controller

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('createNoteForm');
    if (form) {
        form.addEventListener('submit', handleCreateNote);
    }

    populateDropdowns();
    loadCreatedNotes();
});

// Global variable to store subject constraints
let enforcedSubjectsData = [];

function populateDropdowns() {
    const userStr = localStorage.getItem('user');
    if (!userStr) return;
    const user = JSON.parse(userStr);

    // Store enforced subjects (fetched from Subject collection at login)
    enforcedSubjectsData = user.enforcedSubjects || [];

    // 2. Subjects
    const subjectSelect = document.getElementById('noteSubject');
    if (subjectSelect) {
        if (enforcedSubjectsData.length > 0) {
            subjectSelect.innerHTML = '<option value="">Select Subject</option>' +
                enforcedSubjectsData.map(sub => `<option value="${sub.name}">${sub.name}</option>`).join('');

            subjectSelect.addEventListener('change', handleSubjectChange);
        } else if (user.teachingSubjects && user.teachingSubjects.length > 0) {
            // Fallback for legacy
            subjectSelect.innerHTML = '<option value="">Select Subject</option>' +
                user.teachingSubjects.map(sub => `<option value="${sub}">${sub}</option>`).join('');
        } else {
            subjectSelect.innerHTML = `<option value="">No Subjects Assigned</option>`;
        }
    }

    // 3. Batches (Initial State)
    const batchSelect = document.getElementById('noteBatch');
    if (batchSelect) {
        batchSelect.innerHTML = '<option value="">Select Subject First</option>';
    }
}

function handleSubjectChange(e) {
    const selectedSubjectName = e.target.value;
    const subjectData = enforcedSubjectsData.find(s => s.name === selectedSubjectName);

    const yearSelect = document.getElementById('noteYear');
    const batchSelect = document.getElementById('noteBatch');

    if (!subjectData) {
        if (yearSelect) {
            yearSelect.value = "";
            yearSelect.disabled = false;
        }
        if (batchSelect) batchSelect.innerHTML = '<option value="">Select Batch</option>';
        return;
    }

    // 1. Auto-select Year and LOCK it
    if (yearSelect && subjectData.year) {
        yearSelect.value = subjectData.year;
        yearSelect.disabled = true;
    }

    // 2. Filter Batches
    if (batchSelect) {
        if (subjectData.allowedBatches && subjectData.allowedBatches.length > 0) {
            batchSelect.innerHTML = '<option value="">Select Batch</option>' +
                subjectData.allowedBatches.map(b => `<option value="${b}">Batch ${b}</option>`).join('');

            // Auto-select if only one batch
            if (subjectData.allowedBatches.length === 1) {
                batchSelect.value = subjectData.allowedBatches[0];
            }
        } else {
            batchSelect.innerHTML = '<option value="">No Batches Assigned for this Subject</option>';
        }
    }
}

async function handleCreateNote(e) {
    e.preventDefault();

    const title = document.getElementById('noteTitle').value;
    const subject = document.getElementById('noteSubject').value;
    const year = document.getElementById('noteYear').value;
    const batch = document.getElementById('noteBatch').value;
    const description = document.getElementById('noteDesc').value;
    const fileInput = document.getElementById('noteFile');

    const userStr = localStorage.getItem('user');
    const user = JSON.parse(userStr);
    const department = user.department || 'General';

    if (!title || !subject || !batch || !year || !fileInput.files[0]) {
        alert("Please ensure all fields are selected and a file is uploaded.");
        return;
    }

    try {
        // Prepare FormData
        const formData = new FormData();
        // formData.append('type', 'note'); // Not needed for specific note endpoint
        formData.append('title', title);
        formData.append('subject', subject);
        formData.append('department', department);
        formData.append('year', year);
        formData.append('batch', batch);
        formData.append('description', description);
        formData.append('file', fileInput.files[0]);

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${user.token}`
                // Note: Do NOT set Content-Type for FormData; the browser sets it automatically with the boundary
            },
            body: formData
        });

        const data = await response.json();

        if (response.ok) {
            alert('Note uploaded successfully!');
            document.getElementById('createNoteForm').reset();
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

        // The API now returns only notes
        const notes = allResources;

        if (notes.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #64748b;">No notes shared yet.</td></tr>';
            return;
        }

        tableBody.innerHTML = notes.map(note => {
            const date = new Date(note.createdAt).toLocaleDateString('en-GB');

            // Map Backend Fields
            const title = note.topic || note.title || 'Untitled';
            const link = note.fileUrl || note.link;

            let fileLink = '<span style="color:#94a3b8">No File</span>';

            if (link) {
                let href = link;
                let fileName = 'View File';

                if (href.startsWith('/')) {
                    href = 'http://localhost:5000' + href;
                    fileName = link.split('/').pop();
                } else {
                    fileName = link.split('/').pop();
                }

                fileLink = `<a href="${href}" target="_blank" style="color: #3b82f6; font-weight: 600; text-decoration: none; display:flex; align-items:center; gap:5px;">
                                <i class="fa-solid fa-file-pdf"></i> View
                            </a>`;
            }

            return `
            <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 1rem; color: #64748b;">${date}</td>
                <td style="padding: 1rem; color: #2d3748; font-weight: 600;">${title}</td>
                <td style="padding: 1rem; color: #2d3748; font-weight: 500;">
                    ${note.subject}
                </td>
                <td style="padding: 1rem; color: #64748b;">${note.department || ''} - ${note.batch}</td>
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