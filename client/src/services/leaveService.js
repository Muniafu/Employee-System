import api from './api';

const leaveService = {
  requestLeave: (data) =>
    api.post('/leave', data),

  getMyLeaves: () =>
    api.get('/leave/me'),

  getAll: () =>
    api.get('/leave'),

  approve: (id) =>
    api.patch(`/leave/${id}/approve`),

  reject: (id) =>
    api.patch(`/leave/${id}/reject`),

  updateProgress: (moduleId, progress) =>
    api.patch(`/learning/${moduleId}/progress`, { progress })
};

export default leaveService;