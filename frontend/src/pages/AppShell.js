import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Bookmark, Briefcase, BarChart2, User as UserIcon, LogOut,
  Bell, Menu, Compass,
} from 'lucide-react';
import { useAuth } from '../AuthContext';

const NAV = [
  { to: '/app/browse', label: 'Browse', icon: <Compass size={16} /> },
  { to: '/app/saved', label: 'Saved Jobs', icon: <Bookmark size={16} /> },
  { to: '/app/analytics', label: 'Analytics', icon: <BarChart2 size={16} /> },
  { to: '/app/profile', label: 'Profile', icon: <UserIcon size={16} /> },
];

export default function AppShell() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [open, setOpen] = useState(false);
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    const tick = () => setDateStr(new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }));
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => { setOpen(false); }, [loc.pathname]);

  const initials = (user?.name || user?.email || 'U').split(/[\s@]/).map((p) => p[0]).join('').slice(0, 2).toUpperCase();
  const headline = user?.profile?.headline || 'Operator';
  const breadcrumb = NAV.find((n) => loc.pathname.startsWith(n.to))?.label || 'Browse';

  return (
    <div className="app-layout" data-testid="app-shell">
      <aside className={`sidebar ${open ? 'open' : ''}`} data-testid="sidebar">
        <div className="sidebar-header">
          <div className="logo-mark" onClick={() => nav('/app/browse')} style={{ cursor: 'pointer' }}>
            <span className="logo-icon">⬡</span>
            <div className="logo-text">
              <span className="logo-name">CareerOS</span>
              <span className="logo-sub">v3.1.0</span>
            </div>
          </div>
        </div>
        <div className="profile-card" data-testid="sidebar-profile">
          <div className="avatar-wrapper">
            <div className="avatar-ring" />
            <div className="avatar font-mono">{initials}</div>
            <span className="status-dot online" />
          </div>
          <div className="profile-info">
            <h2 className="profile-name">{user?.name || user?.email}</h2>
            <p className="profile-role">{headline}</p>
            <div className="profile-tags"><span className="tag tag-amber">Open to Work</span></div>
          </div>
        </div>
        <nav className="sidebar-nav">
          <span className="nav-label">MODULES</span>
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button className="btn-ghost" style={{ width: '100%', justifyContent: 'flex-start' }} onClick={() => { logout(); nav('/'); }} data-testid="sidebar-logout-btn">
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <button className="mobile-menu-btn" onClick={() => setOpen(true)} aria-label="Menu" data-testid="topbar-menu-btn">
              <Menu size={20} />
            </button>
            <div className="page-breadcrumb" data-testid="topbar-breadcrumb">
              <span>{breadcrumb.toLowerCase().replace(/\s+/g, '_')}</span>
            </div>
          </div>
          <div className="topbar-right">
            <span className="topbar-datetime" data-testid="topbar-datetime">{dateStr}</span>
            <button className="notif-btn" aria-label="Notifications" data-testid="topbar-notif-btn">
              <Bell size={18} />
            </button>
          </div>
        </header>
        <Outlet />
      </main>
    </div>
  );
}
