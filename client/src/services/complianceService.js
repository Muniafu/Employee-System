import api from './api';

export const getItems = (P) => api.get('/compliance', { params: P });
export const getItem = (id) => api.get(`/compliance/${id}`);
export const createItem = (d) => api.post('/compliance', d);
export const acknowledge = (id, d) => api.post(`/compliance/${id}/acknowledge`, d);
export const getStatus = (id) => api.get(`/compliance/${id}/status`);
export const updateItem = (id, d) => api.put(`/compliance/${id}`, d);