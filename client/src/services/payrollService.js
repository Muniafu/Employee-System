import api from './api';

export const previewPayroll = (d) => api.post('/payroll/preview', d);
export const finalizePayroll = (d) => api.post('/payroll/finalize', d);
export const getMyPayroll = () => api.get('/payroll/me');
export const getAllPayroll = (P) => api.get('/payroll/all', { params: P });
export const getPayroll = (id) => api.get(`/payroll/${id}`);