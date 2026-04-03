/**
 * Admin Dashboard Intelligence v2.0
 * Pure System Implementation (Single Style Authority)
 * "Repeat mat kar — reuse kar" - Following the PRO WAY.
 */

"use strict";

const BASE_URL = CONFIG.API_BASE_URL;
let allComplaints = [];
let allUsers = [];

let trendChart, distributionChart;

// GLOBAL STATE: Pagination, Sorting & View
let currentPage = 1;
const pageSize = 10;
let currentView = 'dashboard';
let sortField = 'createdAt';
let sortOrder = 'desc';

const PRIORITY_RANK = { 'HIGH': 3, 'NORMAL': 2, 'LOW': 1 };

document.addEventListener("DOMContentLoaded", async () => {
    const userEmail = sessionStorage.getItem("email");
    if (!userEmail) {
        window.location.href = "login-v2.html";
        return;
    }

    updateUserIdentity(userEmail);
    // UI.initSidebar is handled globally in config.js
    await refreshDashboard();
});

/**
 * SPA View Switcher (Orchestrates Complaints vs Identity Hub)
 */
function switchView(viewName) {
    currentView = viewName;
    currentPage = 1;

    // Manage Back Button
    const backBtn = document.getElementById('back-btn');
    if (backBtn) {
        backBtn.style.display = (viewName === 'dashboard') ? 'none' : 'flex';
    }

    document.querySelectorAll(".nav-item").forEach(i => i.classList.remove("active"));
    const navItem = document.getElementById(`nav-${viewName}`);
    if (navItem) navItem.classList.add("active");

    const insights = document.getElementById('dashboard-insights');
    let viewTitle = document.getElementById('view-title');
    let tableTitle = document.getElementById('table-title');
    let tableHeader = document.getElementById('table-header-row');
    let filterSlot = document.getElementById('filter-slot');

    if (viewName === 'dashboard' || viewName === 'complaints') {
        if (insights) insights.style.display = (viewName === 'dashboard' ? 'block' : 'none');

        // RESTORE TABLE STRUCTURE
        const contentArea = document.querySelector(".table-container");
        if (contentArea && !document.getElementById("complaints-tbody")) {
            contentArea.innerHTML = `
                <div class="table-header">
                    <h2 id="table-title">Global Ticket Log</h2>
                    <div id="filter-slot"></div>
                </div>
                <div class="table-responsive">
                    <table class="complaint-table">
                        <thead>
                            <tr id="table-header-row"></tr>
                        </thead>
                        <tbody id="complaints-tbody"></tbody>
                    </table>
                </div>
            `;
            tableHeader = document.getElementById("table-header-row");
            tableTitle = document.getElementById("table-title");
            filterSlot = document.getElementById("filter-slot");
        }

        if (viewName === 'dashboard' && insights) {
            const existingBroadcast = document.getElementById("admin-broadcast");
            if (!existingBroadcast) {
                const banner = document.createElement("div");
                banner.id = "admin-broadcast";
                banner.innerHTML = `
                     <div style="margin-bottom: 24px; background: rgba(99, 102, 241, 0.05); border: 1px solid var(--border); padding: 20px 28px; border-radius: 20px; display: flex; align-items: center; gap: 16px;">
                        <div style="font-size: 20px; color: var(--primary);"><i class="fa-solid fa-bullhorn"></i></div>
                        <div style="display:flex; flex-direction:column;">
                            <span style="font-size: 12px; font-weight: 800; color: var(--primary); letter-spacing: 0.1em; text-transform: uppercase;">Portal Announcement</span>
                            <p style="font-size: 14px; font-weight: 600; color: var(--text-strong); margin: 2px 0 0;">Welcome back! Weekly reports are now available in the analytics hub.</p>
                        </div>
                     </div>
                `;
                insights.prepend(banner);
            }
        }

        const viewSubtitle = document.getElementById("view-subtitle");
        if (viewTitle) viewTitle.textContent = viewName === 'dashboard' ? "Overview Dashboard" : "Registry Master";
        if (viewSubtitle) viewSubtitle.textContent = viewName === 'dashboard' ? "Master system analytics and global ticket registry" : "Complete historical record of all system complaints";
        if (tableTitle) tableTitle.textContent = viewName === 'dashboard' ? "Recent Activity Queue" : "Global Complaints Record";

        if (filterSlot) {
            filterSlot.innerHTML = `
                <select id="statusFilter" class="search-input" style="width: auto; padding-right: 32px;" onchange="handleFilterChange()">
                    <option value="ALL">All Status</option>
                    <option value="OPEN">Open Only</option>
                    <option value="RESOLVED">Resolved Only</option>
                </select>
            `;
        }

        tableHeader.innerHTML = `
            <th class="th-sortable" onclick="handleSort('id')" style="background:transparent; border:none; padding-left:32px;">Ticket <i id="sort-id" class="fa-solid fa-sort"></i></th>
            <th class="th-sortable" onclick="handleSort('title')" style="background:transparent; border:none;">Description <i id="sort-title" class="fa-solid fa-sort"></i></th>
            <th class="th-sortable" onclick="handleSort('status')" style="background:transparent; border:none;">Status <i id="sort-status" class="fa-solid fa-sort"></i></th>
            <th class="th-sortable" onclick="handleSort('priority')" style="background:transparent; border:none;">Priority <i id="sort-priority" class="fa-solid fa-sort"></i></th>
            <th class="th-sortable" onclick="handleSort('createdAt')" style="background:transparent; border:none;">Created <i id="sort-createdAt" class="fa-solid fa-sort"></i></th>
            <th style="background:transparent; border:none; text-align:right; padding-right:32px;">Actions</th>
        `;
        renderTable();
    }
    else if (viewName === 'staff' || viewName === 'students' || viewName === 'users') {
        if (insights) insights.style.display = 'none';

        const viewSubtitle = document.getElementById("view-subtitle");
        if (viewTitle) viewTitle.textContent = viewName === 'staff' ? "Staff Management" : (viewName === 'students' ? "Students Directory" : "Users Management");
        if (viewSubtitle) viewSubtitle.textContent = viewName === 'staff' ? "Manage and assign college staff members" : (viewName === 'students' ? "View and manage student identities" : "Complete user identity ecosystem");

        const contentArea = document.querySelector(".table-container");
        if (contentArea && !document.getElementById("complaints-tbody")) {
            contentArea.innerHTML = `
                <div class="table-header">
                    <h2 id="table-title">Identity Directory</h2>
                    <div id="filter-slot"></div>
                </div>
                <div class="table-responsive">
                    <table class="complaint-table">
                        <thead>
                            <tr id="table-header-row"></tr>
                        </thead>
                        <tbody id="complaints-tbody"></tbody>
                    </table>
                </div>
            `;
            tableHeader = document.getElementById("table-header-row");
            tableTitle = document.getElementById("table-title");
            filterSlot = document.getElementById("filter-slot");
        }

        tableHeader.innerHTML = `
            <th style="padding-left: 24px;">ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Department</th>
            <th>Status</th>
            <th style="text-align: right; padding-right: 24px;">Actions</th>
        `;

        if (filterSlot) {
            filterSlot.innerHTML = `
                <button class="btn btn-primary" onclick="openAddUserModal('${viewName}')">
                    <i class="fa-solid fa-plus"></i> Add ${viewName === 'staff' ? 'Staff' : (viewName === 'students' ? 'Student' : 'User')}
                </button>
            `;
        }

        renderUsersTable(viewName);
    }
    else if (viewName === 'reports') {
        if (insights) insights.style.display = 'block'; // Keep insights visible for reports
        if (viewTitle) viewTitle.textContent = "Reports & Analytics";
        const viewSubtitle = document.getElementById("view-subtitle");
        if (viewSubtitle) viewSubtitle.textContent = "Detailed system performance and resolution metrics";

        const contentArea = document.querySelector(".table-container");
        if (contentArea) {
            contentArea.innerHTML = `
                <div style="padding: 60px; text-align: center; color: var(--text-muted);">
                    <i class="fa-solid fa-chart-pie" style="font-size: 48px; margin-bottom: 20px; color: var(--primary);"></i>
                    <h3>Advanced Analytics Module</h3>
                    <p>Generating system-wide reports and resolution trends... Check back shortly.</p>
                </div>
            `;
        }
    }
}

/**
 * Users Data Grid Renderer (Using Master Component Styles)
 */
function renderUsersTable(viewType = 'users') {
    const searchEl = document.getElementById("global-search");
    const q = searchEl ? searchEl.value.toLowerCase() : "";


    let filtered = allUsers.filter(u => {
        const matchesQuery = (u.name && u.name.toLowerCase().includes(q)) ||
            (u.email && u.email.toLowerCase().includes(q)) ||
            (u.id && u.id.toString().includes(q));

        if (viewType === 'staff') return matchesQuery && u.role === 'STAFF';
        if (viewType === 'students') return matchesQuery && u.role === 'STUDENT';
        return matchesQuery;
    });

    const tbody = document.getElementById("complaints-tbody");
    if (!tbody) return;
    tbody.innerHTML = "";

    if (filtered.length === 0) {
        const entityLabel = viewType === 'staff' ? 'staff members' : (viewType === 'students' ? 'students' : 'identities');
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 48px; color: var(--text-muted);"><i class="fa-solid fa-user-slash"></i> No ${entityLabel} matching query.</td></tr>`;
        return;
    }

    filtered.forEach(u => {
        const tr = document.createElement("tr");
        const initial = u.name ? u.name.charAt(0).toUpperCase() : u.email.charAt(0).toUpperCase();

        let avatarTag = `<span class="initial-avatar">${initial}</span>`;
        if (u.profilePictureUrl) {
            avatarTag = `<img src="${BASE_URL}${u.profilePictureUrl}" class="initial-avatar" style="width: 32px; height: 32px; object-fit: cover; border-radius: 50%; border: 1px solid var(--border);">`;
        }

        let roleBadge = 'badge-slate';
        if (u.role === 'ADMIN') roleBadge = 'badge-indigo';
        else if (u.role === 'STAFF') roleBadge = 'badge-green';

        tr.innerHTML = `
            <td style="padding-left: 24px; font-family: monospace; color: var(--text-muted);">#${u.id}</td>
            <td>
                <div class="identity-cell" style="display: flex; align-items: center; gap: 12px;">
                    ${avatarTag}
                    <span style="font-weight: 700;">${u.name || 'Anonymous'}</span>
                </div>
            </td>
            <td style="color: var(--text-muted); font-weight: 500;">${u.email}</td>
            <td><span class="badge ${roleBadge}">${u.role}</span></td>
            <td>
                    <span style="font-size: 13px; font-weight: 700; color: var(--text-strong);">${u.departmentName || (u.department ? (u.department.name || u.department) : 'General')}</span>
                    ${(u.specializationName || u.specialization) ? `<span class="badge badge-indigo" style="font-size: 10px; width: fit-content;">${u.specializationName || (u.specialization ? (u.specialization.name || u.specialization) : '')}</span>` : ''}
            </td>
            <td>
                <div class="status-indicator">
                    <span class="dot dot-active"></span>
                    <span style="color: var(--success); font-size: 12px;">Active</span>
                </div>
            </td>
            <td style="text-align: right; padding-right: 24px;">
                <div class="action-btns">
                    <button class="action-btn" title="Edit Profile"><i class="fa-solid fa-pen"></i></button>
                    <button class="action-btn btn-delete" title="Archive"><i class="fa-solid fa-trash-can"></i></button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });

    const pInfo = document.getElementById("pagination-info");
    if (pInfo) pInfo.textContent = `Total Records Tracked: ${filtered.length}`;
}

/**
 * Unified System Refresh logic
 */
async function refreshDashboard() {
    console.log("System Matrix Sync Initiated...");
    try {
        const btn = document.querySelector('button[onclick="refreshDashboard()"]');
        if (btn) UI.spinIcon(btn);

        const email = sessionStorage.getItem("email");

        if (!email) {
            UI.showToast("Security Protocol Error: Stale Session", "error");
            alert("Identity Session Expired. Re-authenticating...");
            UI.logout();
            return;
        }

        console.log("Identity Context:", { email });
        const fetchOptions = {
            headers: {
                "User-Email": email
            }
        };

        const [compRes, userRes] = await Promise.all([
            fetch(`${BASE_URL}/api/v1/complaints/admin/all`, fetchOptions).catch(e => e),
            fetch(`${BASE_URL}/api/v1/complaints/admin/users/all`, fetchOptions).catch(e => e)
        ]);

        if (compRes instanceof Error || userRes instanceof Error) {
            throw new Error(`Sync Failed: ${compRes.message || userRes.message}`);
        }

        console.log("Fetch Responses:", { complaints: compRes.status, users: userRes.status });

        if (!compRes.ok || !userRes.ok) {
            const status = !compRes.ok ? compRes.status : userRes.status;
            throw new Error(`System Authorization Failed: ${status}`);
        }

        const data1 = await compRes.json();
        const data2 = await userRes.json();

        allComplaints = Array.isArray(data1) ? data1 : [];
        allUsers = Array.isArray(data2) ? data2 : [];

        console.log("Data Synced:", { complaints: allComplaints.length, users: allUsers.length });

        renderStats(allComplaints);

        try {
            renderCharts(allComplaints);
        } catch (chartErr) {
            console.warn("Analytics Engine Failure:", chartErr);
        }

        if (currentView === 'users') renderUsersTable(); else renderTable();

    } catch (err) {
        console.error("System Matrix Sync Failure:", err);
        UI.showToast("System Matrix Sync Failure: Check Security Protocol", "error");

        // Clear skeletons on failure to avoid "stuck" UI
        const tbody = document.getElementById("complaints-tbody");
        if (tbody) tbody.innerHTML = `<tr><td colspan="5" align="center" style="padding:40px; color:var(--text-muted);"><i class="fa-solid fa-triangle-exclamation"></i> Sync Error: ${err.message}</td></tr>`;
    }
}

/**
 * Standard Complaints Table Logic
 */
function renderTable() {
    if (currentView === 'users') { renderUsersTable(); return; }

    const searchEl = document.getElementById("global-search");
    const q = searchEl ? searchEl.value.toLowerCase() : "";
    const sf = document.getElementById("statusFilter");
    const filterStatus = sf ? sf.value : "ALL";

    let filtered = allComplaints.filter(c =>
        (c.title.toLowerCase().includes(q) || c.id.toString().includes(q)) &&
        (filterStatus === "ALL" || c.status === filterStatus)
    );


    filtered.sort((a, b) => {
        let valA = a[sortField]; let valB = b[sortField];
        if (sortField === 'priority') { valA = PRIORITY_RANK[a.priority] || 0; valB = PRIORITY_RANK[b.priority] || 0; }
        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
    });

    const totalRecords = filtered.length;
    const totalPages = Math.ceil(totalRecords / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalRecords);
    const pageData = filtered.slice(startIndex, endIndex);

    const tbody = document.getElementById("complaints-tbody");
    if (!tbody) return;
    tbody.innerHTML = "";

    if (pageData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 48px; color: var(--text-muted);"><i class="fa-solid fa-database"></i> No records found in matrix.</td></tr>`;
        updatePaginationInfo(0, 0, 0, 0);
        return;
    }

    pageData.forEach(c => {
        const tr = document.createElement("tr");
        const badgeColor = (c.status === 'RESOLVED' || c.status === 'CLOSED') ? 'badge-green' : 'badge-amber';
        const prioColor = c.priority === 'HIGH' ? 'var(--danger)' : (c.priority === 'LOW' ? 'var(--success)' : 'var(--text-muted)');

        // Media Support
        const mediaIcon = c.imageUrl ? `<i class="fa-solid fa-paperclip" title="Evidence Attached" style="margin-left:8px; color:var(--primary); cursor:pointer;" onclick="window.open('${BASE_URL}${c.imageUrl}')"></i>` : "";

        let actionBtnHTML = "";
        const isAssigned = c.assignedStaffName && c.assignedStaffName !== "Unassigned";

        if (c.status === 'OPEN' || c.status === 'ASSIGNED' || c.status === 'IN_PROGRESS') {
            actionBtnHTML = `
                <div style="display: flex; gap: 8px; justify-content: flex-end; flex-direction: column; align-items: flex-end;">
                    <div style="display: flex; gap: 8px;">
                        <button class="btn-primary" style="padding: 6px 14px; font-size: 11px; border-radius: 8px;" onclick="openAssignModal(${c.id})"><i class="fa-solid fa-user-plus"></i> ${isAssigned ? 'Re-Assign' : 'Assign'}</button>
                    </div>
            `;
            if (isAssigned) {
                actionBtnHTML += `<div style="font-size: 10px; color: var(--text-muted); margin-top: 4px; text-align: right;"><i class="fa-solid fa-user-check" style="color:var(--success);"></i> Assigned: ${c.assignedStaffName}</div></div>`;
            } else {
                actionBtnHTML += `</div>`;
            }
        } else if (isAssigned) {
            actionBtnHTML = `<span style="font-size: 11px; font-weight: 700; color: var(--text-muted);"><i class="fa-solid fa-user-check"></i> ${c.assignedStaffName}</span>`;
        } else {
            actionBtnHTML = `<span style="font-size: 11px; color: var(--text-muted);">-</span>`;
        }

        tr.innerHTML = `
            <td style="padding: 16px 32px; font-family: monospace; font-weight: 700; color: var(--text-muted); font-size: 13px;">#${c.id}</td>
            <td style="padding: 16px 24px; font-weight: 700; color: var(--text-strong);">${c.title}${mediaIcon}</td>
            <td style="padding: 16px 24px;"><span class="badge ${badgeColor}" style="border-radius: 8px; padding: 6px 14px;">${c.status}</span></td>
            <td style="padding: 16px 24px;"><span style="font-size: 12px; font-weight: 800; color: ${prioColor}; letter-spacing: 0.05em;">${c.priority || 'NORMAL'}</span></td>
            <td style="padding: 16px 24px; font-size: 13px; color: var(--text-muted); font-weight: 600;">${new Date(c.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</td>
            <td style="padding: 16px 32px; text-align: right;">${actionBtnHTML}</td>
        `;
        tbody.appendChild(tr);
    });

    updatePaginationInfo(startIndex + 1, endIndex, totalRecords, totalPages);
}

function renderStats(data) {
    const total = data.length;
    const pending = data.filter(c => c.status !== 'RESOLVED' && c.status !== 'CLOSED').length;
    const resolved = total - pending;
    const rate = total > 0 ? Math.round((resolved / total) * 100) : 0;

    // Update Stats Cards
    const elements = { 'stat-total': total, 'stat-pending': pending, 'stat-resolved': `${rate}%` };
    for (const [id, val] of Object.entries(elements)) {
        const el = document.getElementById(id); if (el) el.textContent = val;
    }

    // Update Resolution Progress Bar (New System Dashboard Integration)
    const bar = document.getElementById("resolution-bar");
    const percent = document.getElementById("resolution-percent");
    if (bar) bar.style.width = `${rate}%`;
    if (percent) percent.textContent = `${rate}%`;
}

function handleSort(field) {
    if (sortField === field) sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    else { sortField = field; sortOrder = 'asc'; }
    updateSortIcons();
    renderTable();
}

function updateSortIcons() {
    document.querySelectorAll(".th-sortable i").forEach(icon => { icon.className = "fa-solid fa-sort"; icon.style.opacity = "0.2"; });
    const activeIcon = document.getElementById(`sort-${sortField}`);
    if (activeIcon) { activeIcon.style.opacity = "1"; activeIcon.className = sortOrder === 'asc' ? "fa-solid fa-sort-up" : "fa-solid fa-sort-down"; }
}

function changePage(direction) { currentPage += direction; renderTable(); }

function updatePaginationInfo(start, end, total, totalPages) {
    const info = document.getElementById("pagination-info");
    const prevBtn = document.getElementById("prevPageBtn");
    const nextBtn = document.getElementById("nextPageBtn");
    if (info) info.textContent = total > 0 ? `Showing ${start} - ${end} of ${total} records` : "No Activity recorded.";
    if (prevBtn) prevBtn.disabled = currentPage <= 1;
    if (nextBtn) nextBtn.disabled = (currentPage >= totalPages) || totalPages === 0;
}

function handleGlobalSearch() { currentPage = 1; if (currentView === 'users') renderUsersTable(); else renderTable(); }
function handleFilterChange() { currentPage = 1; renderTable(); }

async function updateUserIdentity(email) {
    const navName = document.getElementById("nav-name");
    const sideName = document.getElementById("sidebar-name");
    const sideEmail = document.getElementById("sidebar-email");
    const sideAvatar = document.getElementById("sidebar-avatar");

    const cachedName = sessionStorage.getItem('userName');
    const cachedAvatar = sessionStorage.getItem('userAvatar');
    const userEmail = email || sessionStorage.getItem('email');
    
    // Instant Hydration
    if (navName) navName.textContent = "Admin Control";
    if (sideName) sideName.textContent = cachedName || "Admin Account";
    if (sideEmail) sideEmail.textContent = userEmail || "admin@system.com";
    
    if (sideAvatar) {
        if (cachedAvatar) {
            sideAvatar.innerText = "";
            sideAvatar.style.backgroundImage = `url('${BASE_URL}${cachedAvatar}')`;
            sideAvatar.style.backgroundSize = "cover";
        } else {
            sideAvatar.innerText = (cachedName || "Admin").charAt(0).toUpperCase();
        }
    }

    // Sync from API
    try {
        const res = await fetch(`${BASE_URL}/api/v1/profile`, {
            headers: { "User-Email": userEmail }
        });
        if (res.ok) {
            const data = await res.json();
            sessionStorage.setItem("userName", data.name);
            if (data.profilePictureUrl) sessionStorage.setItem("userAvatar", data.profilePictureUrl);
            
            // Re-update if data changed
            if (sideName) sideName.textContent = data.name;
            if (sideAvatar && data.profilePictureUrl) {
                sideAvatar.innerText = "";
                sideAvatar.style.backgroundImage = `url('${BASE_URL}${data.profilePictureUrl}')`;
            }
        }
    } catch(e) { console.warn("Admin profile sync fail", e); }
}


function toggleTheme() {
    UI.toggleTheme();
    renderCharts(allComplaints);
}

function renderCharts(complaints) {
    const dCtx = document.getElementById('distributionChart');
    const pCtx = document.getElementById('trendChart');
    if (!dCtx || !pCtx) return;

    const isMobile = window.innerWidth < 768;
    const chartFontSize = isMobile ? 9 : 11;

    // 📊 CHART 1: WEEKLY INTAKE (Real Data)
    const dailyCounts = [0, 0, 0, 0, 0, 0, 0]; // Mon-Sun
    complaints.forEach(c => {
        const date = new Date(c.createdAt);
        let day = date.getDay();
        let dayIndex = (day === 0) ? 6 : day - 1; // Map to Mon(0)...Sun(6)
        dailyCounts[dayIndex]++;
    });

    if (window.perfChart) window.perfChart.destroy();
    window.perfChart = new Chart(pCtx.getContext('2d'), {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Log Volume',
                data: dailyCounts,
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                pointRadius: 4,
                pointBackgroundColor: '#6366f1'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { 
                    beginAtZero: true, 
                    grid: { color: 'rgba(255,255,255,0.05)' }, 
                    ticks: { color: '#94a3b8', stepSize: 1, font: { size: chartFontSize } } 
                },
                x: { 
                    grid: { display: false }, 
                    ticks: { color: '#94a3b8', font: { size: chartFontSize } } 
                }
            }
        }
    });

    // 📊 CHART 2: CATEGORY DISTRIBUTION
    const categoryData = {};
    complaints.forEach(c => {
        const catName = c.category && c.category.name ? c.category.name : 'Uncategorized';
        categoryData[catName] = (categoryData[catName] || 0) + 1;
    });

    if (window.distChart) window.distChart.destroy();
    window.distChart = new Chart(dCtx.getContext('2d'), {
        type: 'doughnut',
        data: { 
            labels: Object.keys(categoryData), 
            datasets: [{ 
                data: Object.values(categoryData), 
                backgroundColor: ['#6366f1', '#a855f7', '#f43f5e', '#f59e0b', '#10b981'], 
                borderWidth: 0, 
                hoverOffset: 12 
            }] 
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false, 
            cutout: '70%', 
            plugins: { 
                legend: { 
                    position: 'bottom', 
                    labels: { 
                        color: '#94a3b8', 
                        font: { weight: '700', size: chartFontSize - 1 } 
                    } 
                } 
            } 
        }
    });

    // Update Chart Titles
    const chartTitles = document.querySelectorAll('.card h3');
    if (chartTitles.length > 0) chartTitles[0].textContent = "Complaints Intake (Weekly)";
}

// Dynamic sidebar logic is handled via config.js UI.initSidebar()



let currentSelectedStaffId = null;

// ------ MANUAL ASSIGN LOGIC ------
async function openAssignModal(complaintId) {
    const c = allComplaints.find(x => x.id === complaintId);
    if (!c) return;

    currentSelectedStaffId = null;
    document.getElementById("assign-complaint-id").value = complaintId;
    document.getElementById("assign-modal").style.display = "flex";
    document.getElementById("staff-search-input").value = "";

    // Fill Details
    document.getElementById("view-complaint-title").textContent = c.title || 'Untitled Issue';
    document.getElementById("view-complaint-desc").textContent = c.description || 'No description provided.';

    const domainName = c.category && c.category.domain ? (c.category.domain.name || c.category.domain) : 'General / Unknown';
    const catName = c.category && c.category.name ? c.category.name : 'Unknown Category';

    document.getElementById("view-complaint-domain").innerHTML = `<i class="fa-solid fa-layer-group"></i> ${domainName}`;
    document.getElementById("view-complaint-category").innerHTML = `<i class="fa-solid fa-tag"></i> ${catName}`;

    document.getElementById("view-complaint-author").textContent = c.student && c.student.name ? c.student.name : 'Unknown Student';
    document.getElementById("view-complaint-date").textContent = new Date(c.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

    // Render Staff List
    renderAssignStaffList(domainName);

    const confirmBtn = document.getElementById("confirm-assign-btn");
    confirmBtn.disabled = true;
    confirmBtn.style.opacity = '0.5';
    confirmBtn.style.cursor = 'not-allowed';

    if (c.status === 'ASSIGNED' || c.status === 'IN_PROGRESS') {
        confirmBtn.innerHTML = '<i class="fa-solid fa-shuffle"></i> Re-Assign Staff';
    } else {
        confirmBtn.innerHTML = '<i class="fa-solid fa-check"></i> Finalize Assignment';
    }
}

function renderAssignStaffList(suggestedDomainName) {
    const listContainer = document.getElementById("assign-staff-list");
    const q = document.getElementById("staff-search-input").value.toLowerCase();

    const staffs = allUsers.filter(u => u.role === 'STAFF');

    // Sort: Suggested domain staff first
    staffs.sort((a, b) => {
        const aDept = (a.department && a.department.name ? a.department.name : (a.department || '')).toLowerCase();
        const bDept = (b.department && b.department.name ? b.department.name : (b.department || '')).toLowerCase();
        const sDept = (suggestedDomainName || '').toLowerCase();

        const aMatch = aDept === sDept ? 1 : 0;
        const bMatch = bDept === sDept ? 1 : 0;
        return bMatch - aMatch;
    });

    listContainer.innerHTML = "";

    staffs.forEach(s => {
        const sName = s.name || s.email;
        const sDept = s.departmentName || (s.department && s.department.name ? s.department.name : (s.department || 'No Dept'));
        const sSpec = s.specializationName || (s.specialization && s.specialization.name ? s.specialization.name : null);

        if (q && !sName.toLowerCase().includes(q) && !sDept.toLowerCase().includes(q) && (!sSpec || !sSpec.toLowerCase().includes(q))) {
            return;
        }

        const isDomainMatch = sDept.toLowerCase() === (suggestedDomainName || '').toLowerCase() && suggestedDomainName !== 'General / Unknown';

        // Find complaint's category name to match against specialization
        const complaintCatHTML = document.getElementById("view-complaint-category").innerHTML;
        let complaintCatName = "";
        const catParts = complaintCatHTML.split("</i>");
        if (catParts.length > 1) complaintCatName = catParts[1].trim();

        const isSpecMatch = sSpec && sSpec.toLowerCase() === complaintCatName.toLowerCase();

        const isSelected = currentSelectedStaffId === s.id;

        const card = document.createElement("div");
        card.style.padding = "16px";
        card.style.borderRadius = "12px";
        card.style.border = `2px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`;
        card.style.background = isSelected ? 'rgba(99, 102, 241, 0.05)' : 'var(--surface)';
        card.style.cursor = "pointer";
        card.style.display = "flex";
        card.style.justifyContent = "space-between";
        card.style.alignItems = "center";
        card.style.transition = "all 0.2s ease";

        card.onmouseover = () => { if (!isSelected) card.style.borderColor = 'var(--text-muted)'; };
        card.onmouseout = () => { if (!isSelected) card.style.borderColor = 'var(--border)'; };

        card.onclick = () => {
            currentSelectedStaffId = s.id;
            const btn = document.getElementById("confirm-assign-btn");
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
            renderAssignStaffList(suggestedDomainName); // re-render to update UI
        };

        const avatarInitial = sName.charAt(0).toUpperCase();

        card.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px;">
                <div style="width: 36px; height: 36px; border-radius: 10px; background: ${isSpecMatch ? 'var(--success)' : (isDomainMatch ? 'var(--primary)' : 'var(--bg-hover)')}; color: ${isDomainMatch || isSpecMatch ? '#fff' : 'var(--text-strong)'}; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px;">
                    ${avatarInitial}
                </div>
                <div>
                    <div style="font-weight: 700; font-size: 14px; color: var(--text-strong);">${sName}</div>
                    <div style="font-size: 11px; font-weight: 600; color: var(--text-muted); margin-top: 2px;">
                        <i class="fa-solid fa-briefcase"></i> ${sDept} 
                        ${sSpec ? `| <i class="fa-solid fa-star" ${isSpecMatch ? 'style="color:var(--warning)"' : ''}></i> ${sSpec}` : ''}
                        ${isSpecMatch ? '<span style="color:var(--success); margin-left:6px;"><i class="fa-solid fa-check-double"></i> Recommended Specialist</span>' : (isDomainMatch ? '<span style="color:var(--primary); margin-left:6px;"><i class="fa-solid fa-star"></i> Suggested Dept.</span>' : '')}
                    </div>
                </div>
            </div>
            <div>
                <i class="fa-solid ${isSelected ? 'fa-circle-check' : 'fa-circle'}" style="color: ${isSelected ? 'var(--primary)' : 'var(--border)'}; font-size: 18px;"></i>
            </div>
        `;
        listContainer.appendChild(card);
    });

    if (listContainer.children.length === 0) {
        listContainer.innerHTML = `<div style="padding: 32px; text-align: center; color: var(--text-muted); font-size: 13px;"><i class="fa-solid fa-user-slash"></i> No staff matches the search.</div>`;
    }
}

function filterAssignStaff() {
    const domainHTML = document.getElementById("view-complaint-domain").innerHTML;
    const defaultVal = "General / Unknown";

    let suggested = defaultVal;

    // Extract domain name from innerHTML like `<i class="..."></i> Domain Name`
    const parts = domainHTML.split("</i>");
    if (parts.length > 1) {
        suggested = parts[1].trim();
    }

    renderAssignStaffList(suggested);
}

function closeAssignModal() {
    document.getElementById("assign-modal").style.display = "none";
}

async function submitAssign() {
    const complaintId = document.getElementById("assign-complaint-id").value;
    const staffId = currentSelectedStaffId;

    if (!staffId) {
        alert("Please select a staff member from the list to assign.");
        return;
    }

    const email = sessionStorage.getItem("email");

    const params = new URLSearchParams();
    params.append('complaintId', complaintId);
    params.append('staffId', staffId);

    const btn = document.getElementById("confirm-assign-btn");
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.style.opacity = '0.5';
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';

    try {
        const res = await fetch(`${BASE_URL}/api/v1/complaints/admin/assign`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Email': sessionStorage.getItem('email')
            },
            body: params
        });

        const rawText = await res.text();
        if (res.ok) {
            closeAssignModal();
            refreshDashboard();
        } else {
            alert("Failed to assign: " + rawText);
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.innerHTML = originalText;
        }
    } catch (err) {
        console.error(err);
        alert("Server communication error.");
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.innerHTML = originalText;
    }
}

// ------ ADVANCED IDENTITY MANAGEMENT (MODAL LOGIC) ------

let allDomains = [];

async function openAddUserModal(initialRole = 'STUDENT') {
    document.getElementById("add-user-modal").style.display = "flex";
    document.getElementById("add-user-name").value = "";
    document.getElementById("add-user-email").value = "";
    document.getElementById("add-user-role").value = initialRole.toUpperCase();

    // Reset selections
    const categorySelect = document.getElementById("add-user-category");
    if (categorySelect) categorySelect.innerHTML = '<option value="">Select Specialization...</option>';

    toggleAddUserFields();

    // Fetch Domains if not already fetched
    if (allDomains.length === 0) {
        try {
            const res = await fetch(`${BASE_URL}/api/public/domains`);
            allDomains = await res.json();

            const domainSelect = document.getElementById("add-user-domain");
            domainSelect.innerHTML = '<option value="">Select Domain...</option>';
            allDomains.forEach(d => {
                const opt = document.createElement("option");
                opt.value = d.id;
                opt.textContent = d.name;
                domainSelect.appendChild(opt);
            });
        } catch (err) {
            console.error("Failed to load domains:", err);
        }
    }
}

function closeAddUserModal() {
    document.getElementById("add-user-modal").style.none = "flex";
    document.getElementById("add-user-modal").style.display = "none";
}

function toggleAddUserFields() {
    const role = document.getElementById("add-user-role").value;
    const staffFields = document.getElementById("staff-specific-fields");
    staffFields.style.display = (role === 'STAFF') ? 'flex' : 'none';
}

async function loadAddUserCategories() {
    const domainId = document.getElementById("add-user-domain").value;
    const catSelect = document.getElementById("add-user-category");
    catSelect.innerHTML = '<option value="">Loading specializations...</option>';

    if (!domainId) {
        catSelect.innerHTML = '<option value="">Select Specialization...</option>';
        return;
    }

    try {
        const res = await fetch(`${BASE_URL}/api/public/categories/${domainId}`);
        const categories = await res.json();

        catSelect.innerHTML = '<option value="">Select Specialization...</option>';
        categories.forEach(c => {
            const opt = document.createElement("option");
            opt.value = c.id;
            opt.textContent = c.name;
            catSelect.appendChild(opt);
        });
    } catch (err) {
        console.error("Failed to load specializations:", err);
        catSelect.innerHTML = '<option value="">Failed to load list</option>';
    }
}

async function submitAddUser() {
    console.log("Identity Spawn Initiated...");
    const name = document.getElementById("add-user-name").value.trim();
    const email = document.getElementById("add-user-email").value.trim();
    const password = document.getElementById("add-user-pass").value;
    const role = document.getElementById("add-user-role").value;
    const domainId = document.getElementById("add-user-domain").value;
    const categoryId = document.getElementById("add-user-category").value;

    if (!name || !email || !password) {
        alert("Verification required: Name, Email and Password fields must be populated.");
        return;
    }

    const newUser = {
        name,
        email,
        password,
        role: role.toUpperCase(),
        department: domainId ? { id: parseInt(domainId) } : null,
        specialization: categoryId ? { id: parseInt(categoryId) } : null
    };

    const btn = document.getElementById("create-user-btn");
    UI.spinIcon(btn);
    btn.disabled = true;

    try {
        const res = await fetch(`${BASE_URL}/api/v1/complaints/admin/users/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Email': sessionStorage.getItem('email')
            },
            body: JSON.stringify(newUser)
        });

        if (res.ok) {
            closeAddUserModal();
            refreshDashboard();
            alert(`Identity Spawned Successfully: ${name} is now active.`);
        } else {
            const msg = await res.text();
            alert("Identity Creation Failed: " + msg);
        }
    } catch (err) {
        console.error(err);
        alert("Security protocol error: Communication with Identity Hub failed.");
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-shield-plus"></i> Finalize Identity';
    }
}
