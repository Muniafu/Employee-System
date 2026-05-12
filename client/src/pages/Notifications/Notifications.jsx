import { useEffect } from 'react';

import {
  useNotifications,
} from '../../context/useNotifications';

export default function Notifications() {
  const {
    notifications,
    loading,
    error,

    fetchNotifications,

    readNotification,

    readAllNotifications,
  } = useNotifications();

  useEffect(() => {
    fetchNotifications({
      limit: 50,
    });
  }, [fetchNotifications]);

  if (loading) {
    return (
      <div className="card">
        <h2>Notifications</h2>

        <p>
          Loading notifications...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <h2>Notifications</h2>

        <p
          style={{
            color:
              'var(--danger)',
          }}
        >
          {error}
        </p>
      </div>
    );
  }

  return (
    <div className="card">
      <div
        style={{
          display: 'flex',
          justifyContent:
            'space-between',
          alignItems: 'center',
          marginBottom: 20,
        }}
      >
        <h2>Notifications</h2>

        {notifications.length >
          0 && (
          <button
            className="btn btn-primary"
            onClick={
              readAllNotifications
            }
          >
            Mark All Read
          </button>
        )}
      </div>

      {notifications.length ===
      0 ? (
        <div
          style={{
            padding: 40,
            textAlign: 'center',
            color:
              'var(--text-muted)',
          }}
        >
          No notifications available.
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection:
              'column',
            gap: 12,
          }}
        >
          {notifications.map(
            (notification) => (
              <div
                key={
                  notification._id
                }
                className="card"
                style={{
                  borderLeft:
                    notification.read
                      ? '4px solid var(--border)'
                      : '4px solid var(--primary)',

                  background:
                    notification.read
                      ? 'var(--surface)'
                      : 'var(--surface-2)',

                  cursor:
                    'pointer',
                }}
                onClick={() =>
                  readNotification(
                    notification._id
                  )
                }
              >
                <div
                  style={{
                    display:
                      'flex',

                    justifyContent:
                      'space-between',

                    marginBottom: 8,
                  }}
                >
                  <strong>
                    {notification.title ||
                      'Notification'}
                  </strong>

                  {!notification.read && (
                    <span
                      style={{
                        color:
                          'var(--primary)',

                        fontSize: 12,

                        fontWeight: 700,
                      }}
                    >
                      NEW
                    </span>
                  )}
                </div>

                <div
                  style={{
                    color:
                      'var(--text-secondary)',

                    marginBottom: 8,
                  }}
                >
                  {
                    notification.message
                  }
                </div>

                <div
                  style={{
                    fontSize: 12,

                    color:
                      'var(--text-muted)',
                  }}
                >
                  {new Date(
                    notification.createdAt
                  ).toLocaleString()}
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}