// Global Configuration for Smart Complaint Portal
const CONFIG = {
    API_BASE_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? `http://${window.location.hostname}:8080`
        : 'https://complaint-backend-5rdk.onrender.com',
    APP_NAME: 'GRIEVLY',
    APP_VERSION: '1.2.0-CD',
    ENDPOINTS: {
        AUTH: '/api/auth',
        PROFILE: '/api/v1/profile',
        PUBLIC_DOMAINS: '/api/public/domains',
        PUBLIC_CATEGORIES: '/api/public/categories',
        STUDENT_RAISE: '/api/student/raise'
    }
};

// Common Utilities
const UI = {
    toggleSidebar: () => {
        const sidebar = document.getElementById("sidebar");
        const overlay = document.getElementById("sidebarOverlay");
        if (sidebar) sidebar.classList.toggle("active");
        if (overlay) overlay.classList.toggle("active");
    },
    closeSidebar: () => {
        const sidebar = document.getElementById("sidebar");
        const overlay = document.getElementById("sidebarOverlay");
        if (sidebar) sidebar.classList.remove("active");
        if (overlay) overlay.classList.remove("active");
    },
    toggleTheme: () => {
        const doc = document.documentElement;
        const next = doc.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        doc.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
        
        // Spin the icon
        document.querySelectorAll('.theme-toggle i').forEach(i => UI.spinIcon(i));

        UI.updateThemeIcons(next);
    },
    spinIcon: (el) => {
        if (!el) return;
        const icon = el.tagName === 'I' ? el : el.querySelector('i');
        if (!icon) return;
        icon.style.transition = 'none';
        icon.style.transform = 'rotate(0deg)';
        setTimeout(() => {
            icon.style.transition = 'transform 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            icon.style.transform = 'rotate(360deg)';
        }, 10);
    },
    updateThemeIcons: (theme) => {
        document.querySelectorAll('.theme-toggle i').forEach(icon => {
            icon.className = theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
        });
    },
    initTheme: () => {
        const saved = localStorage.getItem('theme') || 'dark';
        document.documentElement.setAttribute('data-theme', saved);
        UI.updateThemeIcons(saved);
    },
    logout: () => {
        sessionStorage.clear();
        window.location.href = (window.location.pathname.includes('/pages/') ? '' : 'pages/') + 'login-v2.html';
    },
    showToast: (message, type = 'info') => {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.style.cssText = 'position: fixed; bottom: 32px; right: 32px; z-index: 9999; display: flex; flex-direction: column; gap: 12px;';
            document.body.appendChild(container);
        }
        const toast = document.createElement('div');
        const bg = type === 'success' ? 'var(--success)' : (type === 'error' ? 'var(--danger)' : 'var(--primary)');
        toast.style.cssText = `background: ${bg}; color: white; padding: 16px 24px; border-radius: 12px; font-weight: 700; font-size: 14px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); transform: translateY(100px); opacity: 0; transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);`;
        toast.innerText = message;
        container.appendChild(toast);

        // Animate in
        setTimeout(() => { toast.style.transform = 'translateY(0)'; toast.style.opacity = '1'; }, 10);

        // Remove after delay
        setTimeout(() => {
            toast.style.transform = 'translateY(20px)';
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 400);
        }, 4000);
    },
    initSidebar: () => {
        const menuBtn = document.getElementById("menu-toggle");
        const sidebar = document.getElementById("sidebar");
        const overlay = document.getElementById('sidebarOverlay') || (() => {
            const el = document.createElement('div');
            el.className = 'sidebar-overlay';
            el.id = 'sidebarOverlay';
            document.body.appendChild(el);
            return el;
        })();

        if (!menuBtn || !sidebar) return;

        menuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            sidebar.classList.toggle('active');
            const isActive = sidebar.classList.contains('active');
            overlay?.classList.toggle('active', isActive);

            // Dynamically manage Mobile Extras (Theme Toggle, etc.)
            if (isActive && window.innerWidth <= 1024) {
                let extras = document.getElementById('sidebar-mobile-extras');
                if (!extras) {
                    extras = document.createElement('div');
                    extras.id = 'sidebar-mobile-extras';
                    extras.className = 'sidebar-mobile-extras';
                    
                    // Create a dedicated theme switcher row
                    const themeToggle = document.querySelector('.theme-toggle[onclick*="toggleTheme"]');
                    if (themeToggle) {
                        const row = document.createElement('div');
                        row.className = 'extras-row';
                        row.innerHTML = `
                            <div style="display:flex; flex-direction:column; gap:2px;">
                                <span style="font-size:12px; color:var(--text-strong); font-weight:800; letter-spacing:0.02em;">Appearance Mode</span>
                                <span style="font-size:10px; color:var(--text-muted); font-weight:600;">Switch between dark and light themes</span>
                            </div>
                        `;
                        const clone = themeToggle.cloneNode(true);
                        clone.id = 'sidebar-theme-toggle';
                        row.appendChild(clone);
                        extras.appendChild(row);
                    }

                    // Also clone the Sync/Refresh button if it exists
                    const refreshBtn = document.querySelector('.refresh-btn');
                    if (refreshBtn) {
                        const row = document.createElement('div');
                        row.className = 'extras-row';
                        row.style.marginTop = '16px';
                        row.style.paddingTop = '16px';
                        row.style.borderTop = '1px dashed var(--border)';
                        row.innerHTML = `
                            <div style="display:flex; flex-direction:column; gap:2px;">
                                <span style="font-size:12px; color:var(--text-strong); font-weight:800; letter-spacing:0.02em;">Sync Hub</span>
                                <span style="font-size:10px; color:var(--text-muted); font-weight:600;">Reload latest system updates</span>
                            </div>
                        `;
                        const clone = refreshBtn.cloneNode(true);
                        clone.id = 'sidebar-refresh-btn';
                        row.appendChild(clone);
                        extras.appendChild(row);
                    }

                    // Append to sidebar footer or after nav
                    const nav = sidebar.querySelector('nav') || sidebar.querySelector('#sidebar-nav');
                    if (nav) nav.after(extras);
                }
            }
        });

        overlay?.addEventListener('click', () => {
            sidebar.classList.remove('active');
            overlay?.classList.remove('active');
        });

        // Auto-close sidebar on mobile when navigation is clicked, but NOT on Appearance/Theme toggles
        sidebar.addEventListener('click', (e) => {
            const isMobile = window.innerWidth <= 1024;
            // Target specific closing triggers, EXCLUDING the theme toggle
            const isClosingTrigger = e.target.closest('.nav-item, #sidebar-refresh-btn, .logout-btn');
            
            if (isMobile && isClosingTrigger) {
                sidebar.classList.remove('active');
                overlay?.classList.remove('active');
            }
        });
    },
    showTableSkeletons: (containerId, rows = 5) => {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = Array(rows).fill(`
            <tr>
                <td><div class="skeleton skeleton-text" style="width: 40px;"></div></td>
                <td>
                    <div class="skeleton skeleton-title"></div>
                    <div class="skeleton skeleton-text" style="width: 80%;"></div>
                </td>
                <td><div class="skeleton skeleton-text"></div></td>
                <td><div class="skeleton skeleton-btn" style="width: 80px; border-radius: 20px;"></div></td>
                <td align="right"><div class="skeleton skeleton-btn"></div></td>
            </tr>
        `).join('');
    },
    showStatSkeletons: (ids = []) => {
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = `<div class="skeleton skeleton-text" style="height: 32px; width: 60px; margin: 0 auto;"></div>`;
        });
    },
    goBack: () => {
        const role = sessionStorage.getItem("userRole") || "STUDENT";
        let dashLink = "student_dashboard.html";
        if (role === 'ADMIN') dashLink = "admin_dashboard.html";
        if (role === 'STAFF') dashLink = "staff_dashboard.html";
        window.location.href = dashLink;
    },
    renderSidebar: (activeLink = '') => {
        const role = sessionStorage.getItem("userRole") || "STUDENT";
        const nav = document.getElementById("sidebar-nav");
        if (!nav) return;

        let links = [];
        if (role === 'STUDENT') {
            links = [
                { href: 'student_dashboard.html', icon: 'fa-house-user', text: 'Summary View' },
                { href: 'raise_complaint.html', icon: 'fa-circle-plus', text: 'Report Issue' },
                { href: 'profile.html', icon: 'fa-circle-user', text: 'My Profile' }
            ];
        } else if (role === 'ADMIN') {
            links = [
                { href: 'admin_dashboard.html', icon: 'fa-chart-simple', text: 'Dashboard' },
                { href: 'admin_dashboard.html', icon: 'fa-list-check', text: 'All Complaints' },
                { href: 'admin_dashboard.html', icon: 'fa-user-gear', text: 'Manage Staff' },
                { href: 'admin_dashboard.html', icon: 'fa-graduation-cap', text: 'Students' },
                { href: 'admin_dashboard.html', icon: 'fa-file-contract', text: 'Reports' },
                { href: 'profile.html', icon: 'fa-user-circle', text: 'My Profile' }
            ];
        } else if (role === 'STAFF') {
            links = [
                { href: 'staff_dashboard.html', icon: 'fa-clipboard-list', text: 'Service Desk' },
                { href: 'profile.html', icon: 'fa-circle-user', text: 'My Profile' }
            ];
        }

        nav.innerHTML = links.map(link => {
            const isDashboard = window.location.pathname.includes('admin_dashboard.html');
            const isSwitch = isDashboard && link.href.includes('admin_dashboard.html') && link.icon !== 'fa-user-circle';
            const switchTarget = link.text === 'Dashboard' ? 'dashboard' : 
                               link.text === 'All Complaints' ? 'complaints' : 
                               link.text === 'Manage Staff' ? 'staff' :
                               link.text === 'Students' ? 'students' : 
                               link.text === 'Reports' ? 'reports' : '';

            return `
                <a href="${link.href}" 
                   class="nav-item ${activeLink === link.href ? 'active' : ''}"
                   ${isSwitch ? `onclick="event.preventDefault(); switchView('${switchTarget}', this)"` : ''}>
                    <i class="fa-solid ${link.icon}"></i>
                    <span>${link.text}</span>
                </a>
            `;
        }).join('');
    }
};

// Global fallback for legacy onclick handlers
if (typeof window.toggleTheme !== 'function') {
    window.toggleTheme = () => UI.toggleTheme();
}
if (typeof window.logout !== 'function') {
    window.logout = () => UI.logout();
}

document.addEventListener('DOMContentLoaded', () => UI.initSidebar());
