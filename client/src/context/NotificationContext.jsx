import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from '../services/notificationService';

import {
  connectSocket,
  disconnectSocket,
} from '../services/socket';

import { useAuth }
  from './useAuth';

import NotificationContext
  from './NotificationContextObject';

export default function NotificationProvider({
  children,
}) {
  const {
    token,
    loading: authLoading,
  } = useAuth();

  const mountedRef =
    useRef(true);

  const pollingRef =
    useRef(null);

  const [notifications,
    setNotifications] =
    useState([]);

  const [unreadCount,
    setUnreadCount] =
    useState(0);

  const [loading,
    setLoading] =
    useState(false);

  const [error,
    setError] =
    useState(null);

  const fetchNotifications =
    useCallback(
      async (params = {}) => {
        if (!token) return;

        try {
          setLoading(true);

          const response =
            await getNotifications(
              params
            );

          if (!mountedRef.current)
            return;

          setNotifications(
            response?.data || []
          );

          setUnreadCount(
            response?.unreadCount ||
              0
          );
        } catch (err) {
          console.error(err);

          if (mountedRef.current) {
            setError(
              err?.response?.data
                ?.message ||
                'Notification fetch failed.'
            );
          }
        } finally {
          if (mountedRef.current) {
            setLoading(false);
          }
        }
      },
      [token]
    );

  const refreshUnreadCount =
    useCallback(async () => {
      if (!token) return;

      try {
        const response =
          await getUnreadCount();

        if (!mountedRef.current)
          return;

        setUnreadCount(
          response?.data?.count ||
            0
        );
      } catch (err) {
        console.error(err);
      }
    }, [token]);

  const readNotification =
    useCallback(async (id) => {
      try {
        await markAsRead(id);

        setNotifications(
          (prev) =>
            prev.map((n) =>
              n._id === id
                ? {
                    ...n,
                    read: true,
                  }
                : n
            )
        );

        setUnreadCount((prev) =>
          Math.max(prev - 1, 0)
        );
      } catch (err) {
        console.error(err);
      }
    }, []);

  const readAllNotifications =
    useCallback(async () => {
      try {
        await markAllAsRead();

        setNotifications(
          (prev) =>
            prev.map((n) => ({
              ...n,
              read: true,
            }))
        );

        setUnreadCount(0);
      } catch (err) {
        console.error(err);
      }
    }, []);

  /*
   INITIAL LOAD
  */

  useEffect(() => {
    if (authLoading || !token)
      return;

    fetchNotifications({
      limit: 20,
    });

    refreshUnreadCount();
  }, [
    token,
    authLoading,
    fetchNotifications,
    refreshUnreadCount,
  ]);

  /*
   SOCKET
  */

  useEffect(() => {
    if (authLoading || !token)
      return;

    const socket =
      connectSocket(token);

    if (!socket) return;

    const handleNewNotification =
      (notification) => {
        setNotifications(
          (prev) => [
            notification,
            ...prev,
          ]
        );

        setUnreadCount(
          (prev) => prev + 1
        );
      };

    socket.on(
      'notification:new',
      handleNewNotification
    );

    return () => {
      socket.off(
        'notification:new',
        handleNewNotification
      );

      disconnectSocket();
    };
  }, [token, authLoading]);

  /*
   POLLING
  */

  useEffect(() => {
    if (authLoading || !token)
      return;

    pollingRef.current =
      setInterval(() => {
        refreshUnreadCount();
      }, 60000);

    return () => {
      clearInterval(
        pollingRef.current
      );
    };
  }, [
    token,
    authLoading,
    refreshUnreadCount,
  ]);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current =
        false;
    };
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        error,

        fetchNotifications,

        refreshUnreadCount,

        readNotification,

        readAllNotifications,

        setNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}