import api from './api';

const analyticsService = {
  getDashboardStats: () =>
    api.get('/analytics/dashboard'),

  getAttendanceStats: () =>
    api.get('/analytics/attendance'),

  getPayrollStats: () =>
    api.get('/analytics/payroll')
};

export default analyticsService;