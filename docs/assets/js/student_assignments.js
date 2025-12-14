document.addEventListener('DOMContentLoaded', async () => {
    const tableBody = document.getElementById('assignments-table-body');

    try {
        const token = localStorage.getItem('token');

        // --- 1. MOCK FALLBACK IF NO TOKEN ---
        if (!token) {
            console.warn('No authentication token found. Using mock data.');
            renderMockAssignments(tableBody);
            return;
        }

        const response = await fetch(`${API_BASE_URL}/assignments/my-assignments`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });


        // --- 2. MOCK FALLBACK IF API FAILS ---
        if (!response.ok) {
            throw new Error('API request failed');
        }

        const assignments = await response.json();

        if (assignments.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 2rem; color: #64748b;">
                        No pending assignments. Great job!
                    </td>
                </tr>`;
            return;
        }

        renderAssignments(tableBody, assignments);

    } catch (error) {
        console.error('Error fetching assignments:', error);
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 2rem; color: #ef4444;">
                    <i class="fa-solid fa-circle-exclamation"></i> Error loading assignments. Ensure server is online.
                </td>
            </tr>`;
    }
});

function renderAssignments(container, data) {
    // 1. Sort by Due Date (Ascending)
    data.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    container.innerHTML = data.map(a => {
        // 2. Determine Priority Color
        const dayDiff = Math.ceil((new Date(a.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
        let priorityClass = 'priority-green';
        let badgeColor = '#10b981';
        let badgeBg = 'rgba(16, 185, 129, 0.2)';

        if (dayDiff <= 2) {
            priorityClass = 'priority-red';
            badgeColor = '#ef4444';
            badgeBg = 'rgba(239, 68, 68, 0.2)';
        } else if (dayDiff <= 5) {
            priorityClass = 'priority-yellow';
            badgeColor = '#f59e0b';
            badgeBg = 'rgba(245, 158, 11, 0.2)';
        }

        // 3. Render Row with 'list-row-hover'
        return `
        <tr class="list-row-hover ${priorityClass}" style="border-bottom: 1px solid rgba(255, 255, 255, 0.05); transition: 0.3s;">
            <td style="padding: 1rem; font-weight: 500; color: #1f2937;">${a.title}</td>
            <td style="padding: 1rem; color: #64748b;">${a.teacher?.name || 'Unknown'}</td>
            <td style="padding: 1rem; color: #4b5563;">${new Date(a.dueDate).toLocaleDateString()}</td>
            <td style="padding: 1rem;">
                <span style="background: ${badgeBg}; color: ${badgeColor}; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.8rem;">${dayDiff < 0 ? 'Overdue' : dayDiff + ' Days Left'}</span>
            </td>
            <td style="padding: 1rem; display: flex; gap: 10px;">
                <button class="btn-primary" style="padding: 0.5rem 1rem; font-size: 0.8rem; border-radius: 5px; cursor: pointer; background: #334155 !important; color: white !important; border: none;" onclick="viewAssignment('${a._id}')">
                    View
                </button>
                <button class="submit-btn" style="padding: 0.5rem 1rem; font-size: 0.8rem; border-radius: 5px; cursor: pointer; background: #1f2937; color: white !important; border: none;" onclick="alert('Submit Feature Coming Soon!')">
                    Submit
                </button>
            </td>
        </tr>
    `}).join('');
}

function viewAssignment(id) {
    alert(`Viewing assignment ${id}`);
}

