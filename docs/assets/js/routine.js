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
    if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center p-8 text-gray-500">No classes scheduled</td></tr>';
        return;
    }

    // 1. Extract Unique Time Slots & Sort Chronologically
    // Assumes timeSlot format "10:30 - 11:30" or compatible string sorting
    const timeSlots = [...new Set(data.map(d => d.timeSlot))].sort();

    // 2. Build Dynamic Header
    const thead = document.querySelector('.routine-table thead');
    if (thead) {
        let headerHTML = '<tr><th style="width: 100px;">Day / Time</th>';
        timeSlots.forEach(slot => {
            headerHTML += `<th>${slot}</th>`;
        });
        headerHTML += '</tr>';
        thead.innerHTML = headerHTML;
    }

    // 3. Define Row Order
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // 4. Build Matrix Grid
    let rowsHTML = '';
    days.forEach(day => {
        rowsHTML += `<tr>`;
        // First Column: Day Name
        rowsHTML += `<td style="font-weight:bold; background:rgba(255,255,255,0.8);">${day}</td>`;

        timeSlots.forEach(slot => {
            // Find class for this Day & Slot
            const cls = data.find(d => d.day === day && d.timeSlot === slot);

            if (cls) {
                const subject = cls.subject ? cls.subject.name : cls.subjectName || 'Unknown Subject';
                const room = cls.room || 'TBD';
                // Different color for Labs vs Lectures? Or just batch info.
                const isLab = subject.toLowerCase().includes('lab');
                const cellStyle = isLab ? 'background: #e0f2fe;' : 'background: #f0fdf4;';

                rowsHTML += `
               <td style="${cellStyle} border-radius: 8px; padding: 10px; margin: 2px;">
                    <div style="font-weight:bold; color:#1f2937;">${subject}</div>
                    <div style="font-size:0.8rem; color:#4b5563;">${room}</div>
                    ${cls.subBatch ? `<div style="font-size:0.7rem; color:#d97706; font-weight:600;">Sub-batch ${cls.subBatch}</div>` : ''}
               </td>`;
            } else {
                // Empty Slot
                rowsHTML += `<td style="background: rgba(0,0,0,0.02); color:#cbd5e1;">-</td>`;
            }
        });
        rowsHTML += `</tr>`;
    });

    tableBody.innerHTML = rowsHTML;
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
