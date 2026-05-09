import api from './api';

export const getCourses = (p) => api.get('/learning', { params: p });
export const getCourse = (id) => api.get(`/learning/${id}`);
export const createCourse = (d) => api.post('/learning', d);
export const enroll = (id) => api.post(`/learning/${id}/enroll`);
export const updateProgress = (id, d) => api.patch(`/learning/${id}/progress`, d);
export const getMyCourses = () => api.get('/learning/my-courses');