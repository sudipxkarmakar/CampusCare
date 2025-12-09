document.addEventListener('DOMContentLoaded', async () => {
    const tableBody = document.getElementById('assignments-table-body');

    try {
        const response = await fetch(`${API_BASE_URL}/assignments/my-assignments`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });

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

        tableBody.innerHTML = assignments.map(a => `
            <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
                <td style="padding: 1rem; font-weight: 500; color: #f8fafc;">${a.title}</td>
                <td style="padding: 1rem; color: #cbd5e1;">${a.teacher?.name || 'Unknown'}</td>
                <td style="padding: 1rem; color: #f59e0b;">${new Date(a.dueDate).toLocaleDateString()}</td>
                <td style="padding: 1rem;">
                    <span style="background: rgba(16, 185, 129, 0.2); color: #10b981; padding: 0.25rem 0.5rem; borderRadius: 4px; font-size: 0.8rem;">Pending</span>
                </td>
                <td style="padding: 1rem;">
                    <button class="btn-primary" style="padding: 0.5rem 1rem; font-size: 0.8rem;" onclick="viewAssignment('${a._id}')">
                        View
                    </button>
                </td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('Error fetching assignments:', error);
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 2rem; color: #ef4444;">
                    Failed to load assignments.
                </td>
            </tr>`;
    }
});

function viewAssignment(id) {
    alert(`Viewing assignment ${id} (Mock Functionality)`);
    // Future: Redirect to details page
    // window.location.href = `assignment-details.html?id=${id}`;
}
