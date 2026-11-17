import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from './context/useAuth.js';

// Layout
import Sidebar from './components/Sidebar.jsx';
import Navbar from './components/Navbar.jsx';

// Authentication Pages
import Login from './pages/Auth/Login.jsx';
import Register from './pages/Auth/Register.jsx';
import PendingApproval from './pages/Auth/PendingApproval.jsx';
import AccountRejected from './pages/Auth/AccountRejected.jsx';
import AccountSuspended from './pages/Auth/AccountSuspended.jsx';
import AccountTerminated from './pages/Auth/AccountTerminated.jsx';
import Unauthorized from './pages/Auth/Unauthorized.jsx';
import ForgotPassword from './pages/Auth/ForgotPassword.jsx';
import ResetPassword from './pages/Auth/ResetPassword.jsx';
import VerifyEmail from './pages/Auth/VerifyEmail.jsx';
import VerifyEmailRequired from './pages/Auth/VerifyEmailRequired.jsx';
import OAuthCallback from './pages/Auth/OAuthCallback.jsx';
import ConfirmLink from './pages/Auth/ConfirmLink.jsx';
import SocialPending from './pages/Auth/SocialPending.jsx';

// Dashboard
import Dashboard from './components/Dashboard.jsx';

// HR Pages
import AttendanceTracker from './pages/Attendance/AttendanceTracker.jsx';
import ShiftScheduler from './pages/Attendance/ShiftScheduler.jsx';
import LeaveRequests from './pages/Leave/LeaveRequests.jsx';
import PayrollDashboard from './pages/Payroll/PayrollDashboard.jsx';
import EmployeeList from './pages/Employee/EmployeeList.jsx';
import EmployeeProfile from './pages/Employee/EmployeeProfile.jsx';
import PerformanceReview from './pages/Performance/PerformanceReview.jsx';
import TrainingModule from './pages/Learning/TrainingModules.jsx';
import CareerPathing from './pages/Career/CareerPathing.jsx';
import EngagementSurvey from './pages/Engagement/EngagementSurvey.jsx';
import WellnessDashboard from './pages/Wellness/WellnessDashboard.jsx';
import PolicyAcknowledgment from './pages/Compliance/PolicyAcknowledgment.jsx';
import OnboardingForm from './pages/Onboarding/OnboardingForm.jsx';
import OffboardingForm from './pages/Onboarding/OffboardingForm.jsx';
import HRAnalytics from './pages/Analytics/HRAnalytics.jsx';
import Notifications from './pages/Notifications/Notifications.jsx';

// Admin
import AdminPanel from './components/Admin/AdminPanel.jsx';

/* ==========================================================================
   Protected Route
========================================================================== */

function RequireAuth({ children, roles }) {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="spinner-center">
                <div className="spinner spinner-lg" />
            </div>
        );
    }

    if (!user) {
        return (
            <Navigate
                to="/login"
                state={{ from: location }}
                replace
            />
        );
    }

    if (roles && !roles.includes(user.role)) {
        return <Navigate to="/unauthorized" replace />;
    }

    return children;
}

/* ==========================================================================
   Application Layout
========================================================================== */

function AppLayout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    const handleMenuClick = () => {
        const isMobile = window.matchMedia('(max-width: 1024px)').matches;

        if (isMobile) {
            setSidebarOpen((prev) => !prev);
        } else {
            setSidebarCollapsed((prev) => !prev);
        }
    };

    return (
        <div
            className={`dashboard-shell
                ${sidebarCollapsed ? 'sidebar-collapsed' : ''}
                ${sidebarOpen ? 'sidebar-open' : ''}`}
        >
            <Sidebar
                open={sidebarOpen}
                collapsed={sidebarCollapsed}
                onClose={() => setSidebarOpen(false)}
            />

            {sidebarOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <div className="dashboard-main">
                <Navbar
                    onMenuClick={handleMenuClick}
                />

                <main className="dashboard-content">
                    {children}
                </main>
            </div>
        </div>
    );
}

/* ==========================================================================
   App
========================================================================== */

export default function App() {
    const { user } = useAuth();

    return (
        <Routes>

            {/* Public Routes */}

            <Route
                path="/login"
                element={
                    user
                        ? <Navigate to="/dashboard" replace />
                        : <Login />
                }
            />

            <Route
                path="/register"
                element={
                    user
                        ? <Navigate to="/dashboard" replace />
                        : <Register />
                }
            />

            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/verify-email/:token" element={<VerifyEmail />} />
            <Route path="/verify-email-required" element={<VerifyEmailRequired />} />
            <Route path="/oauth-callback" element={<OAuthCallback />} />
            <Route path="/confirm-link/:token" element={<ConfirmLink />} />
            <Route path="/social-pending" element={<SocialPending />} />

            <Route path="/pending-approval" element={<PendingApproval />} />
            <Route path="/account-rejected" element={<AccountRejected />} />
            <Route path="/account-suspended" element={<AccountSuspended />} />
            <Route path="/account-terminated" element={<AccountTerminated />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Authenticated */}

            <Route path="/dashboard" element={<RequireAuth><AppLayout><Dashboard /></AppLayout></RequireAuth>} />
            <Route path="/notifications" element={<RequireAuth><AppLayout><Notifications /></AppLayout></RequireAuth>} />

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

            {/* HR */}

            <Route
                path="/employees"
                element={
                    <RequireAuth roles={['admin', 'hr', 'manager']}>
                        <AppLayout>
                            <EmployeeList />
                        </AppLayout>
                    </RequireAuth>
                }
            />

            <Route
                path="/employees/:id"
                element={
                    <RequireAuth roles={['admin', 'hr', 'manager']}>
                        <AppLayout>
                            <EmployeeProfile />
                        </AppLayout>
                    </RequireAuth>
                }
            />

            <Route
                path="/analytics"
                element={
                    <RequireAuth roles={['admin', 'hr']}>
                        <AppLayout>
                            <HRAnalytics />
                        </AppLayout>
                    </RequireAuth>
                }
            />

            <Route
                path="/admin"
                element={
                    <RequireAuth roles={['admin']}>
                        <AppLayout>
                            <AdminPanel />
                        </AppLayout>
                    </RequireAuth>
                }
            />

            {/* Redirects */}

            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />

        </Routes>
    );
}