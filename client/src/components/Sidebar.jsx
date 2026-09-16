import { NavLink } from "react-router-dom";
import { useAuth } from "../context/useAuth";

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
  PackageMinus,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Building2,
} from "lucide-react";

const ALL_ROLES = ["employee", "manager", "hr", "admin", "superuser"];
const PRIVILEGED = ["admin", "hr", "superuser"];

/**
 * IMPORTANT: `roles` here must mirror the `roles` prop passed to
 * <RequireAuth> for the matching route in App.jsx. If a role can't
 * see a link, they shouldn't be able to open the route either — and
 * vice versa, a route that allows a role should surface a link for it.
 */
const NAVIGATION = [
  {
    section: "Main",
    links: [
      { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard", roles: ALL_ROLES },
      { to: "/attendance", icon: Clock3, label: "Attendance", roles: ALL_ROLES },
      { to: "/leave", icon: Plane, label: "Leave", roles: ALL_ROLES },
      { to: "/payroll", icon: Wallet, label: "Payroll", roles: ALL_ROLES },
    ],
  },

  {
    section: "Development",
    links: [
      { to: "/performance", icon: Target, label: "Performance", roles: ALL_ROLES },
      { to: "/learning", icon: BookOpen, label: "Learning", roles: ALL_ROLES },
      { to: "/career", icon: BriefcaseBusiness, label: "Career", roles: ALL_ROLES },
    ],
  },

  {
    section: "Organisation",
    links: [
      { to: "/engagement", icon: Brain, label: "Engagement", roles: ALL_ROLES },
      { to: "/wellness", icon: HeartPulse, label: "Wellness", roles: ALL_ROLES },
      { to: "/compliance", icon: ShieldCheck, label: "Compliance", roles: ALL_ROLES },
      // Self-service for everyone (own onboarding/offboarding); the pages
      // themselves further branch admin/hr/manager views internally.
      { to: "/onboarding", icon: Rocket, label: "Onboarding", roles: ALL_ROLES },
      { to: "/offboarding", icon: PackageMinus, label: "Offboarding", roles: ALL_ROLES },
    ],
  },

  {
    section: "Administration",
    links: [
      // Matches App.jsx: roles={['admin','superuser','hr','manager']}
      { to: "/employees", icon: Users, label: "Employees", roles: ["admin", "superuser", "hr", "manager"] },
      // Matches App.jsx: roles={['admin','superuser','hr']}
      { to: "/analytics", icon: BarChart3, label: "Analytics", roles: PRIVILEGED },
      // Matches App.jsx: roles={['admin','superuser']} — NOT hr
      { to: "/admin", icon: Settings, label: "Admin Panel", roles: ["admin", "superuser"] },
    ],
  },
];

export default function Sidebar({
  open,
  collapsed,
  onClose,
}) {
  const { user, logout } = useAuth();

  const role = (user?.role || "").toLowerCase();

  // Build sections filtered link-by-link, then drop any section left empty.
  const sections = NAVIGATION
    .map((section) => ({
      ...section,
      links: section.links.filter((link) => link.roles.includes(role)),
    }))
    .filter((section) => section.links.length > 0);

  return (
    <>
      {open && (
        <div
          className="sidebar-overlay"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={[
          "sidebar",
          collapsed && "sidebar-collapsed",
          open && "sidebar-open"
        ]
        .filter(Boolean).join(" ")
      }
      >
        {/* Brand */}

        <div className="sidebar-brand">
          <div className="brand-icon">
            <Building2 size={22} />
          </div>

          <div className="sidebar-brand-text">
            <h1>EMS</h1>

            <span>
              Unified HR System
            </span>
          </div>
        </div>

        {/* Navigation */}

        <nav className="sidebar-nav">
          {sections.map((section) => (
            <section
              key={section.section}
              className="nav-section"
            >
              <div className="nav-section-title">
                {section.section}
              </div>

              {section.links.map((link) => {
                const Icon = link.icon;

                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    onClick={onClose}
                    className={({ isActive }) =>
                      isActive
                        ? "nav-link active"
                        : "nav-link"
                    }
                  >
                    <span className="nav-icon">
                      <Icon size={18} />
                    </span>

                    <span className="nav-text">
                      {link.label}
                    </span>
                  </NavLink>
                );
              })}
            </section>
          ))}
        </nav>

        {/* Footer */}

        <footer className="sidebar-footer">
          <div className="sidebar-user">
            <div className="avatar">
              {user?.firstName?.[0]}
              {user?.lastName?.[0]}
            </div>

            <div className="sidebar-user-details">
              <div className="sidebar-user-name">
                {user?.firstName}{" "}
                {user?.lastName}
              </div>

              <div className="sidebar-user-role">
                {user?.role}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            className="nav-link nav-link-danger"
          >
            <span className="nav-icon">
              <LogOut size={18} />
            </span>

            <span className="nav-text">
              Sign Out
            </span>
          </button>
        </footer>
      </aside>
    </>
  );
}