import api from './api';

const employeeService = {
  getAll: (params) => api.get('/employees', { params }),

  getById: (id) => api.get(`/employees/${id}`),

  create: (data) => api.post('/employees', data),

  update: (id, data) => api.put(`/employees/${id}`, data),

  delete: (id) => api.delete(`/employees/${id}`),

  getProfile: () => api.get('/employees/me')
};

export default employeeService;