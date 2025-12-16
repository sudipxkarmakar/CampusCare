// routine.js

async function fetchAndRenderRoutine(role) {
    const tableBody = document.querySelector('#routine-table-body');
    if (!tableBody) return;

    try {
        const endpoint = role === 'teacher' ? '/routine/teacher' : '/routine/student';
        const response = await api.fetchWithAuth(endpoint); // Use 'api' object defined in api.js

        if (!response.ok) throw new Error('Failed to fetch routine');

        const routineData = await response.json();
        renderRoutineTable(routineData, tableBody);

    } catch (error) {
        console.error("Error loading routine:", error);
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-red-500">Failed to load routine</td></tr>';
    }
}

function renderRoutineTable(data, tableBody) {
    tableBody.innerHTML = ''; // Clear hardcoded/loading content

    if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center">No classes scheduled</td></tr>';
        return;
    }

    // Sort by day and time (backend already sorts, but double check if needed)
    // Mapping for Day Order if needed
    const dayOrder = { 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6, 'Sunday': 7 };

    // Grouping or List View? 
    // Screenshot implies a standard table. Let's render a simple list for now or a formatted timetable.
    // Spec says "No hardcoded tables", implies we fill the rows.

    data.forEach(item => {
        const row = document.createElement('tr');
        row.className = "border-b hover:bg-gray-50";

        row.innerHTML = `
            <td class="p-3">${item.day}</td>
            <td class="p-3">${item.timeSlot}</td>
            <td class="p-3 font-semibold">${item.subject ? item.subject.name : 'N/A'}</td>
            <td class="p-3">${item.room || 'TBD'}</td>
            <td class="p-3">
                <span class="px-2 py-1 rounded text-xs ${item.subBatch ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}">
                    ${item.subBatch ? 'Sub-batch ' + item.subBatch : 'Full Batch'}
                </span>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Auto-detect page context
document.addEventListener('DOMContentLoaded', () => {
    // Check if we are on a page with a routine table
    if (document.getElementById('routine-table-body')) {
        const path = window.location.pathname;
        if (path.includes('teacher')) {
            fetchAndRenderRoutine('teacher');
        } else {
            fetchAndRenderRoutine('student'); // Default to student
        }
    }
});
