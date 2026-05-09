import api from './api';

export const initiate = (d) => api.post('/onboarding', d);
export const getMyOnboarding = () => api.get('/onboarding/me');
export const getAllOnboarding = () => api.get('/onboarding/all');
export const completeTask = (tid) => api.patch(`/onboarding/tasks/${tid}/complete`);