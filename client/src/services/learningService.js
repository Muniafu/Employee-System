import api from './api';

const learningService = {
  getAllModules: () =>
    api.get('/learning'),

  enroll: (moduleId) =>
    api.post(`/learning/${moduleId}/enroll`),

  getMyModules: () =>
    api.get('/learning/me'),

  updateProgress: (moduleId, progress) =>
    api.patch(`/learning/${moduleId}/progress`, { progress }),
};

export default learningService;