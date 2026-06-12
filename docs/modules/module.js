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
    
    const userRole = (user.role || 'Guest').toLowerCase();
    const role = label(user.role || 'Guest');
    const userName = user.name || user.fullName || 'User';
    const dateText = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    let portalText = 'Module';
    let navMenuHtml = '';

    if (userRole === 'student' || userRole === 'hosteler') {
      portalText = 'Student Portal';
      navMenuHtml = `
        <li><a href="${rootPrefix}student/index.html" class="nav-item"><i class="fa-solid fa-house-chimney"></i> Home</a></li>
        <li><a href="${rootPrefix}modules/routine/view.html" class="nav-item ${cfg.module === 'routine' ? 'active' : ''}"><i class="fa-regular fa-calendar"></i> Class Routine</a></li>
        <li><a href="${rootPrefix}modules/assignments/view.html" class="nav-item ${cfg.module === 'assignments' ? 'active' : ''}"><i class="fa-solid fa-file-pen"></i> Assignments</a></li>
        <li><a href="${rootPrefix}modules/documents/view.html" class="nav-item ${cfg.module === 'documents' ? 'active' : ''}"><i class="fa-solid fa-file-pdf"></i> Documents</a></li>
        <li><a href="${rootPrefix}modules/notices/view.html" class="nav-item ${cfg.module === 'notices' ? 'active' : ''}"><i class="fa-regular fa-bell"></i> Personal Notice</a></li>
        <li><a href="${rootPrefix}modules/mar-moocs/view.html" class="nav-item ${cfg.module === 'mar-moocs' ? 'active' : ''}"><i class="fa-solid fa-award"></i> MAR & MOOCs</a></li>
      `;
    } else if (userRole === 'teacher') {
      portalText = 'Teacher Portal';
      navMenuHtml = `
        <li><a href="${rootPrefix}teacher/index.html" class="nav-item"><i class="fa-solid fa-house-chimney"></i> Dashboard</a></li>
        <li><a href="${rootPrefix}modules/routine/view.html" class="nav-item ${cfg.module === 'routine' ? 'active' : ''}"><i class="fa-solid fa-calendar-days"></i> My Classes</a></li>
        <li><a href="${rootPrefix}modules/assignments/post.html" class="nav-item ${cfg.module === 'assignments' ? 'active' : ''}"><i class="fa-solid fa-file-pen"></i> Assignments</a></li>
        <li><a href="${rootPrefix}modules/documents/post.html" class="nav-item ${cfg.module === 'documents' ? 'active' : ''}"><i class="fa-solid fa-file-arrow-up"></i> Notes</a></li>
        <li><a href="${rootPrefix}modules/student-database/view.html" class="nav-item ${cfg.module === 'student-database' ? 'active' : ''}"><i class="fa-solid fa-users"></i> Students</a></li>
        <li><a href="${rootPrefix}teacher/mentees.html" class="nav-item"><i class="fa-solid fa-hands-holding-child"></i> Mentees</a></li>
        <li><a href="${rootPrefix}modules/complaints/resolve.html" class="nav-item ${cfg.module === 'complaints' ? 'active' : ''}"><i class="fa-solid fa-circle-exclamation"></i> Complaints</a></li>
        <li><a href="${rootPrefix}modules/mar-moocs/post.html" class="nav-item ${cfg.module === 'mar-moocs' ? 'active' : ''}"><i class="fa-solid fa-award"></i> MAR & MOOCs</a></li>
        <li><a href="${rootPrefix}teacher/personal_space.html" class="nav-item"><i class="fa-solid fa-folder-open"></i> Personal Space</a></li>
        <li><a href="${rootPrefix}modules/library.html" class="nav-item ${cfg.module === 'library' ? 'active' : ''}"><i class="fa-solid fa-book"></i> Library</a></li>
        <li><a href="${rootPrefix}modules/notices/post.html" class="nav-item ${cfg.module === 'notices' ? 'active' : ''}"><i class="fa-regular fa-bell"></i> Official Notices</a></li>
      `;
    } else if (userRole === 'warden') {
      portalText = 'Warden Portal';
      navMenuHtml = `
        <li><a href="${rootPrefix}warden/index.html" class="nav-item"><i class="fa-solid fa-house-chimney"></i> Dashboard</a></li>
        <li><a href="${rootPrefix}modules/gate-pass/approve.html" class="nav-item ${cfg.module === 'gate-pass' ? 'active' : ''}"><i class="fa-solid fa-stamp"></i> Leave Approvals</a></li>
        <li><a href="${rootPrefix}modules/complaints/resolve.html" class="nav-item ${cfg.module === 'complaints' ? 'active' : ''}"><i class="fa-solid fa-triangle-exclamation"></i> Complaints</a></li>
        <li><a href="${rootPrefix}modules/mess-menu/post.html" class="nav-item ${cfg.module === 'mess-menu' ? 'active' : ''}"><i class="fa-solid fa-utensils"></i> Mess Menu</a></li>
        <li><a href="${rootPrefix}modules/student-database/view.html" class="nav-item ${cfg.module === 'student-database' ? 'active' : ''}"><i class="fa-solid fa-users"></i> Residents</a></li>
        <li><a href="${rootPrefix}modules/notices/post.html" class="nav-item ${cfg.module === 'notices' ? 'active' : ''}"><i class="fa-solid fa-bullhorn"></i> Notice Board</a></li>
        <li><a href="${rootPrefix}modules/library.html" class="nav-item ${cfg.module === 'library' ? 'active' : ''}"><i class="fa-solid fa-book-open"></i> Library</a></li>
      `;
    } else if (userRole === 'hod') {
      portalText = 'HOD Portal';
      navMenuHtml = `
        <li><a href="${rootPrefix}hod/index.html" class="nav-item"><i class="fa-solid fa-house-chimney"></i> Dashboard</a></li>
        <li><a href="${rootPrefix}modules/gate-pass/approve.html" class="nav-item ${cfg.module === 'gate-pass' ? 'active' : ''}"><i class="fa-solid fa-file-signature"></i> Leave Requests</a></li>
        <li><a href="${rootPrefix}modules/complaints/resolve.html" class="nav-item ${cfg.module === 'complaints' ? 'active' : ''}"><i class="fa-solid fa-gavel"></i> Dept Complaints</a></li>
        <li><a href="${rootPrefix}hod/subject_allocation.html" class="nav-item"><i class="fa-solid fa-book-open-reader"></i> Subject Allocation</a></li>
        <li><a href="${rootPrefix}modules/routine/post.html" class="nav-item ${cfg.module === 'routine' ? 'active' : ''}"><i class="fa-solid fa-calendar-week"></i> Routine Management</a></li>
        <li><a href="${rootPrefix}hod/mentors.html" class="nav-item"><i class="fa-solid fa-chalkboard-user"></i> Mentor Assignment</a></li>
        <li><a href="${rootPrefix}modules/student-database/view.html" class="nav-item ${cfg.module === 'student-database' ? 'active' : ''}"><i class="fa-solid fa-user-graduate"></i> Students</a></li>
        <li><a href="${rootPrefix}hod/teachers.html" class="nav-item"><i class="fa-solid fa-person-chalkboard"></i> Teachers</a></li>
        <li><a href="${rootPrefix}modules/notices/post.html" class="nav-item ${cfg.module === 'notices' ? 'active' : ''}"><i class="fa-solid fa-bullhorn"></i> Notices</a></li>
      `;
    } else if (userRole === 'principal') {
      portalText = 'Principal Portal';
      navMenuHtml = `
        <li><a href="${rootPrefix}principal/index.html" class="nav-item"><i class="fa-solid fa-house-chimney"></i> Dashboard</a></li>
        <li><a href="${rootPrefix}modules/student-database/view.html" class="nav-item ${cfg.module === 'student-database' ? 'active' : ''}"><i class="fa-solid fa-user-graduate"></i> All Students</a></li>
        <li><a href="${rootPrefix}principal/teachers.html" class="nav-item"><i class="fa-solid fa-person-chalkboard"></i> All Teachers</a></li>
        <li><a href="${rootPrefix}principal/hods.html" class="nav-item"><i class="fa-solid fa-user-tie"></i> HODs</a></li>
        <li><a href="${rootPrefix}principal/wardens.html" class="nav-item"><i class="fa-solid fa-user-shield"></i> Wardens</a></li>
        <li><a href="${rootPrefix}modules/complaints/resolve.html" class="nav-item ${cfg.module === 'complaints' ? 'active' : ''}"><i class="fa-solid fa-list-check"></i> Complaints</a></li>
        <li><a href="${rootPrefix}modules/notices/post.html" class="nav-item ${cfg.module === 'notices' ? 'active' : ''}"><i class="fa-solid fa-bullhorn"></i> Global Notices</a></li>
        <li><a href="${rootPrefix}modules/library.html" class="nav-item ${cfg.module === 'library' ? 'active' : ''}"><i class="fa-solid fa-book"></i> Central Library</a></li>
      `;
    } else {
      portalText = 'Guest Portal';
      navMenuHtml = `
        <li><a href="${rootPrefix}index.html" class="nav-item"><i class="fa-solid fa-house-chimney"></i> Home</a></li>
        <li><a href="${rootPrefix}index.html#complaint-wall" class="nav-item"><i class="fa-solid fa-shield-halved"></i> Transparency Wall</a></li>
        <li><a href="${rootPrefix}modules/notices/view.html" class="nav-item ${cfg.module === 'notices' ? 'active' : ''}"><i class="fa-regular fa-calendar-days"></i> News & Events</a></li>
        <li><a href="${rootPrefix}index.html#faculty" class="nav-item"><i class="fa-solid fa-user-group"></i> Academic Leaders</a></li>
        <li><a href="${rootPrefix}index.html#alumni-section" class="nav-item"><i class="fa-solid fa-graduation-cap"></i> Alumni</a></li>
      `;
    }

    let badgeBg = 'var(--primary)';
    if (userRole === 'warden') badgeBg = 'var(--success)';
    const roleBadge = user.role ? `<span style="font-size: 0.8rem; background: ${badgeBg}; color: white; padding: 4px 10px; border-radius: var(--radius-full); vertical-align: middle; margin-left: 8px; text-transform: uppercase;">${role}</span>` : '';

    const badgeColors = {
      student: { bg: "#dbeafe", color: "#1d4ed8" },
      hosteler: { bg: "#fef3c7", color: "#b45309" },
      teacher: { bg: "#d1fae5", color: "#065f46" },
      hod: { bg: "#ede9fe", color: "#6d28d9" },
      dean: { bg: "#ede9fe", color: "#6d28d9" },
      principal: { bg: "#ede9fe", color: "#6d28d9" },
      warden: { bg: "#fee2e2", color: "#b91c1c" },
      admin: { bg: "#f3f4f6", color: "#374151" },
    };
    const colors = badgeColors[userRole] || { bg: "#ede9fe", color: "#6d28d9" };
    const roleLabel = user.role ? (user.role.toUpperCase() === 'HOD' ? 'HOD' : user.role.charAt(0).toUpperCase() + user.role.slice(1)) : 'Member';

    let profileSectionHtml = '';
    if (user.token) {
      profileSectionHtml = `
                <div id="userProfile" class="user-profile" data-action="toggleProfileMenu" style="display: flex; align-items: center; gap: 8px; cursor: pointer; position: relative">
                  <img id="userAvatar" class="user-avatar" src="https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=random" alt="Profile" />
                  <span id="userName" class="user-name" style="cursor: pointer">Hi, ${esc(userName)}</span>
                  <div id="profileMenu" style="
                    display: none;
                    position: absolute;
                    top: calc(100% + 10px);
                    right: 0;
                    background: var(--bg-color);
                    padding: 20px;
                    border-radius: var(--radius-lg);
                    box-shadow: var(--shadow-lg);
                    z-index: 1000;
                    border: 1px solid var(--border-color);
                    animation: fadeIn 0.2s ease;
                    text-align: left;
                  ">
                    <div style="display: flex; flex-direction: column; gap: 12px; min-width: 240px; padding: 2px;">
                      <!-- Line 1: Header with Badge -->
                      <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border-color); padding-bottom: 10px; margin-bottom: 2px;">
                        <span style="font-weight: 700; font-size: 0.95rem; color: var(--text-dark);">Account Details</span>
                        <span class="role-badge-mini" style="text-transform: uppercase; font-size: 0.7rem; font-weight: 700; padding: 2px 8px; border-radius: var(--radius-sm); background: ${colors.bg}; color: ${colors.color};">${roleLabel}</span>
                      </div>
                      
                      <!-- Line 2: Details -->
                      <div id="userDetails" style="display: flex; flex-direction: column; gap: 4px; font-size: 0.8rem; color: var(--text-muted); line-height: 1.5; margin: 0 !important; text-align: left;">
                        <strong style="font-size: 0.95rem; color: var(--text-dark);">${esc(user.name || "User")}</strong>
                        <span style="word-break: break-all;">${esc(user.email || "")}</span>
                        <span style="font-weight: 500;">
                          ID: ${esc(user.rollNumber || user.employeeId || user.identifier || "--")}
                          ${user.department ? ` • Dept: ${esc(user.department)}` : ""}
                          ${user.hostelName ? ` • Hostel: ${esc(user.hostelName)}` : ""}
                        </span>
                      </div>

                      <!-- Line 3: Actions -->
                      <div style="display: flex; gap: 8px; margin-top: 6px; border-top: 1px solid var(--border-color); padding-top: 12px;">
                        <a href="${rootPrefix}modules/profile.html" class="btn-outline-purple" style="flex: 1 !important; text-align: center; font-size: 0.8rem; padding: 8px 10px; text-decoration: none; border-radius: var(--radius-sm); font-weight: 600; display: inline-flex; align-items: center; justify-content: center; gap: 6px; transition: all 0.2s; margin-top: 0 !important; width: auto !important;">
                          <i class="fa-regular fa-user"></i> Profile
                        </a>
                        <button type="button" data-action="logout" class="btn-outline-red" style="flex: 1 !important; font-size: 0.8rem; padding: 8px 10px; border-radius: var(--radius-sm); font-weight: 600; display: inline-flex; align-items: center; justify-content: center; gap: 6px; cursor: pointer; border: 1px solid var(--danger); transition: all 0.2s; margin-top: 0 !important; width: auto !important;">
                          <i class="fa-solid fa-right-from-bracket"></i> Logout
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
      `;
    } else {
      profileSectionHtml = `
                <a href="${rootPrefix}login.html" id="loginBtn" class="btn-pill btn-filled-purple">
                  <i class="fa-solid fa-right-to-bracket"></i> Login
                </a>
      `;
    }

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
              ${portalText}
            </div>

            <ul class="nav-menu">
              ${navMenuHtml}
            </ul>

            <div class="sidebar-bottom" style="display: flex !important; flex-direction: column !important; width: 100% !important; gap: 4px !important;">
              <a href="${rootPrefix}modules/profile.html" class="nav-item ${cfg.module === 'profile' ? 'active' : ''}"><i class="fa-solid fa-gear"></i> Settings</a>
              <a href="javascript:void(0)" class="nav-item" data-action="logout" style="color: var(--danger);"><i class="fa-solid fa-right-from-bracket"></i> Logout</a>
            </div>
          </aside>

          <main class="main-content">
            <header class="top-navbar">
              <div class="nav-left" style="display: flex; align-items: center; gap: 32px">
                <h1 style="margin: 0; font-size: 1.8rem; font-weight: 700; color: var(--text-dark); display: flex; align-items: center;">
                  <a href="${rootPrefix}index.html" style="text-decoration: none; color: inherit; cursor: pointer;">CampusCare</a> ${roleBadge}
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
                ${profileSectionHtml}
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
      </div>
    `;
  }

  function renderPage(info) {
    if (cfg.module === 'notices') {
      document.getElementById('dashboardBtn')?.addEventListener('click', goToDashboard);
      document.getElementById('moduleAssistantBtn')?.addEventListener('click', () => openModuleModal('assistant'));
      document.getElementById('moduleSosBtn')?.addEventListener('click', () => openModuleModal('sos'));
      document.getElementById('moduleModalClose')?.addEventListener('click', closeModuleModal);
      document.getElementById('module-modal-overlay')?.addEventListener('click', event => {
        if (event.target.id === 'module-modal-overlay') closeModuleModal();
      });
      document.getElementById('userProfile')?.addEventListener('click', toggleProfileMenu);
      
      document.querySelectorAll('[data-action="logout"]').forEach(btn => {
        btn.addEventListener('click', () => {
          localStorage.removeItem('user');
          window.location.href = `${getRootPrefix()}index.html`;
        });
      });

      if (cfg.mode === 'post') renderPostForm(info);
      else {
        // Hide the hero card in Notices list view
        const hero = document.getElementById('home');
        if (hero) hero.style.display = 'none';
        renderNoticesList();
      }
      initSidebar();
      return;
    }

    document.getElementById('dashboardBtn').addEventListener('click', goToDashboard);
    document.getElementById('moduleAssistantBtn')?.addEventListener('click', () => openModuleModal('assistant'));
    document.getElementById('moduleSosBtn')?.addEventListener('click', () => openModuleModal('sos'));
    document.getElementById('moduleModalClose')?.addEventListener('click', closeModuleModal);
    document.getElementById('module-modal-overlay')?.addEventListener('click', event => {
      if (event.target.id === 'module-modal-overlay') closeModuleModal();
    });
    document.getElementById('userProfile')?.addEventListener('click', toggleProfileMenu);
    if (cfg.module === 'library') renderLibrary();
    else if (cfg.module === 'profile') renderProfile();
    else if (cfg.module === 'gate-pass') renderGatePassApproval();
    else if (cfg.module === 'student-database') renderStudentDatabase();
    else if (cfg.module === 'complaints' && cfg.mode === 'resolve') renderComplaintResolution();
    else if (cfg.mode === 'post') renderPostForm(info);
    else renderList(info);

    initSidebar();
  }

  async function renderNoticesList() {
    const el = content(`
      <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 28px;">
        <button type="button" id="noticeBackBtn" style="background: #f8fafc; border: 1px solid #e2e8f0; font-size: 1.1rem; color: #475569; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 42px; height: 42px; border-radius: 50%; transition: all 0.2s;" onmouseenter="this.style.background='#e2e8f0';" onmouseleave="this.style.background='#f8fafc';">
          <i class="fa-solid fa-arrow-left"></i>
        </button>
        <div>
          <h2 style="margin: 0; font-size: 1.6rem; font-weight: 800; color: #1e1b4b; font-family: 'Poppins', sans-serif;">Notices</h2>
          <p style="margin: 4px 0 0 0; font-size: 0.9rem; color: #64748b;">Official announcements for students, faculty, and campus-wide audiences.</p>
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 16px;">
        <!-- Filter Tabs -->
        <div id="noticeFilterTabs" style="display: flex; gap: 8px; flex-wrap: wrap;">
          <button type="button" class="filter-tab active" data-filter="all" style="padding: 8px 18px; border-radius: 20px; font-size: 0.9rem; font-weight: 600; cursor: pointer; border: none; transition: all 0.2s; background: #6b46c1; color: white;">All Notices</button>
          <button type="button" class="filter-tab" data-filter="general" style="padding: 8px 18px; border-radius: 20px; font-size: 0.9rem; font-weight: 600; cursor: pointer; border: 1px solid #e2e8f0; transition: all 0.2s; background: #fff; color: #475569;">General</button>
          <button type="button" class="filter-tab" data-filter="student" style="padding: 8px 18px; border-radius: 20px; font-size: 0.9rem; font-weight: 600; cursor: pointer; border: 1px solid #e2e8f0; transition: all 0.2s; background: #fff; color: #475569;">Students</button>
          <button type="button" class="filter-tab" data-filter="teacher" style="padding: 8px 18px; border-radius: 20px; font-size: 0.9rem; font-weight: 600; cursor: pointer; border: 1px solid #e2e8f0; transition: all 0.2s; background: #fff; color: #475569;">Teachers</button>
          <button type="button" class="filter-tab" data-filter="hosteler" style="padding: 8px 18px; border-radius: 20px; font-size: 0.9rem; font-weight: 600; cursor: pointer; border: 1px solid #e2e8f0; transition: all 0.2s; background: #fff; color: #475569;">Hostelers</button>
          <button type="button" class="filter-tab" data-filter="admin" style="padding: 8px 18px; border-radius: 20px; font-size: 0.9rem; font-weight: 600; cursor: pointer; border: 1px solid #e2e8f0; transition: all 0.2s; background: #fff; color: #475569;">Administrators</button>
        </div>
        <!-- Right Sort Dropdown -->
        <div>
          <select id="sortNotices" style="padding: 8px 16px; border-radius: 12px; font-size: 0.9rem; font-weight: 600; color: #475569; border: 1px solid #e2e8f0; background: #fff; outline: none; cursor: pointer;">
            <option value="recent">Most Recent</option>
            <option value="oldest">Oldest</option>
          </select>
        </div>
      </div>
      
      <div id="noticesVerticalList">
        <div style="text-align: center; padding: 40px; color: #64748b;">
          <i class="fa-solid fa-spinner fa-spin" style="font-size: 1.5rem; margin-bottom: 8px;"></i>
          <div>Loading notices...</div>
        </div>
      </div>
    `);

    document.getElementById('noticeBackBtn')?.addEventListener('click', goToDashboard);

    let loadedNotices = [];
    let activeFilter = 'all';
    let activeSort = 'recent';

    // Click handler for tabs
    const tabs = el.querySelectorAll('.filter-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => {
          t.classList.remove('active');
          t.style.background = '#fff';
          t.style.border = '1px solid #e2e8f0';
          t.style.color = '#475569';
        });
        tab.classList.add('active');
        tab.style.background = '#6b46c1';
        tab.style.border = 'none';
        tab.style.color = '#fff';
        activeFilter = tab.dataset.filter;
        renderFiltered();
      });
    });

    // Sort handler
    const sortSelect = el.querySelector('#sortNotices');
    sortSelect.addEventListener('change', (e) => {
      activeSort = e.target.value;
      renderFiltered();
    });

    try {
      loadedNotices = await fetchList();
      renderFiltered();
    } catch (error) {
      el.querySelector('#noticesVerticalList').innerHTML = `
        <div style="text-align: center; padding: 40px; color: #ef4444;">
          <i class="fa-solid fa-triangle-exclamation" style="font-size: 2rem; margin-bottom: 8px;"></i>
          <div>Unable to load notices. Please try again later.</div>
        </div>
      `;
    }

    function renderFiltered() {
      // Filter
      let filtered = [...loadedNotices];
      if (activeFilter !== 'all') {
        filtered = filtered.filter(n => {
          const aud = (n.audience || '').toLowerCase();
          if (activeFilter === 'general') return aud === 'general';
          if (activeFilter === 'student') return aud === 'student' || aud === 'students';
          if (activeFilter === 'teacher') return aud === 'teacher' || aud === 'teachers';
          if (activeFilter === 'hosteler') return aud === 'hosteler' || aud === 'hostelers';
          if (activeFilter === 'admin') return aud === 'admin' || aud === 'warden' || aud === 'principal' || aud === 'hod' || aud === 'administrator' || aud === 'administrators';
          return true;
        });
      }

      // Sort
      if (activeSort === 'recent') {
        filtered.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
      } else {
        filtered.sort((a, b) => new Date(a.date || a.createdAt) - new Date(b.date || b.createdAt));
      }

      const listContainer = el.querySelector('#noticesVerticalList');
      if (filtered.length === 0) {
        listContainer.innerHTML = `
          <div style="text-align: center; padding: 60px 20px; background: #fff; border-radius: 16px; border: 1px solid #e2e8f0; color: #64748b;">
            <i class="fa-regular fa-folder-open" style="font-size: 2.5rem; margin-bottom: 12px; color: #94a3b8;"></i>
            <div style="font-size: 1.05rem; font-weight: 600;">No notices found</div>
            <div style="font-size: 0.85rem; margin-top: 4px; color: #94a3b8;">There are no announcements in this category.</div>
          </div>
        `;
        return;
      }

      listContainer.innerHTML = filtered.map((item, idx) => {
        const title = item.title || 'Untitled Notice';
        const contentSnippet = item.content || item.description || 'No description available.';
        const audience = item.audience || 'general';
        const d = new Date(item.date || item.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
        
        let iconClass = 'fa-bullhorn';
        let bgStyle = 'background: #eff6ff; color: #3b82f6;'; 
        
        const titleLower = title.toLowerCase();
        if (titleLower.includes('vacation') || titleLower.includes('holiday') || titleLower.includes('winter') || titleLower.includes('summer')) {
          iconClass = 'fa-calendar-day';
          bgStyle = 'background: #fff1f2; color: #f43f5e;'; 
        } else if (titleLower.includes('fair') || titleLower.includes('competition') || titleLower.includes('sports') || titleLower.includes('tournament') || titleLower.includes('draw')) {
          iconClass = 'fa-trophy';
          bgStyle = 'background: #fef9c3; color: #ca8a04;'; 
        } else if (titleLower.includes('meeting') || titleLower.includes('faculty') || titleLower.includes('routine')) {
          iconClass = 'fa-book-open';
          bgStyle = 'background: #faf5ff; color: #a855f7;'; 
        } else if (titleLower.includes('environment') || titleLower.includes('celebration') || titleLower.includes('fest')) {
          iconClass = 'fa-cake-candles';
          bgStyle = 'background: #fff5f5; color: #ff6b6b;'; 
        } else if (titleLower.includes('scholarship') || titleLower.includes('apply') || titleLower.includes('admission')) {
          iconClass = 'fa-graduation-cap';
          bgStyle = 'background: #e0e7ff; color: #4f46e5;'; 
        } else if (titleLower.includes('library') || titleLower.includes('book')) {
          iconClass = 'fa-bullhorn';
          bgStyle = 'background: #eff6ff; color: #3b82f6;'; 
        }

        let badgeLabel = 'General';
        let badgeStyle = 'background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1;';
        const aud = audience.toLowerCase();
        if (aud === 'student' || aud === 'students') {
          badgeStyle = 'background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe;';
          badgeLabel = 'Students';
        } else if (aud === 'teacher' || aud === 'teachers') {
          badgeStyle = 'background: #fdf2f8; color: #9d174d; border: 1px solid #fbcfe8;';
          badgeLabel = 'Teachers';
        } else if (aud === 'hosteler' || aud === 'hostelers') {
          badgeStyle = 'background: #fffbeb; color: #92400e; border: 1px solid #fde68a;';
          badgeLabel = 'Hostelers';
        } else if (['admin', 'warden', 'principal', 'hod'].includes(aud)) {
          badgeStyle = 'background: #faf5ff; color: #6b46c1; border: 1px solid #e9d5ff;';
          badgeLabel = 'Administrators';
        } else {
          badgeStyle = 'background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0;';
        }

        return `
          <div class="notice-row" data-id="${item._id}" style="background: #ffffff; border: 1px solid #f1f5f9; border-radius: 16px; padding: 20px 24px; display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.01); transition: all 0.2s; cursor: pointer;" onmouseenter="this.style.borderColor='#e2e8f0'; this.style.boxShadow='0 6px 16px rgba(0,0,0,0.02)';" onmouseleave="this.style.borderColor='#f1f5f9'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.01)';">
            <div style="display: flex; align-items: center; gap: 20px; flex: 1; min-width: 0;">
              <div style="width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; flex-shrink: 0; ${bgStyle}">
                <i class="fa-solid ${iconClass}"></i>
              </div>
              <div style="min-width: 0; flex: 1;">
                <div style="margin-bottom: 6px;">
                  <span style="${badgeStyle} padding: 4px 10px; border-radius: 20px; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">${badgeLabel}</span>
                </div>
                <h3 style="margin: 0 0 6px 0; font-size: 1.1rem; font-weight: 700; color: #1e1b4b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${esc(title)}</h3>
                <p style="margin: 0; font-size: 0.85rem; color: #64748b; line-height: 1.5; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${esc(contentSnippet)}</p>
              </div>
            </div>
            <div style="display: flex; align-items: center; margin-left: 20px; flex-shrink: 0;">
              <span style="font-size: 0.85rem; font-weight: 600; color: #64748b; margin-right: 16px;">${d}</span>
              <i class="fa-solid fa-chevron-right" style="font-size: 0.9rem; color: #94a3b8;"></i>
            </div>
          </div>
        `;
      }).join('');

      listContainer.querySelectorAll('.notice-row').forEach(row => {
        row.addEventListener('click', () => {
          const id = row.dataset.id;
          openNoticeModal(id);
        });
      });
    }

    function openNoticeModal(noticeId) {
      const overlay = document.getElementById('module-modal-overlay');
      const body = document.getElementById('moduleModalBody');
      if (!overlay || !body) return;
      const notice = loadedNotices.find(n => n._id === noticeId);
      if (notice) {
        const d = new Date(notice.date || notice.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
        
        let badgeStyle = 'background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1;';
        const aud = (notice.audience || 'general').toLowerCase();
        let badgeLabel = 'General';
        if (aud === 'student' || aud === 'students') {
          badgeStyle = 'background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe;';
          badgeLabel = 'Students';
        } else if (aud === 'teacher' || aud === 'teachers') {
          badgeStyle = 'background: #fdf2f8; color: #9d174d; border: 1px solid #fbcfe8;';
          badgeLabel = 'Teachers';
        } else if (aud === 'hosteler' || aud === 'hostelers') {
          badgeStyle = 'background: #fffbeb; color: #92400e; border: 1px solid #fde68a;';
          badgeLabel = 'Hostelers';
        } else if (['admin', 'warden', 'principal', 'hod'].includes(aud)) {
          badgeStyle = 'background: #faf5ff; color: #6b46c1; border: 1px solid #e9d5ff;';
          badgeLabel = 'Administrators';
        } else {
          badgeStyle = 'background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0;';
        }

        body.innerHTML = `
          <div class="module-modal-icon" style="color: #6b46c1; background: #f3f0ff; width: 56px; height: 56px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; margin: 0 auto 20px auto;"><i class="fa-solid fa-bullhorn"></i></div>
          <h2 style="margin: 0 0 12px 0; color: #1e1b4b; font-weight: 700; font-size: 1.4rem; text-align: center;">${esc(notice.title)}</h2>
          <div style="font-size: 0.85rem; color: #64748b; margin-bottom: 20px; font-weight: 600; text-align: center; display: flex; align-items: center; justify-content: center; gap: 8px;">
            <span style="${badgeStyle} padding: 4px 10px; border-radius: 20px; font-size: 0.72rem; font-weight: 700; text-transform: uppercase;">${badgeLabel}</span>
            <span>&bull;</span>
            <span>${d}</span>
          </div>
          <div style="text-align: left; background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; max-height: 280px; overflow-y: auto; color: #334155; line-height: 1.6; font-size: 0.95rem; white-space: pre-wrap;">
            ${esc(notice.content || notice.description || '')}
          </div>
        `;
        overlay.style.display = 'flex';
      }
    }
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
    let endpoint = map[cfg.module];
    if (cfg.module === 'notices') {
      const role = (user.role || 'public').toLowerCase();
      const userId = user._id || '';
      const dept = user.department || '';
      endpoint = `/api/notices?role=${role}&userId=${userId}&department=${dept}`;
    }
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
    menu.style.display = menu.style.display === 'block' || menu.style.display === 'flex' ? 'none' : 'block';
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

  function initSidebar() {
    if (window.sidebarInitialized) return;
    window.sidebarInitialized = true;
    document.querySelectorAll(".nav-item").forEach(item => {
      function wrapTextNodes(element) {
        if (element.classList.contains("badge-count") || (element.id && (element.id.toLowerCase().includes("badge") || element.id.toLowerCase().includes("count")))) {
          return; // Don't wrap badge elements
        }
        
        const childNodes = Array.from(element.childNodes);
        childNodes.forEach(node => {
          if (node.nodeType === Node.TEXT_NODE) {
            const val = node.textContent.trim();
            if (val.length > 0) {
              const span = document.createElement("span");
              span.className = "nav-label";
              span.textContent = val;
              if (node.parentNode) {
                node.parentNode.replaceChild(span, node);
              }
            }
          } else if (node.nodeType === Node.ELEMENT_NODE && node.tagName !== "I" && node.tagName !== "SPAN") {
            wrapTextNodes(node);
          } else if (node.nodeType === Node.ELEMENT_NODE && node.tagName === "SPAN") {
            if (!node.classList.contains("nav-label") && !node.classList.contains("badge-count") && !(node.id && (node.id.toLowerCase().includes("badge") || node.id.toLowerCase().includes("count")))) {
              wrapTextNodes(node);
            }
          }
        });
      }

      // Determine the full tooltip text (before wrapping text nodes)
      let fullText = "";
      item.childNodes.forEach(node => {
        if (node.nodeType === Node.TEXT_NODE) {
          fullText += node.textContent.trim();
        } else if (node.nodeType === Node.ELEMENT_NODE && !node.classList.contains("badge-count") && !(node.id && (node.id.toLowerCase().includes("badge") || node.id.toLowerCase().includes("count")))) {
          // Handle nested span text (like in Warden leaves)
          fullText += node.textContent.trim();
        }
      });
      fullText = fullText.trim();
      if (fullText) {
        item.setAttribute("data-tooltip", fullText);
        item.setAttribute("aria-label", fullText);
        item.setAttribute("title", fullText);
      }

      wrapTextNodes(item);
    });
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
