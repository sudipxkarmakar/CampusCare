
const API_BASE_URL = 'http://localhost:5000/api';

document.addEventListener('DOMContentLoaded', () => {
    fetchMyComplaints();
    setupTabs();
    setupSearch();
    document.getElementById('complaintForm').addEventListener('submit', handleComplaintSubmit);
});

function setupTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            document.getElementById(tab.dataset.target).classList.add('active');
        });
    });

    const categorySelect = document.getElementById('category');
    categorySelect.addEventListener('change', (e) => {
        const studentSearch = document.getElementById('studentSearchSection');
        if (e.target.value === 'Disciplinary') {
            studentSearch.style.display = 'block';
        } else {
            studentSearch.style.display = 'none';
        }
    });
}

function setupSearch() {
    const searchInput = document.getElementById('studentSearch');
    const resultsDiv = document.getElementById('searchResults');
    let debounceTimer;

    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        const q = e.target.value;
        if (q.length < 2) {
            resultsDiv.innerHTML = '';
            return;
        }

        debounceTimer = setTimeout(async () => {
            try {
                const userStr = localStorage.getItem('user');
                const token = userStr ? JSON.parse(userStr).token : null;
                const res = await fetch(`${API_BASE_URL}/hostel/search?q=${q}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const users = await res.json();

                resultsDiv.innerHTML = users.map(u => `
                    <div class="search-result-item" onclick="selectStudent('${u._id}', '${u.name}', '${u.rollNumber}')">
                        <strong>${u.name}</strong> (${u.rollNumber})<br>
                        <small>${u.roomNumber || 'No Room'}</small>
                    </div>
                `).join('');
            } catch (error) {
                console.error(error);
            }
        }, 300);
    });
}

let selectedStudentId = null;
function selectStudent(id, name, roll) {
    selectedStudentId = id;
    document.getElementById('studentSearch').value = `${name} (${roll})`;
    document.getElementById('searchResults').innerHTML = '';
}

async function handleComplaintSubmit(e) {
    e.preventDefault();
    const title = document.getElementById('title').value;
    const description = document.getElementById('description').value;
    const category = document.getElementById('category').value;
    const priority = document.getElementById('priority').value;

    const body = { title, description, category, priority };
    if (category === 'Disciplinary' && selectedStudentId) {
        body.againstUser = selectedStudentId;
    }

    try {
        const userStr = localStorage.getItem('user');
        const token = userStr ? JSON.parse(userStr).token : null;

        const res = await fetch(`${API_BASE_URL}/complaints`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(body)
        });

        const data = await res.json();
        if (res.ok) {
            alert('Complaint filed successfully');
            document.getElementById('complaintForm').reset();
            selectedStudentId = null;
            document.getElementById('studentSearchSection').style.display = 'none';
            fetchMyComplaints();
            // Switch to list tab
            document.querySelector('[data-target="my-complaints"]').click();
        } else {
            alert(data.message || 'Error filing complaint');
        }
    } catch (error) {
        console.error(error);
        alert('Server Error');
    }
}

async function fetchMyComplaints() {
    try {
        const userStr = localStorage.getItem('user');
        const token = userStr ? JSON.parse(userStr).token : null;

        if (!token) return;

        const res = await fetch(`${API_BASE_URL}/complaints/my`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const complaints = await res.json();

        const list = document.getElementById('complaintsListContainer');
        if (complaints.length === 0) {
            list.innerHTML = '<p style="text-align:center; color:#64748b; margin-top:2rem;">No complaints filed yet.</p>';
            return;
        }

        list.innerHTML = complaints.map(c => `
            <div class="complaint-card">
                <div class="complaint-header">
                    <h4>${c.title}</h4>
                    <span class="status-badge ${c.status.toLowerCase().replace(' ', '-')}">${c.status}</span>
                </div>
                <div style="font-size:0.9rem; color:#64748b; margin-bottom:0.5rem;">
                    ${new Date(c.createdAt).toLocaleDateString()} &bull; ${c.category} &bull; Priority: ${c.priority}
                </div>
                <p>${c.description}</p>
                ${c.againstUser ? `<p style="margin-top:0.5rem; color:#ef4444; font-size:0.9rem;"><strong>Against:</strong> ${c.againstUser.name}</p>` : ''}
                ${c.resolvedBy ? `<div style="margin-top:0.5rem; background:#ecfdf5; color:#047857; padding:5px 10px; border-radius:6px; font-size:0.85rem;"><strong>Resolved</strong></div>` : ''}
            </div>
        `).join('');

    } catch (error) {
        console.error(error);
    }
}
