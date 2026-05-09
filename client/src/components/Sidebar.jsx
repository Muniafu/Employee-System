import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

const NAV = [
  { section: 'Main', links: [
    { to: '/dashboard',   icon: '📊', label: 'Dashboard' },
    { to: '/attendance',  icon: '⏱️', label: 'Attendance' },
    { to: '/leave',       icon: '🏖️', label: 'Leave' },
    { to: '/payroll',     icon: '💰', label: 'Payroll' },
  ]},
  { section: 'Development', links: [
    { to: '/performance', icon: '🎯', label: 'Performance' },
    { to: '/learning',    icon: '📚', label: 'Learning' },
    { to: '/career',      icon: '🗂️', label: 'Career' },
  ]},
  { section: 'Organisation', links: [
    { to: '/engagement',  icon: '🧠', label: 'Engagement' },
    { to: '/wellness',    icon: '💪', label: 'Wellness' },
    { to: '/compliance',  icon: '📋', label: 'Compliance' },
    { to: '/onboarding',  icon: '🚀', label: 'Onboarding' },
  ]},
];

const ADMIN_NAV = [
  { section: 'Admin', links: [
    { to: '/employees',   icon: '👥', label: 'Employees' },
    { to: '/analytics',   icon: '📈', label: 'Analytics' },
    { to: '/admin',       icon: '⚙️', label: 'Admin Panel' },
  ]},
];

export default function Sidebar({ open, onClose }) {
  const { user, logout, isHR } = useAuth();
  // const navigate = useNavigate();

  const allNav = isHR ? [...NAV, ...ADMIN_NAV] : NAV;

  return (
    <>
      {open && <div className="sidebar-overlay" onClick={onClose} style={{ position:'fixed',inset:0,background:'rgba(0,0,0,.4)',zIndex:199 }} />}
      <aside className={`sidebar ${open ? 'mobile-open' : ''}`}>
        {/* Brand */}
        <div className="sidebar-brand">
          <div className="brand-icon">E</div>
          <div className="brand-text">
            <h1>EMS</h1>
            <span>HR System v2</span>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, overflowY:'auto', padding:'8px 0' }}>
          {allNav.map(section => (
            <div key={section.section} className="nav-section">
              <div className="nav-section-label">{section.section}</div>
              {section.links.map(link => (
                <NavLink
                  key={link.to} to={link.to}
                  className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                  onClick={onClose}
                >
                  <span className="nav-icon">{link.icon}</span>
                  {link.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* User footer */}
        <div style={{ padding:'12px', borderTop:'1px solid var(--border)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:8, background:'var(--surface-2)', marginBottom:8 }}>
            <div className="avatar" style={{ flexShrink:0 }}>
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontWeight:600, fontSize:13, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.firstName} {user?.lastName}</div>
              <div style={{ fontSize:11, color:'var(--text-muted)', textTransform:'capitalize' }}>{user?.role}</div>
            </div>
          </div>
          <button className="nav-link" style={{ color:'var(--danger)', width:'100%' }} onClick={logout}>
            <span className="nav-icon">🚪</span> Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}