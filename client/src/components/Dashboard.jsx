import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

import { getDashboard } from '../services/analyticsService';
import { getLeaves, getOnLeave } from '../services/leaveService';
import { getTodayStatus } from '../services/attendanceService';
import { getError } from '../services/api';

import { toast } from 'react-toastify';

import {
  Clock3,
  Plane,
  Hourglass,
  Users,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

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
              color: 'var(--color-text-muted)',
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
                color: 'var(--color-text-muted)',
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
      if (user?.hasEmployeeProfile) {
        requests.unshift(
          getTodayStatus()
        );
      }

      const responses = await Promise.all(requests);

      let attendRes = null;
      let leaveRes = null;
      let onLeaveRes = null;

      /**
       * RESPONSE MAPPING
       */
      if (user?.hasEmployeeProfile) {
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
  }, [isAdmin, isHR, user?.hasEmployeeProfile]);

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
            <div className="page-title-content">
              <CheckCircle2
                size={24}
                color="var(--color-primary)"
              />

              <span>
                Welcome back, {user?.firstName}!
              </span>
            </div>
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
        className="grid-4 dashboard-section">
        <Stat
          icon={<Clock3 size={22} />}
          label="Today"
          value={
            todayAttendance
              ? todayAttendance.clockOut
                ? 'Completed'
                : 'Clocked In'
              : 'Not Started'
          }
          color="var(--color-primary)"
          bg="var(--color-info-bg)"
          to="/attendance"
        />

        <Stat
          icon={<Plane size={22} />}
          label="On Leave"
          value={onLeave.length}
          color="var(--color-warning)"
          bg="var(--color-warning-bg)"
          to="/leave"
        />

        <Stat
          icon={<Hourglass size={22} />}
          label="Pending Requests"
          value={pendingLeaves.length}
          color="var(--color-danger)"
          bg="var(--color-danger-bg)"
          to="/leave"
        />

        {(isAdmin || isHR) && data && (
          <Stat
            icon={<Users size={22} />}
            label="Total Employees"
            value={data.headcount?.total}
            color="var(--color-success)"
            bg="var(--color-success-bg)"
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
              className="card-link"  
            >
              <div className="card-link-content">
                <span>View all</span>

                <ArrowRight size={14} />
              </div>
            </Link>
          </div>

          <div className="card-body">
            {loading ? (
              <div className="spinner-center">
                <div className="spinner" />
              </div>
            ) : onLeave.length === 0 ? (
              <div
                className="empty-state dashboard-empty"
              >
                <div className="empty-success">
                  <CheckCircle2 size={18} />

                  <p>No one is on leave today</p>
                </div>
              </div>
            ) : (
              onLeave.map((l) => (
                <div
                  key={l._id}
                  className="list-item"
                >
                  <div className="avatar">
                    {l.employee?.user?.firstName?.[0]}
                    {l.employee?.user?.lastName?.[0]}
                  </div>

                  <div>
                    <p
                    className="list-title"
                    >
                      {l.employee?.user?.firstName}{' '}
                      {l.employee?.user?.lastName}
                    </p>

                    <p className="list-subtitle"
                    >
                      {l.employee?.department} ·{' '}
                      {l.leaveType}
                    </p>
                  </div>

                  <span
                    className="badge badge-warning badge-right"
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
              className="card-link"
            >
              <div className="card-link-content">
                <span>Manage</span>

                <ArrowRight size={14} />
              </div>
            </Link>
          </div>

          <div className="card-body">
            {loading ? (
              <div className="spinner-center">
                <div className="spinner" />
              </div>
            ) : pendingLeaves.length === 0 ? (
              <div
                className="empty-state dashboard-empty"
              >
                <p>
                  All clear — no pending requests
                </p>
              </div>
            ) : (
              pendingLeaves.map((l) => (
                <div
                  key={l._id}
                  className="list-item flex-between"
                >
                  <div>
                    <p className="list-title"
                    >
                      {l.employee?.user?.firstName}{' '}
                      {l.employee?.user?.lastName}
                    </p>

                    <p
                      style={{
                        fontSize: 11,
                        color: 'var(--color-text-muted)'
                      }}
                    >
                      {fmt(l.startDate)} –{' '}
                      {fmt(l.endDate)} ·{' '}
                      {l.totalDays}d
                    </p>
                  </div>

                  <span className="badge badge-warning badge-right">
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
        <div className="dashboard-section-sm">
          <div className="grid-3">
            <div className="card card-body">
              <h3 className="section-title">
                Headcount by Department
              </h3>

              {data.headcount?.byDepartment?.map(
                (d) => (
                  <div
                    key={d._id}
                    className="analytics-row"
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

              <div className="analytics-stack">
                <div className="analytics-row">
                  <span>Active</span>

                  <strong
                    style={{
                      color: 'var(--color-success)'
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
                      color: 'var(--color-warning)'
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
                      color: 'var(--color-danger)'
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

              <div className="engagement-stack">
                <div className="engagement-score">
                  {data.engagement?.avgNps || 0}
                </div>

                <div className="engagement-label">
                  Avg NPS Score
                </div>

                <div className="engagement-meta">
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