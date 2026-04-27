import api from './api';

const onboardingService = {
  getAll: () => api.get('/onboarding'),

  getByEmployee: (employeeId) =>
    api.get(`/onboarding/employee/${employeeId}`),

  create: (data) => api.post('/onboarding', data),

  update: (id, data) => api.put(`/onboarding/${id}`, data),

  delete: (id) => api.delete(`/onboarding/${id}`)
};

export default onboardingService;