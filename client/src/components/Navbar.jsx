import {
  useEffect,
  useRef,
  useState,
} from 'react';

import { useNavigate } from 'react-router-dom';

import { useAuth }
  from '../context/useAuth';

import { useTheme }
  from '../context/useTheme';

import { useNotifications }
  from '../context/useNotifications';

export default function Navbar({
  onMenuClick,
}) {
  const { user } = useAuth();

  const { theme, toggle } =
    useTheme();

  const navigate = useNavigate();

  const notificationContext =
    useNotifications();

  const {
    notifications = [],
    unreadCount = 0,
    loading = false,
    error = null,
    readNotification,
    fetchNotifications,
  } = notificationContext || {};

  const [open, setOpen] =
    useState(false);

  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener(
      'mousedown',
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        'mousedown',
        handleOutsideClick
      );
    };
  }, []);

  const roleColor = {
    superuser: 'var(--danger)',
    admin: 'var(--primary)',
    hr: 'var(--info)',
    manager: 'var(--success)',
    employee: 'var(--text-muted)',
  };

  return (
    <header className="topbar">
      <button
        className="btn btn-ghost btn-icon"
        onClick={onMenuClick}
      >
        ☰
      </button>

      <div style={{ flex: 1 }} />

      <button
        className="btn btn-ghost btn-icon"
        onClick={toggle}
      >
        {theme === 'dark'
          ? '☀️'
          : '🌙'}
      </button>

      <div
        style={{ position: 'relative' }}
        ref={dropdownRef}
      >
        <button
          className="btn btn-ghost btn-icon"
          style={{ position: 'relative' }}
          onClick={() => {
            setOpen((prev) => !prev);

            if (!open) {
              fetchNotifications({
                limit: 10,
              });
            }
          }}
        >
          🔔

          {unreadCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: 2,
                right: 2,
                background:
                  'var(--danger)',
                color: '#fff',
                borderRadius: '50%',
                width: 16,
                height: 16,
                fontSize: 9,
                fontWeight: 800,
                display: 'grid',
                placeItems: 'center',
              }}
            >
              {unreadCount > 9
                ? '9+'
                : unreadCount}
            </span>
          )}
        </button>

        {open && (
          <div
            style={{
              position: 'absolute',
              top: '110%',
              right: 0,
              width: 360,
              maxHeight: 420,
              overflowY: 'auto',
              background:
                'var(--surface)',
              border:
                '1px solid var(--border)',
              borderRadius: 12,
              boxShadow:
                '0 10px 40px rgba(0,0,0,0.2)',
              zIndex: 1000,
              padding: 12,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent:
                  'space-between',
                alignItems: 'center',
                marginBottom: 12,
              }}
            >
              <strong>
                Notifications
              </strong>

              <button
                className="btn btn-sm"
                onClick={() => {
                  navigate(
                    '/notifications'
                  );

                  setOpen(false);
                }}
              >
                View All
              </button>
            </div>

            {loading && (
              <p>
                Loading notifications...
              </p>
            )}

            {error && (
              <p
                style={{
                  color:
                    'var(--danger)',
                }}
              >
                {error}
              </p>
            )}

            {!loading &&
              notifications.length === 0 && (
                <p
                  style={{
                    color:
                      'var(--text-muted)',
                  }}
                >
                  No notifications yet.
                </p>
              )}

            {Array.isArray(
              notifications
            ) &&
              notifications.map((n) => (
                <div
                  key={n._id}
                  onClick={() =>
                    readNotification(
                      n._id
                    )
                  }
                  style={{
                    padding: 12,
                    borderRadius: 10,
                    marginBottom: 10,
                    cursor: 'pointer',
                    background: n.read
                      ? 'transparent'
                      : 'var(--surface-2)',
                    border: `1px solid ${
                      n.read
                        ? 'var(--border)'
                        : 'var(--primary)'
                    }`,
                  }}
                >
                  <div
                    style={{
                      fontWeight: 700,
                      marginBottom: 6,
                    }}
                  >
                    {n.title}
                  </div>

                  <div
                    style={{
                      fontSize: 13,
                      marginBottom: 6,
                    }}
                  >
                    {n.message}
                  </div>

                  <div
                    style={{
                      fontSize: 11,
                      color:
                        'var(--text-muted)',
                    }}
                  >
                    {new Date(
                      n.createdAt
                    ).toLocaleString()}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          paddingLeft: 12,
          borderLeft:
            '1px solid var(--border)',
        }}
      >
        <div className="avatar">
          {user?.firstName?.[0]}
          {user?.lastName?.[0]}
        </div>

        <div style={{ lineHeight: 1.3 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {user?.firstName}{' '}
            {user?.lastName}
          </div>

          <div
            style={{
              fontSize: 11,
              color:
                roleColor[user?.role] ||
                'var(--text-muted)',
              fontWeight: 700,
              textTransform:
                'capitalize',
            }}
          >
            {user?.role}
          </div>
        </div>
      </div>
    </header>
  );
}