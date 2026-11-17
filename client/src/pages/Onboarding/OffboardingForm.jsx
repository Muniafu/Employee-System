import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { Mic, Laptop, Lock, BookOpen, Palmtree, Wallet, CheckCircle2, FileText, Paperclip, Check, Package, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import { getEmployees } from '../../services/employeeService';
import { getError } from '../../services/api';
import Modal from '../../components/Modal';

import {
  initiateOffboarding,
  getMyOffboarding,
  getAllOffboarding,
  completeMyTask,
  completeEmployeeTask,
  revokeAccess,
  approveOffboarding,
} from '../../services/offboardingService';

const TYPE_LABEL = {
  resignation: 'Resignation',
  termination: 'Termination',
  retirement: 'Retirement',
  contract_end: 'Contract End',
  other: 'Other',
};

const CATEGORY_LABEL = {
  exit_interview: 'HR',
  asset_return: 'IT / Assets',
  access_revocation: 'IT / Assets',
  knowledge_transfer: 'Documentation',
  leave_clearance: 'HR',
  payroll: 'Finance',
  clearance: 'Sign-off',
  documentation: 'HR',
  other: 'Other',
};

const CATEGORY_ICON = {
  exit_interview: '',
  asset_return: '',
  access_revocation: '',
  knowledge_transfer: '',
  leave_clearance: '',
  payroll: '',
  clearance: '',
  documentation: '',
  other: '',
};

const PHASE_LABEL = {
  initiated: 'Initiated',
  in_progress: 'In Progress',
  pending_approval: 'Pending Approval',
  completed: 'Completed',
};

const PHASE_BADGE = {
  initiated: 'badge-neutral',
  in_progress: 'badge-warning',
  pending_approval: 'badge-primary',
  completed: 'badge-success',
};

/*
 * Task-completion eligibility for the admin/manager view.
 * Managers are scoped to their own direct reports upstream (via getAllOffboarding),
 * so here we only need to check whether the task itself is assignable to a
 * non-employee actor. 'employee' tasks are always waiting on the employee.
 */
const staffCanComplete = (task) => task.assignedTo !== 'employee';

const unmetDependencies = (offboarding, task) => {
  if (!task.dependsOn?.length) return [];
  return task.dependsOn.filter((category) => {
    const depTasks = offboarding.tasks.filter(
      (t) => t.category === category && t.required
    );
    if (!depTasks.length) return false;
    return !depTasks.every((t) => t.completed);
  });
};

/* Shared, read-only-aware task row used by both admin/manager and self-service views */
function TaskRow({ task, disabled, disabledReason, onComplete, busy }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        padding: '12px 0',
        borderBottom: '1px solid var(--border)',
        opacity: task.completed ? 0.7 : 1,
      }}
    >
      <button
        onClick={() => !disabled && !task.completed && onComplete(task)}
        title={task.completed ? 'Completed' : disabledReason || 'Mark complete'}
        style={{
          marginTop: 2,
          width: 22,
          height: 22,
          borderRadius: 6,
          border: `2px solid ${task.completed ? 'var(--success)' : task.required ? 'var(--color-primary)' : 'var(--border-2)'}`,
          background: task.completed ? 'var(--success)' : 'transparent',
          color: '#fff',
          fontSize: 12,
          display: 'grid',
          placeItems: 'center',
          flexShrink: 0,
          cursor: disabled || task.completed || busy ? 'default' : 'pointer',
        }}
      >
        {task.completed ? '✓' : ''}
      </button>

      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <div>
            <span
              style={{
                fontSize: 13,
                fontWeight: task.completed ? 400 : 600,
                textDecoration: task.completed ? 'line-through' : 'none',
                color: task.completed ? 'var(--color-text-muted)' : 'var(--color-text)',
              }}
            >
              {CATEGORY_ICON[task.category] || ''} {task.title}
            </span>
            {task.description && (
              <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>{task.description}</p>
            )}
            {disabled && !task.completed && disabledReason && (
              <p style={{ fontSize: 11, color: 'var(--color-warning)', marginTop: 2 }}>{disabledReason}</p>
            )}
          </div>
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            {task.required && <span className="badge badge-danger" style={{ fontSize: 10 }}>Required</span>}
            <span className="badge badge-neutral" style={{ fontSize: 10, textTransform: 'capitalize' }}>
              {task.assignedTo}
            </span>
          </div>
        </div>
        {task.completed && task.completedAt && (
          <p style={{ fontSize: 11, color: 'var(--success)', marginTop: 4 }}>
             Done {new Date(task.completedAt).toLocaleDateString('en-KE')}
          </p>
        )}
      </div>
    </div>
  );
}

function TaskGroups({ offboarding, canComplete, onComplete, busyTaskId }) {
  const catGroups = offboarding.tasks.reduce((acc, t) => {
    const key = CATEGORY_LABEL[t.category] || 'Other';
    (acc[key] = acc[key] || []).push(t);
    return acc;
  }, {});

  return Object.entries(catGroups).map(([cat, tasks]) => (
    <div key={cat} className="card" style={{ marginBottom: 16 }}>
      <div className="card-header">
        <span className="card-title">{cat}</span>
        <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
          {tasks.filter((t) => t.completed).length}/{tasks.length} done
        </span>
      </div>
      <div className="card-body" style={{ padding: '0 20px' }}>
        {tasks.map((task) => {
          const blocked = unmetDependencies(offboarding, task);
          const assignable = canComplete(task);
          let disabledReason = '';
          if (!assignable) {
            disabledReason = task.assignedTo === 'employee'
              ? '⏳ Waiting on employee'
              : `Assigned to ${task.assignedTo} — not yours to complete`;
          } else if (blocked.length) {
            disabledReason = ` Blocked until required: ${blocked.join(', ')}`;
          }

          return (
            <TaskRow
              key={task._id}
              task={task}
              offboarding={offboarding}
              disabled={!assignable || blocked.length > 0 || busyTaskId === task._id}
              disabledReason={disabledReason}
              onComplete={() => onComplete(task)}
              busy={busyTaskId === task._id}
            />
          );
        })}
      </div>
    </div>
  ));
}

/* ══════════════════════════════════════════════════════════
   SELF-SERVICE VIEW — regular employee, their own offboarding
   ══════════════════════════════════════════════════════════ */
function MyOffboarding() {
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyTaskId, setBusyTaskId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMyOffboarding();
      setRecord(res.data.data);
    } catch (err) {
      // 404 just means no offboarding in progress — not an error state
      if (err?.response?.status !== 404) toast.error(getError(err));
      setRecord(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleComplete = async (task) => {
    setBusyTaskId(task._id);
    try {
      await completeMyTask(task._id);
      toast.success('Task marked complete.');
      await load();
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setBusyTaskId(null);
    }
  };

  const canComplete = (task) => task.assignedTo === 'employee';

  if (loading) {
    return <div className="spinner-center"><div className="spinner spinner-lg" /></div>;
  }

  if (!record) {
    return (
      <div className="empty-state card card-body">
        <div className="empty-icon"></div>
        <h3>No active offboarding</h3>
        <p>You don&apos;t have an exit process in progress.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="card card-body" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700 }}>
              {TYPE_LABEL[record.type] || record.type}
            </h3>
            <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>
              Last working day: {record.lastWorkingDay ? new Date(record.lastWorkingDay).toLocaleDateString('en-KE') : '—'}
            </p>
          </div>
          <span className={`badge ${PHASE_BADGE[record.phase]}`} style={{ textTransform: 'capitalize' }}>
            {PHASE_LABEL[record.phase] || record.phase}
          </span>
        </div>

        <div className="progress-bar" style={{ height: 10, marginTop: 16 }}>
          <div
            className="progress-fill"
            style={{ width: `${record.progress}%`, background: record.progress === 100 ? 'var(--success)' : 'var(--color-primary)' }}
          />
        </div>
        <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 8 }}>
          {record.tasks.filter((t) => t.completed).length} of {record.tasks.length} tasks complete
        </p>

        {record.accessRevoked && (
          <div className="alert alert-warning" style={{ marginTop: 12 }}>
            🔒 Your system access has been revoked as of{' '}
            {new Date(record.accessRevokedAt).toLocaleDateString('en-KE')}.
          </div>
        )}
      </div>

      <div className="alert alert-primary" style={{ marginBottom: 16 }}>
        Only tasks assigned to <strong>you</strong> are actionable here. Everything else is being
        handled by HR, IT, your manager, or Finance — you&apos;ll see it update automatically as they complete it.
      </div>

      <TaskGroups
        offboarding={record}
        canComplete={canComplete}
        onComplete={handleComplete}
        busyTaskId={busyTaskId}
      />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   STAFF VIEW — HR/Admin/Superuser see everyone; Manager sees
   only their own direct reports (enforced server-side too).
   Revoke Access / Approve & Finalize are restricted to
   Admin/Superuser/HR — a manager can initiate offboarding and
   complete non-employee tasks, but cannot revoke access or
   finalize a termination.
   ══════════════════════════════════════════════════════════ */
function StaffOffboarding() {
  const { isAdmin, isHR } = useAuth();
  const canFinalize = isAdmin || isHR;

  const [allOffboarding, setAll] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState(null);

  const [showInitiate, setShowInitiate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [busyTaskId, setBusyTaskId] = useState(null);
  const [actionBusy, setActionBusy] = useState(false);

  const [form, setForm] = useState({
    employeeId: '',
    type: 'resignation',
    lastWorkingDay: '',
    reason: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [offRes, empRes] = await Promise.all([
        getAllOffboarding(),
        getEmployees(),
      ]);

      const records = offRes.data.data || [];
      setAll(records);

      const inOffboarding = new Set(
        records.map((r) => r.employee?._id || r.employee)
      );

      // getEmployees() is scoped server-side for managers (direct reports only),
      // so no extra client-side manager filtering is needed here.
      const eligible = (empRes.data.data || []).filter(
        (e) =>
          ['active', 'probation', 'on_leave'].includes(e.status) &&
          !inOffboarding.has(e._id)
      );

      setEmployees(eligible);
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const active = allOffboarding.find((o) => o._id === activeId);

  const resetForm = () =>
    setForm({ employeeId: '', type: 'resignation', lastWorkingDay: '', reason: '' });

  const handleInitiate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await initiateOffboarding(form);
      toast.success('Offboarding initiated.');
      setShowInitiate(false);
      resetForm();
      await load();
      setActiveId(res.data.data._id);
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteTask = async (offboarding, task) => {
    setBusyTaskId(task._id);
    try {
      const employeeId = offboarding.employee?._id || offboarding.employee;
      await completeEmployeeTask(employeeId, task._id);
      toast.success('Task marked complete.');
      await load();
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setBusyTaskId(null);
    }
  };

  const handleRevoke = async (offboarding) => {
    if (!canFinalize) return;
    if (!window.confirm('Revoke system access for this employee now?')) return;
    setActionBusy(true);
    try {
      const employeeId = offboarding.employee?._id || offboarding.employee;
      await revokeAccess(employeeId);
      toast.success('System access revoked.');
      await load();
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setActionBusy(false);
    }
  };

  const handleApprove = async (offboarding) => {
    if (!canFinalize) return;
    if (!window.confirm('Finalize offboarding? This will mark the employee as TERMINATED.')) return;
    setActionBusy(true);
    try {
      const employeeId = offboarding.employee?._id || offboarding.employee;
      await approveOffboarding(employeeId);
      toast.success('Offboarding complete. Employee terminated.');
      await load();
      setActiveId(null);
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setActionBusy(false);
    }
  };

  if (active) {
    const empName = `${active.employee?.user?.firstName || ''} ${active.employee?.user?.lastName || ''}`.trim();
    const canApprove = canFinalize && active.progress === 100 && active.accessRevoked && active.phase !== 'completed';

    return (
      <div>
        <div className="page-header">
          <div>
            <button className="btn btn-outline" style={{ marginBottom: 12 }} onClick={() => setActiveId(null)}>
              ← Back to list
            </button>
            <h1 className="page-title">{empName || 'Offboarding'} </h1>
            <p className="page-subtitle">
              {TYPE_LABEL[active.type] || active.type} · Last working day{' '}
              {active.lastWorkingDay ? new Date(active.lastWorkingDay).toLocaleDateString('en-KE') : '—'}
            </p>
          </div>
          <span className={`badge ${PHASE_BADGE[active.phase]}`} style={{ textTransform: 'capitalize' }}>
            {PHASE_LABEL[active.phase] || active.phase}
          </span>
        </div>

        <div className="card card-body" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 700 }}>Checklist Progress</span>
            <span style={{ fontSize: 20, fontWeight: 800, color: active.progress === 100 ? 'var(--success)' : 'var(--color-primary)' }}>
              {active.progress}%
            </span>
          </div>
          <div className="progress-bar" style={{ height: 10 }}>
            <div
              className="progress-fill"
              style={{ width: `${active.progress}%`, background: active.progress === 100 ? 'var(--success)' : 'var(--color-primary)' }}
            />
          </div>
        </div>

        <div
          className="card card-body"
          style={{ marginBottom: 20, border: `1px solid ${active.accessRevoked ? 'var(--success)' : 'var(--color-danger)'}` }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700 }}> System Access</h3>
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>
                {active.accessRevoked
                  ? `Revoked ${new Date(active.accessRevokedAt).toLocaleString('en-KE')}`
                  : canFinalize
                    ? 'Not yet revoked — this does not wait on the checklist below. Revoke on or before the last working day.'
                    : 'Not yet revoked. Only HR/Admin can revoke system access.'}
              </p>
            </div>
            {active.accessRevoked ? (
              <span className="badge badge-success">Access Revoked</span>
            ) : (
              canFinalize && (
                <button className="btn btn-danger" onClick={() => handleRevoke(active)} disabled={actionBusy}>
                  Revoke Access Now
                </button>
              )
            )}
          </div>
        </div>

        <TaskGroups
          offboarding={active}
          canComplete={staffCanComplete}
          onComplete={(task) => handleCompleteTask(active, task)}
          busyTaskId={busyTaskId}
        />

        <div className="card card-body">
          {active.phase === 'completed' ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}></div>
              <h3 style={{ fontWeight: 700 }}>Offboarding Complete</h3>
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                Approved {new Date(active.approvedAt).toLocaleString('en-KE')}
              </p>
            </div>
          ) : canFinalize ? (
            <>
              {!canApprove && (
                <div className="alert alert-warning" style={{ marginBottom: 12 }}>
                  ⚠️ Cannot finalize yet — requires 100% checklist progress
                  {!active.accessRevoked && ' and access revoked'}.
                </div>
              )}
              <button className="btn btn-danger" onClick={() => handleApprove(active)} disabled={!canApprove || actionBusy}>
                📦 Approve & Finalize (Terminate Employee)
              </button>
            </>
          ) : (
            <div className="alert alert-primary">
              Finalizing this offboarding (access revocation and termination) requires HR or Admin.
              You can still initiate exits and complete tasks assigned to you or your team.
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Offboarding </h1>
          <p className="page-subtitle">Structured employee exit workflow</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowInitiate(true)}>
          + Initiate Offboarding
        </button>
      </div>

      {loading ? (
        <div className="spinner-center"><div className="spinner spinner-lg" /></div>
      ) : allOffboarding.length === 0 ? (
        <div className="empty-state card card-body">
          <div className="empty-icon"></div>
          <h3>No offboarding records</h3>
          <p>Click &ldquo;...&rdquo; to start an employee exit.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {allOffboarding.map((ob) => {
            const empName = `${ob.employee?.user?.firstName || ''} ${ob.employee?.user?.lastName || ''}`.trim();
            const done = ob.tasks?.filter((t) => t.completed).length || 0;
            const total = ob.tasks?.length || 0;

            return (
              <div
                key={ob._id}
                className="card card-body"
                style={{ cursor: 'pointer' }}
                onClick={() => setActiveId(ob._id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div className="avatar avatar-lg">
                      {ob.employee?.user?.firstName?.[0]}
                      {ob.employee?.user?.lastName?.[0]}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{empName}</div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                        {TYPE_LABEL[ob.type] || ob.type} · Last day{' '}
                        {ob.lastWorkingDay ? new Date(ob.lastWorkingDay).toLocaleDateString('en-KE') : '—'}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    {!ob.accessRevoked && ob.phase !== 'completed' && (
                      <span className="badge badge-danger" style={{ fontSize: 10 }}>Access Live</span>
                    )}
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 20, fontWeight: 800, color: ob.progress === 100 ? 'var(--success)' : 'var(--color-primary)' }}>
                        {ob.progress}%
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{done}/{total} tasks</div>
                    </div>
                    <span className={`badge ${PHASE_BADGE[ob.phase]}`} style={{ textTransform: 'capitalize' }}>
                      {PHASE_LABEL[ob.phase] || ob.phase}
                    </span>
                  </div>
                </div>
                <div className="progress-bar" style={{ marginTop: 12 }}>
                  <div
                    className="progress-fill"
                    style={{ width: `${ob.progress}%`, background: ob.progress === 100 ? 'var(--success)' : 'var(--color-primary)' }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={showInitiate}
        onClose={() => setShowInitiate(false)}
        title="Initiate Offboarding"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setShowInitiate(false)}>Cancel</button>
            <button className="btn btn-danger" form="offboard-form" type="submit" disabled={submitting}>
              {submitting ? <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> : '📦'} Initiate
            </button>
          </>
        }
      >
        <form id="offboard-form" onSubmit={handleInitiate}>
          <div className="form-group">
            <label className="form-label">Employee *</label>
            <select
              className="form-control form-select"
              value={form.employeeId}
              onChange={(e) => setForm((p) => ({ ...p, employeeId: e.target.value }))}
              required
            >
              <option value="">Select departing employee…</option>
              {employees.map((e) => (
                <option key={e._id} value={e._id}>
                  {e.user?.firstName} {e.user?.lastName} — {e.department || 'No dept'}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Last Working Day *</label>
            <input
              className="form-control"
              type="date"
              value={form.lastWorkingDay}
              onChange={(e) => setForm((p) => ({ ...p, lastWorkingDay: e.target.value }))}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Type *</label>
            <select
              className="form-control form-select"
              value={form.type}
              onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
            >
              {Object.entries(TYPE_LABEL).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Reason / Notes</label>
            <textarea
              className="form-control"
              rows={2}
              value={form.reason}
              onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))}
              placeholder="Optional context…"
            />
          </div>
          <div className="alert alert-warning" style={{ marginTop: 8 }}>
            📋 A default offboarding checklist will be created automatically. Access is not revoked
            automatically here — the last-working-day scheduler handles that, or HR/Admin can revoke
            manually from the detail view.
          </div>
        </form>
      </Modal>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   ENTRY POINT
   Admin/Superuser/HR/Manager land on the staff view (scoped
   server-side for managers). Everyone else sees their own
   offboarding record, if any.
   ══════════════════════════════════════════════════════════ */
export default function OffboardingForm() {
  const { isAdmin, isHR, isManager } = useAuth();
  return isAdmin || isHR || isManager ? <StaffOffboarding /> : <MyOffboarding />;
}