// routine.js

async function fetchAndRenderRoutine(role) {
    const tableBody = document.querySelector('#routine-table-body');
    if (!tableBody) return;

    try {
        console.log(`[Routine] Fetching routine for role: ${role}`);
        const endpoint = role === 'teacher' ? '/routine/teacher' : '/routine/student';

        const response = await api.fetchWithAuth(endpoint);

        console.log(`[Routine] Response status: ${response.status}`);

        if (!response.ok) {
            const text = await response.text();
            console.error('[Routine] Fetch failed:', text);
            throw new Error(`Failed to fetch routine: ${response.status}`);
        }

        // Validate Content-Type
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            console.error('[Routine] Invalid content type:', contentType);
            const text = await response.text();
            console.error('[Routine] Response body:', text);
            throw new Error("Received non-JSON response from server");
        }

        const routineData = await response.json();
        console.log('[Routine] Data received:', routineData);
        renderRoutineTable(routineData, tableBody);

    } catch (error) {
        console.error("Error loading routine:", error);
        tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:2rem; color: #ef4444;">
            <i class="fa-solid fa-circle-exclamation"></i> Failed to load routine.<br>
            <span style="font-size:0.8rem; color:#64748b;">${error.message}</span>
        </td></tr>`;
    }
}

function renderRoutineTable(data, tableBody) {
    if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center p-8 text-gray-500">No classes scheduled</td></tr>';
        return;
    }

    // 1. Define Standard Time Slots (Fixed Order)
    const timeSlots = [
        '09:30 - 10:30',
        '10:30 - 11:30',
        '11:30 - 12:30',
        '12:30 - 01:30',
        '01:30 - 02:30',
        '02:30 - 03:30',
        '03:30 - 04:30',
        '04:30 - 05:30'
    ];

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
                const teacherName = cls.teacher ? cls.teacher.name : (cls.teacherName || 'Teacher TBA');
                const isLab = subject.toLowerCase().includes('lab');
                const cellStyle = isLab ? 'background: #e0f2fe;' : 'background: #f0fdf4;';

                rowsHTML += `
               <td style="${cellStyle} border-radius: 8px; padding: 10px; margin: 2px;">
                    <div style="font-weight:bold; color:#1f2937;">${subject}</div>
                    <div style="font-size:0.8rem; color:#4b5563; margin-top:4px;"><i class="fa-solid fa-chalkboard-user"></i> ${teacherName}</div>
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
