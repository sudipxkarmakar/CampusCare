
document.addEventListener('DOMContentLoaded', async () => {
    // Check Auth
    const userStr = localStorage.getItem('user');
    if (!userStr) {
        window.location.href = '../login.html';
        return;
    }
    const user = JSON.parse(userStr);

    // Initial Load
    await loadData(user.token);

    // Setup MAR Form
    const marForm = document.getElementById('marForm');
    if (marForm) {
        marForm.addEventListener('submit', (e) => handleMarSubmit(e, user.token));
    }

    // Setup MOOC Form
    const moocForm = document.getElementById('moocForm');
    if (moocForm) {
        moocForm.addEventListener('submit', (e) => handleMoocsSubmit(e, user.token));
    }

    // Setup Points Calculator
    const courseHoursInput = document.getElementById('courseHours');
    if (courseHoursInput) {
        courseHoursInput.addEventListener('input', calcPoints);
    }
});

async function loadData(token) {
    try {
        const response = await fetch('http://localhost:5000/api/mar-moocs', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Failed to fetch data');

        const { records, totals } = await response.json();

        // 1. Update Totals
        const displays = document.querySelectorAll('.points-value');
        if (displays.length >= 2) {
            displays[0].innerText = `${totals.mar} / 100`;
            displays[1].innerText = `${totals.mooc} / 20`;
        }

        // 2. Render Lists
        const lists = document.querySelectorAll('.activity-list');
        const marList = lists[0];
        const moocList = lists[1];

        marList.innerHTML = '';
        moocList.innerHTML = '';

        if (records.length === 0) {
            marList.innerHTML = '<li style="text-align:center; padding:1rem;">No activities found.</li>';
            moocList.innerHTML = '<li style="text-align:center; padding:1rem;">No courses found.</li>';
            return;
        }

        const createItem = (r) => {
            const date = new Date(r.createdAt).toLocaleDateString();
            const statusColor = r.status === 'Verified' ? '#10b981' : '#f59e0b'; // Green or Yellow
            const badge = `<span style="font-size:0.75rem; padding:2px 6px; border-radius:4px; background:${statusColor}20; color:${statusColor}; border:1px solid ${statusColor}; margin-right:8px;">${r.status}</span>`;

            const li = document.createElement('li');
            li.className = 'activity-item';
            // Flex layout for "Record" look
            li.style.flexDirection = 'column';
            li.style.alignItems = 'flex-start';
            li.style.gap = '5px';
            // Styling for visibility
            li.style.backgroundColor = 'rgba(255, 255, 255, 0.6)';
            li.style.borderRadius = '8px';
            li.style.padding = '12px';
            li.style.marginBottom = '10px';
            li.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';

            let pointsLabel = r.category === 'mar' ? `+${r.points}` : `${r.points} Credits`;

            li.innerHTML = `
                <div style="width:100%; display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-weight:600; color:#374151;">${r.title}</span>
                    <span class="activity-points" style="${r.category === 'mooc' ? 'background:#dbeafe; color:#1e40af;' : ''}">${pointsLabel}</span>
                </div>
                <div style="width:100%; display:flex; justify-content:space-between; align-items:center; font-size:0.85rem; color:#6b7280; padding-top:4px; border-top:1px solid rgba(0,0,0,0.05); margin-top:4px;">
                    <span>${r.platform} • ${date}</span>
                    <div style="display:flex; align-items:center;">
                        ${badge}
                        ${(() => {
                    let proofUrl = r.certificateUrl;

                    if (!proofUrl) {
                        return `<span style="color:#cbd5e1; font-size:0.9rem; margin-left:5px; cursor:not-allowed;" title="No Document">
                                   <i class="fa-solid fa-file-circle-xmark"></i>
                                </span>`;
                    }

                    if (proofUrl.startsWith('/')) {
                        proofUrl = 'http://localhost:5000' + proofUrl;
                    } else if (!proofUrl.startsWith('http')) {
                        proofUrl = 'https://' + proofUrl;
                    }

                    return `<a href="${proofUrl}" target="_blank" style="background:none; border:none; color:#3b82f6; cursor:pointer; font-size:0.9rem; margin-left:5px;" title="View Document">
                               <i class="fa-solid fa-file-pdf"></i>
                            </a>`;
                })()}
                    </div>
                </div>
            `;
            return li;
        };

        records.forEach(r => {
            if (r.category === 'mar') {
                marList.appendChild(createItem(r));
            } else {
                moocList.appendChild(createItem(r));
            }
        });

    } catch (error) {
        console.error("Error:", error);
    }
}

async function handleMarSubmit(e, token) {
    e.preventDefault();
    const select = e.target.querySelector('select');
    const file = e.target.querySelector('input[type="file"]');

    if (!select.value || !file.files[0]) {
        alert("Please fill all fields");
        return;
    }

    const title = select.options[select.selectedIndex].text.split('(')[0].trim();
    const points = parseInt(select.value);

    try {
        const formData = new FormData();
        formData.append('category', 'mar');
        formData.append('title', title);
        formData.append('platform', 'College');
        formData.append('points', points);
        formData.append('file', file.files[0]);

        const res = await fetch('http://localhost:5000/api/mar-moocs', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
                // Content-Type not set (browser sets multipart/form-data)
            },
            body: formData
        });

        if (res.ok) {
            alert('Activity Submitted Successfully!');
            loadData(token); // Refresh
        } else {
            const data = await res.json();
            alert(`Error: ${data.message || res.statusText}`);
            console.error(data);
        }
    } catch (err) {
        console.error(err);
        alert(`Network Error: ${err.message}. Is the server running?`);
    }
}

async function handleMoocsSubmit(e, token) {
    e.preventDefault();

    const title = document.getElementById('courseName').value;
    const link = document.getElementById('courseLink').value;
    const hrs = document.getElementById('courseHours').value;
    const file = document.getElementById('moocFile');

    if (!title || !link || !hrs || !file.files[0]) {
        alert("Please fill all fields");
        return;
    }

    const points = Math.floor(hrs / 8);
    if (points <= 0) {
        alert("Requirements not met: Course must be at least 8 hours.");
        return;
    }

    try {
        const formData = new FormData();
        formData.append('category', 'mooc');
        formData.append('title', title);
        formData.append('platform', 'Online'); // Default or extract from link
        formData.append('points', points);
        formData.append('link', link);
        formData.append('file', file.files[0]);

        const res = await fetch('http://localhost:5000/api/mar-moocs', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (res.ok) {
            alert('MOOC Submitted Successfully!');
            loadData(token); // Refresh
        } else {
            const data = await res.json();
            alert(`Error: ${data.message || res.statusText}`);
        }
    } catch (err) {
        console.error(err);
        alert(`Network Error: ${err.message}. Is the server running?`);
    }
}

function calcPoints() {
    const hrs = document.getElementById('courseHours').value;
    const preview = document.getElementById('pointsPreview');
    if (hrs) {
        const points = Math.floor(hrs / 8);
        if (points > 0) {
            preview.innerHTML = `<i class="fa-solid fa-check"></i> Eligible for ${points} Credit Point(s)`;
            preview.style.color = '#10b981';
        } else {
            preview.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> Less than 8 hours (0 Points)`;
            preview.style.color = '#ef4444';
        }
    } else {
        preview.innerHTML = '';
    }
}
