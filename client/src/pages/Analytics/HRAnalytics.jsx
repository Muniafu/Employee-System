import { useEffect, useState } from 'react';
import analyticsService from '../../services/analyticsService';

const HRAnalytics = () => {
  const [dashboard, setDashboard] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [payroll, setPayroll] = useState(null);

  useEffect(() => {
    Promise.all([
      analyticsService.getDashboardStats(),
      analyticsService.getAttendanceStats(),
      analyticsService.getPayrollStats()
    ]).then(([d, a, p]) => {
      setDashboard(d.data.data);
      setAttendance(a.data.data);
      setPayroll(p.data.data);
    });
  }, []);

  if (!dashboard) return <p>Loading...</p>;

  return (
    <div>
      <h2>HR Analytics</h2>

      <h3>Total Employees: {dashboard.totalEmployees}</h3>
      <h3>Attendance Rate: {dashboard.attendanceRate}%</h3>

      <h3>Avg Work Hours: {attendance?.avgHours?.toFixed(2)}</h3>
      <h3>Total Payroll: ${payroll?.totalPayroll}</h3>
      <h3>Avg Salary: ${payroll?.avgSalary}</h3>
    </div>
  );
};

export default HRAnalytics;