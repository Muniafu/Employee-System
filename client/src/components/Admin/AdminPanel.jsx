import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import {
  getAllUsers,
  changeRole,
  toggleActive,
  getDepartments,
  getAuditLog,
  registerAdmin
} from '../../services/adminService';

import { getError } from '../../services/api';
import Modal from '../Modal';
import Table from '../Table';

const ROLES = ['employee', 'manager', 'hr', 'admin', 'superuser'];
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

export default function AdminPanel() {
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [depts, setDepts] = useState([]);
  const [audit, setAudit] = useState({});
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

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
   * LOAD USERS
   */
  const loadUsers = useCallback(async () => {
    setLoading(true);

    try {
      const { data } = await getAllUsers({
        search: search || undefined,
        role: roleFilter || undefined
      });

      setUsers(data.data || []);
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter]);

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
   * TOGGLE ACTIVE
   */
  const handleToggle = async (userId) => {
    try {
      await toggleActive(userId);

      toast.success('Status updated.');

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
          <h1 className="page-title">Admin Panel ⚙️</h1>

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
                  color: 'var(--text-muted)',
                  fontWeight: 400,
                  fontSize: 13
                }}
              >
                ({users.length})
              </span>
            </span>

            <div style={{ display: 'flex', gap: 10 }}>
              <input
                className="form-control"
                placeholder="Search…"
                style={{ width: 200 }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              <select
                className="form-control form-select"
                style={{ width: 140 }}
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="">All Roles</option>

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
          </div>

          <Table
            loading={loading}
            data={users}
            columns={[
              {
                label: 'User',
                render: (u) => (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10
                    }}
                  >
                    <div className="avatar">
                      {u.firstName?.[0]}
                      {u.lastName?.[0]}
                    </div>

                    <div>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: 13
                        }}
                      >
                        {u.firstName} {u.lastName}
                      </div>

                      <div
                        style={{
                          fontSize: 11,
                          color: 'var(--text-muted)'
                        }}
                      >
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
                    className="form-control form-select"
                    style={{
                      width: 130,
                      padding: '4px 8px',
                      fontSize: 12
                    }}
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
                label: 'Status',
                render: (u) => (
                  <span
                    className={`badge ${
                      u.isActive
                        ? 'badge-success'
                        : 'badge-danger'
                    }`}
                  >
                    {u.isActive ? 'Active' : 'Inactive'}
                  </span>
                )
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
                label: '',
                render: (u) => (
                  <button
                    className={`btn btn-sm ${
                      u.isActive
                        ? 'btn-outline'
                        : 'btn-success'
                    }`}
                    onClick={() => handleToggle(u._id)}
                  >
                    {u.isActive ? 'Deactivate' : 'Activate'}
                  </button>
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
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
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
                      color: 'var(--text-muted)'
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
                    `${p.employee?.user?.firstName || ''} ${
                      p.employee?.user?.lastName || ''
                    }`
                },

                {
                  label: 'Period',
                  key: 'period'
                },

                {
                  label: 'Net Pay',
                  render: (p) =>
                    `KES ${p.netPay?.toLocaleString()}`
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