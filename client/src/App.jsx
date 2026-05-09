import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from './context/useAuth.js';

// Layout
import Sidebar from './components/Sidebar.jsx';
import Navbar  from './components/Navbar.jsx';

// Auth
import Login from './pages/Auth/Login.jsx';

// Pages
import Dashboard          from './components/Dashboard.jsx';
import AttendanceTracker  from './pages/Attendance/AttendanceTracker.jsx';
import ShiftScheduler     from './pages/Attendance/ShiftScheduler.jsx';
import LeaveRequests      from './pages/Leave/LeaveRequests.jsx';
import PayrollDashboard   from './pages/Payroll/PayrollDashboard.jsx';
import EmployeeList       from './pages/Employee/EmployeeList.jsx';
import EmployeeProfile    from './pages/Employee/EmployeeProfile.jsx';
import PerformanceReview  from './pages/Performance/PerformanceReview.jsx';
import TrainingModule     from './pages/Learning/TrainingModules.jsx';
import CareerPathing      from './pages/Career/CareerPathing.jsx';
import EngagementSurvey   from './pages/Engagement/EngagementSurvey.jsx';
import WellnessDashboard  from './pages/Wellness/WellnessDashboard.jsx';
import PolicyAcknowledgment from './pages/Compliance/PolicyAcknowledgment.jsx';
import OnboardingForm     from './pages/Onboarding/OnboardingForm.jsx';
import OffboardingForm    from './pages/Onboarding/OffboardingForm.jsx';
import HRAnalytics        from './pages/Analytics/HRAnalytics.jsx';
import AdminPanel         from './components/Admin/AdminPanel.jsx';

/* ─── Protected route wrapper ───────────────────────────── */
function RequireAuth({ children, roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="spinner-center"><div className="spinner spinner-lg" /></div>;
  if (!user)   return <Navigate to="/login" state={{ from: location }} replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

/* ─── Main layout wrapper ───────────────────────────────── */
function AppLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="app-layout">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-area">
        <Navbar onMenuClick={() => setSidebarOpen(s => !s)} />
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}

/* ─── App ────────────────────────────────────────────────── */
export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />

      {/* All authenticated */}
      <Route path="/dashboard" element={<RequireAuth><AppLayout><Dashboard /></AppLayout></RequireAuth>} />
      <Route path="/attendance" element={<RequireAuth><AppLayout><AttendanceTracker /></AppLayout></RequireAuth>} />
      <Route path="/attendance/shifts" element={<RequireAuth><AppLayout><ShiftScheduler /></AppLayout></RequireAuth>} />
      <Route path="/leave" element={<RequireAuth><AppLayout><LeaveRequests /></AppLayout></RequireAuth>} />
      <Route path="/payroll" element={<RequireAuth><AppLayout><PayrollDashboard /></AppLayout></RequireAuth>} />
      <Route path="/performance" element={<RequireAuth><AppLayout><PerformanceReview /></AppLayout></RequireAuth>} />
      <Route path="/learning" element={<RequireAuth><AppLayout><TrainingModule /></AppLayout></RequireAuth>} />
      <Route path="/career" element={<RequireAuth><AppLayout><CareerPathing /></AppLayout></RequireAuth>} />
      <Route path="/engagement" element={<RequireAuth><AppLayout><EngagementSurvey /></AppLayout></RequireAuth>} />
      <Route path="/wellness" element={<RequireAuth><AppLayout><WellnessDashboard /></AppLayout></RequireAuth>} />
      <Route path="/compliance" element={<RequireAuth><AppLayout><PolicyAcknowledgment /></AppLayout></RequireAuth>} />
      <Route path="/onboarding" element={<RequireAuth><AppLayout><OnboardingForm /></AppLayout></RequireAuth>} />
      <Route path="/offboarding" element={<RequireAuth><AppLayout><OffboardingForm /></AppLayout></RequireAuth>} />
      <Route path="/profile" element={<RequireAuth><AppLayout><EmployeeProfile /></AppLayout></RequireAuth>} />

      {/* Admin / HR / Manager */}
      <Route path="/employees" element={<RequireAuth roles={['admin','superuser','hr','manager']}><AppLayout><EmployeeList /></AppLayout></RequireAuth>} />
      <Route path="/employees/:id" element={<RequireAuth roles={['admin','superuser','hr','manager']}><AppLayout><EmployeeProfile /></AppLayout></RequireAuth>} />
      <Route path="/analytics" element={<RequireAuth roles={['admin','superuser','hr']}><AppLayout><HRAnalytics /></AppLayout></RequireAuth>} />
      <Route path="/admin" element={<RequireAuth roles={['admin','superuser']}><AppLayout><AdminPanel /></AppLayout></RequireAuth>} />

      {/* Fallback */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}