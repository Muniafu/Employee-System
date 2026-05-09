import api from './api';

export const getNotifications = async (params = {}) => {
  const { data } = await api.get('/notifications', {
    params,
  });

  return data;
};

export const getUnreadCount = async () => {
  const { data } = await api.get('/notifications/unread-count');

  return data;
};

export const markAsRead = async (id) => {
  const { data } = await api.patch(`/notifications/${id}/read`);

  return data;
};

export const markAllAsRead = async () => {
  const { data } = await api.patch('/notifications/read-all');

  return data;
};