// Student Dashboard Logic v1.0
let allMyComplaints = [];
let showHistory = false;

const baseUrl = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://127.0.0.1:8080'
    : 'https://complaint-backend-5rdk.onrender.com';

// --- INITIALIZATION ---
async function initDashboard() {
    const email = sessionStorage.getItem("userEmail");
    if (!email) {
        window.location.href = "login-v2.html";
        return;
    }

    // Set Initial Identity
    const initial = email.charAt(0).toUpperCase();

    // Select Elements explicitly to avoid ReferenceErrors
    const navEmail = document.getElementById("nav-email");
    const navAvatar = document.getElementById("nav-avatar");
    const navName = document.getElementById("nav-name");
    const sideEmail = document.getElementById("sidebar-email");
    const sideAvatar = document.getElementById("sidebar-avatar");
    const sideName = document.getElementById("sidebar-name");
    const identLink = document.getElementById("sidebar-ident-link");

    if (navEmail) navEmail.innerText = email;
    if (navAvatar) navAvatar.innerText = initial;
    if (sideEmail) sideEmail.innerText = email;
    if (sideAvatar) sideAvatar.innerText = initial;
    if (identLink) {
        identLink.href = "profile.html";
        identLink.style.cursor = "pointer";
    }

    try {
        // Show Skeletons while loading
        UI.showStatSkeletons(['stat-total', 'stat-active', 'stat-resolved']);
        UI.showTableSkeletons("complaint-container", 5);

        const res = await fetch(`${baseUrl}/api/v1/profile`, {
            headers: { "User-Email": email }
        });

        if (res.ok) {
            const data = await res.json();
            if (navName) navName.innerText = data.name || email.split('@')[0];
            if (sideName) sideName.innerText = data.name || email.split('@')[0];
            if (sideEmail) sideEmail.innerText = data.email;
            if (data.profilePictureUrl) {
                const avatarUrl = `${baseUrl}${data.profilePictureUrl}`;
                if (navAvatar) { navAvatar.innerText = ""; navAvatar.style.backgroundImage = `url('${avatarUrl}')`; navAvatar.style.backgroundSize = "cover"; }
                if (sideAvatar) { sideAvatar.innerText = ""; sideAvatar.style.backgroundImage = `url('${avatarUrl}')`; sideAvatar.style.backgroundSize = "cover"; }
            }
        }

        const compRes = await fetch(`${baseUrl}/api/v1/complaints/student/my-complaints`, {
            headers: { "User-Email": email }
        });

        if (!compRes.ok) throw new Error("Server error: " + compRes.status);

        allMyComplaints = await compRes.json();
        renderComplaints();

    } catch (err) {
        console.error("Dashboard Init Error:", err);
        const container = document.getElementById("complaint-container");
        if (container) container.innerHTML = `<div class="card" style="padding:40px; text-align:center; color:var(--error);">Failed to sync with system. Check connection.</div>`;
    }
}

function toggleHistory() {
    showHistory = document.getElementById("historyToggle").checked;
    renderComplaints();
}

function renderComplaints() {
    const container = document.getElementById("complaint-container");
    if (!container) return;
    container.innerHTML = "";

    // Update Stats
    const statsTotal = document.getElementById("stat-total");
    const statsActive = document.getElementById("stat-active");
    const statsResolved = document.getElementById("stat-resolved");

    if (statsTotal) statsTotal.innerText = allMyComplaints.length;
    if (statsActive) statsActive.innerText = allMyComplaints.filter(c => ['PENDING', 'ASSIGNED', 'IN_PROGRESS'].includes(c.status)).length;
    if (statsResolved) statsResolved.innerText = allMyComplaints.filter(c => ['RESOLVED', 'CLOSED'].includes(c.status)).length;

    if (allMyComplaints.length === 0) {
        container.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 60px; color: var(--text-muted); font-family:'Outfit';">No complaints raised yet. Use "Report Issue" to get started! ✍️</td></tr>`;
        return;
    }

    const priorityWeight = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
    const sorted = [...allMyComplaints].sort((a, b) => {
        const pA = priorityWeight[a.priority] || 1;
        const pB = priorityWeight[b.priority] || 1;
        if (pB !== pA) return pB - pA;
        return new Date(b.createdAt) - new Date(a.createdAt);
    });

    sorted.forEach(c => {
        const lastUpdate = new Date(c.updatedAt || c.createdAt);
        const hoursDiff = (new Date() - lastUpdate) / (1000 * 60 * 60);
        if (c.status === 'CLOSED' && hoursDiff >= 24 && !showHistory) return;

        let actionArea = "";
        if (c.status === 'RESOLVED') {
            actionArea = `<button class="btn-primary" style="padding: 8px 16px; font-size: 11px; background: var(--success); border-radius: 8px; white-space: nowrap;" onclick="closeComplaint(${c.id})">Confirm & Close</button>`;
        } else if (c.status === 'CLOSED') {
            actionArea = `<span style="color:var(--text-muted); font-size: 11px; font-weight:700; white-space: nowrap; display: flex; align-items: center; gap: 4px;"><i class="fa-solid fa-check-double"></i> Ticket Closed</span>`;
        } else {
            actionArea = `<span style="color:var(--primary); font-size: 11px; font-weight:600; white-space: nowrap; display: flex; align-items: center; gap: 4px;"><i class="fa-solid fa-spinner fa-spin"></i> In Review</span>`;
        }

        const priorityClass = c.priority === 'HIGH' ? 'priority-high' : c.priority === 'MEDIUM' ? 'priority-medium' : 'priority-low';

        // Media Support
        const mediaIcon = c.imageUrl ? `<i class="fa-solid fa-paperclip" title="Evidence Attached" style="margin-left:8px; color:var(--primary); cursor:pointer;" onclick="window.open('${baseUrl}${c.imageUrl}')"></i>` : "";

        const row = document.createElement("tr");
        row.className = "complaint-row";
        row.innerHTML = `
            <td style="padding-left: 24px; font-weight:700; color: var(--text-muted); font-size: 13px;">#${c.id}</td>
            <td>
                <div style="font-weight: 700; color: var(--text-strong); font-size: 14px;">${c.title}${mediaIcon}</div>
                <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px; max-width: 380px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${c.description}</div>
            </td>
            <td>
                <div style="display: flex; flex-direction: column; gap: 4px;">
                    <span class="category-tag" style="background: var(--surface); color: var(--text-strong); padding: 4px 10px; border-radius: 6px; font-size: 10px; font-weight: 800; border: 1px solid var(--border);">${c.category && c.category.name ? c.category.name : 'UNASSIGNED'}</span>
                    <span class="${priorityClass}" style="font-size: 10px; font-weight: 700;">● ${c.priority || 'LOW'} Priority</span>
                </div>
            </td>
            <td><span class="badge ${c.status === 'RESOLVED' ? 'badge-green' : c.status === 'CLOSED' ? 'badge-slate' : 'badge-amber'}" style="font-size: 10px; padding: 4px 10px;">${c.status}</span></td>
            <td style="padding-right: 24px; text-align: right;">
                <div style="display: flex; gap: 12px; align-items: center; justify-content: flex-end;">
                    <div id="ops-${c.id}">${actionArea}</div>
                    <button class="btn-ghost" style="padding: 8px; font-size: 12px;" onclick="toggleComments(${c.id})" title="Discussion">
                        <i class="fa-solid fa-comments"></i>
                    </button>
                </div>
                <!-- Chatbox for Student Table View -->
                <div id="chatbox-${c.id}" class="chat-container" style="display:none; position: fixed; bottom: 80px; right: 30px; width: 320px; height: 400px; box-shadow: var(--shadow-lg); z-index: 2000; border-radius: 20px; flex-direction: column; background: var(--surface);">
                     <div style="background: var(--primary); color: white; padding: 16px; border-radius: 20px 20px 0 0; display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-weight: 800; font-family:'Outfit'; font-size:14px;">Ticket Chat: #${c.id}</span>
                        <i class="fa-solid fa-xmark" style="cursor: pointer;" onclick="toggleComments(${c.id})"></i>
                     </div>
                     <div id="chat-messages-${c.id}" class="chat-messages" style="flex:1; padding:16px; overflow-y:auto; background: var(--bg-body);"></div>
                     <div class="chat-input-area" style="padding: 12px; border-top: 1px solid var(--border); background: var(--surface);">
                        <input type="text" id="chat-input-${c.id}" class="chat-input" placeholder="Type a message..." style="font-size: 12px;" onkeypress="if(event.key==='Enter') postComment(${c.id})">
                     </div>
                </div>
            </td>
        `;
        container.appendChild(row);
    });
}

function filterComplaints() {
    const q = document.querySelector(".search-bar input").value.toLowerCase();
    const rows = document.querySelectorAll(".complaint-row");
    rows.forEach(r => {
        const match = r.innerText.toLowerCase().includes(q);
        r.style.display = match ? "" : "none";
    });
}

// --- COMMENTS & ACTIONS ---
async function toggleComments(id) {
    const chatbox = document.getElementById(`chatbox-${id}`);
    if (!chatbox) return;
    const isOpening = chatbox.style.display !== "flex";
    chatbox.style.display = isOpening ? "flex" : "none";
    if (isOpening) await fetchComments(id);
}

async function fetchComments(id) {
    const container = document.getElementById(`chat-messages-${id}`);
    if (container) container.innerHTML = `<div class="skeleton skeleton-card" style="height: 60px; border-radius: 12px; margin-bottom: 12px;"></div>`.repeat(3);
    try {
        const res = await fetch(`${baseUrl}/api/v1/comments/${id}`);
        const comments = await res.json();
        container.innerHTML = comments.map(c => `
            <div class="chat-message">
                <div class="chat-bubble">
                    <div class="chat-bubble-header">
                        <span class="chat-sender-name">${c.senderName} <small>(${c.senderRole})</small></span>
                        <span class="chat-time">${new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div>${c.text}</div>
                </div>
            </div>
        `).join('') || '<p style="font-size:12px; opacity:0.5; text-align:center;">No messages yet.</p>';
        container.scrollTop = container.scrollHeight;
    } catch (e) { console.error(e); }
}

async function postComment(id) {
    const input = document.getElementById(`chat-input-${id}`);
    const text = input.value.trim();
    if (!text) return;

    try {
        const res = await fetch(`${baseUrl}/api/v1/comments/${id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'User-Email': sessionStorage.getItem("userEmail") },
            body: JSON.stringify({ text })
        });
        if (res.ok) { input.value = ""; await fetchComments(id); }
    } catch (e) { console.error(e); }
}

async function closeComplaint(id) {
    if (!confirm("Is this issue properly resolved?")) return;
    try {
        const res = await fetch(`${baseUrl}/api/student/close/${id}`, {
            method: 'PATCH',
            headers: { "User-Email": sessionStorage.getItem("userEmail") }
        });
        if (res.ok) { alert("Ticket Closed! ✅"); initDashboard(); }
    } catch (e) { console.error(e); }
}

function logout() {
    sessionStorage.clear();
    window.location.href = "login-v2.html";
}

document.addEventListener("DOMContentLoaded", () => {
    initDashboard();
});
