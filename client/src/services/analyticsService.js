import api from './api';

export const getDashboard = (p) => api.get('/analytics/dashboard', { params: p });
export const getAttendanceStats = (p) => api.get('/analytics/attendance', { params: p });
export const getPayrollStats = (p) => api.get('/analytics/payroll', { params: p });
export const getHeadcount = () => api.get('/analytics/headcount');
export const getLeaveStats = (p) => api.get('/analytics/leave', { params: p });
export const getTurnover = () => api.get('/analytics/turnover');