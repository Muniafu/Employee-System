import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

import {
  LayoutDashboard,
  Clock3,
  Plane,
  Wallet,
  Target,
  BookOpen,
  BriefcaseBusiness,
  Brain,
  HeartPulse,
  ShieldCheck,
  Rocket,
  Users,
  BarChart3,
  Settings,
  LogOut,
} from 'lucide-react';

const NAV = [
  {
    section: 'Main',
    roles: [
      'employee',
      'manager',
      'hr',
      'admin',
      'superuser',
    ],
    links: [
      {
        to: '/dashboard',
        icon: LayoutDashboard,
        label: 'Dashboard',
      },
      {
        to: '/attendance',
        icon: Clock3,
        label: 'Attendance',
      },
      {
        to: '/leave',
        icon: Plane,
        label: 'Leave',
      },
      {
        to: '/payroll',
        icon: Wallet,
        label: 'Payroll',
      },
    ],
  },

  {
    section: 'Development',
    roles: [
      'employee',
      'manager',
      'hr',
      'admin',
      'superuser',
    ],
    links: [
      {
        to: '/performance',
        icon: Target,
        label: 'Performance',
      },
      {
        to: '/learning',
        icon: BookOpen,
        label: 'Learning',
      },
      {
        to: '/career',
        icon: BriefcaseBusiness,
        label: 'Career',
      },
    ],
  },

  {
    section: 'Organisation',
    roles: [
      'employee',
      'manager',
      'hr',
      'admin',
      'superuser',
    ],
    links: [
      {
        to: '/engagement',
        icon: Brain,
        label: 'Engagement',
      },
      {
        to: '/wellness',
        icon: HeartPulse,
        label: 'Wellness',
      },
      {
        to: '/compliance',
        icon: ShieldCheck,
        label: 'Compliance',
      },
      {
        to: '/onboarding',
        icon: Rocket,
        label: 'Onboarding',
      },
    ],
  },

  {
    section: 'Administration',
    roles: ['admin', 'superuser', 'hr'],
    links: [
      {
        to: '/employees',
        icon: Users,
        label: 'Employees',
      },
      {
        to: '/analytics',
        icon: BarChart3,
        label: 'Analytics',
      },
      {
        to: '/admin',
        icon: Settings,
        label: 'Admin Panel',
      },
    ],
  },
];

export default function Sidebar({
  open,
  collapsed,
  onClose
}) {
  const { user, logout } = useAuth();

  const allNav = NAV.filter(section =>
    section.roles.includes(user?.role)
  );

  return (
    <>
      {open && (
        <div
          className="sidebar-overlay"
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,.4)',
            zIndex: 199
          }}
        />
      )}

      <aside
        className={`
          sidebar
          ${open ? 'mobile-open' : ''}
          ${collapsed ? 'collapsed' : ''}
        `}
      >
        {/* Brand */}
        <div className="sidebar-brand">
          <div className="brand-icon">E</div>

          <div className="brand-text">
            <h1>EMS</h1>
            <span>HR System v2</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {allNav.map(section => (
            <div
              key={section.section}
              className="nav-section"
            >
              <div className="nav-section-label">
                {section.section}
              </div>

              {section.links.map(link => {
                const Icon = link.icon;

                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    className={({ isActive }) =>
                      `nav-link${
                        isActive ? ' active' : ''
                      }`
                    }
                    onClick={onClose}
                  >
                    <span className="nav-icon">
                      <Icon size={18} />
                    </span>

                    {link.label}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 12px',
              borderRadius: 8,
              background: 'var(--surface-2)',
              marginBottom: 8
            }}
          >
            <div
              className="avatar"
              style={{ flexShrink: 0 }}
            >
              {user?.firstName?.[0]}
              {user?.lastName?.[0]}
            </div>

            <div
              style={{
                flex: 1,
                minWidth: 0
              }}
            >
              <div
                style={{
                  fontWeight: 600,
                  fontSize: 13,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {user?.firstName}{' '}
                {user?.lastName}
              </div>

              <div
                style={{
                  fontSize: 11,
                  color: 'var(--text-muted)',
                  textTransform: 'capitalize'
                }}
              >
                {user?.role}
              </div>
            </div>
          </div>

          <button
            className="nav-link"
            style={{
              color: 'var(--danger)',
              width: '100%'
            }}
            onClick={logout}
          >
            <span className="nav-icon">
              <LogOut size={18} />
            </span>

            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}