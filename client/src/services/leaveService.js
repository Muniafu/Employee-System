import api from './api';

export const applyLeave = (d) => api.post('/leaves', d);
export const getLeaves = (P) => api.get('/leaves', { params: P });
export const getOnLeave = () => api.get(`/leaves/on-leave`);
export const approveLeave = (id, d) => api.patch(`/leaves/${id}/approve`, d);
export const rejectLeave = (id, d) => api.patch(`/leaves/${id}/reject`, d);
export const cancelLeave = (id) => api.delete(`/leaves/${id}/cancel`);