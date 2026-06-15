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
      description: 'A single searchable library page for everyone.',
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
        <li><a href="${rootPrefix}modules/student-database/view.html" class="nav-item ${cfg.module === 'student-database' && !window.location.search.includes('filter=my-mentees') ? 'active' : ''}"><i class="fa-solid fa-users"></i> Students</a></li>
        <li><a href="${rootPrefix}modules/student-database/view.html?filter=my-mentees" class="nav-item ${cfg.module === 'student-database' && window.location.search.includes('filter=my-mentees') ? 'active' : ''}"><i class="fa-solid fa-hands-holding-child"></i> Mentees</a></li>
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
        <li><a href="${rootPrefix}hod/mentor_allocation.html" class="nav-item"><i class="fa-solid fa-chalkboard-user"></i> Mentor Assignment</a></li>
        <li><a href="${rootPrefix}modules/student-database/view.html" class="nav-item ${cfg.module === 'student-database' && !window.location.search.includes('filter=dept-teachers') ? 'active' : ''}"><i class="fa-solid fa-user-graduate"></i> Students</a></li>
        <li><a href="${rootPrefix}modules/student-database/view.html?filter=dept-teachers" class="nav-item ${cfg.module === 'student-database' && window.location.search.includes('filter=dept-teachers') ? 'active' : ''}"><i class="fa-solid fa-person-chalkboard"></i> Teachers</a></li>
        <li><a href="${rootPrefix}modules/notices/post.html" class="nav-item ${cfg.module === 'notices' ? 'active' : ''}"><i class="fa-solid fa-bullhorn"></i> Notices</a></li>
      `;
    } else if (userRole === 'principal') {
      portalText = 'Principal Portal';
      navMenuHtml = `
        <li><a href="${rootPrefix}principal/index.html" class="nav-item"><i class="fa-solid fa-house-chimney"></i> Dashboard</a></li>
        <li><a href="${rootPrefix}modules/student-database/view.html" class="nav-item ${cfg.module === 'student-database' && !window.location.search.includes('filter') ? 'active' : ''}"><i class="fa-solid fa-user-graduate"></i> All Students</a></li>
        <li><a href="${rootPrefix}modules/student-database/view.html?filter=all-teachers" class="nav-item ${cfg.module === 'student-database' && window.location.search.includes('filter=all-teachers') ? 'active' : ''}"><i class="fa-solid fa-person-chalkboard"></i> All Teachers</a></li>
        <li><a href="${rootPrefix}modules/student-database/view.html?filter=all-hods" class="nav-item ${cfg.module === 'student-database' && window.location.search.includes('filter=all-hods') ? 'active' : ''}"><i class="fa-solid fa-user-tie"></i> HODs</a></li>
        <li><a href="${rootPrefix}modules/student-database/view.html?filter=all-wardens" class="nav-item ${cfg.module === 'student-database' && window.location.search.includes('filter=all-wardens') ? 'active' : ''}"><i class="fa-solid fa-user-shield"></i> Wardens</a></li>
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

    let roleColor = "10b981";
    if (userRole === "student") roleColor = "3b82f6";
    else if (userRole === "hosteler") roleColor = "f59e0b";
    else if (userRole === "teacher") roleColor = "10b981";
    else if (userRole === "warden") roleColor = "ef4444";

    let avatarSrc = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || "User")}&background=${roleColor}&color=fff&rounded=true&bold=true`;

    if (user.profilePicture) {
      let cleanPath = user.profilePicture;
      if (cleanPath.startsWith("http")) {
        avatarSrc = cleanPath;
      } else {
        const isLocal = ['localhost', '127.0.0.1', ''].includes(window.location.hostname) || window.location.protocol === 'file:';
        const BACKEND_URL = isLocal ? 'http://localhost:5000' : 'https://campuscare-backend-96cn.onrender.com';
        if (cleanPath.startsWith("/")) {
          avatarSrc = `${BACKEND_URL}${cleanPath}`;
        } else {
          avatarSrc = `${BACKEND_URL}/${cleanPath}`;
        }
      }
      avatarSrc += `?t=${new Date().getTime()}`;
    }

    const displayName = (user.name || user.fullName || 'User').split(' ')[0];

    let profileSectionHtml = '';
    if (user.token) {
      profileSectionHtml = `
                <div id="userProfile" class="user-profile" data-action="toggleProfileMenu" style="display: flex; align-items: center; gap: 8px; cursor: pointer; position: relative">
                  <img id="userAvatar" class="user-avatar" src="${avatarSrc}" onerror="this.onerror=null; this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=${roleColor}&color=fff&rounded=true&bold=true';" style="object-fit: cover;" alt="Profile" />
                  <span id="userName" class="user-name" style="cursor: pointer">Hi, ${esc(displayName)}</span>
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
              ${user.token ? `
                <a href="${rootPrefix}modules/complaints/post.html" class="nav-item ${cfg.module === 'complaints' && cfg.mode === 'post' ? 'active' : ''}"><i class="fa-solid fa-circle-plus"></i> Register Complaint</a>
              ` : `
                <a href="${rootPrefix}modules/profile.html" class="nav-item ${cfg.module === 'profile' ? 'active' : ''}"><i class="fa-solid fa-gear"></i> Settings</a>
              `}
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

      if (cfg.mode === 'post') {
        // Hide the hero card in Notices post view
        const hero = document.getElementById('home');
        if (hero) hero.style.display = 'none';
        renderNoticesPostForm(info);
      } else {
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

    if (cfg.module === 'complaints') {
      const hero = document.getElementById('home');
      if (hero) hero.style.display = 'none';
      renderComplaintsPage(info);
      initSidebar();
      return;
    }

    if (cfg.module === 'leaders') {
      const hero = document.getElementById('home');
      if (hero) hero.style.display = 'none';
      renderLeadersPage(info);
      initSidebar();
      return;
    }

    if (cfg.module === 'library') renderLibrary();
    else if (cfg.module === 'profile') renderProfile();
    else if (cfg.module === 'gate-pass') renderGatePassApproval();
    else if (cfg.module === 'student-database') renderStudentDatabase();
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
      
      <style>
        #noticesVerticalList {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
          align-items: start;
        }
        @media (max-width: 900px) {
          #noticesVerticalList { grid-template-columns: 1fr; }
        }
      </style>
      <div id="noticesVerticalList">
        <div style="text-align: center; padding: 40px; color: #64748b; grid-column: 1 / -1;">
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
        <div style="text-align: center; padding: 40px; color: #ef4444; grid-column: 1 / -1;">
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
          <div style="text-align: center; padding: 60px 20px; background: #fff; border-radius: 16px; border: 1px solid #e2e8f0; color: #64748b; grid-column: 1 / -1;">
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
        const posterName = item.postedBy?.name || item.postedByName || 'Administration';
        const posterRole = item.postedBy?.designation || item.postedBy?.role || '';
        
        let iconClass = 'fa-bullhorn';
        let bgStyle = 'background: linear-gradient(135deg, #eff6ff, #dbeafe); color: #3b82f6;'; 
        
        const titleLower = title.toLowerCase();
        if (titleLower.includes('vacation') || titleLower.includes('holiday') || titleLower.includes('winter') || titleLower.includes('summer')) {
          iconClass = 'fa-calendar-day';
          bgStyle = 'background: linear-gradient(135deg, #fff1f2, #ffe4e6); color: #f43f5e;'; 
        } else if (titleLower.includes('fair') || titleLower.includes('competition') || titleLower.includes('sports') || titleLower.includes('tournament') || titleLower.includes('draw')) {
          iconClass = 'fa-trophy';
          bgStyle = 'background: linear-gradient(135deg, #fef9c3, #fef08a); color: #ca8a04;'; 
        } else if (titleLower.includes('meeting') || titleLower.includes('faculty') || titleLower.includes('routine')) {
          iconClass = 'fa-book-open';
          bgStyle = 'background: linear-gradient(135deg, #faf5ff, #ede9fe); color: #a855f7;'; 
        } else if (titleLower.includes('environment') || titleLower.includes('celebration') || titleLower.includes('fest')) {
          iconClass = 'fa-cake-candles';
          bgStyle = 'background: linear-gradient(135deg, #fff5f5, #ffe4e6); color: #ff6b6b;'; 
        } else if (titleLower.includes('scholarship') || titleLower.includes('apply') || titleLower.includes('admission')) {
          iconClass = 'fa-graduation-cap';
          bgStyle = 'background: linear-gradient(135deg, #e0e7ff, #c7d2fe); color: #4f46e5;'; 
        } else if (titleLower.includes('exam') || titleLower.includes('result') || titleLower.includes('test')) {
          iconClass = 'fa-file-pen';
          bgStyle = 'background: linear-gradient(135deg, #ecfdf5, #d1fae5); color: #059669;'; 
        }

        let badgeLabel = 'General';
        let badgeStyle = 'background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0;';
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
        }

        const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(posterName)}&background=6b46c1&color=fff&rounded=true&bold=true&size=32`;
        const posterAvatar = item.postedBy?.profilePicture || avatarUrl;

        return `
          <div class="notice-row" data-id="${item._id}" style="background: #ffffff; border: 1px solid #f1f5f9; border-radius: 18px; padding: 22px 24px; display: flex; flex-direction: column; gap: 14px; box-shadow: 0 2px 12px rgba(0,0,0,0.04); transition: all 0.22s; cursor: pointer; position: relative; overflow: hidden;" onmouseenter="this.style.borderColor='#c4b5fd'; this.style.boxShadow='0 8px 28px rgba(107,70,193,0.1)'; this.style.transform='translateY(-2px)';" onmouseleave="this.style.borderColor='#f1f5f9'; this.style.boxShadow='0 2px 12px rgba(0,0,0,0.04)'; this.style.transform='none';">
            <!-- Top Row: Icon + Badge -->
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <div style="width: 46px; height: 46px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; flex-shrink: 0; ${bgStyle}">
                <i class="fa-solid ${iconClass}"></i>
              </div>
              <div style="display: flex; align-items: center; gap: 10px;">
                <span style="${badgeStyle} padding: 4px 10px; border-radius: 20px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">${badgeLabel}</span>
                <span style="font-size: 0.8rem; font-weight: 600; color: #94a3b8;">${d}</span>
              </div>
            </div>

            <!-- Title + Snippet -->
            <div style="flex: 1;">
              <h3 style="margin: 0 0 6px 0; font-size: 1.05rem; font-weight: 700; color: #1e1b4b; line-height: 1.35; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${esc(title)}</h3>
              <p style="margin: 0; font-size: 0.85rem; color: #64748b; line-height: 1.55; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${stripNoticeContent(contentSnippet)}</p>
            </div>

            <!-- Footer: Poster info + Read More -->
            <div style="display: flex; align-items: center; justify-content: space-between; padding-top: 10px; border-top: 1px solid #f1f5f9;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <img src="${posterAvatar}" alt="${esc(posterName)}" style="width: 26px; height: 26px; border-radius: 50%; object-fit: cover; border: 1.5px solid #e9d5ff;" onerror="this.src='${avatarUrl}'">
                <span style="font-size: 0.8rem; font-weight: 600; color: #475569; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 130px;">${esc(posterName)}${posterRole ? `<span style="color:#94a3b8; font-weight:400;"> · ${esc(posterRole)}</span>` : ''}</span>
              </div>
              <span style="font-size: 0.8rem; font-weight: 600; color: #6b46c1; display: flex; align-items: center; gap: 4px;">Read <i class="fa-solid fa-arrow-right" style="font-size: 0.7rem;"></i></span>
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

        const posterName = (typeof notice.postedBy === 'object' && notice.postedBy?.name)
          ? notice.postedBy.name
          : (typeof notice.postedBy === 'string' && notice.postedBy !== notice.postedBy.match(/^[a-f\d]{24}$/i)?.[0] ? notice.postedBy : 'Administration');
        const posterRole = notice.postedBy?.designation || notice.postedBy?.role || '';
        const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(posterName)}&background=6b46c1&color=fff&rounded=true&bold=true&size=40`;
        const posterAvatar = notice.postedBy?.profilePicture || avatarUrl;

        body.innerHTML = `
          <div class="module-modal-icon" style="color: #6b46c1; background: #f3f0ff; width: 56px; height: 56px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; margin: 0 auto 20px auto;"><i class="fa-solid fa-bullhorn"></i></div>
          <h2 style="margin: 0 0 12px 0; color: #1e1b4b; font-weight: 700; font-size: 1.4rem; text-align: center;">${esc(notice.title)}</h2>
          <div style="font-size: 0.85rem; color: #64748b; margin-bottom: 20px; font-weight: 600; text-align: center; display: flex; align-items: center; justify-content: center; gap: 8px; flex-wrap: wrap;">
            <span style="${badgeStyle} padding: 4px 10px; border-radius: 20px; font-size: 0.72rem; font-weight: 700; text-transform: uppercase;">${badgeLabel}</span>
            <span>&bull;</span>
            <span>${d}</span>
          </div>
          <div style="text-align: left; background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; max-height: 260px; overflow-y: auto; color: #334155; line-height: 1.6; font-size: 0.95rem; white-space: pre-wrap; margin-bottom: 16px;">
            ${formatNoticeContent(notice.content || notice.description || '')}
          </div>
          <div style="display: flex; align-items: center; gap: 12px; padding: 14px 16px; background: #f5f3ff; border-radius: 12px; border: 1px solid #e9d5ff;">
            <img src="${posterAvatar}" alt="${esc(posterName)}" style="width: 38px; height: 38px; border-radius: 50%; object-fit: cover; border: 2px solid #c4b5fd; flex-shrink: 0;" onerror="this.src='${avatarUrl}'">
            <div>
              <div style="font-size: 0.85rem; font-weight: 700; color: #4c1d95;">Posted by ${esc(posterName)}</div>
              ${posterRole ? `<div style="font-size: 0.78rem; color: #7c3aed; font-weight: 500;">${esc(posterRole)}</div>` : ''}
            </div>
          </div>
        `;
        overlay.style.display = 'flex';
    }
  }
}

  function renderNoticesPostForm(info) {
    content(`
      <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 28px;">
        <button type="button" id="noticeBackBtn" style="background: #f8fafc; border: 1px solid #e2e8f0; font-size: 1.1rem; color: #475569; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 42px; height: 42px; border-radius: 50%; transition: all 0.2s;" onmouseenter="this.style.background='#e2e8f0';" onmouseleave="this.style.background='#f8fafc';">
          <i class="fa-solid fa-arrow-left"></i>
        </button>
        <div>
          <h2 style="margin: 0; font-size: 1.6rem; font-weight: 800; color: #1e1b4b; font-family: 'Poppins', sans-serif;">Post Notice</h2>
          <p style="margin: 4px 0 0 0; font-size: 0.9rem; color: #64748b;">Publish official announcements for students, faculty, or hostelers.</p>
        </div>
      </div>

      <div class="section-card module-panel" style="width: 100%; padding: 32px; border-radius: var(--radius-lg); background: white; border: 1px solid var(--border-color); box-shadow: var(--shadow-md);">
        <form id="modulePostForm" class="module-form" style="display: flex; flex-direction: column; gap: 24px;">
          <!-- 1st Row: Title on Left, Audience on Right -->
          <div style="display: flex; gap: 24px; width: 100%; align-items: flex-end;">
            <div style="flex: 1; display: flex; flex-direction: column; gap: 8px;">
              <label style="font-weight: 700; font-size: 0.9rem; color: var(--text-dark); text-align: left;">Notice Title</label>
              <input type="text" name="title" placeholder="Enter notice title..." required style="padding: 14px 18px; border-radius: 12px; border: 1px solid var(--border-color); outline: none; font-size: 1rem; width: 100%; transition: all 0.2s; font-weight: 500;" onfocus="this.style.borderColor='var(--primary)'; this.style.boxShadow='0 0 0 3px rgba(107, 70, 193, 0.15)';" onblur="this.style.borderColor='var(--border-color)'; this.style.boxShadow='none';">
            </div>
            
            <div style="width: 250px; display: flex; flex-direction: column; gap: 8px;">
              <label style="font-weight: 700; font-size: 0.9rem; color: var(--text-dark); text-align: left;">Target Audience</label>
              <select name="audience" required style="padding: 14px 18px; border-radius: 12px; border: 1px solid var(--border-color); outline: none; font-size: 1rem; width: 100%; background: white; cursor: pointer; transition: all 0.2s; font-weight: 500;" onfocus="this.style.borderColor='var(--primary)'; this.style.boxShadow='0 0 0 3px rgba(107, 70, 193, 0.15)';" onblur="this.style.borderColor='var(--border-color)'; this.style.boxShadow='none';">
                <option value="general">General</option>
                <option value="student">Students</option>
                <option value="teacher">Teachers</option>
                <option value="hosteler">Hostelers</option>
              </select>
            </div>
          </div>

          <!-- 2nd Row: Full-width Body (MS Word Style) -->
          <div style="display: flex; flex-direction: column; gap: 8px; flex: 1;">
            <label style="font-weight: 700; font-size: 0.9rem; color: var(--text-dark); text-align: left;">Notice Content</label>
            <div style="border: 1px solid var(--border-color); border-radius: 16px; background: #f1f5f9; padding: 24px; min-height: 500px; display: flex; flex-direction: column;" id="editorWorkspace">
              <!-- Toolbar -->
              <div style="display: flex; gap: 16px; background: white; padding: 12px 20px; border-radius: 10px; border: 1px solid var(--border-color); margin-bottom: 20px; color: var(--text-muted); font-size: 0.95rem; flex-wrap: wrap; box-shadow: var(--shadow-sm); align-items: center; text-align: left; justify-content: space-between;">
                <div style="display:flex; align-items:center; gap:16px; flex-wrap:wrap;">
                  <span style="font-weight: 700; color: var(--text-dark); font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; gap: 6px;"><i class="fa-solid fa-pen-to-square"></i> Editor Toolbar</span>
                  <span style="border-left: 1px solid var(--border-color); height: 16px;"></span>
                  <span data-format="bold" class="editor-btn"><i class="fa-solid fa-bold" title="Bold"></i></span>
                  <span data-format="italic" class="editor-btn"><i class="fa-solid fa-italic" title="Italic"></i></span>
                  <span data-format="underline" class="editor-btn"><i class="fa-solid fa-underline" title="Underline"></i></span>
                  <span style="border-left: 1px solid var(--border-color); height: 16px;"></span>
                  <span data-format="left" class="editor-btn"><i class="fa-solid fa-align-left" title="Align Left"></i></span>
                  <span data-format="center" class="editor-btn"><i class="fa-solid fa-align-center" title="Align Center"></i></span>
                  <span data-format="right" class="editor-btn"><i class="fa-solid fa-align-right" title="Align Right"></i></span>
                  <span style="border-left: 1px solid var(--border-color); height: 16px;"></span>
                  <span data-format="list-ul" class="editor-btn"><i class="fa-solid fa-list-ul" title="Bullet List"></i></span>
                  <span data-format="list-ol" class="editor-btn"><i class="fa-solid fa-list-ol" title="Numbered List"></i></span>
                  <span style="border-left: 1px solid var(--border-color); height: 16px;"></span>
                  <span data-format="link" class="editor-btn"><i class="fa-solid fa-link" title="Insert Link"></i></span>
                  <span data-format="image" class="editor-btn"><i class="fa-solid fa-image" title="Insert Image"></i></span>
                </div>
                <button type="button" id="noticeAiDraftBtn" style="display:flex; align-items:center; gap:7px; padding:8px 16px; border-radius:8px; border:1.5px solid #8b5cf6; background:#f5f3ff; color:#6d28d9; font-weight:700; font-size:0.83rem; cursor:pointer; transition:all 0.2s; white-space:nowrap;" onmouseenter="this.style.background='#6d28d9';this.style.color='white';" onmouseleave="this.style.background='#f5f3ff';this.style.color='#6d28d9';">
                  <i class="fa-solid fa-wand-magic-sparkles"></i>
                  <span id="noticeAiDraftBtnLabel">Draft with AI</span>
                </button>
              </div>
              
              <!-- Paper Sheet -->
              <div style="background: white; border: 1px solid var(--border-color); border-radius: 8px; padding: 40px 50px; flex: 1; display: flex; flex-direction: column; box-shadow: 0 4px 24px rgba(0,0,0,0.03); min-height: 400px; transition: border-color 0.2s;" onfocusin="this.style.borderColor='var(--primary)';" onfocusout="this.style.borderColor='var(--border-color)';">
                <style>
                  .editor-btn {
                    cursor: pointer;
                    transition: all 0.2s;
                    padding: 6px 10px;
                    border-radius: 6px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--text-muted);
                  }
                  .editor-btn:hover {
                    color: var(--primary) !important;
                    background: #f3f0ff;
                  }
                  .editor-btn.active {
                    color: var(--primary) !important;
                    background: #e9d5ff !important;
                  }
                  #editorContent:empty::before {
                    content: attr(placeholder);
                    color: var(--text-muted);
                    cursor: text;
                  }
                  #editorContent ul {
                    margin: 8px 0;
                    padding-left: 24px;
                    list-style-type: disc;
                  }
                  #editorContent ol {
                    margin: 8px 0;
                    padding-left: 24px;
                    list-style-type: decimal;
                  }
                  #editorContent li {
                    margin-bottom: 4px;
                  }
                </style>
                <div id="editorContent" contenteditable="true" style="outline: none; font-size: 1.05rem; width: 100%; flex: 1; min-height: 350px; line-height: 1.7; color: var(--text-dark); font-family: 'Inter', sans-serif; text-align: left;" placeholder="Start typing the body of the notice here..."></div>
                <textarea name="content" required style="display: none;"></textarea>
              </div>
            </div>
          </div>

          <div style="display: flex; justify-content: flex-end; margin-top: 10px;">
            <button type="submit" class="btn-filled-purple" style="display: flex; align-items: center; gap: 10px; padding: 14px 32px; font-size: 1rem; border-radius: 12px; cursor: pointer; font-weight: 700; border: none; background: var(--primary); color: white; transition: all 0.2s; box-shadow: 0 4px 12px rgba(107, 70, 193, 0.2);" onmouseenter="this.style.background='#55309d'; this.style.transform='translateY(-1px)';" onmouseleave="this.style.background='var(--primary)'; this.style.transform='none';">
              <i class="fa-solid fa-paper-plane"></i> Publish Notice
            </button>
          </div>
        </form>
      </div>
    `);

    document.getElementById('noticeBackBtn')?.addEventListener('click', goToDashboard);
    document.getElementById('modulePostForm').addEventListener('submit', submitPost);

    // Attach formatting toolbar handlers with focus prevention
    document.querySelectorAll('[data-format]').forEach(btn => {
      btn.addEventListener('mousedown', (e) => {
        e.preventDefault(); // Prevent editor focus loss
        formatText(btn.dataset.format);
      });
    });

    const editor = document.getElementById('editorContent');
    const textarea = document.querySelector('textarea[name="content"]');
    if (editor && textarea) {
      editor.addEventListener('input', () => {
        textarea.value = editor.innerHTML.trim() === '<br>' ? '' : editor.innerHTML;
      });

      // Update toolbar active states on selection change or caret movement
      ['keyup', 'mouseup', 'click', 'focus'].forEach(evt => {
        editor.addEventListener(evt, updateToolbarState);
      });
    }

    // AI Draft button for notice form
    document.getElementById('noticeAiDraftBtn')?.addEventListener('click', async () => {
      const btn = document.getElementById('noticeAiDraftBtn');
      const label = document.getElementById('noticeAiDraftBtnLabel');
      const titleInput = document.querySelector('#modulePostForm input[name="title"]');
      const editorEl = document.getElementById('editorContent');
      const hiddenTA = document.querySelector('textarea[name="content"]');
      const subject = titleInput?.value?.trim();

      if (!subject) {
        titleInput?.focus();
        if (titleInput) { titleInput.style.borderColor = '#ef4444'; titleInput.style.boxShadow = '0 0 0 3px rgba(239,68,68,0.15)'; }
        setTimeout(() => { if (titleInput) { titleInput.style.borderColor = 'var(--border-color)'; titleInput.style.boxShadow = 'none'; } }, 1800);
        return;
      }

      btn.disabled = true;
      if (label) label.textContent = 'Drafting…';
      btn.style.opacity = '0.7';

      try {
        const token = user.token || localStorage.getItem('token') || '';
        const res = await fetch(`${apiBase}/api/ai/generate-notice`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ prompt: subject })
        });
        if (!res.ok) throw new Error('AI request failed');
        const data = await res.json();
        if (data.body && editorEl) {
          editorEl.innerText = data.body;
          if (hiddenTA) hiddenTA.value = editorEl.innerHTML;
          // Brief glow animation on editor
          editorEl.parentElement.style.borderColor = '#8b5cf6';
          setTimeout(() => { editorEl.parentElement.style.borderColor = 'var(--border-color)'; }, 1500);
        }
      } catch (err) {
        alert('AI drafting failed. Please write your notice manually.');
      } finally {
        btn.disabled = false;
        btn.style.opacity = '1';
        if (label) label.textContent = 'Draft with AI';
      }
    });
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

  async function renderLeadersPage(info) {
    const userRole = (user.role || 'guest').toLowerCase();
    const isAuthority = ['principal', 'admin', 'dean', 'hod', 'teacher'].includes(userRole);
    const mode = cfg.mode || 'view';
    const isPostMode = mode === 'post';

    // Hide the Post link from students/guests in the sub-header links
    setTimeout(() => {
      if (!isAuthority) {
        document.querySelectorAll('.module-actions a[href*="post.html"]').forEach(el => el.style.display = 'none');
      }
    }, 50);

    if (isPostMode && !isAuthority) {
      content(`
        <div class="section-card module-panel" style="text-align: center; padding: 40px; color: var(--danger);">
          <i class="fa-solid fa-circle-exclamation" style="font-size: 3rem; margin-bottom: 16px;"></i>
          <h3>Access Denied</h3>
          <p>You do not have permission to post or edit academic leaders.</p>
        </div>
      `);
      return;
    }

    if (isPostMode) {
      content(`
        <style>
          @keyframes ai-pulse {
            0%, 100% { box-shadow: 0 0 0 0 rgba(139,92,246,0.3); }
            50% { box-shadow: 0 0 0 8px rgba(139,92,246,0); }
          }
          .ai-draft-btn {
            display: flex; align-items: center; gap: 8px;
            padding: 10px 18px; border-radius: 10px;
            border: 1.5px solid #8b5cf6; background: #f5f3ff;
            color: #6d28d9; font-weight: 600; font-size: 0.88rem;
            cursor: pointer; transition: all 0.22s; width: 100%;
            justify-content: center; letter-spacing: 0.01em;
          }
          .ai-draft-btn:hover:not(:disabled) {
            background: #6d28d9; color: white;
            box-shadow: 0 4px 16px rgba(109,40,217,0.25);
            transform: translateY(-1px);
          }
          .ai-draft-btn:disabled {
            opacity: 0.65; cursor: not-allowed;
          }
          .ai-draft-btn.loading { animation: ai-pulse 1.4s infinite; }
        </style>
        
        <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 28px;">
          <button type="button" id="leaderBackBtn" style="background: #f8fafc; border: 1px solid #e2e8f0; font-size: 1.1rem; color: #475569; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 42px; height: 42px; border-radius: 50%; transition: all 0.2s;" onmouseenter="this.style.background='#e2e8f0';" onmouseleave="this.style.background='#f8fafc';">
            <i class="fa-solid fa-arrow-left"></i>
          </button>
          <div>
            <h2 style="margin: 0; font-size: 1.6rem; font-weight: 800; color: #1e1b4b; font-family: 'Poppins', sans-serif;">Academic Leaders</h2>
            <p style="margin: 4px 0 0 0; font-size: 0.9rem; color: #64748b;">Visionary leaders directing Asansol Engineering College's academic progress.</p>
          </div>
        </div>

        <div class="section-card module-panel" style="padding: 28px; border-radius: 16px; background: white; border: 1px solid var(--border-color); box-shadow: var(--shadow-sm); max-width: 650px; margin: 0 auto;">
          <h3 style="margin-top: 0; margin-bottom: 20px; font-size: 1.25rem; font-weight: 700; color: #1e1b4b; display: flex; align-items: center; gap: 10px;">
            <i class="fa-solid fa-user-plus" style="color: var(--primary);"></i> Add Academic Leader
          </h3>
          <form id="leaderPostForm" style="display: flex; flex-direction: column; gap: 18px;">
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
              <div style="display: flex; flex-direction: column; gap: 6px;">
                <label style="font-size: 0.85rem; font-weight: 600; color: #475569;">Full Name</label>
                <input type="text" name="name" placeholder="e.g. Dr. Jane Doe" required style="padding: 10px 14px; border-radius: 10px; border: 1px solid #cbd5e1; outline: none; font-size: 0.9rem;" onfocus="this.style.borderColor='#8b5cf6';" onblur="this.style.borderColor='#cbd5e1';">
              </div>
              <div style="display: flex; flex-direction: column; gap: 6px;">
                <label style="font-size: 0.85rem; font-weight: 600; color: #475569;">Role / Designation</label>
                <select id="leaderRoleSelect" name="role" required style="padding: 10px 14px; border-radius: 10px; border: 1px solid #cbd5e1; outline: none; font-size: 0.9rem; background: white;" onfocus="this.style.borderColor='#8b5cf6';" onblur="this.style.borderColor='#cbd5e1';">
                  <option value="">Select Role</option>
                  <option value="Principal">Principal</option>
                  <option value="Vice Principal">Vice Principal</option>
                  <option value="Dean of Academics">Dean of Academics</option>
                  <option value="Dean of Students">Dean of Students</option>
                  <option value="HOD">HOD (Head of Department)</option>
                  <option value="Professor">Professor</option>
                </select>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
              <div style="display: flex; flex-direction: column; gap: 6px;">
                <label style="font-size: 0.85rem; font-weight: 600; color: #475569;">Department (if HOD/Prof)</label>
                <input type="text" name="department" id="leaderDeptInput" placeholder="e.g. CSE, ECE, Mechanical" style="padding: 10px 14px; border-radius: 10px; border: 1px solid #cbd5e1; outline: none; font-size: 0.9rem;" onfocus="this.style.borderColor='#8b5cf6';" onblur="this.style.borderColor='#cbd5e1';">
              </div>
              <div style="display: flex; flex-direction: column; gap: 6px;">
                <label style="font-size: 0.85rem; font-weight: 600; color: #475569;">Qualification</label>
                <input type="text" name="qualification" placeholder="e.g. Ph.D. in Computer Science" required style="padding: 10px 14px; border-radius: 10px; border: 1px solid #cbd5e1; outline: none; font-size: 0.9rem;" onfocus="this.style.borderColor='#8b5cf6';" onblur="this.style.borderColor='#cbd5e1';">
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
              <div style="display: flex; flex-direction: column; gap: 6px;">
                <label style="font-size: 0.85rem; font-weight: 600; color: #475569;">Years of Experience</label>
                <input type="text" name="experience" placeholder="e.g. 20 Years" style="padding: 10px 14px; border-radius: 10px; border: 1px solid #cbd5e1; outline: none; font-size: 0.9rem;" onfocus="this.style.borderColor='#8b5cf6';" onblur="this.style.borderColor='#cbd5e1';">
              </div>
              <div style="display: flex; flex-direction: column; gap: 6px;">
                <label style="font-size: 0.85rem; font-weight: 600; color: #475569;">Email Address</label>
                <input type="email" name="email" placeholder="e.g. leader@campus.com" style="padding: 10px 14px; border-radius: 10px; border: 1px solid #cbd5e1; outline: none; font-size: 0.9rem;" onfocus="this.style.borderColor='#8b5cf6';" onblur="this.style.borderColor='#cbd5e1';">
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; align-items: center;">
              <div style="display: flex; flex-direction: column; gap: 6px;">
                <label style="font-size: 0.85rem; font-weight: 600; color: #475569;">Display Priority (1 = Highest)</label>
                <input type="number" name="priority" value="5" min="1" max="100" style="padding: 10px 14px; border-radius: 10px; border: 1px solid #cbd5e1; outline: none; font-size: 0.9rem;" onfocus="this.style.borderColor='#8b5cf6';" onblur="this.style.borderColor='#cbd5e1';">
              </div>
              <div style="display: flex; flex-direction: column; gap: 6px;">
                <label style="font-size: 0.85rem; font-weight: 600; color: #475569;">Profile Picture</label>
                <input type="file" name="image" accept="image/*" style="font-size: 0.85rem; color: #64748b;">
              </div>
            </div>

            <div style="display: flex; flex-direction: column; gap: 6px;">
              <label style="font-size: 0.85rem; font-weight: 600; color: #475569; display: flex; align-items: center; justify-content: space-between;">
                <span>Inspiring Leadership Quote / Message</span>
                <span id="leaderAiTag" style="display:none; font-size:0.75rem; color:#7c3aed; font-weight:600; background:#f5f3ff; padding:2px 8px; border-radius:6px;"><i class="fa-solid fa-sparkles"></i> AI Drafted</span>
              </label>
              
              <button type="button" id="leaderAiDraftBtn" class="ai-draft-btn" style="margin-bottom: 8px;">
                <i class="fa-solid fa-wand-magic-sparkles"></i>
                <span id="leaderAiDraftBtnLabel">Draft Quote with AI</span>
              </button>

              <textarea name="message" id="leaderQuoteInput" rows="3" placeholder="A quote or welcome message from the leader..." style="padding: 10px 14px; border-radius: 10px; border: 1px solid #cbd5e1; outline: none; font-size: 0.9rem; font-family: inherit;" onfocus="this.style.borderColor='#8b5cf6';" onblur="this.style.borderColor='#cbd5e1';"></textarea>
            </div>

            <button type="submit" style="background: var(--primary); color: white; border: none; padding: 12px 20px; border-radius: 10px; font-weight: 700; font-size: 0.95rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 8px; transition: all 0.2s;" onmouseenter="this.style.background='#55309d';" onmouseleave="this.style.background='var(--primary)';">
              <i class="fa-solid fa-paper-plane"></i> Publish Leader
            </button>
          </form>
        </div>
      `);

      document.getElementById('leaderBackBtn')?.addEventListener('click', goToDashboard);

      // AI Draft Quote Event Listener
      document.getElementById('leaderAiDraftBtn')?.addEventListener('click', async () => {
        const btn = document.getElementById('leaderAiDraftBtn');
        const label = document.getElementById('leaderAiDraftBtnLabel');
        const roleSel = document.getElementById('leaderRoleSelect');
        const deptInput = document.getElementById('leaderDeptInput');
        const quoteInput = document.getElementById('leaderQuoteInput');
        const aiTag = document.getElementById('leaderAiTag');

        const roleVal = roleSel?.value;
        const deptVal = deptInput?.value?.trim();

        let promptContext = `an academic leader`;
        if (roleVal) {
          promptContext = `a ${roleVal}`;
          if (deptVal) promptContext += ` of ${deptVal} department`;
        }

        btn.disabled = true;
        btn.classList.add('loading');
        if (label) label.textContent = 'Generating message…';

        try {
          const token = user.token || localStorage.getItem('token') || '';
          const res = await fetch(`${apiBase}/api/ai/generate-leader-message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ prompt: promptContext })
          });
          if (!res.ok) throw new Error('AI request failed');
          const data = await res.json();
          if (quoteInput && data.message) {
            quoteInput.value = data.message;
            quoteInput.style.borderColor = '#8b5cf6';
            setTimeout(() => { quoteInput.style.borderColor = '#cbd5e1'; }, 1500);
          }
          if (aiTag) aiTag.style.display = 'inline-flex';
        } catch (err) {
          alert('AI drafting failed. Please write the quote manually.');
        } finally {
          btn.disabled = false;
          btn.classList.remove('loading');
          if (label) label.textContent = 'Draft Quote with AI';
        }
      });

      // Submit Form
      document.getElementById('leaderPostForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const token = user.token || localStorage.getItem('token') || '';
        const formData = new FormData(form);

        try {
          const res = await fetch(`${apiBase}/api/academic-leaders`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: formData
          });
          if (res.ok) {
            alert('Academic Leader published successfully.');
            form.reset();
            window.location.href = 'view.html';
          } else {
            const err = await res.json();
            alert(err.message || 'Failed to publish academic leader.');
          }
        } catch (error) {
          alert('Submission failed. Check network or server connection.');
        }
      });

    } else {
      // View mode
      content(`
        <style>
          #leadersGrid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
            gap: 24px;
            align-items: start;
            margin-top: 10px;
          }
          .leader-card {
            background: white;
            border-radius: 20px;
            padding: 24px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.02);
            border: 1px solid #e2e8f0;
            position: relative;
            transition: all 0.3s ease;
            display: flex;
            flex-direction: column;
            gap: 16px;
            min-height: 280px;
            box-sizing: border-box;
          }
          .leader-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 16px 36px rgba(107, 70, 193, 0.08);
            border-color: rgba(107, 70, 193, 0.2);
          }
          .leader-avatar-wrap {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            overflow: hidden;
            border: 3px solid #f3e8ff;
            box-shadow: var(--shadow-sm);
            flex-shrink: 0;
          }
          .leader-avatar-wrap img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .leader-delete-btn {
            position: absolute;
            top: 16px;
            right: 16px;
            background: #fee2e2;
            color: #ef4444;
            border: none;
            border-radius: 50%;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s;
            font-size: 0.9rem;
            z-index: 10;
          }
          .leader-delete-btn:hover {
            background: #ef4444;
            color: white;
            transform: scale(1.1);
          }
          .leader-role-badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 0.75rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.3px;
          }
        </style>

        <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 28px;">
          <button type="button" id="leaderBackBtn" style="background: #f8fafc; border: 1px solid #e2e8f0; font-size: 1.1rem; color: #475569; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 42px; height: 42px; border-radius: 50%; transition: all 0.2s;" onmouseenter="this.style.background='#e2e8f0';" onmouseleave="this.style.background='#f8fafc';">
            <i class="fa-solid fa-arrow-left"></i>
          </button>
          <div>
            <h2 style="margin: 0; font-size: 1.6rem; font-weight: 800; color: #1e1b4b; font-family: 'Poppins', sans-serif;">Academic Leaders</h2>
            <p style="margin: 4px 0 0 0; font-size: 0.9rem; color: #64748b;">Visionary leaders directing Asansol Engineering College's academic progress.</p>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; width: 100%;">
          <!-- Filter Dropdown -->
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <select id="leaderRoleFilter" style="padding: 10px 18px; border-radius: 12px; border: 1px solid #cbd5e1; font-size: 0.9rem; outline: none; background: white; cursor: pointer; font-weight: 600; color: #475569; box-shadow: var(--shadow-sm);">
              <option value="all">All Roles</option>
              <option value="principal">Principal & Vice Principal</option>
              <option value="dean">Deans</option>
              <option value="hod">HODs</option>
              <option value="other">Other Faculty</option>
            </select>
          </div>
          <!-- Search Input -->
          <div style="position: relative;">
            <input type="text" id="leaderSearchInput" placeholder="Search by name, role, dept..." style="padding: 10px 18px 10px 38px; border-radius: 12px; border: 1px solid #cbd5e1; font-size: 0.9rem; outline: none; width: 250px; background: white; box-shadow: var(--shadow-sm);">
            <i class="fa-solid fa-search" style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #94a3b8;"></i>
          </div>
        </div>

        <div id="leadersGrid">
          <div style="text-align: center; padding: 40px; color: #64748b; grid-column: 1 / -1;">
            <i class="fa-solid fa-spinner fa-spin" style="font-size: 1.5rem; margin-bottom: 8px;"></i>
            <div>Loading academic leaders...</div>
          </div>
        </div>
      `);

      document.getElementById('leaderBackBtn')?.addEventListener('click', goToDashboard);

      let loadedLeaders = [];

      const loadLeaders = async () => {
        try {
          const res = await fetch(`${apiBase}/api/academic-leaders`);
          if (!res.ok) throw new Error();
          loadedLeaders = await res.json();
          renderFilteredLeaders();
        } catch (error) {
          const grid = document.getElementById('leadersGrid');
          if (grid) grid.innerHTML = `<div style="text-align: center; padding: 40px; color: #ef4444; grid-column: 1 / -1;">Unable to load academic leaders. Please try again.</div>`;
        }
      };

      const renderFilteredLeaders = () => {
        const grid = document.getElementById('leadersGrid');
        if (!grid) return;

        const roleFilter = document.getElementById('leaderRoleFilter')?.value || 'all';
        const searchVal = document.getElementById('leaderSearchInput')?.value?.toLowerCase() || '';

        let filtered = [...loadedLeaders];

        // Filter by role
        if (roleFilter !== 'all') {
          filtered = filtered.filter(item => {
            const role = (item.role || '').toLowerCase();
            if (roleFilter === 'principal') return role.includes('principal');
            if (roleFilter === 'dean') return role.includes('dean');
            if (roleFilter === 'hod') return role.includes('hod') || role.includes('head');
            if (roleFilter === 'other') return !role.includes('principal') && !role.includes('dean') && !role.includes('hod') && !role.includes('head');
            return true;
          });
        }

        // Filter by search query
        if (searchVal) {
          filtered = filtered.filter(item => {
            return (item.name || '').toLowerCase().includes(searchVal) ||
                   (item.role || '').toLowerCase().includes(searchVal) ||
                   (item.department || '').toLowerCase().includes(searchVal) ||
                   (item.qualification || '').toLowerCase().includes(searchVal);
          });
        }

        if (filtered.length === 0) {
          grid.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; background: #fff; border-radius: 16px; border: 1px solid #e2e8f0; color: #64748b; grid-column: 1 / -1;">
              <i class="fa-regular fa-folder-open" style="font-size: 2.5rem; margin-bottom: 12px; color: #94a3b8;"></i>
              <div style="font-size: 1.05rem; font-weight: 600;">No academic leaders found</div>
            </div>
          `;
          return;
        }

        grid.innerHTML = filtered.map(item => {
          let avatarSrc = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&background=6b46c1&color=fff&rounded=true&bold=true`;
          if (item.image) {
            avatarSrc = item.image.startsWith('http') ? item.image : `${apiBase}${item.image}`;
          }

          let roleBadgeStyle = 'background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1;';
          const r = (item.role || '').toLowerCase();
          if (r.includes('principal')) roleBadgeStyle = 'background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe;';
          else if (r.includes('dean')) roleBadgeStyle = 'background: #faf5ff; color: #6b46c1; border: 1px solid #e9d5ff;';
          else if (r.includes('hod') || r.includes('head')) roleBadgeStyle = 'background: #ede9fe; color: #5b21b6; border: 1px solid #ddd6fe;';

          // Show delete button only to authorities
          const deleteBtnHtml = isAuthority ? `
            <button type="button" class="leader-delete-btn" data-id="${item._id}" title="Remove Leader">
              <i class="fa-solid fa-trash"></i>
            </button>
          ` : '';

          return `
            <div class="leader-card">
              ${deleteBtnHtml}
              <div style="display: flex; gap: 16px; align-items: center;">
                <div class="leader-avatar-wrap">
                  <img src="${avatarSrc}" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&background=6b46c1&color=fff&rounded=true&bold=true';" style="object-fit: cover;">
                </div>
                <div style="overflow: hidden; min-width: 0;">
                  <span class="leader-role-badge" style="${roleBadgeStyle}">${item.role}</span>
                  <h3 style="margin: 4px 0 0 0; font-size: 1.15rem; font-weight: 700; color: #1e1b4b; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;">${esc(item.name)}</h3>
                  <p style="margin: 2px 0 0 0; font-size: 0.8rem; color: #64748b; font-weight: 500; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;">${esc(item.qualification)}</p>
                </div>
              </div>

              <div style="display: flex; flex-direction: column; gap: 8px; font-size: 0.82rem; color: #475569; background: #f8fafc; padding: 12px; border-radius: 12px;">
                ${item.department ? `<div><i class="fa-solid fa-building" style="width: 18px; color: #8b5cf6;"></i> <strong>Dept:</strong> ${esc(item.department)}</div>` : ''}
                ${item.experience ? `<div><i class="fa-solid fa-briefcase" style="width: 18px; color: #8b5cf6;"></i> <strong>Exp:</strong> ${esc(item.experience)}</div>` : ''}
                ${item.email ? `<div><i class="fa-solid fa-envelope" style="width: 18px; color: #8b5cf6;"></i> <a href="mailto:${item.email}" style="color: inherit; text-decoration: none;">${esc(item.email)}</a></div>` : ''}
              </div>

              ${item.message ? `
                <div style="font-size: 0.85rem; color: #475569; font-style: italic; line-height: 1.5; border-top: 1px dashed #e2e8f0; padding-top: 12px; display: flex; gap: 6px;">
                  <i class="fa-solid fa-quote-left" style="color: #c084fc; font-size: 0.9rem; flex-shrink: 0; margin-top: 2px;"></i>
                  <span>"${esc(item.message)}"</span>
                </div>
              ` : ''}
            </div>
          `;
        }).join('');

        // Attach delete event listeners
        if (isAuthority) {
          grid.querySelectorAll('.leader-delete-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
              e.stopPropagation();
              const id = btn.dataset.id;
              if (confirm('Are you sure you want to remove this academic leader?')) {
                try {
                  const token = user.token || localStorage.getItem('token') || '';
                  const res = await fetch(`${apiBase}/api/academic-leaders/${id}`, {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${token}` }
                  });
                  if (res.ok) {
                    alert('Academic Leader removed successfully.');
                    loadLeaders();
                  } else {
                    alert('Failed to remove academic leader.');
                  }
                } catch (error) {
                  alert('Deletion failed.');
                }
              }
            });
          });
        }
      };

      document.getElementById('leaderRoleFilter')?.addEventListener('change', renderFilteredLeaders);
      document.getElementById('leaderSearchInput')?.addEventListener('input', renderFilteredLeaders);

      loadLeaders();
    }
  }

  async function renderComplaintsPage(info) {
    const userRole = (user.role || 'guest').toLowerCase();
    const mode = cfg.mode || 'view';
    const isPostMode = mode === 'post';

    let contentHtml = '';

    if (isPostMode) {
      contentHtml = `
        <style>
          @keyframes ai-pulse {
            0%, 100% { box-shadow: 0 0 0 0 rgba(139,92,246,0.3); }
            50% { box-shadow: 0 0 0 8px rgba(139,92,246,0); }
          }
          .ai-draft-btn {
            display: flex; align-items: center; gap: 8px;
            padding: 10px 18px; border-radius: 10px;
            border: 1.5px solid #8b5cf6; background: #f5f3ff;
            color: #6d28d9; font-weight: 600; font-size: 0.88rem;
            cursor: pointer; transition: all 0.22s; width: 100%;
            justify-content: center; letter-spacing: 0.01em;
          }
          .ai-draft-btn:hover:not(:disabled) {
            background: #6d28d9; color: white;
            box-shadow: 0 4px 16px rgba(109,40,217,0.25);
            transform: translateY(-1px);
          }
          .ai-draft-btn:disabled {
            opacity: 0.65; cursor: not-allowed;
          }
          .ai-draft-btn.loading { animation: ai-pulse 1.4s infinite; }
        </style>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px; align-items: start;">
          <!-- Left Column: Form to register a complaint -->
          <div class="section-card" style="padding: 28px; border-radius: 16px; background: white; border: 1px solid var(--border-color); box-shadow: var(--shadow-sm);">
            <h3 style="margin-top: 0; margin-bottom: 20px; font-size: 1.25rem; font-weight: 700; color: #1e1b4b; display: flex; align-items: center; gap: 10px;">
              <i class="fa-solid fa-pen-to-square" style="color: var(--primary);"></i> Register New Complaint
            </h3>
            <form id="complaintPostForm" style="display: flex; flex-direction: column; gap: 18px;">
              <div style="display: flex; flex-direction: column; gap: 6px;">
                <label style="font-size: 0.85rem; font-weight: 600; color: #475569;">Subject</label>
                <input type="text" name="title" id="complaintTitleInput" placeholder="Brief subject of the issue..." required style="padding: 12px 16px; border-radius: 10px; border: 1px solid #cbd5e1; outline: none; font-size: 0.95rem; font-family: inherit; transition: border-color 0.2s;" onfocus="this.style.borderColor='#8b5cf6';" onblur="this.style.borderColor='#cbd5e1';">
              </div>

              <button type="button" id="complaintAiDraftBtn" class="ai-draft-btn">
                <i class="fa-solid fa-wand-magic-sparkles"></i>
                <span id="complaintAiDraftBtnLabel">Draft with AI</span>
              </button>

              <div style="display: flex; flex-direction: column; gap: 6px;">
                <label style="font-size: 0.85rem; font-weight: 600; color: #475569; display: flex; align-items: center; justify-content: space-between;">
                  <span>Issue Details</span>
                  <span id="complaintAiTag" style="display:none; font-size:0.75rem; color:#7c3aed; font-weight:600; background:#f5f3ff; padding:2px 8px; border-radius:6px;"><i class="fa-solid fa-sparkles"></i> AI Drafted</span>
                </label>
                <textarea name="description" id="complaintDescInput" rows="5" placeholder="Describe the issue in detail..." required style="padding: 12px 16px; border-radius: 10px; border: 1px solid #cbd5e1; outline: none; font-size: 0.95rem; font-family: inherit; resize: vertical; transition: border-color 0.2s;" onfocus="this.style.borderColor='#8b5cf6';" onblur="this.style.borderColor='#cbd5e1';"></textarea>
              </div>

              <div style="display: flex; flex-direction: column; gap: 6px;">
                <label style="font-size: 0.85rem; font-weight: 600; color: #475569;">Attachment (Photo)</label>
                <input type="file" name="image" accept="image/*" style="font-size: 0.85rem; color: #64748b;">
              </div>

              <button type="submit" style="background: var(--primary); color: white; border: none; padding: 12px 20px; border-radius: 10px; font-weight: 600; font-size: 0.95rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 8px; transition: all 0.2s;" onmouseenter="this.style.background='#55309d';" onmouseleave="this.style.background='var(--primary)';">
                <i class="fa-solid fa-paper-plane"></i> File Complaint
              </button>
            </form>
          </div>

          <!-- Right Column: List -->
          <div class="section-card" style="padding: 28px; border-radius: 16px; background: white; border: 1px solid var(--border-color); box-shadow: var(--shadow-sm); display: flex; flex-direction: column; gap: 20px;">
            <div id="complaintsListContainer" style="display: flex; flex-direction: column; gap: 16px; max-height: 600px; overflow-y: auto; padding-right: 4px;">
              <div style="text-align: center; padding: 40px; color: #64748b;">
                <i class="fa-solid fa-spinner fa-spin" style="font-size: 1.5rem; margin-bottom: 8px;"></i>
                <div>Loading complaints...</div>
              </div>
            </div>
          </div>
        </div>
      `;
    } else {

      contentHtml = `
        <style>
          .complaints-grid-view {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 24px;
            align-items: start;
            padding-right: 4px;
          }
          @media (max-width: 900px) {
            .complaints-grid-view {
              grid-template-columns: 1fr;
            }
          }
        </style>
        <div id="complaintsListContainer" class="complaints-grid-view">
          <div style="text-align: center; padding: 40px; color: #64748b; grid-column: 1 / -1;">
            <i class="fa-solid fa-spinner fa-spin" style="font-size: 1.5rem; margin-bottom: 8px;"></i>
            <div>Loading complaints...</div>
          </div>
        </div>
      `;
    }

    content(`
      <div style="display: flex; justify-content: space-between; align-items: center; gap: 16px; margin-bottom: 28px; flex-wrap: wrap; width: 100%;">
        <div style="display: flex; align-items: center; gap: 16px;">
          <button type="button" id="complaintBackBtn" style="background: #f8fafc; border: 1px solid #e2e8f0; font-size: 1.1rem; color: #475569; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 42px; height: 42px; border-radius: 50%; transition: all 0.2s;" onmouseenter="this.style.background='#e2e8f0';" onmouseleave="this.style.background='#f8fafc';">
            <i class="fa-solid fa-arrow-left"></i>
          </button>
          <div>
            <h2 style="margin: 0; font-size: 1.6rem; font-weight: 800; color: #1e1b4b; font-family: 'Poppins', sans-serif;">Transparency Wall (Complaints)</h2>
            <p style="margin: 4px 0 0 0; font-size: 0.9rem; color: #64748b;">Public viewing, registration, and authority resolution in one unified flow.</p>
          </div>
        </div>
        <div>
          <select id="complaintsFilterDropdown" style="padding: 10px 18px; border-radius: 12px; border: 1px solid #cbd5e1; font-size: 0.9rem; outline: none; background: white; cursor: pointer; font-weight: 600; color: #475569; box-shadow: var(--shadow-sm); min-width: 180px;">
            <!-- Role specific options loaded in JS -->
          </select>
        </div>
      </div>
      
      ${contentHtml}
    `);

    document.getElementById('complaintBackBtn')?.addEventListener('click', goToDashboard);

    // Setup filter dropdown
    const dropdown = document.getElementById('complaintsFilterDropdown');
    let options = `<option value="all">All Complaints</option>`;
    if (userRole === 'student' || userRole === 'hosteler') {
      options += `<option value="my">My Complaints</option>`;
    } else if (userRole === 'teacher') {
      options += `
        <option value="my">My Complaints</option>
        <option value="mentees">My Mentees</option>
        <option value="resolved-by-me">Resolved by Me</option>
        <option value="by-students">By Students</option>
        <option value="by-teachers">By Teachers</option>
      `;
    } else if (userRole === 'hod') {
      options += `
        <option value="my">My Complaints</option>
        <option value="dept">Department Complaints</option>
        <option value="resolved-by-me">Resolved by Me</option>
        <option value="by-students">By Students</option>
        <option value="by-teachers">By Teachers</option>
      `;
    } else if (userRole === 'warden') {
      options += `
        <option value="my">My Complaints</option>
        <option value="hostel">Hostel Complaints</option>
        <option value="resolved-by-me">Resolved by Me</option>
      `;
    } else if (userRole === 'principal') {
      options += `
        <option value="my">My Complaints</option>
        <option value="resolved-by-me">Resolved by Me</option>
        <option value="by-students">By Students</option>
        <option value="by-teachers">By Teachers</option>
      `;
    }
    dropdown.innerHTML = options;

    if (userRole === 'student' || userRole === 'hosteler') dropdown.value = 'my';
    else if (userRole === 'teacher') dropdown.value = 'mentees';
    else if (userRole === 'hod') dropdown.value = 'dept';
    else if (userRole === 'warden') dropdown.value = 'hostel';
    else dropdown.value = 'all';

    dropdown.addEventListener('change', loadRedesignedComplaints);

    // Handle Form Submit
    document.getElementById('complaintPostForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.currentTarget;
      const token = user.token || '';
      const formData = new FormData(form);
      if (user._id) formData.append('studentId', user._id);
      
      const res = await fetch(`${apiBase}/api/complaints`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      if (res.ok) {
        alert('Complaint registered successfully.');
        form.reset();
        loadRedesignedComplaints();
      } else {
        alert('Registration failed.');
      }
    });
    // AI Draft button for complaint form
    document.getElementById('complaintAiDraftBtn')?.addEventListener('click', async () => {
      const btn = document.getElementById('complaintAiDraftBtn');
      const label = document.getElementById('complaintAiDraftBtnLabel');
      const titleEl = document.getElementById('complaintTitleInput');
      const descEl = document.getElementById('complaintDescInput');
      const aiTag = document.getElementById('complaintAiTag');
      const subject = titleEl?.value?.trim();

      if (!subject) {
        titleEl?.focus();
        titleEl && (titleEl.style.borderColor = '#ef4444');
        setTimeout(() => { if (titleEl) titleEl.style.borderColor = '#cbd5e1'; }, 1800);
        return;
      }

      btn.disabled = true;
      btn.classList.add('loading');
      if (label) label.textContent = 'Drafting…';

      try {
        const token = user.token || localStorage.getItem('token') || '';
        const res = await fetch(`${apiBase}/api/ai/generate-complaint`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ prompt: subject })
        });
        if (!res.ok) throw new Error('AI request failed');
        const data = await res.json();
        if (descEl && data.description) {
          descEl.value = data.description;
          descEl.style.borderColor = '#8b5cf6';
          setTimeout(() => { descEl.style.borderColor = '#cbd5e1'; }, 1500);
        }
        if (data.description && titleEl && !titleEl.value) titleEl.value = data.title || subject;
        if (aiTag) aiTag.style.display = 'inline-flex';
      } catch (err) {
        alert('AI drafting failed. Please write your complaint manually.');
      } finally {
        btn.disabled = false;
        btn.classList.remove('loading');
        if (label) label.textContent = 'Draft with AI';
      }
    });

    await loadRedesignedComplaints();
  }

  async function loadRedesignedComplaints() {
    const list = document.getElementById('complaintsListContainer');
    if (!list) return;
    const filterVal = document.getElementById('complaintsFilterDropdown')?.value || 'all';
    const token = user.token || '';
    const userRole = (user.role || 'guest').toLowerCase();

    list.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #64748b; grid-column: 1 / -1;">
        <i class="fa-solid fa-spinner fa-spin" style="font-size: 1.5rem; margin-bottom: 8px;"></i>
        <div>Loading complaints...</div>
      </div>
    `;

    try {
      // Fetch Filtered List
      let url = `${apiBase}/api/complaints`;
      if (filterVal === 'my') {
        url = `${apiBase}/api/complaints/my`;
      } else if (filterVal === 'mentees') {
        url = `${apiBase}/api/complaints/mentees`;
      } else if (filterVal === 'dept') {
        url = `${apiBase}/api/hod/complaints`;
      } else if (filterVal === 'hostel') {
        url = `${apiBase}/api/warden/complaints`;
      }

      const resList = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!resList.ok) throw new Error();
      let listData = await resList.json();

      // Apply local filters if needed
      let filtered = [...listData];
      if (filterVal === 'resolved-by-me') {
        filtered = filtered.filter(c => c.resolvedBy && (c.resolvedBy._id === user._id || c.resolvedBy === user._id));
      } else if (filterVal === 'by-students') {
        filtered = filtered.filter(c => c.student && (!c.student.role || c.student.role === 'student' || c.student.role === 'hosteler' || c.student.rollNumber));
      } else if (filterVal === 'by-teachers') {
        filtered = filtered.filter(c => c.student && (c.student.role === 'teacher' || c.student.employeeId || (!c.student.rollNumber && c.student.department)));
      }      if (filtered.length === 0) {
        list.innerHTML = `<div class="module-empty" style="grid-column: 1 / -1;">No complaints found.</div>`;
        return;
      }

      let html = filtered.map(c => renderComplaintCardHtml(c, userRole)).join('');
      list.innerHTML = html;

      // Event listeners for resolution buttons
      list.querySelectorAll('.btn-resolve-toggle').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation(); // Avoid opening details modal
          const id = btn.dataset.id;
          const container = document.getElementById(`resolveFormContainer-${id}`);
          if (container) {
            container.style.display = container.style.display === 'none' ? 'block' : 'none';
          }
        });
      });

      list.querySelectorAll('.btn-resolve-direct').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation(); // Avoid opening details modal
          const id = btn.dataset.id;
          const res = await fetch(`${apiBase}/api/principal/complaints/${id}/resolve`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
          });
          if (res.ok) {
            alert('Resolved successfully.');
            loadRedesignedComplaints();
          } else {
            alert('Failed to resolve.');
          }
        });
      });

      list.querySelectorAll('.inlineResolveForm').forEach(form => {
        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          e.stopPropagation();
          const compId = form.dataset.id;
          const formData = new FormData(form);
          let resolveEndpoint = `/api/warden/complaints/${compId}/resolve`;
          if (userRole === 'hod') {
            resolveEndpoint = `/api/hod/complaints/${compId}/resolve`;
          } else if (userRole === 'teacher') {
            resolveEndpoint = `/api/teacher/complaints/${compId}/resolve`;
          }

          const res = await fetch(`${apiBase}${resolveEndpoint}`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}` },
            body: formData
          });
          if (res.ok) {
            alert('Complaint resolved successfully.');
            loadRedesignedComplaints();
          } else {
            alert('Failed to resolve complaint.');
          }
        });
      });

      // Card click listener to view full details in modal
      list.querySelectorAll('.complaint-card').forEach(card => {
        card.addEventListener('click', (e) => {
          if (e.target.closest('button') || e.target.closest('img') || e.target.closest('input') || e.target.closest('form')) {
            return;
          }
          const id = card.dataset.id;
          const complaint = filtered.find(item => item._id === id);
          if (complaint) {
            showComplaintDetailsModal(complaint, userRole);
          }
        });
      });

      // Upvote buttons click handlers
      list.querySelectorAll('.btn-complaint-upvote').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const id = btn.dataset.id;
          await toggleComplaintUpvote(id, btn);
        });
      });

    } catch (error) {
      console.error(error);
      list.innerHTML = `<div class="module-empty" style="color: red; grid-column: 1 / -1;">Failed to load complaints list.</div>`;
    }
  }

  async function toggleComplaintUpvote(id, btnElement) {
    const token = user.token || '';
    if (!token) {
      alert("Please login to upvote.");
      return;
    }

    try {
      const isLocal = ['localhost', '127.0.0.1', ''].includes(window.location.hostname) || window.location.protocol === 'file:';
      const BACKEND_URL = isLocal ? 'http://localhost:5000' : 'https://campuscare-backend-96cn.onrender.com';
      const res = await fetch(`${BACKEND_URL}/api/complaints/${id}/upvote`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();

        // Update Count on card
        const countSpan = document.getElementById(`count-${id}`);
        if (countSpan) countSpan.innerText = data.upvotes;

        // Update Count in modal if open
        const modalCountSpan = document.getElementById(`modal-count-${id}`);
        if (modalCountSpan) modalCountSpan.innerText = data.upvotes;

        // Update card button style/color
        const cardBtn = document.getElementById(`like-btn-${id}`) || (btnElement.classList.contains('btn-complaint-upvote') ? btnElement : null);
        if (cardBtn) {
          cardBtn.style.color = data.action === 'added' ? '#3b82f6' : '#64748b';
        }

        // Update modal button style/color
        const modalBtn = document.querySelector(`.modalUpvoteBtn[data-id="${id}"]`) || (btnElement.classList.contains('modalUpvoteBtn') ? btnElement : null);
        if (modalBtn) {
          modalBtn.style.color = data.action === 'added' ? '#3b82f6' : '#64748b';
        }
      } else {
        const err = await res.json();
        alert(err.message || "Failed to upvote");
      }
    } catch (e) {
      console.error('Upvote error:', e);
    }
  }

  function showComplaintDetailsModal(c, userRole) {
    const title = c.title || 'Untitled Complaint';
    const desc = c.description || 'No description provided.';
    const priority = c.priority || 'Medium';
    const status = c.status || 'Submitted';
    const category = c.category || 'General';
    const date = new Date(c.createdAt || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const token = user.token || '';

    // Raiser Info
    let raiserName = 'Anonymous';
    let raiserInfo = '';
    if (c.student) {
      const studentObj = typeof c.student === 'object' ? c.student : null;
      const studentId = studentObj ? (studentObj._id || '') : String(c.student);
      const isCurrentUser = user._id && (String(studentId) === String(user._id));
      raiserName = (studentObj && studentObj.name) || (isCurrentUser ? (user.name || 'You') : 'Anonymous Student');
      raiserInfo = (studentObj && studentObj.department) ? ` • ${studentObj.department}` : (isCurrentUser && user.department ? ` • ${user.department}` : '');
      if (studentObj && studentObj.roomNumber) raiserInfo += ` (Room ${studentObj.roomNumber})`;
    }
    let raiserAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(raiserName)}&background=6b46c1&color=fff&rounded=true&bold=true`;
    if (c.student && c.student.profilePicture) {
      const isLocal = ['localhost', '127.0.0.1', ''].includes(window.location.hostname) || window.location.protocol === 'file:';
      const BACKEND_URL = isLocal ? 'http://localhost:5000' : 'https://campuscare-backend-96cn.onrender.com';
      raiserAvatar = c.student.profilePicture.startsWith('http') ? c.student.profilePicture : `${BACKEND_URL}${c.student.profilePicture}`;
    }

    // Resolver Info
    let resolverHtml = '';
    if (status === 'Resolved') {
      const resolverName = c.resolvedBy?.name || 'Authority';
      const resolverRole = c.resolvedBy?.role ? ` (${label(c.resolvedBy.role)})` : '';
      let resolverAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(resolverName)}&background=10b981&color=fff&rounded=true&bold=true`;
      if (c.resolvedBy && c.resolvedBy.profilePicture) {
        const isLocal = ['localhost', '127.0.0.1', ''].includes(window.location.hostname) || window.location.protocol === 'file:';
        const BACKEND_URL = isLocal ? 'http://localhost:5000' : 'https://campuscare-backend-96cn.onrender.com';
        resolverAvatar = c.resolvedBy.profilePicture.startsWith('http') ? c.resolvedBy.profilePicture : `${BACKEND_URL}${c.resolvedBy.profilePicture}`;
      }
      resolverHtml = `
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 12px 16px; display: flex; align-items: center; gap: 12px; margin-top: 16px;">
          <img src="${resolverAvatar}" style="width: 36px; height: 36px; border-radius: 50%; object-fit: cover; border: 2px solid #86efac; flex-shrink: 0;" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(resolverName)}&background=10b981&color=fff&rounded=true&bold=true';">
          <div>
            <div style="font-size: 0.75rem; color: #166534; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Resolution Authority</div>
            <div style="font-size: 0.9rem; font-weight: 700; color: #14532d;">${esc(resolverName)}${resolverRole}</div>
          </div>
        </div>
      `;
    }

    // Badges Style
    let priorityStyle = 'background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe;';
    if (priority === 'High') priorityStyle = 'background: #fffbeb; color: #92400e; border: 1px solid #fde68a;';
    if (priority === 'Urgent') priorityStyle = 'background: #fff1f2; color: #9f1239; border: 1px solid #fecdd3;';
    if (priority === 'Low') priorityStyle = 'background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0;';

    let statusStyle = 'background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1;';
    if (status === 'Resolved') statusStyle = 'background: #d1fae5; color: #065f46; border: 1px solid #a7f3d0; font-weight: bold;';
    else if (status === 'In Progress') statusStyle = 'background: #dbeafe; color: #1e4ed8; border: 1px solid #bfdbfe; font-weight: bold;';

    // Full Images display
    let imagesHtml = '';
    const imgUrl = c.image ? (c.image.startsWith('http') ? c.image : `${apiBase}${c.image}`) : null;
    const resolveImg = c.afterImage || c.resolutionImage;
    const resolveImgUrl = resolveImg ? (resolveImg.startsWith('http') ? resolveImg : `${apiBase}${resolveImg}`) : null;

    if (imgUrl || resolveImgUrl) {
      imagesHtml += `<div style="display: flex; gap: 16px; margin-top: 20px; flex-wrap: wrap;">`;
      if (imgUrl) {
        imagesHtml += `
          <div style="flex: 1; min-width: 200px;">
            <div style="font-size: 0.75rem; font-weight: 700; color: #64748b; margin-bottom: 6px; text-transform: uppercase;">Issue Attachment</div>
            <img src="${imgUrl}" onclick="window.open('${imgUrl}')" style="width: 100%; max-height: 250px; object-fit: cover; border-radius: 8px; border: 1px solid #cbd5e1; cursor: pointer;" title="Click to view full image">
          </div>
        `;
      }
      if (resolveImgUrl) {
        imagesHtml += `
          <div style="flex: 1; min-width: 200px;">
            <div style="font-size: 0.75rem; font-weight: 700; color: #64748b; margin-bottom: 6px; text-transform: uppercase;">Resolution Proof</div>
            <img src="${resolveImgUrl}" onclick="window.open('${resolveImgUrl}')" style="width: 100%; max-height: 250px; object-fit: cover; border-radius: 8px; border: 1px solid #cbd5e1; cursor: pointer;" title="Click to view full image">
          </div>
        `;
      }
      imagesHtml += `</div>`;
    }

    const upvotedBy = Array.isArray(c.upvotedBy) ? c.upvotedBy : [];
    const isLiked = token && user._id && upvotedBy.includes(user._id);
    const likeColor = isLiked ? '#3b82f6' : '#64748b';

    // Modal structure
    const modalId = `complaintModal-${c._id}`;
    let modal = document.getElementById(modalId);
    if (!modal) {
      modal = document.createElement('div');
      modal.id = modalId;
      modal.style.position = 'fixed';
      modal.style.top = '0';
      modal.style.left = '0';
      modal.style.width = '100vw';
      modal.style.height = '100vh';
      modal.style.backgroundColor = 'rgba(15, 23, 42, 0.6)';
      modal.style.backdropFilter = 'blur(4px)';
      modal.style.display = 'flex';
      modal.style.alignItems = 'center';
      modal.style.justifyContent = 'center';
      modal.style.zIndex = '9999';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <style>
        @keyframes modalFadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      </style>
      <div style="background: white; border-radius: 20px; width: 90%; max-width: 580px; max-height: 90vh; overflow-y: auto; padding: 28px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); position: relative; animation: modalFadeIn 0.3s ease-out; font-family: 'Inter', sans-serif;">
        <!-- Close Button -->
        <button type="button" class="closeModalBtn" style="position: absolute; top: 20px; right: 20px; background: #f1f5f9; border: none; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #64748b; transition: all 0.2s;" onmouseenter="this.style.background='#e2e8f0'; this.style.color='#0f172a';" onmouseleave="this.style.background='#f1f5f9'; this.style.color='#64748b';">
          <i class="fa-solid fa-xmark"></i>
        </button>

        <!-- Badges row -->
        <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 16px;">
          <span style="${priorityStyle} padding: 4px 10px; border-radius: 20px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase;">${priority} Priority</span>
          <span style="${statusStyle} padding: 4px 10px; border-radius: 20px; font-size: 0.7rem; text-transform: uppercase;">${status}</span>
          <span style="background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; padding: 4px 10px; border-radius: 20px; font-size: 0.7rem; text-transform: uppercase; font-weight: 600;">${category}</span>
          
          <!-- UPVOTE BUTTON in Modal -->
          <button type="button" class="modalUpvoteBtn" data-id="${c._id}" style="background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 20px; padding: 4px 12px; font-size: 0.72rem; font-weight: 700; color: ${likeColor}; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all 0.2s;" onmouseenter="this.style.background='#e2e8f0';" onmouseleave="this.style.background='#f1f5f9';">
            <i class="fa-solid fa-thumbs-up"></i> <span id="modal-count-${c._id}">${c.upvotes || 0}</span> Upvotes
          </button>
        </div>

        <!-- Title -->
        <h3 style="margin: 0 0 12px 0; font-size: 1.4rem; font-weight: 800; color: #0f172a; font-family: 'Poppins', sans-serif; line-height: 1.3;">${esc(title)}</h3>

        <!-- Raiser Info -->
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px;">
          <img src="${raiserAvatar}" style="width: 36px; height: 36px; border-radius: 50%; object-fit: cover; border: 2px solid #cbd5e1; flex-shrink: 0;" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(raiserName)}&background=6b46c1&color=fff&rounded=true&bold=true';">
          <div>
            <div style="font-size: 0.9rem; font-weight: 700; color: #1e293b;">${esc(raiserName)}</div>
            <div style="font-size: 0.75rem; color: #64748b;">${esc(raiserInfo)} • ${date}</div>
          </div>
        </div>

        <!-- Description -->
        <div style="font-size: 0.95rem; color: #334155; line-height: 1.6; background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 12px; font-family: 'Inter', sans-serif; white-space: pre-wrap; word-break: break-word;">${esc(desc)}</div>

        <!-- Resolver Info -->
        ${resolverHtml}

        <!-- Images section -->
        ${imagesHtml}
      </div>
    `;

    // Modal Close logic
    const closeModal = () => {
      modal.remove();
    };
    modal.querySelector('.closeModalBtn').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    // Upvote inside Modal
    modal.querySelector('.modalUpvoteBtn').addEventListener('click', async () => {
      await toggleComplaintUpvote(c._id, modal.querySelector('.modalUpvoteBtn'));
    });
  }

  function renderComplaintCardHtml(c, userRole) {
    const title = c.title || 'Untitled Complaint';
    const desc = c.description || 'No description provided.';
    const priority = c.priority || 'Medium';
    const status = c.status || 'Submitted';
    const date = new Date(c.createdAt || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    
    // Raiser info
    let raiserName = 'Anonymous';
    let raiserInfo = '';
    if (c.student) {
      const studentObj = typeof c.student === 'object' ? c.student : null;
      const studentId = studentObj ? (studentObj._id || '') : String(c.student);
      const isCurrentUser = user._id && (String(studentId) === String(user._id));
      raiserName = (studentObj && studentObj.name) || (isCurrentUser ? (user.name || 'You') : 'Anonymous Student');
      raiserInfo = (studentObj && studentObj.department) ? ` • ${studentObj.department}` : (isCurrentUser && user.department ? ` • ${user.department}` : '');
      if (studentObj && studentObj.roomNumber) raiserInfo += ` (Room ${studentObj.roomNumber})`;
    }

    let raiserAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(raiserName)}&background=6b46c1&color=fff&rounded=true&bold=true`;
    if (c.student && c.student.profilePicture) {
      const isLocal = ['localhost', '127.0.0.1', ''].includes(window.location.hostname) || window.location.protocol === 'file:';
      const BACKEND_URL = isLocal ? 'http://localhost:5000' : 'https://campuscare-backend-96cn.onrender.com';
      raiserAvatar = c.student.profilePicture.startsWith('http') ? c.student.profilePicture : `${BACKEND_URL}${c.student.profilePicture}`;
    }

    // Resolver info
    let resolverText = '';
    let resolverName = '';
    let resolverAvatar = '';
    let resolverRole = '';
    if (status === 'Resolved') {
      resolverName = c.resolvedBy?.name || 'Authority';
      resolverRole = c.resolvedBy?.role ? ` (${label(c.resolvedBy.role)})` : '';
      resolverAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(resolverName)}&background=10b981&color=fff&rounded=true&bold=true`;
      if (c.resolvedBy && c.resolvedBy.profilePicture) {
        const isLocal = ['localhost', '127.0.0.1', ''].includes(window.location.hostname) || window.location.protocol === 'file:';
        const BACKEND_URL = isLocal ? 'http://localhost:5000' : 'https://campuscare-backend-96cn.onrender.com';
        resolverAvatar = c.resolvedBy.profilePicture.startsWith('http') ? c.resolvedBy.profilePicture : `${BACKEND_URL}${c.resolvedBy.profilePicture}`;
      }
    }

    // Badges
    let priorityStyle = 'background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe;';
    if (priority === 'High') priorityStyle = 'background: #fffbeb; color: #92400e; border: 1px solid #fde68a;';
    if (priority === 'Urgent') priorityStyle = 'background: #fff1f2; color: #9f1239; border: 1px solid #fecdd3;';
    if (priority === 'Low') priorityStyle = 'background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0;';

    let statusStyle = 'background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1;';
    if (status === 'Resolved') statusStyle = 'background: #d1fae5; color: #065f46; border: 1px solid #a7f3d0; font-weight: bold;';
    else if (status === 'In Progress') statusStyle = 'background: #dbeafe; color: #1e4ed8; border: 1px solid #bfdbfe; font-weight: bold;';

    // Clickable Image Placeholders (Square Thumbnails) in the side
    let imagePlaceholdersHtml = '';
    const imgUrl = c.image ? (c.image.startsWith('http') ? c.image : `${apiBase}${c.image}`) : null;
    const resolveImg = c.afterImage || c.resolutionImage;
    const resolveImgUrl = resolveImg ? (resolveImg.startsWith('http') ? resolveImg : `${apiBase}${resolveImg}`) : null;

    if (imgUrl) {
      imagePlaceholdersHtml += `
        <div onclick="window.open('${imgUrl}')" style="width: 48px; height: 48px; border-radius: 6px; border: 1px solid #cbd5e1; background: #f8fafc; cursor: pointer; display: flex; align-items: center; justify-content: center; overflow: hidden; transition: all 0.2s; flex-shrink: 0;" title="View Issue Photo" onmouseenter="this.style.borderColor='var(--primary)';" onmouseleave="this.style.borderColor='#cbd5e1';">
          <img src="${imgUrl}" style="width: 100%; height: 100%; object-fit: cover;">
        </div>
      `;
    }
    if (resolveImgUrl) {
      imagePlaceholdersHtml += `
        <div onclick="window.open('${resolveImgUrl}')" style="width: 48px; height: 48px; border-radius: 6px; border: 1px solid #bbf7d0; background: #f0fdf4; cursor: pointer; display: flex; align-items: center; justify-content: center; overflow: hidden; transition: all 0.2s; flex-shrink: 0;" title="View Resolution Proof" onmouseenter="this.style.borderColor='#10b981';" onmouseleave="this.style.borderColor='#bbf7d0';">
          <img src="${resolveImgUrl}" style="width: 100%; height: 100%; object-fit: cover;">
        </div>
      `;
    }

    // Resolve buttons and forms
    let resolveBtnHtml = '';
    let resolveFormContainerHtml = '';
    const isAuthority = !['student', 'hosteler', 'guest'].includes(userRole);
    if (isAuthority && status !== 'Resolved') {
      if (userRole === 'principal') {
        resolveBtnHtml = `
          <button type="button" class="btn-resolve-direct" data-id="${c._id}" style="width: 100%; background: #eff6ff; color: #1e4ed8; border: 1px solid #bfdbfe; padding: 4px 6px; border-radius: 6px; font-size: 0.65rem; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 4px; transition: all 0.2s; box-sizing: border-box;" onmouseenter="this.style.background='#dbeafe';" onmouseleave="this.style.background='#eff6ff';">
            <i class="fa-solid fa-check"></i> Resolve
          </button>
        `;
      } else {
        resolveBtnHtml = `
          <button type="button" class="btn-resolve-toggle" data-id="${c._id}" style="width: 100%; background: #eff6ff; color: #1e4ed8; border: 1px solid #bfdbfe; padding: 4px 6px; border-radius: 6px; font-size: 0.65rem; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 4px; transition: all 0.2s; box-sizing: border-box;" onmouseenter="this.style.background='#dbeafe';" onmouseleave="this.style.background='#eff6ff';">
            <i class="fa-solid fa-check-to-slot"></i> Resolve
          </button>
        `;
        resolveFormContainerHtml = `
          <div id="resolveFormContainer-${c._id}" style="display: none; margin-top: 10px; background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px; border-radius: 8px; width: 100%; box-sizing: border-box;">
            <form class="inlineResolveForm" data-id="${c._id}" style="display: flex; flex-direction: column; gap: 8px;">
              <label style="font-size: 0.75rem; font-weight: 700; color: #475569; display: block; margin-bottom: 2px;">Upload Resolution Proof</label>
              <input type="file" name="resolutionImage" accept="image/*" required style="font-size: 0.75rem; color: #475569;">
              <button type="submit" style="background: var(--primary); color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 0.75rem; font-weight: 700; cursor: pointer; align-self: flex-start; margin-top: 4px;">
                Confirm Resolution
              </button>
            </form>
          </div>
        `;
      }
    }

    // Upvote logic configuration
    const token = user.token || '';
    const upvotedBy = Array.isArray(c.upvotedBy) ? c.upvotedBy : [];
    const isLiked = token && user._id && upvotedBy.includes(user._id);
    const likeColor = isLiked ? '#3b82f6' : '#64748b';

    // Left Side Footer: Raiser & Resolver Info
    let footerLeftHtml = `
      <span style="display: inline-flex; align-items: center; gap: 4px; font-weight: 600; color: #475569; flex-shrink: 0; min-width: 0; overflow: hidden; text-overflow: ellipsis;">
        <img src="${raiserAvatar}" style="width: 18px; height: 18px; border-radius: 50%; object-fit: cover; border: 1px solid #e2e8f0; flex-shrink: 0;" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(raiserName)}&background=6b46c1&color=fff&rounded=true&bold=true';">
        <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">By: <strong style="color: #0f172a;">${esc(raiserName)}</strong>${esc(raiserInfo)}</span>
      </span>
    `;

    if (status === 'Resolved') {
      footerLeftHtml += `
        <span style="color: #cbd5e1; flex-shrink: 0;">|</span>
        <span style="display: inline-flex; align-items: center; gap: 4px; font-weight: 600; color: #166534; flex-shrink: 0; min-width: 0; overflow: hidden; text-overflow: ellipsis;">
          <img src="${resolverAvatar}" style="width: 18px; height: 18px; border-radius: 50%; object-fit: cover; border: 1px solid #bbf7d0; flex-shrink: 0;" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(resolverName)}&background=10b981&color=fff&rounded=true&bold=true';">
          <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">Resolved: <strong style="color: #14532d;">${esc(resolverName)}</strong></span>
        </span>
      `;
    }

    // Right Side Footer: Date & Upvote
    let footerRightHtml = `
      <span style="font-weight: 500; font-size: 0.72rem; flex-shrink: 0; display: inline-flex; align-items: center; gap: 4px; color: #64748b;">
        <i class="fa-regular fa-clock"></i>${date}
      </span>
      <span style="color: #cbd5e1; flex-shrink: 0;">|</span>
      <button type="button" class="btn-complaint-upvote" id="like-btn-${c._id}" data-id="${c._id}" style="background: none; border: none; color: ${likeColor}; cursor: pointer; font-size: 0.72rem; font-weight: 600; display: inline-flex; align-items: center; gap: 4px; padding: 2px 6px; border-radius: 4px; transition: all 0.2s; flex-shrink: 0; min-width: 0;" onmouseenter="this.style.background='#f1f5f9';" onmouseleave="this.style.background='none';">
        <i class="fa-solid fa-thumbs-up"></i>
        <span id="count-${c._id}">${c.upvotes || 0}</span>
      </button>
    `;

    return `
      <div class="complaint-card" data-id="${c._id}" style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 12px 16px; display: flex; flex-direction: column; box-shadow: 0 4px 20px rgba(0,0,0,0.02); transition: all 0.3s; position: relative; min-height: 125px; justify-content: flex-start; align-items: stretch; margin-bottom: 16px; box-sizing: border-box; cursor: pointer;" onmouseenter="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 30px rgba(0,0,0,0.04)'; this.style.borderColor='rgba(107, 70, 193, 0.2)';" onmouseleave="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 20px rgba(0,0,0,0.02)'; this.style.borderColor='#e2e8f0';">
        <!-- Main card body row (flex row) -->
        <div style="display: flex; flex-direction: row; gap: 16px; justify-content: space-between; align-items: stretch; width: 100%; flex: 1;">
          
          <!-- Left Column (takes remaining width) -->
          <div style="flex: 1; display: flex; flex-direction: column; justify-content: space-between; overflow: hidden; min-width: 0;">
            <!-- Content block -->
            <div style="overflow: hidden; min-width: 0;">
              <!-- Priority & Title in one line -->
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px; overflow: hidden; min-width: 0;">
                <span style="${priorityStyle} padding: 2px 8px; border-radius: 12px; font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px; flex-shrink: 0;">${priority}</span>
                <h4 style="margin: 0; font-size: 1.05rem; font-weight: 700; color: #0f172a; font-family: 'Poppins', sans-serif; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; flex-grow: 1; min-width: 0;">${esc(title)}</h4>
              </div>
              <!-- Description truncated to 2 lines -->
              <p style="margin: 0; font-size: 0.88rem; color: #475569; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; white-space: normal; font-family: 'Inter', sans-serif;" title="${esc(desc)}">${esc(desc)}</p>
            </div>
            
            <!-- Unified Bottom Row Info (Split Left & Right) -->
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px; font-size: 0.75rem; color: #64748b; border-top: 1px solid #f1f5f9; padding-top: 8px; margin-top: 8px; width: 100%; min-width: 0; box-sizing: border-box;">
              <!-- Left: Raiser & Resolver -->
              <div style="display: flex; align-items: center; gap: 8px; overflow: hidden; min-width: 0;">
                ${footerLeftHtml}
              </div>
              <!-- Right: Date & Upvotes -->
              <div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0;">
                ${footerRightHtml}
              </div>
            </div>
          </div>
          
          <!-- Right Column (Status & Images & Action) -->
          <div style="width: 140px; display: flex; flex-direction: column; justify-content: space-between; align-items: center; flex-shrink: 0; border-left: 1px dashed #e2e8f0; padding-left: 12px; box-sizing: border-box;">
            <!-- Status Badge -->
            <span style="${statusStyle} padding: 2px 8px; border-radius: 12px; font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.3px; font-weight: 700; text-align: center; display: inline-block; width: 100%; box-sizing: border-box; flex-shrink: 0;">${status}</span>
            
            <!-- Image Placeholders row: larger side-by-side previews -->
            <div style="display: flex; gap: 6px; margin-top: 4px; justify-content: center; width: 100%; flex-shrink: 0; flex-wrap: nowrap;">
              ${imagePlaceholdersHtml}
            </div>
            
            <!-- Action Button -->
            <div style="width: 100%; margin-top: auto; display: flex; flex-direction: column; align-items: stretch; justify-content: flex-end; flex-shrink: 0;">
              ${resolveBtnHtml}
            </div>
          </div>

        </div>
        
        <!-- Expanded resolution form container -->
        ${resolveFormContainerHtml}
      </div>
    `;
  }

  async function renderLibrary() {
    const hero = document.getElementById('home');
    if (hero) hero.style.display = 'none';

    content(`
      <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 28px;">
        <button type="button" id="libraryBackBtn" style="background: #f8fafc; border: 1px solid #e2e8f0; font-size: 1.1rem; color: #475569; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 42px; height: 42px; border-radius: 50%; transition: all 0.2s;" onmouseenter="this.style.background='#e2e8f0';" onmouseleave="this.style.background='#f8fafc';">
          <i class="fa-solid fa-arrow-left"></i>
        </button>
        <div>
          <h2 style="margin: 0; font-size: 1.6rem; font-weight: 800; color: #1e1b4b; font-family: 'Poppins', sans-serif;">Library</h2>
          <p style="margin: 4px 0 0 0; font-size: 0.9rem; color: #64748b;">A single searchable library page for everyone.</p>
        </div>
      </div>

      <!-- Main Catalog Card -->
      <div class="section-card module-panel" style="padding: 24px;">
        <div class="section-header" style="margin-bottom: 24px;">
          <h2><i class="fa-solid fa-book-open"></i> Search Central Library</h2>
        </div>
        
        <!-- Search & Filter Form -->
        <form id="librarySearch" class="module-form" style="margin-bottom: 24px; display: grid; grid-template-columns: 2fr 1fr; gap: 20px;" onsubmit="return false;">
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <label style="font-weight: 600; font-size: 0.9rem; color: var(--text-dark); text-align: left;">Search Catalog</label>
            <div style="position: relative; width: 100%;">
              <input id="searchInput" placeholder="Search by title, author, subject, ISBN..." style="width: 100%; padding: 12px 16px 12px 40px; border-radius: var(--radius-md); border: 1px solid var(--border-color); outline: none; font-size: 0.95rem; transition: all 0.2s;" onfocus="this.style.borderColor='var(--primary)'; this.style.boxShadow='0 0 0 3px rgba(107, 70, 193, 0.15)';" onblur="this.style.borderColor='var(--border-color)'; this.style.boxShadow='none';">
              <i class="fa-solid fa-magnifying-glass" style="position: absolute; left: 16px; top: 50%; transform: translateY(-50%); color: var(--text-muted);"></i>
            </div>
          </div>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <label style="font-weight: 600; font-size: 0.9rem; color: var(--text-dark); text-align: left;">Filter by Category</label>
            <select id="categoryFilter" style="width: 100%; padding: 12px 16px; border-radius: var(--radius-md); border: 1px solid var(--border-color); outline: none; font-size: 0.95rem; background: white; cursor: pointer; transition: all 0.2s;" onfocus="this.style.borderColor='var(--primary)'; this.style.boxShadow='0 0 0 3px rgba(107, 70, 193, 0.15)';" onblur="this.style.borderColor='var(--border-color)'; this.style.boxShadow='none';">
              <option value="All">All Categories</option>
            </select>
          </div>
        </form>
        
        <!-- Book Grid -->
        <div id="bookList" class="module-grid" style="grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 24px; margin-top: 16px;">
          <div class="module-empty" style="grid-column: 1 / -1;"><i class="fa-solid fa-spinner fa-spin"></i><span>Loading books...</span></div>
        </div>
      </div>`);

    let cachedBooks = [];

    const getPlaceholderCover = (category) => {
      const cat = (category || 'General').toUpperCase();
      let coverGradient = 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)';
      if (cat.includes('CSE') || cat.includes('IT')) coverGradient = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      else if (cat.includes('CIVIL')) coverGradient = 'linear-gradient(135deg, #20bf55 0%, #01baef 100%)';
      else if (cat.includes('ECE')) coverGradient = 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
      else if (cat.includes('MECHANICAL') || cat.includes('MECH')) coverGradient = 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)';
      else if (cat.includes('GENERAL')) coverGradient = 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)';
      else if (cat.includes('ELECTRICAL') || cat.includes('EE')) coverGradient = 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)';
      else if (cat.includes('MANAGEMENT') || cat.includes('MBA')) coverGradient = 'linear-gradient(135deg, #f857a6 0%, #ff5858 100%)';
      else if (cat.includes('LITERATURE') || cat.includes('ENG')) coverGradient = 'linear-gradient(135deg, #1fa2ff 0%, #12d8fa 100%, #a6ffcb 100%)';

      return `
        <div style="width: 100px; min-width: 100px; height: 140px; border-radius: 10px; background: ${coverGradient}; display: flex; flex-direction: column; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.1); flex-shrink: 0; color: white; padding: 8px; box-sizing: border-box; text-align: center;">
          <i class="fa-solid fa-book" style="font-size: 2.2rem; margin-bottom: 10px; opacity: 0.95;"></i>
          <span style="font-size: 0.62rem; font-weight: 800; letter-spacing: 1.2px; text-transform: uppercase; line-height: 1.2; word-break: break-all; opacity: 0.9;">${esc(category || 'General')}</span>
        </div>`;
    };

    // Make helper globally accessible for onerror handler
    window.getPlaceholderCover = getPlaceholderCover;

    // Helper to calculate and render stats based on current visible books
    const updateStats = (books) => {
      const total = books.length;
      const categories = new Set(books.map(b => (b.category || 'General').toUpperCase())).size;
      const previewAvailable = books.filter(b => b.pdfUrl).length;

      const statTotal = document.getElementById('statTotalBooks');
      const statCats = document.getElementById('statCategories');
      const statPreviews = document.getElementById('statPreviewsAvailable');
      const statActive = document.getElementById('statActiveReaders');

      if (statTotal) statTotal.textContent = total;
      if (statCats) statCats.textContent = categories;
      if (statPreviews) statPreviews.textContent = previewAvailable;
      if (statActive) statActive.textContent = Math.floor(total * 1.5) + 3;
    };

    // Helper to render filtered books
    const renderFilteredBooks = (books) => {
      const list = document.getElementById('bookList');
      if (books.length === 0) {
        list.innerHTML = `
          <div class="module-empty" style="grid-column: 1 / -1; width: 100%; box-sizing: border-box; padding: 40px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px;">
            <i class="fa-regular fa-folder-open" style="font-size: 3rem; color: var(--primary); margin-bottom: 8px;"></i>
            <h3 style="margin: 0; font-size: 1.2rem; font-weight: 700; color: var(--text-dark);">No Books Found</h3>
            <p style="margin: 0; font-size: 0.9rem; color: var(--text-muted); max-width: 400px; text-align: center; line-height: 1.5;">We couldn't find any books matching your search criteria. Try adjusting your search term or choosing a different category.</p>
          </div>`;
        return;
      }

      list.innerHTML = books.map(book => {
        // cover image priority
        const coverImage = book.coverImage || book.imageUrl || book.cover || '';
        let coverHtml = '';
        if (coverImage) {
          coverHtml = `<img src="${esc(coverImage)}" alt="${esc(book.title)}" style="width: 100px; min-width: 100px; height: 140px; border-radius: 10px; object-fit: cover; box-shadow: 0 4px 10px rgba(0,0,0,0.1); flex-shrink: 0;" onerror="this.outerHTML=window.getPlaceholderCover('${esc(book.category)}')">`;
        } else {
          coverHtml = getPlaceholderCover(book.category);
        }

        // formatting publication date
        const pubDate = book.createdAt 
          ? new Date(book.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
          : 'N/A';

        // digital access badge
        const badgeStyle = 'background: #e6fffa; color: #008767; border: 1px solid #b2f5ea;';
        const badgeText = 'E-Book ⚡';

        // read action button
        let pdfUrl = book.pdfUrl || '/assets/pdfs/general_reading.pdf';
        if (pdfUrl.startsWith('/')) {
          pdfUrl = '..' + pdfUrl;
        }
        const actionBtnHtml = `
          <button onclick="window.open('${esc(pdfUrl)}', '_blank')" class="btn-filled-purple" style="width: 100%; font-size: 0.8rem; padding: 8px 12px; font-weight: 700; border-radius: var(--radius-sm); border: none; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 6px; margin-top: 10px; transition: all 0.2s;">
            <i class="fa-solid fa-book-open"></i> Read Book
          </button>`;

        return `
          <div class="book-card" style="background: white; border: 1px solid var(--border-color); border-radius: 16px; padding: 16px; display: flex; gap: 16px; box-shadow: var(--shadow-sm); transition: all 0.2s ease; position: relative; overflow: hidden; align-items: stretch; text-align: left;"
               onmouseenter="this.style.transform='translateY(-3px)'; this.style.boxShadow='var(--shadow-md)'; this.style.borderColor='var(--primary)';"
               onmouseleave="this.style.transform='translateY(0)'; this.style.boxShadow='var(--shadow-sm)'; this.style.borderColor='var(--border-color)';">
            
            ${coverHtml}
            
            <div style="display: flex; flex-direction: column; flex-grow: 1; min-width: 0; justify-content: space-between;">
              <div style="display: flex; flex-direction: column; gap: 4px;">
                <h3 style="margin: 0; font-size: 1.1rem; font-weight: 800; color: var(--text-dark); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; line-height: 1.3;" title="${esc(book.title)}">${esc(book.title)}</h3>
                <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 6px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">by ${esc(book.author)}</div>
                
                <div style="font-size: 0.75rem; color: var(--text-muted); display: flex; align-items: center; gap: 6px;">
                  <i class="fa-solid fa-barcode" style="width: 14px; color: var(--primary);"></i>
                  <span>ISBN: <strong>${esc(book.isbn || 'N/A')}</strong></span>
                </div>
                <div style="font-size: 0.75rem; color: var(--text-muted); display: flex; align-items: center; gap: 6px;">
                  <i class="fa-solid fa-calendar-days" style="width: 14px; color: var(--primary);"></i>
                  <span>Published: <strong>${pubDate}</strong></span>
                </div>
              </div>
              
              <div style="margin-top: 10px;">
                <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #f1f5f9; padding-top: 8px;">
                  <span style="${badgeStyle} padding: 4px 8px; border-radius: 8px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">${badgeText}</span>
                  <span style="font-size: 0.78rem; color: var(--text-muted); font-weight: 600;"><i class="fa-solid fa-globe" style="margin-right: 4px; color: var(--success);"></i>Online</span>
                </div>
                ${actionBtnHtml}
              </div>
            </div>
          </div>`;
      }).join('');
    };

    const filterAndRender = () => {
      const search = document.getElementById('searchInput').value.trim().toLowerCase();
      const category = document.getElementById('categoryFilter').value;

      const filtered = cachedBooks.filter(book => {
        // category match
        const matchesCategory = category === 'All' || 
          (book.category && book.category.toUpperCase() === category.toUpperCase());

        // search match
        const matchesSearch = !search ||
          (book.title && book.title.toLowerCase().includes(search)) ||
          (book.author && book.author.toLowerCase().includes(search)) ||
          (book.category && book.category.toLowerCase().includes(search)) ||
          (book.isbn && book.isbn.toLowerCase().includes(search));

        return matchesCategory && matchesSearch;
      });

      renderFilteredBooks(filtered);
      updateStats(filtered);
    };

    // Populate categories dynamically from available books
    const setupCategoryDropdown = (books) => {
      const select = document.getElementById('categoryFilter');
      const categories = [...new Set(books.map(b => b.category).filter(Boolean))];
      
      // Preserve "All" and append dynamically found categories
      select.innerHTML = '<option value="All">All Categories</option>' + 
        categories.sort().map(cat => `<option value="${esc(cat)}">${esc(cat)}</option>`).join('');
    };

    // Load function
    const load = async () => {
      const list = document.getElementById('bookList');
      try {
        const res = await fetch(`${apiBase}/api/library`);
        cachedBooks = res.ok ? await res.json() : [];
        
        setupCategoryDropdown(cachedBooks);
        renderFilteredBooks(cachedBooks);
        updateStats(cachedBooks);
      } catch (err) {
        list.innerHTML = '<div class="module-empty" style="grid-column: 1 / -1;"><i class="fa-solid fa-circle-exclamation"></i><span>Unable to load library.</span></div>';
      }
    };

    document.getElementById('searchInput').addEventListener('input', debounce(filterAndRender, 150));
    document.getElementById('categoryFilter').addEventListener('change', filterAndRender);
    document.getElementById('libraryBackBtn')?.addEventListener('click', goToDashboard);
    
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
    const userRole = (user.role || 'guest').toLowerCase();
    content(`
      <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 28px;">
        <button type="button" id="dbBackBtn" style="background: #f8fafc; border: 1px solid #e2e8f0; font-size: 1.1rem; color: #475569; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 42px; height: 42px; border-radius: 50%; transition: all 0.2s;" onmouseenter="this.style.background='#e2e8f0';" onmouseleave="this.style.background='#f8fafc';">
          <i class="fa-solid fa-arrow-left"></i>
        </button>
        <div>
          <h2 style="margin: 0; font-size: 1.6rem; font-weight: 800; color: #1e1b4b; font-family: 'Poppins', sans-serif;">Campus Directory</h2>
          <p style="margin: 4px 0 0 0; font-size: 0.9rem; color: #64748b;">Search and filter student and staff databases dynamically.</p>
        </div>
      </div>
      
      <div class="section-card module-panel" style="padding: 28px; border-radius: 16px; background: white; border: 1px solid var(--border-color); box-shadow: var(--shadow-sm);">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 20px; flex-wrap: wrap; gap: 10px;">
          <select id="dbFilterDropdown" style="padding: 8px 16px; border-radius: 10px; border: 1px solid #cbd5e1; font-size: 0.9rem; outline: none; background: white; cursor: pointer; font-weight: 600; color: #475569;">
            <!-- Options dynamically added -->
          </select>
          <div style="position: relative;">
            <input type="text" id="dbSearchInput" placeholder="Search by name, roll, dept..." style="padding: 8px 16px 8px 36px; border-radius: 10px; border: 1px solid #cbd5e1; font-size: 0.9rem; outline: none; width: 220px;">
            <i class="fa-solid fa-search" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #94a3b8; font-size: 0.85rem;"></i>
          </div>
        </div>
        <div id="dbTableContainer">
          <div style="text-align: center; padding: 40px; color: #64748b;">
            <i class="fa-solid fa-spinner fa-spin" style="font-size: 1.5rem; margin-bottom: 8px;"></i>
            <div>Loading data...</div>
          </div>
        </div>
      </div>
    `);

    document.getElementById('dbBackBtn')?.addEventListener('click', goToDashboard);

    const dropdown = document.getElementById('dbFilterDropdown');
    let options = '';
    if (userRole === 'teacher') {
      options += `
        <option value="my-students">My Students</option>
        <option value="my-mentees">My Mentees</option>
      `;
    } else if (userRole === 'warden') {
      options += `<option value="hostel-residents">Hostel Residents</option>`;
    } else if (userRole === 'hod') {
      options += `
        <option value="dept-students">Department Students</option>
        <option value="dept-teachers">Department Teachers</option>
      `;
    } else if (userRole === 'principal' || userRole === 'dean') {
      options += `
        <option value="all-students">All Students</option>
        <option value="all-teachers">All Teachers</option>
        <option value="all-hods">HODs</option>
        <option value="all-wardens">Wardens</option>
      `;
    }
    dropdown.innerHTML = options;

    const urlParams = new URLSearchParams(window.location.search);
    const filterParam = urlParams.get('filter');
    if (filterParam && dropdown.querySelector(`option[value="${filterParam}"]`)) {
      dropdown.value = filterParam;
    }

    let allDbData = [];

    const loadDbData = async () => {
      const filterVal = dropdown.value;
      const token = user.token || '';
      let endpoint = '';
      
      if (filterVal === 'my-students') endpoint = '/api/teacher/all-students';
      else if (filterVal === 'my-mentees') endpoint = '/api/teacher/my-mentees';
      else if (filterVal === 'hostel-residents') endpoint = '/api/warden/students';
      else if (filterVal === 'dept-students') endpoint = '/api/hod/students';
      else if (filterVal === 'dept-teachers') endpoint = '/api/hod/teachers';
      else if (filterVal === 'all-students') endpoint = '/api/principal/students';
      else if (filterVal === 'all-teachers') endpoint = '/api/principal/teachers';
      else if (filterVal === 'all-hods') endpoint = '/api/principal/hods';
      else if (filterVal === 'all-wardens') endpoint = '/api/principal/wardens';
      
      const tableContainer = document.getElementById('dbTableContainer');
      if (tableContainer) {
        tableContainer.innerHTML = `
          <div style="text-align: center; padding: 40px; color: #64748b;">
            <i class="fa-solid fa-spinner fa-spin" style="font-size: 1.5rem; margin-bottom: 8px;"></i>
            <div>Loading data...</div>
          </div>
        `;
      }

      try {
        const res = await fetch(`${apiBase}${endpoint}`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error();
        allDbData = await res.json();
        renderFilteredTable();
      } catch (e) {
        if (tableContainer) tableContainer.innerHTML = '<div class="module-empty">Failed to load data.</div>';
      }
    };

    const renderFilteredTable = () => {
      const q = document.getElementById('dbSearchInput')?.value.toLowerCase() || '';
      const filterVal = dropdown.value;
      
      const filtered = allDbData.filter(item => {
        return (
          (item.name && item.name.toLowerCase().includes(q)) ||
          (item.rollNumber && item.rollNumber.toLowerCase().includes(q)) ||
          (item.employeeId && item.employeeId.toLowerCase().includes(q)) ||
          (item.teacherId && item.teacherId.toLowerCase().includes(q)) ||
          (item.department && item.department.toLowerCase().includes(q)) ||
          (item.email && item.email.toLowerCase().includes(q))
        );
      });
      
      let columns = ['name', 'rollNumber', 'department', 'year', 'batch', 'email'];
      if (filterVal.includes('teacher') || filterVal.includes('hod') || filterVal.includes('warden')) {
        if (filterVal === 'hostel-residents') {
          columns = ['name', 'rollNumber', 'department', 'roomNumber', 'email'];
        } else if (filterVal === 'all-wardens') {
          columns = ['name', 'employeeId', 'hostelName', 'email'];
        } else {
          columns = ['name', 'employeeId', 'department', 'email'];
        }
      }
      
      const mapped = filtered.map(item => {
        return {
          ...item,
          employeeId: item.employeeId || item.teacherId || '--',
          department: item.department || '--',
          hostelName: item.hostelName || '--',
          year: item.year || '--',
          batch: item.batch || '--',
          rollNumber: item.rollNumber || '--',
          roomNumber: item.roomNumber || '--'
        };
      });
      
      const container = document.getElementById('dbTableContainer');
      if (container) container.innerHTML = table(mapped, columns);
    };

    dropdown.addEventListener('change', loadDbData);
    document.getElementById('dbSearchInput')?.addEventListener('input', renderFilteredTable);

    await loadDbData();
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

  function formatText(command) {
    const editor = document.getElementById('editorContent');
    const textarea = document.querySelector('textarea[name="content"]');
    if (!editor || !textarea) return;

    editor.focus();

    switch (command) {
      case 'bold':
        document.execCommand('bold', false, null);
        break;
      case 'italic':
        document.execCommand('italic', false, null);
        break;
      case 'underline':
        document.execCommand('underline', false, null);
        break;
      case 'left':
        document.execCommand('justifyLeft', false, null);
        break;
      case 'center':
        document.execCommand('justifyCenter', false, null);
        break;
      case 'right':
        document.execCommand('justifyRight', false, null);
        break;
      case 'list-ul':
        document.execCommand('insertUnorderedList', false, null);
        break;
      case 'list-ol':
        document.execCommand('insertOrderedList', false, null);
        break;
      case 'link': {
        const url = prompt('Enter the link URL (e.g. https://google.com):');
        if (url) {
          document.execCommand('createLink', false, url);
          const selection = window.getSelection();
          if (selection.rangeCount > 0) {
            const container = selection.getRangeAt(0).commonAncestorContainer;
            const linkEl = container.tagName === 'A' ? container : container.parentNode;
            if (linkEl && linkEl.tagName === 'A') {
              linkEl.target = '_blank';
              linkEl.style.color = 'var(--primary)';
              linkEl.style.textDecoration = 'underline';
              linkEl.style.fontWeight = '600';
            }
          }
        }
        break;
      }
      case 'image': {
        const url = prompt('Enter the image URL:');
        if (url) {
          document.execCommand('insertImage', false, url);
          setTimeout(() => {
            const imgs = editor.querySelectorAll('img[src="' + url + '"]');
            imgs.forEach(img => {
              img.style.maxWidth = '100%';
              img.style.height = 'auto';
              img.style.borderRadius = '8px';
              img.style.margin = '12px 0';
              img.style.display = 'block';
              img.style.boxShadow = 'var(--shadow-sm)';
            });
          }, 50);
        }
        break;
      }
      default:
        return;
    }

    textarea.value = editor.innerHTML.trim() === '<br>' ? '' : editor.innerHTML;
    updateToolbarState();
  }

  function updateToolbarState() {
    const formatButtons = {
      bold: 'bold',
      italic: 'italic',
      underline: 'underline',
      left: 'justifyLeft',
      center: 'justifyCenter',
      right: 'justifyRight',
      'list-ul': 'insertUnorderedList',
      'list-ol': 'insertOrderedList'
    };

    Object.entries(formatButtons).forEach(([format, command]) => {
      const btn = document.querySelector(`[data-format="${format}"]`);
      if (!btn) return;
      
      const isActive = document.queryCommandState(command);
      if (isActive) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
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
    escaped = escaped.replace(/\[([^\]\n]+?)\]\(([^)\n]+?)\)/g, '<a href="$2" target="_blank" style="color: var(--primary); text-decoration: underline; font-weight: 600;">$1</a>');

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

  function stripNoticeContent(text) {
    if (!text) return '';
    let clean = text.replace(/<[^>]*>/g, '');
    clean = clean
      .replace(/\*\*(?!\s)([^\n]+?)(?<!\s)\*\*/g, '$1')
      .replace(/\*(?!\s)([^\n]+?)(?<!\s)\*/g, '$1')
      .replace(/__(?!\s)([^\n]+?)(?<!\s)__/g, '$1')
      .replace(/!\[([^\]\n]*?)\]\(([^)\n]+?)\)/g, '$1')
      .replace(/\[([^\]\n]+?)\]\(([^)\n]+?)\)/g, '$1')
      .replace(/\[\/?(left|center|right)\]/g, '')
      .replace(/^\s*\*\s+/gm, '')
      .replace(/^\s*\d+\.\s+/gm, '');
    return esc(clean);
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
