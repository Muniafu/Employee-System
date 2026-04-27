import api from './api';

const payrollService = {
  preview: (data) =>
    api.post('/payroll/preview', data),

  finalize: (data) =>
    api.post('/payroll/finalize', data),

  getAll: (params) =>
    api.get('/payroll', { params }),

  getMyPayroll: () =>
    api.get('/payroll/me'),

  getByEmployee: (employeeId) =>
    api.get(`/payroll/employee/${employeeId}`)
};

export default payrollService;