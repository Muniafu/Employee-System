import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { getItems, acknowledge, getStatus, createItem } from '../../services/complianceService';
import { getError } from '../../services/api';
import { useAuth } from '../../context/useAuth';
import Modal from '../../components/Modal';

const TYPE_ICON  = { policy:'📋', training:'📚', certification:'🏆', audit:'🔍', declaration:'✍️' };
const TYPE_COLOR = { policy:'badge-primary', training:'badge-info', certification:'badge-success', audit:'badge-warning', declaration:'badge-danger' };

export default function PolicyAcknowledgment() {
  const { user, isAdmin, isHR } = useAuth();
  const [items, setItems]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState(null);
  const [statusData, setStatusData] = useState(null);
  const [showCreate, setCreate]   = useState(false);
  const [showStatus, setStatus]   = useState(false);
  const [submitting, setSub]      = useState(false);
  const [signature, setSignature] = useState('');
  const [form, setForm]           = useState({
    title: '', type: 'policy', description: '', content: '',
    version: '1.0', effectiveDate: '', isMandatory: true, targetRoles: ['employee'],
  });

  const TYPES = ['policy','training','certification','audit','declaration'];
  const ROLES = ['employee','manager','hr','admin'];

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await getItems();
      setItems(data.data);
    } catch (err) { toast.error(getError(err)); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const hasAcknowledged = (item) =>
    item.acknowledgments?.some(a => a.employee?.user?._id === user?._id || a.employee === user?._id);

  const handleAcknowledge = async () => {
    if (!signature.trim()) return toast.error('Please type your full name as signature.');
    setSub(true);
    try {
      await acknowledge(selected._id, { signature });
      toast.success('Policy acknowledged successfully! ✅');
      setSelected(null);
      setSignature('');
      load();
    } catch (err) { toast.error(getError(err)); }
    finally { setSub(false); }
  };

  const handleViewStatus = async (item) => {
    try {
      const { data } = await getStatus(item._id);
      setStatusData(data.data);
      setStatus(true);
    } catch (err) { toast.error(getError(err)); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSub(true);
    try {
      await createItem(form);
      toast.success('Compliance item created!');
      setCreate(false);
      setForm({ title:'', type:'policy', description:'', content:'', version:'1.0', effectiveDate:'', isMandatory:true, targetRoles:['employee'] });
      load();
    } catch (err) { toast.error(getError(err)); }
    finally { setSub(false); }
  };

  const toggleRole = (role) => {
    setForm(p => ({
      ...p,
      targetRoles: p.targetRoles.includes(role)
        ? p.targetRoles.filter(r => r !== role)
        : [...p.targetRoles, role],
    }));
  };

  const mandatory = items.filter(i => i.isMandatory);
  const optional  = items.filter(i => !i.isMandatory);
  const doneCount = items.filter(i => hasAcknowledged(i)).length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Compliance 📋</h1>
          <p className="page-subtitle">Policy acknowledgments and compliance tracking</p>
        </div>
        {(isAdmin || isHR) && (
          <button className="btn btn-primary" onClick={() => setCreate(true)}>+ Add Policy</button>
        )}
      </div>

      {/* Progress bar */}
      {items.length > 0 && (
        <div className="card card-body" style={{ marginBottom:24 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
            <div>
              <span style={{ fontSize:15, fontWeight:700 }}>Your Compliance Status</span>
              <span style={{ fontSize:13, color:'var(--text-muted)', marginLeft:12 }}>{doneCount} of {items.length} policies acknowledged</span>
            </div>
            <span style={{ fontSize:20, fontWeight:800, color: doneCount===items.length ? 'var(--success)' : 'var(--warning)' }}>
              {items.length > 0 ? Math.round((doneCount/items.length)*100) : 0}%
            </span>
          </div>
          <div className="progress-bar" style={{ height:10 }}>
            <div className="progress-fill" style={{ width:`${items.length > 0 ? (doneCount/items.length)*100 : 0}%`, background: doneCount===items.length ? 'var(--success)' : 'var(--primary)' }} />
          </div>
          {doneCount === items.length && items.length > 0 && (
            <p style={{ marginTop:10, fontSize:13, color:'var(--success)', fontWeight:600 }}>🎉 Fully compliant — all policies acknowledged!</p>
          )}
        </div>
      )}

      {loading
        ? <div className="spinner-center"><div className="spinner spinner-lg" /></div>
        : (
          <>
            {/* Mandatory section */}
            {mandatory.length > 0 && (
              <>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                  <h2 style={{ fontSize:15, fontWeight:700 }}>Mandatory Policies</h2>
                  <span className="badge badge-danger">{mandatory.filter(i=>!hasAcknowledged(i)).length} pending</span>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:28 }}>
                  {mandatory.map(item => {
                    const acked = hasAcknowledged(item);
                    return (
                      <div key={item._id} className="card card-body" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, flexWrap:'wrap', borderLeft:`4px solid ${acked ? 'var(--success)' : 'var(--danger)'}` }}>
                        <div style={{ display:'flex', alignItems:'center', gap:14, flex:1, minWidth:0 }}>
                          <div style={{ fontSize:28, flexShrink:0 }}>{TYPE_ICON[item.type]||'📄'}</div>
                          <div style={{ minWidth:0 }}>
                            <div style={{ fontWeight:700, fontSize:14, marginBottom:2 }}>{item.title}</div>
                            <div style={{ fontSize:12, color:'var(--text-muted)', display:'flex', flexWrap:'wrap', gap:10 }}>
                              <span className={`badge ${TYPE_COLOR[item.type]||'badge-neutral'}`} style={{ textTransform:'capitalize' }}>{item.type}</span>
                              <span>v{item.version}</span>
                              <span>Effective: {item.effectiveDate ? new Date(item.effectiveDate).toLocaleDateString('en-KE') : '—'}</span>
                              <span>{item.acknowledgments?.length||0} acknowledged</span>
                            </div>
                          </div>
                        </div>
                        <div style={{ display:'flex', gap:8, flexShrink:0 }}>
                          {(isAdmin || isHR) && (
                            <button className="btn btn-sm btn-outline" onClick={() => handleViewStatus(item)}>
                              📊 Status
                            </button>
                          )}
                          {acked
                            ? <span className="badge badge-success" style={{ padding:'6px 14px', fontSize:12 }}>✅ Acknowledged</span>
                            : <button className="btn btn-sm btn-primary" onClick={() => { setSelected(item); setSignature(`${user?.firstName} ${user?.lastName}`); }}>
                                ✍️ Acknowledge
                              </button>
                          }
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* Optional section */}
            {optional.length > 0 && (
              <>
                <h2 style={{ fontSize:15, fontWeight:700, marginBottom:12 }}>Optional Policies</h2>
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {optional.map(item => {
                    const acked = hasAcknowledged(item);
                    return (
                      <div key={item._id} className="card card-body" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, flexWrap:'wrap', opacity: acked ? .75 : 1 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:14, flex:1 }}>
                          <div style={{ fontSize:24 }}>{TYPE_ICON[item.type]||'📄'}</div>
                          <div>
                            <div style={{ fontWeight:600, fontSize:13 }}>{item.title}</div>
                            <div style={{ fontSize:11, color:'var(--text-muted)' }}>v{item.version} · {item.type}</div>
                          </div>
                        </div>
                        <div style={{ display:'flex', gap:8 }}>
                          {(isAdmin || isHR) && <button className="btn btn-sm btn-ghost" onClick={() => handleViewStatus(item)}>📊</button>}
                          {acked
                            ? <span className="badge badge-success">✅ Done</span>
                            : <button className="btn btn-sm btn-outline" onClick={() => { setSelected(item); setSignature(`${user?.firstName} ${user?.lastName}`); }}>Acknowledge</button>
                          }
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {items.length === 0 && (
              <div className="empty-state card card-body">
                <div className="empty-icon">📋</div>
                <h3>No compliance policies yet</h3>
                <p>HR will add policies here for team acknowledgment.</p>
              </div>
            )}
          </>
        )
      }

      {/* Acknowledge Modal */}
      {selected && (
        <Modal open onClose={() => { setSelected(null); setSignature(''); }} title={`Acknowledge — ${selected.title}`}
          footer={<>
            <button className="btn btn-outline" onClick={() => { setSelected(null); setSignature(''); }}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAcknowledge} disabled={submitting}>
              {submitting ? <span className="spinner" style={{ width:14, height:14, borderWidth:2 }} /> : '✍️'}
              {' '}Sign & Acknowledge
            </button>
          </>}
        >
          <div style={{ marginBottom:16, padding:'12px 16px', background:'var(--surface-2)', borderRadius:8, fontSize:13, lineHeight:1.7, maxHeight:200, overflowY:'auto' }}>
            {selected.content || selected.description || 'Please read and acknowledge this policy.'}
          </div>
          <div style={{ padding:'10px 14px', background:'var(--warning-light)', borderRadius:8, fontSize:12, color:'var(--warning)', marginBottom:16 }}>
            ⚠️ By signing, you confirm you have read and understood this policy. This action is logged and time-stamped.
          </div>
          <div className="form-group">
            <label className="form-label">Full Name (Digital Signature) *</label>
            <input
              className="form-control"
              value={signature}
              onChange={e => setSignature(e.target.value)}
              placeholder="Type your full name to sign…"
              required
            />
            <p className="form-hint">This serves as your digital signature.</p>
          </div>
          <div style={{ fontSize:12, color:'var(--text-muted)' }}>
            Version {selected.version} · Effective {selected.effectiveDate ? new Date(selected.effectiveDate).toLocaleDateString('en-KE') : '—'}
          </div>
        </Modal>
      )}

      {/* Compliance Status Modal */}
      {showStatus && statusData && (
        <Modal open onClose={() => { setStatus(false); setStatusData(null); }} title={`Compliance Status — ${statusData.title}`}>
          <div className="grid-3" style={{ marginBottom:16 }}>
            {[
              { label:'Total Employees', value: statusData.totalEmployees, color:'var(--primary)' },
              { label:'Acknowledged',    value: statusData.acknowledged,   color:'var(--success)' },
              { label:'Pending',         value: statusData.pending,         color:'var(--danger)' },
            ].map(s => (
              <div key={s.label} style={{ textAlign:'center', padding:'12px', background:'var(--surface-2)', borderRadius:8 }}>
                <div style={{ fontSize:28, fontWeight:800, color:s.color }}>{s.value}</div>
                <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{ marginBottom:12 }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:6 }}>
              <span style={{ fontWeight:600 }}>Completion</span>
              <span style={{ fontWeight:700, color:'var(--primary)' }}>{statusData.completionRate}</span>
            </div>
            <div className="progress-bar" style={{ height:10 }}>
              <div className="progress-fill" style={{ width: statusData.completionRate, background: parseInt(statusData.completionRate) === 100 ? 'var(--success)' : 'var(--primary)' }} />
            </div>
          </div>
          {statusData.acknowledgments?.length > 0 && (
            <div style={{ maxHeight:200, overflowY:'auto' }}>
              <p style={{ fontSize:12, fontWeight:700, color:'var(--text-muted)', marginBottom:8, textTransform:'uppercase', letterSpacing:'.06em' }}>Acknowledgments</p>
              {statusData.acknowledgments.map((a, i) => (
                <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid var(--border)', fontSize:12 }}>
                  <span style={{ fontWeight:600 }}>{a.signature || '—'}</span>
                  <span style={{ color:'var(--text-muted)' }}>{a.acknowledgedAt ? new Date(a.acknowledgedAt).toLocaleDateString('en-KE') : '—'}</span>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}

      {/* Create Policy Modal */}
      <Modal open={showCreate} size="lg" onClose={() => setCreate(false)} title="Add Compliance Policy"
        footer={<>
          <button className="btn btn-outline" onClick={() => setCreate(false)}>Cancel</button>
          <button className="btn btn-primary" form="compliance-form" type="submit" disabled={submitting}>
            {submitting ? <span className="spinner" style={{ width:14, height:14, borderWidth:2 }} /> : null}
            {' '}Create
          </button>
        </>}
      >
        <form id="compliance-form" onSubmit={handleCreate}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Title *</label>
              <input className="form-control" value={form.title} onChange={e => setForm(p=>({...p,title:e.target.value}))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Type</label>
              <select className="form-control form-select" value={form.type} onChange={e => setForm(p=>({...p,type:e.target.value}))}>
                {TYPES.map(t => <option key={t} value={t} style={{ textTransform:'capitalize' }}>{TYPE_ICON[t]} {t}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Version</label>
              <input className="form-control" value={form.version} onChange={e => setForm(p=>({...p,version:e.target.value}))} placeholder="e.g. 1.0" />
            </div>
            <div className="form-group">
              <label className="form-label">Effective Date *</label>
              <input className="form-control" type="date" value={form.effectiveDate} onChange={e => setForm(p=>({...p,effectiveDate:e.target.value}))} required />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-control" rows={2} value={form.description} onChange={e => setForm(p=>({...p,description:e.target.value}))} placeholder="Brief overview…" />
          </div>
          <div className="form-group">
            <label className="form-label">Full Policy Content</label>
            <textarea className="form-control" rows={4} value={form.content} onChange={e => setForm(p=>({...p,content:e.target.value}))} placeholder="Paste the full policy text here…" />
          </div>
          <div className="form-group">
            <label className="form-label">Target Roles</label>
            <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginTop:4 }}>
              {ROLES.map(r => (
                <label key={r} style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer', fontSize:13 }}>
                  <input type="checkbox" checked={form.targetRoles.includes(r)} onChange={() => toggleRole(r)} />
                  <span style={{ textTransform:'capitalize' }}>{r}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer' }}>
              <input type="checkbox" checked={form.isMandatory} onChange={e => setForm(p=>({...p,isMandatory:e.target.checked}))} />
              <span className="form-label" style={{ margin:0 }}>Mark as Mandatory</span>
            </label>
          </div>
        </form>
      </Modal>
    </div>
  );
}