import api from './api';

const careerService = {
  getPaths: () =>
    api.get('/career'),

  getMyPath: () =>
    api.get('/career/me'),

  getByEmployee: (employeeId) =>
    api.get(`/career/employee/${employeeId}`),

  updatePath: (id, data) =>
    api.put(`/career/${id}`, data)
};

export default careerService;