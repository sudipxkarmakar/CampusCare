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
      title: 'Leave Approvals',
      description: 'Hosteler leave approvals live in one authority-facing page.',
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
      .filter(([key, value]) => {
        const userRole = (user.role || 'Guest').toLowerCase();
        const isStudent = userRole === 'student' || userRole === 'hosteler';
        if (cfg.module === 'assignments' && isStudent && key === 'post') return false;
        if (cfg.module === 'routine' && key === 'post') {
          return userRole === 'hod' || userRole === 'principal' || userRole === 'admin';
        }
        return true;
      })
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
        <li><a href="${rootPrefix}modules/notices/view.html" class="nav-item ${cfg.module === 'notices' ? 'active' : ''}"><i class="fa-regular fa-bell"></i> Personal Notice</a></li>
        <li><a href="${rootPrefix}modules/complaints/view.html" class="nav-item ${cfg.module === 'complaints' ? 'active' : ''}"><i class="fa-solid fa-shield-halved"></i> Complaints</a></li>
      `;
    } else if (userRole === 'teacher') {
      portalText = 'Teacher Portal';
      navMenuHtml = `
        <li><a href="${rootPrefix}teacher/index.html" class="nav-item"><i class="fa-solid fa-house-chimney"></i> Dashboard</a></li>
        <li><a href="${rootPrefix}modules/routine/view.html" class="nav-item ${cfg.module === 'routine' ? 'active' : ''}"><i class="fa-solid fa-calendar-days"></i> My Classes</a></li>
        <li><a href="${rootPrefix}modules/complaints/resolve.html" class="nav-item ${cfg.module === 'complaints' ? 'active' : ''}"><i class="fa-solid fa-circle-exclamation"></i> Complaints</a></li>
        <li><a href="${rootPrefix}modules/notices/post.html" class="nav-item ${cfg.module === 'notices' ? 'active' : ''}"><i class="fa-regular fa-bell"></i> Official Notices</a></li>
      `;
    } else if (userRole === 'warden') {
      portalText = 'Warden Portal';
      navMenuHtml = `
        <li><a href="${rootPrefix}warden/index.html" class="nav-item"><i class="fa-solid fa-house-chimney"></i> Dashboard</a></li>
        <li><a href="${rootPrefix}modules/gate-pass/approve.html" class="nav-item ${cfg.module === 'gate-pass' ? 'active' : ''}"><i class="fa-solid fa-stamp"></i> Leave Approvals</a></li>
        <li><a href="${rootPrefix}modules/complaints/resolve.html" class="nav-item ${cfg.module === 'complaints' ? 'active' : ''}"><i class="fa-solid fa-triangle-exclamation"></i> Complaints</a></li>
        <li><a href="${rootPrefix}modules/mess-menu/post.html" class="nav-item ${cfg.module === 'mess-menu' ? 'active' : ''}"><i class="fa-solid fa-utensils"></i> Mess Menu</a></li>
        <li><a href="${rootPrefix}modules/notices/post.html" class="nav-item ${cfg.module === 'notices' ? 'active' : ''}"><i class="fa-solid fa-bullhorn"></i> Notice Board</a></li>
      `;
    } else if (userRole === 'hod') {
      portalText = 'HOD Portal';
      navMenuHtml = `
        <li><a href="${rootPrefix}hod/index.html" class="nav-item"><i class="fa-solid fa-house-chimney"></i> Dashboard</a></li>
        <li><a href="${rootPrefix}modules/gate-pass/approve.html" class="nav-item ${cfg.module === 'gate-pass' ? 'active' : ''}"><i class="fa-solid fa-file-signature"></i> Leave Requests</a></li>
        <li><a href="${rootPrefix}modules/complaints/resolve.html" class="nav-item ${cfg.module === 'complaints' ? 'active' : ''}"><i class="fa-solid fa-gavel"></i> Dept Complaints</a></li>
        <li><a href="${rootPrefix}modules/routine/post.html" class="nav-item ${cfg.module === 'routine' ? 'active' : ''}"><i class="fa-solid fa-calendar-week"></i> Routine Management</a></li>
        <li><a href="${rootPrefix}modules/notices/post.html" class="nav-item ${cfg.module === 'notices' ? 'active' : ''}"><i class="fa-solid fa-bullhorn"></i> Notices</a></li>
      `;
    } else if (userRole === 'principal') {
      portalText = 'Principal Portal';
      navMenuHtml = `
        <li><a href="${rootPrefix}principal/index.html" class="nav-item"><i class="fa-solid fa-house-chimney"></i> Dashboard</a></li>
        <li><a href="${rootPrefix}modules/complaints/resolve.html" class="nav-item ${cfg.module === 'complaints' ? 'active' : ''}"><i class="fa-solid fa-list-check"></i> Complaints</a></li>
        <li><a href="${rootPrefix}modules/notices/post.html" class="nav-item ${cfg.module === 'notices' ? 'active' : ''}"><i class="fa-solid fa-bullhorn"></i> Global Notices</a></li>
      `;
    } else {
      portalText = 'Guest Portal';
      navMenuHtml = `
        <li><a href="${rootPrefix}index.html" class="nav-item"><i class="fa-solid fa-house-chimney"></i> Home</a></li>
        <li><a href="${rootPrefix}index.html#complaint-wall" class="nav-item"><i class="fa-solid fa-shield-halved"></i> Transparency Wall</a></li>
        <li><a href="${rootPrefix}modules/notices/view.html" class="nav-item ${cfg.module === 'notices' ? 'active' : ''}"><i class="fa-regular fa-calendar-days"></i> News & Events</a></li>
        <li><a href="${rootPrefix}modules/leaders/view.html" class="nav-item ${cfg.module === 'leaders' ? 'active' : ''}"><i class="fa-solid fa-user-group"></i> Academic Leaders</a></li>
        <li><a href="${rootPrefix}modules/alumni/view.html" class="nav-item ${cfg.module === 'alumni' ? 'active' : ''}"><i class="fa-solid fa-graduation-cap"></i> Alumni Excellence</a></li>
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

    const nameParts = (user.name || user.fullName || 'User').split(' ');
    const displayName = nameParts[0] + (['dr.', 'dr', 'prof.', 'prof', 'mr.', 'mr', 'mrs.', 'mrs', 'ms.', 'ms'].includes(nameParts[0].toLowerCase()) && nameParts.length > 1 ? ' ' + nameParts[1] : '');

    let designation = "User";
    if (userRole === "student" || userRole === "hosteler") {
      const dept = user.department || "Student";
      let yrText = "";
      if (user.semester) {
        const yr = Math.ceil(parseInt(user.semester) / 2);
        const suffixes = ["st", "nd", "rd", "th"];
        const suffix = (yr >= 1 && yr <= 4) ? suffixes[yr - 1] : "th";
        yrText = `, ${yr}${suffix} Year`;
      } else if (user.batch) {
        yrText = `, Batch ${user.batch}`;
      }
      designation = `${dept}${yrText}`;
    } else if (userRole === "teacher" || userRole === "hod" || userRole === "warden" || userRole === "dean" || userRole === "principal") {
      const roleLabels = {
        teacher: "Faculty",
        hod: "HOD",
        warden: "Hostel Admin",
        dean: "Dean",
        principal: "Principal"
      };
      const labelVal = roleLabels[userRole] || (userRole.charAt(0).toUpperCase() + userRole.slice(1));
      const deptText = user.department ? `, ${user.department}` : "";
      designation = `${labelVal}${deptText}`;
    } else {
      designation = user.role ? (user.role.charAt(0).toUpperCase() + user.role.slice(1)) : "User";
    }

    let usernameText = user.rollNumber || user.employeeId || user.identifier || "";
    if (role === "student" || role === "hosteler") {
      let emailLocal = (user.email || "").split("@")[0];
      if (emailLocal) {
        usernameText = emailLocal;
      }
    }

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
                    padding: 16px;
                    border-radius: var(--radius-lg);
                    box-shadow: var(--shadow-lg);
                    z-index: 1000;
                    border: 1px solid var(--border-color);
                    animation: fadeIn 0.2s ease;
                    text-align: left;
                  ">
                    <div style="display: flex; flex-direction: column; gap: 8px; min-width: 290px; padding: 2px;">
                      <!-- Line 1: Header with Badge -->
                      <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border-color); padding-bottom: 8px; margin-bottom: 0;">
                        <span style="font-weight: 700; font-size: 0.95rem; color: var(--text-dark);">Account Details</span>
                        <span class="role-badge-mini" style="text-transform: uppercase; font-size: 0.7rem; font-weight: 700; padding: 4px 12px; border-radius: var(--radius-full); background: ${colors.bg}; color: ${colors.color};">${(user.role || 'Guest').toUpperCase()}</span>
                      </div>
                      
                       <div id="userDetails" style="display: flex; align-items: baseline; gap: 8px; text-align: left; width: 100%; padding: 4px 0; box-sizing: border-box;">
                         <span style="font-weight: 700; font-size: 1rem; color: var(--text-dark);">${esc(user.name || "User")}</span>
                         <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600;">(ID: ${esc(user.rollNumber || user.employeeId || user.identifier || "--")})</span>
                       </div>
 
                      <!-- Line 3: Actions -->
                      <div style="display: flex; gap: 8px; margin-top: 2px; border-top: 1px solid var(--border-color); padding-top: 10px;">
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
                src="${rootPrefix}assets/images/logo.png"
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
              <a href="${rootPrefix}modules/complaints/post.html" class="nav-item ${cfg.module === 'complaints' && cfg.mode === 'post' ? 'active' : ''}"><i class="fa-solid fa-circle-plus"></i> Register Complaint</a>
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
    document.querySelectorAll('[data-action="logout"]').forEach(btn => {
      btn.addEventListener('click', () => {
        localStorage.removeItem('user');
        window.location.href = `${getRootPrefix()}index.html`;
      });
    });

    if (cfg.module === 'routine') {
      const hero = document.getElementById('home');
      if (hero) hero.style.display = 'none';
      renderRoutinePage(info);
      initSidebar();
      return;
    }

    if (cfg.module === 'mess-menu') {
      const hero = document.getElementById('home');
      if (hero) hero.style.display = 'none';
      renderMessMenuPage(info);
      initSidebar();
      return;
    }

    if (cfg.module === 'complaints') {
      const hero = document.getElementById('home');
      if (hero) hero.style.display = 'none';
      renderComplaintsPage(info);
      initSidebar();
      return;
    }

    if (cfg.module === 'documents') {
      const hero = document.getElementById('home');
      if (hero) hero.style.display = 'none';
      renderDocumentsPage(info);
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

    if (cfg.module === 'mar-moocs') {
      const hero = document.getElementById('home');
      if (hero) hero.style.display = 'none';
      renderMarMoocsPage(info);
      initSidebar();
      return;
    }

    if (cfg.module === 'alumni') {
      const hero = document.getElementById('home');
      if (hero) hero.style.display = 'none';
      renderAlumniPage(info);
      initSidebar();
      return;
    }

    if (cfg.module === 'assignments') {
      const hero = document.getElementById('home');
      if (hero) hero.style.display = 'none';
      renderAssignmentsPage(info);
      initSidebar();
      return;
    }

    if (cfg.module === 'achievements') {
      const hero = document.getElementById('home');
      if (hero) hero.style.display = 'none';
      renderAchievementsPage(info);
      initSidebar();
      return;
    }

    if (cfg.module === 'student-database') {
      const hero = document.getElementById('home');
      if (hero) hero.style.display = 'none';
      renderStudentDatabase();
      initSidebar();
      return;
    }

    if (cfg.module === 'gate-pass') {
      const hero = document.getElementById('home');
      if (hero) hero.style.display = 'none';
      renderGatePassApproval();
      initSidebar();
      return;
    }

    if (cfg.module === 'library') renderLibrary();
    else if (cfg.module === 'profile') renderProfile();
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
          <div style="text-align: left; background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; color: #334155; line-height: 1.6; font-size: 0.95rem; white-space: pre-wrap; margin-bottom: 16px;">
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
          <!-- 1st Row: Title on Left, Date & Type in Middle, Audience on Right -->
          <div style="display: flex; gap: 16px; width: 100%; align-items: flex-end; flex-wrap: wrap;">
            <div style="flex: 1; min-width: 200px; display: flex; flex-direction: column; gap: 8px;">
              <label style="font-weight: 700; font-size: 0.9rem; color: var(--text-dark); text-align: left;">Notice Title</label>
              <input type="text" name="title" placeholder="Enter notice title..." required style="padding: 14px 18px; border-radius: 12px; border: 1px solid var(--border-color); outline: none; font-size: 1rem; width: 100%; transition: all 0.2s; font-weight: 500;" onfocus="this.style.borderColor='var(--primary)'; this.style.boxShadow='0 0 0 3px rgba(107, 70, 193, 0.15)';" onblur="this.style.borderColor='var(--border-color)'; this.style.boxShadow='none';">
            </div>
            
            <div style="width: 160px; display: flex; flex-direction: column; gap: 8px;">
              <label style="font-weight: 700; font-size: 0.9rem; color: var(--text-dark); text-align: left;">Event Date</label>
              <input type="date" name="date" style="padding: 14px 12px; border-radius: 12px; border: 1px solid var(--border-color); outline: none; font-size: 0.95rem; width: 100%; transition: all 0.2s; font-weight: 500;" onfocus="this.style.borderColor='var(--primary)'; this.style.boxShadow='0 0 0 3px rgba(107, 70, 193, 0.15)';" onblur="this.style.borderColor='var(--border-color)'; this.style.boxShadow='none';">
            </div>

            <div style="width: 140px; display: flex; flex-direction: column; gap: 8px;">
              <label style="font-weight: 700; font-size: 0.9rem; color: var(--text-dark); text-align: left;">Event Type</label>
              <select name="eventType" style="padding: 14px 12px; border-radius: 12px; border: 1px solid var(--border-color); outline: none; font-size: 0.95rem; width: 100%; background: white; cursor: pointer; transition: all 0.2s; font-weight: 500;" onfocus="this.style.borderColor='var(--primary)'; this.style.boxShadow='0 0 0 3px rgba(107, 70, 193, 0.15)';" onblur="this.style.borderColor='var(--border-color)'; this.style.boxShadow='none';">
                <option value="event">Event</option>
                <option value="holiday">Holiday</option>
              </select>
            </div>

            <div style="width: 160px; display: flex; flex-direction: column; gap: 8px;">
              <label style="font-weight: 700; font-size: 0.9rem; color: var(--text-dark); text-align: left;">Target Audience</label>
              <select name="audience" required style="padding: 14px 12px; border-radius: 12px; border: 1px solid var(--border-color); outline: none; font-size: 0.95rem; width: 100%; background: white; cursor: pointer; transition: all 0.2s; font-weight: 500;" onfocus="this.style.borderColor='var(--primary)'; this.style.boxShadow='0 0 0 3px rgba(107, 70, 193, 0.15)';" onblur="this.style.borderColor='var(--border-color)'; this.style.boxShadow='none';">
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

    // Prefill from AI Draft Notice if available
    try {
      const aiNoticeText = sessionStorage.getItem('aiDraftNoticeText');
      const aiNoticeTitle = sessionStorage.getItem('aiDraftNoticeTitle');
      if (aiNoticeText) {
        if (editor) editor.innerHTML = aiNoticeText;
        if (textarea) textarea.value = aiNoticeText;
        const titleInput = document.querySelector('input[name="title"]');
        if (titleInput && aiNoticeTitle) titleInput.value = aiNoticeTitle;
        sessionStorage.removeItem('aiDraftNoticeText');
        sessionStorage.removeItem('aiDraftNoticeTitle');
      }
    } catch (err) {
      console.error('Error prefilling AI notice draft:', err);
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
      'mess-menu': '/api/hostel/mess',
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
      <label>Location (e.g., Room No, Lab, Block)<input name="location" placeholder="e.g. Room 204, IT Lab, Block A" required></label>
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

  function showWhatsAppDraftModal(staff, comp) {
    const studentName = user.name || 'Student';
    const roomNo = comp.location || 'N/A';
    const problem = comp.title || 'N/A';
    const details = comp.description || 'N/A';
    
    const message = `Hello ${staff.name},\n\nA new campus complaint has been filed and routed to you.\n\n*Problem:* ${problem}\n*Location:* ${roomNo}\n*Details:* ${details}\n*Reported By:* ${studentName}\n\nPlease take necessary action.`;
    const encodedText = encodeURIComponent(message);
    const phone = staff.contactNumber ? staff.contactNumber.replace(/\D/g, '') : '';
    const prefix = phone.length === 10 ? '91' : '';
    const waUrl = `https://api.whatsapp.com/send?phone=${prefix}${phone}&text=${encodedText}`;

    // Create modal container
    const modal = document.createElement('div');
    modal.id = 'cc-whatsapp-modal';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100vw';
    modal.style.height = '100vh';
    modal.style.backgroundColor = 'rgba(15, 23, 42, 0.6)';
    modal.style.backdropFilter = 'blur(8px)';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.zIndex = '99999';
    modal.style.animation = 'fadeIn 0.3s ease';

    modal.innerHTML = `
      <div style="background: white; border-radius: 20px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); max-width: 500px; width: 90%; padding: 32px; text-align: center; border: 1px solid #e2e8f0; animation: scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);">
        <div style="width: 64px; height: 64px; background: #e8f5e9; color: #2e7d32; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px auto; font-size: 2rem;">
          <i class="fa-solid fa-circle-check"></i>
        </div>
        <h3 style="margin: 0 0 8px 0; font-size: 1.5rem; font-weight: 700; color: #0f172a; font-family: 'Poppins', sans-serif;">Complaint Registered!</h3>
        <p style="color: #64748b; font-size: 0.95rem; margin: 0 0 24px 0; line-height: 1.5;">
          Your complaint has been successfully filed and assigned to <strong>${staff.name} (${staff.designation})</strong>.
        </p>
        
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 28px; text-align: left;">
          <div style="font-size: 0.8rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-bottom: 8px;">Draft Message</div>
          <div style="font-size: 0.85rem; color: #334155; line-height: 1.6; max-height: 150px; overflow-y: auto; white-space: pre-wrap; font-family: inherit;">${message}</div>
        </div>

        <div style="display: flex; gap: 12px; justify-content: center;">
          <button id="cc-wa-close-btn" style="padding: 12px 24px; border-radius: 12px; border: 1px solid #cbd5e1; background: white; color: #475569; font-weight: 600; font-size: 0.95rem; cursor: pointer; transition: all 0.2s;" onmouseenter="this.style.background='#f1f5f9';" onmouseleave="this.style.background='white';">
            Close
          </button>
          <a id="cc-wa-send-btn" href="${waUrl}" target="_blank" style="text-decoration: none; padding: 12px 24px; border-radius: 12px; border: none; background: #25D366; color: white; font-weight: 600; font-size: 0.95rem; display: inline-flex; align-items: center; gap: 8px; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 12px rgba(37, 211, 102, 0.25);" onmouseenter="this.style.background='#128c7e'; this.style.transform='translateY(-1px)';" onmouseleave="this.style.background='#25D366'; this.style.transform='none';">
            <i class="fa-brands fa-whatsapp" style="font-size: 1.15rem;"></i> Send Alert
          </a>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    if (!document.getElementById('cc-modal-styles')) {
      const style = document.createElement('style');
      style.id = 'cc-modal-styles';
      style.innerHTML = `
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleUp { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `;
      document.head.appendChild(style);
    }

    document.getElementById('cc-wa-close-btn').addEventListener('click', () => {
      modal.remove();
    });
    document.getElementById('cc-wa-send-btn').addEventListener('click', () => {
      modal.remove();
    });
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
    
    if (cfg.module === 'notices' && !hasFile && data.date) {
      const metaComment = `[EVENT_META:{"date":"${data.date}","eventType":"${data.eventType || 'event'}"}]`;
      data.content = (data.content || '') + metaComment;
    }

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
    
    if (cfg.module === 'complaints') {
      const resData = await res.json();
      if (resData.assignedStaff) {
        showWhatsAppDraftModal(resData.assignedStaff, resData.complaint);
      } else {
        alert('Complaint submitted successfully!');
      }
    } else {
      alert('Submitted successfully.');
    }
    form.reset();
  }

  async function renderAlumniPage(info) {
    const userRole = (user.role || 'guest').toLowerCase();
    const isAuthority = ['principal', 'admin', 'dean', 'hod'].includes(userRole);
    const mode = cfg.mode || 'view';
    const isPostMode = mode === 'post';

    const formatExternalLink = (url) => {
      if (!url) return '';
      const trimmed = url.trim();
      if (/^https?:\/\//i.test(trimmed)) return trimmed;
      return `https://${trimmed}`;
    };

    // Hide the Post link from non-authorities
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
          <p>Only HODs and administrators can post Alumni Excellence profiles.</p>
        </div>
      `);
      return;
    }

    if (isPostMode) {
      content(`
        <style>
          @keyframes alumni-ai-pulse {
            0%, 100% { box-shadow: 0 0 0 0 rgba(217,119,6,0.3); }
            50% { box-shadow: 0 0 0 8px rgba(217,119,6,0); }
          }
          .alumni-ai-btn {
            display: flex; align-items: center; gap: 8px;
            padding: 10px 18px; border-radius: 10px;
            border: 1.5px solid #d97706; background: #fffbeb;
            color: #b45309; font-weight: 600; font-size: 0.88rem;
            cursor: pointer; transition: all 0.22s; width: 100%;
            justify-content: center;
          }
          .alumni-ai-btn:hover:not(:disabled) {
            background: #d97706; color: white;
            box-shadow: 0 4px 16px rgba(217,119,6,0.25);
            transform: translateY(-1px);
          }
          .alumni-ai-btn:disabled { opacity: 0.65; cursor: not-allowed; }
          .alumni-ai-btn.loading { animation: alumni-ai-pulse 1.4s infinite; }
          #alumniPostLayout {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 28px;
            align-items: start;
          }
          @media (max-width: 1100px) {
            #alumniPostLayout { grid-template-columns: 1fr; }
          }
          .alumni-post-row-item {
            display: flex; gap: 14px; padding: 16px 18px; border-radius: 12px;
            border: 1px solid #f1f5f9; background: #ffffff;
            transition: all 0.2s; position: relative; align-items: flex-start;
            margin-bottom: 8px; box-sizing: border-box;
          }
          .alumni-post-row-item:hover {
            border-color: #fde68a; background: #fffbeb;
            box-shadow: 0 4px 12px rgba(217,119,6,0.08);
          }
          .alumni-post-row-avatar {
            width: 44px; height: 44px; border-radius: 50%;
            object-fit: cover; border: 2px solid #fef3c7; flex-shrink: 0;
          }
          .alumni-post-row-actions {
            display: flex; gap: 6px; margin-left: auto; flex-shrink: 0; align-self: center;
          }
          .alumni-row-btn {
            border: none; border-radius: 8px;
            width: 32px; height: 32px;
            display: flex; align-items: center; justify-content: center;
            cursor: pointer; font-size: 0.8rem; transition: all 0.18s;
          }
          .alumni-row-btn.edit { background: #ede9fe; color: #6d28d9; }
          .alumni-row-btn.edit:hover { background: #6d28d9; color: white; }
          .alumni-row-btn.del { background: #fee2e2; color: #ef4444; }
          .alumni-row-btn.del:hover { background: #ef4444; color: white; }
        </style>

        <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 28px;">
          <button type="button" id="alumniBackBtn" style="background: #f8fafc; border: 1px solid #e2e8f0; font-size: 1.1rem; color: #475569; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 42px; height: 42px; border-radius: 50%; transition: all 0.2s;" onmouseenter="this.style.background='#e2e8f0';" onmouseleave="this.style.background='#f8fafc';">
            <i class="fa-solid fa-arrow-left"></i>
          </button>
          <div>
            <h2 style="margin: 0; font-size: 1.6rem; font-weight: 800; color: #1e1b4b; font-family: 'Poppins', sans-serif;">Alumni Excellence</h2>
            <p style="margin: 4px 0 0 0; font-size: 0.9rem; color: #64748b;">Manage alumni profiles — add new entries or edit existing ones.</p>
          </div>
        </div>

        <div id="alumniPostLayout">

          <!-- LEFT: Post / Edit Form -->
          <div class="section-card module-panel" style="padding: 28px; border-radius: 16px; background: white; border: 1px solid var(--border-color); box-shadow: var(--shadow-sm);">
            <h3 id="alumniFormTitle" style="margin-top: 0; margin-bottom: 20px; font-size: 1.2rem; font-weight: 700; color: #1e1b4b; display: flex; align-items: center; gap: 10px;">
              <i class="fa-solid fa-graduation-cap" style="color: #d97706;"></i> Add Alumni Profile
            </h3>
            <form id="alumniPostForm" style="display: flex; flex-direction: column; gap: 16px;">
              <input type="hidden" id="alumniEditId" value="">

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
                <div style="display: flex; flex-direction: column; gap: 5px;">
                  <label style="font-size: 0.82rem; font-weight: 600; color: #475569;">Full Name</label>
                  <input type="text" name="name" id="aName" placeholder="e.g. Ahmad Raza" required style="padding: 9px 12px; border-radius: 10px; border: 1px solid #cbd5e1; outline: none; font-size: 0.88rem;" onfocus="this.style.borderColor='#d97706';" onblur="this.style.borderColor='#cbd5e1';">
                </div>
                <div style="display: flex; flex-direction: column; gap: 5px;">
                  <label style="font-size: 0.82rem; font-weight: 600; color: #475569;">Graduation Year</label>
                  <input type="number" name="graduationYear" id="aYear" placeholder="e.g. 2020" min="1980" max="2030" required style="padding: 9px 12px; border-radius: 10px; border: 1px solid #cbd5e1; outline: none; font-size: 0.88rem;" onfocus="this.style.borderColor='#d97706';" onblur="this.style.borderColor='#cbd5e1';">
                </div>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
                <div style="display: flex; flex-direction: column; gap: 5px;">
                  <label style="font-size: 0.82rem; font-weight: 600; color: #475569;">Degree</label>
                  <select name="degree" id="aDegree" required style="padding: 9px 12px; border-radius: 10px; border: 1px solid #cbd5e1; outline: none; font-size: 0.88rem; background: white;" onfocus="this.style.borderColor='#d97706';" onblur="this.style.borderColor='#cbd5e1';">
                    <option value="">Select Degree</option>
                    <option value="B.Tech">B.Tech</option>
                    <option value="M.Tech">M.Tech</option>
                    <option value="MCA">MCA</option>
                    <option value="MBA">MBA</option>
                    <option value="Ph.D">Ph.D</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div style="display: flex; flex-direction: column; gap: 5px;">
                  <label style="font-size: 0.82rem; font-weight: 600; color: #475569;">Department</label>
                  <input type="text" name="department" id="aDept" placeholder="e.g. CSE, ECE" style="padding: 9px 12px; border-radius: 10px; border: 1px solid #cbd5e1; outline: none; font-size: 0.88rem;" onfocus="this.style.borderColor='#d97706';" onblur="this.style.borderColor='#cbd5e1';">
                </div>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
                <div style="display: flex; flex-direction: column; gap: 5px;">
                  <label style="font-size: 0.82rem; font-weight: 600; color: #475569;">Current Company</label>
                  <input type="text" name="currentCompany" id="aCompany" placeholder="e.g. Google, Infosys" style="padding: 9px 12px; border-radius: 10px; border: 1px solid #cbd5e1; outline: none; font-size: 0.88rem;" onfocus="this.style.borderColor='#d97706';" onblur="this.style.borderColor='#cbd5e1';">
                </div>
                <div style="display: flex; flex-direction: column; gap: 5px;">
                  <label style="font-size: 0.82rem; font-weight: 600; color: #475569;">Job Title</label>
                  <input type="text" name="jobTitle" id="aJob" placeholder="e.g. Software Engineer" style="padding: 9px 12px; border-radius: 10px; border: 1px solid #cbd5e1; outline: none; font-size: 0.88rem;" onfocus="this.style.borderColor='#d97706';" onblur="this.style.borderColor='#cbd5e1';">
                </div>
              </div>

              <div style="display: flex; flex-direction: column; gap: 5px;">
                <label style="font-size: 0.82rem; font-weight: 600; color: #475569;">LinkedIn Profile URL</label>
                <input type="url" name="linkedinProfile" id="aLinkedin" placeholder="https://linkedin.com/in/..." style="padding: 9px 12px; border-radius: 10px; border: 1px solid #cbd5e1; outline: none; font-size: 0.88rem;" onfocus="this.style.borderColor='#d97706';" onblur="this.style.borderColor='#cbd5e1';">
              </div>

              <div style="display: flex; flex-direction: column; gap: 5px;">
                <label style="font-size: 0.82rem; font-weight: 600; color: #475569; display: flex; align-items: center; justify-content: space-between;">
                  <span>Inspiring Quote / Story</span>
                  <span id="alumniAiTag" style="display:none; font-size:0.72rem; color:#b45309; font-weight:600; background:#fffbeb; padding:2px 8px; border-radius:6px;"><i class="fa-solid fa-wand-magic-sparkles"></i> AI Drafted</span>
                </label>
                <button type="button" id="alumniAiDraftBtn" class="alumni-ai-btn" style="margin-bottom: 6px;">
                  <i class="fa-solid fa-wand-magic-sparkles"></i>
                  <span id="alumniAiDraftBtnLabel">Draft Quote with AI</span>
                </button>
                <textarea name="about" id="alumniAboutInput" rows="3" placeholder="A short inspiring quote or achievement story..." style="padding: 9px 12px; border-radius: 10px; border: 1px solid #cbd5e1; outline: none; font-size: 0.88rem; font-family: inherit;" onfocus="this.style.borderColor='#d97706';" onblur="this.style.borderColor='#cbd5e1';"></textarea>
              </div>

              <div style="display: flex; gap: 10px; margin-top: 4px;">
                <button type="submit" id="alumniSubmitBtn" style="flex: 1; background: #d97706; color: white; border: none; padding: 11px 18px; border-radius: 10px; font-weight: 700; font-size: 0.92rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s;" onmouseenter="this.style.background='#b45309';" onmouseleave="this.style.background='#d97706';">
                  <i class="fa-solid fa-paper-plane"></i> <span id="alumniSubmitLabel">Publish Profile</span>
                </button>
                <button type="button" id="alumniCancelEditBtn" style="display:none; padding: 11px 14px; border-radius: 10px; border: 1px solid #cbd5e1; background: #f8fafc; color: #475569; font-weight: 600; font-size: 0.88rem; cursor: pointer; transition: all 0.2s;" onmouseenter="this.style.background='#e2e8f0';" onmouseleave="this.style.background='#f8fafc';">
                  Cancel
                </button>
              </div>
            </form>
          </div>

          <!-- RIGHT: Alumnis List -->
          <div style="display: flex; flex-direction: column; gap: 16px;">
            <div style="background: white; border-radius: 16px; border: 1px solid var(--border-color); box-shadow: var(--shadow-sm); overflow: hidden;">
              <div style="padding: 18px 20px 14px; border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; justify-content: space-between;">
                <h3 style="margin: 0; font-size: 1rem; font-weight: 700; color: #1e1b4b; display: flex; align-items: center; gap: 8px;">
                  <i class="fa-solid fa-users" style="color: #d97706;"></i> Alumnis
                  <span id="alumniCountBadge" style="font-size: 0.72rem; background: #fffbeb; color: #b45309; border: 1px solid #fde68a; border-radius: 20px; padding: 2px 8px; font-weight: 700;"></span>
                </h3>
                <a href="view.html" style="font-size: 0.82rem; font-weight: 600; color: #d97706; text-decoration: none; display: flex; align-items: center; gap: 5px; padding: 5px 10px; border-radius: 8px; border: 1px solid #fde68a; background: #fffbeb; transition: all 0.2s;" onmouseenter="this.style.background='#fef3c7';" onmouseleave="this.style.background='#fffbeb';">
                  View All <i class="fa-solid fa-arrow-up-right-from-square" style="font-size: 0.7rem;"></i>
                </a>
              </div>
              <div id="alumniPostSidelist" style="max-height: none; overflow-y: hidden; padding: 10px 12px; display: flex; flex-direction: column; gap: 6px;">
                <div style="text-align: center; padding: 24px; color: #94a3b8; font-size: 0.88rem;">
                  <i class="fa-solid fa-spinner fa-spin" style="font-size: 1.2rem; margin-bottom: 6px; display: block;"></i>
                  Loading alumni...
                </div>
              </div>
            </div>
          </div>

        </div>
      `);

      document.getElementById('alumniBackBtn')?.addEventListener('click', goToDashboard);

      // Track all loaded alumni for edit pre-fill
      let allAlumniData = [];
      let isEditMode = false;

      // Check for query parameter 'edit'
      const urlParams = new URLSearchParams(window.location.search);
      const editIdParam = urlParams.get('edit');

      // Load existing alumni into the right panel
      const loadPostSidelist = async () => {
        const sidelist = document.getElementById('alumniPostSidelist');
        const countBadge = document.getElementById('alumniCountBadge');
        if (!sidelist) return;
        try {
          const token = user.token || localStorage.getItem('token') || '';
          const res = await fetch(`${apiBase}/api/alumni`, token ? { headers: { Authorization: `Bearer ${token}` } } : {});
          if (!res.ok) throw new Error();
          const data = await res.json();
          allAlumniData = Array.isArray(data) ? data : [];
          if (countBadge) countBadge.textContent = allAlumniData.length;
          renderSidelist();

          // If edit parameter was provided in the URL, trigger edit prefill
          if (editIdParam) {
            const editBtn = sidelist.querySelector(`.alumni-row-btn.edit[data-id="${editIdParam}"]`);
            if (editBtn) {
              editBtn.click();
            }
          }
        } catch {
          sidelist.innerHTML = `<div style="text-align:center; padding:20px; color:#94a3b8; font-size:0.85rem;">Could not load alumni profiles.</div>`;
        }
      };

      const renderSidelist = () => {
        const sidelist = document.getElementById('alumniPostSidelist');
        if (!sidelist) return;
        if (!allAlumniData.length) {
          sidelist.innerHTML = `<div style="text-align:center; padding:24px; color:#94a3b8; font-size:0.85rem;"><i class="fa-regular fa-folder-open" style="font-size:1.5rem; display:block; margin-bottom:8px;"></i>No alumni profiles yet.</div>`;
          return;
        }
        sidelist.innerHTML = allAlumniData.slice(0, 5).map(item => {
          const name = item.name || item.user?.name || 'Alumni';
          const avatarSrc = item.image
            ? (item.image.startsWith('http') ? item.image : `${apiBase}${item.image}`)
            : `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=d97706&color=fff&rounded=true&bold=true&size=44`;

          let detailsText = '';
          if (item.degree && item.department) {
            detailsText = `${esc(item.degree)} (${esc(item.department)})`;
          } else if (item.degree) {
            detailsText = esc(item.degree);
          } else if (item.department) {
            detailsText = esc(item.department);
          }
          const gradText = item.graduationYear ? `Class of ${item.graduationYear}` : '';
          const metaLine = [detailsText, gradText].filter(Boolean).join(' · ');

          let jobCompanyText = '';
          if (item.jobTitle && item.currentCompany) {
            jobCompanyText = `${esc(item.jobTitle)} at <strong>${esc(item.currentCompany)}</strong>`;
          } else if (item.jobTitle) {
            jobCompanyText = esc(item.jobTitle);
          } else if (item.currentCompany) {
            jobCompanyText = `Works at <strong>${esc(item.currentCompany)}</strong>`;
          }

          return `
            <div class="alumni-post-row-item" data-id="${item._id}">
              <img class="alumni-post-row-avatar" src="${avatarSrc}" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=d97706&color=fff&rounded=true&bold=true&size=44';" alt="${esc(name)}">
              <div style="min-width:0; flex:1; overflow:hidden; display:flex; flex-direction:column; gap:4px;">
                <div style="font-size:0.92rem; font-weight:700; color:#1e1b4b; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${esc(name)}</div>
                ${metaLine ? `<div style="font-size:0.78rem; color:#b45309; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${metaLine}</div>` : ''}
                ${jobCompanyText ? `
                  <div style="font-size:0.8rem; color:#475569; font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                    <i class="fa-solid fa-briefcase" style="font-size:0.75rem; color:#d97706; margin-right:4px;"></i>${jobCompanyText}
                  </div>` : ''}
              </div>
              <div class="alumni-post-row-actions">
                <button type="button" class="alumni-row-btn edit" data-id="${item._id}" title="Edit">
                  <i class="fa-solid fa-pen"></i>
                </button>
                <button type="button" class="alumni-row-btn del" data-id="${item._id}" title="Delete">
                  <i class="fa-solid fa-trash"></i>
                </button>
              </div>
            </div>`;
        }).join('');

        // Edit button handlers
        sidelist.querySelectorAll('.alumni-row-btn.edit').forEach(btn => {
          btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            const item = allAlumniData.find(a => a._id === id);
            if (!item) return;
            isEditMode = true;
            document.getElementById('alumniEditId').value = id;
            document.getElementById('aName').value = item.name || item.user?.name || '';
            document.getElementById('aYear').value = item.graduationYear || '';
            document.getElementById('aDegree').value = item.degree || '';
            document.getElementById('aDept').value = item.department || '';
            document.getElementById('aCompany').value = item.currentCompany || '';
            document.getElementById('aJob').value = item.jobTitle || '';
            document.getElementById('aLinkedin').value = item.linkedinProfile || '';
            document.getElementById('alumniAboutInput').value = item.about || '';
            document.getElementById('alumniFormTitle').innerHTML = '<i class="fa-solid fa-pen" style="color:#6d28d9;"></i> Edit Alumni Profile';
            document.getElementById('alumniSubmitLabel').textContent = 'Save Changes';
            document.getElementById('alumniSubmitBtn').style.background = '#6d28d9';
            document.getElementById('alumniSubmitBtn').onmouseenter = () => document.getElementById('alumniSubmitBtn').style.background = '#4c1d95';
            document.getElementById('alumniSubmitBtn').onmouseleave = () => document.getElementById('alumniSubmitBtn').style.background = '#6d28d9';
            document.getElementById('alumniCancelEditBtn').style.display = 'block';
            document.getElementById('alumniPostForm').scrollIntoView({ behavior: 'smooth', block: 'start' });
            // Highlight edited row
            document.querySelectorAll('.alumni-post-row-item').forEach(r => r.style.background = '');
            const row = sidelist.querySelector(`.alumni-post-row-item[data-id="${id}"]`);
            if (row) row.style.background = '#ede9fe';
          });
        });

        // Delete button handlers
        sidelist.querySelectorAll('.alumni-row-btn.del').forEach(btn => {
          btn.addEventListener('click', async () => {
            const id = btn.dataset.id;
            const item = allAlumniData.find(a => a._id === id);
            const name = item?.name || item?.user?.name || 'this alumni';
            if (!confirm(`Remove ${name} from Alumni Excellence?`)) return;
            try {
              const token = user.token || localStorage.getItem('token') || '';
              const res = await fetch(`${apiBase}/api/alumni/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
              });
              if (res.ok) { loadPostSidelist(); }
              else alert('Failed to remove alumni profile.');
            } catch { alert('Deletion failed.'); }
          });
        });
      };

      // Cancel edit
      document.getElementById('alumniCancelEditBtn')?.addEventListener('click', () => {
        isEditMode = false;
        document.getElementById('alumniEditId').value = '';
        document.getElementById('alumniPostForm').reset();
        document.getElementById('alumniFormTitle').innerHTML = '<i class="fa-solid fa-graduation-cap" style="color:#d97706;"></i> Add Alumni Profile';
        document.getElementById('alumniSubmitLabel').textContent = 'Publish Profile';
        document.getElementById('alumniSubmitBtn').style.background = '#d97706';
        document.getElementById('alumniSubmitBtn').onmouseenter = () => document.getElementById('alumniSubmitBtn').style.background = '#b45309';
        document.getElementById('alumniSubmitBtn').onmouseleave = () => document.getElementById('alumniSubmitBtn').style.background = '#d97706';
        document.getElementById('alumniCancelEditBtn').style.display = 'none';
        document.getElementById('alumniAiTag').style.display = 'none';
        document.querySelectorAll('.alumni-post-row-item').forEach(r => r.style.background = '');
      });

      // AI Draft Quote
      document.getElementById('alumniAiDraftBtn')?.addEventListener('click', async () => {
        const btn = document.getElementById('alumniAiDraftBtn');
        const label = document.getElementById('alumniAiDraftBtnLabel');
        const aboutInput = document.getElementById('alumniAboutInput');
        const aiTag = document.getElementById('alumniAiTag');
        const nameVal = document.getElementById('aName')?.value?.trim();
        const companyVal = document.getElementById('aCompany')?.value?.trim();
        const jobVal = document.getElementById('aJob')?.value?.trim();

        let promptContext = 'an outstanding alumni';
        if (nameVal) promptContext = nameVal;
        if (jobVal && companyVal) promptContext += `, who is a ${jobVal} at ${companyVal}`;
        else if (companyVal) promptContext += `, working at ${companyVal}`;

        btn.disabled = true;
        btn.classList.add('loading');
        if (label) label.textContent = 'Generating quote…';

        try {
          const token = user.token || localStorage.getItem('token') || '';
          const res = await fetch(`${apiBase}/api/ai/generate-leader-message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ prompt: `Write a short inspiring quote from ${promptContext} for their college alumni profile. Make it motivational for current students. Max 2 sentences.` })
          });
          if (!res.ok) throw new Error('AI failed');
          const data = await res.json();
          if (aboutInput && data.message) {
            aboutInput.value = data.message;
            aboutInput.style.borderColor = '#d97706';
            setTimeout(() => { aboutInput.style.borderColor = '#cbd5e1'; }, 1500);
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

      // Submit Form (Add or Edit)
      document.getElementById('alumniPostForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const token = user.token || localStorage.getItem('token') || '';
        const editId = document.getElementById('alumniEditId').value;

        const payload = {
          name: document.getElementById('aName').value,
          graduationYear: parseInt(document.getElementById('aYear').value) || null,
          degree: document.getElementById('aDegree').value,
          department: document.getElementById('aDept').value,
          currentCompany: document.getElementById('aCompany').value,
          jobTitle: document.getElementById('aJob').value,
          linkedinProfile: document.getElementById('aLinkedin').value,
          about: document.getElementById('alumniAboutInput').value,
        };

        const isEdit = !!editId;
        try {
          const res = await fetch(
            isEdit ? `${apiBase}/api/alumni/${editId}` : `${apiBase}/api/alumni`,
            {
              method: isEdit ? 'PUT' : 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify(payload)
            }
          );
          if (res.ok) {
            // Reset to add mode
            isEditMode = false;
            document.getElementById('alumniEditId').value = '';
            form.reset();
            document.getElementById('alumniFormTitle').innerHTML = '<i class="fa-solid fa-graduation-cap" style="color:#d97706;"></i> Add Alumni Profile';
            document.getElementById('alumniSubmitLabel').textContent = 'Publish Profile';
            document.getElementById('alumniSubmitBtn').style.background = '#d97706';
            document.getElementById('alumniCancelEditBtn').style.display = 'none';
            document.getElementById('alumniAiTag').style.display = 'none';
            loadPostSidelist(); // Refresh right panel
          } else {
            const err = await res.json().catch(() => ({}));
            alert(err.message || `Failed to ${isEdit ? 'update' : 'publish'}. Please ensure the server is running.`);
          }
        } catch (error) {
          alert('Submission failed. Check network or server connection.');
        }
      });

      loadPostSidelist();

    } else {
      // --- VIEW MODE ---
      content(`
        <style>
          #alumniGrid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 24px;
            align-items: start;
            margin-top: 10px;
          }
          .alumni-card {
            background: white;
            border-radius: 20px;
            padding: 24px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.02);
            border: 1px solid #e2e8f0;
            position: relative;
            transition: all 0.3s ease;
            display: flex;
            flex-direction: column;
            gap: 14px;
            min-height: 220px;
            box-sizing: border-box;
          }
          .alumni-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 16px 36px rgba(217,119,6,0.1);
            border-color: rgba(217,119,6,0.25);
          }
          .alumni-avatar-wrap {
            width: 72px;
            height: 72px;
            border-radius: 50%;
            overflow: hidden;
            border: 3px solid #fef3c7;
            box-shadow: var(--shadow-sm);
            flex-shrink: 0;
          }
          .alumni-avatar-wrap img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .alumni-card-edit-btn:hover { background: #6d28d9 !important; color: white !important; transform: scale(1.1); }
          .alumni-card-delete-btn:hover { background: #ef4444 !important; color: white !important; transform: scale(1.1); }
          .alumni-linkedin-btn:hover {
            background: #bae6fd !important;
            color: #0369a1 !important;
            box-shadow: 0 4px 12px rgba(3,105,161,0.15) !important;
            transform: translateY(-1px);
          }
          .alumni-year-badge {
            display: inline-block; padding: 2px 10px;
            border-radius: 12px; font-size: 0.75rem; font-weight: 700;
            background: #fffbeb; color: #b45309; border: 1px solid #fde68a;
          }
        </style>

        <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 28px;">
          <button type="button" id="alumniViewBackBtn" style="background: #f8fafc; border: 1px solid #e2e8f0; font-size: 1.1rem; color: #475569; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 42px; height: 42px; border-radius: 50%; transition: all 0.2s;" onmouseenter="this.style.background='#e2e8f0';" onmouseleave="this.style.background='#f8fafc';">
            <i class="fa-solid fa-arrow-left"></i>
          </button>
          <div>
            <h2 style="margin: 0; font-size: 1.6rem; font-weight: 800; color: #1e1b4b; font-family: 'Poppins', sans-serif;">Alumni Excellence</h2>
            <p style="margin: 4px 0 0 0; font-size: 0.9rem; color: #64748b;">Inspiring alumni stories, placements, awards, and institutional pride.</p>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; width: 100%;">
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <select id="alumniDeptFilter" style="padding: 10px 18px; border-radius: 12px; border: 1px solid #cbd5e1; font-size: 0.9rem; outline: none; background: white; cursor: pointer; font-weight: 600; color: #475569; box-shadow: var(--shadow-sm);">
              <option value="all">All Departments</option>
              <option value="cse">CSE</option>
              <option value="ece">ECE</option>
              <option value="mechanical">Mechanical</option>
              <option value="civil">Civil</option>
              <option value="it">IT</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div style="position: relative;">
            <input type="text" id="alumniSearchInput" placeholder="Search by name, company, role..." style="padding: 10px 18px 10px 38px; border-radius: 12px; border: 1px solid #cbd5e1; font-size: 0.9rem; outline: none; width: 260px; background: white; box-shadow: var(--shadow-sm);">
            <i class="fa-solid fa-search" style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #94a3b8;"></i>
          </div>
        </div>

        <div id="alumniGrid">
          <div style="text-align: center; padding: 40px; color: #64748b; grid-column: 1 / -1;">
            <i class="fa-solid fa-spinner fa-spin" style="font-size: 1.5rem; margin-bottom: 8px;"></i>
            <div>Loading alumni profiles...</div>
          </div>
        </div>
      `);

      document.getElementById('alumniViewBackBtn')?.addEventListener('click', goToDashboard);

      let loadedAlumni = [];

      const loadAlumni = async () => {
        try {
          const token = user.token || localStorage.getItem('token') || '';
          const res = await fetch(`${apiBase}/api/alumni`, token ? { headers: { Authorization: `Bearer ${token}` } } : {});
          if (!res.ok) throw new Error();
          const data = await res.json();
          loadedAlumni = Array.isArray(data) ? data : [];
          renderFilteredAlumni();
        } catch (error) {
          const grid = document.getElementById('alumniGrid');
          if (grid) grid.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; background: #fff; border-radius: 16px; border: 1px solid #e2e8f0; color: #ef4444; grid-column: 1 / -1;">
              <i class="fa-solid fa-triangle-exclamation" style="font-size: 2.5rem; margin-bottom: 12px;"></i>
              <div style="font-size: 1rem; font-weight: 600;">Unable to load alumni profiles.</div>
              <div style="font-size: 0.85rem; color: #94a3b8; margin-top: 4px;">Please ensure the server is running.</div>
            </div>`;
        }
      };

      const renderFilteredAlumni = () => {
        const grid = document.getElementById('alumniGrid');
        if (!grid) return;

        const deptFilter = document.getElementById('alumniDeptFilter')?.value || 'all';
        const searchVal = document.getElementById('alumniSearchInput')?.value?.toLowerCase() || '';

        let filtered = [...loadedAlumni];

        if (deptFilter !== 'all') {
          filtered = filtered.filter(item => {
            const dept = (item.department || '').toLowerCase();
            return dept.includes(deptFilter);
          });
        }

        if (searchVal) {
          filtered = filtered.filter(item => {
            const name = (item.name || item.user?.name || '').toLowerCase();
            const company = (item.currentCompany || '').toLowerCase();
            const job = (item.jobTitle || '').toLowerCase();
            const dept = (item.department || '').toLowerCase();
            const about = (item.about || '').toLowerCase();
            return name.includes(searchVal) || company.includes(searchVal) || job.includes(searchVal) || dept.includes(searchVal) || about.includes(searchVal);
          });
        }

        if (filtered.length === 0) {
          grid.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; background: #fff; border-radius: 16px; border: 1px solid #e2e8f0; color: #64748b; grid-column: 1 / -1;">
              <i class="fa-regular fa-folder-open" style="font-size: 2.5rem; margin-bottom: 12px; color: #94a3b8;"></i>
              <div style="font-size: 1.05rem; font-weight: 600;">No alumni profiles found</div>
              <div style="font-size: 0.85rem; margin-top: 4px; color: #94a3b8;">Try a different filter or search term.</div>
            </div>`;
          return;
        }

        const actionButtonsFn = (id) => isAuthority ? `
          <div style="position: absolute; top: 16px; right: 16px; display: flex; gap: 8px; z-index: 10;">
            <button type="button" class="alumni-card-edit-btn" data-id="${id}" title="Edit Profile" style="background: #f5f3ff; color: #6d28d9; border: 1px solid #ddd6fe; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; font-size: 0.85rem;">
              <i class="fa-solid fa-pen"></i>
            </button>
            <button type="button" class="alumni-card-delete-btn" data-id="${id}" title="Remove Profile" style="background: #fee2e2; color: #ef4444; border: 1px solid #fca5a5; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; font-size: 0.85rem;">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>` : '';

        grid.innerHTML = filtered.map(item => {
          const name = item.name || item.user?.name || 'Alumni';
          const avatarSrc = item.image
            ? (item.image.startsWith('http') ? item.image : `${apiBase}${item.image}`)
            : `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=d97706&color=fff&rounded=true&bold=true`;

          const linkedinBtnHtml = item.linkedinProfile ? `
            <div style="margin-top: 4px;">
              <a href="${formatExternalLink(item.linkedinProfile)}" target="_blank" rel="noopener" class="alumni-linkedin-btn" style="display: inline-flex; align-items: center; gap: 8px; background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; padding: 8px 16px; border-radius: 12px; font-weight: 700; text-decoration: none; font-size: 0.82rem; transition: all 0.2s; box-shadow: 0 2px 4px rgba(3,105,161,0.04); width: 100%; justify-content: center; box-sizing: border-box;">
                <i class="fa-brands fa-linkedin" style="font-size: 1.05rem; color: #0a66c2;"></i>
                Connect on LinkedIn
              </a>
            </div>` : '';

          return `
            <div class="alumni-card">
              ${actionButtonsFn(item._id)}
              <div style="display: flex; gap: 16px; align-items: center;">
                <div class="alumni-avatar-wrap">
                  <img src="${avatarSrc}" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=d97706&color=fff&rounded=true&bold=true';" alt="${esc(name)}">
                </div>
                <div style="overflow: hidden; min-width: 0;">
                  <span class="alumni-year-badge">${item.graduationYear || 'Alumni'}</span>
                  <h3 style="margin: 4px 0 0 0; font-size: 1.1rem; font-weight: 700; color: #1e1b4b; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;">${esc(name)}</h3>
                  <p style="margin: 2px 0 0 0; font-size: 0.8rem; color: #64748b; font-weight: 500; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;">${esc(item.degree || '')}${item.department ? ` · ${esc(item.department)}` : ''}</p>
                </div>
              </div>

              <div style="display: flex; flex-direction: column; gap: 8px; font-size: 0.82rem; color: #475569; background: #fffbeb; padding: 12px; border-radius: 12px; border: 1px solid #fde68a;">
                ${item.jobTitle ? `<div><i class="fa-solid fa-briefcase" style="width: 18px; color: #d97706;"></i> <strong>${esc(item.jobTitle)}</strong></div>` : ''}
                ${item.currentCompany ? `<div><i class="fa-solid fa-building" style="width: 18px; color: #d97706;"></i> ${esc(item.currentCompany)}</div>` : ''}
              </div>

              ${linkedinBtnHtml}

              ${item.about ? `
                <div style="font-size: 0.85rem; color: #475569; font-style: italic; line-height: 1.5; border-top: 1px dashed #e2e8f0; padding-top: 12px; display: flex; gap: 6px; margin-top: auto;">
                  <i class="fa-solid fa-quote-left" style="color: #fbbf24; font-size: 0.9rem; flex-shrink: 0; margin-top: 2px;"></i>
                  <span>"${esc(item.about)}"</span>
                </div>` : ''}
            </div>
          `;
        }).join('');

        if (isAuthority) {
          grid.querySelectorAll('.alumni-card-delete-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
              e.stopPropagation();
              const id = btn.dataset.id;
              if (confirm('Are you sure you want to remove this alumni profile?')) {
                try {
                  const token = user.token || localStorage.getItem('token') || '';
                  const res = await fetch(`${apiBase}/api/alumni/${id}`, {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${token}` }
                  });
                  if (res.ok) { alert('Alumni profile removed.'); loadAlumni(); }
                  else alert('Failed to remove alumni profile.');
                } catch { alert('Deletion failed.'); }
              }
            });
          });

          grid.querySelectorAll('.alumni-card-edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
              e.stopPropagation();
              const id = btn.dataset.id;
              window.location.href = `post.html?edit=${id}`;
            });
          });
        }
      };

      document.getElementById('alumniDeptFilter')?.addEventListener('change', renderFilteredAlumni);
      document.getElementById('alumniSearchInput')?.addEventListener('input', renderFilteredAlumni);

      loadAlumni();
    }
  }

  async function renderAchievementsPage(info) {
    const userRole = (user.role || 'guest').toLowerCase();
    const isAuthority = ['principal', 'admin', 'dean', 'hod'].includes(userRole);
    const mode = cfg.mode || 'view';
    const isPostMode = mode === 'post';

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
          <p>Only HODs and administrators can post achievements.</p>
        </div>
      `);
      return;
    }

    if (isPostMode) {
      content(`
        <style>
          @keyframes achiev-ai-pulse {
            0%, 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.3); }
            50% { box-shadow: 0 0 0 8px rgba(16,185,129,0); }
          }
          .achiev-ai-btn {
            display: flex; align-items: center; gap: 8px;
            padding: 10px 18px; border-radius: 10px;
            border: 1.5px solid #10b981; background: #ecfdf5;
            color: #065f46; font-weight: 600; font-size: 0.88rem;
            cursor: pointer; transition: all 0.22s; width: 100%;
            justify-content: center;
          }
          .achiev-ai-btn:hover:not(:disabled) {
            background: #10b981; color: white;
            box-shadow: 0 4px 16px rgba(16,185,129,0.25);
            transform: translateY(-1px);
          }
          .achiev-ai-btn:disabled { opacity: 0.65; cursor: not-allowed; }
          .achiev-ai-btn.loading { animation: achiev-ai-pulse 1.4s infinite; }
          #achievPostLayout {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 28px;
            align-items: start;
          }
          @media (max-width: 1100px) {
            #achievPostLayout { grid-template-columns: 1fr; }
          }
          .achiev-post-row-item {
            display: flex; gap: 14px; padding: 16px 18px; border-radius: 12px;
            border: 1px solid #f1f5f9; background: #ffffff;
            transition: all 0.2s; position: relative; align-items: flex-start;
            margin-bottom: 8px; box-sizing: border-box;
          }
          .achiev-post-row-item:hover {
            border-color: #6ee7b7; background: #ecfdf5;
            box-shadow: 0 4px 12px rgba(16,185,129,0.08);
          }
          .achiev-row-btn {
            border: none; border-radius: 8px;
            width: 32px; height: 32px;
            display: flex; align-items: center; justify-content: center;
            cursor: pointer; font-size: 0.8rem; transition: all 0.18s;
          }
          .achiev-row-btn.edit { background: #ede9fe; color: #6d28d9; }
          .achiev-row-btn.edit:hover { background: #6d28d9; color: white; }
          .achiev-row-btn.del { background: #fee2e2; color: #ef4444; }
          .achiev-row-btn.del:hover { background: #ef4444; color: white; }
          #achievBackBtn { background: #f8fafc; border: 1px solid #e2e8f0; font-size: 1.1rem; color: #475569; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 42px; height: 42px; border-radius: 50%; transition: all 0.2s; }
          #achievBackBtn:hover { background: #e2e8f0; }
          .achiev-form-input { padding: 9px 12px; border-radius: 10px; border: 1px solid #cbd5e1; outline: none; font-size: 0.88rem; width: 100%; box-sizing: border-box; }
          .achiev-form-input:focus { border-color: #10b981; }
          select.achiev-form-input { background: white; }
          textarea.achiev-form-input { font-family: inherit; }
          #achievSubmitBtn { flex: 1; background: #10b981; color: white; border: none; padding: 11px 18px; border-radius: 10px; font-weight: 700; font-size: 0.92rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s; }
          #achievSubmitBtn:hover:not(:disabled) { background: #065f46; }
          #achievSubmitBtn.achiev-submit-editing { background: #6d28d9; }
          #achievSubmitBtn.achiev-submit-editing:hover:not(:disabled) { background: #4c1d95; }
          #achievCancelEditBtn { padding: 11px 14px; border-radius: 10px; border: 1px solid #cbd5e1; background: #f8fafc; color: #475569; font-weight: 600; font-size: 0.88rem; cursor: pointer; transition: all 0.2s; }
          #achievCancelEditBtn:hover { background: #e2e8f0; }
          .achiev-view-all-link { font-size: 0.82rem; font-weight: 600; color: #10b981; text-decoration: none; display: flex; align-items: center; gap: 5px; padding: 5px 10px; border-radius: 8px; border: 1px solid #6ee7b7; background: #ecfdf5; transition: all 0.2s; }
          .achiev-view-all-link:hover { background: #d1fae5; }
        </style>

        <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 28px;">
          <button type="button" id="achievBackBtn">
            <i class="fa-solid fa-arrow-left"></i>
          </button>
          <div>
            <h2 style="margin: 0; font-size: 1.6rem; font-weight: 800; color: #1e1b4b; font-family: 'Poppins', sans-serif;">Achievements</h2>
            <p style="margin: 4px 0 0 0; font-size: 0.9rem; color: #64748b;">Manage achievements — add new entries or edit existing ones.</p>
          </div>
        </div>

        <div id="achievPostLayout">

          <!-- LEFT: Post / Edit Form -->
          <div class="section-card module-panel" style="padding: 28px; border-radius: 16px; background: white; border: 1px solid var(--border-color); box-shadow: var(--shadow-sm);">
            <h3 id="achievFormTitle" style="margin-top: 0; margin-bottom: 20px; font-size: 1.2rem; font-weight: 700; color: #1e1b4b; display: flex; align-items: center; gap: 10px;">
              <i class="fa-solid fa-trophy" style="color: #10b981;"></i> Add Achievement
            </h3>
            <form id="achievPostForm" style="display: flex; flex-direction: column; gap: 16px;">
              <input type="hidden" id="achievEditId" value="">

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
                <div style="display: flex; flex-direction: column; gap: 5px;">
                  <label style="font-size: 0.82rem; font-weight: 600; color: #475569;">Title</label>
                  <input type="text" name="title" id="achTitle" placeholder="e.g. Best Research Paper" required class="achiev-form-input">
                </div>
                <div style="display: flex; flex-direction: column; gap: 5px;">
                  <label style="font-size: 0.82rem; font-weight: 600; color: #475569;">Category</label>
                  <select name="category" id="achCategory" required class="achiev-form-input">
                    <option value="">Select Category</option>
                    <option value="academic">Academic</option>
                    <option value="sports">Sports</option>
                    <option value="research">Research</option>
                    <option value="cultural">Cultural</option>
                    <option value="placement">Placement</option>
                    <option value="award">Award</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
                <div style="display: flex; flex-direction: column; gap: 5px;">
                  <label style="font-size: 0.82rem; font-weight: 600; color: #475569;">Year</label>
                  <input type="number" name="year" id="achYear" placeholder="${new Date().getFullYear()}" min="2000" max="${new Date().getFullYear() + 1}" class="achiev-form-input">
                </div>
                <div style="display: flex; flex-direction: column; gap: 5px;">
                  <label style="font-size: 0.82rem; font-weight: 600; color: #475569;">Priority <span style="color:#94a3b8; font-weight:400;">(lower = shown first)</span></label>
                  <input type="number" name="priority" id="achPriority" placeholder="10" min="1" max="100" class="achiev-form-input">
                </div>
              </div>

              <div style="display: flex; flex-direction: column; gap: 5px;">
                <label style="font-size: 0.82rem; font-weight: 600; color: #475569; display: flex; align-items: center; justify-content: space-between;">
                  <span>Description</span>
                  <span id="achievAiTag" style="display:none; font-size:0.72rem; color:#065f46; font-weight:600; background:#ecfdf5; padding:2px 8px; border-radius:6px;"><i class="fa-solid fa-wand-magic-sparkles"></i> AI Drafted</span>
                </label>
                <button type="button" id="achievAiDraftBtn" class="achiev-ai-btn" style="margin-bottom: 6px;">
                  <i class="fa-solid fa-wand-magic-sparkles"></i>
                  <span id="achievAiDraftBtnLabel">Draft Description with AI</span>
                </button>
                <textarea name="description" id="achievDescInput" rows="3" placeholder="Describe the achievement in detail..." required class="achiev-form-input"></textarea>
              </div>

              <div style="display: flex; gap: 10px; margin-top: 4px;">
                <button type="submit" id="achievSubmitBtn">
                  <i class="fa-solid fa-paper-plane"></i> <span id="achievSubmitLabel">Publish Achievement</span>
                </button>
                <button type="button" id="achievCancelEditBtn" style="display:none;">
                  Cancel
                </button>
              </div>
            </form>
          </div>

          <!-- RIGHT: Achievements List -->
          <div style="display: flex; flex-direction: column; gap: 16px;">
            <div style="background: white; border-radius: 16px; border: 1px solid var(--border-color); box-shadow: var(--shadow-sm); overflow: hidden;">
              <div style="padding: 18px 20px 14px; border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; justify-content: space-between;">
                <h3 style="margin: 0; font-size: 1rem; font-weight: 700; color: #1e1b4b; display: flex; align-items: center; gap: 8px;">
                  <i class="fa-solid fa-trophy" style="color: #10b981;"></i> All Achievements
                  <span id="achievCountBadge" style="font-size: 0.72rem; background: #ecfdf5; color: #065f46; border: 1px solid #6ee7b7; border-radius: 20px; padding: 2px 8px; font-weight: 700;"></span>
                </h3>
                <a href="view.html" class="achiev-view-all-link">
                  View All <i class="fa-solid fa-arrow-up-right-from-square" style="font-size: 0.7rem;"></i>
                </a>
              </div>
              <div id="achievPostSidelist" style="max-height: none; overflow-y: hidden; padding: 10px 12px; display: flex; flex-direction: column; gap: 6px;">
                <div style="text-align: center; padding: 24px; color: #94a3b8; font-size: 0.88rem;">
                  <i class="fa-solid fa-spinner fa-spin" style="font-size: 1.2rem; margin-bottom: 6px; display: block;"></i>
                  Loading achievements...
                </div>
              </div>
            </div>
          </div>

        </div>
      `);

      document.getElementById('achievBackBtn')?.addEventListener('click', goToDashboard);

      let allAchievData = [];
      let isEditMode = false;

      const categoryMeta = {
        academic:  { icon: 'fa-book-open', color: '#4f46e5', bg: '#e0e7ff' },
        sports:    { icon: 'fa-person-running', color: '#ea580c', bg: '#ffedd5' },
        research:  { icon: 'fa-flask', color: '#7c3aed', bg: '#ede9fe' },
        cultural:  { icon: 'fa-masks-theater', color: '#db2777', bg: '#fce7f3' },
        placement: { icon: 'fa-briefcase', color: '#0369a1', bg: '#e0f2fe' },
        award:     { icon: 'fa-award', color: '#d97706', bg: '#fef3c7' },
        other:     { icon: 'fa-star', color: '#475569', bg: '#f1f5f9' },
      };

      const loadPostSidelist = async () => {
        const sidelist = document.getElementById('achievPostSidelist');
        const countBadge = document.getElementById('achievCountBadge');
        if (!sidelist) return;
        try {
          const token = user.token || localStorage.getItem('token') || '';
          const res = await fetch(`${apiBase}/api/achievements`, token ? { headers: { Authorization: `Bearer ${token}` } } : {});
          if (!res.ok) throw new Error();
          const data = await res.json();
          allAchievData = Array.isArray(data) ? data : [];
          if (countBadge) countBadge.textContent = allAchievData.length;
          renderSidelist();
        } catch {
          sidelist.innerHTML = `<div style="text-align:center; padding:20px; color:#94a3b8; font-size:0.85rem;">Could not load achievements.</div>`;
        }
      };

      const renderSidelist = () => {
        const sidelist = document.getElementById('achievPostSidelist');
        if (!sidelist) return;
        if (!allAchievData.length) {
          sidelist.innerHTML = `<div style="text-align:center; padding:24px; color:#94a3b8; font-size:0.85rem;"><i class="fa-regular fa-folder-open" style="font-size:1.5rem; display:block; margin-bottom:8px;"></i>No achievements yet.</div>`;
          return;
        }
        sidelist.innerHTML = allAchievData.slice(0, 5).map(item => {
          const cat = (item.category || 'other').toLowerCase();
          const meta = categoryMeta[cat] || categoryMeta.other;
          const statusColors = { approved: { bg: '#dcfce7', color: '#166534' }, pending: { bg: '#fef9c3', color: '#92400e' }, rejected: { bg: '#fee2e2', color: '#991b1b' } };
          const sc = statusColors[item.status] || statusColors.pending;
          return `
            <div class="achiev-post-row-item" data-id="${item._id}">
              <div style="width:38px; height:38px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:1rem; flex-shrink:0; background:${meta.bg}; color:${meta.color};">
                <i class="fa-solid ${meta.icon}"></i>
              </div>
              <div style="min-width:0; flex:1; overflow:hidden; display:flex; flex-direction:column; gap:3px;">
                <div style="font-size:0.9rem; font-weight:700; color:#1e1b4b; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${esc(item.title || 'Untitled')}</div>
                <div style="display:flex; gap:6px; align-items:center; flex-wrap:wrap;">
                  <span style="font-size:0.72rem; font-weight:700; text-transform:uppercase; color:${meta.color};">${cat}</span>
                  <span style="font-size:0.72rem; color:#94a3b8;">${item.year || ''}</span>
                  <span style="font-size:0.7rem; font-weight:700; padding:1px 7px; border-radius:10px; background:${sc.bg}; color:${sc.color};">${item.status || 'pending'}</span>
                </div>
              </div>
              <div style="display:flex; gap:6px; margin-left:auto; flex-shrink:0; align-self:center;">
                <button type="button" class="achiev-row-btn edit" data-id="${item._id}" title="Edit"><i class="fa-solid fa-pen"></i></button>
                <button type="button" class="achiev-row-btn del" data-id="${item._id}" title="Delete"><i class="fa-solid fa-trash"></i></button>
              </div>
            </div>`;
        }).join('');

        sidelist.querySelectorAll('.achiev-row-btn.edit').forEach(btn => {
          btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            const item = allAchievData.find(a => a._id === id);
            if (!item) return;
            isEditMode = true;
            document.getElementById('achievEditId').value = id;
            document.getElementById('achTitle').value = item.title || '';
            document.getElementById('achCategory').value = item.category || '';
            document.getElementById('achYear').value = item.year || '';
            document.getElementById('achPriority').value = item.priority || '';
            document.getElementById('achievDescInput').value = item.description || '';
            document.getElementById('achievFormTitle').innerHTML = '<i class="fa-solid fa-pen" style="color:#6d28d9;"></i> Edit Achievement';
            document.getElementById('achievSubmitLabel').textContent = 'Save Changes';
            document.getElementById('achievSubmitBtn').classList.add('achiev-submit-editing');
            document.getElementById('achievSubmitBtn').style.background = '';
            document.getElementById('achievCancelEditBtn').style.display = 'block';
            document.getElementById('achievPostForm').scrollIntoView({ behavior: 'smooth', block: 'start' });
            document.querySelectorAll('.achiev-post-row-item').forEach(r => r.style.background = '');
            const row = sidelist.querySelector(`.achiev-post-row-item[data-id="${id}"]`);
            if (row) row.style.background = '#ede9fe';
          });
        });

        sidelist.querySelectorAll('.achiev-row-btn.del').forEach(btn => {
          btn.addEventListener('click', async () => {
            const id = btn.dataset.id;
            const item = allAchievData.find(a => a._id === id);
            const title = item?.title || 'this achievement';
            if (!confirm(`Remove "${title}"?`)) return;
            try {
              const token = user.token || localStorage.getItem('token') || '';
              const res = await fetch(`${apiBase}/api/achievements/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
              });
              if (res.ok) { loadPostSidelist(); }
              else alert('Failed to remove achievement.');
            } catch { alert('Deletion failed.'); }
          });
        });
      };

      document.getElementById('achievCancelEditBtn')?.addEventListener('click', () => {
        isEditMode = false;
        document.getElementById('achievEditId').value = '';
        document.getElementById('achievPostForm').reset();
        document.getElementById('achievSubmitBtn').classList.remove('achiev-submit-editing');
        document.getElementById('achievSubmitBtn').style.background = '';
        document.getElementById('achievCancelEditBtn').style.display = 'none';
        document.getElementById('achievAiTag').style.display = 'none';
        document.querySelectorAll('.achiev-post-row-item').forEach(r => r.style.background = '');
      });

      document.getElementById('achievAiDraftBtn')?.addEventListener('click', async () => {
        const btn = document.getElementById('achievAiDraftBtn');
        const label = document.getElementById('achievAiDraftBtnLabel');
        const descInput = document.getElementById('achievDescInput');
        const aiTag = document.getElementById('achievAiTag');
        const titleVal = document.getElementById('achTitle')?.value?.trim();
        const catVal = document.getElementById('achCategory')?.value;
        if (!titleVal) {
          document.getElementById('achTitle')?.focus();
          return;
        }
        btn.disabled = true;
        btn.classList.add('loading');
        if (label) label.textContent = 'Generating…';
        try {
          const token = user.token || localStorage.getItem('token') || '';
          const res = await fetch(`${apiBase}/api/ai/generate-leader-message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ prompt: `Write a concise, inspiring description (2-3 sentences) for a college achievement titled "${titleVal}"${catVal ? ` in the ${catVal} category` : ''}. Make it suitable for a college achievement board.` })
          });
          if (!res.ok) throw new Error('AI failed');
          const data = await res.json();
          if (descInput && data.message) {
            descInput.value = data.message;
            descInput.style.borderColor = '#10b981';
            setTimeout(() => { descInput.style.borderColor = '#cbd5e1'; }, 1500);
          }
          if (aiTag) aiTag.style.display = 'inline-flex';
        } catch (err) {
          alert('AI drafting failed. Please write the description manually.');
        } finally {
          btn.disabled = false;
          btn.classList.remove('loading');
          if (label) label.textContent = 'Draft Description with AI';
        }
      });

      document.getElementById('achievPostForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const submitBtn = document.getElementById('achievSubmitBtn');
        const submitLabel = document.getElementById('achievSubmitLabel');
        const token = user.token || localStorage.getItem('token') || '';
        const editId = document.getElementById('achievEditId').value;
        const payload = {
          title: document.getElementById('achTitle').value,
          category: document.getElementById('achCategory').value,
          year: parseInt(document.getElementById('achYear').value) || new Date().getFullYear(),
          priority: parseInt(document.getElementById('achPriority').value) || 10,
          description: document.getElementById('achievDescInput').value,
        };
        const isEdit = !!editId;

        // Show loading state
        if (submitBtn) submitBtn.disabled = true;
        if (submitLabel) submitLabel.textContent = isEdit ? 'Saving…' : 'Publishing…';

        try {
          const res = await fetch(
            isEdit ? `${apiBase}/api/achievements/${editId}` : `${apiBase}/api/achievements`,
            {
              method: isEdit ? 'PUT' : 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify(payload)
            }
          );
          if (res.ok) {
            isEditMode = false;
            document.getElementById('achievEditId').value = '';
            form.reset();
            document.getElementById('achievFormTitle').innerHTML = '<i class="fa-solid fa-trophy" style="color:#10b981;"></i> Add Achievement';
            document.getElementById('achievSubmitBtn').classList.remove('achiev-submit-editing');
            document.getElementById('achievSubmitBtn').style.background = '';
            document.getElementById('achievCancelEditBtn').style.display = 'none';
            document.getElementById('achievAiTag').style.display = 'none';
            alert(isEdit ? 'Achievement updated successfully!' : 'Achievement published successfully!');
            loadPostSidelist();
          } else {
            const err = await res.json().catch(() => ({}));
            console.error('Achievement save error:', res.status, err);
            alert(`Error ${res.status}: ${err.message || `Failed to ${isEdit ? 'update' : 'publish'}. Please restart the server.`}`);
          }
        } catch (error) {
          console.error('Achievement submit network error:', error);
          alert('Submission failed — could not reach the server.');
        } finally {
          if (submitBtn) submitBtn.disabled = false;
          if (submitLabel) submitLabel.textContent = isEdit ? 'Save Changes' : 'Publish Achievement';
        }
      });

      loadPostSidelist();

    } else {
      // --- VIEW MODE ---
      content(`
        <style>
          #achievGrid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 24px;
            align-items: start;
            margin-top: 10px;
          }
          .achiev-card {
            background: white;
            border-radius: 20px;
            padding: 24px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.02);
            border: 1px solid #e2e8f0;
            position: relative;
            transition: all 0.3s ease;
            display: flex;
            flex-direction: column;
            gap: 14px;
            min-height: 180px;
            box-sizing: border-box;
          }
          .achiev-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 16px 36px rgba(16,185,129,0.1);
            border-color: rgba(16,185,129,0.3);
          }
          .achiev-card-icon {
            width: 52px; height: 52px;
            border-radius: 14px;
            display: flex; align-items: center; justify-content: center;
            font-size: 1.4rem; flex-shrink: 0;
          }
          .achiev-year-badge {
            display: inline-block; padding: 2px 10px;
            border-radius: 12px; font-size: 0.75rem; font-weight: 700;
            background: #ecfdf5; color: #065f46; border: 1px solid #6ee7b7;
          }
          .achiev-card-edit-btn:hover { background: #6d28d9 !important; color: white !important; transform: scale(1.1); }
          .achiev-card-delete-btn:hover { background: #ef4444 !important; color: white !important; transform: scale(1.1); }
          #achievViewBackBtn { background: #f8fafc; border: 1px solid #e2e8f0; font-size: 1.1rem; color: #475569; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 42px; height: 42px; border-radius: 50%; transition: all 0.2s; }
          #achievViewBackBtn:hover { background: #e2e8f0; }
        </style>

        <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 28px;">
          <button type="button" id="achievViewBackBtn">
            <i class="fa-solid fa-arrow-left"></i>
          </button>
          <div>
            <h2 style="margin: 0; font-size: 1.6rem; font-weight: 800; color: #1e1b4b; font-family: 'Poppins', sans-serif;">Achievements</h2>
            <p style="margin: 4px 0 0 0; font-size: 0.9rem; color: #64748b;">Academic, research, sports, cultural, and innovation achievements in one place.</p>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; width: 100%;">
          <div id="achievFilterTabs" style="display: flex; gap: 8px; flex-wrap: wrap;">
            <button type="button" class="achiev-tab active" data-filter="all" style="padding: 8px 18px; border-radius: 20px; font-size: 0.88rem; font-weight: 600; cursor: pointer; border: none; transition: all 0.2s; background: #10b981; color: white;">All</button>
            <button type="button" class="achiev-tab" data-filter="academic" style="padding: 8px 18px; border-radius: 20px; font-size: 0.88rem; font-weight: 600; cursor: pointer; border: 1px solid #e2e8f0; transition: all 0.2s; background: #fff; color: #475569;">Academic</button>
            <button type="button" class="achiev-tab" data-filter="sports" style="padding: 8px 18px; border-radius: 20px; font-size: 0.88rem; font-weight: 600; cursor: pointer; border: 1px solid #e2e8f0; transition: all 0.2s; background: #fff; color: #475569;">Sports</button>
            <button type="button" class="achiev-tab" data-filter="research" style="padding: 8px 18px; border-radius: 20px; font-size: 0.88rem; font-weight: 600; cursor: pointer; border: 1px solid #e2e8f0; transition: all 0.2s; background: #fff; color: #475569;">Research</button>
            <button type="button" class="achiev-tab" data-filter="cultural" style="padding: 8px 18px; border-radius: 20px; font-size: 0.88rem; font-weight: 600; cursor: pointer; border: 1px solid #e2e8f0; transition: all 0.2s; background: #fff; color: #475569;">Cultural</button>
            <button type="button" class="achiev-tab" data-filter="award" style="padding: 8px 18px; border-radius: 20px; font-size: 0.88rem; font-weight: 600; cursor: pointer; border: 1px solid #e2e8f0; transition: all 0.2s; background: #fff; color: #475569;">Awards</button>
          </div>
          <div style="position: relative;">
            <input type="text" id="achievSearchInput" placeholder="Search achievements..." style="padding: 10px 18px 10px 38px; border-radius: 12px; border: 1px solid #cbd5e1; font-size: 0.9rem; outline: none; width: 240px; background: white; box-shadow: var(--shadow-sm);">
            <i class="fa-solid fa-search" style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #94a3b8;"></i>
          </div>
        </div>

        <div id="achievGrid">
          <div style="text-align: center; padding: 40px; color: #64748b; grid-column: 1 / -1;">
            <i class="fa-solid fa-spinner fa-spin" style="font-size: 1.5rem; margin-bottom: 8px;"></i>
            <div>Loading achievements...</div>
          </div>
        </div>
      `);

      document.getElementById('achievViewBackBtn')?.addEventListener('click', goToDashboard);

      const categoryMeta = {
        academic:  { icon: 'fa-book-open', color: '#4f46e5', bg: '#e0e7ff' },
        sports:    { icon: 'fa-person-running', color: '#ea580c', bg: '#ffedd5' },
        research:  { icon: 'fa-flask', color: '#7c3aed', bg: '#ede9fe' },
        cultural:  { icon: 'fa-masks-theater', color: '#db2777', bg: '#fce7f3' },
        placement: { icon: 'fa-briefcase', color: '#0369a1', bg: '#e0f2fe' },
        award:     { icon: 'fa-award', color: '#d97706', bg: '#fef3c7' },
        other:     { icon: 'fa-star', color: '#475569', bg: '#f1f5f9' },
      };

      let loadedAchievements = [];
      let activeFilter = 'all';

      const loadAchievements = async () => {
        try {
          const token = user.token || localStorage.getItem('token') || '';
          const res = await fetch(`${apiBase}/api/achievements`, token ? { headers: { Authorization: `Bearer ${token}` } } : {});
          if (!res.ok) throw new Error();
          const data = await res.json();
          loadedAchievements = Array.isArray(data) ? data : [];
          renderFilteredAchievements();
        } catch (error) {
          const grid = document.getElementById('achievGrid');
          if (grid) grid.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; background: #fff; border-radius: 16px; border: 1px solid #e2e8f0; color: #ef4444; grid-column: 1 / -1;">
              <i class="fa-solid fa-triangle-exclamation" style="font-size: 2.5rem; margin-bottom: 12px;"></i>
              <div style="font-size: 1rem; font-weight: 600;">Unable to load achievements.</div>
              <div style="font-size: 0.85rem; color: #94a3b8; margin-top: 4px;">Please ensure the server is running.</div>
            </div>`;
        }
      };

      const renderFilteredAchievements = () => {
        const grid = document.getElementById('achievGrid');
        if (!grid) return;

        const searchVal = document.getElementById('achievSearchInput')?.value?.toLowerCase() || '';
        let filtered = [...loadedAchievements];

        if (activeFilter !== 'all') {
          filtered = filtered.filter(item => (item.category || '').toLowerCase() === activeFilter);
        }
        if (searchVal) {
          filtered = filtered.filter(item => {
            return (item.title || '').toLowerCase().includes(searchVal)
              || (item.description || '').toLowerCase().includes(searchVal)
              || (item.category || '').toLowerCase().includes(searchVal);
          });
        }
        // Sort by priority then year
        filtered.sort((a, b) => (a.priority || 10) - (b.priority || 10) || (b.year || 0) - (a.year || 0));

        if (filtered.length === 0) {
          grid.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; background: #fff; border-radius: 16px; border: 1px solid #e2e8f0; color: #64748b; grid-column: 1 / -1;">
              <i class="fa-regular fa-folder-open" style="font-size: 2.5rem; margin-bottom: 12px; color: #94a3b8;"></i>
              <div style="font-size: 1.05rem; font-weight: 600;">No achievements found</div>
              <div style="font-size: 0.85rem; margin-top: 4px; color: #94a3b8;">Try a different filter or search term.</div>
            </div>`;
          return;
        }

        const actionButtonsFn = (id) => isAuthority ? `
          <div style="position: absolute; top: 16px; right: 16px; display: flex; gap: 8px; z-index: 10;">
            <button type="button" class="achiev-card-edit-btn" data-id="${id}" title="Edit" style="background: #f5f3ff; color: #6d28d9; border: 1px solid #ddd6fe; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; font-size: 0.85rem;">
              <i class="fa-solid fa-pen"></i>
            </button>
            <button type="button" class="achiev-card-delete-btn" data-id="${id}" title="Remove" style="background: #fee2e2; color: #ef4444; border: 1px solid #fca5a5; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; font-size: 0.85rem;">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>` : '';

        grid.innerHTML = filtered.map(item => {
          const cat = (item.category || 'other').toLowerCase();
          const meta = categoryMeta[cat] || categoryMeta.other;
          const statusColors = { approved: { bg: '#dcfce7', color: '#166534' }, pending: { bg: '#fef9c3', color: '#92400e' }, rejected: { bg: '#fee2e2', color: '#991b1b' } };
          const sc = statusColors[item.status] || statusColors.pending;

          return `
            <div class="achiev-card">
              ${actionButtonsFn(item._id)}
              <div style="display: flex; gap: 14px; align-items: flex-start;">
                <div class="achiev-card-icon" style="background: ${meta.bg}; color: ${meta.color};">
                  <i class="fa-solid ${meta.icon}"></i>
                </div>
                <div style="overflow: hidden; min-width: 0; flex: 1;">
                  <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 4px;">
                    <span class="achiev-year-badge">${item.year || 'N/A'}</span>
                    <span style="font-size: 0.7rem; font-weight: 700; text-transform: uppercase; color: ${meta.color}; background: ${meta.bg}; padding: 2px 8px; border-radius: 10px;">${cat}</span>
                    ${item.status && item.status !== 'approved' ? `<span style="font-size:0.7rem; font-weight:700; padding:2px 8px; border-radius:10px; background:${sc.bg}; color:${sc.color};">${item.status}</span>` : ''}
                  </div>
                  <h3 style="margin: 0; font-size: 1.05rem; font-weight: 700; color: #1e1b4b; line-height: 1.3; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">${esc(item.title || 'Untitled')}</h3>
                </div>
              </div>

              ${item.description ? `
                <p style="margin: 0; font-size: 0.85rem; color: #475569; line-height: 1.6; border-top: 1px dashed #e2e8f0; padding-top: 12px; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">${esc(item.description)}</p>
              ` : ''}
            </div>
          `;
        }).join('');

        if (isAuthority) {
          grid.querySelectorAll('.achiev-card-delete-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
              e.stopPropagation();
              const id = btn.dataset.id;
              if (confirm('Are you sure you want to remove this achievement?')) {
                try {
                  const token = user.token || localStorage.getItem('token') || '';
                  const res = await fetch(`${apiBase}/api/achievements/${id}`, {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${token}` }
                  });
                  if (res.ok) { loadAchievements(); }
                  else alert('Failed to remove achievement.');
                } catch { alert('Deletion failed.'); }
              }
            });
          });

          grid.querySelectorAll('.achiev-card-edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
              e.stopPropagation();
              const id = btn.dataset.id;
              window.location.href = `post.html?edit=${id}`;
            });
          });
        }
      };

      // Filter tab logic
      const tabs = document.querySelectorAll('.achiev-tab');
      tabs.forEach(tab => {
        tab.addEventListener('click', () => {
          tabs.forEach(t => {
            t.classList.remove('active');
            t.style.background = '#fff';
            t.style.border = '1px solid #e2e8f0';
            t.style.color = '#475569';
          });
          tab.classList.add('active');
          tab.style.background = '#10b981';
          tab.style.border = 'none';
          tab.style.color = '#fff';
          activeFilter = tab.dataset.filter;
          renderFilteredAchievements();
        });
      });

      document.getElementById('achievSearchInput')?.addEventListener('input', renderFilteredAchievements);

      loadAchievements();
    }
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
        <style>
          @keyframes leader-ai-pulse {
            0%, 100% { box-shadow: 0 0 0 0 rgba(107, 70, 193, 0.3); }
            50% { box-shadow: 0 0 0 8px rgba(107, 70, 193, 0); }
          }
          .leader-ai-btn {
            display: flex; align-items: center; gap: 8px;
            padding: 10px 18px; border-radius: 10px;
            border: 1.5px solid #6b46c1; background: #faf5ff;
            color: #6b46c1; font-weight: 600; font-size: 0.88rem;
            cursor: pointer; transition: all 0.22s; width: 100%;
            justify-content: center;
          }
          .leader-ai-btn:hover:not(:disabled) {
            background: #6b46c1; color: white;
            box-shadow: 0 4px 16px rgba(107, 70, 193, 0.25);
            transform: translateY(-1px);
          }
          .leader-ai-btn:disabled { opacity: 0.65; cursor: not-allowed; }
          .leader-ai-btn.loading { animation: leader-ai-pulse 1.4s infinite; }
          #leaderPostLayout {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 28px;
            align-items: start;
          }
          @media (max-width: 1100px) {
            #leaderPostLayout { grid-template-columns: 1fr; }
          }
          .leader-post-row-item {
            display: flex; gap: 14px; padding: 16px 18px; border-radius: 12px;
            border: 1px solid #f1f5f9; background: #ffffff;
            transition: all 0.2s; position: relative; align-items: flex-start;
            margin-bottom: 8px; box-sizing: border-box;
          }
          .leader-post-row-item:hover {
            border-color: #d6bcfa; background: #faf5ff;
            box-shadow: 0 4px 12px rgba(107, 70, 193, 0.08);
          }
          .leader-row-btn {
            border: none; border-radius: 8px;
            width: 32px; height: 32px;
            display: flex; align-items: center; justify-content: center;
            cursor: pointer; font-size: 0.8rem; transition: all 0.18s;
          }
          .leader-row-btn.del { background: #fee2e2; color: #ef4444; }
          .leader-row-btn.del:hover { background: #ef4444; color: white; }
          .leader-form-input { padding: 9px 12px; border-radius: 10px; border: 1px solid #cbd5e1; outline: none; font-size: 0.88rem; width: 100%; box-sizing: border-box; }
          .leader-form-input:focus { border-color: #6b46c1; }
          select.leader-form-input { background: white; }
          textarea.leader-form-input { font-family: inherit; }
          #leaderSubmitBtn { flex: 1; background: #6b46c1; color: white; border: none; padding: 11px 18px; border-radius: 10px; font-weight: 700; font-size: 0.92rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s; }
          #leaderSubmitBtn:hover:not(:disabled) { background: #55309d; }
          .leader-view-all-link { font-size: 0.82rem; font-weight: 600; color: #6b46c1; text-decoration: none; display: flex; align-items: center; gap: 5px; padding: 5px 10px; border-radius: 8px; border: 1px solid #d6bcfa; background: #faf5ff; transition: all 0.2s; }
          .leader-view-all-link:hover { background: #e9d5ff; }
        </style>
        
        <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 28px;">
          <button type="button" id="leaderBackBtn" style="background: #f8fafc; border: 1px solid #e2e8f0; font-size: 1.1rem; color: #475569; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 42px; height: 42px; border-radius: 50%; transition: all 0.2s;" onmouseenter="this.style.background='#e2e8f0';" onmouseleave="this.style.background='#f8fafc';">
            <i class="fa-solid fa-arrow-left"></i>
          </button>
          <div>
            <h2 style="margin: 0; font-size: 1.6rem; font-weight: 800; color: #1e1b4b; font-family: 'Poppins', sans-serif;">Academic Leaders</h2>
            <p style="margin: 4px 0 0 0; font-size: 0.9rem; color: #64748b;">Manage academic leaders — add new entries or delete existing ones.</p>
          </div>
        </div>

        <div id="leaderPostLayout">

          <!-- LEFT: Post / Edit Form -->
          <div class="section-card module-panel" style="padding: 28px; border-radius: 16px; background: white; border: 1px solid var(--border-color); box-shadow: var(--shadow-sm);">
            <h3 style="margin-top: 0; margin-bottom: 20px; font-size: 1.2rem; font-weight: 700; color: #1e1b4b; display: flex; align-items: center; gap: 10px;">
              <i class="fa-solid fa-user-plus" style="color: var(--primary);"></i> Add Academic Leader
            </h3>
            <form id="leaderPostForm" style="display: flex; flex-direction: column; gap: 16px;">
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
                <div style="display: flex; flex-direction: column; gap: 5px;">
                  <label style="font-size: 0.82rem; font-weight: 600; color: #475569;">Full Name</label>
                  <input type="text" name="name" placeholder="e.g. Dr. Jane Doe" required class="leader-form-input" onfocus="this.style.borderColor='#6b46c1';" onblur="this.style.borderColor='#cbd5e1';">
                </div>
                <div style="display: flex; flex-direction: column; gap: 5px;">
                  <label style="font-size: 0.82rem; font-weight: 600; color: #475569;">Role / Designation</label>
                  <select id="leaderRoleSelect" name="role" required class="leader-form-input" onfocus="this.style.borderColor='#6b46c1';" onblur="this.style.borderColor='#cbd5e1';">
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

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
                <div style="display: flex; flex-direction: column; gap: 5px;">
                  <label style="font-size: 0.82rem; font-weight: 600; color: #475569;">Department (if HOD/Prof)</label>
                  <input type="text" name="department" id="leaderDeptInput" placeholder="e.g. CSE, ECE" class="leader-form-input" onfocus="this.style.borderColor='#6b46c1';" onblur="this.style.borderColor='#cbd5e1';">
                </div>
                <div style="display: flex; flex-direction: column; gap: 5px;">
                  <label style="font-size: 0.82rem; font-weight: 600; color: #475569;">Qualification</label>
                  <input type="text" name="qualification" placeholder="e.g. Ph.D." required class="leader-form-input" onfocus="this.style.borderColor='#6b46c1';" onblur="this.style.borderColor='#cbd5e1';">
                </div>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
                <div style="display: flex; flex-direction: column; gap: 5px;">
                  <label style="font-size: 0.82rem; font-weight: 600; color: #475569;">Years of Experience</label>
                  <input type="text" name="experience" placeholder="e.g. 20 Years" class="leader-form-input" onfocus="this.style.borderColor='#6b46c1';" onblur="this.style.borderColor='#cbd5e1';">
                </div>
                <div style="display: flex; flex-direction: column; gap: 5px;">
                  <label style="font-size: 0.82rem; font-weight: 600; color: #475569;">Email Address</label>
                  <input type="email" name="email" placeholder="e.g. leader@campus.com" class="leader-form-input" onfocus="this.style.borderColor='#6b46c1';" onblur="this.style.borderColor='#cbd5e1';">
                </div>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; align-items: center;">
                <div style="display: flex; flex-direction: column; gap: 5px;">
                  <label style="font-size: 0.82rem; font-weight: 600; color: #475569;">Display Priority (1 = Highest)</label>
                  <input type="number" name="priority" value="5" min="1" max="100" class="leader-form-input" onfocus="this.style.borderColor='#6b46c1';" onblur="this.style.borderColor='#cbd5e1';">
                </div>
                <div style="display: flex; flex-direction: column; gap: 5px;">
                  <label style="font-size: 0.82rem; font-weight: 600; color: #475569;">Profile Picture</label>
                  <input type="file" name="image" accept="image/*" style="font-size: 0.85rem; color: #64748b;">
                </div>
              </div>

              <div style="display: flex; flex-direction: column; gap: 5px;">
                <label style="font-size: 0.82rem; font-weight: 600; color: #475569; display: flex; align-items: center; justify-content: space-between;">
                  <span>Inspiring Leadership Quote / Message</span>
                  <span id="leaderAiTag" style="display:none; font-size:0.75rem; color:#7c3aed; font-weight:600; background:#f5f3ff; padding:2px 8px; border-radius:6px;"><i class="fa-solid fa-sparkles"></i> AI Drafted</span>
                </label>
                
                <button type="button" id="leaderAiDraftBtn" class="leader-ai-btn" style="margin-bottom: 6px;">
                  <i class="fa-solid fa-wand-magic-sparkles"></i>
                  <span id="leaderAiDraftBtnLabel">Draft Quote with AI</span>
                </button>

                <textarea name="message" id="leaderQuoteInput" rows="3" placeholder="A quote or welcome message from the leader..." class="leader-form-input"></textarea>
              </div>

              <button type="submit" id="leaderSubmitBtn">
                <i class="fa-solid fa-paper-plane"></i> Publish Leader
              </button>
            </form>
          </div>

          <!-- RIGHT: Leaders List Preview -->
          <div style="display: flex; flex-direction: column; gap: 16px;">
            <div style="background: white; border-radius: 16px; border: 1px solid var(--border-color); box-shadow: var(--shadow-sm); overflow: hidden;">
              <div style="padding: 18px 20px 14px; border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; justify-content: space-between;">
                <h3 style="margin: 0; font-size: 1rem; font-weight: 700; color: #1e1b4b; display: flex; align-items: center; gap: 8px;">
                  <i class="fa-solid fa-user-group" style="color: var(--primary);"></i> All Leaders
                  <span id="leaderCountBadge" style="font-size: 0.72rem; background: #faf5ff; color: #6b46c1; border: 1px solid #d6bcfa; border-radius: 20px; padding: 2px 8px; font-weight: 700;"></span>
                </h3>
                <a href="view.html" class="leader-view-all-link">
                  View All <i class="fa-solid fa-arrow-up-right-from-square" style="font-size: 0.7rem;"></i>
                </a>
              </div>
              <div id="leaderPostSidelist" style="max-height: none; overflow-y: hidden; padding: 10px 12px; display: flex; flex-direction: column; gap: 6px;">
                <div style="text-align: center; padding: 24px; color: #94a3b8; font-size: 0.88rem;">
                  <i class="fa-solid fa-spinner fa-spin" style="font-size: 1.2rem; margin-bottom: 6px; display: block;"></i>
                  Loading academic leaders...
                </div>
              </div>
            </div>
          </div>

        </div>
      `);

      document.getElementById('leaderBackBtn')?.addEventListener('click', goToDashboard);

      let allLeadersData = [];

      const loadLeaderPostSidelist = async () => {
        const sidelist = document.getElementById('leaderPostSidelist');
        const countBadge = document.getElementById('leaderCountBadge');
        if (!sidelist) return;
        try {
          const res = await fetch(`${apiBase}/api/academic-leaders`);
          if (!res.ok) throw new Error();
          const data = await res.json();
          allLeadersData = Array.isArray(data) ? data : [];
          if (countBadge) countBadge.textContent = allLeadersData.length;
          renderLeaderSidelist();
        } catch {
          sidelist.innerHTML = `<div style="text-align:center; padding:20px; color:#94a3b8; font-size:0.85rem;">Could not load academic leaders.</div>`;
        }
      };

      const renderLeaderSidelist = () => {
        const sidelist = document.getElementById('leaderPostSidelist');
        if (!sidelist) return;
        if (!allLeadersData.length) {
          sidelist.innerHTML = `<div style="text-align:center; padding:24px; color:#94a3b8; font-size:0.85rem;"><i class="fa-regular fa-folder-open" style="font-size:1.5rem; display:block; margin-bottom:8px;"></i>No leaders yet.</div>`;
          return;
        }
        sidelist.innerHTML = allLeadersData.slice(0, 5).map(item => {
          let avatarSrc = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&background=6b46c1&color=fff&rounded=true&bold=true&size=38`;
          if (item.image) {
            avatarSrc = item.image.startsWith('http') ? item.image : `${apiBase}${item.image}`;
          }
          return `
            <div class="leader-post-row-item" data-id="${item._id}">
              <img src="${avatarSrc}" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&background=6b46c1&color=fff&rounded=true&bold=true&size=38';" style="width:38px; height:38px; border-radius:50%; object-fit:cover; flex-shrink:0;">
              <div style="min-width:0; flex:1; overflow:hidden; display:flex; flex-direction:column; gap:3px;">
                <div style="font-size:0.9rem; font-weight:700; color:#1e1b4b; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${esc(item.name || 'Untitled')}</div>
                <div style="display:flex; gap:6px; align-items:center; flex-wrap:wrap;">
                  <span style="font-size:0.72rem; font-weight:700; text-transform:uppercase; color:#6b46c1;">${esc(item.role || '')}</span>
                  <span style="font-size:0.72rem; color:#94a3b8;">${esc(item.department || '')}</span>
                </div>
              </div>
              <div style="display:flex; gap:6px; margin-left:auto; flex-shrink:0; align-self:center;">
                <button type="button" class="leader-row-btn del" data-id="${item._id}" title="Delete"><i class="fa-solid fa-trash"></i></button>
              </div>
            </div>`;
        }).join('');

        sidelist.querySelectorAll('.leader-row-btn.del').forEach(btn => {
          btn.addEventListener('click', async () => {
            const id = btn.dataset.id;
            const item = allLeadersData.find(a => a._id === id);
            const name = item?.name || 'this leader';
            if (confirm(`Are you sure you want to remove ${name}?`)) {
              try {
                const token = user.token || localStorage.getItem('token') || '';
                const res = await fetch(`${apiBase}/api/academic-leaders/${id}`, {
                  method: 'DELETE',
                  headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                  alert('Academic Leader removed successfully.');
                  loadLeaderPostSidelist();
                } else {
                  alert('Failed to remove academic leader.');
                }
              } catch (error) {
                alert('Network error while deleting.');
              }
            }
          });
        });
      };

      loadLeaderPostSidelist();

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
            loadLeaderPostSidelist();
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

        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 28px; width: 100%;">
          <div style="display: flex; align-items: center; gap: 16px;">
            <button type="button" id="leaderBackBtn" style="background: #f8fafc; border: 1px solid #e2e8f0; font-size: 1.1rem; color: #475569; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 42px; height: 42px; border-radius: 50%; transition: all 0.2s;" onmouseenter="this.style.background='#e2e8f0';" onmouseleave="this.style.background='#f8fafc';">
              <i class="fa-solid fa-arrow-left"></i>
            </button>
            <div>
              <h2 style="margin: 0; font-size: 1.6rem; font-weight: 800; color: #1e1b4b; font-family: 'Poppins', sans-serif;">Academic Leaders</h2>
              <p style="margin: 4px 0 0 0; font-size: 0.9rem; color: #64748b;">Visionary leaders directing Asansol Engineering College's academic progress.</p>
            </div>
          </div>
          ${isAuthority ? `
            <a href="post.html" style="background: var(--primary); color: white; border: none; padding: 10px 18px; border-radius: 12px; font-weight: 700; font-size: 0.9rem; cursor: pointer; text-decoration: none; display: flex; align-items: center; gap: 8px; transition: all 0.2s; box-shadow: var(--shadow-sm);" onmouseenter="this.style.background='#55309d';" onmouseleave="this.style.background='var(--primary)';">
              <i class="fa-solid fa-plus"></i> Add Leader
            </a>
          ` : ''}
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

    if ((userRole === 'hod' || userRole === 'warden') && !document.getElementById('complaints-custom-styles')) {
      const styleEl = document.createElement('style');
      styleEl.id = 'complaints-custom-styles';
      styleEl.innerHTML = `
        .complaints-grid-view {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
          align-items: stretch;
          padding-right: 4px;
        }
        @media (min-width: 1200px) {
          .complaints-grid-view {
            grid-template-columns: repeat(2, 1fr);
            gap: 24px;
          }
        }
        
        .complaint-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 20px 24px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.015);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          cursor: pointer;
          box-sizing: border-box;
          margin-bottom: 4px;
          height: 100%;
        }
        .complaint-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 30px rgba(107, 70, 193, 0.08);
          border-color: rgba(107, 70, 193, 0.25);
        }
        
        .complaint-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          width: 100%;
          flex-shrink: 0;
        }
        .complaint-title-area {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
          flex: 1;
        }
        .complaint-title {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 700;
          color: #0f172a;
          font-family: 'Poppins', sans-serif;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
        }
        
        .complaint-card-body {
          display: flex;
          flex-direction: column;
          gap: 10px;
          width: 100%;
          flex-grow: 1;
        }
        .complaint-desc {
          margin: 0;
          font-size: 0.9rem;
          color: #475569;
          line-height: 1.5;
          font-family: 'Inter', sans-serif;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          white-space: normal;
        }
        .complaint-images {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 4px;
        }
        
        .complaint-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          border-top: 1px solid #f1f5f9;
          padding-top: 12px;
          margin-top: auto;
          width: 100%;
          flex-wrap: wrap;
          flex-shrink: 0;
        }
        .complaint-footer-left {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
          flex-wrap: wrap;
          font-size: 0.8rem;
        }
        .complaint-footer-right {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-left: auto;
          font-size: 0.8rem;
        }
      `;
      document.head.appendChild(styleEl);
    }

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

              <div style="display: flex; flex-direction: column; gap: 6px;">
                <label style="font-size: 0.85rem; font-weight: 600; color: #475569;">Location (e.g., Room No, Lab, Block)</label>
                <input type="text" name="location" id="complaintLocationInput" placeholder="e.g. Room 204, IT Lab, Block A" required style="padding: 12px 16px; border-radius: 10px; border: 1px solid #cbd5e1; outline: none; font-size: 0.95rem; font-family: inherit; transition: border-color 0.2s;" onfocus="this.style.borderColor='#8b5cf6';" onblur="this.style.borderColor='#cbd5e1';">
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
      let styleTagHtml = (userRole === 'hod' || userRole === 'warden') ? '' : `
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
      `;

      contentHtml = `
        ${styleTagHtml}
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
    else if (userRole === 'teacher') dropdown.value = 'all';
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
        const resData = await res.json();
        alert('Complaint registered successfully.');
        form.reset();
        loadRedesignedComplaints();

        if (resData.assignedStaff) {
          const staff = resData.assignedStaff;
          const comp = resData.complaint;
          const studentName = user.name || 'Student';
          const roomNo = comp.location || 'N/A';
          const problem = comp.title || 'N/A';
          const details = comp.description || 'N/A';

          const message = `Hello ${staff.name},\n\nA new campus complaint has been filed and routed to you.\n\n*Task:* ${staff.designation} Work\n*Problem:* ${problem}\n*Location:* ${roomNo}\n*Details:* ${details}\n*Reported By:* ${studentName}\n\nPlease take necessary action.`;
          const encodedText = encodeURIComponent(message);

          if (confirm(`A WhatsApp notification has been drafted for the assigned staff: ${staff.name} (${staff.designation}).\n\nClick OK to open WhatsApp and send the alert.`)) {
            const phone = staff.contactNumber ? staff.contactNumber.replace(/\D/g, '') : '';
            const prefix = phone.length === 10 ? '91' : '';
            window.open(`https://api.whatsapp.com/send?phone=${prefix}${phone}&text=${encodedText}`, '_blank');
          }
        }
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

      // Privacy Filter: Non-staff users must never see 'Personal' complaints in the public 'All Complaints' feed
      const isStaff = ['teacher', 'hod', 'warden', 'principal', 'dean', 'admin'].includes(userRole);
      if (!isStaff && filterVal === 'all') {
        filtered = filtered.filter(c => c.category !== 'Personal');
      }

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

    // Assigned Staff Info
    let assignedStaffHtml = '';
    if (c.assignedStaff) {
      const staff = typeof c.assignedStaff === 'object' ? c.assignedStaff : null;
      if (staff) {
        const staffName = staff.name || 'Support Staff';
        const staffDesignation = staff.designation || 'Staff';
        const staffPhone = staff.contactNumber || 'N/A';
        const staffEmail = staff.email || 'N/A';
        
        const cleanPhone = staffPhone.replace(/\D/g, '');
        const prefix = cleanPhone.length === 10 ? '91' : '';

        const studentNameVal = raiserName || 'Student';
        const roomNo = c.location || 'N/A';
        const problem = title || 'N/A';
        const details = desc || 'N/A';
        const priorityLabel = priority || 'Medium';

        const message = `Hello ${staffName},\n\nA campus complaint has been assigned to you.\n\n*Problem:* ${problem}\n*Location:* ${roomNo}\n*Priority:* ${priorityLabel}\n*Details:* ${details}\n*Reported By:* ${studentNameVal}\n\nPlease attend to this issue.`;
        const encodedText = encodeURIComponent(message);
        
        const waLink = cleanPhone ? `<a href="https://api.whatsapp.com/send?phone=${prefix}${cleanPhone}&text=${encodedText}" target="_blank" style="color: #25D366; font-size: 1.15rem; display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; background: rgba(37, 211, 102, 0.1); border-radius: 50%; transition: transform 0.2s;" onmouseenter="this.style.transform='scale(1.15)';" onmouseleave="this.style.transform='scale(1)';"><i class="fa-brands fa-whatsapp"></i></a>` : '';

        assignedStaffHtml = `
          <div style="background: #faf5ff; border: 1px solid #e9d5ff; border-radius: 12px; padding: 12px 16px; display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 16px;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 36px; height: 36px; background: #f3e8ff; color: #7c3aed; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; flex-shrink: 0;">
                <i class="fa-solid fa-toolbox"></i>
              </div>
              <div>
                <div style="font-size: 0.75rem; color: #6b21a8; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Assigned Support Staff</div>
                <div style="font-size: 0.9rem; font-weight: 700; color: #581c87;">${esc(staffName)} <span style="font-size: 0.8rem; font-weight: 500; color: #701a75;">(${esc(staffDesignation)})</span></div>
                <div style="font-size: 0.75rem; color: #7e22ce; margin-top: 2px;">Email: ${esc(staffEmail)} • Ph: ${esc(staffPhone)}</div>
              </div>
            </div>
            <div>
              ${waLink}
            </div>
          </div>
        `;
      }
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

        <!-- Assigned Staff Info -->
        ${assignedStaffHtml}

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

    if (userRole === 'hod' || userRole === 'warden') {
      const priorityStyleRedesigned = priority === 'High' ? 'background: #fff7ed; color: #c2410c; border: 1px solid #ffedd5;' :
                                   priority === 'Urgent' ? 'background: #fef2f2; color: #b91c1c; border: 1px solid #fee2e2;' :
                                   priority === 'Low' ? 'background: #f0fdf4; color: #047857; border: 1px solid #d1fae5;' :
                                   'background: #eff6ff; color: #1d4ed8; border: 1px solid #dbeafe;';

      const statusStyleRedesigned = status === 'Resolved' ? 'background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; font-weight: bold;' :
                                 status === 'In Progress' ? 'background: #eff6ff; color: #1e4ed8; border: 1px solid #bfdbfe; font-weight: bold;' :
                                 'background: #f8fafc; color: #475569; border: 1px solid #e2e8f0;';

      // Clickable Image Placeholders (Square Thumbnails) in the side
      let imagePlaceholdersRedesignedHtml = '';
      if (imgUrl) {
        imagePlaceholdersRedesignedHtml += `
          <div onclick="window.open('${imgUrl}')" style="width: 52px; height: 52px; border-radius: 8px; border: 1px solid #cbd5e1; background: #f8fafc; cursor: pointer; display: flex; align-items: center; justify-content: center; overflow: hidden; transition: all 0.2s; flex-shrink: 0;" title="View Issue Photo" onmouseenter="this.style.borderColor='var(--primary)';" onmouseleave="this.style.borderColor='#cbd5e1';">
            <img src="${imgUrl}" style="width: 100%; height: 100%; object-fit: cover;">
          </div>
        `;
      }
      if (resolveImgUrl) {
        imagePlaceholdersRedesignedHtml += `
          <div onclick="window.open('${resolveImgUrl}')" style="width: 52px; height: 52px; border-radius: 8px; border: 1px solid #bbf7d0; background: #f0fdf4; cursor: pointer; display: flex; align-items: center; justify-content: center; overflow: hidden; transition: all 0.2s; flex-shrink: 0;" title="View Resolution Proof" onmouseenter="this.style.borderColor='#10b981';" onmouseleave="this.style.borderColor='#bbf7d0';">
            <img src="${resolveImgUrl}" style="width: 100%; height: 100%; object-fit: cover;">
          </div>
        `;
      }

      // Resolve buttons and forms
      let resolveBtnRedesignedHtml = '';
      let resolveFormContainerRedesignedHtml = '';
      if (isAuthority && status !== 'Resolved') {
        if (userRole === 'principal') {
          resolveBtnRedesignedHtml = `
            <button type="button" class="btn-resolve-direct" data-id="${c._id}" style="background: #eff6ff; color: #1e4ed8; border: 1px solid #bfdbfe; padding: 6px 12px; border-radius: 8px; font-size: 0.75rem; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 6px; transition: all 0.2s; box-sizing: border-box;" onmouseenter="this.style.background='#dbeafe';" onmouseleave="this.style.background='#eff6ff';">
              <i class="fa-solid fa-check"></i> Resolve
            </button>
          `;
        } else {
          resolveBtnRedesignedHtml = `
            <button type="button" class="btn-resolve-toggle" data-id="${c._id}" style="background: #eff6ff; color: #1e4ed8; border: 1px solid #bfdbfe; padding: 6px 12px; border-radius: 8px; font-size: 0.75rem; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 6px; transition: all 0.2s; box-sizing: border-box;" onmouseenter="this.style.background='#dbeafe';" onmouseleave="this.style.background='#eff6ff';">
              <i class="fa-solid fa-check-to-slot"></i> Resolve
            </button>
          `;
          resolveFormContainerRedesignedHtml = `
            <div id="resolveFormContainer-${c._id}" style="display: none; margin-top: 12px; background: #f8fafc; border: 1px solid #e2e8f0; padding: 14px; border-radius: 12px; width: 100%; box-sizing: border-box;">
              <form class="inlineResolveForm" data-id="${c._id}" style="display: flex; flex-direction: column; gap: 10px;">
                <label style="font-size: 0.8rem; font-weight: 700; color: #475569; display: block; margin-bottom: 2px;">Upload Resolution Proof</label>
                <input type="file" name="resolutionImage" accept="image/*" required style="font-size: 0.8rem; color: #475569;">
                <button type="submit" style="background: var(--primary); color: white; border: none; padding: 8px 16px; border-radius: 8px; font-size: 0.8rem; font-weight: 700; cursor: pointer; align-self: flex-start; margin-top: 4px; transition: all 0.2s;" onmouseenter="this.style.background='#55309d';" onmouseleave="this.style.background='var(--primary)';">
                  Confirm Resolution
                </button>
              </form>
            </div>
          `;
        }
      }

      // Left Side Footer: Raiser & Resolver Info
      let footerLeftRedesignedHtml = `
        <span style="display: inline-flex; align-items: center; gap: 6px; font-weight: 600; color: #475569; flex-shrink: 0; min-width: 0;">
          <img src="${raiserAvatar}" style="width: 22px; height: 22px; border-radius: 50%; object-fit: cover; border: 1.5px solid #fff; box-shadow: 0 2px 6px rgba(0,0,0,0.06); flex-shrink: 0;" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(raiserName)}&background=6b46c1&color=fff&rounded=true&bold=true';">
          <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">By: <strong style="color: #0f172a;">${esc(raiserName)}</strong>${esc(raiserInfo)}</span>
        </span>
      `;

      if (status === 'Resolved') {
        footerLeftRedesignedHtml += `
          <span style="color: #e2e8f0; flex-shrink: 0;">|</span>
          <span style="display: inline-flex; align-items: center; gap: 6px; font-weight: 600; color: #166534; flex-shrink: 0; min-width: 0;">
            <img src="${resolverAvatar}" style="width: 22px; height: 22px; border-radius: 50%; object-fit: cover; border: 1.5px solid #fff; box-shadow: 0 2px 6px rgba(0,0,0,0.06); flex-shrink: 0;" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(resolverName)}&background=10b981&color=fff&rounded=true&bold=true';">
            <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">Resolved: <strong style="color: #14532d;">${esc(resolverName)}</strong></span>
          </span>
        `;
      }

      // Right Side Footer: Date & Upvote
      let footerRightRedesignedHtml = `
        <span style="font-weight: 500; font-size: 0.78rem; flex-shrink: 0; display: inline-flex; align-items: center; gap: 4px; color: #64748b;">
          <i class="fa-regular fa-clock"></i>${date}
        </span>
        <span style="color: #e2e8f0; flex-shrink: 0;">|</span>
        <button type="button" class="btn-complaint-upvote" id="like-btn-${c._id}" data-id="${c._id}" style="background: none; border: none; color: ${likeColor}; cursor: pointer; font-size: 0.78rem; font-weight: 600; display: inline-flex; align-items: center; gap: 4px; padding: 4px 8px; border-radius: 6px; transition: all 0.2s; flex-shrink: 0;" onmouseenter="this.style.background='#f1f5f9';" onmouseleave="this.style.background='none';">
          <i class="fa-solid fa-thumbs-up"></i>
          <span id="count-${c._id}">${c.upvotes || 0}</span>
        </button>
      `;

      return `
        <div class="complaint-card" data-id="${c._id}">
          <!-- Top Row: Title, Priority, Status badge -->
          <div class="complaint-card-header">
            <div class="complaint-title-area">
              <span style="${priorityStyleRedesigned} padding: 4px 10px; border-radius: 8px; font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px; flex-shrink: 0;">${priority}</span>
              <h4 class="complaint-title" title="${esc(title)}">${esc(title)}</h4>
            </div>
            <span style="${statusStyleRedesigned} padding: 4px 10px; border-radius: 8px; font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.3px; font-weight: 700; text-align: center; display: inline-block; flex-shrink: 0; box-sizing: border-box;">${status}</span>
          </div>
          
          <!-- Middle Row: Description & Image attachments -->
          <div class="complaint-card-body">
            <p class="complaint-desc" title="${esc(desc)}">${esc(desc)}</p>
            ${imagePlaceholdersRedesignedHtml ? `<div class="complaint-images">${imagePlaceholdersRedesignedHtml}</div>` : ''}
          </div>
          
          <!-- Bottom Row: Raiser, Resolver & Date, Upvotes, Actions -->
          <div class="complaint-card-footer">
            <div class="complaint-footer-left">
              ${footerLeftRedesignedHtml}
            </div>
            <div class="complaint-footer-right">
              ${footerRightRedesignedHtml}
              ${resolveBtnRedesignedHtml}
            </div>
          </div>
          
          <!-- Inline Resolution Form (if toggled) -->
          ${resolveFormContainerRedesignedHtml}
        </div>
      `;
    }

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

  // ==========================================
  // STUDENT & TEACHER ASSIGNMENTS IMPLEMENTATION
  // ==========================================

  function showToastNotification(title, message, iconClass = 'fa-file-invoice', borderLeftColor = 'var(--primary)', iconColor = 'var(--primary)', iconBg = 'var(--primary-light)', duration = 6000) {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        background: white;
        border-left: 5px solid ${borderLeftColor};
        box-shadow: 0 10px 30px rgba(0,0,0,0.15);
        padding: 16px 20px;
        border-radius: var(--radius-md);
        z-index: 9999;
        display: flex;
        align-items: center;
        gap: 12px;
        animation: slideInUp 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        font-family: 'Inter', sans-serif;
    `;
    
    // Stack toasts vertically if multiple are open
    const existingToasts = document.querySelectorAll('.cc-toast-notification');
    const offset = existingToasts.length * 90;
    toast.style.bottom = `${24 + offset}px`;
    toast.classList.add('cc-toast-notification');

    toast.innerHTML = `
        <div style="background: ${iconBg}; color: ${iconColor}; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; flex-shrink: 0;">
            <i class="fa-solid ${iconClass}"></i>
        </div>
        <div style="flex: 1;">
            <h5 style="margin: 0 0 2px 0; font-size: 0.95rem; font-weight: 700; color: var(--text-dark);">${esc(title)}</h5>
            <p style="margin: 0; font-size: 0.8rem; color: var(--text-muted); line-height:1.4;">${message}</p>
        </div>
        <button style="background: none; border: none; font-size: 1.1rem; cursor: pointer; color: var(--text-muted); margin-left: 8px;" onclick="this.parentElement.remove()">&times;</button>
    `;
    
    if (!document.getElementById('toast-animation-style')) {
        const style = document.createElement('style');
        style.id = 'toast-animation-style';
        style.textContent = `
            @keyframes slideInUp {
                from { transform: translateY(100px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        if (toast.parentNode) {
            toast.style.transition = 'opacity 0.5s, transform 0.5s';
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(20px)';
            setTimeout(() => {
              toast.remove();
              // Adjust positions of other toasts
              const remainingToasts = document.querySelectorAll('.cc-toast-notification');
              remainingToasts.forEach((t, i) => {
                t.style.bottom = `${24 + (i * 90)}px`;
              });
            }, 500);
        }
    }, duration);
  }

  function checkAndShowSessionNotifications(assignments) {
    if (sessionStorage.getItem('assignments_notified_this_session')) return;
    sessionStorage.setItem('assignments_notified_this_session', 'true');

    const now = new Date();
    let unsubmittedCount = 0;
    let dueTomorrowCount = 0;
    let newlyGradedCount = 0;

    assignments.forEach(a => {
      const sub = a.submission;
      if (sub) {
        if (sub.status === 'Approved' || sub.status === 'Graded' || sub.grade !== undefined) {
          newlyGradedCount++;
        }
      } else {
        unsubmittedCount++;
        if (a.deadline) {
          const deadlineDate = new Date(a.deadline);
          const diffTime = deadlineDate - now;
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays >= 0 && diffDays <= 1.5) {
            dueTomorrowCount++;
          }
        }
      }
    });

    showToastNotification(
      'Assignment Status',
      `You have submitted <strong>${assignments.length - unsubmittedCount}</strong> out of <strong>${assignments.length}</strong> assignments.`,
      'fa-file-invoice',
      'var(--primary)',
      'var(--primary)',
      'var(--primary-light)'
    );

    if (dueTomorrowCount > 0) {
      setTimeout(() => {
        showToastNotification(
          'Upcoming Deadline',
          `⚠️ You have <strong>${dueTomorrowCount}</strong> assignment${dueTomorrowCount > 1 ? 's' : ''} due in the next 24 hours!`,
          'fa-clock',
          '#ea580c',
          '#ea580c',
          '#fff7ed'
        );
      }, 800);
    }

    if (newlyGradedCount > 0) {
      setTimeout(() => {
        showToastNotification(
          'Graded Feedback',
          `🎉 <strong>${newlyGradedCount}</strong> of your submissions have been graded. Open details to view marks and feedback!`,
          'fa-graduation-cap',
          '#16a34a',
          '#16a34a',
          '#f0fdf4'
        );
      }, 1600);
    }
  }

  function validateFileInput(inputEl, errorEl) {
    if (!inputEl || !inputEl.files || inputEl.files.length === 0) return false;
    const file = inputEl.files[0];
    
    // File size limit (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      errorEl.textContent = '❌ File size exceeds 5MB limit. Please upload a smaller file.';
      errorEl.style.display = 'block';
      inputEl.value = ''; // Clear file selection
      return false;
    }

    // Supported file types (PDF, DOC/DOCX, PPT/PPTX, ZIP, Images)
    const allowedExtensions = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'zip', 'jpg', 'jpeg', 'png', 'gif', 'webp'];
    const fileExtension = file.name.split('.').pop().toLowerCase();
    
    if (!allowedExtensions.includes(fileExtension)) {
      errorEl.textContent = '❌ Unsupported file type. Allowed: PDF, Word, PowerPoint, ZIP, or Images.';
      errorEl.style.display = 'block';
      inputEl.value = ''; // Clear file selection
      return false;
    }

    errorEl.style.display = 'none';
    errorEl.textContent = '';
    return true;
  }

  async function renderAssignmentsPage(info) {
    const userRole = (user.role || 'Guest').toLowerCase();
    const isStudent = userRole === 'student' || userRole === 'hosteler';
    const isTeacher = userRole === 'teacher' || userRole === 'hod';
    
    if (isStudent) {
      renderStudentAssignments(info);
    } else if (isTeacher) {
      if (cfg.mode === 'post') {
        renderTeacherPostForm(info);
      } else {
        renderTeacherAssignments(info);
      }
    } else {
      content(`<div class="module-empty">Access Denied: Assignments module is only accessible for students, teachers, and HODs.</div>`);
    }
  }

  async function renderStudentAssignments(info) {
    content(`
      <style>
        .assign-header-layout {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 24px;
          margin-bottom: 24px;
          align-items: stretch;
        }
        .assign-stats-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .assign-stats-grid .stat-card-new {
          margin: 0 !important;
          width: 100%;
          box-sizing: border-box;
          padding: 12px 16px !important;
          display: flex !important;
          flex-direction: row !important;
          align-items: center !important;
          gap: 12px !important;
          border-radius: 12px !important;
        }
        .assign-stats-grid .stat-card-new .icon-wrapper {
          width: 40px !important;
          height: 40px !important;
          border-radius: 10px !important;
          font-size: 1.1rem !important;
          flex-shrink: 0 !important;
        }
        .assign-stats-grid .stat-card-new h4 {
          font-size: 0.8rem !important;
          margin: 0 !important;
        }
        .assign-stats-grid .stat-card-new .stat-value {
          font-size: 1.3rem !important;
          margin: 2px 0 0 0 !important;
          line-height: 1.1 !important;
        }
        .assign-filters-card {
          padding: 20px;
          border-radius: 12px;
          background: white;
          border: 1px solid var(--border-color);
          box-shadow: var(--shadow-sm);
          box-sizing: border-box;
          display: flex;
          align-items: center;
        }
        .assign-filter-grid-2x2 {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 16px;
          width: 100%;
          align-items: center;
        }
        @media (max-width: 1024px) {
          .assign-header-layout {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 550px) {
          .assign-stats-grid {
            grid-template-columns: 1fr;
          }
          .assign-filter-grid-2x2 {
            grid-template-columns: 1fr;
          }
        }
        .assign-modal-overlay {
          display: flex; position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
          background: rgba(0,0,0,0.5); z-index: 2000; justify-content: center; align-items: center; 
          backdrop-filter: blur(4px);
        }
        .assign-modal-content {
          background: white; padding: 28px; border-radius: 16px; width: 90%; max-width: 600px; 
          text-align: left; position: relative; box-shadow: var(--shadow-lg); display: flex; 
          flex-direction: column; gap: 18px; max-height: 85vh; overflow-y: auto;
        }
      </style>
      
      <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 28px;">
        <button type="button" id="assignBackBtn" style="background: #f8fafc; border: 1px solid #e2e8f0; font-size: 1.1rem; color: #475569; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 42px; height: 42px; border-radius: 50%; transition: all 0.2s;" onmouseenter="this.style.background='#e2e8f0';" onmouseleave="this.style.background='#f8fafc';">
          <i class="fa-solid fa-arrow-left"></i>
        </button>
        <div>
          <h2 style="margin: 0; font-size: 1.6rem; font-weight: 800; color: #1e1b4b; font-family: 'Poppins', sans-serif;">Assignments</h2>
          <p style="margin: 4px 0 0 0; font-size: 0.9rem; color: #64748b;">View and submit your academic tasks, and track feedback from teachers.</p>
        </div>
      </div>

      <!-- Header Layout (Stats on Left, Filters on Right) -->
      <div class="assign-header-layout">
        <!-- Left Side: Statistics (2x2 Grid) -->
        <div class="assign-stats-grid">
          <div class="stat-card-new">
            <div class="icon-wrapper" style="background: #e0e7ff; color: #4f46e5;"><i class="fa-solid fa-list-check"></i></div>
            <div class="stat-info">
              <h4>Total</h4>
              <p class="stat-value" id="stats-total">0</p>
            </div>
          </div>
          <div class="stat-card-new">
            <div class="icon-wrapper" style="background: #fef3c7; color: #f59e0b;"><i class="fa-regular fa-clock"></i></div>
            <div class="stat-info">
              <h4>Pending</h4>
              <p class="stat-value" id="stats-pending">0</p>
            </div>
          </div>
          <div class="stat-card-new">
            <div class="icon-wrapper" style="background: #d1fae5; color: #10b981;"><i class="fa-solid fa-circle-check"></i></div>
            <div class="stat-info">
              <h4>Submitted</h4>
              <p class="stat-value" id="stats-submitted">0</p>
            </div>
          </div>
          <div class="stat-card-new">
            <div class="icon-wrapper" style="background: #fce7f3; color: #ec4899;"><i class="fa-solid fa-graduation-cap"></i></div>
            <div class="stat-info">
              <h4>Graded</h4>
              <p class="stat-value" id="stats-graded">0</p>
            </div>
          </div>
        </div>

        <!-- Right Side: Filters (2x2 Grid) -->
        <div class="assign-filters-card">
          <div class="assign-filter-grid-2x2">
            <div style="position: relative;">
              <i class="fa-solid fa-magnifying-glass" style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #94a3b8; font-size: 0.9rem;"></i>
              <input type="text" id="assignSearchInput" placeholder="Search assignments by title or description..." style="width: 100%; padding: 10px 12px 10px 40px; border-radius: 8px; border: 1px solid #cbd5e1; outline: none; font-size: 0.9rem; font-family: inherit; transition: border-color 0.2s; box-sizing: border-box;" onfocus="this.style.borderColor='var(--primary)';" onblur="this.style.borderColor='#cbd5e1';">
            </div>
            <div>
              <select id="assignSubjectFilter" style="width: 100%; padding: 10px 12px; border-radius: 8px; border: 1px solid #cbd5e1; outline: none; font-size: 0.9rem; background: white; cursor: pointer; color: #475569; font-weight: 500; box-sizing: border-box;">
                <option value="all">All Subjects</option>
              </select>
            </div>
            <div>
              <select id="assignStatusFilter" style="width: 100%; padding: 10px 12px; border-radius: 8px; border: 1px solid #cbd5e1; outline: none; font-size: 0.9rem; background: white; cursor: pointer; color: #475569; font-weight: 500; box-sizing: border-box;">
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="submitted">Submitted</option>
                <option value="late">Submitted Late</option>
                <option value="graded">Graded</option>
              </select>
            </div>
            <div>
              <select id="assignDeadlineFilter" style="width: 100%; padding: 10px 12px; border-radius: 8px; border: 1px solid #cbd5e1; outline: none; font-size: 0.9rem; background: white; cursor: pointer; color: #475569; font-weight: 500; box-sizing: border-box;">
                <option value="all">All Deadlines</option>
                <option value="today">Due Today</option>
                <option value="tomorrow">Due Tomorrow</option>
                <option value="overdue">Overdue (Unsubmitted)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- Assignment Grid -->
      <div id="assignListContainer">
        <div style="text-align: center; padding: 40px; color: #64748b;">
          <i class="fa-solid fa-spinner fa-spin" style="font-size: 1.5rem; margin-bottom: 8px;"></i>
          <div>Loading assignments...</div>
        </div>
      </div>
    `);

    document.getElementById('assignBackBtn')?.addEventListener('click', goToDashboard);

    let allAssignments = [];
    
    async function loadAssignmentsData() {
      try {
        const token = user.token || localStorage.getItem('token') || '';
        const res = await fetch(`${apiBase}/api/assignments`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.status === 401) {
          localStorage.removeItem('user');
          window.location.href = `${getRootPrefix()}index.html`;
          return;
        }
        if (!res.ok) throw new Error('Failed to fetch assignments');
        allAssignments = await res.json();
        allAssignments = allAssignments.filter(a => a.type !== 'note');

        const subjects = [...new Set(allAssignments.map(a => a.subject).filter(Boolean))];
        const subjectFilter = document.getElementById('assignSubjectFilter');
        if (subjectFilter) {
          subjectFilter.innerHTML = '<option value="all">All Subjects</option>' +
            subjects.map(sub => `<option value="${sub}">${sub}</option>`).join('');
        }

        checkAndShowSessionNotifications(allAssignments);
        renderFilteredAssignments();

        // Auto-open assignment details if assignmentId query parameter is present
        const urlParams = new URLSearchParams(window.location.search);
        const autoOpenId = urlParams.get('assignmentId');
        if (autoOpenId) {
          const autoOpenAssign = allAssignments.find(a => (a._id === autoOpenId || a.id === autoOpenId));
          if (autoOpenAssign) {
            setTimeout(() => showStudentAssignmentDetailsModal(autoOpenAssign), 200);
          }
        }
      } catch (err) {
        console.error(err);
        document.getElementById('assignListContainer').innerHTML = `
          <div class="module-empty" style="color: red;"><i class="fa-solid fa-triangle-exclamation"></i> Failed to load assignments. Please check your connection.</div>
        `;
      }
    }

    function renderFilteredAssignments() {
      const searchVal = document.getElementById('assignSearchInput')?.value.toLowerCase() || '';
      const subjectVal = document.getElementById('assignSubjectFilter')?.value || 'all';
      const statusVal = document.getElementById('assignStatusFilter')?.value || 'all';
      const deadlineVal = document.getElementById('assignDeadlineFilter')?.value || 'all';

      const now = new Date();

      const filtered = allAssignments.filter(a => {
        const titleMatch = (a.title || '').toLowerCase().includes(searchVal);
        const descMatch = (a.description || '').toLowerCase().includes(searchVal);
        if (searchVal && !titleMatch && !descMatch) return false;

        if (subjectVal !== 'all' && a.subject !== subjectVal) return false;

        const sub = a.submission;
        const isSubmitted = !!sub;
        const isGraded = isSubmitted && (sub.status === 'Approved' || sub.status === 'Graded' || sub.grade !== undefined);
        const isLate = isSubmitted && a.deadline && (new Date(sub.submittedAt) > new Date(a.deadline));
        
        if (statusVal !== 'all') {
          if (statusVal === 'pending' && isSubmitted) return false;
          if (statusVal === 'submitted' && (!isSubmitted || isGraded)) return false;
          if (statusVal === 'late' && !isLate) return false;
          if (statusVal === 'graded' && !isGraded) return false;
        }

        const deadlineDate = a.deadline ? new Date(a.deadline) : null;
        const diffTime = deadlineDate ? deadlineDate - now : 0;
        const isPastDeadline = deadlineDate && diffTime < 0;
        const isDueToday = deadlineDate && now.toDateString() === deadlineDate.toDateString();
        
        const tomorrow = new Date(now);
        tomorrow.setDate(now.getDate() + 1);
        const isDueTomorrow = deadlineDate && tomorrow.toDateString() === deadlineDate.toDateString();

        if (deadlineVal !== 'all') {
          if (deadlineVal === 'today' && !isDueToday) return false;
          if (deadlineVal === 'tomorrow' && !isDueTomorrow) return false;
          if (deadlineVal === 'overdue' && (isSubmitted || !isPastDeadline)) return false;
        }

        return true;
      });

      let totalCount = filtered.length;
      let pendingCount = 0;
      let submittedCount = 0;
      let gradedCount = 0;

      filtered.forEach(a => {
        const sub = a.submission;
        if (sub) {
          submittedCount++;
          if (sub.status === 'Approved' || sub.status === 'Graded' || sub.grade !== undefined) {
            gradedCount++;
          }
        } else {
          pendingCount++;
        }
      });

      document.getElementById('stats-total').textContent = totalCount;
      document.getElementById('stats-pending').textContent = pendingCount;
      document.getElementById('stats-submitted').textContent = submittedCount;
      document.getElementById('stats-graded').textContent = gradedCount;

      const container = document.getElementById('assignListContainer');
      if (filtered.length === 0) {
        container.innerHTML = `<div class="module-empty"><i class="fa-regular fa-folder-open"></i><span>No assignments found matching filters.</span></div>`;
        return;
      }

      container.innerHTML = `
        <div class="module-grid">
          ${filtered.map(a => {
            const sub = a.submission;
            const isSubmitted = !!sub;
            const isGraded = isSubmitted && (sub.status === 'Approved' || sub.status === 'Graded' || sub.grade !== undefined);
            const isLate = isSubmitted && a.deadline && (new Date(sub.submittedAt) > new Date(a.deadline));

            let statusBadge = '';
            if (isGraded) {
              statusBadge = `<span style="background: #faf5ff; color: #7c3aed; border: 1px solid #f3e8ff; padding: 4px 10px; border-radius: 9999px; font-size: 0.75rem; font-weight: 600;"><i class="fa-solid fa-graduation-cap"></i> Graded</span>`;
            } else if (isLate) {
              statusBadge = `<span style="background: #fff7ed; color: #d97706; border: 1px solid #ffedd5; padding: 4px 10px; border-radius: 9999px; font-size: 0.75rem; font-weight: 600;"><i class="fa-solid fa-clock"></i> Submitted Late</span>`;
            } else if (isSubmitted) {
              statusBadge = `<span style="background: #f0fdf4; color: #16a34a; border: 1px solid #dcfce7; padding: 4px 10px; border-radius: 9999px; font-size: 0.75rem; font-weight: 600;"><i class="fa-solid fa-circle-check"></i> Submitted</span>`;
            } else {
              statusBadge = `<span style="background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; padding: 4px 10px; border-radius: 9999px; font-size: 0.75rem; font-weight: 600;"><i class="fa-regular fa-clock"></i> Pending</span>`;
            }

            let deadlineBadge = '';
            const deadlineDate = a.deadline ? new Date(a.deadline) : null;
            if (isSubmitted) {
              deadlineBadge = ''; 
            } else if (deadlineDate) {
              const diffTime = deadlineDate - now;
              const isPastDeadline = diffTime < 0;
              const isDueToday = now.toDateString() === deadlineDate.toDateString();
              
              const tomorrow = new Date(now);
              tomorrow.setDate(now.getDate() + 1);
              const isDueTomorrow = tomorrow.toDateString() === deadlineDate.toDateString();

              if (isPastDeadline) {
                deadlineBadge = `<span style="background: #fef2f2; color: #dc2626; border: 1px solid #fee2e2; padding: 4px 10px; border-radius: 9999px; font-size: 0.75rem; font-weight: 600;"><i class="fa-solid fa-triangle-exclamation"></i> Overdue</span>`;
              } else if (isDueToday) {
                deadlineBadge = `<span style="background: #fff7ed; color: #ea580c; border: 1px solid #ffedd5; padding: 4px 10px; border-radius: 9999px; font-size: 0.75rem; font-weight: 600;"><i class="fa-regular fa-clock"></i> Due Today</span>`;
              } else if (isDueTomorrow) {
                deadlineBadge = `<span style="background: #eff6ff; color: #2563eb; border: 1px solid #dbeafe; padding: 4px 10px; border-radius: 9999px; font-size: 0.75rem; font-weight: 600;"><i class="fa-regular fa-clock"></i> Due Tomorrow</span>`;
              } else {
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                deadlineBadge = `<span style="background: #f8fafc; color: #475569; border: 1px solid #e2e8f0; padding: 4px 10px; border-radius: 9999px; font-size: 0.75rem; font-weight: 600;"><i class="fa-regular fa-calendar"></i> Due in ${diffDays}d</span>`;
              }
            }

            const postedStr = a.createdAt ? new Date(a.createdAt).toLocaleDateString('en-GB') : 'N/A';
            const dueStr = a.deadline ? new Date(a.deadline).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'No deadline';
            const teacherName = a.teacher ? a.teacher.name : 'Faculty';

            return `
              <article class="module-card section-card" style="display: flex; flex-direction: column; justify-content: space-between; position: relative; min-height: 250px; padding: 24px; border-radius: 16px; background: white; border: 1px solid var(--border-color); box-shadow: var(--shadow-sm); transition: all 0.2s;" onmouseenter="this.style.transform='translateY(-2px)'; this.style.boxShadow='var(--shadow-md)';" onmouseleave="this.style.transform='none'; this.style.boxShadow='var(--shadow-sm)';">
                <div style="position: absolute; top: 20px; right: 20px; display: flex; flex-direction: column; align-items: flex-end; gap: 6px;">
                  ${statusBadge}
                  ${deadlineBadge}
                </div>
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px; padding-right: 120px;">
                  <div style="width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; background: var(--primary-light); color: var(--primary); flex-shrink:0;">
                    <i class="fa-solid fa-file-invoice"></i>
                  </div>
                  <div style="min-width: 0;">
                    <div style="font-size: 0.8rem; font-weight: 700; color: var(--primary); text-transform: uppercase; letter-spacing: 0.5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${esc(a.subject)}</div>
                    <div style="font-size: 0.75rem; color: #64748b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">By ${esc(teacherName)}</div>
                  </div>
                </div>
                <div style="flex: 1; display: flex; flex-direction: column; justify-content: flex-start; margin-bottom: 20px;">
                  <h3 style="margin: 0 0 8px 0; font-size: 1.15rem; font-weight: 700; color: #1e1b4b; line-height: 1.3;">${esc(a.title)}</h3>
                  <p style="font-size: 0.88rem; color: #475569; line-height: 1.5; margin: 0; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis;">${esc(a.description || 'No description provided.')}</p>
                </div>
                
                <div style="border-top: 1px solid #f1f5f9; padding-top: 16px; display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; color: #64748b;">
                  <div>
                    <div><strong>Posted:</strong> ${postedStr}</div>
                    <div style="margin-top: 2px;"><strong>Due:</strong> <span style="color: #475569; font-weight: 500;">${dueStr}</span></div>
                  </div>
                  <button class="btn-pill btn-outline-purple view-assign-details-btn" data-id="${a._id}" style="padding: 8px 18px; font-weight: 600; font-size: 0.82rem; border-radius: 20px; transition: all 0.2s;">Details</button>
                </div>
              </article>
            `;
          }).join('')}
        </div>
      `;

      container.querySelectorAll('.view-assign-details-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.id;
          const assignObj = filtered.find(item => item._id === id);
          if (assignObj) showStudentAssignmentDetailsModal(assignObj);
        });
      });
    }

    document.getElementById('assignSearchInput')?.addEventListener('input', renderFilteredAssignments);
    document.getElementById('assignSubjectFilter')?.addEventListener('change', renderFilteredAssignments);
    document.getElementById('assignStatusFilter')?.addEventListener('change', renderFilteredAssignments);
    document.getElementById('assignDeadlineFilter')?.addEventListener('change', renderFilteredAssignments);

    await loadAssignmentsData();
  }

  function showStudentAssignmentDetailsModal(a) {
    const sub = a.submission;
    const isSubmitted = !!sub;
    const isGraded = isSubmitted && (sub.status === 'Approved' || sub.status === 'Graded' || sub.grade !== undefined);
    const isPastDeadline = a.deadline && (new Date() > new Date(a.deadline));

    const modal = document.createElement('div');
    modal.className = 'assign-modal-overlay';
    modal.id = 'assign-detail-modal';
    
    let attachmentHtml = '<p style="font-size: 0.9rem; color: #64748b; margin: 0;">No resource files attached.</p>';
    if (a.link) {
      let href = a.link;
      if (a.link.startsWith('/')) {
        href = apiBase + href;
      }
      const filename = a.link.split('/').pop() || 'Download Attachment';
      attachmentHtml = `
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; display: flex; align-items: center; justify-content: space-between; gap: 12px;">
          <div style="display: flex; align-items: center; gap: 10px; min-width: 0;">
            <i class="fa-solid fa-paperclip" style="color: var(--primary); font-size: 1.1rem; flex-shrink: 0;"></i>
            <span style="font-size: 0.9rem; font-weight: 500; color: #334155; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${esc(filename)}</span>
          </div>
          <a href="${href}" download target="_blank" class="btn-pill btn-outline-purple" style="font-size: 0.8rem; padding: 6px 14px; text-decoration: none; display: inline-flex; align-items: center; gap: 6px;"><i class="fa-solid fa-download"></i> Download</a>
        </div>
      `;
    }

    let submissionAreaHtml = '';
    
    if (isSubmitted) {
      let subHref = sub.link;
      if (sub.link.startsWith('/')) {
        subHref = apiBase + subHref;
      }
      const subFilename = sub.link.split('/').pop() || 'View Submission';
      const submittedDateStr = new Date(sub.submittedAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

      let gradingHtml = '';
      if (isGraded) {
        gradingHtml = `
          <div style="background: #faf5ff; border: 1.5px dashed #d8b4fe; border-radius: 12px; padding: 16px; display: flex; flex-direction: column; gap: 8px; margin-top: 14px;">
            <div style="display: flex; align-items: center; gap: 8px; font-weight: 700; color: #7c3aed; font-size: 0.95rem;">
              <i class="fa-solid fa-award"></i> Grade & Feedback
            </div>
            <div style="display: flex; gap: 12px; align-items: baseline;">
              <span style="font-size: 0.85rem; color: #6b21a8; font-weight: 600;">Marks/Grade:</span>
              <span style="font-size: 1.4rem; font-weight: 800; color: #581c87;">${esc(sub.grade)}</span>
            </div>
            ${sub.feedback ? `
              <div style="font-size: 0.88rem; color: #581c87; line-height: 1.4; border-top: 1px solid #f3e8ff; padding-top: 8px; margin-top: 4px;">
                <strong>Feedback:</strong> "${esc(sub.feedback)}"
              </div>
            ` : ''}
          </div>
        `;
      } else {
        gradingHtml = `
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; margin-top: 14px; color: #64748b; font-size: 0.88rem; display: flex; align-items: center; gap: 8px;">
            <i class="fa-solid fa-hourglass-half" style="color: #eab308;"></i> Awaiting teacher grading and feedback.
          </div>
        `;
      }

      let reuploadFormHtml = '';
      if (!isPastDeadline) {
        reuploadFormHtml = `
          <div style="margin-top: 20px; border-top: 1px solid #f1f5f9; padding-top: 16px;">
            <button id="toggleResubmitBtn" class="btn-pill btn-outline-purple" style="font-weight: 600; width: 100%; justify-content: center; display: flex; padding: 10px 0;"><i class="fa-solid fa-arrows-rotate" style="margin-right: 8px;"></i> Resubmit Assignment</button>
            <form id="resubmissionForm" style="display: none; flex-direction: column; gap: 12px; margin-top: 16px;">
              <div style="display: flex; flex-direction: column; gap: 6px;">
                <label style="font-size: 0.82rem; font-weight: 700; color: #475569;">Select Replacement File (PDF, DOC/DOCX, PPT/PPTX, ZIP, Images - Max 5MB)</label>
                <input type="file" id="resubFile" accept=".pdf,.doc,.docx,.ppt,.pptx,.zip,image/*" required style="font-size: 0.85rem; color: #64748b; padding: 8px; border: 1px dashed #cbd5e1; border-radius: 8px; width: 100%;">
                <div id="resubFileError" style="color: #ef4444; font-size: 0.78rem; display: none; font-weight: 600;"></div>
              </div>
              <button type="submit" id="submitResubBtn" style="background: var(--primary); color: white; border: none; padding: 10px 18px; border-radius: 8px; font-weight: 600; font-size: 0.9rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s;" onmouseenter="this.style.background='#55309d';" onmouseleave="this.style.background='var(--primary)';">
                <i class="fa-solid fa-upload"></i> Upload & Submit
              </button>
            </form>
          </div>
        `;
      }

      submissionAreaHtml = `
        <div style="margin-top: 10px; border-top: 1.5px solid #f1f5f9; padding-top: 18px;">
          <h4 style="margin: 0 0 12px 0; font-size: 1rem; font-weight: 700; color: #1e1b4b;">Your Submission</h4>
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 14px 18px; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;">
            <div style="min-width: 0;">
              <div style="font-size: 0.85rem; font-weight: 700; color: #166534; display: flex; align-items: center; gap: 6px;">
                <i class="fa-solid fa-circle-check"></i> Submitted Successfully
              </div>
              <div style="font-size: 0.78rem; color: #14532d; margin-top: 4px;">Submitted: ${submittedDateStr}</div>
              <div style="font-size: 0.8rem; color: #15803d; margin-top: 4px; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                File: <a href="${subHref}" target="_blank" style="color: var(--primary); text-decoration: underline; font-weight: 600;">${esc(subFilename)}</a>
              </div>
            </div>
            <a href="${subHref}" target="_blank" class="btn-pill" style="background: #16a34a; color: white; border: none; font-size: 0.8rem; padding: 8px 16px; text-decoration: none; font-weight: 600; border-radius: 8px; display: flex; align-items: center; gap: 6px; transition: all 0.2s;" onmouseenter="this.style.background='#15803d';" onmouseleave="this.style.background='#16a34a';">
              <i class="fa-solid fa-eye"></i> View File
            </a>
          </div>
          ${gradingHtml}
          ${reuploadFormHtml}
        </div>
      `;
    } else {
      if (isPastDeadline) {
        submissionAreaHtml = `
          <div style="margin-top: 10px; border-top: 1.5px solid #f1f5f9; padding-top: 18px;">
            <div style="background: #fef2f2; border: 1px solid #fca5a5; border-radius: 12px; padding: 16px; color: #991b1b; text-align: center; font-size: 0.9rem; font-weight: 600; display: flex; flex-direction: column; gap: 6px; align-items: center;">
              <i class="fa-solid fa-circle-xmark" style="font-size: 1.5rem; color: #dc2626;"></i>
              <div>Submission Deadline Passed</div>
              <p style="margin: 0; font-size: 0.8rem; font-weight: 500; color: #b91c1c;">You did not submit this assignment before the deadline and resubmission is closed.</p>
            </div>
          </div>
        `;
      } else {
        submissionAreaHtml = `
          <div style="margin-top: 10px; border-top: 1.5px solid #f1f5f9; padding-top: 18px;">
            <h4 style="margin: 0 0 12px 0; font-size: 1.1rem; font-weight: 700; color: #1e1b4b;">Submit Assignment</h4>
            <form id="submissionForm" style="display: flex; flex-direction: column; gap: 14px;">
              <div style="display: flex; flex-direction: column; gap: 6px;">
                <label style="font-size: 0.82rem; font-weight: 700; color: #475569;">Upload File (PDF, DOC/DOCX, PPT/PPTX, ZIP, Images - Max 5MB)</label>
                <input type="file" id="submitFile" accept=".pdf,.doc,.docx,.ppt,.pptx,.zip,image/*" required style="font-size: 0.85rem; color: #64748b; padding: 10px; border: 1px dashed #cbd5e1; border-radius: 8px; width: 100%;">
                <div id="submitFileError" style="color: #ef4444; font-size: 0.78rem; display: none; font-weight: 600;"></div>
              </div>
              <button type="submit" id="submitFormBtn" style="background: var(--primary); color: white; border: none; padding: 12px 20px; border-radius: 8px; font-weight: 600; font-size: 0.95rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s;" onmouseenter="this.style.background='#55309d';" onmouseleave="this.style.background='var(--primary)';">
                <i class="fa-solid fa-paper-plane"></i> Submit Assignment
              </button>
            </form>
          </div>
        `;
      }
    }

    const dueStr = a.deadline ? new Date(a.deadline).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'No deadline';
    const teacherName = a.teacher ? a.teacher.name : 'Faculty';

    modal.innerHTML = `
      <div class="assign-modal-content">
        <button id="closeAssignModal" style="position: absolute; top: 16px; right: 16px; background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #64748b; transition: color 0.2s;" onmouseenter="this.style.color='#1e1b4b';" onmouseleave="this.style.color='#64748b';">&times;</button>
        
        <div style="display: flex; flex-direction: column; gap: 4px;">
          <span style="font-size: 0.78rem; color: var(--primary); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">${esc(a.subject)}</span>
          <h3 style="margin: 0; font-size: 1.3rem; font-weight: 800; color: #1e1b4b; line-height: 1.3;">${esc(a.title)}</h3>
          <div style="font-size: 0.82rem; color: #64748b; margin-top: 4px; display: flex; align-items: center; gap: 4px; flex-wrap: wrap;">
            <span>Posted by: <strong>${esc(teacherName)}</strong></span>
            <span>•</span>
            <span style="color: #ef4444; font-weight: 600;">Due: ${dueStr}</span>
          </div>
        </div>

        <div style="border-top: 1px solid #f1f5f9; padding-top: 14px;">
          <h4 style="margin: 0 0 8px 0; font-size: 0.95rem; font-weight: 700; color: #475569;">Instructions</h4>
          <p style="font-size: 0.9rem; color: #334155; line-height: 1.55; white-space: pre-line; margin: 0;">${esc(a.description || 'No instructions provided.')}</p>
        </div>

        <div style="margin-top: 4px;">
          <h4 style="margin: 0 0 8px 0; font-size: 0.95rem; font-weight: 700; color: #475569;">Attached Resources</h4>
          ${attachmentHtml}
        </div>

        ${submissionAreaHtml}
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('closeAssignModal')?.addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });

    const subForm = document.getElementById('submissionForm');
    const submitFileInput = document.getElementById('submitFile');
    const submitErrorDiv = document.getElementById('submitFileError');

    if (submitFileInput) {
      submitFileInput.addEventListener('change', () => {
        validateFileInput(submitFileInput, submitErrorDiv);
      });
    }

    if (subForm) {
      subForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!validateFileInput(submitFileInput, submitErrorDiv)) return;

        const submitBtn = document.getElementById('submitFormBtn');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Submitting...';

        try {
          const token = user.token || localStorage.getItem('token') || '';
          const formData = new FormData();
          formData.append('file', submitFileInput.files[0]);

          const res = await fetch(`${apiBase}/api/assignments/${a._id}/submit`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: formData
          });

          if (res.ok) {
            alert('Assignment submitted successfully!');
            modal.remove();
            renderStudentAssignments(null);
          } else {
            const errData = await res.json();
            alert(errData.message || 'Failed to submit assignment.');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Submit Assignment';
          }
        } catch (err) {
          console.error(err);
          alert('An error occurred during submission.');
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Submit Assignment';
        }
      });
    }

    const toggleBtn = document.getElementById('toggleResubmitBtn');
    const resubForm = document.getElementById('resubmissionForm');
    const resubFileInput = document.getElementById('resubFile');
    const resubErrorDiv = document.getElementById('resubFileError');

    if (toggleBtn && resubForm) {
      toggleBtn.addEventListener('click', () => {
        resubForm.style.display = resubForm.style.display === 'none' ? 'flex' : 'none';
        toggleBtn.style.display = 'none';
      });
    }

    if (resubFileInput) {
      resubFileInput.addEventListener('change', () => {
        validateFileInput(resubFileInput, resubErrorDiv);
      });
    }

    if (resubForm) {
      resubForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!validateFileInput(resubFileInput, resubErrorDiv)) return;

        const submitBtn = document.getElementById('submitResubBtn');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Resubmitting...';

        try {
          const token = user.token || localStorage.getItem('token') || '';
          const formData = new FormData();
          formData.append('file', resubFileInput.files[0]);

          const res = await fetch(`${apiBase}/api/assignments/${a._id}/submit`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: formData
          });

          if (res.ok) {
            alert('Assignment updated successfully!');
            modal.remove();
            renderStudentAssignments(null);
          } else {
            const errData = await res.json();
            alert(errData.message || 'Failed to resubmit assignment.');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fa-solid fa-upload"></i> Upload & Submit';
          }
        } catch (err) {
          console.error(err);
          alert('An error occurred during resubmission.');
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<i class="fa-solid fa-upload"></i> Upload & Submit';
        }
      });
    }
  }

  async function renderTeacherAssignments(info) {
    content(`
      <style>
        .assign-modal-overlay {
          display: flex; position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
          background: rgba(0,0,0,0.5); z-index: 2000; justify-content: center; align-items: center; 
          backdrop-filter: blur(4px);
        }
        .assign-modal-content {
          background: white; padding: 28px; border-radius: 16px; width: 95%; max-width: 800px; 
          text-align: left; position: relative; box-shadow: var(--shadow-lg); display: flex; 
          flex-direction: column; gap: 18px; max-height: 85vh; overflow-y: auto;
        }
      </style>

      <div style="display: flex; justify-content: space-between; align-items: center; gap: 16px; margin-bottom: 28px; flex-wrap: wrap; width: 100%;">
        <div style="display: flex; align-items: center; gap: 16px;">
          <button type="button" id="assignBackBtn" style="background: #f8fafc; border: 1px solid #e2e8f0; font-size: 1.1rem; color: #475569; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 42px; height: 42px; border-radius: 50%; transition: all 0.2s;" onmouseenter="this.style.background='#e2e8f0';" onmouseleave="this.style.background='#f8fafc';">
            <i class="fa-solid fa-arrow-left"></i>
          </button>
          <div>
            <h2 style="margin: 0; font-size: 1.6rem; font-weight: 800; color: #1e1b4b; font-family: 'Poppins', sans-serif;">My Created Assignments</h2>
            <p style="margin: 4px 0 0 0; font-size: 0.9rem; color: #64748b;">View assignments you have created, track student progress, and grade submissions.</p>
          </div>
        </div>
        <div>
          <a class="btn-dashboard" href="post.html" style="background: var(--primary); color: white; border-radius: 10px; font-weight: 600; text-decoration: none; padding: 10px 18px; display: inline-flex; align-items: center; gap: 8px; transition: all 0.2s;" onmouseenter="this.style.background='#55309d';" onmouseleave="this.style.background='var(--primary)';">
            <i class="fa-solid fa-plus"></i> Post Assignment
          </a>
        </div>
      </div>

      <!-- Assignments Table Card -->
      <div class="section-card" style="padding: 24px; border-radius: 16px; background: white; border: 1px solid var(--border-color); box-shadow: var(--shadow-sm); display: flex; flex-direction: column; gap: 20px;">
        <div id="teacherAssignSubjectFilterContainer" style="display: none; align-items: center; gap: 10px; border-bottom: 1px dashed #e2e8f0; padding-bottom: 16px;">
          <label style="font-size: 0.85rem; font-weight: 700; color: #475569; white-space: nowrap;">Filter by Subject:</label>
          <select id="teacherAssignSubjectFilter" style="max-width: 280px; padding: 8px 12px; border-radius: 8px; border: 1px solid #cbd5e1; outline: none; font-size: 0.85rem; background: white; cursor: pointer; color: #475569; font-weight: 500;">
            <option value="all">All Subjects</option>
          </select>
        </div>
        <div id="teacherAssignmentsContainer">
          <div style="text-align: center; padding: 40px; color: #64748b;">
            <i class="fa-solid fa-spinner fa-spin" style="font-size: 1.5rem; margin-bottom: 8px;"></i>
            <div>Loading assignments...</div>
          </div>
        </div>
      </div>
    `);

    document.getElementById('assignBackBtn')?.addEventListener('click', goToDashboard);

    async function loadTeacherCreatedAssignments() {
      const container = document.getElementById('teacherAssignmentsContainer');
      const token = user.token || localStorage.getItem('token') || '';

      try {
        const res = await fetch(`${apiBase}/api/assignments/created`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.status === 401) {
          localStorage.removeItem('user');
          window.location.href = `${getRootPrefix()}index.html`;
          return;
        }
        if (!res.ok) throw new Error();
        let assignments = await res.json();
        assignments = assignments.filter(a => a.type !== 'note');

        if (assignments.length === 0) {
          container.innerHTML = `
            <div class="module-empty">
              <i class="fa-regular fa-folder-open"></i>
              <span>No assignments created yet. Click "+ Post Assignment" to make one.</span>
            </div>
          `;
          return;
        }

        const uniqueSubjects = [...new Set(assignments.map(a => a.subject))].filter(Boolean);
        const filterContainer = document.getElementById('teacherAssignSubjectFilterContainer');
        const filterSelect = document.getElementById('teacherAssignSubjectFilter');

        if (uniqueSubjects.length > 1 && filterContainer && filterSelect) {
          const currentVal = filterSelect.value || 'all';
          filterSelect.innerHTML = '<option value="all">All Subjects</option>' +
            uniqueSubjects.map(sub => `<option value="${esc(sub)}">${esc(sub)}</option>`).join('');
          filterSelect.value = currentVal;
          filterContainer.style.display = 'flex';

          if (!filterSelect.dataset.listenerBound) {
            filterSelect.addEventListener('change', () => {
              renderTableList(filterSelect.value);
            });
            filterSelect.dataset.listenerBound = 'true';
          }
        } else if (filterContainer) {
          filterContainer.style.display = 'none';
        }

        function renderTableList(subjectFilter = 'all') {
          let listToShow = assignments;
          if (subjectFilter !== 'all') {
            listToShow = assignments.filter(a => a.subject === subjectFilter);
          }

          if (listToShow.length === 0) {
            container.innerHTML = `
              <div class="module-empty">
                <i class="fa-regular fa-folder-open"></i>
                <span>No assignments matching "${esc(subjectFilter)}".</span>
              </div>
            `;
            return;
          }

          container.innerHTML = `
            <div class="module-table-wrap">
              <table class="module-table dashboard-table" style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="border-bottom: 2px solid #f1f5f9; text-align: left;">
                    <th style="padding: 12px 16px; color: #475569; font-weight: 600;">Assignment Details</th>
                    <th style="padding: 12px 16px; color: #475569; font-weight: 600;">Class Target</th>
                    <th style="padding: 12px 16px; color: #475569; font-weight: 600;">Due Date</th>
                    <th style="padding: 12px 16px; color: #475569; font-weight: 600; text-align: center;">Submissions</th>
                    <th style="padding: 12px 16px; color: #475569; font-weight: 600; text-align: center;">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${listToShow.map(a => {
                    const deadlineStr = a.deadline ? new Date(a.deadline).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A';
                    const targetStr = `${esc(a.department)} - ${esc(a.year)} (Batch ${esc(a.batch)})`;
                    const subCount = a.submissionCount || 0;
                    const totalStudents = a.totalStudents || 0;
                    const subBadge = subCount > 0 
                      ? `<span style="background: #f5f3ff; color: #6d28d9; border: 1px solid #ddd6fe; padding: 6px 12px; border-radius: 20px; font-size: 0.85rem; font-weight: 600; display: inline-flex; align-items: center; gap: 6px;"><i class="fa-solid fa-file-arrow-up"></i> ${subCount}/${totalStudents}</span>`
                      : `<span style="background: #f8fafc; color: #64748b; border: 1px solid #e2e8f0; padding: 6px 12px; border-radius: 20px; font-size: 0.85rem; font-weight: 600; display: inline-flex; align-items: center; gap: 6px;"><i class="fa-regular fa-file"></i> 0/${totalStudents}</span>`;
                    
                    return `
                      <tr style="border-bottom: 1px solid #f1f5f9; transition: background 0.2s;" onmouseenter="this.style.background='#f8fafc';" onmouseleave="this.style.background='none';">
                        <td style="padding: 16px; min-width: 200px;">
                          <div style="font-weight: 700; color: #1e1b4b; font-size: 0.98rem; margin-bottom: 4px;">${esc(a.title)}</div>
                          <div style="font-size: 0.8rem; color: var(--primary); font-weight: 600; text-transform: uppercase;">${esc(a.subject)}</div>
                        </td>
                        <td style="padding: 16px; color: #475569; font-size: 0.9rem;">${targetStr}</td>
                        <td style="padding: 16px; color: #475569; font-size: 0.9rem;">${deadlineStr}</td>
                        <td style="padding: 16px; color: #475569; font-size: 0.9rem; text-align: center;">${subBadge}</td>
                        <td style="padding: 16px; text-align: center;">
                          <button class="btn-pill view-submissions-btn" data-id="${a._id}" data-title="${esc(a.title)}" style="background: var(--primary); color: white; font-weight: 600; font-size: 0.82rem; padding: 8px 16px; border: none; border-radius: 8px; cursor: pointer; transition: all 0.2s;" onmouseenter="this.style.background='#55309d';" onmouseleave="this.style.background='var(--primary)';">
                            <i class="fa-solid fa-list-check"></i> Submissions
                          </button>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          `;

          container.querySelectorAll('.view-submissions-btn').forEach(btn => {
            btn.addEventListener('click', () => {
              const id = btn.dataset.id;
              const title = btn.dataset.title;
              openTeacherSubmissionsModal(id, title);
            });
          });
        }

        renderTableList(filterSelect ? filterSelect.value : 'all');

      } catch (err) {
        console.error(err);
        container.innerHTML = `<div class="module-empty" style="color: red;">Failed to load assignments list.</div>`;
      }
    }

    await loadTeacherCreatedAssignments();
  }

  async function openTeacherSubmissionsModal(assignmentId, title) {
    const modal = document.createElement('div');
    modal.className = 'assign-modal-overlay';
    modal.id = 'submissions-list-modal';

    modal.innerHTML = `
      <div class="assign-modal-content">
        <button id="closeSubmissionsModal" style="position: absolute; top: 16px; right: 16px; background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #64748b; transition: color 0.2s;" onmouseenter="this.style.color='#1e1b4b';" onmouseleave="this.style.color='#64748b';">&times;</button>
        
        <div>
          <h3 style="margin: 0 0 4px 0; font-size: 1.25rem; font-weight: 800; color: #1e1b4b; line-height: 1.3;">Submissions</h3>
          <p style="margin: 0; font-size: 0.85rem; color: var(--primary); font-weight: 600;">For Assignment: ${esc(title)}</p>
        </div>

        <div id="submissionsTableContainer" style="margin-top: 10px; overflow-y: auto; max-height: 60vh;">
          <div style="text-align: center; padding: 40px; color: #64748b;">
            <i class="fa-solid fa-spinner fa-spin" style="font-size: 1.5rem; margin-bottom: 8px;"></i>
            <div>Loading submissions...</div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('closeSubmissionsModal')?.addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });

    async function loadSubmissions() {
      const container = document.getElementById('submissionsTableContainer');
      const token = user.token || localStorage.getItem('token') || '';

      try {
        const res = await fetch(`${apiBase}/api/assignments/${assignmentId}/submissions`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) throw new Error();
        const submissions = await res.json();

        if (submissions.length === 0) {
          container.innerHTML = `
            <div class="module-empty" style="padding: 40px 20px;">
              <i class="fa-regular fa-folder-open"></i>
              <span>No submissions received yet for this assignment.</span>
            </div>
          `;
          return;
        }

        container.innerHTML = `
          <div class="module-table-wrap">
            <table class="module-table dashboard-table" style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="border-bottom: 2px solid #f1f5f9; text-align: left;">
                  <th style="padding: 10px 12px; color: #475569; font-weight: 600; font-size: 0.85rem;">Student</th>
                  <th style="padding: 10px 12px; color: #475569; font-weight: 600; font-size: 0.85rem;">Roll Number</th>
                  <th style="padding: 10px 12px; color: #475569; font-weight: 600; font-size: 0.85rem;">Submitted At</th>
                  <th style="padding: 10px 12px; color: #475569; font-weight: 600; font-size: 0.85rem;">File Link</th>
                  <th style="padding: 10px 12px; color: #475569; font-weight: 600; font-size: 0.85rem; text-align: right;">Action</th>
                </tr>
              </thead>
              <tbody>
                ${submissions.map(sub => {
                  const studentName = sub.student ? sub.student.name : 'Unknown';
                  const rollNo = sub.student ? sub.student.rollNumber : 'N/A';
                  const submittedDate = sub.submittedAt ? new Date(sub.submittedAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'N/A';
                  
                  let subHref = sub.link;
                  if (sub.link.startsWith('/')) {
                    subHref = apiBase + subHref;
                  }

                  const isSubGraded = sub.status === 'Approved' || sub.status === 'Graded' || sub.grade !== undefined;

                  return `
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                      <td style="padding: 12px 10px; font-weight: 600; color: #1e1b4b; font-size: 0.88rem;">${esc(studentName)}</td>
                      <td style="padding: 12px 10px; color: #475569; font-size: 0.85rem;">${esc(rollNo)}</td>
                      <td style="padding: 12px 10px; color: #64748b; font-size: 0.8rem;">${submittedDate}</td>
                      <td style="padding: 12px 10px; font-size: 0.85rem;">
                        <a href="${subHref}" target="_blank" style="color: var(--primary); font-weight: 600; text-decoration: none; display: inline-flex; align-items: center; gap: 4px;">
                          <i class="fa-solid fa-file-pdf"></i> View File
                        </a>
                      </td>
                      <td style="padding: 12px 10px; text-align: right;">
                        <button class="btn-pill open-grade-panel-btn" data-sub-id="${sub._id}" style="background: none; border: 1px solid #cbd5e1; color: #475569; font-weight: 600; font-size: 0.78rem; padding: 6px 12px; border-radius: 6px; cursor: pointer; transition: all 0.2s;" onmouseenter="this.style.borderColor='var(--primary)'; this.style.color='var(--primary)';" onmouseleave="this.style.borderColor='#cbd5e1'; this.style.color='#475569';">
                          ${isSubGraded ? 'Edit Grade' : 'Grade'}
                        </button>
                      </td>
                    </tr>
                    <tr id="grade-panel-row-${sub._id}" style="display: none; background: #f8fafc;">
                      <td colspan="5" style="padding: 16px 20px; border-bottom: 1px solid #f1f5f9;">
                        <form class="grade-submission-form" data-sub-id="${sub._id}">
                          <div style="display: grid; grid-template-columns: 1fr 2fr 1fr; gap: 16px; align-items: flex-end;">
                            <div style="display: flex; flex-direction: column; gap: 4px;">
                              <label style="font-size: 0.78rem; font-weight: 700; color: #475569;">Marks / Grade</label>
                              <input type="text" class="grade-input" value="${esc(sub.grade || '')}" required placeholder="e.g. 95/100, A+" style="padding: 8px 12px; border-radius: 6px; border: 1px solid #cbd5e1; outline: none; font-size: 0.85rem;">
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 4px;">
                              <label style="font-size: 0.78rem; font-weight: 700; color: #475569;">Teacher Feedback</label>
                              <input type="text" class="feedback-input" value="${esc(sub.feedback || '')}" placeholder="Write constructive feedback..." style="padding: 8px 12px; border-radius: 6px; border: 1px solid #cbd5e1; outline: none; font-size: 0.85rem;">
                            </div>
                            <div style="display: flex; gap: 8px;">
                              <button type="submit" style="background: #16a34a; color: white; border: none; padding: 9px 16px; border-radius: 6px; font-weight: 600; font-size: 0.82rem; cursor: pointer; transition: all 0.2s; flex: 1;" onmouseenter="this.style.background='#15803d';" onmouseleave="this.style.background='#16a34a';">Save</button>
                              <button type="button" class="cancel-grade-btn" data-sub-id="${sub._id}" style="background: none; border: 1px solid #cbd5e1; color: #475569; padding: 9px 12px; border-radius: 6px; font-weight: 600; font-size: 0.82rem; cursor: pointer;" onmouseenter="this.style.background='#e2e8f0';" onmouseleave="this.style.background='none';">Cancel</button>
                            </div>
                          </div>
                        </form>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        `;

        container.querySelectorAll('.open-grade-panel-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const subId = btn.dataset.subId;
            const panelRow = document.getElementById(`grade-panel-row-${subId}`);
            if (panelRow) {
              panelRow.style.display = panelRow.style.display === 'none' ? 'table-row' : 'none';
            }
          });
        });

        container.querySelectorAll('.cancel-grade-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const subId = btn.dataset.subId;
            const panelRow = document.getElementById(`grade-panel-row-${subId}`);
            if (panelRow) panelRow.style.display = 'none';
          });
        });

        container.querySelectorAll('.grade-submission-form').forEach(form => {
          form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const subId = form.dataset.subId;
            const grade = form.querySelector('.grade-input').value;
            const feedback = form.querySelector('.feedback-input').value;

            try {
              const resUpdate = await fetch(`${apiBase}/api/assignments/${assignmentId}/submissions/${subId}/status`, {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                  status: 'Approved',
                  grade,
                  feedback
                })
              });

              if (resUpdate.ok) {
                alert('Submission graded successfully!');
                loadSubmissions();
              } else {
                const errData = await resUpdate.json();
                alert(errData.message || 'Failed to submit grade.');
              }
            } catch (err) {
              console.error(err);
              alert('Error occurred during grading.');
            }
          });
        });

      } catch (err) {
        console.error(err);
        container.innerHTML = `<div class="module-empty" style="color: red;">Failed to load submissions list.</div>`;
      }
    }

    await loadSubmissions();
  }

  function renderTeacherPostForm(info) {
    // Normalization Functions
    function normalizeDepartment(val) {
      if (!val) return '';
      const trimmed = val.trim();
      const lower = trimmed.toLowerCase();
      if (lower === 'cse' || lower === 'computer science' || lower === 'computer science engineering' || lower === 'computer science & engineering') {
        return 'CSE';
      }
      if (lower === 'it' || lower === 'information technology') {
        return 'IT';
      }
      if (lower === 'ece' || lower === 'electronics' || lower === 'electronics & communication' || lower === 'electronics & communication engineering') {
        return 'ECE';
      }
      if (lower === 'me' || lower === 'mechanical' || lower === 'mechanical engineering') {
        return 'ME';
      }
      if (lower === 'ce' || lower === 'civil' || lower === 'civil engineering') {
        return 'CE';
      }
      if (lower === 'civil' || lower === 'civil engineering') {
        return 'Civil Engineering';
      }
      if (lower === 'mechanical' || lower === 'mechanical engineering') {
        return 'Mechanical Engineering';
      }
      if (lower === 'electrical' || lower === 'ee' || lower === 'electrical engineering') {
        return 'Electrical Engineering';
      }
      if (lower === 'mba') {
        return 'MBA';
      }
      if (lower === 'pharmacy') {
        return 'Pharmacy';
      }
      if (lower === 'architecture') {
        return 'Architecture';
      }
      // Capitalize words
      return trimmed.split(/\s+/).map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
    }

    function normalizeSubject(val) {
      if (!val) return '';
      const trimmed = val.trim();
      const lower = trimmed.toLowerCase();
      
      const smallWords = ['and', 'of', 'to', 'in', 'for', 'with', 'on', 'at', 'by', 'a', 'an', 'the', 'or', 'but'];
      const acronyms = ['dbms', 'ai', 'ml', 'os', 'cn', 'dsa', 'toc', 'coa', 'oop', 'oops'];
      
      return trimmed.split(/\s+/).map((word, idx) => {
        const wordLower = word.toLowerCase();
        if (acronyms.includes(wordLower)) {
          return word.toUpperCase();
        }
        if (smallWords.includes(wordLower) && idx > 0) {
          return wordLower;
        }
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      }).join(' ');
    }

    function normalizeBatch(val) {
      if (!val) return '';
      const trimmed = val.trim();
      const lower = trimmed.toLowerCase();
      if (lower === 'all') return 'All';
      if (lower === '1') return 'Batch 1';
      if (lower === '2') return 'Batch 2';
      if (/^batch\s*1$/i.test(trimmed)) return 'Batch 1';
      if (/^batch\s*2$/i.test(trimmed)) return 'Batch 2';
      return trimmed.split(/\s+/).map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
    }

    content(`
      <div style="display: flex; justify-content: space-between; align-items: center; gap: 16px; margin-bottom: 28px; flex-wrap: wrap; width: 100%;">
        <div style="display: flex; align-items: center; gap: 16px;">
          <button type="button" id="assignBackBtn" style="background: #f8fafc; border: 1px solid #e2e8f0; font-size: 1.1rem; color: #475569; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 42px; height: 42px; border-radius: 50%; transition: all 0.2s;" onmouseenter="this.style.background='#e2e8f0';" onmouseleave="this.style.background='#f8fafc';">
            <i class="fa-solid fa-arrow-left"></i>
          </button>
          <div>
            <h2 style="margin: 0; font-size: 1.6rem; font-weight: 800; color: #1e1b4b; font-family: 'Poppins', sans-serif;">Post New Assignment</h2>
            <p style="margin: 4px 0 0 0; font-size: 0.9rem; color: #64748b;">Create and target assignments to specific departments, classes, and batches.</p>
          </div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 32px; align-items: start;">
        <div class="section-card" style="padding: 28px; border-radius: 16px; background: white; border: 1px solid var(--border-color); box-shadow: var(--shadow-sm);">
          <form id="createAssignmentForm" style="display: flex; flex-direction: column; gap: 18px;">
            <div style="display: flex; flex-direction: column; gap: 6px;">
              <label style="font-size: 0.85rem; font-weight: 600; color: #475569;">Assignment Title</label>
              <input type="text" id="assignTitle" placeholder="e.g. Chapter 1 Homework" required style="padding: 12px 16px; border-radius: 10px; border: 1px solid #cbd5e1; outline: none; font-size: 0.95rem; font-family: inherit; transition: border-color 0.2s;" onfocus="this.style.borderColor='var(--primary)';" onblur="this.style.borderColor='#cbd5e1';">
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
              <div style="display: flex; flex-direction: column; gap: 6px;">
                <label style="font-size: 0.85rem; font-weight: 600; color: #475569;">Subject</label>
                <select id="assignSubject" required style="padding: 12px 16px; border-radius: 10px; border: 1px solid #cbd5e1; outline: none; font-size: 0.95rem; background: white; cursor: pointer;">
                  <option value="">Select Subject</option>
                </select>
                <div id="assignSubjectCustomContainer" style="display: flex; flex-direction: column;"></div>
              </div>
              <div style="display: flex; flex-direction: column; gap: 6px;">
                <label style="font-size: 0.85rem; font-weight: 600; color: #475569;">Department</label>
                <select id="assignDept" required style="padding: 12px 16px; border-radius: 10px; border: 1px solid #cbd5e1; outline: none; font-size: 0.95rem; background: white; cursor: pointer;">
                  <option value="">Select Dept</option>
                </select>
                <div id="assignDeptCustomContainer" style="display: flex; flex-direction: column;"></div>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
              <div style="display: flex; flex-direction: column; gap: 6px;">
                <label style="font-size: 0.85rem; font-weight: 600; color: #475569;">Target Year</label>
                <select id="assignYear" required style="padding: 12px 16px; border-radius: 10px; border: 1px solid #cbd5e1; outline: none; font-size: 0.95rem; background: white; cursor: pointer;">
                  <option value="">Select Year</option>
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                </select>
              </div>
              <div style="display: flex; flex-direction: column; gap: 6px;">
                <label style="font-size: 0.85rem; font-weight: 600; color: #475569;">Target Batch</label>
                <select id="assignBatch" required style="padding: 12px 16px; border-radius: 10px; border: 1px solid #cbd5e1; outline: none; font-size: 0.95rem; background: white; cursor: pointer;">
                  <option value="">Select Batch</option>
                </select>
              </div>
            </div>

            <div style="display: flex; flex-direction: column; gap: 6px;">
              <label style="font-size: 0.85rem; font-weight: 600; color: #475569;">Submission Deadline</label>
              <input type="datetime-local" id="assignDeadline" required style="padding: 12px 16px; border-radius: 10px; border: 1px solid #cbd5e1; outline: none; font-size: 0.95rem; font-family: inherit;">
            </div>

            <div style="display: flex; flex-direction: column; gap: 6px;">
              <label style="font-size: 0.85rem; font-weight: 600; color: #475569;">Instructions / Description</label>
              <textarea id="assignDesc" rows="6" placeholder="Describe the assignment questions, resources, guidelines, and rules..." required style="padding: 12px 16px; border-radius: 10px; border: 1px solid #cbd5e1; outline: none; font-size: 0.95rem; font-family: inherit; resize: vertical; transition: border-color 0.2s;" onfocus="this.style.borderColor='var(--primary)';" onblur="this.style.borderColor='#cbd5e1';"></textarea>
            </div>

            <div style="display: flex; flex-direction: column; gap: 6px;">
              <label style="font-size: 0.85rem; font-weight: 600; color: #475569;">Resource Attachment (PDF, Word, PPT, ZIP, Image - Max 5MB)</label>
              <input type="file" id="assignFile" accept=".pdf,.doc,.docx,.ppt,.pptx,.zip,image/*" style="font-size: 0.85rem; color: #64748b; padding: 10px; border: 1px dashed #cbd5e1; border-radius: 8px;">
              <div id="assignFileError" style="color: #ef4444; font-size: 0.78rem; display: none; font-weight: 600;"></div>
            </div>



            <button type="submit" id="createFormSubmitBtn" style="background: var(--primary); color: white; border: none; padding: 12px 20px; border-radius: 10px; font-weight: 600; font-size: 0.95rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 8px; transition: all 0.2s;" onmouseenter="this.style.background='#55309d';" onmouseleave="this.style.background='var(--primary)';">
              <i class="fa-solid fa-paper-plane"></i> Publish Assignment
            </button>
          </form>
        </div>

        <div class="section-card" style="padding: 24px; border-radius: 16px; background: white; border: 1px solid var(--border-color); box-shadow: var(--shadow-sm); display: flex; flex-direction: column; gap: 18px;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; padding-bottom: 12px; margin-bottom: 4px;">
            <h4 style="margin: 0; font-size: 1.1rem; font-weight: 700; color: #1e1b4b; display: flex; align-items: center; gap: 8px;">
              <i class="fa-solid fa-clock-rotate-left" style="color: var(--primary);"></i> Previous Assignments
            </h4>
            <a href="view.html" style="font-size: 0.82rem; font-weight: 600; color: var(--primary); text-decoration: none; display: inline-flex; align-items: center; gap: 4px; transition: all 0.2s;" onmouseenter="this.style.color='#55309d';" onmouseleave="this.style.color='var(--primary)';">
              View All <i class="fa-solid fa-arrow-right-long"></i>
            </a>
          </div>

          <!-- Dynamic Subject Filter Dropdown -->
          <div id="prevAssignSubjectFilterContainer" style="display: none; border-bottom: 1px dashed #e2e8f0; padding-bottom: 12px; margin-bottom: 4px;">
            <label style="font-size: 0.78rem; font-weight: 700; color: #475569; display: block; margin-bottom: 6px;">Filter by Subject:</label>
            <select id="prevAssignSubjectFilter" style="width: 100%; padding: 8px 12px; border-radius: 8px; border: 1px solid #cbd5e1; outline: none; font-size: 0.82rem; background: white; cursor: pointer; color: #475569; font-weight: 500;">
              <option value="all">All Subjects</option>
            </select>
          </div>

          <div id="previousAssignmentsContainer" style="display: flex; flex-direction: column; gap: 14px;">
            <div style="text-align: center; padding: 30px; color: #64748b;">
              <i class="fa-solid fa-spinner fa-spin" style="font-size: 1.5rem; margin-bottom: 8px;"></i>
              <div>Loading previous assignments...</div>
            </div>
          </div>
        </div>
      </div>
    `);

    document.getElementById('assignBackBtn')?.addEventListener('click', goToDashboard);

    let metadata = { subjects: [], departments: [], batches: [] };

    // Helper function to setup dynamic custom input injection
    function setupDynamicCustomInput(selectId, containerId, inputId, placeholder) {
      const selectEl = document.getElementById(selectId);
      const containerEl = document.getElementById(containerId);
      if (!selectEl || !containerEl) return;
      
      selectEl.addEventListener('change', () => {
        if (selectEl.value === '__other__') {
          containerEl.innerHTML = `
            <input type="text" id="${inputId}" placeholder="${placeholder}" required style="margin-top: 8px; padding: 12px 16px; border-radius: 10px; border: 1px solid #cbd5e1; outline: none; font-size: 0.95rem; font-family: inherit; width: 100%; box-sizing: border-box; transition: border-color 0.2s;" onfocus="this.style.borderColor='var(--primary)';" onblur="this.style.borderColor='#cbd5e1';">
          `;
          const inputEl = document.getElementById(inputId);
          if (inputEl) {
            inputEl.focus();
          }
        } else {
          containerEl.innerHTML = '';
        }
      });
    }

    setupDynamicCustomInput('assignSubject', 'assignSubjectCustomContainer', 'assignSubjectCustom', 'Enter custom subject...');
    setupDynamicCustomInput('assignDept', 'assignDeptCustomContainer', 'assignDeptCustom', 'Enter custom department...');

    const enforcedSubjects = user.enforcedSubjects || [];
    const teachingSubjects = user.teachingSubjects || [];
    const expertise = user.expertise || [];
    
    // Build a unified list of assigned subjects
    const assignedSubjects = [];
    enforcedSubjects.forEach(s => {
      if (!assignedSubjects.some(as => as.name === s.name)) {
        assignedSubjects.push({
          name: s.name,
          year: s.year,
          department: s.department,
          allowedBatches: s.allowedBatches
        });
      }
    });
    teachingSubjects.forEach(s => {
      const sName = typeof s === 'string' ? s : (s && s.name ? s.name : '');
      if (sName && !assignedSubjects.some(as => as.name === sName)) {
        assignedSubjects.push({
          name: sName,
          year: s && s.year ? s.year : undefined,
          department: s && s.department ? s.department : undefined,
          allowedBatches: s && s.allowedBatches ? s.allowedBatches : undefined
        });
      }
    });
    expertise.forEach(s => {
      const sName = typeof s === 'string' ? s : (s && s.name ? s.name : '');
      if (sName && !assignedSubjects.some(as => as.name === sName)) {
        assignedSubjects.push({
          name: sName,
          year: s && s.year ? s.year : undefined,
          department: s && s.department ? s.department : undefined,
          allowedBatches: s && s.allowedBatches ? s.allowedBatches : undefined
        });
      }
    });

    const hasAssignedSubjects = assignedSubjects.length > 0;

    const deptSelect = document.getElementById('assignDept');
    const subjectSelect = document.getElementById('assignSubject');
    const yearSelect = document.getElementById('assignYear');
    const batchSelect = document.getElementById('assignBatch');

    // Helper to extract normalized value from select or custom text input, with predefined-normalizer matching
    function getNormalizedValue(selectId, customInputId, normalizer) {
      const selectEl = document.getElementById(selectId);
      const customEl = document.getElementById(customInputId);
      let rawVal = '';
      if (selectEl.value === '__other__' && customEl) {
        rawVal = customEl.value;
      } else {
        rawVal = selectEl.value;
      }
      
      const normalized = normalizer ? normalizer(rawVal) : rawVal.trim();
      
      // If we typed a custom value, check if it matches any predefined option after normalization
      if (selectEl.value === '__other__') {
        for (let i = 0; i < selectEl.options.length; i++) {
          const optVal = selectEl.options[i].value;
          if (optVal && optVal !== '__other__') {
            const optNorm = normalizer ? normalizer(optVal) : optVal.trim();
            if (optNorm.toLowerCase() === normalized.toLowerCase()) {
              return optVal; // Normalize to exact predefined option string
            }
          }
        }
      }
      return normalized;
    }

    function populateDepartments(metaDepts) {
      if (user.department) {
        const deptNorm = normalizeDepartment(user.department);
        deptSelect.innerHTML = `<option value="${deptNorm}">${deptNorm}</option>`;
        deptSelect.value = deptNorm;
        deptSelect.disabled = true;
        return;
      }

      const defaultDepts = ['CSE', 'IT', 'ECE', 'ME', 'CE', 'Civil Engineering', 'Mechanical Engineering', 'Electrical Engineering', 'MBA', 'Pharmacy', 'Architecture'];
      const deptsSet = new Set();
      defaultDepts.forEach(d => deptsSet.add(normalizeDepartment(d)));
      if (metaDepts && metaDepts.length > 0) {
        metaDepts.forEach(d => deptsSet.add(normalizeDepartment(d)));
      }
      
      let html = '<option value="">Select Dept</option>';
      deptsSet.forEach(d => {
        html += `<option value="${d}">${d}</option>`;
      });
      html += '<option value="__other__">Other (Enter custom value)...</option>';
      deptSelect.innerHTML = html;
      deptSelect.disabled = false;
    }

    function populateSubjects(metaSubjects) {
      const subjectsSet = new Set();
      let html = '<option value="">Select Subject</option>';
      
      if (hasAssignedSubjects) {
        assignedSubjects.forEach(s => {
          html += `<option value="${s.name}">${s.name}</option>`;
        });
      } else {
        const teachSubs = (user.teachingSubjects && user.teachingSubjects.length > 0) ? user.teachingSubjects : (user.expertise || []);
        teachSubs.forEach(s => {
          const sName = typeof s === 'string' ? s : (s && s.name ? s.name : '');
          if (sName) {
            html += `<option value="${sName}">${sName}</option>`;
            subjectsSet.add(normalizeSubject(sName));
          }
        });
        
        if (metaSubjects && metaSubjects.length > 0) {
          metaSubjects.forEach(s => {
            const norm = normalizeSubject(s);
            if (!subjectsSet.has(norm)) {
              html += `<option value="${s}">${s}</option>`;
              subjectsSet.add(norm);
            }
          });
        }
        
        html += '<option value="__other__">Other (Enter custom value)...</option>';
      }
      subjectSelect.innerHTML = html;
    }

    function populateBatches() {
      const defaultBatches = ['Batch 1', 'Batch 2'];
      let html = '<option value="">Select Batch</option>';
      defaultBatches.forEach(b => {
        html += `<option value="${b}">${b}</option>`;
      });
      batchSelect.innerHTML = html;
    }

    subjectSelect.addEventListener('change', (e) => {
      const selectedSubjectName = e.target.value;
      const subjectData = assignedSubjects.find(s => s.name === selectedSubjectName);

      const customYearContainer = document.getElementById('assignYearCustomContainer');
      const customDeptContainer = document.getElementById('assignDeptCustomContainer');
      const customBatchContainer = document.getElementById('assignBatchCustomContainer');

      // Clear custom containers by default
      if (customYearContainer) customYearContainer.innerHTML = '';
      if (customDeptContainer) customDeptContainer.innerHTML = '';
      if (customBatchContainer) customBatchContainer.innerHTML = '';

      if (!subjectData) {
        if (hasAssignedSubjects) {
          // If teacher has assigned subjects, keep targeting options disabled until a subject is chosen
          deptSelect.innerHTML = '<option value="">Select Subject First</option>';
          deptSelect.disabled = true;
          yearSelect.innerHTML = '<option value="">Select Subject First</option>';
          yearSelect.disabled = true;
          batchSelect.innerHTML = '<option value="">Select Subject First</option>';
          batchSelect.disabled = true;
        } else {
          // Normal fallback flow
          deptSelect.disabled = false;
          populateDepartments(metadata.departments);

          yearSelect.disabled = false;
          let yearHtml = '<option value="">Select Year</option>' +
            ['1st Year', '2nd Year', '3rd Year', '4th Year'].map(y => `<option value="${y}">${y}</option>`).join('');
          yearSelect.innerHTML = yearHtml;
          yearSelect.value = "";

          batchSelect.disabled = false;
          populateBatches();
        }
        return;
      }

      // Predefined Department Rule
      const predefinedDept = subjectData.department || user.department;
      if (predefinedDept) {
        deptSelect.innerHTML = `<option value="${predefinedDept}">${predefinedDept}</option>`;
        deptSelect.value = predefinedDept;
        deptSelect.disabled = true;
      } else {
        deptSelect.disabled = false;
        populateDepartments(metadata.departments);
      }

      // Predefined Year Rule
      const predefinedYear = subjectData.year;
      if (predefinedYear) {
        yearSelect.innerHTML = `<option value="${predefinedYear}">${predefinedYear}</option>`;
        yearSelect.value = predefinedYear;
        yearSelect.disabled = true;
      } else {
        yearSelect.disabled = false;
        let yearHtml = '<option value="">Select Year</option>' +
          ['1st Year', '2nd Year', '3rd Year', '4th Year'].map(y => `<option value="${y}">${y}</option>`).join('');
        yearSelect.innerHTML = yearHtml;
        yearSelect.value = "";
      }

      // Predefined Batch Rule
      const predefinedBatches = subjectData.allowedBatches;
      if (predefinedBatches && predefinedBatches.length > 0) {
        batchSelect.innerHTML = predefinedBatches.map(b => {
          const norm = normalizeBatch(b);
          return `<option value="${norm}">${norm}</option>`;
        }).join('');
        if (predefinedBatches.length === 1) {
          batchSelect.value = normalizeBatch(predefinedBatches[0]);
          batchSelect.disabled = true;
        } else {
          batchSelect.innerHTML = '<option value="">Select Batch</option>' + batchSelect.innerHTML;
          batchSelect.value = "";
          batchSelect.disabled = false;
        }
      } else {
        batchSelect.disabled = false;
        populateBatches();
      }
    });

    // Initial population with empty metadata
    if (hasAssignedSubjects) {
      deptSelect.innerHTML = '<option value="">Select Subject First</option>';
      deptSelect.disabled = true;
      yearSelect.innerHTML = '<option value="">Select Subject First</option>';
      yearSelect.disabled = true;
      batchSelect.innerHTML = '<option value="">Select Subject First</option>';
      batchSelect.disabled = true;
    } else {
      populateDepartments([]);
      populateBatches();
    }
    populateSubjects([]);

    // Fetch and enrich choices with persisted custom values
    (async () => {
      try {
        const token = user.token || localStorage.getItem('token') || '';
        const resMeta = await fetch(`${apiBase}/api/assignments/metadata`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (resMeta.ok) {
          const meta = await resMeta.json();
          metadata = meta;
          
          if (hasAssignedSubjects) {
            populateSubjects(meta.subjects);
          } else {
            populateDepartments(meta.departments);
            populateSubjects(meta.subjects);
            populateBatches();
          }
        }
      } catch (err) {
        console.error('Error loading metadata:', err);
      }
    })();

    const fileInput = document.getElementById('assignFile');
    const fileError = document.getElementById('assignFileError');
    if (fileInput) {
      fileInput.addEventListener('change', () => {
        validateFileInput(fileInput, fileError);
      });
    }

    const form = document.getElementById('createAssignmentForm');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (fileInput.files.length > 0 && !validateFileInput(fileInput, fileError)) return;

      const submitBtn = document.getElementById('createFormSubmitBtn');

      const titleVal = document.getElementById('assignTitle').value.trim();
      const subjectVal = getNormalizedValue('assignSubject', 'assignSubjectCustom', normalizeSubject);
      const deptVal = getNormalizedValue('assignDept', 'assignDeptCustom', normalizeDepartment);
      const yearVal = getNormalizedValue('assignYear', 'assignYearCustom', null);
      const batchVal = getNormalizedValue('assignBatch', 'assignBatchCustom', normalizeBatch);
      const deadlineVal = document.getElementById('assignDeadline').value;
      const descVal = document.getElementById('assignDesc').value.trim();

      if (!titleVal) { alert('Title is required.'); return; }
      if (!subjectVal) { alert('Subject is required.'); return; }
      if (!deptVal) { alert('Department is required.'); return; }
      if (!yearVal) { alert('Target Year is required.'); return; }
      if (!batchVal) { alert('Target Batch is required.'); return; }
      if (!deadlineVal) { alert('Submission Deadline is required.'); return; }

      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Publishing...';

      try {
        const token = user.token || localStorage.getItem('token') || '';
        const formData = new FormData();
        formData.append('title', titleVal);
        formData.append('subject', subjectVal);
        formData.append('department', deptVal);
        formData.append('year', yearVal);
        formData.append('batch', batchVal);
        formData.append('deadline', deadlineVal);
        formData.append('description', descVal);
        
        if (fileInput.files.length > 0) {
          formData.append('file', fileInput.files[0]);
        }

        const res = await fetch(`${apiBase}/api/assignments`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        });

        if (res.ok) {
          alert('Assignment published successfully!');
          window.location.href = 'view.html';
        } else {
          const errData = await res.json();
          alert(errData.message || 'Failed to publish assignment.');
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Publish Assignment';
        }
      } catch (err) {
        console.error(err);
        alert('Server error during publication.');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Publish Assignment';
      }
    });

    async function loadPreviousAssignmentsShortList() {
      const container = document.getElementById('previousAssignmentsContainer');
      if (!container) return;
      const token = user.token || localStorage.getItem('token') || '';

      try {
        const res = await fetch(`${apiBase}/api/assignments/created`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) throw new Error();
        let assignments = await res.json();
        assignments = assignments.filter(a => a.type !== 'note');

        if (assignments.length === 0) {
          container.innerHTML = `
            <div style="text-align: center; padding: 40px 10px; color: #64748b; font-size: 0.9rem;">
              <i class="fa-regular fa-folder-open" style="font-size: 2rem; margin-bottom: 8px; color: #cbd5e1; display: block;"></i>
              <span>No assignments posted yet. Create your first assignment.</span>
            </div>
          `;
          return;
        }

        const now = new Date();

        // Compute status for each assignment
        assignments.forEach(a => {
          const deadlineDate = a.deadline ? new Date(a.deadline) : null;
          let status = 'Expired';
          if (deadlineDate) {
            const diff = deadlineDate.getTime() - now.getTime();
            if (diff < 0) {
              status = 'Expired';
            } else if (diff <= 7 * 24 * 60 * 60 * 1000) { // 7 days
              status = 'Active';
            } else {
              status = 'Upcoming';
            }
          } else {
            status = 'Active';
          }
          a.computedStatus = status;
        });

        // Sort assignments:
        // 1. Active assignments (nearest deadline first)
        // 2. Upcoming assignments (nearest deadline first)
        // 3. Expired assignments (most recently expired first)
        assignments.sort((a, b) => {
          const statusOrder = { 'Active': 1, 'Upcoming': 2, 'Expired': 3 };
          const orderA = statusOrder[a.computedStatus];
          const orderB = statusOrder[b.computedStatus];

          if (orderA !== orderB) {
            return orderA - orderB;
          }

          const dateA = a.deadline ? new Date(a.deadline) : new Date(0);
          const dateB = b.deadline ? new Date(b.deadline) : new Date(0);

          if (a.computedStatus === 'Expired') {
            return dateB - dateA;
          } else {
            return dateA - dateB;
          }
        });

        // Populate Dynamic Subject Filter
        const uniqueSubjects = [...new Set(assignments.map(a => a.subject))].filter(Boolean);
        const filterContainer = document.getElementById('prevAssignSubjectFilterContainer');
        const filterSelect = document.getElementById('prevAssignSubjectFilter');
        
        if (uniqueSubjects.length > 1 && filterContainer && filterSelect) {
          const currentVal = filterSelect.value || 'all';
          filterSelect.innerHTML = '<option value="all">All Subjects</option>' + 
            uniqueSubjects.map(sub => `<option value="${esc(sub)}">${esc(sub)}</option>`).join('');
          filterSelect.value = currentVal;
          filterContainer.style.display = 'block';

          if (!filterSelect.dataset.listenerBound) {
            filterSelect.addEventListener('change', () => {
              renderList(filterSelect.value);
            });
            filterSelect.dataset.listenerBound = 'true';
          }
        } else if (filterContainer) {
          filterContainer.style.display = 'none';
        }

        // Render function
        function renderList(subjectFilter = 'all') {
          let listToShow = assignments;
          if (subjectFilter !== 'all') {
            listToShow = assignments.filter(a => a.subject === subjectFilter);
          }

          const slicedList = listToShow.slice(0, 5);

          if (slicedList.length === 0) {
            container.innerHTML = `
              <div style="text-align: center; padding: 20px; color: #64748b; font-size: 0.85rem;">
                No assignments matching "${esc(subjectFilter)}".
              </div>
            `;
            return;
          }

          container.innerHTML = slicedList.map(a => {
            const deadlineDate = a.deadline ? new Date(a.deadline) : null;
            const deadlineStr = deadlineDate ? deadlineDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A';
            const targetStr = `${esc(a.department)} - ${esc(a.year)} (Batch ${esc(a.batch)})`;
            const submissionCount = a.submissionCount || 0;

            let statusBadge = '';
            if (a.computedStatus === 'Active') {
              statusBadge = `<span style="font-size: 0.72rem; font-weight: 700; background: #ecfdf5; color: #059669; padding: 2px 8px; border-radius: 12px; border: 1px solid #a7f3d0;">Active</span>`;
            } else if (a.computedStatus === 'Upcoming') {
              statusBadge = `<span style="font-size: 0.72rem; font-weight: 700; background: #eff6ff; color: #1d4ed8; padding: 2px 8px; border-radius: 12px; border: 1px solid #bfdbfe;">Upcoming</span>`;
            } else {
              statusBadge = `<span style="font-size: 0.72rem; font-weight: 700; background: #fee2e2; color: #b91c1c; padding: 2px 8px; border-radius: 12px; border: 1px solid #fecaca;">Expired</span>`;
            }

            return `
              <div class="previous-assignment-item" data-id="${a._id}" data-title="${esc(a.title)}" style="padding: 14px; border: 1px solid #f1f5f9; border-radius: 12px; background: #fafafa; display: flex; flex-direction: column; gap: 8px; transition: all 0.2s; cursor: pointer;" onmouseenter="this.style.borderColor='var(--primary)'; this.style.background='#faf5ff'; this.style.boxShadow='var(--shadow-sm)';" onmouseleave="this.style.borderColor='#f1f5f9'; this.style.background='#fafafa'; this.style.boxShadow='none';">
                <!-- Title & Subject Row -->
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
                  <div style="font-weight: 700; color: #1e1b4b; font-size: 0.88rem; line-height: 1.3; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">
                    ${esc(a.title)}
                  </div>
                  <span style="font-size: 0.7rem; font-weight: 700; background: var(--primary); color: white; padding: 2px 8px; border-radius: 8px; white-space: nowrap; text-transform: uppercase;">
                    ${esc(a.subject)}
                  </span>
                </div>
                
                <!-- Class/Target & Submission Count Row -->
                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.78rem; color: #475569;">
                  <span style="display: inline-flex; align-items: center; gap: 4px; font-weight: 500;">
                    <i class="fa-solid fa-graduation-cap" style="color: #64748b;"></i> ${targetStr}
                  </span>
                  <span style="color: #059669; font-weight: 600; display: inline-flex; align-items: center; gap: 4px; background: #ecfdf5; padding: 2px 6px; border-radius: 8px;">
                    <i class="fa-solid fa-file-circle-check"></i> ${submissionCount} Submissions
                  </span>
                </div>
                
                <!-- Due Date & Status Row -->
                <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px dashed #e2e8f0; padding-top: 8px; font-size: 0.78rem;">
                  <span style="color: #64748b; font-weight: 500; display: inline-flex; align-items: center; gap: 4px;">
                    <i class="fa-regular fa-clock"></i> Due: ${deadlineStr}
                  </span>
                  ${statusBadge}
                </div>
              </div>
            `;
          }).join('');

          container.querySelectorAll('.previous-assignment-item').forEach(card => {
            card.addEventListener('click', () => {
              const id = card.dataset.id;
              const title = card.dataset.title;
              openTeacherSubmissionsModal(id, title);
            });
          });
        }

        renderList(filterSelect ? filterSelect.value : 'all');

      } catch (err) {
        console.error('Error loading short list:', err);
        container.innerHTML = `<div style="text-align: center; padding: 20px; color: #ef4444; font-size: 0.85rem;">Failed to load assignments list.</div>`;
      }
    }

    loadPreviousAssignmentsShortList();
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

  async function renderProfile() {
    // Hide default hero
    const hero = document.getElementById('home');
    if (hero) hero.style.display = 'none';

    const token = user.token || localStorage.getItem('token') || '';
    const role = (user.role || 'guest').toLowerCase();
    
    // Fetch latest profile details from server
    let p = { ...user };
    try {
      const res = await fetch(`${apiBase}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const remoteData = await res.json();
        p = { ...user, ...remoteData };
        Object.assign(user, p);
        localStorage.setItem('user', JSON.stringify(user));
      }
    } catch (err) {
      console.error('Error fetching profile from database:', err);
    }

    const name = p.name || 'User';

    // Avatar resolution
    let avatarSrc = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=3b82f6&color=fff&rounded=true&bold=true`;
    if (p.profilePicture) {
      avatarSrc = p.profilePicture.startsWith('http') ? p.profilePicture : `${apiBase}${p.profilePicture}`;
    }

    // Role display label
    const roleLabels = {
      student: 'Student',
      hosteler: 'Hosteler',
      teacher: 'Teacher / Faculty',
      hod: 'Head of Department',
      warden: 'Warden',
      principal: 'Principal',
      admin: 'Administrator'
    };
    const roleLabelText = roleLabels[role] || 'Member';

    function renderBadgeList(arr, emptyText = 'None') {
      if (!arr || arr.length === 0) return `<span style="font-size:0.85rem; color:#64748b; font-style:italic;">${emptyText}</span>`;
      return arr.map(item => {
        let text = '';
        if (typeof item === 'object' && item !== null) {
          if (item.batch && item.passOutYear) {
            text = `${item.batch} (Passout: ${item.passOutYear})`;
          } else if (item.name) {
            text = item.name;
          } else {
            text = JSON.stringify(item);
          }
        } else {
          text = String(item);
        }
        return `<span style="display:inline-block; background:#f1f5f9; color:#475569; padding:4px 10px; border-radius:12px; font-size:0.8rem; font-weight:500; border:1px solid #cbd5e1; margin-right:6px; margin-bottom:6px;">${esc(text)}</span>`;
      }).join('');
    }

    function renderMergedSubjects(p) {
      const list = p.assignedSubjects || [];
      if (list.length === 0) {
        if (p.subjects && p.subjects.length > 0) {
          return p.subjects.map((sub, idx) => {
            const t = p.assignedTeachers && p.assignedTeachers[idx] ? (p.assignedTeachers[idx].name || p.assignedTeachers[idx]) : 'Not Assigned';
            const text = `${sub} - ${t.name || t}`;
            return `<span style="display:inline-block; background:#f1f5f9; color:#475569; padding:4px 10px; border-radius:12px; font-size:0.8rem; font-weight:500; border:1px solid #cbd5e1; margin-right:6px; margin-bottom:6px;">${esc(text)}</span>`;
          }).join('');
        }
        return `<span style="font-size:0.85rem; color:#64748b; font-style:italic;">None</span>`;
      }
      return list.map(item => {
        const text = `${item.subject} - ${item.teacher}`;
        return `<span style="display:inline-block; background:#f1f5f9; color:#475569; padding:4px 10px; border-radius:12px; font-size:0.8rem; font-weight:500; border:1px solid #cbd5e1; margin-right:6px; margin-bottom:6px;">${esc(text)}</span>`;
      }).join('');
    }

    // Account Information (Name, Email, Phone, Blood Group) - General
    let fieldsHtml = `
      <!-- Account Info Section -->
      <div style="background: white; border: 1px solid var(--border-color); border-radius: 16px; padding: 24px; box-shadow: var(--shadow-sm); margin-bottom: 24px;">
        <h3 style="margin-top: 0; margin-bottom: 20px; font-size: 1.15rem; font-weight: 700; color: #1e1b4b; display: flex; align-items: center; gap: 8px;">
          <i class="fa-solid fa-user" style="color: var(--primary);"></i> Account Details
        </h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px;">
          <div style="display:flex; flex-direction:column; gap:4px;">
            <label style="font-size:0.8rem; font-weight:600; color:#475569;">Full Name</label>
            <input type="text" name="name" value="${esc(p.name || '')}" placeholder="Your Full Name" required style="padding:10px 12px; border-radius:8px; border:1px solid #cbd5e1; outline:none; font-size:0.9rem;">
          </div>
          <div style="display:flex; flex-direction:column; gap:4px;">
            <label style="font-size:0.8rem; font-weight:600; color:#475569;">Email Address</label>
            <input type="email" name="email" value="${esc(p.email || '')}" placeholder="Your Email Address" required style="padding:10px 12px; border-radius:8px; border:1px solid #cbd5e1; outline:none; font-size:0.9rem;">
          </div>
          <div style="display:flex; flex-direction:column; gap:4px;">
            <label style="font-size:0.8rem; font-weight:600; color:#475569;">Contact Number</label>
            <input type="tel" name="contactNumber" value="${esc(p.contactNumber || '')}" placeholder="10-digit number" pattern="[0-9]{10}" style="padding:10px 12px; border-radius:8px; border:1px solid #cbd5e1; outline:none; font-size:0.9rem;">
          </div>
          <div style="display:flex; flex-direction:column; gap:4px;">
            <label style="font-size:0.8rem; font-weight:600; color:#475569;">Blood Group</label>
            <input type="text" name="bloodGroup" value="${esc(p.bloodGroup || '')}" placeholder="e.g. O+, A-" style="padding:10px 12px; border-radius:8px; border:1px solid #cbd5e1; outline:none; font-size:0.9rem;">
          </div>
        </div>
      </div>
    `;

    // Role Details (Academic / Professional)
    let roleFieldsHtml = '';
    let allocsHtml = '';
    
    if (role === 'student' || role === 'hosteler') {
      const mentorText = p.mentor ? (typeof p.mentor === 'object' ? p.mentor.name : p.mentor) : 'Not Assigned';
      roleFieldsHtml = `
        <div style="background: white; border: 1px solid var(--border-color); border-radius: 16px; padding: 24px; box-shadow: var(--shadow-sm); margin-bottom: 24px;">
          <h3 style="margin-top: 0; margin-bottom: 20px; font-size: 1.15rem; font-weight: 700; color: #1e1b4b; display: flex; align-items: center; gap: 8px;">
            <i class="fa-solid fa-graduation-cap" style="color: var(--primary);"></i> Academic Info (Institution Decided)
          </h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px;">
            <div style="display:flex; flex-direction:column; gap:4px;">
              <label style="font-size:0.8rem; font-weight:600; color:#475569;">Roll Number</label>
              <input type="text" value="${esc(p.rollNumber || '')}" disabled style="padding:10px 12px; border-radius:8px; border:1px solid #cbd5e1; outline:none; font-size:0.9rem; background:#f1f5f9; color:#64748b; cursor:not-allowed;">
            </div>
            <div style="display:flex; flex-direction:column; gap:4px;">
              <label style="font-size:0.8rem; font-weight:600; color:#475569;">Department</label>
              <input type="text" value="${esc(p.department || '')}" disabled style="padding:10px 12px; border-radius:8px; border:1px solid #cbd5e1; outline:none; font-size:0.9rem; background:#f1f5f9; color:#64748b; cursor:not-allowed;">
            </div>
            <div style="display:flex; flex-direction:column; gap:4px;">
              <label style="font-size:0.8rem; font-weight:600; color:#475569;">Current Year</label>
              <input type="text" value="${esc(p.year || '')}" disabled style="padding:10px 12px; border-radius:8px; border:1px solid #cbd5e1; outline:none; font-size:0.9rem; background:#f1f5f9; color:#64748b; cursor:not-allowed;">
            </div>
            <div style="display:flex; flex-direction:column; gap:4px;">
              <label style="font-size:0.8rem; font-weight:600; color:#475569;">Semester</label>
              <input type="text" value="${esc(p.semester || '')}" disabled style="padding:10px 12px; border-radius:8px; border:1px solid #cbd5e1; outline:none; font-size:0.9rem; background:#f1f5f9; color:#64748b; cursor:not-allowed;">
            </div>
            <div style="display:flex; flex-direction:column; gap:4px;">
              <label style="font-size:0.8rem; font-weight:600; color:#475569;">Academic Batch</label>
              <input type="text" value="${esc(p.batch || '')}" disabled style="padding:10px 12px; border-radius:8px; border:1px solid #cbd5e1; outline:none; font-size:0.9rem; background:#f1f5f9; color:#64748b; cursor:not-allowed;">
            </div>
            <div style="display:flex; flex-direction:column; gap:4px;">
              <label style="font-size:0.8rem; font-weight:600; color:#475569;">Sub Batch</label>
              <input type="text" value="${esc(p.subBatch || '')}" disabled style="padding:10px 12px; border-radius:8px; border:1px solid #cbd5e1; outline:none; font-size:0.9rem; background:#f1f5f9; color:#64748b; cursor:not-allowed;">
            </div>
            <div style="display:flex; flex-direction:column; gap:4px;">
              <label style="font-size:0.8rem; font-weight:600; color:#475569;">Assigned Mentor</label>
              <input type="text" value="${esc(mentorText)}" disabled style="padding:10px 12px; border-radius:8px; border:1px solid #cbd5e1; outline:none; font-size:0.9rem; background:#f1f5f9; color:#64748b; cursor:not-allowed;">
            </div>
            <div style="display:flex; flex-direction:column; gap:4px;">
              <label style="font-size:0.8rem; font-weight:600; color:#475569;">Pass Out Year</label>
              <input type="text" value="${esc(p.passOutYear || '')}" disabled style="padding:10px 12px; border-radius:8px; border:1px solid #cbd5e1; outline:none; font-size:0.9rem; background:#f1f5f9; color:#64748b; cursor:not-allowed;">
            </div>
            <div style="display:flex; flex-direction:column; gap:6px; grid-column: span 2; margin-top: 10px;">
              <label style="font-size:0.8rem; font-weight:600; color:#475569;">Assigned Subjects & Teachers</label>
              <div style="display:flex; flex-wrap:wrap;">${renderMergedSubjects(p)}</div>
            </div>
          </div>
        </div>
      `;

      if (role === 'hosteler') {
        roleFieldsHtml += `
          <!-- Hostel Info -->
          <div style="background: white; border: 1px solid var(--border-color); border-radius: 16px; padding: 24px; box-shadow: var(--shadow-sm); margin-bottom: 24px;">
            <h3 style="margin-top: 0; margin-bottom: 20px; font-size: 1.15rem; font-weight: 700; color: #1e1b4b; display: flex; align-items: center; gap: 8px;">
              <i class="fa-solid fa-hotel" style="color: var(--primary);"></i> Hostel Info (Institution Decided)
            </h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px;">
              <div style="display:flex; flex-direction:column; gap:4px;">
                <label style="font-size:0.8rem; font-weight:600; color:#475569;">Hostel Name</label>
                <input type="text" value="${esc(p.hostelName || '')}" disabled style="padding:10px 12px; border-radius:8px; border:1px solid #cbd5e1; outline:none; font-size:0.9rem; background:#f1f5f9; color:#64748b; cursor:not-allowed;">
              </div>
              <div style="display:flex; flex-direction:column; gap:4px;">
                <label style="font-size:0.8rem; font-weight:600; color:#475569;">Room Number</label>
                <input type="text" value="${esc(p.roomNumber || '')}" disabled style="padding:10px 12px; border-radius:8px; border:1px solid #cbd5e1; outline:none; font-size:0.9rem; background:#f1f5f9; color:#64748b; cursor:not-allowed;">
              </div>
            </div>
          </div>
        `;
      }
    } else if (['teacher', 'hod', 'warden', 'principal'].includes(role)) {
      const isWardenOrPrincipal = role === 'warden' || role === 'principal';
      const isTeacherOrHOD = role === 'teacher' || role === 'hod';

      function mapTeachingBatch(tb) {
        if (!tb) return '';
        const currentYear = new Date().getFullYear();
        const diff = Number(tb.passOutYear) - currentYear;
        let yearStr = '';
        if (diff === 0) yearStr = '4th Year';
        else if (diff === 1) yearStr = '3rd Year';
        else if (diff === 2) yearStr = '2nd Year';
        else if (diff === 3) yearStr = '1st Year';
        else yearStr = `${tb.passOutYear} Graduating`;

        const subjectsStr = (tb.subjects || []).join(', ') || (p.teachingSubjects || []).join(', ');
        return `${subjectsStr ? subjectsStr + ' - ' : ''}${yearStr} (Passout: ${tb.passOutYear}), ${tb.batch}`;
      }

      function mapMenteeSubBatch(subBatchStr) {
        if (!subBatchStr || !subBatchStr.includes('-')) return subBatchStr;
        const parts = subBatchStr.split('-');
        const batchNum = parts[0];
        const batchName = `Batch ${batchNum}`;
        
        const matchedBatch = (p.teachingBatches || []).find(tb => tb.batch === batchName);
        const passOutStr = matchedBatch ? ` (Passout: ${matchedBatch.passOutYear})` : '';
        
        let yearStr = '';
        if (matchedBatch) {
          const currentYear = new Date().getFullYear();
          const diff = Number(matchedBatch.passOutYear) - currentYear;
          if (diff === 0) yearStr = '4th Year';
          else if (diff === 1) yearStr = '3rd Year';
          else if (diff === 2) yearStr = '2nd Year';
          else if (diff === 3) yearStr = '1st Year';
          else yearStr = `${matchedBatch.passOutYear} Graduating`;
        }
        
        return `${yearStr}${passOutStr} - ${batchName} - Sub Batch: ${subBatchStr}`;
      }

      const mappedTeachingBatches = (p.teachingBatches || []).map(mapTeachingBatch);
      const mappedMentees = (p.menteesSubBatches || []).map(mapMenteeSubBatch);
      
      roleFieldsHtml = `
        <div style="background: white; border: 1px solid var(--border-color); border-radius: 16px; padding: 24px; box-shadow: var(--shadow-sm); margin-bottom: 24px;">
          <h3 style="margin-top: 0; margin-bottom: 20px; font-size: 1.15rem; font-weight: 700; color: #1e1b4b; display: flex; align-items: center; gap: 8px;">
            <i class="fa-solid fa-briefcase" style="color: var(--primary);"></i> Professional Information
          </h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; margin-bottom: 20px;">
            <div style="display:flex; flex-direction:column; gap:4px;">
              <label style="font-size:0.8rem; font-weight:600; color:#475569;">Employee ID</label>
              <input type="text" value="${esc(p.employeeId || '')}" disabled style="padding:10px 12px; border-radius:8px; border:1px solid #cbd5e1; outline:none; font-size:0.9rem; background:#f1f5f9; color:#64748b; cursor:not-allowed;">
            </div>
            ${p.department ? `
            <div style="display:flex; flex-direction:column; gap:4px;">
              <label style="font-size:0.8rem; font-weight:600; color:#475569;">Department</label>
              <input type="text" value="${esc(p.department || '')}" disabled style="padding:10px 12px; border-radius:8px; border:1px solid #cbd5e1; outline:none; font-size:0.9rem; background:#f1f5f9; color:#64748b; cursor:not-allowed;">
            </div>` : ''}
            <div style="display:flex; flex-direction:column; gap:4px;">
              <label style="font-size:0.8rem; font-weight:600; color:#475569;">Designation</label>
              <input type="text" value="${esc(p.designation || '')}" disabled style="padding:10px 12px; border-radius:8px; border:1px solid #cbd5e1; outline:none; font-size:0.9rem; background:#f1f5f9; color:#64748b; cursor:not-allowed;">
            </div>
            ${role !== 'principal' ? `
            <div style="display:flex; flex-direction:column; gap:4px;">
              <label style="font-size:0.8rem; font-weight:600; color:#475569;">Years of Experience</label>
              <input type="number" name="yearsExperience" value="${p.yearsExperience ?? ''}" placeholder="e.g. 5" style="padding:10px 12px; border-radius:8px; border:1px solid #cbd5e1; outline:none; font-size:0.9rem;">
            </div>` : ''}
          </div>
          ${isTeacherOrHOD ? `
          <div style="display:flex; flex-direction:column; gap:8px;">
            <label style="font-size:0.8rem; font-weight:600; color:#475569;">Expertise Areas</label>
            <div id="expertiseContainer" style="display: flex; flex-wrap: wrap; gap: 8px; padding: 12px; border: 1px solid #cbd5e1; border-radius: 8px; min-height: 48px; background: #fff;">
              ${(p.expertise || []).map(exp => `
                <div class="expertise-tag" data-tag="${esc(exp)}" style="display: inline-flex; align-items: center; gap: 6px; background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; padding: 6px 12px; border-radius: 20px; font-size: 0.85rem; font-weight: 500;">
                  <i class="fa-solid fa-circle-check" style="color: #10b981;"></i>
                  <span>${esc(exp)}</span>
                  <button type="button" class="remove-exp-btn" style="background: none; border: none; color: #15803d; cursor: pointer; padding: 0; display: inline-flex; align-items: center; justify-content: center; font-size: 0.8rem;" onclick="this.parentElement.remove()">
                    <i class="fa-solid fa-xmark"></i>
                  </button>
                </div>
              `).join('')}
            </div>
            <div style="display: flex; gap: 8px; margin-top: 4px;">
              <input type="text" id="newExpertiseInput" placeholder="Add a new expertise area..." style="flex: 1; padding: 8px 12px; border-radius: 8px; border: 1px solid #cbd5e1; outline: none; font-size: 0.9rem;">
              <button type="button" id="addExpertiseBtn" class="btn-outline-purple" style="padding: 8px 16px; font-size: 0.85rem; border-radius: 8px; font-weight: 600; white-space: nowrap;">+ Add</button>
            </div>
          </div>` : ''}
          ${isWardenOrPrincipal ? `
          <div style="display:flex; flex-direction:column; gap:4px; margin-top: 16px;">
            <label style="font-size:0.8rem; font-weight:600; color:#475569;">About / Bio</label>
            <textarea name="about" placeholder="Tell us about yourself..." style="padding:10px 12px; border-radius:8px; border:1px solid #cbd5e1; outline:none; font-size:0.9rem; font-family:inherit; min-height:80px; resize:none;">${esc(p.about || '')}</textarea>
          </div>` : ''}
        </div>
      `;

      // Allocations section for Faculty
      allocsHtml = `
        <div style="background: white; border: 1px solid var(--border-color); border-radius: 16px; padding: 24px; box-shadow: var(--shadow-sm); margin-bottom: 24px;">
          <h3 style="margin-top: 0; margin-bottom: 20px; font-size: 1.15rem; font-weight: 700; color: #1e1b4b; display: flex; align-items: center; gap: 8px;">
            <i class="fa-solid fa-network-wired" style="color: var(--primary);"></i> Institutional Allocations (Read-only)
          </h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px;">
            <div style="display:flex; flex-direction:column; gap:6px;">
              <label style="font-size:0.8rem; font-weight:600; color:#475569;">Teaching Subjects</label>
              <div style="display:flex; flex-wrap:wrap;">${renderBadgeList(p.teachingSubjects)}</div>
            </div>
            <div style="display:flex; flex-direction:column; gap:6px;">
              <label style="font-size:0.8rem; font-weight:600; color:#475569;">Teaching Batches</label>
              <div style="display:flex; flex-wrap:wrap;">${renderBadgeList(mappedTeachingBatches)}</div>
            </div>
            <div style="display:flex; flex-direction:column; gap:6px;">
              <label style="font-size:0.8rem; font-weight:600; color:#475569;">Mentees Sub-Batches</label>
              <div style="display:flex; flex-wrap:wrap;">${renderBadgeList(mappedMentees)}</div>
            </div>
            <div style="display:flex; flex-direction:column; gap:6px;">
              <label style="font-size:0.8rem; font-weight:600; color:#475569;">Availability Slots (9:30 AM to 5:30 PM)</label>
              <div style="display:flex; flex-wrap:wrap;">${renderBadgeList(p.availabilitySlots)}</div>
            </div>
          </div>
        </div>
      `;
    }

    // Combine everything into a clean structure using the Notice list style wrapper panel
    content(`
      <div class="section-card module-panel" style="padding: 28px; border-radius: 16px; background: white; border: 1px solid var(--border-color); box-shadow: var(--shadow-sm);">
        <div class="section-header" style="border-bottom: 1px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
          <div>
            <h2 style="margin: 0; font-size: 1.6rem; font-weight: 800; color: #1e1b4b; font-family: 'Poppins', sans-serif;">
              <i class="fa-solid fa-user-gear" style="color: var(--primary); margin-right: 8px;"></i> Profile Settings
            </h2>
            <p style="margin: 4px 0 0 0; font-size: 0.9rem; color: #64748b;">Manage your account details and institutional preferences.</p>
          </div>
          <!-- Profile image upload section on the right -->
          <div style="display: flex; align-items: center; gap: 16px;">
            <div style="position: relative; width: 80px; height: 80px; border-radius: 50%; overflow: hidden; border: 3px solid var(--primary); box-shadow: var(--shadow-sm);">
              <img id="profilePageAvatar" src="${avatarSrc}" alt="Avatar" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=3b82f6&color=fff&rounded=true&bold=true';" />
              <label for="profileImageInput" style="position: absolute; bottom: 0; left: 0; width: 100%; background: rgba(0, 0, 0, 0.6); color: white; text-align: center; padding: 4px 0; font-size: 0.65rem; font-weight: 600; cursor: pointer; transition: all 0.2s;">
                <i class="fa-solid fa-camera"></i> Change
              </label>
            </div>
            <input type="file" id="profileImageInput" accept="image/*" style="display: none;">
            <div style="display: flex; flex-direction: column;">
              <span style="font-weight: 700; color: #1e1b4b; font-size: 1.1rem;">${esc(name)}</span>
              <span style="font-size: 0.85rem; color: var(--text-muted); font-weight: 500;">${roleLabelText}</span>
            </div>
          </div>
        </div>

        <form id="profileForm" style="display: flex; flex-direction: column; gap: 24px; margin-top: 16px;">
          ${fieldsHtml}
          ${roleFieldsHtml}
          ${allocsHtml}
          
          <button type="submit" class="btn-filled-purple" style="align-self: flex-start; padding: 12px 28px; border-radius: 12px; font-weight: 600; border: none; cursor: pointer; display: flex; align-items: center; gap: 8px; box-shadow: var(--shadow-sm);">
            <i class="fa-solid fa-floppy-disk"></i> Save Profile Details
          </button>
        </form>
      </div>
    `);

    // Add expertise tags list events
    const addBtn = document.getElementById('addExpertiseBtn');
    const expInput = document.getElementById('newExpertiseInput');
    const container = document.getElementById('expertiseContainer');

    const addTag = () => {
      const val = expInput.value.trim();
      if (!val) return;
      const existing = Array.from(container.querySelectorAll('.expertise-tag')).map(el => el.getAttribute('data-tag'));
      if (existing.includes(val)) {
        expInput.value = '';
        return;
      }

      const tagHtml = `
        <div class="expertise-tag" data-tag="${esc(val)}" style="display: inline-flex; align-items: center; gap: 6px; background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; padding: 6px 12px; border-radius: 20px; font-size: 0.85rem; font-weight: 500;">
          <i class="fa-solid fa-circle-check" style="color: #10b981;"></i>
          <span>${esc(val)}</span>
          <button type="button" class="remove-exp-btn" style="background: none; border: none; color: #15803d; cursor: pointer; padding: 0; display: inline-flex; align-items: center; justify-content: center; font-size: 0.8rem;" onclick="this.parentElement.remove()">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
      `;
      container.insertAdjacentHTML('beforeend', tagHtml);
      expInput.value = '';
    };

    addBtn?.addEventListener('click', addTag);
    expInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addTag();
      }
    });

    // Add profile image upload change binding
    document.getElementById('profileImageInput')?.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('profileImage', file);

      try {
        const res = await fetch(`${apiBase}/api/auth/profile-picture`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        });

        if (res.ok) {
          const updated = await res.json();
          user.profilePicture = updated.profilePicture;
          localStorage.setItem('user', JSON.stringify(user));
          alert('Profile picture updated successfully!');
          renderProfile(); // Re-render page
          
          // Try to update top navbar picture
          const topAvatar = document.getElementById('userAvatar');
          if (topAvatar) {
            const cleanUrl = updated.profilePicture.startsWith('http') ? updated.profilePicture : `${apiBase}${updated.profilePicture}`;
            topAvatar.src = `${cleanUrl}?t=${new Date().getTime()}`;
          }
        } else {
          const err = await res.json();
          throw new Error(err.message || 'Upload failed');
        }
      } catch (err) {
        alert('Error uploading picture: ' + err.message);
      }
    });

    // Add form submit listener
    document.getElementById('profileForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.currentTarget;
      const formData = Object.fromEntries(new FormData(form).entries());

      // Collect expertise tags
      if (container) {
        const expertiseTags = Array.from(container.querySelectorAll('.expertise-tag')).map(el => el.getAttribute('data-tag'));
        formData.expertise = expertiseTags;
      }

      // Client validation for experience
      if (formData.yearsExperience !== undefined) {
        formData.yearsExperience = Number(formData.yearsExperience);
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
      }

      try {
        const res = await fetch(`${apiBase}/api/auth/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(formData)
        });

        if (res.ok) {
          const updated = await res.json();
          
          // Merge token back in since update profile api doesn't return JWT token
          const finalUser = { ...user, ...updated };
          localStorage.setItem('user', JSON.stringify(finalUser));
          
          // Globally update local user object variables
          Object.assign(user, finalUser);

          alert('Profile details saved successfully!');
          renderProfile(); // Re-render

          // Update header username
          const nameDisplay = document.getElementById('userName');
          if (nameDisplay) {
            const nameParts = finalUser.name.split(' ');
            const displayName = nameParts[0] + (['dr.', 'dr', 'prof.', 'prof', 'mr.', 'mr', 'mrs.', 'mrs', 'ms.', 'ms'].includes(nameParts[0].toLowerCase()) && nameParts.length > 1 ? ' ' + nameParts[1] : '');
            nameDisplay.innerText = `Hi, ${displayName}`;
          }
        } else {
          const err = await res.json();
          throw new Error(err.message || 'Update failed');
        }
      } catch (err) {
        alert('Error updating profile: ' + err.message);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save Profile Details';
        }
      }
    });
  }

  async function renderGatePassApproval() {
    content(`
      <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 28px; width: 100%;">
        <button type="button" id="gatePassBackBtn" style="background: #f8fafc; border: 1px solid #e2e8f0; font-size: 1.1rem; color: #475569; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 42px; height: 42px; border-radius: 50%; transition: all 0.2s;">
          <i class="fa-solid fa-arrow-left"></i>
        </button>
        <div>
          <h2 style="margin: 0; font-size: 1.6rem; font-weight: 800; color: #1e1b4b; font-family: 'Poppins', sans-serif;">Leave Approvals</h2>
          <p style="margin: 4px 0 0 0; font-size: 0.9rem; color: #64748b;">Review, approve, or reject student leave applications.</p>
        </div>
      </div>
      <div id="leaveCardsContainer" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; width: 100%;">
        <div style="text-align: center; padding: 40px; color: #64748b;">
          <i class="fa-solid fa-spinner fa-spin" style="font-size: 1.5rem; margin-bottom: 8px;"></i>
          <div>Loading leave requests...</div>
        </div>
      </div>
    `);

    // Attach back button listener
    const backBtn = document.getElementById('gatePassBackBtn');
    if (backBtn) {
      backBtn.addEventListener('click', goToDashboard);
      backBtn.addEventListener('mouseenter', () => { backBtn.style.backgroundColor = '#e2e8f0'; });
      backBtn.addEventListener('mouseleave', () => { backBtn.style.backgroundColor = '#f8fafc'; });
    }

    // Add reject modal to body if it doesn't already exist
    if (!document.getElementById('gatePassRejectModal')) {
      const modalHtml = `
        <div id="gatePassRejectModal" class="modal-overlay" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 2000; justify-content: center; align-items: center; backdrop-filter: blur(4px);">
          <div class="modal-content" style="background: white; padding: 2rem; border-radius: var(--radius-md); width: 90%; max-width: 450px; text-align: left; position: relative; box-shadow: var(--shadow-lg);">
            <h3 style="margin-top: 0; margin-bottom: 8px; font-size: 1.25rem; font-weight: 700; color: var(--text-dark);">Reject Leave Request</h3>
            <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 16px;">Please specify a reason for rejecting this leave request. This will be visible to the student.</p>
            <textarea id="gatePassRejectRemark" placeholder="Enter reason here..." style="width: 100%; height: 100px; padding: 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); font-family: inherit; font-size: 0.9rem; margin-bottom: 20px; outline: none; resize: none;"></textarea>
            <div style="display: flex; justify-content: flex-end; gap: 12px;">
              <button id="gatePassRejectCancelBtn" class="module-btn" style="background: #f1f5f9; color: var(--text-dark); border: 1px solid var(--border-color); padding: 8px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: background 0.2s;">Cancel</button>
              <button id="gatePassRejectConfirmBtn" class="module-btn" style="background: var(--danger); color: white; border: none; padding: 8px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: background 0.2s;">Reject Request</button>
            </div>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', modalHtml);
      
      // Wire reject modal buttons dynamically to prevent inline CSP violations
      document.getElementById('gatePassRejectCancelBtn')?.addEventListener('click', () => window.closeLeaveRejectModal());
      document.getElementById('gatePassRejectConfirmBtn')?.addEventListener('click', () => window.confirmLeaveReject());
    }

    const userRole = (user.role || '').toLowerCase();
    const token = user.token || localStorage.getItem('token') || '';
    const endpoint = userRole === 'hod' ? '/api/hod/leaves' : '/api/warden/leaves';

    let currentRejectId = null;

    window.openLeaveRejectModal = function(id) {
      currentRejectId = id;
      const modal = document.getElementById('gatePassRejectModal');
      if (modal) {
        modal.style.display = 'flex';
        const textarea = document.getElementById('gatePassRejectRemark');
        if (textarea) textarea.value = '';
      }
    };

    window.closeLeaveRejectModal = function() {
      currentRejectId = null;
      const modal = document.getElementById('gatePassRejectModal');
      if (modal) {
        modal.style.display = 'none';
      }
    };

    window.confirmLeaveReject = async function() {
      const remark = document.getElementById('gatePassRejectRemark')?.value.trim();
      if (!remark) {
        alert('Please provide a rejection reason.');
        return;
      }
      if (currentRejectId) {
        await window.processLeaveAction(currentRejectId, 'reject', remark);
        window.closeLeaveRejectModal();
      }
    };

    window.processLeaveAction = async function(id, action, remark = '', confirmTitle = '') {
      if (action === 'approve') {
        const msg = confirmTitle || 'Approve this leave request?';
        if (!confirm(msg)) return;
      }
      
      const actionEndpoint = userRole === 'hod' 
        ? `${apiBase}/api/hod/leaves/${id}/action`
        : `${apiBase}/api/warden/leaves/${id}/action`;

      try {
        const res = await fetch(actionEndpoint, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ action, remark })
        });
        
        if (res.ok) {
          alert(action === 'approve' ? 'Successfully approved' : 'Successfully rejected');
          renderGatePassApproval(); // Reload the list
        } else {
          const err = await res.json();
          alert(err.message || 'Operation failed');
        }
      } catch (e) {
        console.error(e);
        alert('Server Error');
      }
    };

    try {
      const res = await fetch(`${apiBase}${endpoint}`, { headers: { Authorization: `Bearer ${token}` } });
      const leaves = res.ok ? await res.json() : [];

      const container = document.getElementById('leaveCardsContainer');
      if (!container) return;

      if (leaves.length === 0) {
        container.innerHTML = `
          <div class="module-empty" style="padding: 40px 20px;">
            <i class="fa-regular fa-folder-open"></i>
            <span>No pending leaves found.</span>
          </div>
        `;
        return;
      }

      const cardsHtml = leaves.map(leave => {
        const studentName = leave.student?.name || 'Unknown';
        const rollNo = leave.student?.rollNumber || 'N/A';
        const dept = leave.student?.department || '';
        
        const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(studentName)}&background=random`;
        
        const fromDate = leave.startDate ? new Date(leave.startDate).toLocaleDateString() : '--';
        const toDate = leave.endDate ? new Date(leave.endDate).toLocaleDateString() : '--';
        
        const type = leave.type || 'Leave';
        const reason = leave.reason || '--';
        
        const hodStatus = leave.hodStatus || 'Pending';
        const wardenStatus = leave.wardenStatus || 'Pending';

        let hodBadgeHtml = '';
        if (hodStatus === 'Approved') {
          hodBadgeHtml = `<span style="background: #d1fae5; color: #065f46; padding: 4px 10px; border-radius: var(--radius-sm); font-size: 0.75rem; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;"><i class="fa-solid fa-circle-check"></i> Approved</span>`;
        } else if (hodStatus === 'Rejected') {
          hodBadgeHtml = `<span style="background: #fee2e2; color: #991b1b; padding: 4px 10px; border-radius: var(--radius-sm); font-size: 0.75rem; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;"><i class="fa-solid fa-circle-xmark"></i> Rejected</span>`;
        } else {
          hodBadgeHtml = `<span style="background: #fef3c7; color: #92400e; padding: 4px 10px; border-radius: var(--radius-sm); font-size: 0.75rem; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;"><i class="fa-solid fa-clock"></i> Pending</span>`;
        }
        if (leave.hodRemark) {
          hodBadgeHtml += `<div style="font-size:0.7rem; color:var(--text-muted); margin-top:4px; font-style:italic;">"${esc(leave.hodRemark)}"</div>`;
        }

        let wardenBadgeHtml = '';
        if (wardenStatus === 'Approved') {
          wardenBadgeHtml = `<span style="background: #d1fae5; color: #065f46; padding: 4px 10px; border-radius: var(--radius-sm); font-size: 0.75rem; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;"><i class="fa-solid fa-circle-check"></i> Approved</span>`;
        } else if (wardenStatus === 'Rejected') {
          wardenBadgeHtml = `<span style="background: #fee2e2; color: #991b1b; padding: 4px 10px; border-radius: var(--radius-sm); font-size: 0.75rem; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;"><i class="fa-solid fa-circle-xmark"></i> Rejected</span>`;
        } else {
          wardenBadgeHtml = `<span style="background: #fef3c7; color: #92400e; padding: 4px 10px; border-radius: var(--radius-sm); font-size: 0.75rem; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;"><i class="fa-solid fa-clock"></i> Pending</span>`;
        }
        if (leave.wardenRemark) {
          wardenBadgeHtml += `<div style="font-size:0.7rem; color:var(--text-muted); margin-top:4px; font-style:italic;">"${esc(leave.wardenRemark)}"</div>`;
        }

        let typeBadgeColor = 'background: #e0f2fe; color: #0369a1;'; // Night Out / Blue
        if (type === 'Home Visit') {
          typeBadgeColor = 'background: #ede9fe; color: #7c3aed;'; // Purple
        } else if (type === 'Medical') {
          typeBadgeColor = 'background: #fee2e2; color: #b91c1c;'; // Red
        }

        return `
          <div class="leave-card" data-id="${leave._id}" style="background: white; border: 1px solid var(--border-color); border-radius: 16px; padding: 18px; display: flex; flex-direction: column; box-shadow: 0 2px 8px rgba(0,0,0,0.02); transition: all 0.25s; cursor: pointer; user-select: none;">
            
            <!-- Summary Header Row (Always Visible) -->
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; pointer-events: none;">
              <div style="display: flex; align-items: center; gap: 14px;">
                <img src="${avatarUrl}" style="width: 44px; height: 44px; border-radius: 50%; border: 2px solid #f1f5f9; object-fit: cover;">
                <div>
                  <h4 style="margin: 0; font-size: 1rem; font-weight: 750; color: var(--text-dark); font-family: 'Poppins', sans-serif;">${esc(studentName)}</h4>
                  <p style="margin: 2px 0 0 0; font-size: 0.8rem; color: var(--text-muted); font-weight: 500;">
                    Roll: ${esc(rollNo)} | Dept: ${esc(dept)}
                  </p>
                </div>
              </div>
              
              <div style="display: flex; gap: 8px; align-items: center;">
                <span style="${typeBadgeColor} padding: 4px 10px; border-radius: 8px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.2px;">${esc(type)}</span>
                <span style="font-size: 0.8rem; font-weight: 650; color: #475569; background: #f1f5f9; padding: 4px 10px; border-radius: 8px; display: inline-flex; align-items: center; gap: 6px;">
                  <i class="fa-regular fa-calendar"></i> ${fromDate} to ${toDate}
                </span>
              </div>
            </div>

            <!-- Reason Row (Always Visible) -->
            <div style="margin-top: 14px; font-size: 0.88rem; color: #475569; line-height: 1.5; pointer-events: none;">
              <strong style="color: var(--text-dark);">Reason:</strong> ${esc(reason)}
            </div>

            <!-- Status Badges Row (Always Visible) -->
            <div style="margin-top: 14px; display: flex; gap: 20px; flex-wrap: wrap; border-top: 1px solid #f1f5f9; padding-top: 12px; pointer-events: none;">
              <div style="display: inline-flex; align-items: center; gap: 6px;"><strong style="font-size: 0.78rem; color: #64748b; font-weight: 700; text-transform: uppercase;">HOD:</strong> ${hodBadgeHtml}</div>
              <div style="display: inline-flex; align-items: center; gap: 6px;"><strong style="font-size: 0.78rem; color: #64748b; font-weight: 700; text-transform: uppercase;">Warden:</strong> ${wardenBadgeHtml}</div>
            </div>

          </div>
        `;
      }).join('');

      container.innerHTML = cardsHtml;

      // Attach Card click listener to open the floating details modal
      container.querySelectorAll('.leave-card').forEach(card => {
        card.addEventListener('click', () => {
          const id = card.dataset.id;
          const leave = leaves.find(item => item._id === id);
          if (leave) {
            showLeaveDetailsModal(leave, userRole, token);
          }
        });
        
        // Add card hovering micro-interactions
        card.addEventListener('mouseenter', () => {
          card.style.transform = 'translateY(-2px)';
          card.style.boxShadow = '0 6px 16px rgba(0,0,0,0.04)';
          card.style.borderColor = 'rgba(107, 70, 193, 0.2)';
        });
        card.addEventListener('mouseleave', () => {
          card.style.transform = 'none';
          card.style.boxShadow = '0 2px 8px rgba(0,0,0,0.02)';
          card.style.borderColor = 'var(--border-color)';
        });
      });

    } catch (e) {
      console.error(e);
      const container = document.getElementById('leaveCardsContainer');
      if (container) container.innerHTML = '<div class="module-empty">Unable to load gate-pass approvals.</div>';
    }
  }

  function showLeaveDetailsModal(leave, userRole, token) {
    const studentName = leave.student?.name || 'Unknown';
    const rollNo = leave.student?.rollNumber || 'N/A';
    const roomNo = leave.student?.roomNumber || 'N/A';
    const hostelName = leave.student?.hostelName || '';
    const dept = leave.student?.department || '';
    
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(studentName)}&background=random`;
    
    const fromDate = leave.startDate ? new Date(leave.startDate).toLocaleDateString() : '--';
    const toDate = leave.endDate ? new Date(leave.endDate).toLocaleDateString() : '--';
    
    const type = leave.type || 'Leave';
    const reason = leave.reason || '--';
    
    const hodStatus = leave.hodStatus || 'Pending';
    const wardenStatus = leave.wardenStatus || 'Pending';

    let hodBadgeHtml = '';
    if (hodStatus === 'Approved') {
      hodBadgeHtml = `<span style="background: #d1fae5; color: #065f46; padding: 4px 10px; border-radius: var(--radius-sm); font-size: 0.75rem; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;"><i class="fa-solid fa-circle-check"></i> Approved</span>`;
    } else if (hodStatus === 'Rejected') {
      hodBadgeHtml = `<span style="background: #fee2e2; color: #991b1b; padding: 4px 10px; border-radius: var(--radius-sm); font-size: 0.75rem; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;"><i class="fa-solid fa-circle-xmark"></i> Rejected</span>`;
    } else {
      hodBadgeHtml = `<span style="background: #fef3c7; color: #92400e; padding: 4px 10px; border-radius: var(--radius-sm); font-size: 0.75rem; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;"><i class="fa-solid fa-clock"></i> Pending</span>`;
    }
    if (leave.hodRemark) {
      hodBadgeHtml += `<div style="font-size:0.7rem; color:var(--text-muted); margin-top:4px; font-style:italic;">"${esc(leave.hodRemark)}"</div>`;
    }

    let wardenBadgeHtml = '';
    if (wardenStatus === 'Approved') {
      wardenBadgeHtml = `<span style="background: #d1fae5; color: #065f46; padding: 4px 10px; border-radius: var(--radius-sm); font-size: 0.75rem; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;"><i class="fa-solid fa-circle-check"></i> Approved</span>`;
    } else if (wardenStatus === 'Rejected') {
      wardenBadgeHtml = `<span style="background: #fee2e2; color: #991b1b; padding: 4px 10px; border-radius: var(--radius-sm); font-size: 0.75rem; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;"><i class="fa-solid fa-circle-xmark"></i> Rejected</span>`;
    } else {
      wardenBadgeHtml = `<span style="background: #fef3c7; color: #92400e; padding: 4px 10px; border-radius: var(--radius-sm); font-size: 0.75rem; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;"><i class="fa-solid fa-clock"></i> Pending</span>`;
    }
    if (leave.wardenRemark) {
      wardenBadgeHtml += `<div style="font-size:0.7rem; color:var(--text-muted); margin-top:4px; font-style:italic;">"${esc(leave.wardenRemark)}"</div>`;
    }

    let actionHtml = '<span style="color: var(--text-muted); font-size: 0.85rem; font-weight: 600;">Action Completed</span>';
    if (userRole === 'hod') {
      if (hodStatus === 'Pending') {
        actionHtml = `
          <div style="display: flex; gap: 8px;">
            <button id="modalLeaveApproveBtn" class="module-btn" style="background: var(--primary); color: white; border: none; padding: 8px 16px; border-radius: 8px; font-size: 0.8rem; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; transition: all 0.2s;"><i class="fa-solid fa-check"></i> Approve</button>
            <button id="modalLeaveRejectBtn" class="module-btn" style="background: #fee2e2; color: #ef4444; border: 1px solid #fca5a5; padding: 8px 16px; border-radius: 8px; font-size: 0.8rem; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; transition: all 0.2s;"><i class="fa-solid fa-xmark"></i> Reject</button>
          </div>
        `;
      }
    } else if (userRole === 'warden') {
      if (wardenStatus === 'Pending') {
        let btnStyle = 'background: var(--success);';
        let btnText = 'Approve';
        let btnIcon = 'fa-stamp';
        let btnTitle = 'Approve leave for this student?';
        if (hodStatus !== 'Approved') {
          btnStyle = 'background: var(--warning);';
          btnText = 'Approve (Direct)';
          btnIcon = 'fa-bolt';
          btnTitle = 'HOD has not approved yet. Directly approve leave?';
        }
        actionHtml = `
          <div style="display: flex; gap: 8px;">
            <button id="modalLeaveApproveDirectBtn" data-title="${btnTitle}" class="module-btn" style="${btnStyle} color: white; border: none; padding: 8px 16px; border-radius: 8px; font-size: 0.8rem; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; transition: all 0.2s;"><i class="fa-solid ${btnIcon}"></i> ${btnText}</button>
            <button id="modalLeaveRejectBtn" class="module-btn" style="background: #fee2e2; color: #ef4444; border: 1px solid #fca5a5; padding: 8px 16px; border-radius: 8px; font-size: 0.8rem; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; transition: all 0.2s;"><i class="fa-solid fa-xmark"></i> Reject</button>
          </div>
        `;
      }
    }

    let typeBadgeColor = 'background: #e0f2fe; color: #0369a1;';
    if (type === 'Home Visit') {
      typeBadgeColor = 'background: #ede9fe; color: #7c3aed;';
    } else if (type === 'Medical') {
      typeBadgeColor = 'background: #fee2e2; color: #b91c1c;';
    }

    const modalId = `leaveModal-${leave._id}`;
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
      modal.style.zIndex = '9990';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <style>
        @keyframes modalFadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      </style>
      <div style="background: white; border-radius: 20px; width: 90%; max-width: 580px; max-height: 90vh; overflow-y: auto; padding: 28px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); position: relative; animation: modalFadeIn 0.3s ease-out; font-family: 'Inter', sans-serif;">
        <!-- Close Button -->
        <button type="button" class="closeModalBtn" style="position: absolute; top: 20px; right: 20px; background: #f1f5f9; border: none; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #64748b; transition: all 0.2s;">
          <i class="fa-solid fa-xmark"></i>
        </button>

        <h3 style="margin: 0 0 20px 0; font-size: 1.4rem; font-weight: 800; color: #0f172a; font-family: 'Poppins', sans-serif;">Leave Request Details</h3>

        <!-- Student Profile Banner -->
        <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 20px; background: #f8fafc; padding: 16px; border-radius: 12px; border: 1px solid #e2e8f0;">
          <img src="${avatarUrl}" style="width: 50px; height: 50px; border-radius: 50%; border: 2px solid #cbd5e1; object-fit: cover;">
          <div>
            <h4 style="margin: 0; font-size: 1.1rem; font-weight: 800; color: var(--text-dark);">${esc(studentName)}</h4>
            <p style="margin: 2px 0 0 0; font-size: 0.85rem; color: var(--text-muted); font-weight: 500;">
              Roll: ${esc(rollNo)} | Dept: ${esc(dept)}
            </p>
          </div>
        </div>

        <!-- Details Grid -->
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 20px; font-size: 0.9rem; color: #475569;">
          <div><strong>Leave Type:</strong> <span style="${typeBadgeColor} padding: 2px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase;">${esc(type)}</span></div>
          <div><strong>Duration:</strong> <span style="font-weight: 650; color: var(--text-dark);">${fromDate} to ${toDate}</span></div>
          <div><strong>Hostel Name:</strong> ${esc(hostelName || 'N/A')}</div>
          <div><strong>Room Number:</strong> ${esc(roomNo || 'N/A')}</div>
        </div>

        <!-- Reason -->
        <div style="margin-bottom: 20px;">
          <strong style="font-size: 0.9rem; color: var(--text-dark); display: block; margin-bottom: 6px;">Reason for Leave:</strong>
          <div style="font-size: 0.92rem; color: #334155; line-height: 1.5; background: #f8fafc; border: 1px solid #e2e8f0; padding: 14px; border-radius: 12px; white-space: pre-wrap; word-break: break-word;">${esc(reason)}</div>
        </div>

        <!-- Status Badges -->
        <div style="display: flex; gap: 20px; flex-wrap: wrap; border-top: 1px solid #f1f5f9; padding-top: 16px; margin-bottom: 24px;">
          <div><strong style="font-size: 0.8rem; color: #64748b; font-weight: 700; text-transform: uppercase; display: block; margin-bottom: 6px;">HOD Status:</strong> ${hodBadgeHtml}</div>
          <div><strong style="font-size: 0.8rem; color: #64748b; font-weight: 700; text-transform: uppercase; display: block; margin-bottom: 6px;">Warden Status:</strong> ${wardenBadgeHtml}</div>
        </div>

        <!-- Footer Actions -->
        <div style="display: flex; justify-content: flex-end; align-items: center; gap: 12px; border-top: 1px solid #f1f5f9; padding-top: 16px;">
          ${actionHtml}
        </div>
      </div>
    `;

    const closeModal = () => { modal.remove(); };
    modal.querySelector('.closeModalBtn').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

    modal.querySelector('#modalLeaveApproveBtn')?.addEventListener('click', async () => {
      await window.processLeaveAction(leave._id, 'approve');
      closeModal();
    });

    modal.querySelector('#modalLeaveApproveDirectBtn')?.addEventListener('click', async (e) => {
      const title = e.currentTarget.dataset.title;
      await window.processLeaveAction(leave._id, 'approve', '', title);
      closeModal();
    });

    modal.querySelector('#modalLeaveRejectBtn')?.addEventListener('click', () => {
      window.openLeaveRejectModal(leave._id);
    });
  }

  async function renderStudentDatabase() {
    const userRole = (user.role || 'guest').toLowerCase();
    
    // Dynamic Filter state
    let selectedYear = 'all';
    let selectedBatch = 'all';
    let selectedDept = 'all';
    let selectedSubject = 'all';
    
    // Column header sorting state
    let currentSortField = 'name';
    let currentSortDir = 'asc';
    
    let allDbData = [];

    // Ensure WhatsApp draft modal exists and events are setup
    setupWaDraftModalEvents();

    content(`
      <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 28px;">
        <button type="button" id="dbBackBtn" style="background: #f8fafc; border: 1px solid #e2e8f0; font-size: 1.1rem; color: #475569; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 42px; height: 42px; border-radius: 50%; transition: all 0.2s;">
          <i class="fa-solid fa-arrow-left"></i>
        </button>
        <div>
          <h2 id="dbHeaderTitle" style="margin: 0; font-size: 1.6rem; font-weight: 800; color: #1e1b4b; font-family: 'Poppins', sans-serif;">Campus Directory</h2>
          <p id="dbHeaderDesc" style="margin: 4px 0 0 0; font-size: 0.9rem; color: #64748b;">Search and filter student and staff databases dynamically.</p>
        </div>
      </div>
      
      <div class="section-card module-panel" style="padding: 28px; border-radius: 16px; background: white; border: 1px solid var(--border-color); box-shadow: var(--shadow-sm);">
        <!-- Top controls: Filter Select + Search -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 20px; flex-wrap: wrap; gap: 10px;">
          <select id="dbFilterDropdown" style="padding: 8px 16px; border-radius: 10px; border: 1px solid #cbd5e1; font-size: 0.9rem; outline: none; background: white; cursor: pointer; font-weight: 600; color: #475569;">
            <!-- Options dynamically added -->
          </select>
          <div style="position: relative;">
            <input type="text" id="dbSearchInput" placeholder="Search by name, roll, dept..." style="padding: 8px 16px 8px 36px; border-radius: 10px; border: 1px solid #cbd5e1; font-size: 0.9rem; outline: none; width: 220px;">
            <i class="fa-solid fa-search" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #94a3b8; font-size: 0.85rem;"></i>
          </div>
        </div>

        <!-- Middle controls: Dynamic Category Filters (Year/Batch/Dept/Subject) -->
        <div style="display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 20px; align-items: center; justify-content: space-between;">
           <div id="dbDynamicFilters" style="display: flex; gap: 10px; flex-wrap: wrap;"></div>
        </div>

        <!-- Table container -->
        <div id="dbTableContainer">
          <div style="text-align: center; padding: 40px; color: #64748b;">
            <i class="fa-solid fa-spinner fa-spin" style="font-size: 1.5rem; margin-bottom: 8px;"></i>
            <div>Loading data...</div>
          </div>
        </div>
      </div>
    `);

    const backBtn = document.getElementById('dbBackBtn');
    if (backBtn) {
      backBtn.addEventListener('click', goToDashboard);
      backBtn.addEventListener('mouseenter', () => { backBtn.style.background = '#e2e8f0'; });
      backBtn.addEventListener('mouseleave', () => { backBtn.style.background = '#f8fafc'; });
    }

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
        <option value="faculty-staff">Faculty Staff</option>
      `;
    } else if (userRole === 'principal' || userRole === 'dean') {
      options += `
        <option value="all-students">All Students</option>
        <option value="all-teachers">All Teachers</option>
        <option value="all-hods">HODs</option>
        <option value="all-wardens">Wardens</option>
        <option value="faculty-staff">Faculty Staff</option>
      `;
    }
    dropdown.innerHTML = options;

    const urlParams = new URLSearchParams(window.location.search);
    const filterParam = urlParams.get('filter');
    if (filterParam && dropdown.querySelector(`option[value="${filterParam}"]`)) {
      dropdown.value = filterParam;
    }

    // Dynamic Filter builder helper
    const updateFilterDropdowns = () => {
      const filterContainer = document.getElementById('dbDynamicFilters');
      if (!filterContainer) return;
      const filterVal = dropdown.value;

      let html = '';
      const needYear = ['my-students', 'my-mentees', 'dept-students', 'dept-teachers', 'hostel-residents', 'all-students', 'all-teachers'].includes(filterVal);
      const needBatch = ['my-students', 'my-mentees', 'dept-students'].includes(filterVal);
      const needDept = ['hostel-residents', 'all-students', 'all-teachers', 'all-hods', 'all-wardens'].includes(filterVal);
      const needSubject = ['dept-teachers', 'all-teachers'].includes(filterVal);

      if (needDept) {
        const depts = [...new Set(allDbData.map(item => item.department).filter(Boolean))].sort();
        html += `
          <select id="filterDeptSelect" style="padding: 6px 12px; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 0.85rem; outline: none; background: white; cursor: pointer; color: #475569; font-weight: 600;">
            <option value="all">All Departments</option>
            ${depts.map(d => `<option value="${d}" ${selectedDept === d ? 'selected' : ''}>${d}</option>`).join('')}
          </select>
        `;
      }

      if (needYear) {
        const years = [...new Set(allDbData.map(item => item.year).filter(Boolean))].sort();
        html += `
          <select id="filterYearSelect" style="padding: 6px 12px; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 0.85rem; outline: none; background: white; cursor: pointer; color: #475569; font-weight: 600;">
            <option value="all">All Years</option>
            ${years.map(y => `<option value="${y}" ${selectedYear === y ? 'selected' : ''}>${y}</option>`).join('')}
          </select>
        `;
      }

      if (needBatch) {
        const batches = [...new Set(allDbData.map(item => item.batch).filter(Boolean))].sort();
        html += `
          <select id="filterBatchSelect" style="padding: 6px 12px; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 0.85rem; outline: none; background: white; cursor: pointer; color: #475569; font-weight: 600;">
            <option value="all">All Batches</option>
            ${batches.map(b => `<option value="${b}" ${selectedBatch === b ? 'selected' : ''}>${b.startsWith('Batch') ? b : 'Batch ' + b}</option>`).join('')}
          </select>
        `;
      }

      if (needSubject) {
        const subjectsSet = new Set();
        allDbData.forEach(t => {
          if (t.teachingSubjects && Array.isArray(t.teachingSubjects)) {
            t.teachingSubjects.forEach(s => subjectsSet.add(s));
          }
        });
        const subjects = [...subjectsSet].sort();
        html += `
          <select id="filterSubjectSelect" style="padding: 6px 12px; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 0.85rem; outline: none; background: white; cursor: pointer; color: #475569; font-weight: 600;">
            <option value="all">All Subjects</option>
            ${subjects.map(s => `<option value="${s}" ${selectedSubject === s ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
        `;
      }

      filterContainer.innerHTML = html;

      document.getElementById('filterDeptSelect')?.addEventListener('change', (e) => { selectedDept = e.target.value; renderFilteredTable(); });
      document.getElementById('filterYearSelect')?.addEventListener('change', (e) => { selectedYear = e.target.value; renderFilteredTable(); });
      document.getElementById('filterBatchSelect')?.addEventListener('change', (e) => { selectedBatch = e.target.value; renderFilteredTable(); });
      document.getElementById('filterSubjectSelect')?.addEventListener('change', (e) => { selectedSubject = e.target.value; renderFilteredTable(); });
    };

    const loadDbData = async () => {
      const filterVal = dropdown.value;
      const titleEl = document.getElementById('dbHeaderTitle');
      const descEl = document.getElementById('dbHeaderDesc');
      if (titleEl && descEl) {
        if (filterVal === 'my-students') {
          titleEl.textContent = 'My Students';
          descEl.textContent = 'List of students assigned to you for classes and assignment updates.';
        } else if (filterVal === 'my-mentees') {
          titleEl.textContent = 'My Mentees';
          descEl.textContent = 'List of students under your mentorship.';
        } else if (filterVal === 'hostel-residents') {
          titleEl.textContent = 'Hostel Residents';
          descEl.textContent = 'List of students residing in the hostel.';
        } else if (filterVal === 'dept-students') {
          titleEl.textContent = 'Department Students';
          descEl.textContent = 'All students registered in your department (1st to 4th year).';
        } else if (filterVal === 'dept-teachers') {
          titleEl.textContent = 'Department Teachers';
          descEl.textContent = 'List of faculty members in your department.';
        } else if (filterVal === 'all-students') {
          titleEl.textContent = 'All Students';
          descEl.textContent = 'Master list of all students in the institution (1st to 4th year).';
        } else if (filterVal === 'all-teachers') {
          titleEl.textContent = 'All Teachers';
          descEl.textContent = 'Directory of all teaching staff across departments.';
        } else if (filterVal === 'all-hods') {
          titleEl.textContent = 'Heads of Departments (HODs)';
          descEl.textContent = 'Directory of all Department Heads.';
        } else if (filterVal === 'all-wardens') {
          titleEl.textContent = 'Hostel Wardens';
          descEl.textContent = 'Directory of all hostel management staff and wardens.';
        } else if (filterVal === 'faculty-staff') {
          titleEl.textContent = 'Faculty Support Staff';
          descEl.textContent = 'Directory of infrastructure, IT, mess, housekeeping, pest control, security, and grounds staff.';
        }
      }

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
      else if (filterVal === 'faculty-staff') endpoint = '/api/auth/staff';
      
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
        
        // Reset sub filters to all when loading new view
        selectedYear = 'all';
        selectedBatch = 'all';
        selectedDept = 'all';
        selectedSubject = 'all';

        // Default sort to name asc when switching filter
        currentSortField = 'name';
        currentSortDir = 'asc';

        updateFilterDropdowns();
        renderFilteredTable();
      } catch (e) {
        if (tableContainer) tableContainer.innerHTML = '<div class="module-empty">Failed to load data.</div>';
      }
    };

    const renderFilteredTable = () => {
      const q = document.getElementById('dbSearchInput')?.value.toLowerCase() || '';
      const filterVal = dropdown.value;
      
      let filtered = allDbData.filter(item => {
        // Base text search
        const matchText = (
          (item.name && item.name.toLowerCase().includes(q)) ||
          (item.rollNumber && item.rollNumber.toLowerCase().includes(q)) ||
          (item.employeeId && item.employeeId.toLowerCase().includes(q)) ||
          (item.teacherId && item.teacherId.toLowerCase().includes(q)) ||
          (item.department && item.department.toLowerCase().includes(q)) ||
          (item.email && item.email.toLowerCase().includes(q))
        );

        if (!matchText) return false;

        // Apply Year Filter
        if (selectedYear !== 'all' && item.year !== selectedYear) return false;

        // Apply Batch Filter
        if (selectedBatch !== 'all' && item.batch !== selectedBatch) return false;

        // Apply Dept Filter
        if (selectedDept !== 'all' && item.department !== selectedDept) return false;

        // Apply Subject Filter
        if (selectedSubject !== 'all') {
          if (!item.teachingSubjects || !item.teachingSubjects.includes(selectedSubject)) return false;
        }

        return true;
      });
      
      // Sort using currentSortField and currentSortDir
      filtered.sort((a, b) => {
        if (currentSortField === 'attendance') {
          const pctA = (a.attendance || 0) / (a.attendanceTotal || 100);
          const pctB = (b.attendance || 0) / (b.attendanceTotal || 100);
          return currentSortDir === 'asc' ? pctA - pctB : pctB - pctA;
        }
        if (currentSortField === 'assignmentsSubmitted') {
          const valA = (a.assignmentsSubmitted || 0) / (a.assignmentsTotal || 10);
          const valB = (b.assignmentsSubmitted || 0) / (b.assignmentsTotal || 10);
          return currentSortDir === 'asc' ? valA - valB : valB - valA;
        }
        if (currentSortField === 'mar') {
          const valA = (a.mar || 0) / (a.marTotal || 100);
          const valB = (b.mar || 0) / (b.marTotal || 100);
          return currentSortDir === 'asc' ? valA - valB : valB - valA;
        }
        if (currentSortField === 'moocs') {
          const valA = (a.moocs || 0) / (a.moocsTotal || 20);
          const valB = (b.moocs || 0) / (b.moocsTotal || 20);
          return currentSortDir === 'asc' ? valA - valB : valB - valA;
        }

        let valA = a[currentSortField];
        let valB = b[currentSortField];

        if (valA === undefined || valA === null) valA = '';
        if (valB === undefined || valB === null) valB = '';

        const numA = Number(valA);
        const numB = Number(valB);
        if (!isNaN(numA) && !isNaN(numB) && valA !== '' && valB !== '') {
          return currentSortDir === 'asc' ? numA - numB : numB - numA;
        }

        return currentSortDir === 'asc' 
          ? String(valA).localeCompare(String(valB)) 
          : String(valB).localeCompare(String(valA));
      });

      // Column mapping and header building
      let cols = [];
      let headers = [];
      let editableFields = {}; // fieldName -> type

      if (filterVal === 'my-students') {
        cols = ['name', 'rollNumber', 'email', 'attendance', 'assignmentsSubmitted', 'whatsapp'];
        headers = ['Name', 'Roll No', 'Mail', 'Attendance (I/N)', 'Assignment Submission (I/N)', 'WhatsApp Link'];
        editableFields = {};
      } else if (filterVal === 'my-mentees') {
        cols = ['name', 'rollNumber', 'email', 'attendance', 'mar', 'moocs', 'whatsapp'];
        headers = ['Name', 'Roll No', 'Mail', 'Attendance (I/N)', 'MAR (I/N)', 'MOOCs (I/N)', 'WhatsApp Link'];
        editableFields = { 'mar': 'number', 'moocs': 'number' };
      } else if (filterVal === 'dept-students') {
        cols = ['name', 'rollNumber', 'email', 'contactNumber', 'attendance', 'cgpa', 'whatsapp'];
        headers = ['Name', 'Roll No', 'Mail', 'Contact No', 'Attendance', 'CGPA', 'WhatsApp Link'];
      } else if (filterVal === 'dept-teachers') {
        cols = ['name', 'email', 'contactNumber', 'subjectsAssigned', 'attendance', 'whatsapp'];
        headers = ['Name', 'Mail', 'Contact No', 'Subject Assigned', 'Attendance', 'WhatsApp Link'];
      } else if (filterVal === 'hostel-residents') {
        cols = ['name', 'department', 'year', 'rollNumber', 'email', 'contactNumber', 'hostelName', 'roomNumber', 'whatsapp'];
        headers = ['Name', 'Dept', 'Year', 'Roll No', 'Mail', 'Contact No', 'Hostel Name', 'Room No', 'WhatsApp Link'];
      } else if (filterVal === 'all-students') {
        cols = ['name', 'department', 'year', 'rollNumber', 'email', 'attendance', 'cgpa', 'whatsapp'];
        headers = ['Name', 'Dept', 'Year', 'Roll No', 'Mail', 'Attendance', 'CGPA', 'WhatsApp Link'];
      } else if (filterVal === 'all-teachers') {
        cols = ['name', 'department', 'email', 'contactNumber', 'subjectsAssigned', 'attendance', 'whatsapp'];
        headers = ['Name', 'Dept', 'Mail', 'Contact No', 'Subject Assigned', 'Attendance', 'WhatsApp Link'];
      } else if (filterVal === 'all-hods') {
        cols = ['name', 'department', 'email', 'contactNumber', 'attendance', 'whatsapp'];
        headers = ['Name', 'Dept', 'Mail', 'Contact No', 'Avg Attendance', 'WhatsApp Link'];
      } else if (filterVal === 'all-wardens') {
        cols = ['name', 'hostelName', 'email', 'contactNumber', 'attendance', 'whatsapp'];
        headers = ['Name', 'Warden For', 'Mail', 'Contact No', 'Avg Attendance', 'WhatsApp Link'];
      } else if (filterVal === 'faculty-staff') {
        cols = ['name', 'designation', 'email', 'contactNumber', 'whatsapp'];
        headers = ['Name', 'Role/Designation', 'Email', 'Contact No', 'WhatsApp Link'];
        editableFields = { 'name': 'text', 'designation': 'text', 'email': 'text', 'contactNumber': 'text' };
      }

      // Draw table structure
      const container = document.getElementById('dbTableContainer');
      if (!container) return;

      if (!filtered.length) {
        container.innerHTML = '<div class="module-empty"><i class="fa-regular fa-folder-open"></i><span>No records found.</span></div>';
        return;
      }

      const formatSubjects = (item) => {
        if (!item.teachingSubjects || item.teachingSubjects.length === 0) return 'None';
        let formatted = [];
        item.teachingSubjects.forEach(sub => {
          if (item.teachingBatches && item.teachingBatches.length > 0) {
            item.teachingBatches.forEach(b => {
              formatted.push(`${sub} (${b.batch || 'All'} - ${b.passOutYear || 'General'})`);
            });
          } else {
            formatted.push(sub);
          }
        });
        return [...new Set(formatted)].join(', ') || 'None';
      };

      const formatCellVal = (item, col) => {
        if (col === 'whatsapp') {
          const phone = item.contactNumber || item.mobile || '';
          if (!phone) return '--';
          const cleanPhone = phone.replace(/\D/g, '');
          if (!cleanPhone) return '--';
          const prefix = cleanPhone.length === 10 ? '91' : '';
          return `<a href="#" class="db-wa-link" data-id="${item._id}" data-name="${item.name || 'Student'}" data-phone="${prefix}${cleanPhone}" data-attendance="${item.attendance || 0}" data-attendance-total="${item.attendanceTotal || 100}" data-assignments="${item.assignmentsSubmitted || 0}" data-assignments-total="${item.assignmentsTotal || 10}" style="color: #25D366; font-size: 1.25rem; display: inline-block; transition: transform 0.2s;" onmouseenter="this.style.transform='scale(1.2)';" onmouseleave="this.style.transform='scale(1)';"><i class="fa-brands fa-whatsapp"></i></a>`;
        }
        
        if (col === 'subjectsAssigned') {
          return formatSubjects(item);
        }

        let val = item[col];
        if (val === undefined || val === null || val === '') {
          val = '--';
        }

        if (col === 'attendance') {
          return 'N/A';
        }
        if (col === 'assignmentsSubmitted') {
          const total = item.assignmentsTotal !== undefined ? item.assignmentsTotal : 10;
          return val !== '--' ? `${val}/${total}` : '--';
        }
        if (col === 'mar') {
          const total = item.marTotal !== undefined ? item.marTotal : 100;
          return val !== '--' ? `${val}/${total}` : '--';
        }
        if (col === 'moocs') {
          const total = item.moocsTotal !== undefined ? item.moocsTotal : 20;
          return val !== '--' ? `${val}/${total}` : '--';
        }

        return val;
      };

      const tableHtml = `
        <div class="module-table-wrap">
          <table class="module-table dashboard-table">
            <thead>
              <tr>
                ${cols.map((col, idx) => {
                  const h = headers[idx];
                  const isSortable = col !== 'contactNumber' && col !== 'email' && col !== 'whatsapp';
                  if (!isSortable) {
                    return `<th style="padding: 12px; color: #475569; font-weight: 700; font-size: 0.85rem;">${h}</th>`;
                  }
                  const isActive = currentSortField === col;
                  const arrow = isActive ? (currentSortDir === 'asc' ? ' ↑' : ' ↓') : ' ↕';
                  const opacity = isActive ? '1' : '0.35';
                  return `
                    <th class="db-sortable-header" data-col="${col}" style="padding: 12px; color: #475569; font-weight: 700; font-size: 0.85rem; cursor: pointer; user-select: none;">
                      ${h} <span style="opacity: ${opacity}; font-size: 0.85rem; color: var(--primary, #4f46e5);">${arrow}</span>
                    </th>
                  `;
                }).join('')}
              </tr>
            </thead>
            <tbody>
              ${filtered.map(item => `
                <tr style="transition: background-color 0.2s;">
                  ${cols.map(col => {
                    const isEditable = !!editableFields[col];
                    const isText = editableFields[col] === 'text';
                    const rawVal = (item[col] !== undefined && item[col] !== null) ? item[col] : (isText ? '' : 0);
                    const cellDisplay = formatCellVal(item, col);
                    
                    if (isEditable) {
                      let totalField = '';
                      let totalVal = 0;
                      if (col === 'attendance') { totalField = 'attendanceTotal'; totalVal = item.attendanceTotal !== undefined ? item.attendanceTotal : 100; }
                      else if (col === 'assignmentsSubmitted') { totalField = 'assignmentsTotal'; totalVal = item.assignmentsTotal !== undefined ? item.assignmentsTotal : 10; }
                      else if (col === 'mar') { totalField = 'marTotal'; totalVal = item.marTotal !== undefined ? item.marTotal : 100; }
                      else if (col === 'moocs') { totalField = 'moocsTotal'; totalVal = item.moocsTotal !== undefined ? item.moocsTotal : 20; }

                      return `
                        <td class="db-interactive-cell" 
                            data-id="${item._id}" 
                            data-field="${col}" 
                            data-value="${rawVal}" 
                            data-type="${editableFields[col]}"
                            data-total-field="${totalField}"
                            data-total-value="${totalVal}"
                            style="cursor: pointer; position: relative; font-weight: 600; color: var(--primary); padding: 8px 12px; transition: background-color 0.2s;"
                            title="Click to edit inline">
                          <span>${cellDisplay}</span>
                          <i class="fa-solid fa-pencil cell-edit-icon" style="opacity: 0; color: #94a3b8; font-size: 0.75rem; margin-left: 6px; transition: opacity 0.2s;"></i>
                        </td>
                      `;
                    }
                    return `<td style="font-weight: 550; padding: 8px 12px;">${cellDisplay}</td>`;
                  }).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;

      container.innerHTML = tableHtml;

      // Attach header sorting click & hover listeners
      container.querySelectorAll('.db-sortable-header').forEach(header => {
        header.addEventListener('mouseenter', () => { header.style.backgroundColor = '#f1f5f9'; });
        header.addEventListener('mouseleave', () => { header.style.backgroundColor = 'transparent'; });
        header.addEventListener('click', () => {
          const col = header.dataset.col;
          if (currentSortField === col) {
            currentSortDir = currentSortDir === 'asc' ? 'desc' : 'asc';
          } else {
            currentSortField = col;
            currentSortDir = 'asc';
          }
          renderFilteredTable();
        });
      });

      // Attach inline editing listeners to interactive cells
      container.querySelectorAll('.db-interactive-cell').forEach(cell => {
        cell.addEventListener('mouseenter', () => {
          cell.style.backgroundColor = '#f1f5f9';
          const icon = cell.querySelector('.cell-edit-icon');
          if (icon) icon.style.opacity = '1';
        });
        cell.addEventListener('mouseleave', () => {
          cell.style.backgroundColor = 'transparent';
          const icon = cell.querySelector('.cell-edit-icon');
          if (icon) icon.style.opacity = '0';
        });

        cell.addEventListener('click', (e) => {
          if (cell.querySelector('input')) return;
          const id = cell.dataset.id;
          const field = cell.dataset.field;
          const type = cell.dataset.type;
          
          if (type === 'text') {
            const currentText = cell.dataset.value || '';
            const textInput = document.createElement('input');
            textInput.type = 'text';
            textInput.value = currentText;
            textInput.style.width = '140px';
            textInput.style.padding = '2px 4px';
            textInput.style.borderRadius = '4px';
            textInput.style.border = '1px solid var(--primary)';
            textInput.style.outline = 'none';
            textInput.style.fontSize = '0.85rem';

            cell.innerHTML = '';
            cell.appendChild(textInput);
            textInput.focus();
            textInput.select();

            let isSaving = false;
            const saveTextEdit = async () => {
              if (isSaving) return;
              isSaving = true;
              const newText = textInput.value;
              cell.innerHTML = `<i class="fa-solid fa-spinner fa-spin" style="color: var(--primary);"></i>`;
              try {
                const res = await fetch(`${apiBase}/api/auth/users/${id}`, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                  },
                  body: JSON.stringify({ [field]: newText })
                });

                if (res.ok) {
                  // Update local memory data
                  const localItem = allDbData.find(item => item._id === id);
                  if (localItem) {
                    localItem[field] = newText;
                  }
                  cell.dataset.value = newText;
                  cell.innerHTML = `<span>${newText || '--'}</span><i class="fa-solid fa-pencil cell-edit-icon" style="opacity: 0; color: #94a3b8; font-size: 0.75rem; margin-left: 6px; transition: opacity 0.2s;"></i>`;
                  cell.style.backgroundColor = '#d1fae5';
                  setTimeout(() => { cell.style.backgroundColor = ''; }, 1000);
                } else {
                  throw new Error();
                }
              } catch (err) {
                cell.dataset.value = currentText;
                cell.innerHTML = `<span>${currentText || '--'}</span><i class="fa-solid fa-pencil cell-edit-icon" style="opacity: 0; color: #94a3b8; font-size: 0.75rem; margin-left: 6px; transition: opacity 0.2s;"></i>`;
                cell.style.backgroundColor = '#fee2e2';
                setTimeout(() => { cell.style.backgroundColor = ''; }, 1000);
              }
            };

            textInput.addEventListener('blur', saveTextEdit);
            textInput.addEventListener('keydown', (ev) => {
              if (ev.key === 'Enter') saveTextEdit();
              if (ev.key === 'Escape') {
                textInput.removeEventListener('blur', saveTextEdit);
                cell.dataset.value = currentText;
                cell.innerHTML = `<span>${currentText || '--'}</span><i class="fa-solid fa-pencil cell-edit-icon" style="opacity: 0; color: #94a3b8; font-size: 0.75rem; margin-left: 6px; transition: opacity 0.2s;"></i>`;
              }
            });
            return;
          }

          const totalField = cell.dataset.totalField;
          const currentVal = parseFloat(cell.dataset.value) || 0;
          const currentTotal = parseFloat(cell.dataset.totalValue) || 0;

          // Create wrapper container for two inputs
          const editWrap = document.createElement('div');
          editWrap.style.display = 'inline-flex';
          editWrap.style.alignItems = 'center';
          editWrap.style.gap = '4px';

          const valInput = document.createElement('input');
          valInput.type = 'number';
          valInput.value = currentVal;
          valInput.style.width = '55px';
          valInput.style.padding = '2px 4px';
          valInput.style.borderRadius = '4px';
          valInput.style.border = '1px solid var(--primary)';
          valInput.style.outline = 'none';
          valInput.style.textAlign = 'center';
          valInput.style.fontSize = '0.85rem';

          const slash = document.createTextNode(' / ');

          const totalInput = document.createElement('input');
          totalInput.type = 'number';
          totalInput.value = currentTotal;
          totalInput.style.width = '55px';
          totalInput.style.padding = '2px 4px';
          totalInput.style.borderRadius = '4px';
          totalInput.style.border = '1px solid var(--primary)';
          totalInput.style.outline = 'none';
          totalInput.style.textAlign = 'center';
          totalInput.style.fontSize = '0.85rem';

          editWrap.appendChild(valInput);
          editWrap.appendChild(slash);
          editWrap.appendChild(totalInput);

          cell.innerHTML = '';
          cell.appendChild(editWrap);
          valInput.focus();
          valInput.select();

          let isSaving = false;

          const saveInlineEdit = async () => {
            if (isSaving) return;
            isSaving = true;

            const newVal = parseFloat(valInput.value) || 0;
            const newTotal = parseFloat(totalInput.value) || 0;

            cell.innerHTML = `<i class="fa-solid fa-spinner fa-spin" style="color: var(--primary);"></i>`;
            
            try {
              const res = await fetch(`${apiBase}/api/auth/users/${id}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${user.token || ''}`
                },
                body: JSON.stringify({ 
                  [field]: newVal,
                  [totalField]: newTotal
                })
              });

              if (res.ok) {
                // Update local memory data
                const localItem = allDbData.find(item => item._id === id);
                if (localItem) {
                  localItem[field] = newVal;
                  localItem[totalField] = newTotal;
                }

                cell.dataset.value = newVal;
                cell.dataset.totalValue = newTotal;
                
                // Show updated representation
                cell.innerHTML = `<span>${newVal}/${newTotal}</span><i class="fa-solid fa-pencil cell-edit-icon" style="opacity: 0; color: #94a3b8; font-size: 0.75rem; margin-left: 6px; transition: opacity 0.2s;"></i>`;
                cell.style.backgroundColor = '#d1fae5';
                setTimeout(() => { cell.style.backgroundColor = ''; }, 1000);
              } else {
                throw new Error();
              }
            } catch (err) {
              cell.dataset.value = currentVal;
              cell.dataset.totalValue = currentTotal;
              cell.innerHTML = `<span>${currentVal}/${currentTotal}</span><i class="fa-solid fa-pencil cell-edit-icon" style="opacity: 0; color: #94a3b8; font-size: 0.75rem; margin-left: 6px; transition: opacity 0.2s;"></i>`;
              cell.style.backgroundColor = '#fee2e2';
              setTimeout(() => { cell.style.backgroundColor = ''; }, 1000);
            }
          };

          // Safe blur checks
          const checkAndSave = () => {
            setTimeout(() => {
              if (document.activeElement !== valInput && document.activeElement !== totalInput) {
                saveInlineEdit();
              }
            }, 100);
          };

          valInput.addEventListener('blur', checkAndSave);
          totalInput.addEventListener('blur', checkAndSave);

          const handleKeydown = (evt) => {
            if (evt.key === 'Enter') {
              saveInlineEdit();
            } else if (evt.key === 'Escape') {
              valInput.removeEventListener('blur', checkAndSave);
              totalInput.removeEventListener('blur', checkAndSave);
              cell.innerHTML = `<span>${currentVal}/${currentTotal}</span><i class="fa-solid fa-pencil cell-edit-icon" style="opacity: 0; color: #94a3b8; font-size: 0.75rem; margin-left: 6px; transition: opacity 0.2s;"></i>`;
            }
          };

          valInput.addEventListener('keydown', handleKeydown);
          totalInput.addEventListener('keydown', handleKeydown);
        });
      });

      // Attach WhatsApp link listeners
      container.querySelectorAll('.db-wa-link').forEach(link => {
        link.addEventListener('mouseenter', () => { link.style.transform = 'scale(1.2)'; });
        link.addEventListener('mouseleave', () => { link.style.transform = 'scale(1)'; });
        link.addEventListener('click', (e) => {
          e.preventDefault();
          window.openWaDraftModal({
            name: link.dataset.name,
            phone: link.dataset.phone,
            attendance: link.dataset.attendance,
            attendanceTotal: link.dataset.attendanceTotal,
            assignments: link.dataset.assignments,
            assignmentsTotal: link.dataset.assignmentsTotal
          });
        });
      });
    };

    // Helper functions for WhatsApp draft modal setup
    function setupWaDraftModalEvents() {
      if (document.getElementById('waDraftModal')) return;

      const modalHtml = `
        <div id="waDraftModal" style="display: none; position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); z-index: 9999; align-items: center; justify-content: center; padding: 16px;">
          <div style="background: white; border-radius: 16px; max-width: 500px; width: 100%; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); display: flex; flex-direction: column; overflow: hidden; border: 1px solid #e2e8f0; animation: modalFadeIn 0.3s ease-out;">
            <div style="background: linear-gradient(135deg, #128C7E, #075E54); padding: 20px; color: white; display: flex; align-items: center; justify-content: space-between;">
              <div style="display: flex; align-items: center; gap: 10px;">
                <i class="fa-brands fa-whatsapp" style="font-size: 1.5rem;"></i>
                <h3 style="margin: 0; font-size: 1.2rem; font-weight: 700; font-family: 'Poppins', sans-serif;" id="waDraftModalTitle">Draft WhatsApp Message</h3>
              </div>
              <button type="button" id="waDraftCloseBtn" style="background: transparent; border: none; color: white; font-size: 1.25rem; cursor: pointer; opacity: 0.8; line-height: 1;">&times;</button>
            </div>
            
            <div style="padding: 24px; display: flex; flex-direction: column; gap: 16px;">
              <div>
                <label style="display: block; font-weight: 700; font-size: 0.85rem; color: #475569; margin-bottom: 6px;">Message Draft:</label>
                <textarea id="waDraftTextarea" rows="6" style="width: 100%; padding: 12px; border-radius: 10px; border: 1px solid #cbd5e1; outline: none; font-size: 0.9rem; font-family: inherit; resize: vertical;" placeholder="Type or generate your message here..."></textarea>
              </div>

              <div style="border-top: 1px solid #e2e8f0; padding-top: 16px;">
                <label style="display: block; font-weight: 700; font-size: 0.85rem; color: #475569; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
                  <i class="fa-solid fa-robot" style="color: #075E54;"></i> AI Draft Assistant
                </label>
                <div style="display: flex; gap: 8px;">
                  <input type="text" id="waAiPrompt" placeholder="Ask AI to draft... (e.g. Warn about low attendance)" style="flex: 1; padding: 8px 12px; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 0.85rem; outline: none;">
                  <button type="button" id="waAiDraftBtn" style="background: #075E54; color: white; border: none; padding: 8px 16px; border-radius: 8px; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.2s; display: flex; align-items: center;">
                    <span id="waAiBtnText">Generate</span>
                    <i class="fa-solid fa-spinner fa-spin" id="waAiSpinner" style="display: none; margin-left: 6px;"></i>
                  </button>
                </div>
              </div>

              <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 8px;">
                <button type="button" id="waCancelBtn" style="background: #f1f5f9; border: 1px solid #cbd5e1; padding: 10px 18px; border-radius: 8px; font-size: 0.9rem; font-weight: 600; color: #475569; cursor: pointer; transition: all 0.2s;">Cancel</button>
                <button type="button" id="waSendBtn" style="background: #25D366; border: none; padding: 10px 18px; border-radius: 8px; font-size: 0.9rem; font-weight: 700; color: white; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all 0.2s; box-shadow: 0 4px 6px -1px rgba(37, 211, 102, 0.2);">
                  Send <i class="fa-solid fa-paper-plane"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
        <style>
          @keyframes modalFadeIn {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
          }
        </style>
      `;
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = modalHtml;
      document.body.appendChild(tempDiv.firstElementChild);
      if (tempDiv.querySelector('style')) {
        document.head.appendChild(tempDiv.querySelector('style'));
      }

      const modal = document.getElementById('waDraftModal');
      const closeBtn = document.getElementById('waDraftCloseBtn');
      const cancelBtn = document.getElementById('waCancelBtn');
      const sendBtn = document.getElementById('waSendBtn');
      const aiDraftBtn = document.getElementById('waAiDraftBtn');
      const aiPromptInput = document.getElementById('waAiPrompt');
      const textarea = document.getElementById('waDraftTextarea');

      let currentPhone = '';

      const closeWaModal = () => {
        modal.style.display = 'none';
        textarea.value = '';
        aiPromptInput.value = '';
      };

      closeBtn.onclick = closeWaModal;
      cancelBtn.onclick = closeWaModal;

      // Attach hover effects dynamically to stay CSP-compliant
      closeBtn.addEventListener('mouseenter', () => { closeBtn.style.opacity = '1'; });
      closeBtn.addEventListener('mouseleave', () => { closeBtn.style.opacity = '0.8'; });
      
      aiDraftBtn.addEventListener('mouseenter', () => { aiDraftBtn.style.background = '#128C7E'; });
      aiDraftBtn.addEventListener('mouseleave', () => { aiDraftBtn.style.background = '#075E54'; });
      
      cancelBtn.addEventListener('mouseenter', () => { cancelBtn.style.background = '#e2e8f0'; });
      cancelBtn.addEventListener('mouseleave', () => { cancelBtn.style.background = '#f1f5f9'; });
      
      sendBtn.addEventListener('mouseenter', () => { sendBtn.style.background = '#20ba5a'; });
      sendBtn.addEventListener('mouseleave', () => { sendBtn.style.background = '#25D366'; });

      window.openWaDraftModal = (studentData) => {
        currentPhone = studentData.phone;
        document.getElementById('waDraftModalTitle').textContent = `Draft Message to ${studentData.name}`;
        
        const isTeacher = (user.role || '').toLowerCase() === 'teacher';
        let defaultMsg = `Hello ${studentData.name},\n\n`;
        if (isTeacher) {
          defaultMsg += `I wanted to reach out regarding your progress in class. Your attendance is currently ${studentData.attendance}/${studentData.attendanceTotal} and you have submitted ${studentData.assignments}/${studentData.assignmentsTotal} assignments. Please make sure to complete pending tasks.`;
        } else {
          defaultMsg += `I wanted to reach out to check in. Let's discuss your attendance (${studentData.attendance}/${studentData.attendanceTotal}) and academics when you're free.`;
        }
        textarea.value = defaultMsg;
        modal.style.display = 'flex';
        aiPromptInput.focus();
      };

      aiDraftBtn.onclick = async () => {
        const promptText = aiPromptInput.value.trim();
        if (!promptText) return alert('Please enter a prompt for the AI Assistant.');

        const btnText = document.getElementById('waAiBtnText');
        const spinner = document.getElementById('waAiSpinner');
        
        btnText.style.display = 'none';
        spinner.style.display = 'inline-block';
        aiDraftBtn.disabled = true;

        try {
          const studentName = document.getElementById('waDraftModalTitle').textContent.replace('Draft Message to ', '');
          const contextPrompt = `Draft a brief, professional message for WhatsApp to a student named ${studentName} with the following context: "${promptText}". Use clear, direct sentences, keeping in mind the message will be sent via WhatsApp.`;
          
          const res = await fetch(`${apiBase}/api/ai/chat`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${user.token || ''}`
            },
            body: JSON.stringify({
              text: contextPrompt,
              clientContext: {
                targetStudent: studentName,
                userRole: user.role
              }
            })
          });

          if (!res.ok) throw new Error();
          const data = await res.json();
          
          let reply = data.response?.message || data.response || data.message || '';
          reply = reply.replace(/\*\*/g, '*'); // Convert markdown bold to WhatsApp bold
          
          if (reply) {
            textarea.value = reply;
          } else {
            alert('Could not generate message draft.');
          }
        } catch (err) {
          alert('Failed to connect to AI Assistant. Please draft manually.');
        } finally {
          btnText.style.display = 'inline';
          spinner.style.display = 'none';
          aiDraftBtn.disabled = false;
        }
      };

      sendBtn.onclick = () => {
        const msg = textarea.value.trim();
        if (!msg) return alert('Message draft cannot be empty.');
        
        const encodedMsg = encodeURIComponent(msg);
        const url = `https://wa.me/${currentPhone}?text=${encodedMsg}`;
        window.open(url, '_blank');
        closeWaModal();
      };
    }

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
    const userRole = (user.role || '').toLowerCase();
    
    if (userRole === 'hod') {
      const temp = document.createElement('div');
      temp.innerHTML = html;
      
      const hasBackButton = temp.querySelector('[id*="BackBtn"]') || temp.querySelector('[class*="back-btn"]') || temp.querySelector('.hod-dynamic-back-btn');
      
      if (!hasBackButton) {
        const header = temp.querySelector('.section-header') || temp.querySelector('h2');
        if (header) {
          const backBtnHtml = `
            <button type="button" class="hod-dynamic-back-btn" style="background: #f8fafc; border: 1px solid #e2e8f0; font-size: 1.1rem; color: #475569; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; width: 42px; height: 42px; border-radius: 50%; transition: all 0.2s; margin-right: 12px; vertical-align: middle; flex-shrink: 0;" onmouseenter="this.style.background='#e2e8f0';" onmouseleave="this.style.background='#f8fafc';">
              <i class="fa-solid fa-arrow-left"></i>
            </button>
          `;
          
          const titleH2 = header.querySelector('h2') || (header.tagName === 'H2' ? header : null);
          if (titleH2) {
            titleH2.style.display = 'inline-flex';
            titleH2.style.alignItems = 'center';
            titleH2.insertAdjacentHTML('afterbegin', backBtnHtml);
          } else {
            header.insertAdjacentHTML('afterbegin', backBtnHtml);
          }
        } else {
          const backRowHtml = `
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px;">
              <button type="button" class="hod-dynamic-back-btn" style="background: #f8fafc; border: 1px solid #e2e8f0; font-size: 1.1rem; color: #475569; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 42px; height: 42px; border-radius: 50%; transition: all 0.2s;" onmouseenter="this.style.background='#e2e8f0';" onmouseleave="this.style.background='#f8fafc';">
                <i class="fa-solid fa-arrow-left"></i>
              </button>
              <span style="font-size: 0.95rem; font-weight: 600; color: #64748b; cursor: pointer;">Back to Dashboard</span>
            </div>
          `;
          temp.insertAdjacentHTML('afterbegin', backRowHtml);
        }
      }
      
      el.innerHTML = temp.innerHTML;
      
      el.querySelectorAll('.hod-dynamic-back-btn').forEach(btn => {
        btn.addEventListener('click', goToDashboard);
        const span = btn.nextElementSibling;
        if (span && span.tagName === 'SPAN' && span.textContent === 'Back to Dashboard') {
          span.addEventListener('click', goToDashboard);
        }
      });
    } else {
      el.innerHTML = html;
    }
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
      : role === 'hosteler' ? `${rootPrefix}student/index.html`
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
    
    text = text.replace(/\[EVENT_META:(.*?)\]/g, '');
    
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

  async function renderRoutinePage(info) {
    // Clean up any lingering modals in document.body
    document.body.querySelectorAll('#routineSlotModal, #messSlotModal').forEach(m => m.remove());

    // Hide default hero
    const hero = document.getElementById('home');
    if (hero) hero.style.display = 'none';

    const role = (user.role || 'Guest').toLowerCase();
    const isTeacher = role === 'teacher';
    const isStudent = role === 'student' || role === 'hosteler';
    const isWarden = role === 'warden';
    const isHOD = role === 'hod';
    const isPrincipal = role === 'principal';
    const isEditor = isHOD || isPrincipal;
    const isEditMode = isEditor && cfg.mode === 'post';

    // CSS injection for routine grid to ensure beautiful look and fit on one screen
    if (!document.getElementById('routine-grid-styles')) {
      const styles = document.createElement('style');
      styles.id = 'routine-grid-styles';
      styles.innerHTML = `
        .routine-grid-container {
          background: #ffffff;
          border-radius: 18px;
          padding: 16px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.04);
          border: 1px solid #f1f5f9;
          margin-bottom: 24px;
        }
        .routine-grid {
          display: grid;
          grid-template-columns: 110px repeat(8, 1fr);
          gap: 6px;
        }
        .routine-grid.current-day-row {
          background: #f1f5f9 !important;
          border-radius: 8px;
        }
        .routine-grid.current-day-row .routine-slot-cell:not(.assigned) {
          background: #e2e8f0 !important;
          border-color: #cbd5e1 !important;
        }
        .routine-header-cell {
          font-weight: 700;
          font-size: 0.75rem;
          color: #4f46e5;
          text-align: center;
          padding: 10px 4px;
          background: #f8fafc;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .routine-day-cell {
          font-weight: 700;
          font-size: 0.8rem;
          color: #1e1b4b;
          background: #f1f5f9;
          padding: 8px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #cbd5e1;
        }
        .routine-day-cell.current-day {
          background: #6b46c1 !important;
          color: #ffffff !important;
          border-color: #6b46c1 !important;
          box-shadow: 0 0 8px rgba(107, 70, 193, 0.2);
        }
        .routine-slot-cell {
          background: #fafafa;
          border: 1px dashed #e2e8f0;
          border-radius: 8px;
          padding: 6px 4px;
          min-height: 52px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          font-size: 0.7rem;
          transition: all 0.2s;
          cursor: default;
        }
        .routine-slot-cell.assigned {
          background: linear-gradient(135deg, #f5f3ff, #ede9fe);
          border: 1px solid #c084fc;
          color: #581c87;
          cursor: pointer;
        }
        .routine-slot-cell.assigned:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(168, 85, 247, 0.15);
        }
        .routine-slot-cell.editable {
          cursor: pointer;
          border-style: solid;
        }
        .routine-slot-cell.editable:hover {
          border-color: #6b46c1;
          background: #fdfeff;
          box-shadow: inset 0 0 0 1px #6b46c1;
        }
        .routine-cell-subject {
          font-weight: 800;
          font-size: 0.75rem;
          line-height: 1.2;
          color: #1e1b4b;
        }
        .routine-cell-teacher {
          font-size: 0.65rem;
          color: #6b7280;
          margin-top: 3px;
          font-weight: 600;
        }
        .routine-cell-meta {
          font-size: 0.6rem;
          color: #8b5cf6;
          margin-top: 2px;
          font-weight: 500;
        }
        .routine-cell-free {
          color: #cbd5e1;
          font-style: italic;
          font-size: 0.65rem;
        }
        /* Modal Style Override */
        .routine-modal-overlay {
          position: fixed;
          top: 0; left: 0; width: 100%; height: 100%;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(4px);
          z-index: 9999;
          display: none;
          align-items: center;
          justify-content: center;
        }
        .routine-modal {
          background: #ffffff;
          border-radius: 16px;
          padding: 24px;
          max-width: 400px;
          width: 90%;
          box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
          border: 1px solid #e2e8f0;
          animation: modalFadeIn 0.2s ease-out;
        }
        @keyframes modalFadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `;
      document.head.appendChild(styles);
    }

    const html = `
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 16px;">
        <div style="display: flex; align-items: center; gap: 16px;">
          <button type="button" id="routineBackBtn" style="background: #f8fafc; border: 1px solid #e2e8f0; font-size: 1.1rem; color: #475569; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 42px; height: 42px; border-radius: 50%; transition: all 0.2s;" onmouseenter="this.style.background='#e2e8f0';" onmouseleave="this.style.background='#f8fafc';">
            <i class="fa-solid fa-arrow-left"></i>
          </button>
          <div>
            <h2 style="margin: 0; font-size: 1.6rem; font-weight: 800; color: #1e1b4b; font-family: 'Poppins', sans-serif;">
              ${isEditMode ? 'Routine Management' : 'Class Routine'}
            </h2>
            <p id="routineSub" style="margin: 4px 0 0 0; font-size: 0.85rem; color: #64748b; font-weight: 500;">
              Loading routine details...
            </p>
          </div>
        </div>
        <div id="routineActionArea" style="display: flex; gap: 10px; align-items: center; justify-content: flex-end; flex-wrap: wrap;"></div>
      </div>

      <!-- Main routine grid wrapper -->
      <div id="routineGridWrapper" style="width: 100%; overflow-x: auto;">
        <div style="text-align: center; padding: 40px; color: #64748b;">
          <i class="fa-solid fa-spinner fa-spin" style="font-size: 1.5rem; margin-bottom: 8px;"></i>
          <div>Loading routine details...</div>
        </div>
      </div>

      <!-- Custom Routine Edit Modal -->
      <div id="routineSlotModal" class="routine-modal-overlay">
        <div class="routine-modal">
          <h3 id="routineModalTitle" style="margin-top: 0; margin-bottom: 8px; font-size: 1.15rem; font-weight: 700; color: #1e1b4b;">Edit Routine Slot</h3>
          <p id="routineModalInfo" style="font-size: 0.8rem; color: #64748b; margin-bottom: 20px; line-height: 1.4;"></p>
          
          <div style="margin-bottom: 20px;">
            <label style="display: block; font-weight: 600; font-size: 0.8rem; color: #475569; margin-bottom: 8px;">Subject & Teacher</label>
            <select id="routineModalSelect" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #cbd5e1; outline: none; background: white; font-family: 'Inter', sans-serif; font-size: 0.85rem; color: #1e1b4b;"></select>
          </div>

          <div style="display: flex; gap: 8px; justify-content: flex-end;">
            <button type="button" id="routineModalDeleteBtn" class="btn-outline-red" style="font-size: 0.8rem; padding: 8px 12px; border-radius: 8px; font-weight: 600; cursor: pointer;">Clear Slot</button>
            <button type="button" id="routineModalCancelBtn" class="btn-outline-purple" style="font-size: 0.8rem; padding: 8px 12px; border-radius: 8px; font-weight: 600; cursor: pointer; background: transparent; border: 1px solid #e2e8f0; color: #475569;">Cancel</button>
            <button type="button" id="routineModalSaveBtn" class="btn-filled-purple" style="font-size: 0.8rem; padding: 8px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; background: #6b46c1; color: white; border: none;">Save</button>
          </div>
        </div>
      </div>
    `;

    const el = content(html);
    document.getElementById('routineBackBtn')?.addEventListener('click', goToDashboard);

    // Helper to map semester numbers to years
    function getYearFromSemester(sem) {
      const s = parseInt(sem);
      if (s <= 2) return '1st Year';
      if (s <= 4) return '2nd Year';
      if (s <= 6) return '3rd Year';
      return '4th Year';
    }

    // Filter selectors state
    let dept = user.department || 'CSE';
    let semester = user.semester || 1;
    let year = getYearFromSemester(semester);
    let batch = user.batch ? (user.batch.startsWith('Batch') ? user.batch : 'Batch ' + user.batch) : 'Batch 1';

    // Populate selectors in the right-side Action Area
    function updateSelectors() {
      const actionArea = document.getElementById('routineActionArea');
      if (!actionArea) return;

      const depts = ['CSE', 'ECE', 'EE', 'ME', 'CE', 'IT'];
      const sems = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6', 'Sem 7', 'Sem 8'];
      const batches = ['Batch 1', 'Batch 2'];

      let actionHTML = '';

      if (!isTeacher) {
        // Dept selector
        if (isPrincipal || isWarden) {
          actionHTML += `
            <select id="selDept" style="padding: 6px 10px; border-radius: 8px; border: 1px solid #cbd5e1; outline: none; background: #fff; font-size: 0.8rem; font-weight: 600; color: #475569;">
              ${depts.map(d => `<option value="${d}" ${d === dept ? 'selected' : ''}>Dept: ${d}</option>`).join('')}
            </select>
          `;
        } else {
          actionHTML += `<span style="font-size: 0.75rem; font-weight: 700; color: #6b46c1; background:#f5f3ff; padding: 6px 12px; border-radius: 8px; border: 1px solid #c084fc;">Dept: ${dept}</span>`;
        }

        // Semester selector
        if (isStudent) {
          actionHTML += `<span style="font-size: 0.75rem; font-weight: 700; color: #6b46c1; background:#f5f3ff; padding: 6px 12px; border-radius: 8px; border: 1px solid #c084fc;">Sem: ${semester}</span>`;
        } else {
          actionHTML += `
            <select id="selSemester" style="padding: 6px 10px; border-radius: 8px; border: 1px solid #cbd5e1; outline: none; background: #fff; font-size: 0.8rem; font-weight: 600; color: #475569;">
              ${sems.map((s, idx) => `<option value="${idx + 1}" ${idx + 1 === parseInt(semester) ? 'selected' : ''}>${s}</option>`).join('')}
            </select>
          `;
        }

        // Batch selector
        if (isStudent) {
          actionHTML += `<span style="font-size: 0.75rem; font-weight: 700; color: #6b46c1; background:#f5f3ff; padding: 6px 12px; border-radius: 8px; border: 1px solid #c084fc;">Batch: ${batch}</span>`;
        } else {
          actionHTML += `
            <select id="selBatch" style="padding: 6px 10px; border-radius: 8px; border: 1px solid #cbd5e1; outline: none; background: #fff; font-size: 0.8rem; font-weight: 600; color: #475569;">
              ${batches.map(b => `<option value="${b}" ${b === batch ? 'selected' : ''}>Batch: ${b}</option>`).join('')}
            </select>
          `;
        }
      }

      // Add Edit / View switcher button
      if (isEditor) {
        const modeBtn = isEditMode
          ? `<a href="view.html" class="btn-pill btn-outline-purple" style="font-size: 0.85rem; font-weight: 600; text-decoration: none; padding: 6px 14px;"><i class="fa-solid fa-eye"></i> View</a>`
          : `<a href="post.html" class="btn-pill btn-filled-purple" style="font-size: 0.85rem; font-weight: 600; background:#6b46c1; color:white; text-decoration: none; padding: 6px 14px;"><i class="fa-solid fa-pen-to-square"></i> Edit</a>`;
        actionHTML += modeBtn;
      }

      actionArea.innerHTML = actionHTML;

      // Event listeners
      document.getElementById('selDept')?.addEventListener('change', e => {
        dept = e.target.value;
        loadData();
      });
      document.getElementById('selSemester')?.addEventListener('change', e => {
        semester = parseInt(e.target.value);
        year = getYearFromSemester(semester);
        loadData();
      });
      document.getElementById('selBatch')?.addEventListener('change', e => {
        batch = e.target.value;
        loadData();
      });
    }

    const timeSlots = [
      "09:30 - 10:30", "10:30 - 11:30", "11:30 - 12:30", "12:30 - 01:30",
      "01:30 - 02:30", "02:30 - 03:30", "03:30 - 04:30", "04:30 - 05:30"
    ];
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    let loadedRoutine = [];
    let loadedSubjects = [];

    updateSelectors();
    await loadData();

    async function loadData() {
      const gridWrapper = document.getElementById('routineGridWrapper');
      if (gridWrapper) {
        gridWrapper.innerHTML = `
          <div style="text-align: center; padding: 40px; color: #64748b;">
            <i class="fa-solid fa-spinner fa-spin" style="font-size: 1.5rem; margin-bottom: 8px;"></i>
            <div>Loading routine...</div>
          </div>
        `;
      }

      try {
        const token = user.token || localStorage.getItem('token') || '';
        
        // 1. Fetch Routine
        let routineUrl = '';
        if (isTeacher) {
          routineUrl = `${apiBase}/api/routine/teacher`;
        } else {
          // Send normalized batch
          const normalizedBatch = batch.match(/^\d+$/) ? `Batch ${batch}` : batch;
          routineUrl = `${apiBase}/api/routine/student?year=${encodeURIComponent(year)}&semester=${semester}&batch=${encodeURIComponent(normalizedBatch)}&department=${encodeURIComponent(dept)}`;
        }

        const resRoutine = await fetch(routineUrl, { headers: { Authorization: `Bearer ${token}` } });
        if (!resRoutine.ok) throw new Error('Routine load error');
        loadedRoutine = await resRoutine.json();

        // Update Subtitle
        const subtitle = document.getElementById('routineSub');
        if (subtitle) {
          if (isTeacher) {
            subtitle.innerText = `Teaching schedule for ${user.name}`;
          } else {
            subtitle.innerText = `Schedule for ${dept} department, ${year} (${batch})`;
          }
        }

        // 2. Fetch Subjects if Edit mode to populate selector
        if (isEditMode) {
          const resSubjects = await fetch(`${apiBase}/api/subjects?dept=${encodeURIComponent(dept)}&semester=${semester}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (resSubjects.ok) {
            loadedSubjects = await resSubjects.json();
          }
        }

        renderGrid();

      } catch (err) {
        console.error(err);
        if (gridWrapper) {
          gridWrapper.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #ef4444;">
              <i class="fa-solid fa-triangle-exclamation" style="font-size: 2rem; margin-bottom: 8px;"></i>
              <div>Failed to load routine data. Please try again.</div>
            </div>
          `;
        }
      }
    }

    function renderGrid() {
      const wrapper = document.getElementById('routineGridWrapper');
      if (!wrapper) return;

      let gridHTML = `
        <div class="routine-grid-container">
          <div class="routine-grid" style="margin-bottom: 6px;">
            <div class="routine-header-cell" style="background: #e0e7ff; color: #4338ca;">Day / Time</div>
            ${timeSlots.map(slot => `<div class="routine-header-cell">${slot}</div>`).join('')}
          </div>
      `;

      const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'long' });

      days.forEach(day => {
        const isToday = day === currentDay;
        const dayCellClass = isToday ? 'routine-day-cell current-day' : 'routine-day-cell';
        gridHTML += `
          <div class="routine-grid ${isToday ? 'current-day-row' : ''}" style="margin-bottom: 6px;">
            <div class="${dayCellClass}">${day}</div>
        `;

        timeSlots.forEach((slot, index) => {
          // Find if there is a class scheduled
          const entry = loadedRoutine.find(e => e.day === day && e.timeSlot === slot);
          
          if (entry) {
            const subjectName = entry.subjectName || entry.subject?.name || 'Class';
            const teacherName = entry.teacher?.name || 'TBA';
            const isLab = subjectName.toLowerCase().includes('lab');
            const isBreak = subjectName.toLowerCase() === 'break';
            
            let bgStyle = 'background: linear-gradient(135deg, #f5f3ff, #ede9fe); border: 1px solid #c084fc; color: #581c87;';
            if (isLab) {
              bgStyle = 'background: linear-gradient(135deg, #ecfdf5, #d1fae5); border: 1px solid #34d399; color: #065f46;';
            } else if (isBreak) {
              bgStyle = 'background: linear-gradient(135deg, #f1f5f9, #e2e8f0); border: 1px solid #cbd5e1; color: #475569;';
            }

            if (isToday) {
              if (isBreak) {
                bgStyle = 'background: linear-gradient(135deg, #e2e8f0, #cbd5e1); border: 1px solid #94a3b8; color: #1e293b;';
              } else {
                bgStyle = 'background: linear-gradient(135deg, #e9d5ff, #c084fc); border: 1px solid #a855f7; color: #3b0764;';
                if (isLab) {
                  bgStyle = 'background: linear-gradient(135deg, #a7f3d0, #34d399); border: 1px solid #059669; color: #022c22;';
                }
              }
            }

            let cellDetails = '';
            if (isBreak) {
              cellDetails = '';
            } else if (isTeacher) {
              // Show Target Batch/Dept
              const targetDept = entry.department || '';
              const targetYear = entry.year || '';
              const targetBatch = entry.batch || '';
              cellDetails = `<div class="routine-cell-meta"><i class="fa-solid fa-graduation-cap"></i> ${targetDept} ${targetYear} (${targetBatch})</div>`;
            } else {
              cellDetails = `<div class="routine-cell-teacher"><i class="fa-solid fa-chalkboard-user"></i> ${teacherName}</div>`;
            }

            gridHTML += `
              <div class="routine-slot-cell assigned ${isBreak ? 'break-slot' : ''} ${isEditMode ? 'editable' : ''}" style="${bgStyle}" data-day="${day}" data-slot="${slot}" data-index="${index}" data-id="${entry._id}">
                <div class="routine-cell-subject">${esc(subjectName)}</div>
                ${cellDetails}
              </div>
            `;
          } else {
            // Free slot
            gridHTML += `
              <div class="routine-slot-cell ${isEditMode ? 'editable' : ''}" data-day="${day}" data-slot="${slot}" data-index="${index}">
                <span class="routine-cell-free">-</span>
              </div>
            `;
          }
        });

        gridHTML += `</div>`; // Close row
      });

      gridHTML += `</div>`; // Close container
      wrapper.innerHTML = gridHTML;

      // Click cell handlers for edit mode
      if (isEditMode) {
        wrapper.querySelectorAll('.routine-slot-cell.editable').forEach(cell => {
          cell.addEventListener('click', () => {
            const cellDay = cell.dataset.day;
            const cellSlot = cell.dataset.slot;
            openEditModal(cellDay, cellSlot);
          });
        });
      }
    }

    function openEditModal(cellDay, cellSlot) {
      const modal = document.getElementById('routineSlotModal');
      if (!modal) return;
      if (modal.parentElement !== document.body) {
        document.body.appendChild(modal);
      }
      const infoText = document.getElementById('routineModalInfo');
      const select = document.getElementById('routineModalSelect');
      const saveBtn = document.getElementById('routineModalSaveBtn');
      const deleteBtn = document.getElementById('routineModalDeleteBtn');
      const cancelBtn = document.getElementById('routineModalCancelBtn');

      if (!select) return;

      infoText.innerText = `Schedule slot on ${cellDay} at ${cellSlot} for ${dept} ${year} (${batch})`;
      
      // Build options dropdown based on HOD decisions
      let optionsHTML = `
        <option value="FREE">No Class (Free period)</option>
        <option value="BREAK">Break</option>
      `;
      loadedSubjects.forEach(s => {
        let teacherName = 'TBA';
        
        // Find batch-specific assignment
        if (s.batchAssignments && s.batchAssignments.length > 0) {
          const match = s.batchAssignments.find(ba => ba.batch === batch || ba.batch === batch.replace('Batch ', ''));
          if (match && match.teacher) {
            teacherName = match.teacher.name || 'Assigned';
          }
        }
        
        // Fallback to general teachers
        if (teacherName === 'TBA' && s.teachers && s.teachers.length > 0) {
          teacherName = s.teachers[0].name || 'Assigned';
        }
        
        if (teacherName === 'TBA' && s.teacher) {
          teacherName = s.teacher.name || 'Assigned';
        }

        optionsHTML += `<option value="${s._id}">${esc(s.name)} (${esc(teacherName)})</option>`;
      });

      select.innerHTML = optionsHTML;

      // Pre-select current subject if assigned
      const entry = loadedRoutine.find(e => e.day === cellDay && e.timeSlot === cellSlot);
      if (entry) {
        if (entry.subjectName && entry.subjectName.toLowerCase() === 'break') {
          select.value = 'BREAK';
        } else if (entry.subject) {
          select.value = entry.subject._id || entry.subject;
        } else {
          select.value = 'BREAK';
        }
        deleteBtn.style.display = 'block';
      } else {
        select.value = 'FREE';
        deleteBtn.style.display = 'none';
      }

      modal.style.display = 'flex';

      // Setup Save Handler
      saveBtn.onclick = async () => {
        const token = user.token || localStorage.getItem('token') || '';
        const subjectId = select.value;

        const deptEl = document.getElementById('selDept');
        const semEl = document.getElementById('selSemester');
        const batchEl = document.getElementById('selBatch');

        const activeDept = deptEl ? deptEl.value : dept;
        const activeSem = semEl ? parseInt(semEl.value) : semester;
        const activeBatch = batchEl ? batchEl.value : batch;
        const activeYear = getYearFromSemester(activeSem);
        const normalizedBatch = activeBatch.match(/^\d+$/) ? `Batch ${activeBatch}` : activeBatch;

        if (subjectId === 'FREE') {
          // No Class selected -> delete the slot
          try {
            const res = await fetch(`${apiBase}/api/routine`, {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({
                day: cellDay,
                timeSlot: cellSlot,
                year: activeYear,
                semester: activeSem,
                batch: normalizedBatch,
                department: activeDept
              })
            });
            if (!res.ok) throw new Error('Delete failed');
            modal.style.display = 'none';
            await loadData();
          } catch (err) {
            alert('Error: ' + err.message);
          }
          return;
        }

        const body = {
          day: cellDay,
          timeSlot: cellSlot,
          year: activeYear,
          semester: activeSem,
          department: activeDept,
          batch: normalizedBatch,
          subjectId: subjectId
        };

        try {
          const res = await fetch(`${apiBase}/api/routine`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(body)
          });

          if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.message || 'Save failed');
          }

          modal.style.display = 'none';
          await loadData();
        } catch (err) {
          alert('Error: ' + err.message);
        }
      };

      // Setup Delete Handler
      deleteBtn.onclick = async () => {
        if (!confirm('Clear this class slot?')) return;
        const token = user.token || localStorage.getItem('token') || '';

        const deptEl = document.getElementById('selDept');
        const semEl = document.getElementById('selSemester');
        const batchEl = document.getElementById('selBatch');

        const activeDept = deptEl ? deptEl.value : dept;
        const activeSem = semEl ? parseInt(semEl.value) : semester;
        const activeBatch = batchEl ? batchEl.value : batch;
        const activeYear = getYearFromSemester(activeSem);
        const normalizedBatch = activeBatch.match(/^\d+$/) ? `Batch ${activeBatch}` : activeBatch;

        try {
          const res = await fetch(`${apiBase}/api/routine`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              day: cellDay,
              timeSlot: cellSlot,
              year: activeYear,
              semester: activeSem,
              batch: normalizedBatch,
              department: activeDept
            })
          });

          if (!res.ok) throw new Error('Delete failed');
          modal.style.display = 'none';
          await loadData();
        } catch (err) {
          alert('Error: ' + err.message);
        }
      };

      cancelBtn.onclick = () => {
        modal.style.display = 'none';
      };
      modal.onclick = (e) => {
        if (e.target === modal) {
          modal.style.display = 'none';
        }
      };
    }
  }

  async function renderMessMenuPage(info) {
    // Clean up any lingering modals in document.body
    document.body.querySelectorAll('#routineSlotModal, #messSlotModal').forEach(m => m.remove());

    // Hide default hero
    const hero = document.getElementById('home');
    if (hero) hero.style.display = 'none';

    const role = (user.role || 'Guest').toLowerCase();
    const isWarden = role === 'warden';
    const isPrincipal = role === 'principal';
    const isAdmin = role === 'admin';
    const isWardenOrPrincipal = isWarden || isPrincipal || isAdmin;
    const isEditMode = isWardenOrPrincipal && cfg.mode === 'post';

    // CSS injection for mess menu grid
    if (!document.getElementById('mess-grid-styles')) {
      const styles = document.createElement('style');
      styles.id = 'mess-grid-styles';
      styles.innerHTML = `
        .mess-grid-container {
          background: #ffffff;
          border-radius: 18px;
          padding: 16px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.04);
          border: 1px solid #f1f5f9;
          margin-bottom: 24px;
        }
        .mess-grid {
          display: grid;
          grid-template-columns: 110px repeat(4, 1fr);
          gap: 8px;
        }
        .mess-grid.current-day-row {
          background: #f1f5f9 !important;
          border-radius: 8px;
        }
        .mess-grid.current-day-row .mess-slot-cell:not(.assigned) {
          background: #e2e8f0 !important;
          border-color: #cbd5e1 !important;
        }
        .mess-header-cell {
          font-weight: 700;
          font-size: 0.75rem;
          color: #4f46e5;
          text-align: center;
          padding: 10px 4px;
          background: #f8fafc;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .mess-day-cell {
          font-weight: 700;
          font-size: 0.8rem;
          color: #1e1b4b;
          background: #f1f5f9;
          padding: 8px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #cbd5e1;
        }
        .mess-day-cell.current-day {
          background: #6b46c1 !important;
          color: #ffffff !important;
          border-color: #6b46c1 !important;
          box-shadow: 0 0 8px rgba(107, 70, 193, 0.2);
        }
        .mess-slot-cell {
          background: #fafafa;
          border: 1px dashed #e2e8f0;
          border-radius: 8px;
          padding: 8px 6px;
          min-height: 58px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          font-size: 0.75rem;
          transition: all 0.2s;
          cursor: default;
        }
        .mess-slot-cell.assigned {
          background: linear-gradient(135deg, #f5f3ff, #ede9fe);
          border: 1px solid #c084fc;
          color: #581c87;
        }
        .mess-slot-cell.assigned:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(168, 85, 247, 0.15);
        }
        .mess-slot-cell.editable {
          cursor: pointer;
          border-style: solid;
        }
        .mess-slot-cell.editable:hover {
          border-color: #6b46c1;
          background: #fdfeff;
          box-shadow: inset 0 0 0 1px #6b46c1;
        }
        .mess-cell-food {
          font-weight: 800;
          font-size: 0.75rem;
          line-height: 1.2;
          color: #1e1b4b;
        }
        .mess-cell-empty {
          color: #cbd5e1;
          font-style: italic;
          font-size: 0.65rem;
        }
        /* Modal Style Override */
        .routine-modal-overlay {
          position: fixed;
          top: 0; left: 0; width: 100%; height: 100%;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(4px);
          z-index: 9999;
          display: none;
          align-items: center;
          justify-content: center;
        }
        .routine-modal {
          background: #ffffff;
          border-radius: 16px;
          padding: 24px;
          max-width: 400px;
          width: 90%;
          box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
          border: 1px solid #e2e8f0;
          animation: modalFadeIn 0.2s ease-out;
        }
        @keyframes modalFadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `;
      document.head.appendChild(styles);
    }

    const html = `
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 16px;">
        <div style="display: flex; align-items: center; gap: 16px;">
          <button type="button" id="messBackBtn" style="background: #f8fafc; border: 1px solid #e2e8f0; font-size: 1.1rem; color: #475569; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 42px; height: 42px; border-radius: 50%; transition: all 0.2s;" onmouseenter="this.style.background='#e2e8f0';" onmouseleave="this.style.background='#f8fafc';">
            <i class="fa-solid fa-arrow-left"></i>
          </button>
          <div>
            <h2 style="margin: 0; font-size: 1.6rem; font-weight: 800; color: #1e1b4b; font-family: 'Poppins', sans-serif;">
              ${isEditMode ? 'Mess Menu Management' : 'Weekly Mess Menu'}
            </h2>
            <p id="messSub" style="margin: 4px 0 0 0; font-size: 0.85rem; color: #64748b; font-weight: 500;">
              Loading menu details...
            </p>
          </div>
        </div>
        <div id="messActionArea" style="display: flex; gap: 10px; align-items: center; justify-content: flex-end; flex-wrap: wrap;"></div>
      </div>

      <!-- Main mess grid wrapper -->
      <div id="messGridWrapper" style="width: 100%; overflow-x: auto;">
        <div style="text-align: center; padding: 40px; color: #64748b;">
          <i class="fa-solid fa-spinner fa-spin" style="font-size: 1.5rem; margin-bottom: 8px;"></i>
          <div>Loading menu details...</div>
        </div>
      </div>

      <!-- Custom Mess Edit Modal -->
      <div id="messSlotModal" class="routine-modal-overlay">
        <div class="routine-modal">
          <h3 id="messModalTitle" style="margin-top: 0; margin-bottom: 8px; font-size: 1.15rem; font-weight: 700; color: #1e1b4b;">Edit Mess Menu Slot</h3>
          <p id="messModalInfo" style="font-size: 0.8rem; color: #64748b; margin-bottom: 20px; line-height: 1.4;"></p>
          
          <div style="margin-bottom: 20px;">
            <label style="display: block; font-weight: 600; font-size: 0.8rem; color: #475569; margin-bottom: 8px;">Food Menu</label>
            <input type="text" id="messModalInput" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #cbd5e1; outline: none; background: white; font-family: 'Inter', sans-serif; font-size: 0.85rem; color: #1e1b4b;" placeholder="Enter food item(s)"></input>
          </div>

          <div style="display: flex; gap: 8px; justify-content: flex-end;">
            <button type="button" id="messModalCancelBtn" class="btn-outline-purple" style="font-size: 0.8rem; padding: 8px 12px; border-radius: 8px; font-weight: 600; cursor: pointer; background: transparent; border: 1px solid #e2e8f0; color: #475569;">Cancel</button>
            <button type="button" id="messModalSaveBtn" class="btn-filled-purple" style="font-size: 0.8rem; padding: 8px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; background: #6b46c1; color: white; border: none;">Save</button>
          </div>
        </div>
      </div>
    `;

    const el = content(html);
    document.getElementById('messBackBtn')?.addEventListener('click', goToDashboard);

    // Setup action switcher
    const actionArea = document.getElementById('messActionArea');
    if (actionArea && isWardenOrPrincipal) {
      actionArea.innerHTML = isEditMode
        ? `<a href="view.html" class="btn-pill btn-outline-purple" style="font-size: 0.85rem; font-weight: 600; text-decoration: none; padding: 6px 14px;"><i class="fa-solid fa-eye"></i> View</a>`
        : `<a href="post.html" class="btn-pill btn-filled-purple" style="font-size: 0.85rem; font-weight: 600; background:#6b46c1; color:white; text-decoration: none; padding: 6px 14px;"><i class="fa-solid fa-pen-to-square"></i> Edit</a>`;
    }

    const meals = ['Breakfast', 'Lunch', 'Snacks', 'Dinner'];
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    let loadedMenu = [];

    await loadData();

    async function loadData() {
      const gridWrapper = document.getElementById('messGridWrapper');
      if (gridWrapper) {
        gridWrapper.innerHTML = `
          <div style="text-align: center; padding: 40px; color: #64748b;">
            <i class="fa-solid fa-spinner fa-spin" style="font-size: 1.5rem; margin-bottom: 8px;"></i>
            <div>Loading menu...</div>
          </div>
        `;
      }

      try {
        const token = user.token || localStorage.getItem('token') || '';
        const res = await fetch(`${apiBase}/api/hostel/mess`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Mess menu load error');
        loadedMenu = await res.json();

        const subtitle = document.getElementById('messSub');
        if (subtitle) {
          subtitle.innerText = isEditMode ? 'Modify daily menu options for the hostel mess' : 'Weekly meal planning for residents';
        }

        renderGrid();
      } catch (err) {
        console.error(err);
        if (gridWrapper) {
          gridWrapper.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #ef4444;">
              <i class="fa-solid fa-triangle-exclamation" style="font-size: 2rem; margin-bottom: 8px;"></i>
              <div>Failed to load mess menu. Please check backend server.</div>
            </div>
          `;
        }
      }
    }

    function renderGrid() {
      const wrapper = document.getElementById('messGridWrapper');
      if (!wrapper) return;

      let gridHTML = `
        <div class="mess-grid-container">
          <div class="mess-grid" style="margin-bottom: 8px;">
            <div class="mess-header-cell" style="background: #e0e7ff; color: #4338ca;">Day / Meal</div>
            ${meals.map(m => `<div class="mess-header-cell">${m}</div>`).join('')}
          </div>
      `;

      const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'long' });

      days.forEach(day => {
        const isToday = day === currentDay;
        const dayCellClass = isToday ? 'mess-day-cell current-day' : 'mess-day-cell';
        gridHTML += `
          <div class="mess-grid ${isToday ? 'current-day-row' : ''}" style="margin-bottom: 8px;">
            <div class="${dayCellClass}">${day}</div>
        `;

        meals.forEach(meal => {
          const dayData = loadedMenu.find(m => m.day === day) || {};
          const mealKey = meal.toLowerCase();
          const food = dayData[mealKey] || '';

          const hasFood = !!food;
          let cellStyle = '';
          if (hasFood) {
            cellStyle = 'background: linear-gradient(135deg, #f5f3ff, #ede9fe); border: 1px solid #c084fc; color: #581c87; font-weight: 700;';
            if (isToday) {
              cellStyle = 'background: linear-gradient(135deg, #e9d5ff, #c084fc); border: 1px solid #a855f7; color: #3b0764; font-weight: 800;';
            }
          }

          gridHTML += `
            <div class="mess-slot-cell ${hasFood ? 'assigned' : ''} ${isEditMode ? 'editable' : ''}" style="${cellStyle}" data-day="${day}" data-meal="${mealKey}">
              ${hasFood ? `<span class="mess-cell-food">${esc(food)}</span>` : `<span class="mess-cell-empty">-</span>`}
            </div>
          `;
        });

        gridHTML += `</div>`; // Close row
      });

      gridHTML += `</div>`; // Close container
      wrapper.innerHTML = gridHTML;

      if (isEditMode) {
        wrapper.querySelectorAll('.mess-slot-cell.editable').forEach(cell => {
          cell.addEventListener('click', () => {
            const cellDay = cell.dataset.day;
            const cellMeal = cell.dataset.meal;
            openEditModal(cellDay, cellMeal);
          });
        });
      }
    }

    function openEditModal(cellDay, cellMeal) {
      const modal = document.getElementById('messSlotModal');
      if (!modal) return;
      if (modal.parentElement !== document.body) {
        document.body.appendChild(modal);
      }
      const infoText = document.getElementById('messModalInfo');
      const input = document.getElementById('messModalInput');
      const saveBtn = document.getElementById('messModalSaveBtn');
      const cancelBtn = document.getElementById('messModalCancelBtn');

      if (!input) return;

      const dayData = loadedMenu.find(m => m.day === cellDay) || {};
      const currentFood = dayData[cellMeal] || '';

      infoText.innerText = `Edit ${cellMeal.toUpperCase()} menu for ${cellDay}`;
      input.value = currentFood;

      modal.style.display = 'flex';
      input.focus();

      saveBtn.onclick = async () => {
        const token = user.token || localStorage.getItem('token') || '';
        const newValue = input.value.trim();

        const updatedDayData = {
          day: cellDay,
          breakfast: dayData.breakfast || '',
          lunch: dayData.lunch || '',
          snacks: dayData.snacks || '',
          dinner: dayData.dinner || '',
          ...dayData
        };

        updatedDayData[cellMeal] = newValue;

        try {
          const res = await fetch(`${apiBase}/api/warden/mess`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              day: cellDay,
              breakfast: updatedDayData.breakfast,
              lunch: updatedDayData.lunch,
              snacks: updatedDayData.snacks,
              dinner: updatedDayData.dinner
            })
          });

          if (!res.ok) throw new Error('Save mess menu failed');
          modal.style.display = 'none';
          await loadData();
        } catch (err) {
          alert('Error: ' + err.message);
        }
      };

      cancelBtn.onclick = () => {
        modal.style.display = 'none';
      };
      modal.onclick = (e) => {
        if (e.target === modal) {
          modal.style.display = 'none';
        }
      };
    }
  }

  async function renderDocumentsPage(info) {
    const userRole = (user.role || 'guest').toLowerCase();
    
    if (!document.getElementById('document-custom-styles')) {
      const styleEl = document.createElement('style');
      styleEl.id = 'document-custom-styles';
      styleEl.innerHTML = `
        .documents-grid-view {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
          align-items: stretch;
          padding-right: 4px;
          width: 100%;
        }
        @media (min-width: 640px) {
          .documents-grid-view {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (min-width: 1024px) {
          .documents-grid-view {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        @media (min-width: 1400px) {
          .documents-grid-view {
            grid-template-columns: repeat(4, 1fr);
          }
        }
        
        .document-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 20px 24px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.015);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          box-sizing: border-box;
          margin-bottom: 4px;
          height: 100%;
          min-height: 280px;
        }
        .document-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 30px rgba(107, 70, 193, 0.08);
          border-color: rgba(107, 70, 193, 0.25);
        }
        
        .document-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          width: 100%;
        }
        .document-title-area {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
          flex: 1;
        }
        .document-title {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 700;
          color: #0f172a;
          font-family: 'Poppins', sans-serif;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
        }
        
        .document-card-body {
          display: flex;
          flex-direction: column;
          gap: 10px;
          width: 100%;
          flex-grow: 1;
        }
        
        .document-preview-area {
          width: 100%;
          height: 160px;
          border-radius: 10px;
          overflow: hidden;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }
        .document-preview-area img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .document-preview-pdf {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          color: #e11d48;
        }
        .document-preview-pdf i {
          font-size: 3rem;
        }
        .document-preview-pdf span {
          font-size: 0.85rem;
          font-weight: 600;
          color: #475569;
        }
      `;
      document.head.appendChild(styleEl);
    }

    content(`
      <div style="display: flex; justify-content: space-between; align-items: center; gap: 16px; margin-bottom: 28px; flex-wrap: wrap; width: 100%;">
        <div style="display: flex; align-items: center; gap: 16px;">
          <button type="button" id="documentBackBtn" style="background: #f8fafc; border: 1px solid #e2e8f0; font-size: 1.1rem; color: #475569; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 42px; height: 42px; border-radius: 50%; transition: all 0.2s;" onmouseenter="this.style.background='#e2e8f0';" onmouseleave="this.style.background='#f8fafc';">
            <i class="fa-solid fa-arrow-left"></i>
          </button>
          <div>
            <h2 style="margin: 0; font-size: 1.6rem; font-weight: 800; color: #1e1b4b; font-family: 'Poppins', sans-serif;">Document Vault</h2>
            <p style="margin: 4px 0 0 0; font-size: 0.9rem; color: #64748b;">Securely upload, preview, and download your academic certificates, marksheets, and proofs.</p>
          </div>
        </div>
      </div>
      
      <div id="documentsListContainer" class="documents-grid-view">
        <div style="text-align: center; padding: 40px; color: #64748b; grid-column: 1 / -1;">
          <i class="fa-solid fa-spinner fa-spin" style="font-size: 1.5rem; margin-bottom: 8px;"></i>
          <div>Loading documents...</div>
        </div>
      </div>
    `);

    document.getElementById('documentBackBtn')?.addEventListener('click', goToDashboard);

    await loadDocumentsList();

    async function loadDocumentsList() {
      const container = document.getElementById('documentsListContainer');
      if (!container) return;
      const token = user.token || localStorage.getItem('token') || '';

      try {
        const res = await fetch(`${apiBase}/api/documents`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to load documents');
        let docs = await res.json();

        let gridHtml = `
          <!-- Insert Card (First Card in Grid) -->
          <article class="document-card" style="border: 2px dashed #6b46c1; background: #fcfaff; display: flex; flex-direction: column; justify-content: space-between; box-sizing: border-box;">
            <div style="flex-grow: 1; display: flex; flex-direction: column; justify-content: flex-start; gap: 12px; width: 100%;">
              <h4 style="margin-top: 0; margin-bottom: 4px; font-size: 1.15rem; font-weight: 700; color: #1e1b4b; display: flex; align-items: center; gap: 8px;">
                <i class="fa-solid fa-file-circle-plus" style="color: #6b46c1; font-size: 1.3rem;"></i> Add Document
              </h4>
              <form id="documentPostForm" style="display: flex; flex-direction: column; gap: 12px; width: 100%;">
                <div style="display: flex; flex-direction: column; gap: 4px;">
                  <label style="font-size: 0.75rem; font-weight: 600; color: #475569;">Document Name</label>
                  <input type="text" name="title" placeholder="e.g. 7th Sem Marksheet" required style="padding: 10px 12px; border-radius: 8px; border: 1px solid #cbd5e1; outline: none; font-size: 0.85rem; font-family: inherit; transition: border-color 0.2s;" onfocus="this.style.borderColor='#8b5cf6';" onblur="this.style.borderColor='#cbd5e1';">
                </div>
                
                <input type="hidden" name="type" value="Other">

                <div style="display: flex; flex-direction: column; gap: 4px;">
                  <label style="font-size: 0.75rem; font-weight: 600; color: #475569;">File (PDF or Image)</label>
                  <input type="file" name="file" accept="application/pdf, image/*" required style="font-size: 0.8rem; color: #64748b; width: 100%;">
                </div>

                <button type="submit" style="background: #6b46c1; color: white; border: none; padding: 11px 14px; border-radius: 8px; font-weight: 600; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; margin-top: 6px; transition: all 0.2s; width: 100%;" onmouseenter="this.style.background='#55309d';" onmouseleave="this.style.background='#6b46c1';">
                  <i class="fa-solid fa-upload"></i> Upload
                </button>
              </form>
            </div>
          </article>
        `;

        gridHtml += docs.map(d => renderDocumentCardHtml(d)).join('');
        container.innerHTML = gridHtml;

        // Bind form submit
        const form = document.getElementById('documentPostForm');
        form?.addEventListener('submit', async (e) => {
          e.preventDefault();
          const formData = new FormData(form);
          const uploadBtn = form.querySelector('button[type="submit"]');
          if (uploadBtn) {
            uploadBtn.disabled = true;
            uploadBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Uploading...';
          }

          try {
            const resUpload = await fetch(`${apiBase}/api/documents`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${token}` },
              body: formData
            });

            if (resUpload.ok) {
              alert('Document uploaded successfully.');
              loadDocumentsList();
            } else {
              const errData = await resUpload.json();
              throw new Error(errData.message || 'Upload failed');
            }
          } catch (err) {
            alert('Error: ' + err.message);
            if (uploadBtn) {
              uploadBtn.disabled = false;
              uploadBtn.innerHTML = '<i class="fa-solid fa-upload"></i> Upload';
            }
          }
        });

        // Event listeners for Delete button
        container.querySelectorAll('.btn-delete-doc').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            const id = btn.dataset.id;
            if (!confirm('Are you sure you want to delete this document?')) return;
            try {
              const resDel = await fetch(`${apiBase}/api/documents/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
              });
              if (resDel.ok) {
                loadDocumentsList();
              } else {
                throw new Error('Deletion failed');
              }
            } catch (err) {
              alert('Error: ' + err.message);
            }
          });
        });

      } catch (err) {
        container.innerHTML = `<div class="module-empty" style="color: red; grid-column: 1 / -1;">Failed to load documents list.</div>`;
      }
    }

    function renderDocumentCardHtml(d) {
      const docUrl = d.fileUrl.startsWith('http') ? d.fileUrl : `${apiBase}${d.fileUrl}`;
      const isPdf = d.fileUrl.toLowerCase().endsWith('.pdf');
      const dateStr = new Date(d.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      
      let previewHtml = '';
      if (isPdf) {
        previewHtml = `
          <div class="document-preview-pdf">
            <i class="fa-solid fa-file-pdf"></i>
            <span>PDF Document</span>
          </div>
        `;
      } else {
        previewHtml = `<img src="${docUrl}" alt="${esc(d.title)}">`;
      }

      return `
        <article class="document-card">
          <div class="document-card-header">
            <div class="document-title-area">
              <i class="fa-solid ${isPdf ? 'fa-file-pdf' : 'fa-file-image'}" style="color: ${isPdf ? '#e11d48' : '#3b82f6'}; font-size: 1.25rem;"></i>
              <h4 class="document-title" title="${esc(d.title)}">${esc(d.title)}</h4>
            </div>
          </div>
          
          <div class="document-card-body">
            <p style="margin: 0; font-size: 0.8rem; color: #64748b;">Uploaded on ${dateStr}</p>
            
            <div class="document-preview-area" style="margin-top: 4px;">
              ${previewHtml}
            </div>

            <div style="display: flex; gap: 8px; margin-top: 12px; width: 100%;">
              <a href="${docUrl}" target="_blank" rel="noopener noreferrer" class="btn-outline-purple" style="flex: 1; padding: 8px 12px; border-radius: 8px; font-weight: 600; font-size: 0.8rem; text-align: center; display: inline-flex; align-items: center; justify-content: center; gap: 6px; text-decoration: none; color: #6b46c1; border: 1px solid #6b46c1; background: transparent; transition: all 0.2s;" onmouseenter="this.style.background='#f5f3ff';" onmouseleave="this.style.background='transparent';">
                <i class="fa-solid fa-arrow-up-right-from-square"></i> Open
              </a>
              <a href="${docUrl}" download="${esc(d.title)}" class="btn-filled-purple" style="flex: 1; padding: 8px 12px; border-radius: 8px; font-weight: 600; font-size: 0.8rem; text-align: center; display: inline-flex; align-items: center; justify-content: center; gap: 6px; text-decoration: none; color: white;">
                <i class="fa-solid fa-download"></i> Download
              </a>
              <button class="btn-outline-red btn-delete-doc" data-id="${d._id}" style="padding: 8px 12px; border-radius: 8px; font-weight: 600; font-size: 0.8rem; cursor: pointer;">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </div>
          </div>
        </article>
      `;
    }
  }

  async function renderMarMoocsPage(info) {
    const userRole = (user.role || 'guest').toLowerCase();
    const token = user.token || localStorage.getItem('token') || '';
    const rootPrefix = getRootPrefix();

    const MAR_SECTIONS = {
      "2a": { label: "2.a Tech Fest/Fresher's/Teachers Day - Organizer (5 pts, max 10)", points: 5, max: 10 },
      "2b": { label: "2.b Tech Fest/Fresher's/Teachers Day - Participant (3 pts, max 6)", points: 3, max: 6 },
      "3": { label: "3. Rural Reporting (5 pts, max 10)", points: 5, max: 10 },
      "4": { label: "4. Tree plantation and Up-keeping (1 pt/tree, max 10)", points: 1, max: 10 },
      "5a": { label: "5.a Collection of fund/materials for Relief Camp (5 pts, max 40)", points: 5, max: 40 },
      "5b": { label: "5.b Part of Relief Work Team (20 pts, max 40)", points: 20, max: 40 },
      "6": { label: "6. Debate/GD/Workshop/Arts/Photo/Film (10 pts, max 20)", points: 10, max: 20 },
      "7": { label: "7. Publication in News Paper, Mag, Blog (10 pts, max 20)", points: 10, max: 20 },
      "8": { label: "8. Research Publication (15 pts, max 30)", points: 15, max: 30 },
      "9": { label: "9. Innovative Projects (30 pts, max 60)", points: 30, max: 60 },
      "10a": { label: "10.a Blood donation (8 pts, max 16)", points: 8, max: 16 },
      "10b": { label: "10.b Blood Donation Camp Organization (10 pts, max 20)", points: 10, max: 20 },
      "11a": { label: "11.a Sports/Games/Yoga - Personal Level (10 pts, max 20)", points: 10, max: 20 },
      "11b": { label: "11.b Sports/Games/Yoga - College Level (5 pts, max 10)", points: 5, max: 10 },
      "11c": { label: "11.c Sports/Games/Yoga - University Level (10 pts, max 20)", points: 10, max: 20 },
      "11d": { label: "11.d Sports/Games/Yoga - District Level (12 pts, max 24)", points: 12, max: 24 },
      "11e": { label: "11.e Sports/Games/Yoga - State Level (15 pts, max 30)", points: 15, max: 30 },
      "11f": { label: "11.f Sports/Games/Yoga - National/International Level (20 pts, max 40)", points: 20, max: 40 },
      "12": { label: "12. Professional Society/Student Chapter (10 pts, max 20)", points: 10, max: 20 },
      "13": { label: "13. Industry Visit & Report / Event Mgmt Training (10 pts, max 20)", points: 10, max: 20 },
      "14": { label: "14. Community Service & Allied Activities (10 pts, max 20)", points: 10, max: 20 },
      "15a": { label: "15.a Self-Entrepreneurship - Organise workshop (10 pts, max 20)", points: 10, max: 20 },
      "15b": { label: "15.b Self-Entrepreneurship - Take part in workshop (5 pts, max 10)", points: 5, max: 10 },
      "15c": { label: "15.c Self-Entrepreneurship - Video film making (10 pts, max 20)", points: 10, max: 20 },
      "15d": { label: "15.d Self-Entrepreneurship - Submit business plan (10 pts, max 20)", points: 10, max: 20 },
      "15e": { label: "15.e Self-Entrepreneurship - Work for start-up (20 pts, max 40)", points: 20, max: 40 }
    };

    if (!document.getElementById('mar-mooc-custom-styles')) {
      const styleEl = document.createElement('style');
      styleEl.id = 'mar-mooc-custom-styles';
      styleEl.innerHTML = `
        .mar-mooc-layout {
          display: grid;
          grid-template-columns: 1fr;
          gap: 28px;
          align-items: start;
        }
        @media (min-width: 992px) {
          .mar-mooc-layout {
            grid-template-columns: 1fr 1fr;
          }
        }
        .progress-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 28px;
        }
        .progress-card {
          background: white;
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 16px;
          box-shadow: var(--shadow-sm);
        }
        .mar-mooc-form-card {
          background: white;
          border: 1px solid var(--border-color);
          border-radius: 16px;
          padding: 24px;
          box-shadow: var(--shadow-sm);
          margin-bottom: 24px;
        }
        .records-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .record-item {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 14px 18px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .record-badge {
          font-size: 0.75rem;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 6px;
        }
        .badge-verified { background: #d1fae5; color: #065f46; border: 1px solid #a7f3d0; }
        .badge-proposed { background: #fffbeb; color: #92400e; border: 1px solid #fde68a; }
        .badge-rejected { background: #fff1f2; color: #9f1239; border: 1px solid #fecdd3; }
        
        /* Guidelines Modal */
        .guidelines-modal-overlay {
          position: fixed;
          top: 0; left: 0; width: 100%; height: 100%;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(5px);
          z-index: 10000;
          display: none;
          align-items: center;
          justify-content: center;
        }
        .guidelines-modal {
          background: white;
          border-radius: 16px;
          padding: 20px;
          max-width: 800px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
          position: relative;
        }
      `;
      document.head.appendChild(styleEl);
    }

    if (userRole === 'teacher') {
      content(`
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 16px; margin-bottom: 28px; flex-wrap: wrap; width: 100%;">
          <div style="display: flex; align-items: center; gap: 16px;">
            <button type="button" id="marMoocBackBtn" style="background: #f8fafc; border: 1px solid #e2e8f0; font-size: 1.1rem; color: #475569; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 42px; height: 42px; border-radius: 50%; transition: all 0.2s;" onmouseenter="this.style.background='#e2e8f0';" onmouseleave="this.style.background='#f8fafc';">
              <i class="fa-solid fa-arrow-left"></i>
            </button>
            <div>
              <h2 style="margin: 0; font-size: 1.6rem; font-weight: 800; color: #1e1b4b; font-family: 'Poppins', sans-serif;">Mentee MAR & MOOCs Claims</h2>
              <p style="margin: 4px 0 0 0; font-size: 0.9rem; color: #64748b;">Review and approve/reject MAR activities and MOOC credits claimed by your academic mentees.</p>
            </div>
          </div>
          <div>
            <select id="teacherStatusFilter" style="padding: 10px 16px; border-radius: 12px; border: 1px solid #cbd5e1; outline: none; font-size: 0.9rem; font-weight: 600; background: white; cursor: pointer;">
              <option value="Proposed">Pending Approval</option>
              <option value="Verified">Approved / Verified</option>
              <option value="Rejected">Rejected</option>
              <option value="all">All Submissions</option>
            </select>
          </div>
        </div>

        <div class="mar-mooc-layout">
          <!-- Left Column: MAR Claims -->
          <div>
            <h3 style="font-size:1.15rem; font-weight:700; color:#1e1b4b; margin-bottom:14px; display:flex; align-items:center; gap:8px;">
              <i class="fa-solid fa-award" style="color:#2563eb;"></i> Mentee MAR Claims
            </h3>
            <div id="menteeMarContainer" class="records-list">
              <div style="text-align:center; padding:20px; color:#64748b;"><i class="fa-solid fa-spinner fa-spin"></i></div>
            </div>
          </div>

          <!-- Right Column: MOOCs Claims -->
          <div>
            <h3 style="font-size:1.15rem; font-weight:700; color:#1e1b4b; margin-bottom:14px; display:flex; align-items:center; gap:8px;">
              <i class="fa-solid fa-graduation-cap" style="color:#2563eb;"></i> Mentee MOOC Claims
            </h3>
            <div id="menteeMoocContainer" class="records-list">
              <div style="text-align:center; padding:20px; color:#64748b;"><i class="fa-solid fa-spinner fa-spin"></i></div>
            </div>
          </div>
        </div>
      `);

      document.getElementById('marMoocBackBtn')?.addEventListener('click', goToDashboard);
      document.getElementById('teacherStatusFilter')?.addEventListener('change', loadMenteeSubmissions);

      window.handleMarMoocAction = async function (id, status) {
        const remarkInput = document.getElementById(`remark-${id}`);
        const remark = remarkInput ? remarkInput.value.trim() : '';

        if (status === 'Rejected' && !remark) {
          alert('Please enter a remark explaining the rejection.');
          return;
        }

        const confirmMsg = `Are you sure you want to ${status === 'Verified' ? 'Approve' : 'Reject'} this claim?`;
        if (!confirm(confirmMsg)) return;

        try {
          const res = await fetch(`${apiBase}/api/mar-moocs/${id}/status`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ status, remark })
          });

          if (res.ok) {
            alert(`Claim successfully ${status === 'Verified' ? 'Approved' : 'Rejected'}.`);
            await loadMenteeSubmissions();
          } else {
            const errData = await res.json();
            throw new Error(errData.message || 'Action failed');
          }
        } catch (err) {
          alert('Error: ' + err.message);
        }
      };

      async function loadMenteeSubmissions() {
        const marContainer = document.getElementById('menteeMarContainer');
        const moocContainer = document.getElementById('menteeMoocContainer');
        if (!marContainer || !moocContainer) return;
        const filterVal = document.getElementById('teacherStatusFilter')?.value || 'Proposed';

        try {
          const res = await fetch(`${apiBase}/api/mar-moocs/mentees`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (!res.ok) throw new Error();
          const submissions = await res.json();

          let filtered = [...submissions];
          if (filterVal !== 'all') {
            filtered = filtered.filter(s => s.status === filterVal);
          }

          const marSubmissions = filtered.filter(s => s.category === 'mar');
          const moocSubmissions = filtered.filter(s => s.category === 'mooc');

          const renderCard = (s) => {
            const dateStr = new Date(s.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
            const proofUrl = s.certificateUrl ? (s.certificateUrl.startsWith('http') ? s.certificateUrl : `${apiBase}${s.certificateUrl}`) : (s.externalLink || null);
            const isMar = s.category === 'mar';
            const secInfo = isMar ? (MAR_SECTIONS[s.activitySection] || { label: 'General Activity' }) : null;
            const studentName = s.student?.name || 'Unknown Student';
            const rollNo = s.student?.rollNumber || 'N/A';
            const batchSection = [s.student?.batch, s.student?.section].filter(Boolean).join(' - ') || 'N/A';

            let typeBadge = '';
            let claimText = '';
            if (isMar) {
              typeBadge = `<span style="background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; font-size: 0.75rem; font-weight: 700; padding: 4px 10px; border-radius: 20px;"><i class="fa-solid fa-award"></i> MAR Claim</span>`;
              claimText = `<div><strong>Section:</strong> ${esc(secInfo ? secInfo.label : s.activitySection)}</div>
                           <div><strong>Points:</strong> <strong style="color: #2563eb; font-size: 1rem;">+${s.points}</strong> MAR Points</div>`;
            } else {
              typeBadge = `<span style="background: #dbeafe; color: #1d4ed8; border: 1px solid #bfdbfe; font-size: 0.75rem; font-weight: 700; padding: 4px 10px; border-radius: 20px;"><i class="fa-solid fa-graduation-cap"></i> MOOC Claim</span>`;
              claimText = `<div><strong>Course Name:</strong> ${esc(s.title)}</div>
                           <div><strong>Duration:</strong> ${s.duration || 0} Hours</div>
                           ${s.startDate && s.endDate ? `<div><strong>Dates:</strong> ${new Date(s.startDate).toLocaleDateString('en-IN')} to ${new Date(s.endDate).toLocaleDateString('en-IN')}</div>` : ''}
                           <div><strong>Credits Claimed:</strong> <strong style="color: #2563eb; font-size: 1rem;">+${s.points}</strong> Credits</div>`;
            }

            const statusBadge = getStatusBadge(s.status);

            let actionHtml = '';
            if (s.status === 'Proposed') {
              actionHtml = `
                <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 12px; display: flex; flex-direction: column; gap: 10px;">
                  <div style="display: flex; flex-direction: column; gap: 4px;">
                    <label style="font-size: 0.8rem; font-weight: 600; color: #475569;">Mentor Remarks (Optional)</label>
                    <input type="text" id="remark-${s._id}" placeholder="Enter any feedback or reason for rejection..." style="padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.85rem; outline: none; width: 100%;">
                  </div>
                  <div style="display: flex; gap: 12px; justify-content: flex-end;">
                    <button type="button" class="btn-action-reject" onclick="window.handleMarMoocAction('${s._id}', 'Rejected')" style="background: #fff1f2; color: #be123c; border: 1px solid #fecdd3; padding: 8px 16px; border-radius: 8px; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.2s;">
                      <i class="fa-solid fa-xmark"></i> Reject
                    </button>
                    <button type="button" class="btn-action-approve" onclick="window.handleMarMoocAction('${s._id}', 'Verified')" style="background: #10b981; color: white; border: none; padding: 8px 16px; border-radius: 8px; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.2s;">
                      <i class="fa-solid fa-check"></i> Approve
                    </button>
                  </div>
                </div>
              `;
            } else if (s.remark) {
              actionHtml = `
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; margin-top: 12px; font-size: 0.8rem; color: #475569;">
                  <strong>Mentor Remark:</strong> ${esc(s.remark)}
                </div>
              `;
            }

            return `
              <div class="record-item" style="background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 16px; box-shadow: var(--shadow-sm); display: flex; flex-direction: column; gap: 10px;">
                <div style="display: flex; justify-content: space-between; align-items: start; gap: 12px; flex-wrap: wrap;">
                  <div>
                    <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                      <strong style="font-size: 0.95rem; color: #1e1b4b;">${esc(studentName)}</strong>
                      <span style="font-size: 0.75rem; color: #64748b;">(Roll: ${esc(rollNo)})</span>
                    </div>
                    <div style="font-size: 0.75rem; color: #64748b; margin-top: 2px;">Batch/Sec: ${esc(batchSection)}</div>
                  </div>
                  <div style="display: flex; align-items: center; gap: 6px;">
                    ${typeBadge}
                    ${statusBadge}
                  </div>
                </div>

                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 10px 12px; font-size: 0.8rem; color: #334155; display: flex; flex-direction: column; gap: 4px;">
                  <div><strong>Claim Title:</strong> ${esc(s.title)}</div>
                  ${claimText}
                  <div><strong>Submitted on:</strong> ${dateStr}</div>
                </div>

                ${proofUrl ? `
                  <a href="${proofUrl}" target="_blank" rel="noopener noreferrer" style="align-self: flex-start; font-size: 0.8rem; color: #2563eb; text-decoration: none; display: inline-flex; align-items: center; gap: 4px; font-weight: 600;">
                    <i class="fa-solid fa-arrow-up-right-from-square"></i> Open Proof
                  </a>
                ` : ''}

                ${actionHtml}
              </div>
            `;
          };

          if (marSubmissions.length === 0) {
            marContainer.innerHTML = `<div style="text-align:center; padding:20px; color:#64748b;">No MAR claims in this filter.</div>`;
          } else {
            marContainer.innerHTML = marSubmissions.map(renderCard).join('');
          }

          if (moocSubmissions.length === 0) {
            moocContainer.innerHTML = `<div style="text-align:center; padding:20px; color:#64748b;">No MOOC claims in this filter.</div>`;
          } else {
            moocContainer.innerHTML = moocSubmissions.map(renderCard).join('');
          }

        } catch (err) {
          marContainer.innerHTML = `<div style="color:red; text-align:center; padding:20px;">Error loading MAR claims.</div>`;
          moocContainer.innerHTML = `<div style="color:red; text-align:center; padding:20px;">Error loading MOOC claims.</div>`;
        }
      }

      await loadMenteeSubmissions();
      return;
    }

    // Guidelines dropdown options HTML
    let sectionsOptionsHTML = '';
    for (const key in MAR_SECTIONS) {
      sectionsOptionsHTML += `<option value="${key}">${esc(MAR_SECTIONS[key].label)}</option>`;
    }

    content(`
      <div style="display: flex; justify-content: space-between; align-items: center; gap: 16px; margin-bottom: 28px; flex-wrap: wrap; width: 100%;">
        <div style="display: flex; align-items: center; gap: 16px;">
          <button type="button" id="marMoocBackBtn" style="background: #f8fafc; border: 1px solid #e2e8f0; font-size: 1.1rem; color: #475569; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 42px; height: 42px; border-radius: 50%; transition: all 0.2s;" onmouseenter="this.style.background='#e2e8f0';" onmouseleave="this.style.background='#f8fafc';">
            <i class="fa-solid fa-arrow-left"></i>
          </button>
          <div>
            <h2 style="margin: 0; font-size: 1.6rem; font-weight: 800; color: #1e1b4b; font-family: 'Poppins', sans-serif;">MAR & MOOCs Tracker</h2>
            <p style="margin: 4px 0 0 0; font-size: 0.9rem; color: #64748b;">Manage Mandatory Additional Requirements and MOOC course claims under academic mentorship.</p>
          </div>
        </div>
        <div>
          <button type="button" id="viewGuidelinesBtn" class="btn-outline-purple" style="padding: 10px 18px; border-radius: 12px; font-weight: 600; font-size: 0.9rem; cursor: pointer; display: flex; align-items: center; gap: 8px;">
            <i class="fa-regular fa-file-image"></i> View MAR Guidelines
          </button>
        </div>
      </div>

      <!-- Point Progress Columns -->
      <div class="mar-mooc-layout" style="margin-bottom: 28px; gap: 28px;">
        <!-- Left Side: MAR Progress -->
        <div style="background: white; border: 1px solid var(--border-color); border-radius: 16px; padding: 20px; box-shadow: var(--shadow-sm);">
          <h3 style="margin-top: 0; margin-bottom: 16px; font-size: 1.1rem; font-weight: 800; color: #2563eb; display: flex; align-items: center; gap: 8px;">
            <i class="fa-solid fa-award"></i> MAR Progress Status
          </h3>
          <div style="display: grid; grid-template-columns: 1fr 1.5fr; gap: 16px; align-items: center;">
            <div style="text-align: center; border-right: 1px solid #e2e8f0; padding-right: 16px;">
              <div style="font-size: 0.85rem; color: #475569; font-weight: 600;">Overall MAR</div>
              <div style="font-size: 2rem; font-weight: 800; margin: 8px 0;">
                <span id="totalMarPts" style="color:#ef4444;">0</span> <span style="font-size: 1rem; font-weight: 500; color: #64748b;">/ 100</span>
              </div>
              <span id="overallMarBadge" style="font-size: 0.7rem; font-weight: 700; padding: 2px 8px; border-radius: 6px; background: #fee2e2; color: #ef4444; border: 1px solid #fca5a5;">Unfulfilled</span>
            </div>
            <div style="display: flex; flex-direction: column; gap: 8px; padding-left: 8px;">
              <div style="display: flex; justify-content: space-between; font-size: 0.85rem;">
                <span>Year 1 Progress:</span>
                <span><strong id="y1Mar" style="color:#ef4444;">0</strong> / 25 pts</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 0.85rem;">
                <span>Year 2 Progress:</span>
                <span><strong id="y2Mar" style="color:#ef4444;">0</strong> / 25 pts</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 0.85rem;">
                <span>Year 3 Progress:</span>
                <span><strong id="y3Mar" style="color:#ef4444;">0</strong> / 25 pts</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 0.85rem;">
                <span>Year 4 Progress:</span>
                <span><strong id="y4Mar" style="color:#ef4444;">0</strong> / 25 pts</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Side: MOOCs Progress -->
        <div style="background: white; border: 1px solid var(--border-color); border-radius: 16px; padding: 20px; box-shadow: var(--shadow-sm);">
          <h3 style="margin-top: 0; margin-bottom: 16px; font-size: 1.1rem; font-weight: 800; color: #2563eb; display: flex; align-items: center; gap: 8px;">
            <i class="fa-solid fa-graduation-cap"></i> MOOCs Progress Status
          </h3>
          <div style="display: grid; grid-template-columns: 1fr 1.5fr; gap: 16px; align-items: center;">
            <div style="text-align: center; border-right: 1px solid #e2e8f0; padding-right: 16px;">
              <div style="font-size: 0.85rem; color: #475569; font-weight: 600;">Overall MOOCs</div>
              <div style="font-size: 2rem; font-weight: 800; margin: 8px 0;">
                <span id="totalMoocPts" style="color:#ef4444;">0</span> <span style="font-size: 1rem; font-weight: 500; color: #64748b;">/ 20</span>
              </div>
              <span id="overallMoocBadge" style="font-size: 0.7rem; font-weight: 700; padding: 2px 8px; border-radius: 6px; background: #fee2e2; color: #ef4444; border: 1px solid #fca5a5;">Unfulfilled</span>
            </div>
            <div style="display: flex; flex-direction: column; gap: 8px; padding-left: 8px;">
              <div style="display: flex; justify-content: space-between; font-size: 0.85rem;">
                <span>Year 1 Progress:</span>
                <span><strong id="y1Mooc" style="color:#ef4444;">0</strong> / 4 pts</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 0.85rem;">
                <span>Year 2 Progress:</span>
                <span><strong id="y2Mooc" style="color:#ef4444;">0</strong> / 4 pts</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 0.85rem;">
                <span>Year 3 Progress:</span>
                <span><strong id="y3Mooc" style="color:#ef4444;">0</strong> / 4 pts</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 0.85rem;">
                <span>Year 4 Progress:</span>
                <span><strong id="y4Mooc" style="color:#ef4444;">0</strong> / 4 pts</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="mar-mooc-layout">
        <!-- Left Side: MAR Section -->
        <div>
          <div class="mar-mooc-form-card">
            <h3 style="margin-top: 0; margin-bottom: 20px; font-size: 1.2rem; font-weight: 800; color: #2563eb; display:flex; align-items:center; gap:8px;">
              <i class="fa-solid fa-award"></i> Claim MAR Points
            </h3>
            <form id="marUploadForm" style="display:flex; flex-direction:column; gap:16px;">
              <input type="hidden" name="category" value="mar">
              
              <div style="display:flex; flex-direction:column; gap:4px;">
                <label style="font-size:0.8rem; font-weight:600; color:#475569;">Event / Activity Name</label>
                <input type="text" name="title" placeholder="e.g. Organized College Techfest" required style="padding:10px 12px; border-radius:8px; border:1px solid #cbd5e1; outline:none; font-size:0.9rem;">
              </div>

              <div style="display:flex; flex-direction:column; gap:4px;">
                <label style="font-size:0.8rem; font-weight:600; color:#475569;">Activity Section (Guidelines)</label>
                <select name="activitySection" required style="padding:10px 12px; border-radius:8px; border:1px solid #cbd5e1; outline:none; font-size:0.9rem; background:white;">
                  <option value="">Select section under which you claim points</option>
                  ${sectionsOptionsHTML}
                </select>
              </div>

              <div style="display:flex; flex-direction:column; gap:4px;">
                <label style="font-size:0.8rem; font-weight:600; color:#475569;">Upload Document / Proof File</label>
                <input type="file" name="file" accept="application/pdf, image/*" required style="font-size:0.85rem; color:#64748b;">
              </div>

              <button type="submit" style="background:#2563eb; color:white; padding:12px; border-radius:8px; font-weight:600; border:none; cursor:pointer;" onmouseenter="this.style.background='#1d4ed8';" onmouseleave="this.style.background='#2563eb';">
                Submit for Mentor Approval
              </button>
            </form>
          </div>

          <h3 style="font-size:1.15rem; font-weight:700; color:#1e1b4b; margin-bottom:14px;">Your MAR Activity Claims</h3>
          <div id="marClaimsList" class="records-list">
            <div style="text-align:center; padding:20px; color:#64748b;"><i class="fa-solid fa-spinner fa-spin"></i></div>
          </div>
        </div>

        <!-- Right Side: MOOCs Section -->
        <div>
          <div class="mar-mooc-form-card" style="border-color: #bfdbfe; background: #fafcff;">
            <h3 style="margin-top: 0; margin-bottom: 20px; font-size: 1.2rem; font-weight: 800; color: #2563eb; display:flex; align-items:center; gap:8px;">
              <i class="fa-solid fa-graduation-cap"></i> Claim MOOC Credits
            </h3>
            <form id="moocUploadForm" style="display:flex; flex-direction:column; gap:16px;">
              <input type="hidden" name="category" value="mooc">

              <div style="display:flex; flex-direction:column; gap:4px;">
                <label style="font-size:0.8rem; font-weight:600; color:#475569;">Course Name</label>
                <input type="text" name="title" placeholder="e.g. Introduction to Python (NPTEL)" required style="padding:10px 12px; border-radius:8px; border:1px solid #cbd5e1; outline:none; font-size:0.9rem;">
              </div>

              <div style="display:flex; flex-direction:column; gap:4px;">
                <label style="font-size:0.8rem; font-weight:600; color:#475569;">Duration (in Hours)</label>
                <input type="number" name="duration" placeholder="e.g. 40" required min="1" style="padding:10px 12px; border-radius:8px; border:1px solid #cbd5e1; outline:none; font-size:0.9rem;">
                <span style="font-size:0.75rem; color:#64748b;">* Calculates 1 point per 8 hours (Max 4 points per course).</span>
              </div>

              <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                <div style="display:flex; flex-direction:column; gap:4px;">
                  <label style="font-size:0.8rem; font-weight:600; color:#475569;">Starting Date</label>
                  <input type="date" name="startDate" required style="padding:10px 12px; border-radius:8px; border:1px solid #cbd5e1; outline:none; font-size:0.9rem;">
                </div>
                <div style="display:flex; flex-direction:column; gap:4px;">
                  <label style="font-size:0.8rem; font-weight:600; color:#475569;">Ending Date</label>
                  <input type="date" name="endDate" required style="padding:10px 12px; border-radius:8px; border:1px solid #cbd5e1; outline:none; font-size:0.9rem;">
                </div>
              </div>

              <div style="display:flex; flex-direction:column; gap:4px;">
                <label style="font-size:0.8rem; font-weight:600; color:#475569;">Certificate Proof (File upload or External link)</label>
                <input type="file" name="file" accept="application/pdf, image/*" style="font-size:0.85rem; color:#64748b; margin-bottom:8px;">
                <input type="url" name="link" placeholder="Or enter certificate URL e.g. https://nptel.ac.in/verify/..." style="padding:10px 12px; border-radius:8px; border:1px solid #cbd5e1; outline:none; font-size:0.9rem;">
              </div>

              <button type="submit" style="background:#2563eb; color:white; padding:12px; border-radius:8px; font-weight:600; border:none; cursor:pointer;" onmouseenter="this.style.background='#1d4ed8';" onmouseleave="this.style.background='#2563eb';">
                Submit for Mentor Approval
              </button>
            </form>
          </div>

          <h3 style="font-size:1.15rem; font-weight:700; color:#1e1b4b; margin-bottom:14px;">Your MOOC Course Claims</h3>
          <div id="moocClaimsList" class="records-list">
            <div style="text-align:center; padding:20px; color:#64748b;"><i class="fa-solid fa-spinner fa-spin"></i></div>
          </div>
        </div>
      </div>

      <!-- Guidelines Modal overlay -->
      <div id="guidelinesModalOverlay" class="guidelines-modal-overlay">
        <div class="guidelines-modal">
          <button type="button" id="closeGuidelinesModal" style="position:absolute; top:12px; right:16px; border:none; background:transparent; font-size:1.4rem; cursor:pointer; color:#64748b;"><i class="fa-solid fa-xmark"></i></button>
          <h3 style="margin-top:0; margin-bottom:16px; font-size:1.25rem; font-weight:800; color:#1e1b4b;">MAKAUT Mandatory Additional Requirements (MAR) Guidelines</h3>
          <div style="width:100%; overflow:hidden; border-radius:12px;">
            <img src="${rootPrefix}assets/images/mar-activity-list.jpg" alt="MAR Activity List Notice" style="width:100%; height:auto;">
          </div>
        </div>
      </div>
    `);

    document.getElementById('marMoocBackBtn')?.addEventListener('click', goToDashboard);
    
    // Guidelines popup binding
    const guidelinesModal = document.getElementById('guidelinesModalOverlay');
    document.getElementById('viewGuidelinesBtn')?.addEventListener('click', () => {
      if (guidelinesModal) guidelinesModal.style.display = 'flex';
    });
    document.getElementById('closeGuidelinesModal')?.addEventListener('click', () => {
      if (guidelinesModal) guidelinesModal.style.display = 'none';
    });
    guidelinesModal?.addEventListener('click', (e) => {
      if (e.target === guidelinesModal) guidelinesModal.style.display = 'none';
    });

    // Form submits
    document.getElementById('marUploadForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.currentTarget;
      const formData = new FormData(form);
      const submitBtn = form.querySelector('button[type="submit"]');

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Submitting...';
      }

      try {
        const res = await fetch(`${apiBase}/api/mar-moocs`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        });

        if (res.ok) {
          alert('MAR activity claim submitted successfully to your mentor.');
          form.reset();
          loadMarMoocsData();
        } else {
          const errData = await res.json();
          throw new Error(errData.message || 'Submission failed');
        }
      } catch (err) {
        alert('Error: ' + err.message);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = 'Submit for Mentor Approval';
        }
      }
    });

    document.getElementById('moocUploadForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.currentTarget;
      const formData = new FormData(form);
      const fileInput = form.querySelector('input[type="file"]');
      const urlInput = form.querySelector('input[name="link"]');

      if (!fileInput.files.length && !urlInput.value.trim()) {
        alert('Please either upload a certificate file or enter an external certificate link.');
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Submitting...';
      }

      try {
        const res = await fetch(`${apiBase}/api/mar-moocs`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        });

        if (res.ok) {
          alert('MOOC credit claim submitted successfully to your mentor.');
          form.reset();
          loadMarMoocsData();
        } else {
          const errData = await res.json();
          throw new Error(errData.message || 'Submission failed');
        }
      } catch (err) {
        alert('Error: ' + err.message);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = 'Submit for Mentor Approval';
        }
      }
    });

    await loadMarMoocsData();

    async function loadMarMoocsData() {
      const marList = document.getElementById('marClaimsList');
      const moocList = document.getElementById('moocClaimsList');
      if (!marList || !moocList) return;

      try {
        const res = await fetch(`${apiBase}/api/mar-moocs`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        const records = data.records || [];

        // Distribute points across years
        // Overall totals
        let totalMarPoints = 0;
        let totalMoocPoints = 0;

        let yearPoints = {
          1: { mar: 0, mooc: 0 },
          2: { mar: 0, mooc: 0 },
          3: { mar: 0, mooc: 0 },
          4: { mar: 0, mooc: 0 }
        };

        records.forEach(r => {
          if (r.status === 'Verified') {
            const entryYear = getEntryAcademicYear(r.createdAt);
            if (r.category === 'mar') {
              totalMarPoints += (r.points || 0);
              if (yearPoints[entryYear]) yearPoints[entryYear].mar += (r.points || 0);
            } else if (r.category === 'mooc') {
              totalMoocPoints += (r.points || 0);
              if (yearPoints[entryYear]) yearPoints[entryYear].mooc += (r.points || 0);
            }
          }
        });

        // Set overall point displays & colors
        const marSpan = document.getElementById('totalMarPts');
        const overallMarBadge = document.getElementById('overallMarBadge');
        if (marSpan) {
          marSpan.innerText = totalMarPoints;
          if (totalMarPoints >= 100) {
            marSpan.style.color = '#10b981';
            if (overallMarBadge) {
              overallMarBadge.innerText = 'Fulfilled';
              overallMarBadge.style.background = '#d1fae5';
              overallMarBadge.style.color = '#065f46';
              overallMarBadge.style.borderColor = '#a7f3d0';
            }
          } else {
            marSpan.style.color = '#ef4444';
            if (overallMarBadge) {
              overallMarBadge.innerText = 'Unfulfilled';
              overallMarBadge.style.background = '#fee2e2';
              overallMarBadge.style.color = '#ef4444';
              overallMarBadge.style.borderColor = '#fca5a5';
            }
          }
        }

        const moocSpan = document.getElementById('totalMoocPts');
        const overallMoocBadge = document.getElementById('overallMoocBadge');
        if (moocSpan) {
          moocSpan.innerText = totalMoocPoints;
          if (totalMoocPoints >= 20) {
            moocSpan.style.color = '#10b981';
            if (overallMoocBadge) {
              overallMoocBadge.innerText = 'Fulfilled';
              overallMoocBadge.style.background = '#d1fae5';
              overallMoocBadge.style.color = '#065f46';
              overallMoocBadge.style.borderColor = '#a7f3d0';
            }
          } else {
            moocSpan.style.color = '#ef4444';
            if (overallMoocBadge) {
              overallMoocBadge.innerText = 'Unfulfilled';
              overallMoocBadge.style.background = '#fee2e2';
              overallMoocBadge.style.color = '#ef4444';
              overallMoocBadge.style.borderColor = '#fca5a5';
            }
          }
        }

        // Set year displays & highlight unfulfilled in red
        for (let y = 1; y <= 4; y++) {
          const yMarEl = document.getElementById(`y${y}Mar`);
          if (yMarEl) {
            yMarEl.innerText = yearPoints[y].mar;
            yMarEl.style.color = yearPoints[y].mar >= 25 ? '#10b981' : '#ef4444';
          }

          const yMoocEl = document.getElementById(`y${y}Mooc`);
          if (yMoocEl) {
            yMoocEl.innerText = yearPoints[y].mooc;
            yMoocEl.style.color = yearPoints[y].mooc >= 4 ? '#10b981' : '#ef4444';
          }
        }

        // Render Lists
        const marRecords = records.filter(r => r.category === 'mar');
        const moocRecords = records.filter(r => r.category === 'mooc');

        if (marRecords.length === 0) {
          marList.innerHTML = `<div style="text-align:center; padding:20px; color:#64748b;">No MAR claims registered.</div>`;
        } else {
          marList.innerHTML = marRecords.map(r => renderMarRecordHtml(r)).join('');
        }

        if (moocRecords.length === 0) {
          moocList.innerHTML = `<div style="text-align:center; padding:20px; color:#64748b;">No MOOC claims registered.</div>`;
        } else {
          moocList.innerHTML = moocRecords.map(r => renderMoocRecordHtml(r)).join('');
        }

      } catch (err) {
        marList.innerHTML = `<div style="color:red; text-align:center; padding:20px;">Error loading MAR claims.</div>`;
        moocList.innerHTML = `<div style="color:red; text-align:center; padding:20px;">Error loading MOOC claims.</div>`;
      }
    }

    function getEntryAcademicYear(createdAt) {
      const currentYearStr = user.year || '1st Year';
      const currentYearNum = parseInt(currentYearStr) || 1;
      const diffMs = Date.now() - new Date(createdAt).getTime();
      const diffYears = Math.floor(diffMs / (365 * 24 * 60 * 60 * 1000));
      const entryYear = Math.max(1, currentYearNum - diffYears);
      return entryYear;
    }

    function renderMarRecordHtml(r) {
      const dateStr = new Date(r.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      const secInfo = MAR_SECTIONS[r.activitySection] || { label: 'General Activity' };
      const statusBadge = getStatusBadge(r.status);
      const proofUrl = r.certificateUrl ? (r.certificateUrl.startsWith('http') ? r.certificateUrl : `${apiBase}${r.certificateUrl}`) : null;

      return `
        <div class="record-item">
          <div style="display:flex; justify-content:space-between; align-items:start; gap:10px;">
            <strong style="font-size:0.9rem; color:#1e1b4b;">${esc(r.title)}</strong>
            ${statusBadge}
          </div>
          <div style="font-size:0.75rem; color:#64748b; display:flex; flex-direction:column; gap:2px; margin-top:2px;">
            <div>Category: ${esc(secInfo.label)}</div>
            <div>Submitted on ${dateStr}</div>
            ${r.status === 'Verified' ? `<div style="color:#059669; font-weight:600;">+${r.points} MAR Points Credited</div>` : `<div style="color:#2563eb;">Claiming +${r.points} MAR Points (Pending Approval)</div>`}
            ${r.remark ? `<div style="color:#b91c1c; font-style:italic; margin-top:4px;">* Remark: ${esc(r.remark)}</div>` : ''}
          </div>
          ${proofUrl ? `
            <a href="${proofUrl}" target="_blank" rel="noopener noreferrer" style="align-self:flex-start; margin-top:6px; font-size:0.75rem; color:#2563eb; text-decoration:none; display:inline-flex; align-items:center; gap:4px; font-weight:600;">
              <i class="fa-solid fa-arrow-up-right-from-square"></i> Open Document Proof
            </a>
          ` : ''}
        </div>
      `;
    }

    function renderMoocRecordHtml(r) {
      const dateStr = new Date(r.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      const statusBadge = getStatusBadge(r.status);
      const proofUrl = r.certificateUrl || r.externalLink;
      const formattedProofUrl = proofUrl ? (proofUrl.startsWith('http') ? proofUrl : `${apiBase}${proofUrl}`) : null;

      return `
        <div class="record-item" style="border-left: 3px solid #2563eb;">
          <div style="display:flex; justify-content:space-between; align-items:start; gap:10px;">
            <strong style="font-size:0.9rem; color:#1e1b4b;">${esc(r.title)}</strong>
            ${statusBadge}
          </div>
          <div style="font-size:0.75rem; color:#64748b; display:flex; flex-direction:column; gap:2px; margin-top:2px;">
            <div>Duration: <strong>${r.duration || 0} Hours</strong></div>
            <div>Submitted on ${dateStr}</div>
            ${r.status === 'Verified' ? `<div style="color:#2563eb; font-weight:600;">+${r.points} MOOC Credits Credited</div>` : `<div style="color:#2563eb;">Claiming +${r.points} MOOC Credits (Pending Approval)</div>`}
            ${r.remark ? `<div style="color:#b91c1c; font-style:italic; margin-top:4px;">* Remark: ${esc(r.remark)}</div>` : ''}
          </div>
          ${formattedProofUrl ? `
            <a href="${formattedProofUrl}" target="_blank" rel="noopener noreferrer" style="align-self:flex-start; margin-top:6px; font-size:0.75rem; color:#2563eb; text-decoration:none; display:inline-flex; align-items:center; gap:4px; font-weight:600;">
              <i class="fa-solid fa-arrow-up-right-from-square"></i> Open Certificate Proof
            </a>
          ` : ''}
        </div>
      `;
    }

    function getStatusBadge(status) {
      if (status === 'Verified') return `<span class="record-badge badge-verified"><i class="fa-solid fa-circle-check"></i> Approved</span>`;
      if (status === 'Rejected') return `<span class="record-badge badge-rejected"><i class="fa-solid fa-circle-xmark"></i> Rejected</span>`;
      return `<span class="record-badge badge-proposed"><i class="fa-regular fa-clock"></i> Pending Mentor</span>`;
    }
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
