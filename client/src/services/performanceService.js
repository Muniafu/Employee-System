import api from './api';

const performanceService = {
  getAll: () =>
    api.get('/performance'),

  getMy: () =>
    api.get('/performance/me'),

  getByEmployee: (employeeId) =>
    api.get(`/performance/employee/${employeeId}`),

  createReview: (data) =>
    api.post('/performance', data),

  updateReview: (id, data) =>
    api.put(`/performance/${id}`, data)
};

export default performanceService;