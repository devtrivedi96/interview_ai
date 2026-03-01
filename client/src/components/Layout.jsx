import { Outlet, Link, NavLink, useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import {
  BarChart3, BookOpen, LayoutDashboard, Lightbulb,
  LogOut, Menu, Mic, User, X, ChevronRight,
} from "lucide-react";
import { useState } from "react";

const STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap');

  :root {
    --bg:          #f7f5f2;
    --surface:     #ffffff;
    --surface-2:   #f0ede8;
    --border:      #e8e3db;
    --text-1:      #1a1714;
    --text-2:      #6b6560;
    --text-3:      #a09890;
    --accent:      #d4622a;
    --accent-soft: #fde8dc;
    --accent-2:    #2a6dd4;
    --shadow-sm:   0 1px 3px rgba(26,23,20,.06), 0 1px 2px rgba(26,23,20,.04);
    --shadow-md:   0 4px 16px rgba(26,23,20,.08), 0 2px 6px rgba(26,23,20,.04);
    --shadow-lg:   0 12px 40px rgba(26,23,20,.10), 0 4px 12px rgba(26,23,20,.06);
    --radius:      14px;
    --radius-sm:   8px;
    --sidebar-w:   260px;
    --font-display: 'Syne', sans-serif;
    --font-body:    'DM Sans', sans-serif;
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: var(--font-body);
    font-size: 15px;
    background: var(--bg);
    color: var(--text-1);
    -webkit-font-smoothing: antialiased;
  }

  /* ── Shell ── */
  .shell {
    display: flex;
    min-height: 100vh;
    background: var(--bg);
  }

  /* ── Sidebar ── */
  .sidebar {
    position: fixed;
    top: 0; left: 0; bottom: 0;
    width: var(--sidebar-w);
    background: var(--surface);
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    z-index: 30;
    transition: transform .3s cubic-bezier(.4,0,.2,1);
  }
  .sidebar.mobile-hidden {
    transform: translateX(-100%);
  }
  @media (max-width: 900px) {
    .sidebar { transform: translateX(-100%); }
    .sidebar.mobile-open { transform: translateX(0); box-shadow: var(--shadow-lg); }
  }

  /* Logo */
  .sidebar-logo {
    height: 64px;
    padding: 0 20px;
    display: flex;
    align-items: center;
    gap: 10px;
    border-bottom: 1px solid var(--border);
    text-decoration: none;
    flex-shrink: 0;
  }
  .logo-icon {
    width: 34px; height: 34px;
    background: linear-gradient(135deg, var(--accent) 0%, #e8864a 100%);
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    color: #fff;
    box-shadow: 0 4px 12px rgba(212,98,42,.3);
    flex-shrink: 0;
  }
  .logo-text {
    font-family: var(--font-display);
    font-size: 16px;
    font-weight: 800;
    letter-spacing: -.03em;
    color: var(--text-1);
  }
  .logo-text span { color: var(--accent); }

  /* Nav */
  .sidebar-nav {
    flex: 1;
    padding: 16px 12px;
    display: flex;
    flex-direction: column;
    gap: 2px;
    overflow-y: auto;
  }
  .nav-section-label {
    font-size: 9.5px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .14em;
    color: var(--text-3);
    padding: 12px 10px 6px;
    margin-top: 4px;
  }
  .nav-link {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 12px;
    border-radius: var(--radius-sm);
    font-size: 13.5px;
    font-weight: 500;
    color: var(--text-2);
    text-decoration: none;
    transition: background .15s, color .15s;
    position: relative;
  }
  .nav-link:hover {
    background: var(--surface-2);
    color: var(--text-1);
  }
  .nav-link.active {
    background: var(--accent-soft);
    color: var(--accent);
    font-weight: 600;
  }
  .nav-link.active .nav-icon { color: var(--accent); }
  .nav-icon {
    width: 30px; height: 30px;
    border-radius: 7px;
    display: flex; align-items: center; justify-content: center;
    background: transparent;
    color: var(--text-3);
    flex-shrink: 0;
    transition: background .15s, color .15s;
  }
  .nav-link:hover .nav-icon {
    background: var(--border);
    color: var(--text-1);
  }
  .nav-link.active .nav-icon {
    background: rgba(212,98,42,.15);
    color: var(--accent);
  }
  .nav-active-dot {
    display: none;
    width: 6px; height: 6px;
    border-radius: 50%;
    background: var(--accent);
    margin-left: auto;
  }
  .nav-link.active .nav-active-dot { display: block; }

  /* Sidebar footer */
  .sidebar-footer {
    padding: 16px 12px;
    border-top: 1px solid var(--border);
    flex-shrink: 0;
  }
  .user-card {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px;
    border-radius: var(--radius-sm);
    background: var(--surface-2);
    margin-bottom: 10px;
  }
  .user-avatar {
    width: 32px; height: 32px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--accent) 0%, #e8864a 100%);
    display: flex; align-items: center; justify-content: center;
    color: #fff;
    font-family: var(--font-display);
    font-size: 13px;
    font-weight: 700;
    flex-shrink: 0;
  }
  .user-email {
    font-size: 12px;
    color: var(--text-2);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
    min-width: 0;
  }
  .logout-btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 9px 14px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--text-2);
    font-family: var(--font-body);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: background .15s, color .15s, border-color .15s;
  }
  .logout-btn:hover {
    background: #fde8dc;
    color: var(--accent);
    border-color: rgba(212,98,42,.25);
  }

  /* ── Main content ── */
  .main-wrap {
    flex: 1;
    margin-left: var(--sidebar-w);
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: 100vh;
  }
  @media (max-width: 900px) {
    .main-wrap { margin-left: 0; }
  }

  /* Mobile topbar */
  .topbar {
    display: none;
    height: 60px;
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    padding: 0 16px;
    align-items: center;
    justify-content: space-between;
    position: sticky;
    top: 0;
    z-index: 20;
    flex-shrink: 0;
  }
  @media (max-width: 900px) { .topbar { display: flex; } }

  .topbar-logo {
    display: flex;
    align-items: center;
    gap: 8px;
    text-decoration: none;
  }
  .topbar-logo-icon {
    width: 28px; height: 28px;
    background: linear-gradient(135deg, var(--accent) 0%, #e8864a 100%);
    border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    color: #fff;
  }
  .topbar-logo-text {
    font-family: var(--font-display);
    font-size: 15px;
    font-weight: 800;
    letter-spacing: -.03em;
    color: var(--text-1);
  }
  .menu-btn {
    width: 36px; height: 36px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border);
    background: var(--surface);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    color: var(--text-2);
    transition: background .15s;
  }
  .menu-btn:hover { background: var(--surface-2); }

  /* Mobile overlay */
  .mobile-overlay {
    display: none;
    position: fixed;
    inset: 0;
    z-index: 29;
    background: rgba(26,23,20,.35);
    backdrop-filter: blur(2px);
    animation: fadeIn .2s ease;
  }
  .mobile-overlay.visible { display: block; }
  @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }

  /* Page content */
  .page-content {
    flex: 1;
    overflow-y: auto;
  }

  /* ── Public layout (unauthenticated) ── */
  .pub-shell { display: flex; flex-direction: column; min-height: 100vh; background: var(--bg); }

  .pub-header {
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    position: sticky;
    top: 0;
    z-index: 20;
    box-shadow: var(--shadow-sm);
  }
  .pub-header-inner {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 24px;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .pub-logo {
    display: flex;
    align-items: center;
    gap: 10px;
    text-decoration: none;
  }
  .pub-logo-text {
    font-family: var(--font-display);
    font-size: 17px;
    font-weight: 800;
    letter-spacing: -.03em;
    color: var(--text-1);
  }
  .pub-logo-text span { color: var(--accent); }

  .pub-nav { display: flex; align-items: center; gap: 8px; }
  .pub-login {
    padding: 8px 16px;
    border-radius: var(--radius-sm);
    font-size: 13.5px;
    font-weight: 600;
    color: var(--text-2);
    text-decoration: none;
    font-family: var(--font-body);
    transition: color .15s;
  }
  .pub-login:hover { color: var(--accent); }
  .pub-cta {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 9px 18px;
    border-radius: var(--radius-sm);
    background: var(--accent);
    color: #fff;
    font-family: var(--font-display);
    font-size: 13px;
    font-weight: 700;
    letter-spacing: -.01em;
    text-decoration: none;
    box-shadow: 0 4px 12px rgba(212,98,42,.3);
    transition: background .15s, transform .15s, box-shadow .15s;
  }
  .pub-cta:hover {
    background: #c2571f;
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(212,98,42,.4);
  }
  .pub-main { flex: 1; }
`

const navItems = [
  { to: "/dashboard",   label: "Dashboard",   icon: LayoutDashboard },
  { to: "/interview",   label: "Interview",   icon: Mic },
  { to: "/analytics",  label: "Analytics",   icon: BarChart3 },
  { to: "/suggestions", label: "Suggestions", icon: Lightbulb },
  { to: "/preparation", label: "Preparation", icon: BookOpen },
  { to: "/profile",    label: "Profile",     icon: User },
]

function SidebarContent({ user, onNavClick, onLogout }) {
  const initial = user?.email?.[0]?.toUpperCase() || 'U'

  return (
    <>
      <Link to="/dashboard" className="sidebar-logo" onClick={onNavClick}>
        <div className="logo-icon"><Mic size={16} /></div>
        <span className="logo-text">Interview<span>.</span>AI</span>
      </Link>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Main</div>
        {navItems.slice(0, 3).map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            onClick={onNavClick}
          >
            <span className="nav-icon"><Icon size={15} /></span>
            {label}
            <span className="nav-active-dot" />
          </NavLink>
        ))}

        <div className="nav-section-label">Tools</div>
        {navItems.slice(3).map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            onClick={onNavClick}
          >
            <span className="nav-icon"><Icon size={15} /></span>
            {label}
            <span className="nav-active-dot" />
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-card">
          <div className="user-avatar">{initial}</div>
          <span className="user-email">{user?.email || 'User'}</span>
        </div>
        <button className="logout-btn" onClick={onLogout}>
          <LogOut size={14} />
          Sign out
        </button>
      </div>
    </>
  )
}

export default function Layout() {
  const { isAuthenticated, user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const handleLogout = () => { logout(); navigate("/login") }

  if (!isAuthenticated) {
    return (
      <>
        <style>{STYLE}</style>
        <div className="pub-shell">
          <header className="pub-header">
            <div className="pub-header-inner">
              <Link to="/" className="pub-logo">
                <div className="logo-icon" style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg, #d4622a 0%, #e8864a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 4px 12px rgba(212,98,42,.3)' }}>
                  <Mic size={15} />
                </div>
                <span className="pub-logo-text">Interview<span>.</span>AI</span>
              </Link>
              <nav className="pub-nav">
                <Link to="/login" className="pub-login">Sign in</Link>
                <Link to="/register" className="pub-cta">
                  Get Started <ChevronRight size={14} />
                </Link>
              </nav>
            </div>
          </header>
          <main className="pub-main"><Outlet /></main>
        </div>
      </>
    )
  }

  return (
    <>
      <style>{STYLE}</style>
      <div className="shell">

        {/* Sidebar */}
        <aside className={`sidebar${open ? ' mobile-open' : ''}`}>
          <SidebarContent
            user={user}
            onNavClick={() => setOpen(false)}
            onLogout={handleLogout}
          />
        </aside>

        {/* Mobile overlay */}
        <div
          className={`mobile-overlay${open ? ' visible' : ''}`}
          onClick={() => setOpen(false)}
        />

        {/* Main */}
        <div className="main-wrap">
          {/* Mobile topbar */}
          <header className="topbar">
            <Link to="/dashboard" className="topbar-logo">
              <div className="topbar-logo-icon"><Mic size={14} /></div>
              <span className="topbar-logo-text">Interview AI</span>
            </Link>
            <button className="menu-btn" onClick={() => setOpen(true)}>
              <Menu size={18} />
            </button>
          </header>

          <main className="page-content">
            <Outlet />
          </main>
        </div>

      </div>
    </>
  )
}