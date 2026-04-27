import api from './api';

const wellnessService = {
  getPrograms: () =>
    api.get('/wellness'),

  enroll: (programId) =>
    api.post(`/wellness/${programId}/enroll`),

  getMyPrograms: () =>
    api.get('/wellness/me')
};

export default wellnessService;