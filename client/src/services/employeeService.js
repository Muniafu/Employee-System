import api from './api';

export const getEmployees = (params) => api.get('/employees', { params });
export const getEmployee = (id) => api.get(`/employees/${id}`);
export const getMyProfile = () => api.get('/employees/me');
export const updateEmployee = (id, d) => api.put(`/employees/${id}`, d);
export const deactivateEmployee = (id) => api.patch(`/employees/${id}/deactivate`);
export const deleteEmployee = (id) => api.delete(`/employees/${id}`);