function getCampusCareApiBase() {
  const isLocal =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname === "" ||
    window.location.protocol === "file:";
  return isLocal
    ? "http://localhost:5000"
    : "https://campuscare-backend-96cn.onrender.com";
}

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch (error) {
    return {};
  }
}

function getConversationId() {
  const existing = sessionStorage.getItem("campuscare_ai_conversation_id");
  if (existing) return existing;
  const next = crypto.randomUUID();
  sessionStorage.setItem("campuscare_ai_conversation_id", next);
  return next;
}

function getClientContext() {
  const now = new Date();
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata";
  return {
    isoDate: now.toISOString(),
    weekday: now.toLocaleDateString("en-IN", { weekday: "long", timeZone }),
    dayIndex: (now.getDay() + 6) % 7,
    localeDate: now.toLocaleDateString("en-IN", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
      timeZone,
    }),
    timeZone,
    utcOffsetMinutes: -now.getTimezoneOffset(),
  };
}

function appendAiMessage(role, text) {
  const history = document.getElementById("ai-chat-history");
  if (!history) return;
  const bubble = document.createElement("div");
  bubble.className = `ai-message ai-message-${role}`;
  bubble.textContent = text;
  history.appendChild(bubble);
  history.scrollTop = history.scrollHeight;
}

function appendAiChoices(result) {
  const history = document.getElementById("ai-chat-history");
  const choices = result?.payload?.choices || [];
  if (!history || !choices.length) return;

  const list = document.createElement("div");
  list.className = "ai-choice-list";
  choices.slice(0, 8).forEach((choice) => {
    const item = document.createElement("div");
    item.className = "ai-choice-item";
    const title = choice.title || choice.subject || "Item";
    const meta = [choice.subject, choice.facultyName, choice.room ? `Room ${choice.room}` : ""]
      .filter(Boolean)
      .join(" | ");
    item.innerHTML = `<strong>${title}</strong>${meta ? `<span>${meta}</span>` : ""}`;
    list.appendChild(item);
  });
  history.appendChild(list);
  history.scrollTop = history.scrollHeight;
}

function setAiStatus(text) {
  const status = document.getElementById("ai-status");
  if (status) status.textContent = text;
}

function enterAiConversationMode() {
  const assistant = document.getElementById("assistant-section");
  if (assistant) assistant.classList.add("is-chatting");
}

async function askAI() {
  const input = document.getElementById("ai-input");
  const sendBtn = document.getElementById("ai-send-btn");
  const query = input?.value.trim();
  if (!query) return;

  const user = getStoredUser();
  const token = user.token || localStorage.getItem("token");
  enterAiConversationMode();
  appendAiMessage("user", query);
  if (input) input.value = "";

  if (!token) {
    appendAiMessage("bot", "Please log in to use the connected campus assistant.");
    return;
  }

  try {
    setAiStatus("Asking CampusCare backend...");
    if (sendBtn) sendBtn.disabled = true;
    const response = await fetch(`${getCampusCareApiBase()}/api/ai/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        text: query,
        conversationId: getConversationId(),
        clientContext: getClientContext(),
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || data.message || "Assistant request failed.");
    }
    const result = data.response || data;
    appendAiMessage("bot", result.message || "Done.");
    appendAiChoices(result);
    setAiStatus("Ready.");
  } catch (error) {
    appendAiMessage("bot", error.message || "I could not reach the assistant.");
    setAiStatus("Connection problem.");
  } finally {
    if (sendBtn) sendBtn.disabled = false;
  }
}

async function requestSos(type) {
  const user = getStoredUser();
  const token = user.token || localStorage.getItem("token");
  if (!token) {
    alert("Please log in before triggering campus SOS.");
    window.location.href = "login.html";
    return;
  }

  try {
    const response = await fetch(`${getCampusCareApiBase()}/api/ai/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        text: `Emergency SOS: ${type}. Please trigger campus assistance immediately.`,
        conversationId: getConversationId(),
        clientContext: getClientContext(),
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || data.message || "SOS request failed.");
    }
    const result = data.response || data;
    alert(result.message || `${type} request sent to CampusCare.`);
  } catch (error) {
    alert(error.message || "Could not send SOS request. Please call campus security directly.");
  }
}

window.askAI = askAI;

// Global Click Handler for CSP Compliance
document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-action], [data-alert]");
  if (!el) return;

  const action = el.dataset.action;
  const id = el.dataset.id;
  const alertMsg = el.dataset.alert;
  const url = el.dataset.url;

  if (alertMsg && !action) {
    alert(alertMsg);
    return;
  }

  switch (action) {
    case "logout":
      if (typeof logout === "function") logout();
      break;
    case "toggleModal":
      const modalId = el.dataset.modalId || el.dataset.id || id;
      if (modalId) {
        if (typeof window.toggleModal === "function") {
          window.toggleModal(modalId);
        } else {
          const modal = document.getElementById(modalId);
          if (modal) {
            const currentDisplay = modal.style.display || window.getComputedStyle(modal).display;
            modal.style.display = currentDisplay === 'none' ? 'flex' : 'none';
          }
        }
      }
      break;
    case "toggleRightPanel":
      if (typeof toggleRightPanel === "function")
        toggleRightPanel(el.dataset.panelMode);
      break;
    case "closeRightPanel":
      if (typeof closeRightPanel === "function") closeRightPanel();
      break;
    case "toggleProfileMenu":
      if (typeof toggleProfileMenu === "function") toggleProfileMenu();
      break;
    case "goToModule":
      goToModule(el.dataset.moduleRole);
      break;
    case "bloodAlert":
      const bg = prompt("Please enter the required Blood Group (e.g. O+):");
      if (bg)
        alert("Broadcasting Blood Requirement (" + bg + ") Alert to Campus!");
      break;
    case "aiQuery":
      const input = document.getElementById("ai-input");
      if (input) {
        input.value = el.dataset.query;
        if (typeof askAI === "function") askAI();
      }
      break;
    case "askAI":
      if (typeof askAI === "function") askAI();
      break;
    case "sosRequest":
      requestSos(el.dataset.sosType || "Emergency SOS");
      break;
    case "upvote":
      if (typeof upvote === "function") upvote(id);
      break;
    case "windowOpen":
      window.open(url || el.src, "_blank");
      break;
    case "scrollIntoView":
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      break;
  }
});
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

if (document.readyState === "interactive" || document.readyState === "complete") {
  initSidebar();
} else {
  document.addEventListener("DOMContentLoaded", initSidebar);
}

document.addEventListener("DOMContentLoaded", async () => {
  // Wrap CampusCare logo/text with landing page link dynamically
  const topNavbar = document.querySelector(".top-navbar");
  if (topNavbar) {
    const h1 = topNavbar.querySelector("h1");
    if (h1 && h1.textContent.includes("CampusCare")) {
      const pathSegments = window.location.pathname.split("/").filter(Boolean);
      const isSubDir = pathSegments.some(s =>
        ["student", "teacher", "hostel", "hosteler", "complaints", "hod", "warden", "principal", "dean"].includes(s.toLowerCase())
      );
      const targetUrl = isSubDir ? "../index.html" : "index.html";
      if (!h1.querySelector("a")) {
        const span = h1.querySelector("span");
        const badgeHtml = span ? span.outerHTML : "";
        h1.innerHTML = `<a href="${targetUrl}" style="text-decoration: none; color: inherit; cursor: pointer;">CampusCare</a>${badgeHtml ? ' ' + badgeHtml : ''}`;
      }
    }
  }

  const dateDisplay = document.querySelector(".date-display");
  if (dateDisplay) {
    dateDisplay.innerHTML = `<i class="fa-regular fa-calendar"></i> ${new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })}`;
  }

  const isLocal =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname === "" ||
    window.location.protocol === "file:";
  const API_BASE = isLocal
    ? "http://localhost:5000"
    : "https://campuscare-backend-96cn.onrender.com";

  // 1. Immediate UI Updates (Auth & Profile)
  if (window.checkAuthState) window.checkAuthState();

  // 2. Load Public Notices
  const noticeContainer = document.getElementById("public-notice-list");

  if (noticeContainer) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000); // 45s timeout for Render wake

      const res = await fetch(`${API_BASE}/api/notices?role=public`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!res.ok) throw new Error("API Error");
      const notices = await res.json();

      if (notices.length === 0) {
        noticeContainer.innerHTML =
          '<div style="background:rgba(255,255,255,0.8); padding:1rem; border-radius:10px; text-align:center; color:#64748b;">No recent public notices available.</div>';
        return;
      }

      let html = "";
      notices.slice(0, 3).forEach((n, index) => {
        const date = new Date(n.date).toLocaleDateString(undefined, {
          day: "numeric",
          month: "short",
        });
        let iconClass = "fa-solid fa-bell";
        let iconStyle = "background: #d1fae5; color: #10b981;"; // Green
        const titleLower = n.title.toLowerCase();
        const contentLower = n.content.toLowerCase();
        if (
          titleLower.includes("vacation") ||
          titleLower.includes("holiday") ||
          titleLower.includes("closed")
        ) {
          iconStyle = "background: #fee2e2; color: #ef4444;";
          iconClass = "fa-solid fa-umbrella-beach";
        } else if (
          titleLower.includes("event") ||
          titleLower.includes("competition") ||
          titleLower.includes("tournament") ||
          titleLower.includes("festival")
        ) {
          iconStyle = "background: #e0e7ff; color: #4f46e5;";
          iconClass = "fa-solid fa-trophy";
        }

        html += `
                <div class="notice-item fade-in stagger-${(index % 4) + 1}" data-alert="${n.title}\n\n${n.content}">
                    <div style="${iconStyle} width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; flex-shrink: 0;"><i class="${iconClass}"></i></div>
                    <div class="notice-info" style="min-width: 0;">
                        <h4 style="font-size: 0.95rem; margin-bottom: 4px; color: var(--text-dark);">${n.title}</h4>
                        <p style="font-size: 0.85rem; color: var(--text-muted); margin: 0;">${n.content}</p>
                    </div>
                    <div class="notice-date" style="font-size: 0.8rem; font-weight: 600;">${date}</div>
                </div>`;
      });
      noticeContainer.innerHTML = html;
    } catch (error) {
      console.error("API Error, using fallback data:", error);
      // Fallback Data so the UI never looks broken
      const fallbackNotices = [
        {
          title: "Semester Exams",
          content: "Final exams begin from Dec 25th. Check routine.",
          date: new Date(),
        },
        {
          title: "Campus Wi-Fi Update",
          content: "Maintenance scheduled for Saturday night.",
          date: new Date(Date.now() - 86400000),
        },
        {
          title: "Cultural Fest 2025",
          content: "Registration opens next week for all students.",
          date: new Date(Date.now() - 172800000),
        },
      ];

      let html = "";
      fallbackNotices.slice(0, 3).forEach((n) => {
        const date = new Date(n.date).toLocaleDateString(undefined, {
          day: "numeric",
          month: "short",
        });
        let iconClass = "fa-solid fa-bell";
        let iconStyle = "background: #d1fae5; color: #10b981;"; // Green
        const titleLower = n.title.toLowerCase();
        if (
          titleLower.includes("vacation") ||
          titleLower.includes("holiday") ||
          titleLower.includes("closed")
        ) {
          iconStyle = "background: #fee2e2; color: #ef4444;";
          iconClass = "fa-solid fa-umbrella-beach";
        } else if (
          titleLower.includes("event") ||
          titleLower.includes("competition") ||
          titleLower.includes("tournament") ||
          titleLower.includes("festival") ||
          titleLower.includes("fest")
        ) {
          iconStyle = "background: #e0e7ff; color: #4f46e5;";
          iconClass = "fa-solid fa-trophy";
        }

        html += `
                <div class="notice-item" data-alert="${n.title}\n\n${n.content}">
                    <div style="${iconStyle} width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; flex-shrink: 0;"><i class="${iconClass}"></i></div>
                    <div class="notice-info" style="min-width: 0;">
                        <h4 style="font-size: 0.95rem; margin-bottom: 4px; color: var(--text-dark);">${n.title}</h4>
                        <p style="font-size: 0.85rem; color: var(--text-muted); margin: 0;">${n.content}</p>
                    </div>
                    <div class="notice-date" style="font-size: 0.8rem; font-weight: 600;">${date}</div>
                </div>`;
      });
      noticeContainer.innerHTML = html;
    }
  }

  // Load Alumni
  const alumniContainer = document.getElementById("alumni-list");
  const prevAlumniBtn = document.getElementById("prev-alumni-btn");
  const nextAlumniBtn = document.getElementById("next-alumni-btn");
  if (alumniContainer) {
    try {
      const res = await fetch(`${API_BASE}/api/alumni`);
      if (!res.ok) throw new Error("API Error");
      const alumni = await res.json();

      if (alumni.length === 0) {
        alumniContainer.innerHTML =
          '<p style="text-align:center; width:100%;">No alumni profiles found.</p>';
        if (prevAlumniBtn) prevAlumniBtn.style.display = "none";
        if (nextAlumniBtn) nextAlumniBtn.style.display = "none";
      } else {
        let activeAlumniIndex = 0;

        const renderActiveAlumni = () => {
          const a = alumni[activeAlumniIndex];
          const name = a.user ? a.user.name : a.name || "Alumni";
          const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&size=100`;

          // Constructing extra details to fill space
          const degreeDept = (a.degree && a.department) 
            ? `${a.degree} in ${a.department}`
            : (a.degree || a.department || "");
          const classOf = a.graduationYear ? ` (Class of ${a.graduationYear})` : "";
          
          let linkedinHtml = "";
          if (a.linkedinProfile) {
            linkedinHtml = `
              <a href="${a.linkedinProfile}" target="_blank" rel="noopener" 
                 style="display: inline-flex; align-items: center; gap: 6px; margin-top: 8px; color: #0077b5; text-decoration: none; font-weight: 600; font-size: 0.85rem; transition: color 0.2s;"
                 onmouseenter="this.style.color='#005582'; this.style.textDecoration='underline'" 
                 onmouseleave="this.style.color='#0077b5'; this.style.textDecoration='none'">
                <i class="fa-brands fa-linkedin" style="font-size: 1.1rem;"></i> LinkedIn Profile
              </a>
            `;
          }

          alumniContainer.innerHTML = `
            <div class="fade-in" style="display: flex; align-items: center; gap: 20px; background: var(--bg-color); padding: 20px; border-radius: var(--radius-md); min-height: 120px;">
              <img src="${avatarUrl}" alt="${name}" class="profile-img" style="margin: 0; width: 70px; height: 70px; border-radius: 50%; object-fit: cover;">
              <div style="flex: 1; min-width: 0;">
                <h4 class="profile-name" style="font-size: 1.1rem; margin-bottom: 2px; text-align: left;">${name}</h4>
                ${degreeDept ? `<p style="font-size: 0.8rem; color: var(--text-muted); margin: 0 0 4px 0; text-align: left;"><i class="fa-solid fa-graduation-cap" style="margin-right: 4px;"></i> ${degreeDept}${classOf}</p>` : ""}
                <p class="profile-role" style="margin-bottom: 8px; text-align: left; font-weight: 600; color: var(--primary);">${a.jobTitle} @ ${a.currentCompany}</p>
                <p class="profile-quote" style="margin: 0 0 8px 0; text-align: left; font-size: 0.85rem; color: var(--text-muted); font-style: italic;">"${a.about || "Proud Alumni of CampusCare"}"</p>
                ${linkedinHtml}
              </div>
            </div>
          `;

          // Handle button states if only 1 alumni exists
          if (alumni.length <= 1) {
            if (prevAlumniBtn) prevAlumniBtn.style.display = "none";
            if (nextAlumniBtn) nextAlumniBtn.style.display = "none";
          } else {
            if (prevAlumniBtn) prevAlumniBtn.style.display = "flex";
            if (nextAlumniBtn) nextAlumniBtn.style.display = "flex";
          }
        };

        renderActiveAlumni();

        if (prevAlumniBtn) {
          prevAlumniBtn.onclick = (e) => {
            e.preventDefault();
            activeAlumniIndex = (activeAlumniIndex - 1 + alumni.length) % alumni.length;
            renderActiveAlumni();
          };
        }
        if (nextAlumniBtn) {
          nextAlumniBtn.onclick = (e) => {
            e.preventDefault();
            activeAlumniIndex = (activeAlumniIndex + 1) % alumni.length;
            renderActiveAlumni();
          };
        }
      }
    } catch (error) {
      console.error("Alumni API Error:", error);
      alumniContainer.innerHTML =
        '<p style="text-align:center; color:red;">Failed to load alumni.</p>';
      if (prevAlumniBtn) prevAlumniBtn.style.display = "none";
      if (nextAlumniBtn) nextAlumniBtn.style.display = "none";
    }
  }

  // Load Academic Leaders
  const leadersContainer = document.getElementById("academic-leaders-list");
  if (leadersContainer) {
    try {
      const res = await fetch(`${API_BASE}/api/academic-leaders`);
      if (!res.ok) throw new Error("API Error");
      const leaders = await res.json();

      if (leaders.length === 0) {
        leadersContainer.innerHTML = '<p style="text-align:center; width:100%; color:var(--text-muted);">No academic leaders found.</p>';
      } else {
        let html = "";
        // Show up to 4 leaders on the landing page
        const displayLeaders = leaders.slice(0, 4);
        displayLeaders.forEach((leader) => {
          const avatarUrl = leader.image ? `${API_BASE}${leader.image}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(leader.name)}&background=random`;
          const quote = leader.message ? `"${leader.message}"` : '"Leading with excellence."';
          
          html += `
            <div class="profile-card" style="flex: 1; min-width: 200px; border: 1px solid var(--border-color); border-radius: var(--radius-md);">
              <img src="${avatarUrl}" class="profile-img" alt="${leader.name}" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(leader.name)}&background=random'" />
              <p class="profile-quote" style="min-height: 48px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; font-style: italic;">${quote}</p>
              <h4 class="profile-name" style="margin-top: 10px; margin-bottom: 2px;">- ${leader.name}</h4>
              <p class="profile-role" style="color: var(--primary); font-weight: 600; font-size: 0.85rem;">${leader.role}</p>
            </div>
          `;
        });
        leadersContainer.innerHTML = html;
      }
    } catch (error) {
      console.error("Academic Leaders API Error:", error);
      leadersContainer.innerHTML = '<p style="text-align:center; width:100%; color:red;">Failed to load academic leaders.</p>';
    }
  }

  // Load Transparency Wall (Complaints)
  const complaintContainer = document.getElementById("complaint-list");
  const wallSearch = document.getElementById("wall-search");
  let allPublicComplaints = [];

  if (complaintContainer) {
    try {
      const res = await fetch(`${API_BASE}/api/complaints`);
      if (res.ok) {
        let complaints = await res.json();

        // PRIVACY FILTER: Show all non-personal, BUT only show 'Personal' if it belongs to the logged-in user
        const userStrFilter = localStorage.getItem("user");
        const userFilterObj = userStrFilter ? JSON.parse(userStrFilter) : null;

        allPublicComplaints = complaints.filter((c) => {
          if (c.category !== "Personal") return true;
          const studentId =
            c.student && c.student._id ? c.student._id : c.student;
          if (userFilterObj && studentId === userFilterObj._id) return true;
          return false;
        });
        renderWallComplaints(allPublicComplaints);
      }
    } catch (error) {
      console.error("Transparency Wall Error:", error);
    }

    if (wallSearch) {
      wallSearch.addEventListener("input", (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = allPublicComplaints.filter(
          (c) =>
            c.title.toLowerCase().includes(term) ||
            c.description.toLowerCase().includes(term),
        );
        renderWallComplaints(filtered);
      });
    }
  }

  function renderWallComplaints(complaintsToRender) {
    if (!complaintContainer) return;

    if (complaintsToRender.length === 0) {
      complaintContainer.innerHTML =
        '<p style="text-align: center; width: 100%; color: #64748b;">No complaints found.</p>';
      return;
    }

    // Filter uniqueness
    const uniqueComplaints = [];
    const seenIds = new Set();

    complaintsToRender.forEach((c) => {
      if (!seenIds.has(c._id)) {
        uniqueComplaints.push(c);
        seenIds.add(c._id);
      }
    });

    // --- Dynamic Stats calculation ---
    const total = uniqueComplaints.length;
    let resolvedCount = 0;
    let inProgressCount = 0;
    let unresolvedCount = 0;

    uniqueComplaints.forEach((c) => {
      const st = (c.status || "").toLowerCase();
      if (st === "resolved") resolvedCount++;
      else if (st === "in progress") inProgressCount++;
      else unresolvedCount++;
    });

    const statTotal = document.getElementById("stat-total");
    if (statTotal) statTotal.innerText = total;

    const statsArr = [
      {
        id: "progress",
        count: inProgressCount,
        title: "In Progress",
        iconClass: "icon-yellow",
        icon: "fa-spinner",
        color: "var(--warning-light)",
      },
      {
        id: "resolved",
        count: resolvedCount,
        title: "Resolved",
        iconClass: "icon-green",
        icon: "fa-check",
        color: "var(--success-light)",
      },
      {
        id: "unresolved",
        count: unresolvedCount,
        title: "Unresolved",
        iconClass: "icon-red",
        icon: "fa-rotate-left",
        color: "var(--danger-light)",
      },
    ];

    // Sort dynamically highest first
    statsArr.sort((a, b) => b.count - a.count);

    const statsRow = document.getElementById("complaints-stats-row");
    if (statsRow) {
      // Keep the first box (Total Complaints) and remove the rest if any
      while (statsRow.children.length > 1) {
        statsRow.removeChild(statsRow.lastChild);
      }
      // Append the sorted boxes
      statsArr.forEach((s) => {
        const div = document.createElement("div");
        div.className = "stat-box";
        div.innerHTML = `
                    <div class="stat-box-icon ${s.iconClass}"><i class="fa-solid ${s.icon}"></i></div>
                    <div class="stat-box-info">
                        <p>${s.title}</p>
                        <h3 id="stat-${s.id}">${s.count}</h3>
                    </div>
                `;
        statsRow.appendChild(div);
      });
    }

    const pieChart = document.getElementById("complaint-pie-chart");
    if (pieChart && total > 0) {
      let currentPercentage = 0;
      const gradientParts = statsArr.map((s) => {
        const percentage = (s.count / total) * 100;
        const part = `${s.color} ${currentPercentage}% ${currentPercentage + percentage}%`;
        currentPercentage += percentage;
        return part;
      });
      pieChart.style.background = `conic-gradient(${gradientParts.join(", ")})`;
    }
    // --- End Dynamic Stats ---

    if (uniqueComplaints.length > 0) {
      let unresolved = null;
      let resolved = null;
      let inprogress = null;
      const recents = [];

      // Sort by upvotes for best match
      const byUpvotes = [...uniqueComplaints].sort(
        (a, b) => (b.upvotes || 0) - (a.upvotes || 0),
      );

      for (const c of byUpvotes) {
        if (!unresolved && c.status === "Unresolved") unresolved = c;
        else if (!resolved && c.status === "Resolved") resolved = c;
        else if (!inprogress && c.status === "In Progress") inprogress = c;
      }

      // Fallback for Unresolved/Pending naming
      if (!unresolved) {
        for (const c of byUpvotes) {
          if (
            !unresolved &&
            c.status !== "Resolved" &&
            c.status !== "In Progress"
          )
            unresolved = c;
        }
      }

      const selectedIds = new Set();
      if (unresolved) selectedIds.add(unresolved._id);
      if (resolved) selectedIds.add(resolved._id);
      if (inprogress) selectedIds.add(inprogress._id);

      // Get recent ones to fill up to 5 total
      const byDate = [...uniqueComplaints].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      const targetRecentsCount = 5 - selectedIds.size;
      for (const c of byDate) {
        if (!selectedIds.has(c._id) && recents.length < targetRecentsCount) {
          recents.push(c);
          selectedIds.add(c._id);
        }
      }

      complaintsToRender = [];
      if (unresolved) complaintsToRender.push(unresolved);
      if (inprogress) complaintsToRender.push(inprogress);
      if (resolved) complaintsToRender.push(resolved);
      complaintsToRender = complaintsToRender.concat(recents);
      
      // Ensure we only show maximum 5 complaints
      complaintsToRender = complaintsToRender.slice(0, 5);
    } else {
      complaintsToRender = uniqueComplaints.slice(0, 5);
    }

    const userStr = localStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;

    let html = "";
    complaintsToRender.forEach((c, index) => {
      let statusClass = "badge-progress";
      let dotClass = "dot-red";
      let statusText = c.status || "Reported";

      if (statusText.toLowerCase() === "resolved") {
        statusClass = "badge-resolved";
        dotClass = "dot-green";
      } else if (statusText.toLowerCase() === "in progress") {
        statusClass = "badge-progress";
        dotClass = "dot-blue";
      } else {
        statusText = "Submitted";
        statusClass = "badge-progress";
        dotClass = "dot-red";
      }

      const d = new Date(c.createdAt);
      const dateStr =
        String(d.getDate()).padStart(2, "0") +
        " " +
        d.toLocaleString("default", { month: "short" }) +
        ", " +
        d.getFullYear();

      // Safety Check for upvotedBy
      const upvotedBy = Array.isArray(c.upvotedBy) ? c.upvotedBy : [];
      const currentUserId = user
        ? user._id || user.identifier || user.id
        : null;
      const isLiked = currentUserId && upvotedBy.includes(currentUserId);
      const iconClass = isLiked
        ? "fa-solid fa-circle-up"
        : "fa-regular fa-circle-up";

      // Render Complaint Item
      html += `
              <div class="complaint-item fade-in stagger-${(index % 4) + 1}">
                <div class="status-dot ${dotClass}"></div>
                <div class="complaint-info">
                  <h4>${c.title}</h4>
                  <p>Reported by: ${c.student?.name || "Student"}</p>
                </div>
                
                <!-- PREVIEWS -->
                <div style="display: flex; gap: 5px; margin-right: 15px;">
                    ${c.image ? `<img src="${API_BASE}${c.image}" style="width:30px; height:30px; border-radius:4px; object-fit:cover; border:1px solid var(--border-color); cursor:pointer;" title="Reported Issue" data-action="windowOpen">` : ""}
                    ${c.status === "Resolved" && (c.resolutionImage || c.afterImage) ? `<img src="${API_BASE}${c.resolutionImage || c.afterImage}" style="width:30px; height:30px; border-radius:4px; object-fit:cover; border:1px solid #10b981; cursor:pointer;" title="Resolution Proof" data-action="windowOpen">` : ""}
                </div>

                <div class="badge ${statusClass}">${statusText}</div>

                <!-- UPVOTE BUTTON (Between Status and Date) -->
                <div style="display: flex; align-items: center; justify-content: center; gap: 6px; margin-left: 10px; cursor:pointer; 
                    color:${isLiked ? "#6b46c1" : "var(--text-muted)"}; 
                    background: ${isLiked ? "#6b46c115" : "transparent"};
                    font-size: 0.95rem; font-weight: 700; min-width: 50px; 
                    border: 2px solid ${isLiked ? "#6b46c1" : "var(--border-color)"}; 
                    padding: 4px 12px; border-radius: 20px; transition: all 0.2s;" 
                    id="like-btn-${c._id}" data-action="upvote" data-id="${c._id}">
                    <i class="${iconClass}"></i> <span id="count-${c._id}">${c.upvotes || 0}</span>
                </div>

                <div class="notice-date" style="margin-left: 10px; min-width: 90px; text-align: right;">${dateStr}</div>
              </div>
            `;
    });
    complaintContainer.innerHTML = html;
  }

  // Animate Blobs or Interactivity if needed
});

// --- UPVOTE FUNCTION ---
async function upvote(id) {
  const userStr = localStorage.getItem("user");
  if (!userStr) {
    alert("Please login to upvote!");
    window.location.href = "login.html";
    return;
  }
  const user = JSON.parse(userStr);
  const token = localStorage.getItem("token"); // Assuming token is stored here, or checking user object

  try {
    const API_BASE =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname === "" ||
      window.location.protocol === "file:"
        ? "http://localhost:5000"
        : "https://campuscare-backend-96cn.onrender.com";
    const res = await fetch(`${API_BASE}/api/complaints/${id}/upvote`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.token || token}`,
      },
    });

    if (res.ok) {
      const data = await res.json();
      // Data structure: { action: 'added'|'removed', upvotes: number, complaint: object }

      // Update Count
      const countSpan = document.getElementById(`count-${id}`);
      if (countSpan) countSpan.innerText = data.upvotes;

      // Find the button to update style
      const btn = document.getElementById(`like-btn-${id}`);
      if (btn) {
        if (data.action === "added") {
          // Liked State
          btn.style.color = "#6b46c1";
          btn.style.borderColor = "#6b46c1";
          btn.style.background = "#6b46c115";
          const icon = btn.querySelector("i");
          if (icon) {
            icon.classList.remove("fa-regular");
            icon.classList.add("fa-solid");
          }
          btn.style.cursor = "pointer";
        } else {
          // Unliked State
          btn.style.color = "var(--text-muted)";
          btn.style.borderColor = "var(--border-color)";
          btn.style.background = "transparent";
          const icon = btn.querySelector("i");
          if (icon) {
            icon.classList.remove("fa-solid");
            icon.classList.add("fa-regular");
          }
          btn.style.cursor = "pointer";
        }
      }
    } else {
      const err = await res.json();
      if (res.status === 401) {
        alert("Session expired or invalid. Please login again to upvote.");
        localStorage.clear();
        window.location.href = "login.html";
        return;
      }
      alert(err.message || "Failed to upvote");
    }
  } catch (error) {
    console.error("Upvote Error:", error);
  }
}

// --- AUTH FUNCTIONS ---
// --- AUTH FUNCTIONS ---
window.checkAuthState = function () {
  console.log("[Auth] Checking auth state...");
  const userStr = localStorage.getItem("user");
  const loginBtn = document.getElementById("loginBtn");
  const userProfile = document.getElementById("userProfile");
  const userName = document.getElementById("userName");
  const userAvatar = document.getElementById("userAvatar");
  const userDetails = document.getElementById("userDetails");

  if (userAvatar && !userAvatar.dataset.intercepted) {
    userAvatar.dataset.intercepted = "true";
    try {
      const originalDescriptor = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
      Object.defineProperty(userAvatar, 'src', {
        get: function() {
          return originalDescriptor.get.call(this);
        },
        set: function(value) {
          const user = getStoredUser();
          if (user.profilePicture && value && value.includes("ui-avatars.com/api")) {
            let avatarSrc = user.profilePicture;
            if (!avatarSrc.startsWith("http")) {
              const isLocal = window.location.hostname === "localhost" ||
                              window.location.hostname === "127.0.0.1" ||
                              window.location.hostname === "" ||
                              window.location.protocol === "file:";
              const BACKEND_URL = isLocal
                ? "http://localhost:5000"
                : "https://campuscare-backend-96cn.onrender.com";
              avatarSrc = avatarSrc.startsWith("/") ? `${BACKEND_URL}${avatarSrc}` : `${BACKEND_URL}/${avatarSrc}`;
            }
            avatarSrc += (avatarSrc.includes("?") ? "&" : "?") + `t=${new Date().getTime()}`;
            originalDescriptor.set.call(this, avatarSrc);
          } else {
            originalDescriptor.set.call(this, value);
          }
        },
        configurable: true
      });
    } catch (e) {
      console.error("[Auth] Failed to intercept avatar src:", e);
    }
  }

  if (userStr) {
    // User is Logged In
    const user = JSON.parse(userStr);

    if (loginBtn) loginBtn.style.display = "none";

    // Explicitly set flex to override CSS 'display: none' from class
    if (userProfile) userProfile.style.display = "flex";

    if (userName) {
      let displayName = "User";
      if (user.name) displayName = user.name.split(" ")[0];
      else if (user.role)
        displayName = user.role.charAt(0).toUpperCase() + user.role.slice(1);

      userName.textContent = `Hello, ${displayName}`;
    }

    const userRoleEl = document.getElementById("userRole");
    if (userRoleEl) {
      const role = (user.role || "").toLowerCase();
      if (role === "student" || role === "hosteler") {
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
        userRoleEl.textContent = `${dept}${yrText}`;
      } else if (role === "teacher" || role === "hod" || role === "warden" || role === "dean" || role === "principal") {
        const roleLabels = {
          teacher: "Faculty",
          hod: "Head of Department",
          warden: "Hostel Admin",
          dean: "Dean of Students",
          principal: "Principal"
        };
        const label = roleLabels[role] || (role.charAt(0).toUpperCase() + role.slice(1));
        const deptText = user.department ? `, Dept: ${user.department}` : "";
        userRoleEl.textContent = `${label}${deptText}`;
      } else {
        userRoleEl.textContent = user.role ? (user.role.charAt(0).toUpperCase() + user.role.slice(1)) : "User";
      }
    }

    // Role-based Colors
    let roleColor = "10b981"; // Default Green (Teacher/General)
    const role = (user.role || "").toLowerCase();

    if (role === "student")
      roleColor = "3b82f6"; // Blue
    else if (role === "hosteler")
      roleColor = "f59e0b"; // Orange
    else if (role === "teacher") roleColor = "10b981"; // Green

    // --- WARDEN SIDEBAR BADGE SYNCING ---
    const sidebarBadge = document.getElementById("leaveCountBadgeSidebar");
    if (sidebarBadge && (role === "warden" || role === "admin") && user.token) {
      const backendUrl = getCampusCareApiBase();
      fetch(`${backendUrl}/api/warden/dashboard`, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      })
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch warden stats");
        return res.json();
      })
      .then(data => {
        sidebarBadge.innerText = data.pendingLeaves;
        if (data.pendingLeaves > 0) {
          sidebarBadge.style.display = 'inline-block';
        } else {
          sidebarBadge.style.display = 'none';
        }
        // Also sync the main leave count badge on the main dashboard if it exists
        const mainBadge = document.getElementById("leaveCountBadge");
        if (mainBadge) {
          mainBadge.innerText = data.pendingLeaves;
          if (data.pendingLeaves > 0) mainBadge.style.display = 'flex';
          else mainBadge.style.display = 'none';
        }
      })
      .catch(err => {
        console.error("Error fetching warden badge count:", err);
      });
    }

    // --- DYNAMIC LOGO BADGE ---
    const logo = document.querySelector(".logo");
    if (logo) {
      // Check if a badge span already exists
      let badge = logo.querySelector("span");

      // If no badge exists, create one
      if (!badge) {
        badge = document.createElement("span");
        badge.style.fontSize = "0.75rem"; // Slightly smaller for cleanliness
        badge.style.color = "white";
        badge.style.padding = "3px 8px";
        badge.style.borderRadius = "20px"; // Pill shape
        badge.style.marginLeft = "8px";
        badge.style.fontWeight = "600";
        badge.style.textTransform = "uppercase";
        badge.style.letterSpacing = "0.5px";
        logo.appendChild(badge);
      }

      // Update badge content (ensure it matches current login)
      badge.innerText = role;
      badge.style.background = "#" + roleColor;
    }

    // Determine path depth for relative links (Profile & Image)
    const currentPath = window.location.pathname;
    const isSubDir =
      currentPath.includes("/student/") ||
      currentPath.includes("/teacher/") ||
      currentPath.includes("/hostel/") ||
      currentPath.includes("/complaints/") ||
      currentPath.includes("/notices/");

    // Default Avatar
    let avatarSrc = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || "User")}&background=${roleColor}&color=fff&rounded=true&bold=true`;

    // Custom Avatar (if exists)
    // Custom Avatar (if exists)
    if (user.profilePicture) {
      let cleanPath = user.profilePicture;

      if (cleanPath.startsWith("http")) {
        avatarSrc = cleanPath;
      } else {
        const isLocal =
          window.location.hostname === "localhost" ||
          window.location.hostname === "127.0.0.1" ||
          window.location.hostname === "" ||
          window.location.protocol === "file:";
        const BACKEND_URL = isLocal
          ? "http://localhost:5000"
          : "https://campuscare-backend-96cn.onrender.com";
        if (cleanPath.startsWith("/")) {
          avatarSrc = `${BACKEND_URL}${cleanPath}`;
        } else {
          avatarSrc = `${BACKEND_URL}/${cleanPath}`;
        }
      }

      // Add timestamp to prevent caching
      avatarSrc += `?t=${new Date().getTime()}`;
    }

    if (userAvatar) {
      // Fallback for 404 (Define BEFORE setting src)
      userAvatar.onerror = function () {
        this.onerror = null;
        this.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || "User")}&background=${roleColor}&color=fff&rounded=true&bold=true`;
      };

      userAvatar.src = avatarSrc;
      userAvatar.style.objectFit = "cover";
    }

    const navRoleBadgeWrapper = document.getElementById("navRoleBadgeWrapper");
    if (navRoleBadgeWrapper) {
      navRoleBadgeWrapper.style.display = "flex";
      navRoleBadgeWrapper.style.alignItems = "center";
      navRoleBadgeWrapper.style.gap = "8px";

      const roleModuleMap = {
        student: "student/index.html",
        teacher: "teacher/index.html",
        hod: "hod/index.html",
        dean: "dean/index.html",
        principal: "principal/index.html",
        warden: "warden/index.html",
        admin: "student/index.html",
      };

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

      function makeBadge(label, moduleUrl, colorKey) {
        const colors = badgeColors[colorKey] || { bg: "#d1fae5", color: "#065f46" };
        const btn = document.createElement("button");
        btn.className = "role-badge-clickable";
        btn.dataset.action = "goToModule";
        btn.dataset.moduleRole = colorKey;
        btn.style.background = colors.bg;
        btn.style.color = colors.color;
        btn.title = `Go to ${label} portal`;
        btn.innerHTML = `<i class="fa-solid fa-arrow-right-to-bracket" style="font-size:0.8rem; margin-right:5px;"></i>${label}`;
        return btn;
      }

      if (role === "hosteler") {
        // Dual badges side by side
        navRoleBadgeWrapper.innerHTML = "";
        navRoleBadgeWrapper.appendChild(makeBadge("Student", "student/index.html", "student"));
        navRoleBadgeWrapper.appendChild(makeBadge("Hosteler", "modules/complaints/post.html", "hosteler"));
      } else {
        navRoleBadgeWrapper.innerHTML = "";
        const modulePath = roleModuleMap[role] || "index.html";
        navRoleBadgeWrapper.appendChild(makeBadge(user.role || role, modulePath, role));
      }
    }

    const profileMenu = document.getElementById("profileMenu");
    if (profileMenu) {
      // Determine path to the shared profile module based on current location
      const currentPath = window.location.pathname;
      const profilePath =
        currentPath.includes("/student/") ||
        currentPath.includes("/teacher/") ||
        currentPath.includes("/hostel/") ||
        currentPath.includes("/hosteler/") ||
        currentPath.includes("/warden/") ||
        currentPath.includes("/principal/") ||
        currentPath.includes("/hod/") ||
        currentPath.includes("/dean/") ||
        currentPath.includes("/complaints/") ||
        currentPath.includes("/notices/")
          ? "../modules/profile.html"
          : "modules/profile.html";

      // Role-based Colors & Badges mapping
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

      const role = (user.role || "").toLowerCase();
      const colors = badgeColors[role] || { bg: "#ede9fe", color: "#6d28d9" };
      const roleLabel = user.role ? (user.role.toUpperCase() === 'HOD' ? 'HOD' : user.role.charAt(0).toUpperCase() + user.role.slice(1)) : 'Member';

      profileMenu.style.flexDirection = "column";
      profileMenu.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 12px; min-width: 240px; padding: 2px;">
          <!-- Line 1: Header with Badge -->
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border-color); padding-bottom: 10px; margin-bottom: 2px;">
            <span style="font-weight: 700; font-size: 0.95rem; color: var(--text-dark);">Account Details</span>
            <span class="role-badge-mini" style="text-transform: uppercase; font-size: 0.7rem; font-weight: 700; padding: 2px 8px; border-radius: var(--radius-sm); background: ${colors.bg}; color: ${colors.color};">${roleLabel}</span>
          </div>
          
          <!-- Line 2: Details (preserves #userDetails ID for inline scripts) -->
          <div id="userDetails" style="display: flex; flex-direction: column; gap: 4px; font-size: 0.8rem; color: var(--text-muted); line-height: 1.5; margin: 0 !important;">
            <strong style="font-size: 0.95rem; color: var(--text-dark);">${user.name || "User"}</strong>
            <span style="word-break: break-all;">${user.email || ""}</span>
            <span style="font-weight: 500;">
              ID: ${user.rollNumber || user.employeeId || user.identifier || "--"}
              ${user.department ? ` • Dept: ${user.department}` : ""}
              ${user.hostelName ? ` • Hostel: ${user.hostelName}` : ""}
            </span>
          </div>

          <!-- Line 3: Actions -->
          <div style="display: flex; gap: 8px; margin-top: 6px; border-top: 1px solid var(--border-color); padding-top: 12px;">
            <a href="${profilePath}" class="btn-outline-purple" style="flex: 1 !important; text-align: center; font-size: 0.8rem; padding: 8px 10px; text-decoration: none; border-radius: var(--radius-sm); font-weight: 600; display: inline-flex; align-items: center; justify-content: center; gap: 6px; transition: all 0.2s; margin-top: 0 !important; width: auto !important;">
              <i class="fa-regular fa-user"></i> Profile
            </a>
            <button data-action="logout" onclick="logout()" class="btn-outline-red" style="flex: 1 !important; font-size: 0.8rem; padding: 8px 10px; border-radius: var(--radius-sm); font-weight: 600; display: inline-flex; align-items: center; justify-content: center; gap: 6px; cursor: pointer; border: 1px solid var(--danger); transition: all 0.2s; margin-top: 0 !important; width: auto !important;">
              <i class="fa-solid fa-right-from-bracket"></i> Logout
            </button>
          </div>
        </div>
      `;
    }

    const studentCard = document.querySelector(".student-card");
    const teacherCard = document.querySelector(".teacher-card");
    const hostelCard = document.querySelector(".hostel-card");
    const wardenCard = document.querySelector(".warden-card");

    // Hide all by default for logged-in users, then show specific ones
    [studentCard, teacherCard, hostelCard, wardenCard].forEach((c) => {
      if (c) c.style.display = "none";
    });

    if (role === "student") {
      if (studentCard) studentCard.style.display = "flex";
    } else if (role === "teacher") {
      if (teacherCard) teacherCard.style.display = "flex";
    } else if (role === "hosteler") {
      if (studentCard) studentCard.style.display = "flex";
      if (hostelCard) hostelCard.style.display = "flex";
    } else if (role === "warden") {
      if (wardenCard) wardenCard.style.display = "flex";
    } else if (
      role === "hod" ||
      role === "dean" ||
      role === "principal" ||
      role === "principal"
    ) {
      if (teacherCard) teacherCard.style.display = "flex";
    } else if (role === "admin") {
      if (studentCard) studentCard.style.display = "flex";
      if (teacherCard) teacherCard.style.display = "flex";
      if (hostelCard) hostelCard.style.display = "flex";
      if (wardenCard) wardenCard.style.display = "flex";
    }
  } else {
    // User is Guest
    if (loginBtn) loginBtn.style.display = "block";
    if (userProfile) userProfile.style.display = "none";

    // Guests see all cards but will be prompted to login when clicking
    const cards = document.querySelectorAll(".module-card");
    cards.forEach((c) => (c.style.display = "flex"));
  }
};

function goToDashboard() {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
        const path = window.location.pathname;
        const subDirs = ['/student/', '/teacher/', '/hostel/', '/hosteler/', '/warden/', '/principal/', '/hod/', '/dean/', '/complaints/'];
        const isSub = subDirs.some(dir => path.includes(dir));
        window.location.href = isSub ? '../login.html' : 'login.html';
        return;
    }
    const user = JSON.parse(userStr);
    const role = (user.role || '').toLowerCase();
    const path = window.location.pathname;
    const subDirs = ['/student/', '/teacher/', '/hostel/', '/hosteler/', '/warden/', '/principal/', '/hod/', '/dean/', '/complaints/'];
    const isSub = subDirs.some(dir => path.includes(dir));
    const base = isSub ? '../' : '';

    if (role === 'student') window.location.href = base + 'student/index.html';
    else if (role === 'warden') window.location.href = base + 'warden/index.html';
    else if (role === 'principal') window.location.href = base + 'principal/index.html';
    else if (role === 'dean') window.location.href = base + 'dean/index.html';
    else if (role === 'hod') window.location.href = base + 'hod/index.html';
    else if (role === 'teacher') window.location.href = base + 'teacher/index.html';
    else if (role === 'hosteler') window.location.href = base + 'hostel/index.html';
    else window.location.href = base + 'index.html';
}

function toggleProfileMenu() {
  const menu = document.getElementById("profileMenu");
  if (menu.style.display === "flex" || menu.style.display === "block") {
    menu.style.display = "none";
  } else {
    menu.style.display = "block";
  }
}

// Close menu when clicking outside
window.addEventListener("click", (e) => {
  const menu = document.getElementById("profileMenu");
  const avatar = document.getElementById("userAvatar");
  const profile = document.getElementById("userProfile");
  if (
    menu &&
    (menu.style.display === "flex" || menu.style.display === "block") &&
    e.target !== menu &&
    e.target !== avatar &&
    !menu.contains(e.target) &&
    !profile?.contains(e.target)
  ) {
    menu.style.display = "none";
  }
});

function goToModule(roleKey) {
  const map = {
    student: "student/index.html",
    teacher: "teacher/index.html",
    hod: "hod/index.html",
    dean: "dean/index.html",
    principal: "principal/index.html",
    warden: "warden/index.html",
    hosteler: "modules/complaints/post.html",
    admin: "student/index.html",
  };
  const path = map[roleKey];
  if (path) window.location.href = path;
}

function logout() {
  localStorage.clear();

  // Determine path to home based on current location
  const path = window.location.pathname;
  let redirect = "index.html";

  if (
    path.includes("/student/") ||
    path.includes("/teacher/") ||
    path.includes("/hostel/") ||
    path.includes("/hosteler/") ||
    path.includes("/warden/") ||
    path.includes("/principal/") ||
    path.includes("/hod/") ||
    path.includes("/dean/") ||
    path.includes("/complaints/") ||
    path.includes("/notices/")
  ) {
    redirect = "../index.html";
  }

  window.location.href = redirect;
}

// Robust global export to prevent sub-script overrides
window.logout = logout;
document.addEventListener("DOMContentLoaded", () => {
  window.logout = logout;
  // Use a small timeout to re-assert in case sub-scripts loaded after DOMContentLoaded
  setTimeout(() => {
    window.logout = logout;
  }, 100);
  setTimeout(() => {
    window.logout = logout;
  }, 500);
});
