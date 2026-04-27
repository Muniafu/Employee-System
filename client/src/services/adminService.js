import api from './api';

const adminService = {
  createUser: (data) =>
    api.post('/admin/users', data),

  getUsers: () =>
    api.get('/admin/users'),

  updateRole: (id, role) =>
    api.patch(`/admin/users/${id}/role`, { role }),

  deactivate: (id) =>
    api.patch(`/admin/users/${id}/deactivate`)
};

export default adminService;