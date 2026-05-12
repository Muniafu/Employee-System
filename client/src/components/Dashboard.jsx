import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

import { getDashboard } from '../services/analyticsService';
import { getLeaves, getOnLeave } from '../services/leaveService';
import { getTodayStatus } from '../services/attendanceService';
import { getError } from '../services/api';

import { toast } from 'react-toastify';

const Stat = ({ icon, label, value, sub, color, bg, to }) => {
  const inner = (
    <div
      className="stat-card"
      style={{ cursor: to ? 'pointer' : 'default' }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start'
        }}
      >
        <div>
          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '.06em',
              marginBottom: 6
            }}
          >
            {label}
          </p>

          <p
            style={{
              fontSize: 28,
              fontWeight: 800,
              color
            }}
          >
            {value ?? '—'}
          </p>

          {sub && (
            <p
              style={{
                fontSize: 11,
                color: 'var(--text-muted)',
                marginTop: 4
              }}
            >
              {sub}
            </p>
          )}
        </div>

        <div
          className="stat-icon"
          style={{ background: bg, color }}
        >
          {icon}
        </div>
      </div>
    </div>
  );

  return to ? (
    <Link
      to={to}
      style={{ textDecoration: 'none' }}
    >
      {inner}
    </Link>
  ) : (
    inner
  );
};

export default function Dashboard() {
  const { user, isAdmin, isHR } = useAuth();

  const [data, setData] = useState(null);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [onLeave, setOnLeave] = useState([]);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  /**
   * LOAD DASHBOARD DATA
   */
  const loadDashboard = useCallback(async () => {
    setLoading(true);

    try {
      const requests = [];

      if (isAdmin || isHR) {
        requests.push(
          getLeaves({ status: 'pending' })
        );
      }

      requests.push(getOnLeave());

      /**
       * EMPLOYEE ATTENDANCE
       */
      if (user?.role === 'employee') {
        requests.unshift(getTodayStatus());
      }

      const responses = await Promise.all(requests);

      let attendRes = null;
      let leaveRes = null;
      let onLeaveRes = null;

      /**
       * RESPONSE MAPPING
       */
      if (user?.role === 'employee') {
        attendRes = responses[0];
        onLeaveRes = responses[1];

        setTodayAttendance(
          attendRes?.data?.data || null
        );
      } else {
        leaveRes = responses[0];
        onLeaveRes = responses[1];
      }

      setPendingLeaves(
        Array.isArray(
          leaveRes?.data?.data
        )
          ? leaveRes.data.data.slice(0, 5)
          : []
      );

      setOnLeave(onLeaveRes?.data?.data || []);

      /**
       * ADMIN / HR ANALYTICS
       */
      if (isAdmin || isHR) {
        const dashRes = await getDashboard();

        setData(dashRes?.data?.data || null);
      }
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setLoading(false);
    }
  }, [user?.role, isAdmin, isHR]);

  /**
   * INITIAL LOAD
   */
  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  /**
   * DATE FORMATTER
   */
  const fmt = (d) =>
    d
      ? new Date(d).toLocaleDateString('en-KE', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        })
      : '—';

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Welcome back, {user?.firstName}! 👋
          </h1>

          <p className="page-subtitle">
            {new Date().toLocaleDateString('en-KE', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}
          </p>
        </div>
      </div>

      {/* STAT CARDS */}
      <div
        className="grid-4"
        style={{ marginBottom: 24 }}
      >
        <Stat
          icon="⏱️"
          label="Today"
          value={
            todayAttendance
              ? todayAttendance.clockOut
                ? 'Completed'
                : 'Clocked In'
              : 'Not Started'
          }
          color="var(--primary)"
          bg="var(--primary-light)"
          to="/attendance"
        />

        <Stat
          icon="🏖️"
          label="On Leave"
          value={onLeave.length}
          color="var(--warning)"
          bg="var(--warning-light)"
          to="/leave"
        />

        <Stat
          icon="⏳"
          label="Pending Requests"
          value={pendingLeaves.length}
          color="var(--danger)"
          bg="var(--danger-light)"
          to="/leave"
        />

        {(isAdmin || isHR) && data && (
          <Stat
            icon="👥"
            label="Total Employees"
            value={data.headcount?.total}
            color="var(--success)"
            bg="var(--success-light)"
            to="/employees"
          />
        )}
      </div>

      <div className="grid-2">
        {/* ON LEAVE */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">
              On Leave Today
            </span>

            <Link
              to="/leave"
              style={{
                fontSize: 12,
                color: 'var(--primary)',
                fontWeight: 600
              }}
            >
              View all →
            </Link>
          </div>

          <div className="card-body">
            {loading ? (
              <div className="spinner-center">
                <div className="spinner" />
              </div>
            ) : onLeave.length === 0 ? (
              <div
                className="empty-state"
                style={{ padding: '20px 0' }}
              >
                <p>No one is on leave today 🎉</p>
              </div>
            ) : (
              onLeave.map((l) => (
                <div
                  key={l._id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 0',
                    borderBottom:
                      '1px solid var(--border)'
                  }}
                >
                  <div className="avatar">
                    {l.employee?.user?.firstName?.[0]}
                    {l.employee?.user?.lastName?.[0]}
                  </div>

                  <div>
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 600
                      }}
                    >
                      {l.employee?.user?.firstName}{' '}
                      {l.employee?.user?.lastName}
                    </p>

                    <p
                      style={{
                        fontSize: 11,
                        color: 'var(--text-muted)'
                      }}
                    >
                      {l.employee?.department} ·{' '}
                      {l.leaveType}
                    </p>
                  </div>

                  <span
                    className="badge badge-warning"
                    style={{ marginLeft: 'auto' }}
                  >
                    {l.totalDays}d
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* PENDING REQUESTS */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">
              {isAdmin || isHR
                ? 'Pending Approvals'
                : 'My Leave Requests'}
            </span>

            <Link
              to="/leave"
              style={{
                fontSize: 12,
                color: 'var(--primary)',
                fontWeight: 600
              }}
            >
              Manage →
            </Link>
          </div>

          <div className="card-body">
            {loading ? (
              <div className="spinner-center">
                <div className="spinner" />
              </div>
            ) : pendingLeaves.length === 0 ? (
              <div
                className="empty-state"
                style={{ padding: '20px 0' }}
              >
                <p>
                  All clear — no pending requests
                </p>
              </div>
            ) : (
              pendingLeaves.map((l) => (
                <div
                  key={l._id}
                  style={{
                    display: 'flex',
                    justifyContent:
                      'space-between',
                    alignItems: 'center',
                    padding: '10px 12px',
                    background: 'var(--surface-2)',
                    borderRadius: 8,
                    marginBottom: 8
                  }}
                >
                  <div>
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 600
                      }}
                    >
                      {l.employee?.user?.firstName}{' '}
                      {l.employee?.user?.lastName}
                    </p>

                    <p
                      style={{
                        fontSize: 11,
                        color: 'var(--text-muted)'
                      }}
                    >
                      {fmt(l.startDate)} –{' '}
                      {fmt(l.endDate)} ·{' '}
                      {l.totalDays}d
                    </p>
                  </div>

                  <span className="badge badge-warning">
                    {l.leaveType}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ADMIN ANALYTICS */}
      {(isAdmin || isHR) && data && (
        <div style={{ marginTop: 20 }}>
          <div className="grid-3">
            <div className="card card-body">
              <h3
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  marginBottom: 12
                }}
              >
                Headcount by Department
              </h3>

              {data.headcount?.byDepartment?.map(
                (d) => (
                  <div
                    key={d._id}
                    style={{
                      display: 'flex',
                      justifyContent:
                        'space-between',
                      padding: '4px 0',
                      fontSize: 13
                    }}
                  >
                    <span>
                      {d._id || 'Unassigned'}
                    </span>

                    <strong>{d.count}</strong>
                  </div>
                )
              )}
            </div>

            <div className="card card-body">
              <h3
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  marginBottom: 12
                }}
              >
                Quick Stats
              </h3>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent:
                      'space-between',
                    fontSize: 13
                  }}
                >
                  <span>Active</span>

                  <strong
                    style={{
                      color: 'var(--success)'
                    }}
                  >
                    {data.headcount?.active}
                  </strong>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent:
                      'space-between',
                    fontSize: 13
                  }}
                >
                  <span>On Leave</span>

                  <strong
                    style={{
                      color: 'var(--warning)'
                    }}
                  >
                    {data.headcount?.onLeave}
                  </strong>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent:
                      'space-between',
                    fontSize: 13
                  }}
                >
                  <span>Terminated</span>

                  <strong
                    style={{
                      color: 'var(--danger)'
                    }}
                  >
                    {data.headcount?.terminated}
                  </strong>
                </div>
              </div>
            </div>

            <div className="card card-body">
              <h3
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  marginBottom: 12
                }}
              >
                Engagement
              </h3>

              <div
                style={{
                  textAlign: 'center',
                  padding: '12px 0'
                }}
              >
                <div
                  style={{
                    fontSize: 36,
                    fontWeight: 800,
                    color: 'var(--primary)'
                  }}
                >
                  {data.engagement?.avgNps || 0}
                </div>

                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--text-muted)'
                  }}
                >
                  Avg NPS Score
                </div>

                <div
                  style={{
                    fontSize: 12,
                    marginTop: 8,
                    color: 'var(--text-muted)'
                  }}
                >
                  {
                    data.engagement
                      ?.totalSurveys
                  }{' '}
                  active surveys
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}