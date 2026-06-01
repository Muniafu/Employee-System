import api from './api';

export const getAdminDashboard =
  () => api.get('/admin/dashboard');

export const getAllUsers =
  (p) =>
    api.get('/admin/users', {
      params: p,
    });

export const approveUser =
  (id) =>
    api.patch(
      `/admin/users/${id}/approve`
    );

export const rejectUser =
  (id) =>
    api.patch(
      `/admin/users/${id}/reject`
    );

export const suspendUser =
  (id) =>
    api.patch(
      `/admin/users/${id}/suspend`
    );

export const changeRole =
  (id, role) =>
    api.patch(
      `/admin/users/${id}/role`,
      { role }
    );

export const toggleActive =
  (id) =>
    api.patch(
      `/admin/users/${id}/toggle-active`
    );

export const getDepartments =
  () =>
    api.get('/admin/departments');

export const createDept =
  (d) =>
    api.post(
      '/admin/departments',
      d
    );

export const updateDept =
  (id, d) =>
    api.put(
      `/admin/departments/${id}`,
      d
    );

export const getPolicies =
  () =>
    api.get('/admin/policies');

export const createPolicy =
  (d) =>
    api.post(
      '/admin/policies',
      d
    );

export const getAuditLog =
  (p) =>
    api.get('/admin/audit', {
      params: p,
    });

export const registerAdmin =
  (d) =>
    api.post(
      '/auth/register-admin',
      d
    );