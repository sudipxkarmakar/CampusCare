(function () {
  const cfg = window.CC_MODULE_PAGE || {};
  const isLocal = ['localhost', '127.0.0.1', ''].includes(window.location.hostname) || window.location.protocol === 'file:';
  const apiBase = isLocal ? 'http://localhost:5000' : 'https://campuscare-backend-96cn.onrender.com';
  const user = safeJson(localStorage.getItem('user')) || {};

  const moduleInfo = {
    complaints: {
      title: 'Transparency Wall',
      description: 'Campus complaints live in one shared flow: public viewing, student posting, and authority resolution.',
      icon: 'fa-triangle-exclamation',
      view: '../complaints/view.html',
      post: '../complaints/post.html',
      resolve: '../complaints/resolve.html'
    },
    notices: {
      title: 'Notices',
      description: 'Official announcements for students, hostelers, faculty, and campus-wide audiences.',
      icon: 'fa-bullhorn',
      view: '../notices/view.html',
      post: '../notices/post.html'
    },
    leaders: {
      title: 'Academic Leaders',
      description: 'A shared board for academic leadership highlights and updates.',
      icon: 'fa-user-tie',
      view: '../leaders/view.html',
      post: '../leaders/post.html'
    },
    alumni: {
      title: 'Alumni Excellence',
      description: 'A shared space for alumni stories, placements, awards, and institutional pride.',
      icon: 'fa-graduation-cap',
      view: '../alumni/view.html',
      post: '../alumni/post.html'
    },
    achievements: {
      title: 'Achievements',
      description: 'Academic, research, sports, cultural, and innovation achievements in one place.',
      icon: 'fa-trophy',
      view: '../achievements/view.html',
      post: '../achievements/post.html'
    },
    routine: {
      title: 'Routine',
      description: 'Class routines are viewed by students and teachers, while posting stays with authorized staff.',
      icon: 'fa-calendar-days',
      view: '../routine/view.html',
      post: '../routine/post.html'
    },
    assignments: {
      title: 'Assignments',
      description: 'Students view and submit assignments; teachers post and track assignment work.',
      icon: 'fa-file-pen',
      view: '../assignments/view.html',
      post: '../assignments/post.html'
    },
    documents: {
      title: 'Documents',
      description: 'Student documents and notes are managed through a shared view and upload flow.',
      icon: 'fa-file-pdf',
      view: '../documents/view.html',
      post: '../documents/post.html'
    },
    'mar-moocs': {
      title: 'MAR & MOOCs',
      description: 'MAR activities and MOOC records are submitted and reviewed from a shared module.',
      icon: 'fa-award',
      view: '../mar-moocs/view.html',
      post: '../mar-moocs/post.html'
    },
    'mess-menu': {
      title: 'Mess Menu',
      description: 'Hostel mess menus can be viewed by residents and edited by authorized staff.',
      icon: 'fa-utensils',
      view: '../mess-menu/view.html',
      post: '../mess-menu/post.html'
    },
    library: {
      title: 'Library',
      description: 'A single searchable library page for everyone. No separate role copies.',
      icon: 'fa-book-open',
      view: 'library.html'
    },
    profile: {
      title: 'Profile',
      description: 'View and edit account details from one shared profile page.',
      icon: 'fa-user-gear',
      view: 'profile.html'
    },
    'gate-pass': {
      title: 'Gate Pass Approval',
      description: 'Hosteler leave and gate-pass approvals live in one authority-facing page.',
      icon: 'fa-stamp',
      view: '../gate-pass/approve.html'
    },
    'student-database': {
      title: 'Student Database',
      description: 'Read-only student database for teachers, mentors, and wardens.',
      icon: 'fa-users',
      view: '../student-database/view.html'
    }
  };

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    const info = moduleInfo[cfg.module] || { title: cfg.title || 'CampusCare Module', description: '', icon: 'fa-layer-group' };
    document.title = `${info.title} | CampusCare`;
    document.body.innerHTML = shell(info);
    renderPage(info);
  }

  function shell(info) {
    const rootPrefix = getRootPrefix();
    const icon = `fa-solid ${info.icon}`;
    const links = Object.entries(info)
      .filter(([key, value]) => ['view', 'post', 'resolve'].includes(key) && value)
      .map(([key, value]) => `<a class="btn-dashboard ${cfg.mode === key ? 'active' : ''}" href="${value}"><i class="fa-solid ${key === 'post' ? 'fa-plus' : key === 'resolve' ? 'fa-check' : 'fa-eye'}"></i> ${label(key)}</a>`)
      .join('');
    const role = label(user.role || 'Guest');
    const userName = user.name || user.fullName || 'User';
    const dateText = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    return `
      <div class="module-page">
        <div class="dashboard-wrapper modern-layout">
          <aside class="sidebar">
            <a href="${rootPrefix}index.html" class="logo-container">
              <img
                src="${rootPrefix}assets/images/hero-illustration.png"
                alt="Logo"
                class="logo-icon"
                onerror="this.src='https://ui-avatars.com/api/?name=CC&background=6b46c1&color=fff&rounded=true'"
              />
              <div class="logo-text">CampusCare</div>
            </a>

            <div class="sidebar-portal-text" style="padding: 0 24px; margin-bottom: 8px; font-size: 0.75rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px;">
              Module
            </div>

            <ul class="nav-menu">
              <li><a href="${rootPrefix}index.html" class="nav-item"><i class="fa-solid fa-house-chimney"></i> Home</a></li>
              <li><a href="${rootPrefix}student/index.html" class="nav-item"><i class="fa-solid fa-user-graduate"></i> Student</a></li>
              <li><a href="${rootPrefix}teacher/index.html" class="nav-item"><i class="fa-solid fa-chalkboard-user"></i> Teacher</a></li>
              <li><a href="${rootPrefix}modules/complaints/view.html" class="nav-item ${cfg.module === 'complaints' ? 'active' : ''}"><i class="fa-solid fa-triangle-exclamation"></i> Complaints</a></li>
              <li><a href="${rootPrefix}modules/notices/view.html" class="nav-item ${cfg.module === 'notices' ? 'active' : ''}"><i class="fa-solid fa-bullhorn"></i> Notices</a></li>
              <li><a href="${rootPrefix}modules/routine/view.html" class="nav-item ${cfg.module === 'routine' ? 'active' : ''}"><i class="fa-solid fa-calendar-days"></i> Routine</a></li>
              <li><a href="${rootPrefix}modules/assignments/view.html" class="nav-item ${cfg.module === 'assignments' ? 'active' : ''}"><i class="fa-solid fa-file-pen"></i> Assignments</a></li>
              <li><a href="${rootPrefix}modules/documents/view.html" class="nav-item ${cfg.module === 'documents' ? 'active' : ''}"><i class="fa-solid fa-file-pdf"></i> Documents</a></li>
              <li><a href="${rootPrefix}modules/mar-moocs/view.html" class="nav-item ${cfg.module === 'mar-moocs' ? 'active' : ''}"><i class="fa-solid fa-award"></i> MAR & MOOCs</a></li>
              <li><a href="${rootPrefix}modules/library.html" class="nav-item ${cfg.module === 'library' ? 'active' : ''}"><i class="fa-solid fa-book-open"></i> Library</a></li>
            </ul>

            <div class="sidebar-bottom">
              <a href="${rootPrefix}modules/profile.html" class="nav-item ${cfg.module === 'profile' ? 'active' : ''}"><i class="fa-solid fa-gear"></i> Settings</a>
              <a href="javascript:void(0)" class="nav-item" data-action="logout" style="color: var(--danger);"><i class="fa-solid fa-right-from-bracket"></i> Logout</a>
            </div>
          </aside>

          <main class="main-content">
            <header class="top-navbar">
              <div class="nav-left" style="display: flex; align-items: center; gap: 32px">
                <h1 style="margin: 0; font-size: 1.8rem; font-weight: 700; color: var(--text-dark);">
                  CampusCare <span class="module-role-badge">${role}</span>
                </h1>
                <div class="search-bar">
                  <i class="fa-solid fa-search" style="color: var(--text-muted)"></i>
                  <input type="text" placeholder="Search ${info.title.toLowerCase()}..." aria-label="Search module" />
                </div>
              </div>
              <div class="nav-right" style="display: flex; align-items: center; gap: 20px">
                <span class="date-display"><i class="fa-regular fa-calendar"></i> ${dateText}</span>
                <button type="button" class="btn-pill btn-outline-purple" id="moduleAssistantBtn"><i class="fa-solid fa-robot"></i> Assistant</button>
                <button type="button" class="btn-pill btn-outline-red" id="moduleSosBtn"><i class="fa-solid fa-bell-concierge"></i> SOS</button>
                <div id="userProfile" class="user-profile" data-action="toggleProfileMenu" style="display: flex; cursor: pointer; position: relative">
                  <img id="userAvatar" class="user-avatar" src="https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=random" alt="Profile" />
                  <div style="display: flex; flex-direction: column;">
                    <span id="userName" class="user-name" style="cursor: pointer; margin-bottom: 2px;">Hi, ${esc(userName)}</span>
                    <span style="font-size: 0.75rem; color: var(--text-muted);">${role}</span>
                  </div>
                  <div id="profileMenu" class="module-profile-menu">
                    <strong>${esc(userName)}</strong>
                    <span>${esc(user.email || role)}</span>
                    <a href="${rootPrefix}modules/profile.html">View profile</a>
                  </div>
                </div>
              </div>
            </header>

            <section class="hero-card module-hero-card" id="home">
              <div class="hero-content">
                <div class="module-title-icon"><i class="${icon}"></i></div>
                <h1>${info.title}</h1>
                <p>${info.description}</p>
                <nav class="module-actions">
                  ${links}
                  <button type="button" id="dashboardBtn" class="btn-dashboard"><i class="fa-solid fa-house"></i> Dashboard</button>
                </nav>
              </div>
              <div class="hero-image">
                <img src="${rootPrefix}assets/images/guest_illustration.png" alt="CampusCare assistant" onerror="this.style.display='none'" />
              </div>
            </section>

            <section id="moduleContent" class="module-content"></section>

            <div id="module-modal-overlay" class="modal-overlay">
              <div class="module-modal section-card">
                <button type="button" id="moduleModalClose" class="module-modal-close"><i class="fa-solid fa-xmark"></i></button>
                <div id="moduleModalBody"></div>
              </div>
            </div>
          </main>
        </div>
      </div>`;
  }

  function renderPage(info) {
    document.getElementById('dashboardBtn').addEventListener('click', goToDashboard);
    document.getElementById('moduleAssistantBtn')?.addEventListener('click', () => openModuleModal('assistant'));
    document.getElementById('moduleSosBtn')?.addEventListener('click', () => openModuleModal('sos'));
    document.getElementById('moduleModalClose')?.addEventListener('click', closeModuleModal);
    document.getElementById('module-modal-overlay')?.addEventListener('click', event => {
      if (event.target.id === 'module-modal-overlay') closeModuleModal();
    });
    document.getElementById('userProfile')?.addEventListener('click', toggleProfileMenu);
    if (cfg.module === 'library') return renderLibrary();
    if (cfg.module === 'profile') return renderProfile();
    if (cfg.module === 'gate-pass') return renderGatePassApproval();
    if (cfg.module === 'student-database') return renderStudentDatabase();
    if (cfg.module === 'complaints' && cfg.mode === 'resolve') return renderComplaintResolution();
    if (cfg.mode === 'post') return renderPostForm(info);
    return renderList(info);
  }

  async function renderList(info) {
    const el = content(`<div class="section-card module-panel"><div class="section-header"><h2><i class="${`fa-solid ${info.icon}`}"></i> ${info.title} List</h2></div><div id="listState" class="module-empty"><i class="fa-solid fa-spinner fa-spin"></i><span>Loading ${info.title.toLowerCase()}...</span></div></div>`);
    try {
      const data = await fetchList();
      el.querySelector('#listState').outerHTML = cards(data, info);
    } catch (error) {
      el.querySelector('#listState').textContent = `Unable to load ${info.title.toLowerCase()}.`;
    }
  }

  async function fetchList() {
    const token = user.token || localStorage.getItem('token') || '';
    const map = {
      complaints: '/api/complaints',
      notices: '/api/notices?role=public',
      assignments: '/api/assignments',
      documents: '/api/documents',
      'mar-moocs': '/api/mar-moocs',
      routine: '/api/routine/student',
      'mess-menu': '/api/warden/mess',
      leaders: '/api/academic-leaders',
      alumni: '/api/alumni',
      achievements: '/api/achievements'
    };
    const endpoint = map[cfg.module];
    if (!endpoint) return localItems(cfg.module);
    const res = await fetch(`${apiBase}${endpoint}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    if (!res.ok) throw new Error('load failed');
    const data = await res.json();
    if (cfg.module === 'mar-moocs') return data.records || [];
    return Array.isArray(data) ? data : [];
  }

  function cards(items, info) {
    if (!items.length) return `<div class="module-empty"><i class="fa-regular fa-folder-open"></i><span>No ${info.title.toLowerCase()} records found.</span></div>`;
    return `<div class="module-grid">${items.map(item => `
      <article class="module-card section-card">
        <div class="module-card-icon"><i class="fa-solid ${info.icon || 'fa-layer-group'}"></i></div>
        <h3>${esc(item.title || item.name || item.subjectName || item.subject || 'Untitled')}</h3>
        <p>${esc(item.description || item.content || item.details || item.status || item.platform || 'No details available.')}</p>
        <div class="module-meta">
          ${item.category ? `<span class="module-pill">${esc(item.category)}</span>` : ''}
          ${item.priority ? `<span class="module-pill">${esc(item.priority)}</span>` : ''}
          ${item.audience ? `<span class="module-pill">${esc(item.audience)}</span>` : ''}
          ${item.createdAt || item.date ? `<span>${new Date(item.createdAt || item.date).toLocaleDateString()}</span>` : ''}
        </div>
      </article>`).join('')}</div>`;
  }

  function renderPostForm(info) {
    const fields = postFields();
    content(`
      <div class="section-card module-panel">
        <div class="section-header"><h2><i class="${`fa-solid ${info.icon}`}"></i> Post ${info.title}</h2></div>
        <form id="modulePostForm" class="module-form">
          ${fields}
          <button class="module-btn primary" type="submit"><i class="fa-solid fa-paper-plane"></i> Submit</button>
        </form>
      </div>`);
    document.getElementById('modulePostForm').addEventListener('submit', submitPost);
  }

  function postFields() {
    if (cfg.module === 'complaints') return `
      <label>Subject<input name="title" required></label>
      <label>Issue Details<textarea name="description" required></textarea></label>
      <label>Attachment<input name="image" type="file" accept="image/*"></label>`;
    if (cfg.module === 'notices') return `
      <label>Title<input name="title" required></label>
      <label>Audience<select name="audience" required><option value="general">General</option><option value="student">Students</option><option value="teacher">Teachers</option><option value="hosteler">Hostelers</option></select></label>
      <label>Notice Content<textarea name="content" required></textarea></label>`;
    if (cfg.module === 'routine') return `
      <label>Day<select name="day" required><option>Monday</option><option>Tuesday</option><option>Wednesday</option><option>Thursday</option><option>Friday</option><option>Saturday</option></select></label>
      <label>Time Slot<input name="timeSlot" placeholder="09:30 - 10:30" required></label>
      <label>Subject<input name="subjectName" required></label>
      <label>Year<input name="year" required></label>
      <label>Batch<input name="batch" required></label>`;
    if (cfg.module === 'assignments') return `
      <label>Title<input name="title" required></label>
      <label>Subject<input name="subject" required></label>
      <label>Department<input name="department" required></label>
      <label>Year<input name="year" required></label>
      <label>Batch<input name="batch" required></label>
      <label>Deadline<input name="deadline" type="date" required></label>
      <label>Description<textarea name="description" required></textarea></label>`;
    if (cfg.module === 'documents') return `
      <label>Document Name<input name="title" required></label>
      <label>Type<input name="type" placeholder="Certificate, Marksheet, Note" required></label>
      <label>File<input name="file" type="file" required></label>`;
    if (cfg.module === 'mar-moocs') return `
      <label>Category<select name="category" required><option value="mar">MAR</option><option value="mooc">MOOC</option></select></label>
      <label>Title<input name="title" required></label>
      <label>Platform<input name="platform" required></label>
      <label>Points/Credits<input name="points" type="number" min="0" required></label>
      <label>Proof File<input name="file" type="file" required></label>`;
    if (cfg.module === 'mess-menu') return `
      <label>Day<select name="day" required><option>Monday</option><option>Tuesday</option><option>Wednesday</option><option>Thursday</option><option>Friday</option><option>Saturday</option><option>Sunday</option></select></label>
      <label>Breakfast<input name="breakfast" required></label>
      <label>Lunch<input name="lunch" required></label>
      <label>Snacks<input name="snacks"></label>
      <label>Dinner<input name="dinner" required></label>`;
    return `
      <label>Title<input name="title" required></label>
      <label>Category<input name="category"></label>
      <label>Details<textarea name="description" required></textarea></label>`;
  }

  async function submitPost(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const token = user.token || localStorage.getItem('token') || '';
    const endpoint = {
      complaints: '/api/complaints',
      notices: '/api/content/notice',
      assignments: '/api/assignments',
      documents: '/api/documents',
      'mar-moocs': '/api/mar-moocs',
      routine: '/api/routine',
      'mess-menu': '/api/warden/mess',
      achievements: '/api/achievements'
    }[cfg.module];
    const hasFile = !!form.querySelector('input[type="file"]');
    const data = hasFile ? new FormData(form) : Object.fromEntries(new FormData(form).entries());
    if (cfg.module === 'complaints' && user._id) data.append('studentId', user._id);
    if (!endpoint) {
      saveLocal(cfg.module, Object.fromEntries(new FormData(form).entries()));
      alert('Saved locally for this static module.');
      form.reset();
      return;
    }
    const res = await fetch(`${apiBase}${endpoint}`, {
      method: cfg.module === 'mess-menu' ? 'PUT' : 'POST',
      headers: hasFile ? { Authorization: `Bearer ${token}` } : { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: hasFile ? data : JSON.stringify(data)
    });
    if (!res.ok) {
      alert('Submission failed. Please check your login and backend server.');
      return;
    }
    alert('Submitted successfully.');
    form.reset();
  }

  async function renderComplaintResolution() {
    content(`
      <div class="section-card module-panel">
        <div class="section-header"><h2><i class="fa-solid fa-check-circle"></i> Resolve Complaints</h2></div>
        <div class="module-actions" style="justify-content:flex-start; margin-bottom:12px;">
          <select id="priorityFilter" class="module-btn"><option value="All">All Priorities</option><option>Urgent</option><option>High</option><option>Medium</option><option>Low</option></select>
        </div>
        <div id="resolveList" class="module-empty"><i class="fa-solid fa-spinner fa-spin"></i><span>Loading complaints...</span></div>
      </div>`);
    await loadResolveComplaints();
    document.getElementById('priorityFilter').addEventListener('change', loadResolveComplaints);
  }

  async function loadResolveComplaints() {
    const list = document.getElementById('resolveList');
    const filter = document.getElementById('priorityFilter')?.value || 'All';
    const token = user.token || '';
    try {
      const res = await fetch(`${apiBase}/api/warden/complaints?t=${Date.now()}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('failed');
      let complaints = await res.json();
      if (filter !== 'All') complaints = complaints.filter(c => c.priority === filter);
      list.outerHTML = `<div id="resolveList" class="module-grid">${complaints.map(c => `
        <article class="module-card section-card">
          <h3>${esc(c.title)}</h3>
          <p>${esc(c.description || '')}</p>
          <div class="module-meta"><span class="module-pill">${esc(c.priority || 'Priority')}</span><span>${esc(c.status || 'Pending')}</span></div>
          ${c.status === 'Resolved' ? '<button class="module-btn" disabled>Resolved</button>' : `
            <form class="resolveForm module-form" data-id="${c._id}">
              <label>Resolution Proof<input type="file" name="resolutionImage" accept="image/*" required></label>
              <button class="module-btn primary" type="submit"><i class="fa-solid fa-check"></i> Confirm Resolution</button>
            </form>`}
        </article>`).join('') || '<div class="module-empty">No complaints to resolve.</div>'}</div>`;
      document.querySelectorAll('.resolveForm').forEach(form => form.addEventListener('submit', submitResolution));
    } catch (error) {
      list.textContent = 'Unable to load complaints. Please login as an authorized user.';
    }
  }

  async function submitResolution(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const res = await fetch(`${apiBase}/api/warden/complaints/${form.dataset.id}/resolve`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${user.token || ''}` },
      body: new FormData(form)
    });
    alert(res.ok ? 'Complaint resolved.' : 'Could not resolve complaint.');
    if (res.ok) loadResolveComplaints();
  }

  async function renderLibrary() {
    content(`
      <div class="section-card module-panel">
        <div class="section-header"><h2><i class="fa-solid fa-book-open"></i> Search Library</h2></div>
        <form id="librarySearch" class="module-form" style="margin-bottom:16px;">
          <label>Search<input id="searchInput" placeholder="Book title, author, subject"></label>
          <label>Category<input id="categoryFilter" placeholder="All"></label>
        </form>
        <div id="bookList" class="module-grid"></div>
      </div>`);
    const load = async () => {
      const search = document.getElementById('searchInput').value.trim();
      const category = document.getElementById('categoryFilter').value.trim();
      const list = document.getElementById('bookList');
        list.innerHTML = '<div class="module-empty"><i class="fa-solid fa-spinner fa-spin"></i><span>Loading books...</span></div>';
      try {
        const res = await fetch(`${apiBase}/api/library?${new URLSearchParams({ search, category })}`);
        const books = res.ok ? await res.json() : [];
        list.innerHTML = cards(books, { title: 'Books' });
      } catch {
        list.innerHTML = '<div class="module-empty"><i class="fa-solid fa-circle-exclamation"></i><span>Unable to load library.</span></div>';
      }
    };
    document.getElementById('librarySearch').addEventListener('input', debounce(load, 300));
    load();
  }

  function renderProfile() {
    const name = user.name || 'User';
    content(`
      <div class="section-card module-panel">
        <div class="section-header"><h2><i class="fa-solid fa-user-gear"></i> View / Edit Profile</h2></div>
        <form id="profileForm" class="module-form">
          <label>Name<input name="name" value="${esc(name)}"></label>
          <label>Email<input name="email" value="${esc(user.email || '')}"></label>
          <label>Department<input name="department" value="${esc(user.department || '')}"></label>
          <label>Phone<input name="phone" value="${esc(user.phone || '')}"></label>
          <button class="module-btn primary" type="submit"><i class="fa-solid fa-floppy-disk"></i> Save Changes</button>
        </form>
      </div>`);
    document.getElementById('profileForm').addEventListener('submit', e => {
      e.preventDefault();
      const next = { ...user, ...Object.fromEntries(new FormData(e.currentTarget).entries()) };
      localStorage.setItem('user', JSON.stringify(next));
      alert('Profile saved locally.');
    });
  }

  async function renderGatePassApproval() {
    content(`<div class="section-card module-panel"><div class="section-header"><h2><i class="fa-solid fa-stamp"></i> Approve Gate Pass / Leave</h2></div><div id="leaveList" class="module-empty"><i class="fa-solid fa-spinner fa-spin"></i><span>Loading leave requests...</span></div></div>`);
    try {
      const res = await fetch(`${apiBase}/api/warden/leaves`, { headers: { Authorization: `Bearer ${user.token || ''}` } });
      const leaves = res.ok ? await res.json() : [];
      document.getElementById('leaveList').outerHTML = table(leaves, ['studentName', 'fromDate', 'toDate', 'reason', 'status']);
    } catch {
      document.getElementById('leaveList').textContent = 'Unable to load gate-pass approvals.';
    }
  }

  async function renderStudentDatabase() {
    content(`<div class="section-card module-panel"><div class="section-header"><h2><i class="fa-solid fa-users"></i> Student Database</h2></div><div id="studentList" class="module-empty"><i class="fa-solid fa-spinner fa-spin"></i><span>Loading students...</span></div></div>`);
    try {
      const res = await fetch(`${apiBase}/api/teacher/all-students`, { headers: { Authorization: `Bearer ${user.token || ''}` } });
      const students = res.ok ? await res.json() : [];
      document.getElementById('studentList').outerHTML = table(students, ['name', 'rollNumber', 'department', 'year', 'batch', 'email']);
    } catch {
      document.getElementById('studentList').textContent = 'Unable to load student database.';
    }
  }

  function table(rows, columns) {
    if (!rows.length) return '<div class="module-empty"><i class="fa-regular fa-folder-open"></i><span>No records found.</span></div>';
    return `<div class="module-table-wrap"><table class="module-table dashboard-table"><thead><tr>${columns.map(c => `<th>${label(c)}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${columns.map(c => `<td>${esc(row[c] || row.student?.[c] || '')}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }

  function content(html) {
    const el = document.getElementById('moduleContent');
    el.innerHTML = html;
    return el;
  }

  function localItems(key) {
    return safeJson(localStorage.getItem(`cc_${key}`)) || [];
  }

  function saveLocal(key, item) {
    const items = localItems(key);
    items.unshift({ ...item, createdAt: new Date().toISOString() });
    localStorage.setItem(`cc_${key}`, JSON.stringify(items));
  }

  function goToDashboard() {
    const role = (user.role || '').toLowerCase();
    const rootPrefix = getRootPrefix();
    const target = role === 'warden' ? `${rootPrefix}warden/index.html`
      : role === 'principal' ? `${rootPrefix}principal/index.html`
      : role === 'hod' ? `${rootPrefix}hod/index.html`
      : role === 'teacher' ? `${rootPrefix}teacher/index.html`
      : role === 'hosteler' ? `${rootPrefix}hostel/index.html`
      : role === 'student' ? `${rootPrefix}student/index.html`
      : `${rootPrefix}index.html`;
    window.location.href = target;
  }

  function toggleProfileMenu(event) {
    event.stopPropagation();
    const menu = document.getElementById('profileMenu');
    if (!menu) return;
    menu.style.display = menu.style.display === 'grid' ? 'none' : 'grid';
  }

  function openModuleModal(mode) {
    const overlay = document.getElementById('module-modal-overlay');
    const body = document.getElementById('moduleModalBody');
    if (!overlay || !body) return;
    if (mode === 'sos') {
      body.innerHTML = `
        <div class="module-modal-icon danger"><i class="fa-solid fa-bell-concierge"></i></div>
        <h2>SOS & On-Site Assistance</h2>
        <p>Select the emergency path you need right now.</p>
        <div class="module-modal-grid">
          <a href="tel:100" class="module-emergency-link"><i class="fa-solid fa-shield-halved"></i> Campus Security</a>
          <a href="tel:101" class="module-emergency-link"><i class="fa-solid fa-truck-medical"></i> Medical Help</a>
          <button type="button" class="module-emergency-link" data-alert="Fire emergency request sent."><i class="fa-solid fa-fire"></i> Fire Emergency</button>
          <button type="button" class="module-emergency-link" data-alert="Campus assistance request sent."><i class="fa-solid fa-headset"></i> Other Help</button>
        </div>`;
    } else {
      body.innerHTML = `
        <div class="module-modal-icon"><i class="fa-solid fa-robot"></i></div>
        <h2>Campus AI Assistant</h2>
        <p>Ask about modules, routine, notices, assignments, or campus services.</p>
        <div id="ai-chat-history" class="module-ai-history"></div>
        <div class="ai-input-wrapper">
          <input type="text" id="ai-input" placeholder="Ask me anything..." />
          <button type="button" id="ai-send-btn" onclick="window.askAI ? askAI() : alert('Assistant is loading.')"><i class="fa-solid fa-arrow-right"></i></button>
        </div>`;
    }
    body.querySelectorAll('[data-alert]').forEach(btn => btn.addEventListener('click', () => alert(btn.dataset.alert)));
    overlay.style.display = 'flex';
  }

  function closeModuleModal() {
    const overlay = document.getElementById('module-modal-overlay');
    if (overlay) overlay.style.display = 'none';
  }

  function getRootPrefix() {
    const afterModules = window.location.pathname.split('/modules/')[1] || '';
    return afterModules.includes('/') ? '../../' : '../';
  }

  function safeJson(text) {
    try { return text ? JSON.parse(text) : null; } catch { return null; }
  }

  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[ch]));
  }

  function label(text) {
    return String(text).replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  function debounce(fn, wait) {
    let id;
    return () => {
      clearTimeout(id);
      id = setTimeout(fn, wait);
    };
  }
})();
