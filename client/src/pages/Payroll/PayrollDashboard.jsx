import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { getMyPayroll, getAllPayroll, previewPayroll, finalizePayroll } from '../../services/payrollService';
import { getEmployees } from '../../services/employeeService';
import { getError } from '../../services/api';
import { useAuth } from '../../context/useAuth';
import Modal from '../../components/Modal';
import Table from '../../components/Table';

const fmt = n => n != null ? `KES ${Number(n).toLocaleString()}` : '—';
const STATUS_BADGE = { draft:'badge-warning', finalized:'badge-primary', paid:'badge-success' };

export default function PayrollDashboard() {
  const { isAdmin, isHR } = useAuth();
  const [myPayrolls, setMyPayrolls]   = useState([]);
  const [allPayrolls, setAllPayrolls] = useState([]);
  const [employees, setEmployees]     = useState([]);
  const [loading, setLoading]         = useState(true);
  const [view, setView]               = useState(isAdmin || isHR ? 'all' : 'mine');
  const [preview, setPreview]         = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showFinalize, setShowFinalize] = useState(false);
  const [acting, setActing]           = useState(false);

  const now = new Date();
  const curPeriod = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  const [form, setForm] = useState({ employeeId:'', period: curPeriod });
  const [finalForm, setFinalForm] = useState({ employeeId:'', period: curPeriod, allowances:{ housing:0, transport:0, medical:0, other:0 }, notes:'' });

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const [myRes] = await Promise.all([getMyPayroll()]);
      setMyPayrolls(myRes.data.data);

      if (isAdmin || isHR) {
        const [allRes, empRes] = await Promise.all([
          getAllPayroll(),
          getEmployees(),
        ]);

        setAllPayrolls(allRes.data.data);
        setEmployees(empRes.data.data);
      }

    } catch (err) {
      toast.error(getError(err));
    } finally {
      setLoading(false);
    }
  }, [isAdmin, isHR]);

  useEffect(() => { load(); }, [load]);

  const handlePreview = async e => {
    e.preventDefault();
    setActing(true);
    try {
      const { data } = await previewPayroll(form);
      setPreview(data.data);
      setShowPreview(true);
    } catch(err) { toast.error(getError(err)); }
    finally { setActing(false); }
  };

  const handleFinalize = async e => {
    e.preventDefault();
    setActing(true);
    try {
      await finalizePayroll(finalForm);
      toast.success('Payroll finalized! Employee notified.');
      setShowFinalize(false);
      load();
    } catch(err) { toast.error(getError(err)); }
    finally { setActing(false); }
  };

  const setAllow = (k, v) => setFinalForm(p => ({ ...p, allowances: { ...p.allowances, [k]: Number(v) } }));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Payroll 💰</h1>
          <p className="page-subtitle">{isAdmin || isHR ? 'Process and manage payroll' : 'Your payslips and compensation history'}</p>
        </div>
        {(isAdmin || isHR) && (
          <div style={{ display:'flex', gap:10 }}>
            <button className="btn btn-outline" onClick={() => setShowPreview(false) || setShowPreview(true) || setPreview(null) || setForm({ employeeId:'', period:curPeriod })}>
              📋 Preview
            </button>
            <button className="btn btn-primary" onClick={() => setShowFinalize(true)}>⚡ Finalize Payroll</button>
          </div>
        )}
      </div>

      {(isAdmin || isHR) && (
        <div className="tabs">
          <button className={`tab ${view==='all'?'active':''}`} onClick={() => setView('all')}>All Payroll</button>
          <button className={`tab ${view==='mine'?'active':''}`} onClick={() => setView('mine')}>My Payslips</button>
        </div>
      )}

      {/* My Payslips */}
      {view === 'mine' && (
        <div className="card">
          <div className="card-header"><span className="card-title">My Payslips</span></div>
          <Table loading={loading} data={myPayrolls} emptyMsg="No payslips yet." columns={[
            { label:'Period', key:'period' },
            { label:'Basic Salary', render: p => fmt(p.basicSalary) },
            { label:'Gross Pay', render: p => fmt(p.grossPay) },
            { label:'PAYE', render: p => fmt(p.deductions?.paye) },
            { label:'NHIF', render: p => fmt(p.deductions?.nhif) },
            { label:'NSSF', render: p => fmt(p.deductions?.nssf) },
            { label:'Net Pay', render: p => <strong style={{ color:'var(--success)' }}>{fmt(p.netPay)}</strong> },
            { label:'Days Worked', key:'daysWorked' },
            { label:'Status', render: p => <span className={`badge ${STATUS_BADGE[p.status]}`} style={{textTransform:'capitalize'}}>{p.status}</span> },
          ]} />
        </div>
      )}

      {/* All Payroll (admin) */}
      {view === 'all' && (isAdmin || isHR) && (
        <div className="card">
          <div className="card-header"><span className="card-title">All Payroll Records</span></div>
          <Table loading={loading} data={allPayrolls} emptyMsg="No payroll records." columns={[
            { label:'Employee', render: p => (
              <div>
                <div style={{ fontWeight:600, fontSize:13 }}>{p.employee?.user?.firstName} {p.employee?.user?.lastName}</div>
                <div style={{ fontSize:11, color:'var(--text-muted)' }}>{p.employee?.department}</div>
              </div>
            )},
            { label:'Period', key:'period' },
            { label:'Gross', render: p => fmt(p.grossPay) },
            { label:'Deductions', render: p => fmt((p.deductions?.paye||0)+(p.deductions?.nhif||0)+(p.deductions?.nssf||0)) },
            { label:'Net Pay', render: p => <strong style={{ color:'var(--success)' }}>{fmt(p.netPay)}</strong> },
            { label:'Days', key:'daysWorked' },
            { label:'Status', render: p => <span className={`badge ${STATUS_BADGE[p.status]}`} style={{textTransform:'capitalize'}}>{p.status}</span> },
            { label:'Finalized By', render: p => p.finalizedBy ? `${p.finalizedBy?.firstName||''} ${p.finalizedBy?.lastName||''}` : '—' },
          ]} />
        </div>
      )}

      {/* Preview Modal */}
      <Modal open={showPreview && !preview} onClose={() => setShowPreview(false)} title="Preview Payroll">
        <form onSubmit={handlePreview}>
          <div className="form-group">
            <label className="form-label">Employee *</label>
            <select className="form-control form-select" value={form.employeeId} onChange={e => setForm(p=>({...p,employeeId:e.target.value}))} required>
              <option value="">Select employee…</option>
              {employees.map(e => <option key={e._id} value={e._id}>{e.user?.firstName} {e.user?.lastName} — {e.department}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Period (YYYY-MM) *</label>
            <input className="form-control" value={form.period} onChange={e=>setForm(p=>({...p,period:e.target.value}))} required pattern="\d{4}-\d{2}" placeholder="e.g. 2025-07" />
          </div>
          <div className="modal-footer" style={{ padding:0, borderTop:'none', marginTop:16 }}>
            <button className="btn btn-outline" type="button" onClick={() => setShowPreview(false)}>Cancel</button>
            <button className="btn btn-primary" type="submit" disabled={acting}>
              {acting ? <span className="spinner" style={{width:14,height:14,borderWidth:2}}/> : null} Calculate
            </button>
          </div>
        </form>
      </Modal>

      {/* Preview Result */}
      {preview && (
        <Modal open={!!preview} onClose={() => setPreview(null)} title={`Payroll Preview — ${preview.period}`}>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <div style={{ padding:'12px 16px', background:'var(--surface-2)', borderRadius:8 }}>
              <strong>{preview.employee?.name}</strong> · {preview.employee?.department} · {preview.employee?.position}
            </div>
            {[
              ['Basic Salary', preview.basicSalary], ['Overtime Pay', preview.overtimePay],
              ['Gross Pay', preview.grossPay], ['PAYE Tax', preview.deductions?.paye],
              ['NHIF', preview.deductions?.nhif], ['NSSF', preview.deductions?.nssf],
            ].map(([l, v]) => (
              <div key={l} style={{ display:'flex', justifyContent:'space-between', fontSize:13, padding:'6px 0', borderBottom:'1px solid var(--border)' }}>
                <span style={{ color:'var(--text-muted)' }}>{l}</span>
                <strong>{fmt(v)}</strong>
              </div>
            ))}
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:16, fontWeight:800, padding:'10px 0', color:'var(--success)' }}>
              <span>Net Pay</span><span>{fmt(preview.netPay)}</span>
            </div>
            <div style={{ fontSize:12, color:'var(--text-muted)' }}>Days worked: {preview.daysWorked} · Overtime: {preview.overtimeHours}h</div>
          </div>
        </Modal>
      )}

      {/* Finalize Modal */}
      <Modal open={showFinalize} onClose={() => setShowFinalize(false)} title="Finalize Payroll"
        footer={<>
          <button className="btn btn-outline" onClick={() => setShowFinalize(false)}>Cancel</button>
          <button className="btn btn-primary" form="finalize-form" type="submit" disabled={acting}>
            {acting ? <span className="spinner" style={{width:14,height:14,borderWidth:2}}/> : null} Finalize
          </button>
        </>}
      >
        <form id="finalize-form" onSubmit={handleFinalize}>
          <div className="form-group">
            <label className="form-label">Employee *</label>
            <select className="form-control form-select" value={finalForm.employeeId} onChange={e=>setFinalForm(p=>({...p,employeeId:e.target.value}))} required>
              <option value="">Select employee…</option>
              {employees.map(e => <option key={e._id} value={e._id}>{e.user?.firstName} {e.user?.lastName}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Period *</label>
            <input className="form-control" value={finalForm.period} onChange={e=>setFinalForm(p=>({...p,period:e.target.value}))} required pattern="\d{4}-\d{2}" />
          </div>
          <p style={{ fontSize:12, fontWeight:700, color:'var(--text-muted)', margin:'12px 0 8px', textTransform:'uppercase', letterSpacing:'.06em' }}>Allowances (KES)</p>
          <div className="form-row">
            {['housing','transport','medical','other'].map(k => (
              <div key={k} className="form-group">
                <label className="form-label" style={{ textTransform:'capitalize' }}>{k}</label>
                <input className="form-control" type="number" min={0} value={finalForm.allowances[k]} onChange={e => setAllow(k, e.target.value)} />
              </div>
            ))}
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea className="form-control" rows={2} value={finalForm.notes} onChange={e=>setFinalForm(p=>({...p,notes:e.target.value}))} placeholder="Optional notes…" />
          </div>
          <div className="alert alert-warning" style={{ marginTop:8 }}>
            ⚠️ Payroll cannot be re-finalized once submitted for the same period.
          </div>
        </form>
      </Modal>
    </div>
  );
}