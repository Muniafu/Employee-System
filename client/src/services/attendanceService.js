import api from './api';

const attendanceService = {
  getMyAttendance: (params) =>
    api.get('/attendance/me', { params }),

  getAll: (params) =>
    api.get('/attendance', { params }),

  clockIn: () =>
    api.post('/attendance/clock-in'),

  clockOut: () =>
    api.post('/attendance/clock-out'),

  getByEmployee: (employeeId) =>
    api.get(`/attendance/employee/${employeeId}`)
};

export default attendanceService;