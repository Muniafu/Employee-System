import api from './api';

export const clockIn  = (data) => api.post('/attendance/clock-in', data);
export const clockOut = (data) => api.post('/attendance/clock-out', data);
export const getMyAttendance = (params) => api.get('/attendance/me', { params });
export const getTodayStatus  = () => api.get('/attendance/today');
export const getAllAttendance = (params) => api.get('/attendance/all', { params });