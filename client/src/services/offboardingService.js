import api from './api';

export const initiateOffboarding = (data) => api.post('/offboarding', data);
export const getMyOffboarding = () => api.get('/offboarding/me');
export const getAllOffboarding = () => api.get('/offboarding/all');
export const completeMyTask = (taskId) => api.patch(`/offboarding/tasks/${taskId}/complete`);
export const completeEmployeeTask = (employeeId, taskId) => api.patch(`/offboarding/${employeeId}/tasks/${taskId}/complete`);
export const revokeAccess = (employeeId) => api.patch(`/offboarding/${employeeId}/revoke-access`);
export const approveOffboarding = (employeeId) => api.patch(`/offboarding/${employeeId}/approve`);