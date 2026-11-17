import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { Settings} from 'lucide-react';

import {
  getAllUsers,
  changeRole,
  getDepartments,
  getAuditLog,
  registerAdmin,
  approveUser,
  rejectUser,
  suspendUser,
  reactivateUser,
} from '../../services/adminService';

import { getError } from '../../services/api';
import Modal from '../Modal';
import Table from '../Table';

const ROLES = [
  'employee',
  'manager',
  'hr',
  'admin'
];
const DEPTS = [
  'Engineering',
  'HR',
  'Finance',
  'Marketing',
  'Operations',
  'Sales',
  'Legal',
  'Other'
];

const EMPLOYEE_STATUS_BADGE = {
  pending: 'badge-neutral',
  onboarding: 'badge-primary',
  active: 'badge-success',
  probation: 'badge-warning',
  on_leave: 'badge-warning',
  suspended: 'badge-neutral',
  offboarding: 'badge-warning',
  terminated: 'badge-danger',
};

export default function AdminPanel() {
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [depts, setDepts] = useState([]);
  const [audit, setAudit] = useState({});
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const [statusFilter, setStatusFilter] = useState('');

  const [showAddAdmin, setShowAddAdmin] = useState(false);

  const [addForm, setAddForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: 'Admin@1234',
    role: 'admin',
    department: '',
    position: '',
    phone: ''
  });

  const [addLoading, setAddLoading] = useState(false);

  /**
   * APPROVE FLOW
   * Approving a PENDING user now requires department / position / manager,
   * since these feed directly into the Employee record created on approval
   * and into onboarding's department-specific task templates.
   */
  const [showApprove, setShowApprove] = useState(null); // holds the user being approved, or null
  const [approveForm, setApproveForm] = useState({
    department: '',
    position: '',
    managerId: ''
  });
  const [managers, setManagers] = useState([]);
  const [approveLoading, setApproveLoading] = useState(false);

  /**
   * LOAD USERS
   */
  const loadUsers = useCallback(async () => {
    setLoading(true);

    try {
      const { data } = await getAllUsers({
        search: search || undefined,
        role: roleFilter || undefined,
        status: statusFilter || undefined
      });

      setUsers(data.data || []);
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, statusFilter]);

  /**
   * USERS TAB
   */
  useEffect(() => {
    if (tab === 'users') {
      loadUsers();
    }
  }, [tab, loadUsers]);

  /**
   * DEPARTMENTS + AUDIT
   */
  useEffect(() => {
    if (tab === 'departments') {
      getDepartments()
        .then((r) => setDepts(r.data.data || []))
        .catch(() => {});
    }

    if (tab === 'audit') {
      getAuditLog()
        .then((r) => setAudit(r.data.data || {}))
        .catch(() => {});
    }
  }, [tab]);

  /**
   * MANAGER LIST — used to populate the "Manager" select in the Approve modal.
   * Loaded once on mount rather than on every approve-open.
   */
  useEffect(() => {
    getAllUsers({ role: 'manager', status: 'APPROVED' })
      .then((r) => setManagers(r.data.data || []))
      .catch(() => {});
  }, []);

  /**
   * ROLE CHANGE
   */
  const handleRoleChange = async (userId, role) => {
    try {
      await changeRole(userId, role);

      toast.success('Role updated.');

      loadUsers();
    } catch (err) {
      toast.error(getError(err));
    }
  };

  /**
   * APPROVE — opens modal to collect department/position/manager first
   */
  const openApprove = (user) => {
    setApproveForm({ department: '', position: '', managerId: '' });
    setShowApprove(user);
  };

  const handleApprove = async (e) => {
    e.preventDefault();

    setApproveLoading(true);

    try {
      await approveUser(showApprove._id, approveForm);

      toast.success('User approved — employee record created, pending onboarding.');

      setShowApprove(null);

      loadUsers();
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setApproveLoading(false);
    }
  };

  /**
   * REJECT
   */
  const handleReject = async (userId) => {
    try {
      await rejectUser(userId);

      toast.success('User rejected.');

      loadUsers();
    } catch (err) {
      toast.error(getError(err));
    }
  };

  /**
   * SUSPEND
   */
  const handleSuspend = async (userId) => {
    try {
      await suspendUser(userId);

      toast.success('User suspended.');

      loadUsers();
    } catch (err) {
      toast.error(getError(err));
    }
  };

  /**
   * REACTIVATE — reverses a suspension. Blocked server-side if the
   * employee was terminated via the offboarding workflow.
   */
  const handleReactivate = async (userId) => {
    try {
      await reactivateUser(userId);

      toast.success('User reactivated.');

      loadUsers();
    } catch (err) {
      toast.error(getError(err));
    }
  };

  /**
   * CREATE ADMIN / STAFF ACCOUNT
   */
  const handleAddAdmin = async (e) => {
    e.preventDefault();

    setAddLoading(true);

    try {
      await registerAdmin(addForm);

      toast.success(
        `${addForm.role} account created for ${addForm.firstName}!`
      );

      setShowAddAdmin(false);

      setAddForm({
        firstName: '',
        lastName: '',
        email: '',
        password: 'Admin@1234',
        role: 'admin',
        department: '',
        position: '',
        phone: ''
      });

      loadUsers();
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setAddLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Settings size={24} className="page-title-icon" /> Admin Panel
          </h1>

          <p className="page-subtitle">
            User management, departments, and audit trail
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => setShowAddAdmin(true)}
        >
          + Create Account
        </button>
      </div>

      <div className="tabs">
        {['users', 'departments', 'audit'].map((t) => (
          <button
            key={t}
            className={`tab ${tab === t ? 'active' : ''}`}
            onClick={() => setTab(t)}
            style={{ textTransform: 'capitalize' }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* USERS TAB */}
      {tab === 'users' && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">
              All Users{' '}
              <span
                style={{
                  color: 'var(--color-text-muted)',
                  fontWeight: 400,
                  fontSize: 13
                }}
              >
                ({users.length})
              </span>
            </span>

            <div>
              <input
                className="form-control"
                placeholder="Search…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              <select
                className="form-control form-select"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >

                <option value="">All Roles</option>

                {ROLES.map((r) => (
                  <option
                    key={r}
                    value={r}
                  >
                    {r}
                  </option>
                ))}
              </select>
              <select
                className="form-control form-select"
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value)
                }
              >
                <option value="">
                  All Statuses
                </option>

                <option value="PENDING">
                  Pending
                </option>

                <option value="APPROVED">
                  Approved
                </option>

                <option value="REJECTED">
                  Rejected
                </option>

                <option value="SUSPENDED">
                  Suspended
                </option>
              </select>
            </div>
          </div>

          <Table
            loading={loading}
            data={users}
            columns={[
              {
                label: 'User',
                render: (u) => (
                  <div className="employee-card">
                    <div className="avatar">
                      {u.firstName?.[0]}
                      {u.lastName?.[0]}
                    </div>

                    <div>
                      <div className="employee-name">
                        {u.firstName} {u.lastName}
                      </div>

                      <div className="employee-email">
                        {u.email}
                      </div>
                    </div>
                  </div>
                )
              },

              {
                label: 'Role',
                render: (u) => (
                  <select
                    className="form-control form-select role-select"
                    value={u.role}
                    onChange={(e) =>
                      handleRoleChange(u._id, e.target.value)
                    }
                  >
                    {ROLES.map((r) => (
                      <option
                        key={r}
                        value={r}
                        style={{ textTransform: 'capitalize' }}
                      >
                        {r}
                      </option>
                    ))}
                  </select>
                )
              },

              {
                label: 'Account Status',
                render: (u) => {

                  const map = {
                    PENDING: 'badge-warning',
                    APPROVED: 'badge-success',
                    REJECTED: 'badge-danger',
                    SUSPENDED: 'badge-neutral',
                  };

                  return (
                    <span
                      className={`badge ${
                        map[u.status] ||
                        'badge-neutral'
                      }`}
                    >
                      {u.status}
                    </span>
                  );
                }
              },

              {
                label: 'Employee Status',
                render: (u) => {
                  if (!u.employeeStatus) {
                    return (
                      <span style={{ color: 'var(--color-text-muted)' }}>
                        —
                      </span>
                    );
                  }

                  return (
                    <span
                      className={`badge ${
                        EMPLOYEE_STATUS_BADGE[u.employeeStatus] ||
                        'badge-neutral'
                      }`}
                      style={{ textTransform: 'capitalize' }}
                    >
                      {u.employeeStatus.replace('_', ' ')}
                    </span>
                  );
                }
              },

              {
                label: 'Last Login',
                render: (u) =>
                  u.lastLogin
                    ? new Date(u.lastLogin).toLocaleDateString('en-KE')
                    : 'Never'
              },

              {
                label: 'Joined',
                render: (u) =>
                  new Date(u.createdAt).toLocaleDateString('en-KE', {
                    month: 'short',
                    year: 'numeric'
                  })
              },

              {
                label: 'Actions',
                render: (u) => (
                  <div className="employee-card">

                    {u.status === 'PENDING' && (
                      <>
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => openApprove(u)}
                        >
                          Approve
                        </button>

                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleReject(u._id)}
                        >
                          Reject
                        </button>
                      </>
                    )}

                    {u.status === 'APPROVED' &&
                      u.employeeStatus !== 'offboarding' &&
                      u.employeeStatus !== 'terminated' && (
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => handleSuspend(u._id)}
                        >
                          Suspend
                        </button>
                    )}

                    {u.status === 'SUSPENDED' && (
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => handleReactivate(u._id)}
                      >
                        Reactivate
                      </button>
                    )}

                    {u.employeeStatus === 'terminated' && (
                      <span
                        style={{
                          fontSize: 11,
                          color: 'var(--color-text-muted)'
                        }}
                      >
                        Terminated via offboarding
                      </span>
                    )}

                    {u.employeeStatus === 'offboarding' && (
                      <span
                        style={{
                          fontSize: 11,
                          color: 'var(--color-text-muted)'
                        }}
                      >
                        Offboarding in progress
                      </span>
                    )}
                  </div>
                )
              }
            ]}
          />
        </div>
      )}

      {/* DEPARTMENTS TAB */}
      {tab === 'departments' && (
        <div className="grid-2">
          {depts.map((d) => (
            <div key={d._id} className="card card-body">
              <div className="employee-card">
                <div>
                  <h3
                    style={{
                      fontSize: 15,
                      fontWeight: 700
                    }}
                  >
                    {d.name}
                  </h3>

                  <p
                    style={{
                      fontSize: 12,
                      color: 'var(--color-text-muted)'
                    }}
                  >
                    Code: {d.code}
                  </p>
                </div>

                <span
                  className={`badge ${
                    d.isActive
                      ? 'badge-success'
                      : 'badge-neutral'
                  }`}
                >
                  {d.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* AUDIT TAB */}
      {tab === 'audit' && (
        <div className="grid-2">
          <div className="card">
            <div className="card-header">
              <span className="card-title">
                Finalized Payrolls
              </span>
            </div>

            <Table
              data={audit.payroll || []}
              loading={false}
              columns={[
                {
                  label: 'Employee',
                  render: (p) =>
                    `${p.employeeSnapshot.firstName || ''} ${
                      p.employeeSnapshot.lastName || ''
                    }`
                },

                {
                  label: 'Period',
                  key: 'period'
                },

                {
                  label: 'Net Pay',
                  render: (p) =>
                    `KES ${p.totals.netPay?.toLocaleString()}`
                },

                {
                  label: 'By',
                  render: (p) =>
                    `${p.finalizedBy?.firstName || ''} ${
                      p.finalizedBy?.lastName || ''
                    }`
                }
              ]}
              emptyMsg="No finalized payrolls."
            />
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">
                Leave Decisions
              </span>
            </div>

            <Table
              data={audit.leave || []}
              loading={false}
              columns={[
                {
                  label: 'Employee',
                  render: (l) =>
                    `${l.employee?.user?.firstName || ''} ${
                      l.employee?.user?.lastName || ''
                    }`
                },

                {
                  label: 'Type',
                  key: 'leaveType'
                },

                {
                  label: 'Status',
                  render: (l) => (
                    <span
                      className={`badge badge-${
                        l.status === 'approved'
                          ? 'success'
                          : 'danger'
                      }`}
                    >
                      {l.status}
                    </span>
                  )
                },

                {
                  label: 'By',
                  render: (l) =>
                    `${l.approvedBy?.firstName || ''} ${
                      l.approvedBy?.lastName || ''
                    }`
                }
              ]}
              emptyMsg="No decisions yet."
            />
          </div>
        </div>
      )}

      {/* APPROVE MODAL — collects department/position/manager before
          creating the Employee record via approveUser() */}
      <Modal
        open={!!showApprove}
        onClose={() => setShowApprove(null)}
        title={`Approve ${showApprove?.firstName || ''} ${showApprove?.lastName || ''}`}
        footer={
          <>
            <button
              className="btn btn-outline"
              onClick={() => setShowApprove(null)}
            >
              Cancel
            </button>

            <button
              className="btn btn-primary"
              form="approve-form"
              type="submit"
              disabled={approveLoading}
            >
              {approveLoading ? (
                <span
                  className="spinner"
                  style={{
                    width: 14,
                    height: 14,
                    borderWidth: 2
                  }}
                />
              ) : null}
              Approve
            </button>
          </>
        }
      >
        <form id="approve-form" onSubmit={handleApprove}>
          <div className="form-group">
            <label className="form-label">Department *</label>

            <select
              className="form-control form-select"
              value={approveForm.department}
              onChange={(e) =>
                setApproveForm((p) => ({
                  ...p,
                  department: e.target.value
                }))
              }
              required
            >
              <option value="">Select…</option>

              {DEPTS.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Position</label>

            <input
              className="form-control"
              value={approveForm.position}
              onChange={(e) =>
                setApproveForm((p) => ({
                  ...p,
                  position: e.target.value
                }))
              }
            />
          </div>

          <div className="form-group">
            <label className="form-label">Manager</label>

            <select
              className="form-control form-select"
              value={approveForm.managerId}
              onChange={(e) =>
                setApproveForm((p) => ({
                  ...p,
                  managerId: e.target.value
                }))
              }
            >
              <option value="">No manager assigned</option>

              {managers.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.firstName} {m.lastName}
                </option>
              ))}
            </select>
          </div>

          <div className="alert alert-warning" style={{ marginTop: 8 }}>
            This creates the employee record as <strong>pending</strong> — you`ll
            still need to initiate onboarding from the Onboarding page to
            activate them.
          </div>
        </form>
      </Modal>

      {/* CREATE ACCOUNT MODAL */}
      <Modal
        open={showAddAdmin}
        onClose={() => setShowAddAdmin(false)}
        title="Create Account"
        footer={
          <>
            <button
              className="btn btn-outline"
              onClick={() => setShowAddAdmin(false)}
            >
              Cancel
            </button>

            <button
              className="btn btn-primary"
              form="add-admin-form"
              type="submit"
              disabled={addLoading}
            >
              {addLoading ? (
                <span
                  className="spinner"
                  style={{
                    width: 14,
                    height: 14,
                    borderWidth: 2
                  }}
                />
              ) : null}

              Create Account
            </button>
          </>
        }
      >
        <form id="add-admin-form" onSubmit={handleAddAdmin}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                First Name *
              </label>

              <input
                className="form-control"
                value={addForm.firstName}
                onChange={(e) =>
                  setAddForm((p) => ({
                    ...p,
                    firstName: e.target.value
                  }))
                }
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Last Name *
              </label>

              <input
                className="form-control"
                value={addForm.lastName}
                onChange={(e) =>
                  setAddForm((p) => ({
                    ...p,
                    lastName: e.target.value
                  }))
                }
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email *</label>

            <input
              className="form-control"
              type="email"
              value={addForm.email}
              onChange={(e) =>
                setAddForm((p) => ({
                  ...p,
                  email: e.target.value
                }))
              }
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Password *
            </label>

            <input
              className="form-control"
              type="password"
              value={addForm.password}
              onChange={(e) =>
                setAddForm((p) => ({
                  ...p,
                  password: e.target.value
                }))
              }
              required
              minLength={6}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Role *</label>

              <select
                className="form-control form-select"
                value={addForm.role}
                onChange={(e) =>
                  setAddForm((p) => ({
                    ...p,
                    role: e.target.value
                  }))
                }
              >
                {ROLES.map((r) => (
                  <option
                    key={r}
                    value={r}
                    style={{ textTransform: 'capitalize' }}
                  >
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                Department
              </label>

              <select
                className="form-control form-select"
                value={addForm.department}
                onChange={(e) =>
                  setAddForm((p) => ({
                    ...p,
                    department: e.target.value
                  }))
                }
              >
                <option value="">Select…</option>

                {DEPTS.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                Position
              </label>

              <input
                className="form-control"
                value={addForm.position}
                onChange={(e) =>
                  setAddForm((p) => ({
                    ...p,
                    position: e.target.value
                  }))
                }
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone</label>

              <input
                className="form-control"
                value={addForm.phone}
                onChange={(e) =>
                  setAddForm((p) => ({
                    ...p,
                    phone: e.target.value
                  }))
                }
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}