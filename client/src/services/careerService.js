import api from './api';

export const createPath = (d) => api.post('/career', d);
export const getPaths = (P) => api.get('/career', { params: P });
export const getPath = (id) => api.get(`/career/${id}`);
export const updatePath = (id, d) => api.put(`/career/${id}`, d);
export const completeMilestone = (id, mid) => api.patch(`/career/${id}/milestones/${mid}/complete`);
export const flagSuccession = (id) => api.patch(`/career/${id}/succession/flag-succession`);