document.addEventListener('DOMContentLoaded', () => {
    // Check Auth
    const userStr = localStorage.getItem('user');
    if (!userStr) {
        window.location.href = '../login.html';
        return;
    }

    // Load Leaves
    loadLeaves();
});

async function loadLeaves() {
    const list = document.getElementById('leave-applications-list');

    try {
        const res = await fetch('http://localhost:5000/api/hostel/leaves?status=Pending');
        if (!res.ok) throw new Error("Failed to fetch leaves");

        const leaves = await res.json();

        if (leaves.length === 0) {
            list.innerHTML = `
                <div style="text-align:center; padding: 3rem; color: #64748b;">
                    <i class="fa-solid fa-check-circle" style="font-size: 3rem; margin-bottom: 1rem; color: #10b981;"></i>
                    <h3>All Caught Up!</h3>
                    <p>No pending leave applications.</p>
                </div>
            `;
            return;
        }

        let html = '';
        leaves.forEach(leave => {
            const student = leave.student || { name: 'Unknown Student', rollNumber: 'N/A' };
            const start = new Date(leave.startDate);
            const end = new Date(leave.endDate);
            const diffTime = Math.abs(end - start);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const daysText = diffDays === 1 ? '1 Day' : `${diffDays} Days`;

            const fromDate = start.toLocaleString();
            const toDate = end.toLocaleString();

            html += `
                <div class="glass" style="padding: 1.5rem; border-radius: 12px; border-left: 5px solid #f59e0b; display: flex; flex-direction: column; gap: 1rem; background: white;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <div>
                            <h3 style="margin: 0; color: #1f2937;">${leave.type} Request</h3>
                            <p style="margin: 0.2rem 0 0; color: #4b5563; font-weight: 600;">
                                ${student.name} <span style="font-weight: 400; color: #6b7280;">(${student.rollNumber || 'N/A'})</span>
                            </p>
                        </div>
                        <span style="background: #fffbeb; color: #d97706; padding: 4px 10px; border-radius: 20px; font-size: 0.8rem; font-weight: 600; border: 1px solid #fcd34d;">
                            ${leave.status}
                        </span>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; background: #f9fafb; padding: 1rem; border-radius: 8px;">
                        <div>
                            <span style="display: block; font-size: 0.75rem; color: #6b7280; text-transform: uppercase; font-weight: 600;">Reason</span>
                            <p style="margin: 0.2rem 0 0; color: #374151;">${leave.reason}</p>
                        </div>
                        <div>
                            <span style="display: block; font-size: 0.75rem; color: #6b7280; text-transform: uppercase; font-weight: 600;">Duration <span style="color:#10b981; font-weight:700;">(${daysText})</span></span>
                            <p style="margin: 0.2rem 0 0; color: #374151;">
                                <i class="fa-regular fa-calendar"></i> ${fromDate} <br>
                                <i class="fa-solid fa-arrow-down" style="font-size: 0.8rem; color: #9ca3af; margin: 2px 0;"></i> <br>
                                <i class="fa-regular fa-calendar-check"></i> ${toDate}
                            </p>
                        </div>
                    </div>
                    
                    <div style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 0.5rem;">
                        <button onclick="updateStatus('${leave._id}', 'Rejected')" 
                            style="background: white; border: 1px solid #ef4444; color: #ef4444; padding: 0.6rem 1.2rem; border-radius: 8px; cursor: pointer; font-weight: 600; transition: all 0.2s;">
                            Reject
                        </button>
                        <button onclick="updateStatus('${leave._id}', 'Approved')" 
                            style="background: #10b981; border: none; color: white; padding: 0.6rem 1.2rem; border-radius: 8px; cursor: pointer; font-weight: 600; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.2); transition: all 0.2s;">
                            Approve Request
                        </button>
                    </div>
                </div>
            `;
        });

        list.innerHTML = html;

    } catch (error) {
        console.error('Error loading leaves:', error);
        list.innerHTML = '<p style="text-align:center; color:red;">Failed to load leave applications.</p>';
    }
}

async function updateStatus(id, status) {
    if (!confirm(`Are you sure you want to ${status.toLowerCase()} this request?`)) return;

    try {
        const res = await fetch(`http://localhost:5000/api/hostel/leave/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status })
        });

        if (res.ok) {
            alert(`Application ${status} Successfully`);
            loadLeaves(); // Refresh list
        } else {
            alert('Failed to update status');
        }
    } catch (error) {
        console.error('Error updating status:', error);
        alert('Error updating status');
    }
}
