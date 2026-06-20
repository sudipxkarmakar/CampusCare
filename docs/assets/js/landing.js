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

// Reusable Detail Popup Modal
window.showDetailPopup = function(title, subtitle, content, dateText, category) {
  let modal = document.getElementById('landing-detail-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'landing-detail-modal';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); z-index: 9999; display: flex; justify-content: center; align-items: center; backdrop-filter: blur(8px); opacity: 0; pointer-events: none; transition: opacity 0.3s ease;';
    
    const contentBox = document.createElement('div');
    contentBox.style.cssText = 'background: white; padding: 32px; border-radius: 24px; max-width: 550px; width: 90%; position: relative; box-shadow: 0 20px 40px rgba(0,0,0,0.15); border: 1px solid var(--border-color); transform: scale(0.9); transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); max-height: 85vh; overflow-y: auto; text-align: left;';
    contentBox.id = 'landing-detail-modal-content';
    
    modal.appendChild(contentBox);
    document.body.appendChild(modal);
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) window.closeDetailPopup();
    });
    
    // Add escape key handler
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') window.closeDetailPopup();
    });
  }
  
  const contentBox = document.getElementById('landing-detail-modal-content');
  contentBox.innerHTML = `
    <button data-action="closeDetailPopup" aria-label="Close details" style="position: absolute; top: 20px; right: 20px; background: rgba(0,0,0,0.05); border: none; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; cursor: pointer; color: var(--text-dark); transition: background 0.2s;"><i class="fa-solid fa-xmark"></i></button>
    <div style="display: flex; flex-direction: column; gap: 16px;">
      <div>
        <span style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; color: var(--primary); background: rgba(107, 70, 193, 0.1); padding: 4px 10px; border-radius: 20px;">${category || 'Update'}</span>
        ${dateText ? `<span style="font-size: 0.8rem; color: var(--text-muted); margin-left: 8px;">${dateText}</span>` : ''}
      </div>
      <div>
        <h2 style="font-size: 1.6rem; font-weight: 700; color: var(--text-dark); margin: 0; line-height: 1.3;">${title}</h2>
        ${subtitle ? `<p style="font-size: 1rem; color: var(--text-muted); margin: 4px 0 0 0; font-weight: 500;">${subtitle}</p>` : ''}
      </div>
      <div style="border-top: 1px solid var(--border-color); padding-top: 16px; margin-top: 8px;">
        <p style="font-size: 1rem; line-height: 1.6; color: var(--text-dark); margin: 0; white-space: pre-wrap;">${content}</p>
      </div>
    </div>
  `;
  
  modal.style.opacity = '1';
  modal.style.pointerEvents = 'auto';
  setTimeout(() => {
    contentBox.style.transform = 'scale(1)';
  }, 10);
};

window.closeDetailPopup = function() {
  const modal = document.getElementById('landing-detail-modal');
  if (modal) {
    modal.style.opacity = '0';
    modal.style.pointerEvents = 'none';
    const contentBox = document.getElementById('landing-detail-modal-content');
    if (contentBox) contentBox.style.transform = 'scale(0.9)';
  }
};

// Global Click Handler for CSP Compliance
document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-action], [data-alert]");
  if (!el) return;

  const action = el.dataset.action;
  const id = el.dataset.id;
  const alertMsg = el.dataset.alert;
  const url = el.dataset.url;

  if (alertMsg && !action) {
    const parts = alertMsg.split('\n\n');
    const title = parts[0] || 'Notice';
    const content = parts.slice(1).join('\n\n') || '';
    window.showDetailPopup(title, '', content, '', 'Campus Notice');
    return;
  }

  switch (action) {
    case "showAchievement":
      if (window.loadedAchievements) {
        const ach = window.loadedAchievements.find(a => a._id === id);
        if (ach) {
          const catName = ach.category ? ach.category.toUpperCase() : 'ACHIEVEMENT';
          const dateStr = ach.createdAt ? new Date(ach.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
          window.showDetailPopup(ach.title, ach.subtitle || '', ach.description, dateStr, catName);
        }
      }
      break;
    case "showNotice":
      if (window.loadedNotices) {
        const notice = window.loadedNotices.find((not, idx) => (not._id === id || idx.toString() === id));
        if (notice) {
          const dateStr = notice.date ? new Date(notice.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
          window.showDetailPopup(notice.title, '', notice.content, dateStr, 'CAMPUS NOTICE');
        }
      }
      break;
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
    case "closeDetailPopup":
      if (typeof window.closeDetailPopup === "function") {
        window.closeDetailPopup();
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
      window.loadedNotices = notices;

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

        const isTruncated = n.content.length > 80;
        const shortContent = isTruncated ? n.content.substring(0, 80) + "..." : n.content;

        html += `
                <div class="notice-item fade-in stagger-${(index % 4) + 1}" data-action="showNotice" data-id="${n._id || index}" style="cursor: pointer;">
                    <div style="${iconStyle} width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; flex-shrink: 0;"><i class="${iconClass}"></i></div>
                    <div class="notice-info" style="min-width: 0; flex: 1;">
                        <h4 style="font-size: 0.95rem; margin-bottom: 4px; color: var(--text-dark);">${n.title}</h4>
                        <p style="font-size: 0.85rem; color: var(--text-muted); margin: 0;">${shortContent}</p>
                    </div>
                    <div class="notice-date" style="font-size: 0.8rem; font-weight: 600; flex-shrink: 0;">${date}</div>
                </div>`;
      });
      noticeContainer.innerHTML = html;
    } catch (error) {
      console.error("API Error, using fallback data:", error);
      // Fallback Data so the UI never looks broken
      const fallbackNotices = [
        {
          title: "Semester Exams",
          content: "Final exams begin from Dec 25th. Check the exam schedule for dates, times, and venue assignments.",
          date: new Date(),
        },
        {
          title: "Campus Wi-Fi Update",
          content: "Maintenance scheduled for Saturday night. All network services will be temporarily unavailable from 11 PM to 2 AM.",
          date: new Date(Date.now() - 86400000),
        },
        {
          title: "Cultural Fest 2025",
          content: "Registration opens next week for all students. Join the various events, competitions, and fun activities.",
          date: new Date(Date.now() - 172800000),
        },
      ];
      window.loadedNotices = fallbackNotices;

      let html = "";
      fallbackNotices.slice(0, 3).forEach((n, index) => {
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

        const isTruncated = n.content.length > 80;
        const shortContent = isTruncated ? n.content.substring(0, 80) + "..." : n.content;

        html += `
                <div class="notice-item" data-action="showNotice" data-id="${index}" style="cursor: pointer;">
                    <div style="${iconStyle} width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; flex-shrink: 0;"><i class="${iconClass}"></i></div>
                    <div class="notice-info" style="min-width: 0; flex: 1;">
                        <h4 style="font-size: 0.95rem; margin-bottom: 4px; color: var(--text-dark);">${n.title}</h4>
                        <p style="font-size: 0.85rem; color: var(--text-muted); margin: 0;">${shortContent}</p>
                    </div>
                    <div class="notice-date" style="font-size: 0.8rem; font-weight: 600; flex-shrink: 0;">${date}</div>
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
        let alumniAutoplayInterval;

        const showAlumniModal = (alumnus) => {
          const existingModal = document.getElementById("alumni-detail-modal");
          if (existingModal) existingModal.remove();

          const name = alumnus.user ? alumnus.user.name : alumnus.name || "Alumni";
          const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;
          const degreeDept = (alumnus.degree && alumnus.department) 
            ? `${alumnus.degree} in ${alumnus.department}`
            : (alumnus.degree || alumnus.department || "N/A");
          const classOf = alumnus.graduationYear ? ` (Class of ${alumnus.graduationYear})` : "";
          const linkedinUrl = alumnus.linkedinProfile || `https://linkedin.com/search/results/people/?keywords=${encodeURIComponent(name)}`;

          const modalHtml = `
            <div id="alumni-detail-modal" style="
              position: fixed;
              top: 0;
              left: 0;
              width: 100vw;
              height: 100vh;
              background: rgba(0, 0, 0, 0.5);
              display: flex;
              align-items: center;
              justify-content: center;
              z-index: 100000;
              backdrop-filter: blur(4px);
            ">
              <div style="
                background: white;
                border-radius: var(--radius-lg);
                width: 90%;
                max-width: 455px;
                padding: 30px;
                position: relative;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25);
                border: 1px solid var(--border-color);
                animation: slideDown 0.3s ease-out;
                text-align: center;
              ">
                <button id="close-alumni-modal-btn" style="
                  position: absolute;
                  top: 15px;
                  right: 15px;
                  background: none;
                  border: none;
                  font-size: 1.5rem;
                  color: var(--text-muted);
                  cursor: pointer;
                  transition: color 0.2s;
                " onmouseenter="this.style.color='var(--danger)'" onmouseleave="this.style.color='var(--text-muted)'">
                  <i class="fa-solid fa-xmark"></i>
                </button>

                <img src="${avatarUrl}" alt="${name}" style="
                  width: 100px;
                  height: 100px;
                  border-radius: 50%;
                  object-fit: cover;
                  margin: 0 auto 16px auto;
                  border: 3px solid var(--primary-light);
                " />

                <h3 style="font-size: 1.4rem; font-weight: 700; color: var(--text-dark); margin: 0 0 4px 0;">${name}</h3>
                <p style="font-size: 0.95rem; font-weight: 600; color: var(--primary); margin: 0 0 12px 0;">${alumnus.jobTitle} @ ${alumnus.currentCompany}</p>

                <div style="text-align: left; background: var(--bg-color); padding: 16px; border-radius: var(--radius-md); margin-bottom: 20px; font-size: 0.95rem; line-height: 1.6;">
                  <p style="margin: 0 0 8px 0;"><strong><i class="fa-solid fa-graduation-cap" style="width: 20px; color: var(--primary);"></i> Qualification:</strong> ${degreeDept}${classOf}</p>
                  <p style="margin: 0 0 8px 0;"><strong><i class="fa-solid fa-briefcase" style="width: 20px; color: var(--primary);"></i> Current Company:</strong> ${alumnus.currentCompany || 'N/A'}</p>
                  ${alumnus.about ? `<p style="margin: 8px 0 0 0; font-style: italic; border-top: 1px dashed var(--border-color); padding-top: 8px; color: var(--text-muted); font-size: 0.88rem;">"${alumnus.about}"</p>` : ''}
                </div>

                <a href="${linkedinUrl}" target="_blank" rel="noopener" style="
                  display: inline-flex;
                  align-items: center;
                  gap: 8px;
                  background: #0077b5;
                  color: white;
                  padding: 10px 24px;
                  border-radius: var(--radius-full);
                  text-decoration: none;
                  font-weight: 600;
                  font-size: 0.9rem;
                  transition: all 0.3s;
                  box-shadow: 0 4px 12px rgba(0, 119, 181, 0.25);
                " onmouseenter="this.style.background='#005582'; this.style.transform='translateY(-1px)';" onmouseleave="this.style.background='#0077b5'; this.style.transform='none';">
                  <i class="fa-brands fa-linkedin" style="font-size: 1.1rem;"></i> LinkedIn Profile
                </a>
              </div>
            </div>
          `;

          const tempDiv = document.createElement("div");
          tempDiv.innerHTML = modalHtml;
          const modalElement = tempDiv.firstElementChild;
          document.body.appendChild(modalElement);

          const closeModal = () => {
            modalElement.remove();
            document.removeEventListener("keydown", handleKeyDown);
          };

          const handleKeyDown = (e) => {
            if (e.key === "Escape") closeModal();
          };

          modalElement.querySelector("#close-alumni-modal-btn").onclick = closeModal;
          modalElement.onclick = (e) => {
            if (e.target === modalElement) closeModal();
          };
          document.addEventListener("keydown", handleKeyDown);
        };

        const renderActiveAlumni = () => {
          const a = alumni[activeAlumniIndex];
          const name = a.user ? a.user.name : a.name || "Alumni";
          const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&size=100`;

          // Constructing extra details to fill space
          const degreeDept = (a.degree && a.department) 
            ? `${a.degree} in ${a.department}`
            : (a.degree || a.department || "");
          const classOf = a.graduationYear ? ` (Class of ${a.graduationYear})` : "";

          // Programmatically enforce layout wrapper constraints to override caching
          const alumniWrapper = alumniContainer.parentElement;
          if (alumniWrapper) {
            alumniWrapper.style.width = "100%";
            alumniWrapper.style.flex = "1";
            alumniWrapper.style.display = "flex";
            alumniWrapper.style.alignItems = "stretch";
            alumniWrapper.style.marginBottom = "0px";
          }
          if (prevAlumniBtn) prevAlumniBtn.style.alignSelf = "center";
          if (nextAlumniBtn) nextAlumniBtn.style.alignSelf = "center";

          alumniContainer.style.alignSelf = "stretch";
          alumniContainer.style.alignItems = "stretch";
          alumniContainer.style.flex = "1";
          alumniContainer.style.display = "flex";
          alumniContainer.style.height = "100%";

          alumniContainer.innerHTML = `
            <div class="fade-in" style="display: flex; flex-direction: column; align-items: center; justify-content: space-between; background: var(--bg-color); padding: 28px 24px; border-radius: var(--radius-lg); width: 100%; height: 100%; cursor: pointer; transition: all 0.3s; border: 1px solid transparent; flex: 1; box-sizing: border-box;" id="active-alumni-card">
              <img src="${avatarUrl}" class="profile-img" alt="${name}" style="margin: 0; width: 95px; height: 95px; border-radius: 50%; object-fit: cover; border: 3.5px solid var(--primary-light); flex-shrink: 0; box-shadow: var(--shadow-sm);" />
              <div style="text-align: center; width: 100%; display: flex; flex-direction: column; gap: 8px; margin: 16px 0;">
                <h4 class="profile-name" style="font-size: 1.35rem; margin: 0; font-weight: 700; color: var(--text-dark); text-align: center;">${name}</h4>
                <p class="profile-role" style="color: var(--primary); font-weight: 600; font-size: 0.95rem; margin: 0; text-align: center;">${a.jobTitle} @ ${a.currentCompany}</p>
                ${degreeDept ? `
                <div style="background: rgba(255, 255, 255, 0.5); padding: 6px 14px; border-radius: var(--radius-md); margin: 4px auto 0 auto; font-size: 0.85rem; display: inline-block; width: fit-content; text-align: center; border: 1px solid rgba(0,0,0,0.03);">
                  <span style="color: var(--text-muted); font-weight: 500;"><i class="fa-solid fa-graduation-cap" style="color: var(--primary); margin-right: 6px;"></i> ${degreeDept}${classOf}</span>
                </div>
                ` : ""}
              </div>
              <p class="profile-quote" style="margin: 0; font-size: 0.88rem; color: var(--text-muted); font-style: italic; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; border-top: 1px dashed rgba(107, 70, 193, 0.15); padding-top: 12px; text-align: center; width: 100%;">${a.about ? `"${a.about}"` : '"Proud Alumni of CampusCare"'}</p>
            </div>
          `;

          const card = document.getElementById("active-alumni-card");
          if (card) {
            card.onclick = () => showAlumniModal(a);
            card.onmouseenter = () => {
              card.style.transform = 'translateY(-4px)';
              card.style.boxShadow = 'var(--shadow-md)';
              card.style.borderColor = 'rgba(107, 70, 193, 0.2)';
              card.style.background = '#ffffff';
            };
            card.onmouseleave = () => {
              card.style.transform = 'none';
              card.style.boxShadow = 'none';
              card.style.borderColor = 'transparent';
              card.style.background = 'var(--bg-color)';
            };
          }

          // Handle button states if only 1 alumni exists
          if (alumni.length <= 1) {
            if (prevAlumniBtn) prevAlumniBtn.style.display = "none";
            if (nextAlumniBtn) nextAlumniBtn.style.display = "none";
          } else {
            if (prevAlumniBtn) prevAlumniBtn.style.display = "flex";
            if (nextAlumniBtn) nextAlumniBtn.style.display = "flex";
          }
        };

        const startAlumniAutoplay = () => {
          stopAlumniAutoplay();
          alumniAutoplayInterval = setInterval(() => {
            activeAlumniIndex = (activeAlumniIndex + 1) % alumni.length;
            renderActiveAlumni();
          }, 5000);
        };

        const stopAlumniAutoplay = () => {
          if (alumniAutoplayInterval) clearInterval(alumniAutoplayInterval);
        };

        renderActiveAlumni();
        startAlumniAutoplay();

        if (prevAlumniBtn) {
          prevAlumniBtn.onclick = (e) => {
            e.preventDefault();
            activeAlumniIndex = (activeAlumniIndex - 1 + alumni.length) % alumni.length;
            renderActiveAlumni();
            startAlumniAutoplay();
          };
        }
        if (nextAlumniBtn) {
          nextAlumniBtn.onclick = (e) => {
            e.preventDefault();
            activeAlumniIndex = (activeAlumniIndex + 1) % alumni.length;
            renderActiveAlumni();
            startAlumniAutoplay();
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
  const prevLeaderBtn = document.getElementById("prev-leader-btn");
  const nextLeaderBtn = document.getElementById("next-leader-btn");
  if (leadersContainer) {
    try {
      const res = await fetch(`${API_BASE}/api/academic-leaders`);
      if (!res.ok) throw new Error("API Error");
      const leaders = await res.json();

      if (leaders.length === 0) {
        leadersContainer.innerHTML = '<p style="text-align:center; width:100%; color:var(--text-muted);">No academic leaders found.</p>';
        if (prevLeaderBtn) prevLeaderBtn.style.display = "none";
        if (nextLeaderBtn) nextLeaderBtn.style.display = "none";
      } else {
        let activeLeaderIndex = 0;
        let autoplayInterval;

        const showLeaderModal = (leader) => {
          const existingModal = document.getElementById("leader-detail-modal");
          if (existingModal) existingModal.remove();

          const avatarUrl = leader.image 
            ? (leader.image.startsWith("http") ? leader.image : `${API_BASE}${leader.image}`) 
            : `https://ui-avatars.com/api/?name=${encodeURIComponent(leader.name)}&background=random`;

          const modalHtml = `
            <div id="leader-detail-modal" style="
              position: fixed;
              top: 0;
              left: 0;
              width: 100vw;
              height: 100vh;
              background: rgba(0, 0, 0, 0.5);
              display: flex;
              align-items: center;
              justify-content: center;
              z-index: 100000;
              backdrop-filter: blur(4px);
            ">
              <div style="
                background: white;
                border-radius: var(--radius-lg);
                width: 90%;
                max-width: 455px;
                padding: 30px;
                position: relative;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25);
                border: 1px solid var(--border-color);
                animation: slideDown 0.3s ease-out;
                text-align: center;
              ">
                <button id="close-leader-modal-btn" style="
                  position: absolute;
                  top: 15px;
                  right: 15px;
                  background: none;
                  border: none;
                  font-size: 1.5rem;
                  color: var(--text-muted);
                  cursor: pointer;
                  transition: color 0.2s;
                " onmouseenter="this.style.color='var(--danger)'" onmouseleave="this.style.color='var(--text-muted)'">
                  <i class="fa-solid fa-xmark"></i>
                </button>

                <img src="${avatarUrl}" alt="${leader.name}" style="
                  width: 100px;
                  height: 100px;
                  border-radius: 50%;
                  object-fit: cover;
                  margin: 0 auto 16px auto;
                  border: 3px solid var(--primary-light);
                " onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(leader.name)}&background=random'" />

                <h3 style="font-size: 1.4rem; font-weight: 700; color: var(--text-dark); margin: 0 0 4px 0;">${leader.name}</h3>
                <p style="font-size: 0.95rem; font-weight: 600; color: var(--primary); margin: 0 0 12px 0;">${leader.role}${leader.department ? ` (${leader.department})` : ''}</p>

                <div style="text-align: left; background: var(--bg-color); padding: 16px; border-radius: var(--radius-md); margin-bottom: 20px; font-size: 0.95rem; line-height: 1.6;">
                  <p style="margin: 0 0 8px 0;"><strong><i class="fa-solid fa-graduation-cap" style="width: 20px; color: var(--primary);"></i> Qualification:</strong> ${leader.qualification}</p>
                  <p style="margin: 0 0 8px 0;"><strong><i class="fa-solid fa-briefcase" style="width: 20px; color: var(--primary);"></i> Experience:</strong> ${leader.experience || 'N/A'}</p>
                  <p style="margin: 0 0 8px 0;"><strong><i class="fa-solid fa-envelope" style="width: 20px; color: var(--primary);"></i> Email:</strong> <a href="mailto:${leader.email}" style="color: var(--primary); text-decoration: none; font-weight: 500;">${leader.email || 'N/A'}</a></p>
                  ${leader.message ? `<p style="margin: 8px 0 0 0; font-style: italic; border-top: 1px dashed var(--border-color); padding-top: 8px; color: var(--text-muted); font-size: 0.88rem;">"${leader.message}"</p>` : ''}
                </div>

                <a href="https://linkedin.com/search/results/people/?keywords=${encodeURIComponent(leader.name)}" target="_blank" rel="noopener" style="
                  display: inline-flex;
                  align-items: center;
                  gap: 8px;
                  background: #0077b5;
                  color: white;
                  padding: 10px 24px;
                  border-radius: var(--radius-full);
                  text-decoration: none;
                  font-weight: 600;
                  font-size: 0.9rem;
                  transition: all 0.3s;
                  box-shadow: 0 4px 12px rgba(0, 119, 181, 0.25);
                " onmouseenter="this.style.background='#005582'; this.style.transform='translateY(-1px)';" onmouseleave="this.style.background='#0077b5'; this.style.transform='none';">
                  <i class="fa-brands fa-linkedin" style="font-size: 1.1rem;"></i> LinkedIn Profile
                </a>
              </div>
            </div>
          `;

          const tempDiv = document.createElement("div");
          tempDiv.innerHTML = modalHtml;
          const modalElement = tempDiv.firstElementChild;
          document.body.appendChild(modalElement);

          const closeModal = () => {
            modalElement.remove();
            document.removeEventListener("keydown", handleKeyDown);
          };

          const handleKeyDown = (e) => {
            if (e.key === "Escape") closeModal();
          };

          modalElement.querySelector("#close-leader-modal-btn").onclick = closeModal;
          modalElement.onclick = (e) => {
            if (e.target === modalElement) closeModal();
          };
          document.addEventListener("keydown", handleKeyDown);
        };

        const renderActiveLeader = () => {
          const leader = leaders[activeLeaderIndex];
          const avatarUrl = leader.image 
            ? (leader.image.startsWith("http") ? leader.image : `${API_BASE}${leader.image}`) 
            : `https://ui-avatars.com/api/?name=${encodeURIComponent(leader.name)}&background=random`;
          const quote = leader.message ? `"${leader.message}"` : '"Leading with excellence."';
          
          // Programmatically enforce layout wrapper constraints to override caching
          const wrapper = leadersContainer.parentElement;
          if (wrapper) {
            wrapper.style.width = "100%";
            wrapper.style.flex = "1";
            wrapper.style.display = "flex";
            wrapper.style.alignItems = "stretch";
            wrapper.style.marginBottom = "0px";
          }
          if (prevLeaderBtn) prevLeaderBtn.style.alignSelf = "center";
          if (nextLeaderBtn) nextLeaderBtn.style.alignSelf = "center";

          leadersContainer.style.alignSelf = "stretch";
          leadersContainer.style.alignItems = "stretch";
          leadersContainer.style.flex = "1";
          leadersContainer.style.display = "flex";
          leadersContainer.style.height = "100%";

          leadersContainer.innerHTML = `
            <div class="fade-in" style="display: flex; flex-direction: column; align-items: center; justify-content: space-between; background: var(--bg-color); padding: 28px 24px; border-radius: var(--radius-lg); width: 100%; height: 100%; cursor: pointer; transition: all 0.3s; border: 1px solid transparent; flex: 1; box-sizing: border-box;" id="active-leader-card">
              <img src="${avatarUrl}" class="profile-img" alt="${leader.name}" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(leader.name)}&background=random'" style="margin: 0; width: 95px; height: 95px; border-radius: 50%; object-fit: cover; border: 3.5px solid var(--primary-light); flex-shrink: 0; box-shadow: var(--shadow-sm);" />
              <div style="text-align: center; width: 100%; display: flex; flex-direction: column; gap: 8px; margin: 16px 0;">
                <h4 class="profile-name" style="font-size: 1.35rem; margin: 0; font-weight: 700; color: var(--text-dark); text-align: center;">${leader.name}</h4>
                <p class="profile-role" style="color: var(--primary); font-weight: 600; font-size: 0.95rem; margin: 0; text-align: center;">${leader.role}${leader.department ? ` (${leader.department})` : ''}</p>
                <div style="background: rgba(255, 255, 255, 0.5); padding: 6px 14px; border-radius: var(--radius-md); margin: 4px auto 0 auto; font-size: 0.85rem; display: inline-block; width: fit-content; text-align: center; border: 1px solid rgba(0,0,0,0.03);">
                  <span style="color: var(--text-muted); font-weight: 500;"><i class="fa-solid fa-graduation-cap" style="color: var(--primary); margin-right: 6px;"></i> ${leader.qualification}</span>
                </div>
              </div>
              <p class="profile-quote" style="margin: 0; font-size: 0.88rem; color: var(--text-muted); font-style: italic; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; border-top: 1px dashed rgba(107, 70, 193, 0.15); padding-top: 12px; text-align: center; width: 100%;">${quote}</p>
            </div>
          `;

          const card = document.getElementById("active-leader-card");
          if (card) {
            card.onclick = () => showLeaderModal(leader);
            card.onmouseenter = () => {
              card.style.transform = 'translateY(-4px)';
              card.style.boxShadow = 'var(--shadow-md)';
              card.style.borderColor = 'rgba(107, 70, 193, 0.2)';
              card.style.background = '#ffffff';
            };
            card.onmouseleave = () => {
              card.style.transform = 'none';
              card.style.boxShadow = 'none';
              card.style.borderColor = 'transparent';
              card.style.background = 'var(--bg-color)';
            };
          }

          if (leaders.length <= 1) {
            if (prevLeaderBtn) prevLeaderBtn.style.display = "none";
            if (nextLeaderBtn) nextLeaderBtn.style.display = "none";
          } else {
            if (prevLeaderBtn) prevLeaderBtn.style.display = "flex";
            if (nextLeaderBtn) nextLeaderBtn.style.display = "flex";
          }
        };

        const startAutoplay = () => {
          stopAutoplay();
          autoplayInterval = setInterval(() => {
            activeLeaderIndex = (activeLeaderIndex + 1) % leaders.length;
            renderActiveLeader();
          }, 5000);
        };

        const stopAutoplay = () => {
          if (autoplayInterval) clearInterval(autoplayInterval);
        };

        renderActiveLeader();
        startAutoplay();

        if (prevLeaderBtn) {
          prevLeaderBtn.onclick = (e) => {
            e.preventDefault();
            activeLeaderIndex = (activeLeaderIndex - 1 + leaders.length) % leaders.length;
            renderActiveLeader();
            startAutoplay();
          };
        }
        if (nextLeaderBtn) {
          nextLeaderBtn.onclick = (e) => {
            e.preventDefault();
            activeLeaderIndex = (activeLeaderIndex + 1) % leaders.length;
            renderActiveLeader();
            startAutoplay();
          };
        }
      }
    } catch (error) {
      console.error("Academic Leaders API Error:", error);
      leadersContainer.innerHTML = '<p style="text-align:center; width:100%; color:red;">Failed to load academic leaders.</p>';
      if (prevLeaderBtn) prevLeaderBtn.style.display = "none";
      if (nextLeaderBtn) nextLeaderBtn.style.display = "none";
    }
  }

  // Load Achievements
  const achievementsContainer = document.getElementById("achievements-list");
  if (achievementsContainer) {
    try {
      const res = await fetch(`${API_BASE}/api/achievements`);
      if (!res.ok) throw new Error("API Error");
      const achievements = await res.json();
      window.loadedAchievements = achievements;

      if (achievements.length === 0) {
        achievementsContainer.innerHTML = '<p style="text-align:center; width:100%; color:var(--text-muted);">No achievements found.</p>';
      } else {
        // Sort achievements: priority ascending, then createdAt descending
        achievements.sort((a, b) => {
          if ((a.priority || 10) !== (b.priority || 10)) {
            return (a.priority || 10) - (b.priority || 10);
          }
          return new Date(b.createdAt) - new Date(a.createdAt);
        });

        const categoryMeta = {
          academic:  { icon: 'fa-book-open', color: '#4f46e5', bg: '#e0e7ff' },
          sports:    { icon: 'fa-person-running', color: '#ea580c', bg: '#ffedd5' },
          research:  { icon: 'fa-flask', color: '#7c3aed', bg: '#ede9fe' },
          cultural:  { icon: 'fa-masks-theater', color: '#db2777', bg: '#fce7f3' },
          placement: { icon: 'fa-briefcase', color: '#0369a1', bg: '#e0f2fe' },
          award:     { icon: 'fa-award', color: '#d97706', bg: '#fef3c7' },
          other:     { icon: 'fa-star', color: '#475569', bg: '#f1f5f9' },
        };

        let html = "";
        // Show up to 3 achievements on the landing page
        const displayAchievements = achievements.slice(0, 3);
        displayAchievements.forEach((ach) => {
          const cat = (ach.category || 'other').toLowerCase();
          const meta = categoryMeta[cat] || categoryMeta.other;
          
          html += `
            <div data-action="showAchievement" data-id="${ach._id}" style="display: flex; align-items: center; gap: 16px; padding: 16px; background: ${meta.bg}; border-radius: var(--radius-md); cursor: pointer; transition: transform 0.2s, box-shadow 0.2s;">
              <div style="font-size: 2rem; color: ${meta.color}">
                <i class="fa-solid ${meta.icon}"></i>
              </div>
              <div style="flex: 1; min-width: 0;">
                <h4 style="margin: 0; font-size: 1.05rem; font-weight: 700; color: var(--text-dark);">${ach.title}</h4>
                <p style="margin: 4px 0 0 0; font-size: 0.85rem; color: ${meta.color}; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis;">${ach.description}</p>
              </div>
            </div>
          `;
        });
        achievementsContainer.innerHTML = html;
      }
    } catch (error) {
      console.error("Achievements API Error, using fallback:", error);
      // Fallback if API fails
      const fallbackAchievements = [
        {
          _id: "fb_ach1",
          title: "Top 10 Engineering College",
          description: "Our institution was proudly ranked in the top 10 engineering colleges nationally by the National Education Board of 2025. This achievement reflects our strong curriculum, outstanding research infrastructure, stellar placements, and high quality of student life.",
          category: "award",
        },
        {
          _id: "fb_ach2",
          title: "Green Campus Award",
          description: "Recognized for sustainable green initiatives and environment preservation schemes by the State Department of Forestry and Environment. We successfully integrated solar energy and implemented zero-waste waste management protocols.",
          category: "sports",
        },
        {
          _id: "fb_ach3",
          title: "Innovation Hub Grant",
          description: "Received a prestigious federal grant of $50,000 for building a world-class Robotics and Autonomous Systems research laboratory. The lab will provide state-of-the-art developer boards, robotic arms, and testing environments.",
          category: "research",
        }
      ];
      window.loadedAchievements = fallbackAchievements;

      let html = "";
      fallbackAchievements.forEach((ach) => {
        const cat = ach.category;
        const meta = {
          sports:    { icon: 'fa-leaf', color: '#10b981', bg: '#d1fae5' },
          research:  { icon: 'fa-microchip', color: '#4f46e5', bg: '#e0e7ff' },
          award:     { icon: 'fa-ranking-star', color: '#f59e0b', bg: '#fef3c7' },
        }[cat] || { icon: 'fa-star', color: '#475569', bg: '#f1f5f9' };

        html += `
          <div data-action="showAchievement" data-id="${ach._id}" style="display: flex; align-items: center; gap: 16px; padding: 16px; background: ${meta.bg}; border-radius: var(--radius-md); cursor: pointer; transition: transform 0.2s, box-shadow 0.2s;">
            <div style="font-size: 2rem; color: ${meta.color}">
              <i class="fa-solid ${meta.icon}"></i>
            </div>
            <div style="flex: 1; min-width: 0;">
              <h4 style="margin: 0; font-size: 1.05rem; font-weight: 700; color: var(--text-dark);">${ach.title}</h4>
              <p style="margin: 4px 0 0 0; font-size: 0.85rem; color: ${meta.color}; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis;">${ach.description}</p>
            </div>
          </div>
        `;
      });
      achievementsContainer.innerHTML = html;
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

  // Intercepting avatar src is no longer needed since we set it directly below.

  if (userStr) {
    // User is Logged In
    const user = JSON.parse(userStr);
    let designation = "User";
    const role = (user.role || "").toLowerCase();

    if (loginBtn) loginBtn.style.display = "none";

    // Explicitly set flex to override CSS 'display: none' from class
    if (userProfile) userProfile.style.display = "flex";

    if (userProfile) {
      userProfile.style.display = "flex";
      userProfile.style.alignItems = "center";
      userProfile.style.gap = "10px";
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
        designation = `${dept}${yrText}`;
      } else if (role === "teacher" || role === "hod" || role === "warden" || role === "dean" || role === "principal") {
        const roleLabels = {
          teacher: "Faculty",
          hod: "HOD",
          warden: "Hostel Admin",
          dean: "Dean",
          principal: "Principal"
        };
        const label = roleLabels[role] || (role.charAt(0).toUpperCase() + role.slice(1));
        const deptText = user.department ? `, ${user.department}` : "";
        designation = `${label}${deptText}`;
      } else {
        designation = user.role ? (user.role.charAt(0).toUpperCase() + user.role.slice(1)) : "User";
      }

      let displayName = "User";
      if (user.name) displayName = user.name.split(" ")[0];
      else if (user.role)
        displayName = user.role.charAt(0).toUpperCase() + user.role.slice(1);

      let infoDiv = userProfile.querySelector(".user-profile-info");
      if (!infoDiv) {
        infoDiv = document.createElement("div");
        infoDiv.className = "user-profile-info";
        infoDiv.style.cssText = "display: flex; flex-direction: column; text-align: left; justify-content: center;";
      }
      infoDiv.innerHTML = `
        <span id="userName" style="font-weight: 700; font-size: 0.95rem; color: var(--text-dark); margin: 0; line-height: 1.2;">Hi, ${displayName}</span>
        <span id="userRole" style="font-size: 0.75rem; color: var(--text-muted); margin-top: 1px; line-height: 1.2;">${designation}</span>
      `;

      let avatar = userProfile.querySelector("#userAvatar");
      let menu = userProfile.querySelector("#profileMenu");

      Array.from(userProfile.childNodes).forEach(node => {
        if (node !== avatar && node !== menu && node !== infoDiv) {
          userProfile.removeChild(node);
        }
      });

      if (!userProfile.contains(infoDiv)) {
        if (menu) {
          userProfile.insertBefore(infoDiv, menu);
        } else {
          userProfile.appendChild(infoDiv);
        }
      }
    }

    // Role-based Colors
    let roleColor = "10b981"; // Default Green (Teacher/General)

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

    const logoText = document.getElementById("logoText");
    if (logoText) {
      const roleLabel = user.role ? (user.role.toUpperCase() === 'HOD' ? 'HOD' : user.role.charAt(0).toUpperCase() + user.role.slice(1)) : 'Member';
      if (!logoText.querySelector(".logo-role-badge")) {
        logoText.innerHTML = `CampusCare <span class="logo-role-badge" style="font-size: 0.8rem; background: var(--primary); color: white; padding: 4px 10px; border-radius: var(--radius-full); vertical-align: middle; margin-left: 8px;">${roleLabel}</span>`;
      }
    }

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
        // Only show Student badge to go to unified student/hosteler dashboard
        navRoleBadgeWrapper.innerHTML = "";
        navRoleBadgeWrapper.appendChild(makeBadge("Student", "student/index.html", "student"));
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

      let usernameText = user.rollNumber || user.employeeId || user.identifier || "";
      let emailText = user.email || "";

      if (role === "student" || role === "hosteler") {
        let emailLocal = (user.email || "").split("@")[0];
        if (emailLocal) {
          usernameText = emailLocal; // e.g. "it10800222062"
        }
      }

      const colors = badgeColors[role] || { bg: "#ede9fe", color: "#6d28d9" };
      const roleLabel = user.role ? (user.role.toUpperCase() === 'HOD' ? 'HOD' : user.role.charAt(0).toUpperCase() + user.role.slice(1)) : 'Member';

      profileMenu.style.minWidth = "290px";
      profileMenu.style.flexDirection = "column";
      profileMenu.style.padding = "16px";
      profileMenu.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 8px; min-width: 290px; padding: 2px;">
          <!-- Line 1: Header with Badge -->
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border-color); padding-bottom: 8px; margin-bottom: 0;">
            <span style="font-weight: 700; font-size: 0.95rem; color: var(--text-dark);">Account Details</span>
            <span class="role-badge-mini" style="text-transform: uppercase; font-size: 0.7rem; font-weight: 700; padding: 4px 12px; border-radius: var(--radius-full); background: ${colors.bg}; color: ${colors.color};">${(user.role || "User").toUpperCase()}</span>
          </div>
          
          <div id="userDetails" style="display: flex; align-items: baseline; gap: 8px; text-align: left; width: 100%; padding: 4px 0; box-sizing: border-box;">
            <span style="font-weight: 700; font-size: 1rem; color: var(--text-dark);">${user.name || "User"}</span>
            <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600;">(ID: ${user.rollNumber || user.employeeId || user.identifier || "--"})</span>
          </div>

          <!-- Line 3: Actions -->
          <div style="display: flex; gap: 8px; margin-top: 2px; border-top: 1px solid var(--border-color); padding-top: 10px;">
            <a href="${profilePath}" class="btn-outline-purple" style="flex: 1 !important; text-align: center; font-size: 0.85rem; padding: 10px 12px; text-decoration: none; border-radius: var(--radius-md); font-weight: 600; display: inline-flex; align-items: center; justify-content: center; gap: 6px; transition: all 0.2s; border: 1.5px solid var(--primary); color: var(--primary); background: transparent; cursor: pointer; margin-top: 0 !important; width: auto !important;" onmouseenter="this.style.background='rgba(107, 70, 193, 0.08)';" onmouseleave="this.style.background='transparent';">
              <i class="fa-regular fa-user"></i> Profile
            </a>
            <button data-action="logout" onclick="logout()" style="flex: 1 !important; font-size: 0.85rem; padding: 10px 12px; border-radius: var(--radius-md); font-weight: 600; display: inline-flex; align-items: center; justify-content: center; gap: 6px; cursor: pointer; border: none; background: #ef4444; color: white; transition: all 0.2s; margin-top: 0 !important; width: auto !important;" onmouseenter="this.style.background='#dc2626'; this.style.transform='translateY(-0.5px)';" onmouseleave="this.style.background='#ef4444'; this.style.transform='none';">
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
    else if (role === 'hosteler') window.location.href = base + 'student/index.html';
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
