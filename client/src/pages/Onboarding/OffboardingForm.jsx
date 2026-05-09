import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/useAuth';
import { deactivateEmployee } from '../../services/employeeService';
import { getEmployees } from '../../services/employeeService';
import { getError } from '../../services/api';

const OFFBOARD_CHECKLIST = [
  { id:'knowledge', category:'Documentation', label:'Knowledge Transfer', description:'Document processes and hand off ongoing work to successor', assignedTo:'Employee', required:true },
  { id:'equipment', category:'IT / Assets', label:'Return Equipment', description:'Laptop, access badge, phone, and any company property', assignedTo:'IT / Admin', required:true },
  { id:'access', category:'IT / Assets', label:'Revoke System Access', description:'Disable all accounts: email, Slack, GitHub, cloud tools', assignedTo:'IT', required:true },
  { id:'payroll', category:'Finance', label:'Final Payroll & Settlement', description:'Process final pay, leave payout, and any outstanding expenses', assignedTo:'Finance', required:true },
  { id:'benefits', category:'Finance', label:'Benefits Cessation', description:'Stop NHIF, NSSF and any company benefits', assignedTo:'HR', required:true },
  { id:'interview', category:'HR', label:'Exit Interview', description:'Conduct structured exit interview to capture feedback', assignedTo:'HR', required:true },
  { id:'nda', category:'Legal', label:'NDA & IP Reminder', description:'Remind employee of ongoing NDA and confidentiality obligations', assignedTo:'Legal / HR', required:true },
  { id:'announcement', category:'Communications', label:'Team Announcement', description:'Draft and send farewell communication to the team', assignedTo:'Manager', required:false },
  { id:'reference', category:'HR', label:'Reference Letter', description:'Provide reference letter if applicable', assignedTo:'HR', required:false },
  { id:'alumni', category:'HR', label:'Alumni Network Invite', description:'Invite to company alumni community if desired', assignedTo:'HR', required:false },
];

const REASONS = ['Resignation','Retirement','Redundancy / Retrenchment','Contract End','Mutual Agreement','Termination','Other'];

export default function OffboardingForm() {
  const { isAdmin, isHR } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [checked, setChecked]     = useState({});
  const [step, setStep]           = useState(1); // 1: details, 2: checklist, 3: confirm
  const [submitting, setSub]      = useState(false);
  const [done, setDone]           = useState(false);
  const [form, setForm]           = useState({
    employeeId:'', exitDate:'', reason:'Resignation', notes:'',
    handoverTo:'', exitInterviewNotes:'',
  });

  useEffect(() => {
    if (isAdmin || isHR) {
      getEmployees({ status: 'active' })
        .then(r => setEmployees(r.data.data))
        .catch(() => {});
    }

    const init = {};

    OFFBOARD_CHECKLIST.forEach(t => {
      init[t.id] = false;
    });

    setChecked(init);
  }, [isAdmin, isHR]);

  const toggleCheck = (id) => setChecked(p => ({ ...p, [id]: !p[id] }));

  const requiredDone = OFFBOARD_CHECKLIST
    .filter(t => t.required)
    .every(t => checked[t.id]);

  const totalDone = Object.values(checked).filter(Boolean).length;

  const handleSubmit = async () => {
    if (!form.employeeId) return toast.error('Please select an employee.');
    if (!form.exitDate)   return toast.error('Please set an exit date.');
    if (!requiredDone)    return toast.error('All required checklist items must be completed first.');
    setSub(true);
    try {
      await deactivateEmployee(form.employeeId);
      toast.success('Offboarding completed. Employee account deactivated.');
      setDone(true);
    } catch (err) { toast.error(getError(err)); }
    finally { setSub(false); }
  };

  if (!isAdmin && !isHR) {
    return (
      <div>
        <div className="page-header"><h1 className="page-title">Offboarding 📦</h1></div>
        <div className="card card-body empty-state">
          <div className="empty-icon">🔒</div>
          <h3>Access Restricted</h3>
          <p>Offboarding workflows are managed by HR and Admin only.</p>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div>
        <div className="page-header"><h1 className="page-title">Offboarding 📦</h1></div>
        <div className="card card-body" style={{ textAlign:'center', padding:'60px 40px' }}>
          <div style={{ fontSize:64, marginBottom:16 }}>✅</div>
          <h2 style={{ fontWeight:800, fontSize:22, marginBottom:8 }}>Offboarding Complete</h2>
          <p style={{ color:'var(--text-muted)', marginBottom:24 }}>
            The employee account has been deactivated and all {totalDone} checklist items are recorded.
          </p>
          <button className="btn btn-primary" onClick={() => { setDone(false); setStep(1); setForm({ employeeId:'', exitDate:'', reason:'Resignation', notes:'', handoverTo:'', exitInterviewNotes:'' }); const init={}; OFFBOARD_CHECKLIST.forEach(t=>{ init[t.id]=false; }); setChecked(init); }}>
            Start Another Offboarding
          </button>
        </div>
      </div>
    );
  }

  const catGroups = OFFBOARD_CHECKLIST.reduce((acc, t) => {
    if (!acc[t.category]) acc[t.category] = [];
    acc[t.category].push(t);
    return acc;
  }, {});

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Offboarding 📦</h1>
          <p className="page-subtitle">Structured employee exit workflow</p>
        </div>
      </div>

      {/* Step indicator */}
      <div style={{ display:'flex', gap:0, marginBottom:24, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, overflow:'hidden' }}>
        {[['1','Exit Details'],['2','Checklist'],['3','Confirm & Close']].map(([n, label], i) => (
          <div key={n} onClick={() => i+1 < step && setStep(i+1)}
            style={{ flex:1, padding:'12px 20px', display:'flex', alignItems:'center', gap:10,
              background: step===i+1 ? 'var(--primary)' : step>i+1 ? 'var(--success-light)' : 'transparent',
              color: step===i+1 ? '#fff' : step>i+1 ? 'var(--success)' : 'var(--text-muted)',
              cursor: step>i+1 ? 'pointer' : 'default',
              borderRight: i<2 ? '1px solid var(--border)' : 'none',
              transition:'all .2s',
            }}>
            <div style={{ width:24, height:24, borderRadius:'50%', display:'grid', placeItems:'center', fontSize:12, fontWeight:800,
              background: step===i+1 ? 'rgba(255,255,255,.25)' : step>i+1 ? 'var(--success)' : 'var(--surface-2)',
              color: step>i+1 ? '#fff' : 'inherit',
            }}>
              {step>i+1 ? '✓' : n}
            </div>
            <span style={{ fontSize:13, fontWeight:600 }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Step 1: Details */}
      {step === 1 && (
        <div className="card card-body">
          <h3 style={{ fontSize:15, fontWeight:700, marginBottom:20 }}>Exit Details</h3>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Employee *</label>
              <select className="form-control form-select" value={form.employeeId} onChange={e => setForm(p=>({...p,employeeId:e.target.value}))} required>
                <option value="">Select departing employee…</option>
                {employees.map(e => (
                  <option key={e._id} value={e._id}>
                    {e.user?.firstName} {e.user?.lastName} — {e.department}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Exit Date *</label>
              <input className="form-control" type="date" value={form.exitDate} onChange={e => setForm(p=>({...p,exitDate:e.target.value}))} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Reason for Leaving *</label>
              <select className="form-control form-select" value={form.reason} onChange={e => setForm(p=>({...p,reason:e.target.value}))}>
                {REASONS.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Handover To</label>
              <input className="form-control" value={form.handoverTo} onChange={e => setForm(p=>({...p,handoverTo:e.target.value}))} placeholder="Name of handover recipient" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Exit Interview Notes</label>
            <textarea className="form-control" rows={3} value={form.exitInterviewNotes} onChange={e => setForm(p=>({...p,exitInterviewNotes:e.target.value}))} placeholder="Key insights from exit interview…" />
          </div>
          <div className="form-group">
            <label className="form-label">Additional Notes</label>
            <textarea className="form-control" rows={2} value={form.notes} onChange={e => setForm(p=>({...p,notes:e.target.value}))} placeholder="Any special considerations…" />
          </div>
          <div style={{ display:'flex', justifyContent:'flex-end', marginTop:8 }}>
            <button className="btn btn-primary" onClick={() => { if (!form.employeeId || !form.exitDate) return toast.error('Employee and exit date required.'); setStep(2); }}>
              Next: Checklist →
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Checklist */}
      {step === 2 && (
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <div>
              <p style={{ fontSize:13, color:'var(--text-muted)' }}>{totalDone} of {OFFBOARD_CHECKLIST.length} tasks completed</p>
              <div className="progress-bar" style={{ width:200, marginTop:4 }}>
                <div className="progress-fill" style={{ width:`${(totalDone/OFFBOARD_CHECKLIST.length)*100}%` }} />
              </div>
            </div>
          </div>

          {Object.entries(catGroups).map(([cat, tasks]) => (
            <div key={cat} className="card" style={{ marginBottom:16 }}>
              <div className="card-header">
                <span className="card-title">{cat}</span>
                <span style={{ fontSize:12, color:'var(--text-muted)' }}>
                  {tasks.filter(t=>checked[t.id]).length}/{tasks.length} done
                </span>
              </div>
              <div className="card-body" style={{ padding:'0 20px' }}>
                {tasks.map(task => (
                  <div key={task.id} style={{ display:'flex', alignItems:'flex-start', gap:12, padding:'12px 0', borderBottom:'1px solid var(--border)' }}>
                    <input
                      type="checkbox"
                      checked={checked[task.id]||false}
                      onChange={() => toggleCheck(task.id)}
                      style={{ marginTop:3, width:16, height:16, cursor:'pointer', accentColor:'var(--primary)' }}
                    />
                    <div style={{ flex:1 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                        <span style={{ fontSize:13, fontWeight: checked[task.id] ? 400 : 600, textDecoration: checked[task.id] ? 'line-through' : 'none', color: checked[task.id] ? 'var(--text-muted)' : 'var(--text)' }}>
                          {task.label}
                        </span>
                        <div style={{ display:'flex', gap:6, flexShrink:0, marginLeft:12 }}>
                          {task.required && <span className="badge badge-danger" style={{ fontSize:10 }}>Required</span>}
                          <span className="badge badge-neutral" style={{ fontSize:10 }}>{task.assignedTo}</span>
                        </div>
                      </div>
                      <p style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>{task.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {!requiredDone && (
            <div className="alert alert-warning" style={{ marginBottom:16 }}>
              ⚠️ Complete all <strong>required</strong> items before proceeding.
            </div>
          )}

          <div style={{ display:'flex', gap:10, justifyContent:'space-between' }}>
            <button className="btn btn-outline" onClick={() => setStep(1)}>← Back</button>
            <button className="btn btn-primary" onClick={() => { if(!requiredDone) return toast.error('Complete all required tasks first.'); setStep(3); }} disabled={!requiredDone}>
              Next: Confirm →
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Confirm */}
      {step === 3 && (
        <div className="card card-body">
          <h3 style={{ fontSize:15, fontWeight:700, marginBottom:20 }}>Confirm Offboarding</h3>

          <div style={{ padding:'16px', background:'var(--danger-light)', borderRadius:10, marginBottom:20 }}>
            <p style={{ fontSize:14, fontWeight:700, color:'var(--danger)', marginBottom:4 }}>⚠️ This action is irreversible</p>
            <p style={{ fontSize:13, color:'var(--danger)' }}>The employee's account will be deactivated immediately. They will no longer be able to log in.</p>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px 24px', fontSize:13, marginBottom:20 }}>
            {[
              ['Employee', employees.find(e=>e._id===form.employeeId)?.user?.firstName+' '+employees.find(e=>e._id===form.employeeId)?.user?.lastName],
              ['Exit Date', form.exitDate ? new Date(form.exitDate).toLocaleDateString('en-KE') : '—'],
              ['Reason', form.reason],
              ['Handover To', form.handoverTo||'—'],
              ['Tasks Completed', `${totalDone} / ${OFFBOARD_CHECKLIST.length}`],
              ['Required Tasks', requiredDone ? '✅ All done' : '❌ Incomplete'],
            ].map(([l,v]) => (
              <div key={l}>
                <span style={{ color:'var(--text-muted)', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'.05em' }}>{l}</span>
                <p style={{ fontWeight:600, marginTop:2 }}>{v||'—'}</p>
              </div>
            ))}
          </div>

          <div style={{ display:'flex', gap:10, justifyContent:'space-between' }}>
            <button className="btn btn-outline" onClick={() => setStep(2)}>← Back</button>
            <button className="btn btn-danger" onClick={handleSubmit} disabled={submitting}>
              {submitting ? <span className="spinner" style={{ width:14, height:14, borderWidth:2 }} /> : '📦'}
              {' '}{submitting ? 'Processing…' : 'Complete Offboarding'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}