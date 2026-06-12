var API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:5000' : 'https://campuscare-backend-96cn.onrender.com') + '/api/notices';

document.addEventListener('DOMContentLoaded', () => {
    loadNotices();

    const createForm = document.getElementById('createNoticeForm');
    if (createForm) {
        createForm.addEventListener('submit', handleCreateNotice);
    }
});

let allFetchedNotices = [];

async function loadNotices() {
    const noticeList = document.getElementById('noticeList');
    if (!noticeList) return;

    // Get User Role from LocalStorage
    const userStr = localStorage.getItem('user');
    let role = 'public';
    let token = '';
    let userId = '';
    let department = '';

    if (userStr) {
        const user = JSON.parse(userStr);
        role = user.role || 'public';
        token = user.token;
        userId = user._id || '';
        department = user.department || '';

        // Normalize
        if (role === 'Hosteler') role = 'hosteler';
        if (role === 'Student') role = 'student';
        if (role === 'Teacher') role = 'teacher';
    }

    try {
        const response = await fetch(`${API_URL}?role=${role}&userId=${userId}&department=${department}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        // ... (rest of error handling and json parsing) 

        if (!response.ok) {
            throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }

        allFetchedNotices = await response.json();

        // Custom Requirement: Remove 'general' notices for students
        if (role === 'student') {
            allFetchedNotices = allFetchedNotices.filter(n => n.audience !== 'general');
        }

        renderNotices(allFetchedNotices);

    } catch (error) {
        console.error('Error loading notices:', error);
        noticeList.innerHTML = `<div style="text-align: center; color: #ef4444; padding: 2rem;">Failed to load notices: ${error.message}</div>`;
    }
}

function renderNotices(notices) {
    const noticeList = document.getElementById('noticeList');
    if (!noticeList) return;

    if (Array.isArray(notices) && notices.length === 0) {
        noticeList.innerHTML = '<div style="text-align: center; color: #64748b; padding: 2rem;">No notices found.</div>';
        return;
    }

    noticeList.innerHTML = notices.map(notice => {
        const date = new Date(notice.date);
        const day = date.getDate();
        const month = date.toLocaleString('default', { month: 'short' }).toUpperCase();

        // Audience Badge Color
        let badgeColor = '#64748b'; // Gray
        if (notice.audience === 'student') badgeColor = '#3b82f6'; // Blue
        if (notice.audience === 'teacher') badgeColor = '#ef4444'; // Red
        if (notice.audience === 'hosteler') badgeColor = '#f59e0b'; // Amber
        if (notice.audience === 'general') badgeColor = '#10b981'; // Green

        return `
        <div class="notice-item">
            <div class="notice-date">
                <div style="font-size:1.5rem; color:${badgeColor};">${day}</div>
                <div>${month}</div>
            </div>
            <div class="notice-content" style="width: 100%;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; width:100%; margin-bottom: 5px;">
                    <strong style="font-size:1.1rem; color:#2d3748; padding-right: 10px;">${esc(notice.title)}</strong>
                    <span style="font-size:0.7rem; background:${badgeColor}; color:white; padding:2px 6px; border-radius:4px; text-transform:uppercase; white-space:nowrap; margin-left:auto;">${notice.audience}</span>
                </div>
                <span style="display:block; color:#4a5568; line-height:1.5; white-space: pre-wrap;">${formatNoticeContent(notice.content)}</span>
            </div>
        </div>
        `;
    }).join('');
}

function filterNotices(category) {
    // Update active button state
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => {
        if (btn.innerText.toLowerCase() === category || (category === 'all' && btn.innerText === 'All') || (category === 'teacher' && btn.innerText === 'Teachers') || (category === 'student' && btn.innerText === 'Students') || (category === 'hosteler' && btn.innerText === 'Hostelers')) {
            btn.classList.add('active');
            btn.style.background = '#3b82f6';
            btn.style.color = 'white';
        } else {
            btn.classList.remove('active');
            btn.style.background = 'transparent';
            btn.style.color = '#64748b';
        }
    });

    if (category === 'all') {
        renderNotices(allFetchedNotices);
    } else {
        const filtered = allFetchedNotices.filter(n => n.audience === category);
        renderNotices(filtered);
    }
}

async function handleCreateNotice(e) {
    e.preventDefault();

    const title = document.getElementById('noticeTitle').value;
    const content = document.getElementById('noticeContent').value;
    // Toggle Targeting UI
    const audienceSelect = document.getElementById('noticeAudience');
    const studentTargeting = document.getElementById('studentTargeting');

    audienceSelect.addEventListener('change', (e) => {
        if (e.target.value === 'student') {
            studentTargeting.style.display = 'flex';
        } else {
            studentTargeting.style.display = 'none';
        }
    });

    const userStr = localStorage.getItem('user');
    if (!userStr) {
        alert('You must be logged in to post notices.');
        return;
    }
    const user = JSON.parse(userStr);

    try {
        const payload = {
            title,
            content,
            audience,
            userId: user._id
        };

        if (audience === 'student') {
            const tDept = document.getElementById('noticeDept').value;
            const tYear = document.getElementById('noticeYear').value;
            const tBatch = document.getElementById('noticeBatch').value;
            const tSub = document.getElementById('noticeSubBatch').value;
            if (tDept) payload.targetDept = tDept;
            if (tYear) payload.targetYear = tYear;
            if (tBatch) payload.targetBatch = tBatch;
            if (tSub) payload.targetSubBatch = tSub;
        }

        const response = await fetch((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:5000' : 'https://campuscare-backend-96cn.onrender.com') + '/api/content/notice', { // Using NEW Endpoint for Notices too? 
            // My contentController has createNotice. I should use that or update this URL.
            // I'll update the URL to use content API.
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            alert('Notice posted successfully!');
            document.getElementById('createNoticeForm').reset();
            loadNotices(); // Refresh list
        } else {
            const data = await response.json();
            alert(data.message || 'Failed to post notice');
        }
    } catch (error) {
        console.error('Error posting notice:', error);
        alert('Error posting notice');
    }
}

function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[ch]));
}

function formatNoticeContent(text) {
    if (!text) return '';
    
    const hasHtml = /<[a-z/][^>]*>/i.test(text);
    if (hasHtml) {
      return sanitizeHTML(text);
    }

    let escaped = esc(text || '');
    
    escaped = escaped.replace(/\[left\]([\s\S]*?)\[\/left\]/g, '<div style="text-align: left;">$1</div>');
    escaped = escaped.replace(/\[center\]([\s\S]*?)\[\/center\]/g, '<div style="text-align: center;">$1</div>');
    escaped = escaped.replace(/\[right\]([\s\S]*?)\[\/right\]/g, '<div style="text-align: right;">$1</div>');

    escaped = escaped.replace(/\*\*(?!\s)([^\n]+?)(?<!\s)\*\*/g, '<strong>$1</strong>');
    escaped = escaped.replace(/\*(?!\s)([^\n]+?)(?<!\s)\*/g, '<em>$1</em>');
    escaped = escaped.replace(/__(?!\s)([^\n]+?)(?<!\s)__/g, '<u>$1</u>');
    
    escaped = escaped.replace(/!\[([^\]\n]*?)\]\(([^)\n]+?)\)/g, '<img src="$2" alt="$1" style="max-width: 100%; height: auto; border-radius: 8px; margin: 12px 0; display: block; box-shadow: var(--shadow-sm);">');
    escaped = escaped.replace(/\[([^\]\n]+?)\]\(([^)\n]+?)\)/g, '<a href="$2" target="_blank" style="color: #6b46c1; text-decoration: underline; font-weight: 600;">$1</a>');

    const lines = escaped.split('\n');
    let inUl = false;
    let inOl = false;
    const processedLines = [];
    let currentList = '';

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      const trimmed = line.trim();

      if (trimmed.startsWith('* ')) {
        if (inOl) {
          currentList += '</ol>';
          processedLines.push(currentList);
          currentList = '';
          inOl = false;
        }
        if (!inUl) {
          currentList = '<ul style="margin: 8px 0; padding-left: 24px; list-style-type: disc;">';
          inUl = true;
        }
        currentList += `<li style="margin-bottom: 4px;">${line.replace(/^\s*\*\s+/, '')}</li>`;
      }
      else if (/^\d+\.\s+/.test(trimmed)) {
        if (inUl) {
          currentList += '</ul>';
          processedLines.push(currentList);
          currentList = '';
          inUl = false;
        }
        if (!inOl) {
          currentList = '<ol style="margin: 8px 0; padding-left: 24px; list-style-type: decimal;">';
          inOl = true;
        }
        currentList += `<li style="margin-bottom: 4px;">${line.replace(/^\s*\d+\.\s+/, '')}</li>`;
      }
      else {
        if (inUl) {
          currentList += '</ul>';
          processedLines.push(currentList);
          currentList = '';
          inUl = false;
        }
        if (inOl) {
          currentList += '</ol>';
          processedLines.push(currentList);
          currentList = '';
          inOl = false;
        }
        processedLines.push(line);
      }
    }

    if (inUl) {
      currentList += '</ul>';
      processedLines.push(currentList);
    }
    if (inOl) {
      currentList += '</ol>';
      processedLines.push(currentList);
    }

    return processedLines.join('\n');
}

function sanitizeHTML(html) {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    
    const allElements = temp.querySelectorAll('*');
    allElements.forEach(el => {
      if (el.tagName === 'SCRIPT') {
        el.remove();
        return;
      }
      
      const allowedAttrs = ['href', 'src', 'alt', 'style', 'target', 'align'];
      const attrs = Array.from(el.attributes);
      attrs.forEach(attr => {
        if (!allowedAttrs.includes(attr.name.toLowerCase())) {
          el.removeAttribute(attr.name);
        } else if (attr.name.toLowerCase() === 'href' || attr.name.toLowerCase() === 'src') {
          const val = attr.value.trim().toLowerCase();
          if (val.startsWith('javascript:')) {
            el.removeAttribute(attr.name);
          }
        } else if (attr.name.toLowerCase() === 'style') {
          const styleVal = attr.value.toLowerCase();
          const allowedStyles = ['text-align', 'color', 'text-decoration', 'font-weight', 'max-width', 'height', 'border-radius', 'margin', 'display', 'box-shadow'];
          const styleParts = styleVal.split(';').filter(part => {
            const prop = part.split(':')[0].trim();
            return allowedStyles.includes(prop);
          });
          if (styleParts.length > 0) {
            el.setAttribute('style', styleParts.join('; ') + ';');
          } else {
            el.removeAttribute(attr.name);
          }
        }
      });
    });
    
    return temp.innerHTML;
}

