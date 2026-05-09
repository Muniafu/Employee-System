import api from './api';

export const createSurvey = (d) => api.post('/engagement', d);
export const getSurveys = (P) => api.get('/engagement', { params: P });
export const getSurvey = (id) => api.get(`/engagement/${id}`);
export const submitResponse = (id, d) => api.post(`/engagement/${id}/submit`, d);
export const getResults = (id) => api.get(`/engagement/${id}/results`);