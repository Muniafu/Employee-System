import api from './api';

export const getPrograms = (p) => api.get('/wellness', { params: p });
export const getProgram = (id) => api.get(`/wellness/${id}`);
export const createProgram = (d) => api.post('/wellness', d);
export const enroll = (id) => api.post(`/wellness/${id}/enroll`);
export const complete = (id, d) => api.patch(`/wellness/${id}/complete`, d);