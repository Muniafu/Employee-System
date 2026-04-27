import { Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from './context/AuthContext';

import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

// Pages
import Login from './pages/Auth/Login';
import EmployeeList from './pages/Employee/EmployeeList';
import EmployeeProfile from './pages/Employee/EmployeeProfile';
import OnboardingForm from './pages/Onboarding/OnboardingForm';
import OffboardingForm from './pages/Onboarding/OffboardingForm';
import AttendanceTracker from './pages/Attendance/AttendanceTracker';
import ShiftScheduler from './pages/Attendance/ShiftScheduler';
import LeaveRequests from './pages/Leave/LeaveRequests';
import PayrollDashboard from './pages/Payroll/PayrollDashboard';
import PolicyAcknowledgment from './pages/Compliance/PolicyAcknowledgment';
import PerformanceReview from './pages/Performance/PerformanceReview';
import TrainingModules from './pages/Learning/TrainingModules';
import CareerPathing from './pages/Career/CareerPathing';
import EngagementSurvey from './pages/Engagement/EngagementSurvey';
import HRAnalytics from './pages/Analytics/HRAnalytics';
import WellnessDashboard from './pages/Wellness/WellnessDashboard';

const ProtectedRoute = ({ roles, children }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <p>Loading...</p>;
  if (!user) return <Navigate to="/login" />;

  if (roles && !roles.includes(user.role))
    return <Navigate to="/unauthorized" />;

  return children;
};

const Layout = ({ children }) => (
  <div className="layout">
    <Navbar />
    <div className="layout-body">
      <Sidebar />
      <main className="main-content">{children}</main>
    </div>
  </div>
);

function App() {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <p>Loading...</p>;

  return (
    <Routes>

      {/* Login Route */}
      <Route
        path="/login"
        element={
          user ? <Navigate to="/dashboard" replace /> : <Login />
        }
      />

      {/* Default Redirect */}
      <Route
        path="/"
        element={
          user ? <Navigate to="/dashboard" replace />
               : <Navigate to="/login" replace />
        }
      />

      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <HRAnalytics />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/employees"
        element={
          <ProtectedRoute roles={['admin', 'employer']}>
            <Layout>
              <EmployeeList />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Layout>
              <EmployeeProfile />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/onboarding"
        element={
          <ProtectedRoute roles={['admin', 'employer']}>
            <Layout>
              <OnboardingForm />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/offboarding"
        element={
          <ProtectedRoute roles={['admin', 'employer']}>
            <Layout>
              <OffboardingForm />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/attendance"
        element={
          <ProtectedRoute>
            <Layout>
              <AttendanceTracker />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/shifts"
        element={
          <ProtectedRoute roles={['admin', 'employer']}>
            <Layout>
              <ShiftScheduler />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/leave"
        element={
          <ProtectedRoute>
            <Layout>
              <LeaveRequests />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/payroll"
        element={
          <ProtectedRoute>
            <Layout>
              <PayrollDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/compliance"
        element={
          <ProtectedRoute>
            <Layout>
              <PolicyAcknowledgment />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/performance"
        element={
          <ProtectedRoute>
            <Layout>
              <PerformanceReview />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/learning"
        element={
          <ProtectedRoute>
            <Layout>
              <TrainingModules />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/career"
        element={
          <ProtectedRoute>
            <Layout>
              <CareerPathing />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/engagement"
        element={
          <ProtectedRoute>
            <Layout>
              <EngagementSurvey />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/wellness"
        element={
          <ProtectedRoute>
            <Layout>
              <WellnessDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route path="/unauthorized" element={<h2>Unauthorized Access</h2>} />
      <Route path="*" element={<h2>Page Not Found</h2>} />

    </Routes>
  );
}

export default App;