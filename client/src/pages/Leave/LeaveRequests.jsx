import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { applyLeave, getLeaves, approveLeave, rejectLeave, cancelLeave } from '../../services/leaveService';
import { getError } from '../../services/api';
import { useAuth } from '../../context/useAuth';
import Modal from '../../components/Modal';
import Table from '../../components/Table';

const TYPES = ['annual','sick','maternity','paternity','unpaid','other'];
const STATUS_BADGE = { pending:'badge-warning', approved:'badge-success', rejected:'badge-danger', cancelled:'badge-neutral' };
const fmtDate = d => d ? new Date(d).toLocaleDateString('en-KE',{day:'2-digit',month:'short',year:'numeric'}) : '—';

export default function LeaveRequests() {
  const { isAdmin, isHR, isManager } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [showApply, setShowApply] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ leaveType:'annual', startDate:'', endDate:'', reason:'' });

  const canManage = isAdmin || isHR || isManager;
  const today = new Date().toISOString().split('T')[0];

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const { data } = await getLeaves(
        statusFilter
          ? { status: statusFilter }
          : {}
      );

      setLeaves(data?.data || []);

    } catch (err) {
      toast.error(getError(err));

    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const handleApply = async e => {
    e.preventDefault();
    if (form.endDate < form.startDate) return toast.error('End date cannot be before start date.');
    setSubmitting(true);
    try {
      await applyLeave(form);
      toast.success('Leave request submitted!');
      setShowApply(false);
      setForm({ leaveType:'annual', startDate:'', endDate:'', reason:'' });
      load();
    } catch(err) { toast.error(getError(err)); }
    finally { setSubmitting(false); }
  };

  const handleApprove = async (id) => {
    try { await approveLeave(id, { adminNote: 'Approved.' }); toast.success('Leave approved.'); load(); }
    catch(err) { toast.error(getError(err)); }
  };

  const handleReject = async (id) => {
    const note = prompt('Reason for rejection (optional):') || '';
    try { await rejectLeave(id, { adminNote: note }); toast.success('Leave rejected.'); load(); }
    catch(err) { toast.error(getError(err)); }
  };

  const handleCancel = async (id) => {
    if (!confirm('Cancel this leave request?')) return;
    try { await cancelLeave(id); toast.success('Leave cancelled.'); load(); }
    catch(err) { toast.error(getError(err)); }
  };

  const workDays = () => {
    if (!form.startDate || !form.endDate) return 0;
    let count = 0, cur = new Date(form.startDate);
    while (cur <= new Date(form.endDate)) { if (cur.getDay()!==0&&cur.getDay()!==6) count++; cur.setDate(cur.getDate()+1); }
    return count;
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Leave Management 🏖️</h1>
          <p className="page-subtitle">{canManage ? 'Manage all leave requests' : 'Apply and track your leave'}</p>
        </div>
        <button className="btn btn-primary" onClick={()=>setShowApply(true)}>+ Apply for Leave</button>
      </div>

      <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
        <div className="tabs" style={{ margin:0 }}>
          {['','pending','approved','rejected','cancelled'].map(s=>(
            <button key={s} className={`tab ${statusFilter===s?'active':''}`} onClick={()=>setStatusFilter(s)} style={{ textTransform:'capitalize' }}>
              {s||'All'}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Leave Records <span style={{ color:'var(--text-muted)', fontWeight:400, fontSize:13 }}>({leaves.length})</span></span>
        </div>
        <Table loading={loading} data={leaves} columns={[
          { label:'Employee', render: l => (
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div className="avatar" style={{ width:28, height:28, fontSize:11 }}>{l.employee?.user?.firstName?.[0]}{l.employee?.user?.lastName?.[0]}</div>
              <div>
                <div style={{ fontWeight:600, fontSize:13 }}>{l.employee?.user?.firstName} {l.employee?.user?.lastName}</div>
                <div style={{ fontSize:11, color:'var(--text-muted)' }}>{l.employee?.department}</div>
              </div>
            </div>
          )},
          { label:'Type', render: l => <span className="badge badge-primary" style={{ textTransform:'capitalize' }}>{l.leaveType}</span> },
          { label:'Dates', render: l => <div><div style={{fontSize:12}}>{fmtDate(l.startDate)}</div><div style={{fontSize:11,color:'var(--text-muted)'}}>→ {fmtDate(l.endDate)}</div></div> },
          { label:'Days', render: l => <strong>{l.totalDays}</strong> },
          { label:'Status', render: l => <span className={`badge ${STATUS_BADGE[l.status]||'badge-neutral'}`} style={{ textTransform:'capitalize' }}>{l.status}</span> },
          { label:'Reason', render: l => <span style={{ fontSize:12, color:'var(--text-muted)', maxWidth:150, display:'block', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{l.reason||'—'}</span> },
          { label:'Actions', render: l => (
            <div style={{ display:'flex', gap:6 }}>
              {canManage && l.status==='pending' && <>
                <button className="btn btn-sm btn-success" onClick={()=>handleApprove(l._id)}>✓</button>
                <button className="btn btn-sm btn-danger" onClick={()=>handleReject(l._id)}>✗</button>
              </>}
              {l.status==='pending' && <button className="btn btn-sm btn-outline" onClick={()=>handleCancel(l._id)}>Cancel</button>}
            </div>
          )},
        ]} emptyMsg="No leave records found." />
      </div>

      {/* Apply Modal */}
      <Modal open={showApply} onClose={()=>setShowApply(false)} title="Apply for Leave"
        footer={<>
          <button className="btn btn-outline" onClick={()=>setShowApply(false)}>Cancel</button>
          <button className="btn btn-primary" form="leave-form" type="submit" disabled={submitting}>
            {submitting ? <span className="spinner" style={{width:14,height:14,borderWidth:2}} /> : null} Submit Request
          </button>
        </>}
      >
        <form id="leave-form" onSubmit={handleApply}>
          <div className="form-group">
            <label className="form-label">Leave Type *</label>
            <select className="form-control form-select" value={form.leaveType} onChange={e=>setForm(p=>({...p,leaveType:e.target.value}))}>
              {TYPES.map(t=><option key={t} value={t} style={{textTransform:'capitalize'}}>{t}</option>)}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Start Date *</label>
              <input className="form-control" type="date" min={today} value={form.startDate} onChange={e=>setForm(p=>({...p,startDate:e.target.value}))} required />
            </div>
            <div className="form-group">
              <label className="form-label">End Date *</label>
              <input className="form-control" type="date" min={form.startDate||today} value={form.endDate} onChange={e=>setForm(p=>({...p,endDate:e.target.value}))} required />
            </div>
          </div>
          {workDays() > 0 && (
            <div style={{ background:'var(--primary-light)', borderRadius:8, padding:'10px 14px', marginBottom:12, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontSize:13, color:'var(--primary)' }}>Working days requested</span>
              <strong style={{ fontSize:20, color:'var(--primary)' }}>{workDays()}</strong>
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Reason <span style={{ fontWeight:400, color:'var(--text-muted)' }}>(optional)</span></label>
            <textarea className="form-control" rows={3} maxLength={500} value={form.reason} onChange={e=>setForm(p=>({...p,reason:e.target.value}))} placeholder="Brief reason…" />
          </div>
        </form>
      </Modal>
    </div>
  );
}