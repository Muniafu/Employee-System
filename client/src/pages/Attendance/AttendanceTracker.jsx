import {
  useState,
  useEffect,
  useCallback,
} from 'react';

import { toast }
  from 'react-toastify';

import {
  Clock3,
  Play,
  Square,
  CalendarDays,
  TimerReset,
  AlarmClock,
  Timer,
} from 'lucide-react';

import {
  clockIn,
  clockOut,
  getMyAttendance,
  getTodayStatus,
  getAllAttendance,
} from '../../services/attendanceService';

import { getError }
  from '../../services/api';

import { useAuth }
  from '../../context/useAuth';

import Table
  from '../../components/Table';

import {
connectSocket,
getSocket,
}
from
'../../services/socket';

const fmt = (d) =>
  d
    ? new Date(d).toLocaleTimeString(
        'en-KE',
        {
          hour: '2-digit',
          minute: '2-digit',
        }
      )
    : '—';

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString(
        'en-KE',
        {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }
      )
    : '—';

export default function AttendanceTracker() {

  /*
   * NOTE: isAdmin / isHR were previously used to gate the
   * "All Employees" tab and fetch. That excluded managers,
   * even though the backend (/attendance/all) explicitly
   * authorizes them. isManager is the hierarchical flag
   * from AuthProvider (true for manager/hr/admin/superuser),
   * so using it here keeps frontend visibility in sync with
   * backend authorization.
   */
  const {
    isManager,
    hasEmployeeProfile,
  } = useAuth();

  const [today, setToday] =
    useState(null);

  const [onLeave, setOnLeave] =
    useState(false);

  const [leaveInfo, setLeaveInfo] =
    useState(null);

  const [records, setRecords] =
    useState([]);

  const [allRecords,
    setAllRecords] =
      useState([]);

  const [allScope, setAllScope] =
    useState(null);

  const [summary, setSummary] =
    useState({});

  const [loading, setLoading] =
    useState(true);

  const [acting, setActing] =
    useState(false);

  const [note, setNote] =
    useState('');

  const [view, setView] =
    useState(
      hasEmployeeProfile
        ? 'my'
        : 'all'
    );

  /**
   * AUTO VIEW SWITCH
   */

  useEffect(() => {
    setView(
      hasEmployeeProfile
        ? 'my'
        : 'all'
    );
  }, [hasEmployeeProfile]);

  /**
   * LOAD DATA
   */

  const load =
    useCallback(async () => {

      setLoading(true);

      try {

        /**
         * EMPLOYEE DATA
         */

        if (
          hasEmployeeProfile
        ) {
          const [
            todayRes,
            myRes,
          ] = await Promise.all([
            getTodayStatus(),
            getMyAttendance(),
          ]);

          setToday(
            todayRes?.data?.data
            || null
          );

          setOnLeave(
            todayRes?.data?.onLeave ||
            false
          );

          setLeaveInfo(
            todayRes?.data?.leave ||
            null
          );

          setRecords(
            myRes?.data?.data
            || []
          );

          setSummary(
            myRes?.data?.summary
            || {}
          );

        } else {

          setToday(null);

          setRecords([]);

          setSummary({});
        }

        /**
         * TEAM / COMPANY-WIDE DATA
         *
         * isManager covers manager, hr, admin, superuser —
         * matching who the backend actually authorizes for
         * GET /attendance/all. The backend itself scopes a
         * manager down to their own department; admins/hr
         * see everything.
         */

        if (isManager) {
          const allRes =
            await getAllAttendance();

          setAllRecords(
            allRes?.data?.data
            || []
          );

          setAllScope(
            allRes?.data?.scope
            || null
          );

        } else {

          setAllRecords([]);
          setAllScope(null);
        }
      } catch (err) {
        toast.error(
          getError(err)
        );

      } finally {
        setLoading(false);
      }

    }, [
      hasEmployeeProfile,
      isManager,
    ]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {

    const token =
    localStorage.getItem(
    'ems_token'
    );

    if (
    !token
    ||
    !hasEmployeeProfile
    ) {
    return;
    }

    connectSocket(
    token
    );

    const socket =
    getSocket();

    if (
    !socket
    ) {
    return;
    }

    const refresh =
    () => load();

    socket.on(
    'attendance:update',
    refresh
    );

    socket.on(
    'leave:approved',
    refresh
    );

    return () => {

    socket.off(
    'attendance:update',
    refresh
    );

    socket.off(
    'leave:approved',
    refresh
    );

    };

    }, [
    load,
    hasEmployeeProfile,
    ]);

  /**
   * ACTIONS
   */

  const handleClockIn =
    async () => {

    if (
      acting ||
      onLeave
    ) return;

    setActing(true);

    try {

    await clockIn({
    note,
    });

    await load();

    toast.success(
    'Clocked in'
    );

    setNote('');

    } catch (err) {

    toast.error(
    getError(err)
    );

    } finally {

    setActing(false);

    }

    };

  const handleClockOut =
    async () => {

    if (
    acting ||
    onLeave
    ) return;

    setActing(true);

    try {

    await clockOut({
    note,
    });

    await load();

    toast.success(
    'Clocked out'
    );

    setNote('');

    } catch (err) {

    toast.error(
    getError(err)
    );

    } finally {

    setActing(false);

    }

    };

  const canClockIn =
    !onLeave &&
    !today?.clockIn &&
    !acting;

  const canClockOut =
    !onLeave &&
    today?.clockIn &&
    !today?.clockOut &&
    !acting;

  const isComplete =
    today?.clockIn &&
    today?.clockOut;

  /*
   * When the "all records" view is department-scoped
   * (i.e. the viewer is a manager, not admin/hr), the
   * Department column is redundant since every row is
   * the same department — so it's dropped from the table.
   */
  const isDeptScoped =
    allScope === 'department';

  return (
    <div>

      <div className="page-header">
        <div className="page-title-content">
          <Clock3
            size={28}
            color="var(--color-primary)"
          />

          <div>
            <h1 className="page-title">
              Attendance
            </h1>

            <p className="page-subtitle">
              Workforce attendance management
            </p>
          </div>
        </div>
      </div>

      {hasEmployeeProfile && (
        <>
          {/* TODAY */}

          <div
            className="card"
            style={{
              marginBottom: 24,
            }}
          >
            <div className="card-body">

              <div className="attendance-header">

                <div>

                  <p
                    style={{
                      fontSize: 12,
                      color:
                        'var(--color-text-muted)',
                    }}
                  >
                    TODAY
                  </p>

                  <div className="attendance-summary">

                    <div>
                      <p>Clock In</p>
                      <strong>
                        {fmt(today?.clockIn)}
                      </strong>
                    </div>

                    <div>
                      <p>Clock Out</p>
                      <strong>
                        {fmt(today?.clockOut)}
                      </strong>
                    </div>

                    <div>
                      <p>Hours</p>
                      <strong>
                        {
                          today?.hoursWorked
                          || 0
                        }h
                      </strong>
                    </div>

                    <div>
                      <p>Status</p>

                      <span
                        className={`badge ${
                          isComplete
                            ? 'badge-success'
                            : today?.clockIn
                              ? 'badge-warning'
                              : 'badge-neutral'
                        }`}
                      >
                        {
                        onLeave
                        ? 'On Leave'
                        : isComplete
                        ? 'Complete'
                        : today?.clockIn
                        ? 'In Progress'
                        : 'Not Started'
                        }
                      </span>
                    </div>

                  </div>
                </div>

                <div className="attendance-actions">

                  <input
                    className="form-control"
                    placeholder="Optional note..."
                    value={note}
                    onChange={(e) =>
                      setNote(
                        e.target.value
                      )
                    }
                  />

                  <div
                    className="attendance-actions"
                  >

                    <button
                      className="btn btn-success"
                      onClick={
                        handleClockIn
                      }
                      disabled={!canClockIn}
                    >
                      <Play size={16} />
                      Clock In
                    </button>

                    <button
                      className="btn btn-danger"
                      onClick={
                        handleClockOut
                      }
                      disabled={!canClockOut}
                    >
                      <Square size={16} />
                      Clock Out
                    </button>

                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SUMMARY */}

          <div
            className="grid-4"
            style={{
              marginBottom: 24,
            }}
          >
            {[
              {
                label:
                  'Present',
                value:
                  summary.present
                  || 0,
                icon:
                  CalendarDays,
              },

              {
                label:
                  'Late',
                value:
                  summary.late
                  || 0,
                icon:
                  AlarmClock,
              },

              {
                label:
                  'Hours',
                value: `${
                  summary.totalHours
                  || 0
                }h`,
                icon: Timer,
              },

              {
                label:
                  'Overtime',
                value: `${
                  summary.overtime
                  || 0
                }h`,
                icon:
                  TimerReset,
              },
            ].map((item) => {

              const Icon =
                item.icon;

              return (
                <div
                  key={item.label}
                  className="stat-card"
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent:
                        'space-between',
                    }}
                  >

                    <div>
                      <p>
                        {item.label}
                      </p>

                      <strong>
                        {item.value}
                      </strong>
                    </div>

                    <Icon size={20} />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* TABS */}

      {isManager &&
        hasEmployeeProfile && (
          <div className="tabs">

            <button
              className={`tab ${
                view === 'my'
                  ? 'active'
                  : ''
              }`}
              onClick={() =>
                setView('my')
              }
            >
              My Records
            </button>

            <button
              className={`tab ${
                view === 'all'
                  ? 'active'
                  : ''
              }`}
              onClick={() =>
                setView('all')
              }
            >
              {isDeptScoped
                ? 'My Department'
                : 'All Employees'}
            </button>
          </div>
      )}

      {/* TABLE */}

      {
      onLeave && (
      <div
      className="card"
      style={{
      marginBottom:16,
      border:
      '1px solid var(--color-warning)'
      }}
      >

      <div
      className="card-body"
      >

      <div
      style={{
      display:'flex',
      justifyContent:
      'space-between',
      alignItems:
      'center',
      }}
      >

      <div>

      <h3>
      🏖️ Approved Leave
      </h3>

      <p>

      Attendance disabled.

      {
      leaveInfo
      &&
      ` ${fmtDate(
      leaveInfo.startDate
      )}
      → ${fmtDate(
      leaveInfo.endDate
      )}`

      }

      </p>

      </div>

      <span
      className=
      "badge badge-warning"
      >
      ON LEAVE
      </span>

      </div>

      </div>

      </div>
      )
      }

      <div className="card">

        <div className="card-header">
          <span className="card-title">

            {!hasEmployeeProfile
              ? (isDeptScoped
                  ? 'Department Attendance Records'
                  : 'All Attendance Records')
              : view === 'my'
                ? 'My Attendance History'
                : (isDeptScoped
                    ? 'Department Attendance Records'
                    : 'All Attendance Records')}

          </span>
        </div>

        <Table
          loading={loading}
          data={
            view === 'my'
              ? records
              : allRecords
          }
          columns={
            view === 'my'
              ? [
                  {
                    label: 'Date',
                    render: (r) =>
                      fmtDate(r.date),
                  },

                  {
                    label: 'Clock In',
                    render: (r) =>
                      fmt(r.clockIn),
                  },

                  {
                    label: 'Clock Out',
                    render: (r) =>
                      fmt(r.clockOut),
                  },

                  {
                    label: 'Hours',
                    render: (r) =>
                      r.hoursWorked
                        ? `${r.hoursWorked}h`
                        : '—',
                  },
                ]

              : [
                  {
                    label:
                      'Employee',

                    render: (r) =>
                      `${r.employee?.user?.firstName || ''} ${r.employee?.user?.lastName || ''}`,
                  },

                  /*
                   * Department column omitted when the view
                   * is already department-scoped (manager) —
                   * every row would show the same value.
                   */
                  ...(isDeptScoped
                    ? []
                    : [{
                        label: 'Department',
                        render: (r) =>
                          r.employee?.department
                          || '—',
                      }]),

                  {
                    label:
                      'Date',

                    render: (r) =>
                      fmtDate(r.date),
                  },

                  {
                    label:
                      'Clock In',

                    render: (r) =>
                      fmt(r.clockIn),
                  },

                  {
                    label:
                      'Clock Out',

                    render: (r) =>
                      fmt(r.clockOut),
                  },

                  {
                    label:
                      'Hours',

                    render: (r) =>
                      r.hoursWorked
                        ? `${r.hoursWorked}h`
                        : '—',
                  },
                ]
          }

          emptyMsg="No attendance records found."
        />
      </div>
    </div>
  );
}