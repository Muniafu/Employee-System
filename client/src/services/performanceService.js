import api from './api';

export const createReview = (d) => api.post('/performance', d);
export const getReviews = (P) => api.get('/performance', { params: P });
export const getReview = (id) => api.get(`/performance/${id}`);
export const submitReview = (id, d) => api.patch(`/performance/${id}/submit`, d);
export const reviewEmployee = (id, d) => api.patch(`/performance/${id}/review`, d);
export const updateGoals = (id, d) => api.put(`/performance/${id}/goals`, d);