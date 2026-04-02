// Staff Dashboard Logic v1.0
let allStaffComplaints = [];

const baseUrl = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://127.0.0.1:8080'
    : 'https://complaint-backend-5rdk.onrender.com';

// --- INITIALIZATION ---
async function initStaff() {
    const email = sessionStorage.getItem("email");
    if (!email) {
        window.location.href = "login-v2.html";
        return;
    }

    // Set Identity in Sidebar & Navbar
    const navEmail = document.getElementById("nav-email");
    const sideEmail = document.getElementById("sidebar-email");
    const sideAvatar = document.getElementById("sidebar-avatar");
    const identLink = document.getElementById("nav-identity");

    const initial = email.charAt(0).toUpperCase();
    if (navEmail) navEmail.innerText = email;
    if (sideEmail) sideEmail.innerText = email;
    if (sideAvatar) sideAvatar.innerText = initial;
    if (identLink) {
        identLink.href = "profile.html";
        identLink.style.cursor = "pointer";
    }

    try {
        // FETCHING DATA
        UI.showStatSkeletons(['stat-total', 'stat-progress', 'stat-completed']);
        UI.showTableSkeletons("staff-container", 5);

        const res = await fetch(`${baseUrl}/api/v1/complaints/staff/assigned`, {
            headers: { 
                "User-Email": email
            }
        });

        if (!res.ok) throw new Error("Server Error: " + res.status);

        allStaffComplaints = await res.json();
        renderStaffTasks();

        // Also fetch profile for Identity section
        fetchStaffProfile(email);

    } catch (err) {
        console.error(err);
        const container = document.getElementById("staff-container");
        if (container) container.innerHTML = `<div class="card" style="padding:40px; text-align:center; color:var(--error);">Failed to fetch assigned tasks.</div>`;
    }
}

async function fetchStaffProfile(email) {
    try {
        const res = await fetch(`${baseUrl}/api/v1/profile`, {
            headers: { 
                "User-Email": sessionStorage.getItem("email")
            }
        });
        if (res.ok) {
            const data = await res.json();
            const nameEl = document.getElementById("ident-name");
            const emailEl = document.getElementById("ident-email");
            const roleEl = document.getElementById("ident-role");
            const deptEl = document.getElementById("ident-dept");
            const avatarEl = document.getElementById("ident-avatar-large");
            const sideName = document.getElementById("sidebar-name");

            if (nameEl) nameEl.innerText = data.name;
            if (emailEl) emailEl.innerText = data.email;
            if (roleEl) roleEl.innerText = data.role === 'STAFF' ? 'OFFICIAL STAFF' : data.role;
            if (deptEl) deptEl.innerText = data.department || "GENERAL OPERATIONS";
            if (avatarEl) avatarEl.innerText = data.name ? data.name.charAt(0).toUpperCase() : email.charAt(0).toUpperCase();
            if (sideName) sideName.innerText = data.name || email.split('@')[0];
            if (sideEmail) sideEmail.innerText = email;
            if (data.profilePictureUrl) {
                const avatarUrl = `url('${baseUrl}${data.profilePictureUrl}')`;
                if (sideAvatar) { sideAvatar.innerText = ""; sideAvatar.style.backgroundImage = avatarUrl; sideAvatar.style.backgroundSize = "cover"; }
            }
        }
    } catch (err) { console.error("Profile fetch error:", err); }
}

function renderStaffTasks() {
    const container = document.getElementById("staff-container");
    if (!container) return;
    container.innerHTML = "";

    const today = new Date().toISOString().split('T')[0];

    // Helper to map backend status to Staff Workflow
    const getWorkflowStatus = (s) => {
        if (!s) return 'ASSIGNED';
        const status = s.toUpperCase();
        if (['ASSIGNED', 'PENDING', 'OPEN', 'BACKLOG'].includes(status)) return 'ASSIGNED';
        if (['IN_PROGRESS', 'ACTIVE', 'WORKING'].includes(status)) return 'IN_PROGRESS';
        if (['RESOLVED', 'CLOSED', 'COMPLETED', 'PENDING_REVIEW'].includes(status)) return 'RESOLVED';
        return 'ASSIGNED'; // Default
    };

    // Calculate Real Stats based on MAPPED workflow
    const assignedCount = allStaffComplaints.filter(c => getWorkflowStatus(c.status) === 'ASSIGNED').length;
    const progressCount = allStaffComplaints.filter(c => getWorkflowStatus(c.status) === 'IN_PROGRESS').length;
    const resolvedTodayCount = allStaffComplaints.filter(c => {
        const wStatus = getWorkflowStatus(c.status);
        const updateDate = (c.updatedAt || c.createdAt).split('T')[0];
        return wStatus === 'RESOLVED' && updateDate === today;
    }).length;

    // Update Top Stats
    document.getElementById("stat-total").innerText = assignedCount;
    document.getElementById("stat-progress").innerText = progressCount;
    document.getElementById("stat-completed").innerText = resolvedTodayCount;

    if (allStaffComplaints.length === 0) {
        container.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 100px 0; color: var(--text-muted); font-family:'Outfit';">No active tasks. Your queue is clear! ⛱️</td></tr>`;
        return;
    }

    const sorted = [...allStaffComplaints].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    sorted.forEach(c => {
        let actionArea = "";
        let statusBadge = "";
        const wStatus = getWorkflowStatus(c.status);

        if (wStatus === 'ASSIGNED') {
            statusBadge = `<span class="badge" style="background:rgba(148, 163, 184, 0.1); color:#94a3b8; border:1px solid rgba(148, 163, 184, 0.2);">ASSIGNED</span>`;
            actionArea = `<button class="btn-primary" style="height:38px; padding: 0 20px; font-size: 13px; border-radius: 10px; width: auto; font-weight:700;" onclick="updateStatus(${c.id}, 'IN_PROGRESS')">Start Work</button>`;
        } else if (wStatus === 'IN_PROGRESS') {
            statusBadge = `<span class="badge" style="background:rgba(245, 158, 11, 0.1); color:#f59e0b; border:1px solid rgba(245, 158, 11, 0.2);">IN_PROGRESS</span>`;
            actionArea = `<button class="btn-primary" style="background:var(--success); border:none; height:38px; padding: 0 20px; font-size: 13px; border-radius: 10px; width: auto; font-weight:700;" onclick="updateStatus(${c.id}, 'RESOLVED')">Mark as Done</button>`;
        } else {
            statusBadge = `<span class="badge" style="background:rgba(34, 197, 94, 0.1); color:#22c55e; border:1px solid rgba(34, 197, 94, 0.2);">RESOLVED</span>`;
            actionArea = `<span style="color:var(--text-muted); font-size: 13px; font-weight:700;"><i class="fa-solid fa-circle-check" style="margin-right:6px;"></i> Completed</span>`;
        }

        const row = document.createElement("tr");
        row.className = "complaint-row";
        row.innerHTML = `
            <td style="padding-left: 24px; font-weight:700; color: var(--text-muted); font-size: 13px; opacity:0.6;">#${c.id}</td>
            <td style="padding: 24px 10px;">
                <div style="font-size: 15px; font-weight: 800; color: var(--text-strong); font-family:'Outfit'; line-height: 1.2;">${c.title}</div>
                <div style="font-size: 13px; color: var(--text-muted); margin-top: 8px; line-height: 1.6; max-width: 500px; font-weight:500;">${c.description}</div>
            </td>
            <td><span style="font-size: 12px; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">${c.category && c.category.name ? c.category.name : 'General'}</span></td>
            <td>${statusBadge}</td>
            <td style="padding-right: 24px; text-align: right;">
                <div style="display: flex; gap: 12px; align-items: center; justify-content: flex-end;">
                    <div id="ops-${c.id}">${actionArea}</div>
                    <button class="btn-ghost" style="width:38px; height:38px; padding:0; border:1.5px solid var(--border); border-radius:10px;" onclick="toggleComments(${c.id})">
                        <i class="fa-solid fa-message" style="font-size: 14px;"></i>
                    </button>
                </div>
                <!-- Discussion Box Hidden by default -->
                <div id="chatbox-${c.id}" class="chat-container" style="display:none; position: fixed; bottom: 80px; right: 30px; width: 340px; height: 450px; box-shadow: 0 20px 60px rgba(0,0,0,0.6); z-index: 2000; border-radius: 24px; flex-direction: column; background: var(--bg-sidebar); border: 1px solid var(--border);">
                     <div style="background: var(--primary); color: white; padding: 20px; border-radius: 24px 24px 0 0; display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-weight: 800; font-family:'Outfit'; font-size:15px;">Discuss Task #${c.id}</span>
                        <i class="fa-solid fa-xmark" style="cursor: pointer; font-size: 20px;" onclick="toggleComments(${c.id})"></i>
                     </div>
                     <div id="chat-messages-${c.id}" class="chat-messages" style="flex:1; padding:20px; overflow-y:auto; background: var(--bg-main);"></div>
                     <div class="chat-input-area" style="padding: 16px; border-top: 1px solid var(--border);">
                        <input type="text" id="chat-input-${c.id}" class="chat-input" placeholder="Type a message..." style="font-size: 13px; background: var(--bg-main); border: 2px solid var(--border); border-radius: 12px; padding: 12px 16px; width: 100%; color: white;" onkeypress="if(event.key==='Enter') postComment(${c.id})">
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

// --- ACTIONS ---
async function updateStatus(id, newStatus) {
    try {
        const res = await fetch(`${baseUrl}/api/v1/complaints/staff/update-status/${id}?status=${newStatus}`, {
            method: "PATCH",
            headers: { 
                "User-Email": sessionStorage.getItem("email")
            }
        });
        if (res.ok) initStaff();
        else alert("Update failed");
    } catch (err) { console.error(err); }
}

async function resolveWithEvidence(id) {
    const remark = document.getElementById(`remark-${id}`).value;
    const fileInput = document.getElementById(`evidence-${id}`);

    const formData = new FormData();
    if (remark) formData.append("remark", remark);
    if (fileInput.files[0]) formData.append("image", fileInput.files[0]);

    try {
        const res = await fetch(`${baseUrl}/api/v1/complaints/staff/resolve/${id}`, {
            method: "POST",
            headers: { 
                "User-Email": sessionStorage.getItem("email")
            },
            body: formData
        });

        if (res.ok) { alert("Ticket Resolved! ✅"); initStaff(); }
        else alert("Update failed");
    } catch (err) { console.error(err); }
}

// --- COMMENTS (Same as Student for consistency) ---
async function toggleComments(id) {
    const chatbox = document.getElementById(`chatbox-${id}`);
    if (!chatbox) return;
    const isOpening = chatbox.style.display !== "flex";
    chatbox.style.display = isOpening ? "flex" : "none";
    if (isOpening) await fetchComments(id);
}

async function fetchComments(id) {
    const container = document.getElementById(`chat-messages-${id}`);
    try {
        const res = await fetch(`${baseUrl}/api/v1/comments/${id}`);
        const comments = await res.json();
        container.innerHTML = comments.map(c => `
            <div class="chat-message">
                <div class="chat-bubble">
                    <div class="chat-bubble-header">
                        <span class="chat-sender-name">${c.senderName} <small>(${c.senderRole})</small></span>
                    </div>
                    <div>${c.text}</div>
                </div>
            </div>
        `).join('') || '<p style="font-size:12px; opacity:0.5; text-align:center;">No history.</p>';
        container.scrollTop = container.scrollHeight;
    } catch (e) { console.error(e); }
}

async function postComment(id) {
    const input = document.getElementById(`chat-input-${id}`);
    if (!input.value.trim()) return;
    try {
        const res = await fetch(`${baseUrl}/api/v1/comments/${id}`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json', 
                'User-Email': sessionStorage.getItem("email")
            },
            body: JSON.stringify({ text: input.value.trim() })
        });
        if (res.ok) { input.value = ""; await fetchComments(id); }
    } catch (e) { console.error(e); }
}

function logout() { sessionStorage.clear(); window.location.href = "login-v2.html"; }
