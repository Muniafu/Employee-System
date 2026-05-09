import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { getPrograms, createProgram, enroll, complete } from '../../services/wellnessService';
import { getError } from '../../services/api';
import { useAuth } from '../../context/useAuth';
import Modal from '../../components/Modal';

const CAT_ICON  = { mental_health:'🧘', physical:'💪', financial:'💵', social:'🤝', eap:'☎️', other:'✨' };
const CAT_COLOR = { mental_health:'badge-info', physical:'badge-success', financial:'badge-warning', social:'badge-primary', eap:'badge-danger', other:'badge-neutral' };
const TYPE_LABEL = { program:'Program', resource:'Resource', challenge:'Challenge', session:'Session' };

export default function WellnessDashboard() {
  const { isAdmin, isHR } = useAuth();
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [catFilter, setCat]     = useState('');
  const [showCreate, setCreate] = useState(false);
  const [submitting, setSub]    = useState(false);
  const [form, setForm]         = useState({
    title: '', category: 'mental_health', type: 'program',
    description: '', provider: '', maxCapacity: 30, tags: [],
  });
  const [tagInput, setTagInput] = useState('');

  const CATS = ['mental_health','physical','financial','social','eap','other'];
  const TYPES = ['program','resource','challenge','session'];

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const params = catFilter
        ? { category: catFilter }
        : {};

      const { data } = await getPrograms(params);

      setPrograms(data.data);
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setLoading(false);
    }
  }, [catFilter]);

  useEffect(() => { load(); }, [load]);

  const handleEnroll = async (id) => {
    try { await enroll(id); toast.success('Enrolled successfully! 🎉'); load(); }
    catch (err) { toast.error(getError(err)); }
  };

  const handleComplete = async (id) => {
    const feedback = prompt('Leave feedback (optional):') || '';
    try { await complete(id, { feedback }); toast.success('Program marked complete! Well done 💪'); load(); }
    catch (err) { toast.error(getError(err)); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSub(true);
    try {
      await createProgram({ ...form, tags: tagInput.split(',').map(t => t.trim()).filter(Boolean) });
      toast.success('Wellness program created!');
      setCreate(false);
      setForm({ title:'', category:'mental_health', type:'program', description:'', provider:'', maxCapacity:30, tags:[] });
      setTagInput('');
      load();
    } catch (err) { toast.error(getError(err)); }
    finally { setSub(false); }
  };

  const isEnrolled = (p) => p.enrollments?.some(e => e.status === 'enrolled' || e.status === 'completed');
  const myEnrollment = (p) => p.enrollments?.[0];
  const spotsLeft = (p) => Math.max(0, p.maxCapacity - (p.enrollments?.length || 0));

  const statsCards = [
    { label: 'Total Programs', value: programs.length, icon: '💪', color: 'var(--primary)', bg: 'var(--primary-light)' },
    { label: 'Mental Health', value: programs.filter(p=>p.category==='mental_health').length, icon: '🧘', color: 'var(--info)', bg: 'var(--info-light)' },
    { label: 'Physical',      value: programs.filter(p=>p.category==='physical').length,      icon: '🏋️', color: 'var(--success)', bg: 'var(--success-light)' },
    { label: 'EAP Resources', value: programs.filter(p=>p.category==='eap').length,           icon: '☎️', color: 'var(--danger)', bg: 'var(--danger-light)' },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Wellness & Support 💪</h1>
          <p className="page-subtitle">Employee wellbeing programs and resources</p>
        </div>
        {(isAdmin || isHR) && (
          <button className="btn btn-primary" onClick={() => setCreate(true)}>+ Create Program</button>
        )}
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        {statsCards.map(s => (
          <div key={s.label} className="stat-card">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div>
                <p style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:6 }}>{s.label}</p>
                <p style={{ fontSize:28, fontWeight:800, color:s.color }}>{s.value}</p>
              </div>
              <div className="stat-icon" style={{ background:s.bg, color:s.color, fontSize:22 }}>{s.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Category filter */}
      <div className="tabs" style={{ marginBottom: 20 }}>
        <button className={`tab ${catFilter===''?'active':''}`} onClick={() => setCat('')}>All</button>
        {CATS.map(c => (
          <button key={c} className={`tab ${catFilter===c?'active':''}`} onClick={() => setCat(c)}
            style={{ textTransform:'capitalize' }}>
            {CAT_ICON[c]} {c.replace('_',' ')}
          </button>
        ))}
      </div>

      {/* Program Cards */}
      {loading
        ? <div className="spinner-center"><div className="spinner spinner-lg" /></div>
        : programs.length === 0
          ? (
            <div className="empty-state card card-body">
              <div className="empty-icon">💆</div>
              <h3>No programs available</h3>
              <p>Check back soon or ask HR to add wellness programs.</p>
            </div>
          )
          : (
            <div className="grid-auto">
              {programs.map(p => {
                const enrolled  = isEnrolled(p);
                const enrData   = myEnrollment(p);
                const spots     = spotsLeft(p);
                const isFull    = spots === 0 && !enrolled;

                return (
                  <div key={p._id} className="card" style={{ display:'flex', flexDirection:'column' }}>
                    {/* Header strip */}
                    <div
                      style={{
                        height: 6,
                        borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
                        background:
                          p.category === 'mental_health'
                            ? 'var(--info)'
                            : p.category === 'physical'
                            ? 'var(--success)'
                            : p.category === 'financial'
                            ? 'var(--warning)'
                            : p.category === 'eap'
                            ? 'var(--danger)'
                            : 'var(--primary)',
                      }}
                    />

                    <div className="card-body" style={{ flex:1, display:'flex', flexDirection:'column', gap:10 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                        <span className={`badge ${CAT_COLOR[p.category]||'badge-neutral'}`} style={{ textTransform:'capitalize' }}>
                          {CAT_ICON[p.category]} {p.category.replace('_',' ')}
                        </span>
                        <span className="badge badge-neutral" style={{ textTransform:'capitalize' }}>
                          {TYPE_LABEL[p.type]||p.type}
                        </span>
                      </div>

                      <h3 style={{ fontSize:15, fontWeight:700 }}>{p.title}</h3>

                      {p.description && (
                        <p style={{ fontSize:12, color:'var(--text-muted)', lineHeight:1.5 }}>{p.description}</p>
                      )}

                      <div style={{ display:'flex', flexWrap:'wrap', gap:8, fontSize:12, color:'var(--text-muted)' }}>
                        {p.provider && <span>🏢 {p.provider}</span>}
                        <span>👥 {p.enrollments?.length||0}/{p.maxCapacity} enrolled</span>
                        {spots <= 5 && spots > 0 && <span style={{ color:'var(--warning)', fontWeight:600 }}>⚡ {spots} spots left</span>}
                        {isFull && <span style={{ color:'var(--danger)', fontWeight:600 }}>🚫 Full</span>}
                      </div>

                      {/* Tags */}
                      {p.tags?.length > 0 && (
                        <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                          {p.tags.map(t => (
                            <span key={t} style={{ background:'var(--surface-2)', color:'var(--text-muted)', borderRadius:20, padding:'2px 8px', fontSize:11 }}>{t}</span>
                          ))}
                        </div>
                      )}

                      {/* Enrollment status */}
                      {enrolled && enrData && (
                        <div style={{ padding:'8px 12px', borderRadius:8, background: enrData.status==='completed' ? 'var(--success-light)' : 'var(--primary-light)', fontSize:12 }}>
                          {enrData.status === 'completed'
                            ? <span style={{ color:'var(--success)', fontWeight:600 }}>✅ Completed {enrData.completedAt ? `on ${new Date(enrData.completedAt).toLocaleDateString('en-KE')}` : ''}</span>
                            : <span style={{ color:'var(--primary)', fontWeight:600 }}>✔ Enrolled {enrData.enrolledAt ? `since ${new Date(enrData.enrolledAt).toLocaleDateString('en-KE')}` : ''}</span>
                          }
                          {enrData.feedback && <p style={{ color:'var(--text-muted)', marginTop:4 }}>"{enrData.feedback}"</p>}
                        </div>
                      )}

                      {/* Actions */}
                      <div style={{ marginTop:'auto', display:'flex', gap:8 }}>
                        {!enrolled && !isFull && (
                          <button className="btn btn-primary btn-sm" style={{ flex:1 }} onClick={() => handleEnroll(p._id)}>
                            Enroll Now
                          </button>
                        )}
                        {enrolled && enrData?.status === 'enrolled' && (
                          <button className="btn btn-success btn-sm" style={{ flex:1 }} onClick={() => handleComplete(p._id)}>
                            Mark Complete ✓
                          </button>
                        )}
                        {isFull && !enrolled && (
                          <button className="btn btn-outline btn-sm" style={{ flex:1 }} disabled>Program Full</button>
                        )}
                        {enrolled && enrData?.status === 'completed' && (
                          <span className="badge badge-success" style={{ flex:1, justifyContent:'center', fontSize:12 }}>✅ Done</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
      }

      {/* EAP Banner */}
      <div style={{ marginTop:24, padding:'20px 24px', background:'linear-gradient(135deg, #1e40af 0%, #0284c7 100%)', borderRadius:'var(--radius-lg)', color:'#fff', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:16 }}>
        <div>
          <h3 style={{ fontWeight:700, fontSize:16, marginBottom:4 }}>Employee Assistance Programme (EAP)</h3>
          <p style={{ fontSize:13, opacity:.85 }}>Confidential counselling and support — available 24/7</p>
        </div>
        <div style={{ display:'flex', gap:12 }}>
          <div style={{ textAlign:'center', background:'rgba(255,255,255,.15)', borderRadius:10, padding:'10px 20px' }}>
            <div style={{ fontWeight:800, fontSize:18 }}>☎️ 0800 720 000</div>
            <div style={{ fontSize:11, opacity:.8 }}>Free helpline</div>
          </div>
          <div style={{ textAlign:'center', background:'rgba(255,255,255,.15)', borderRadius:10, padding:'10px 20px' }}>
            <div style={{ fontWeight:800, fontSize:18 }}>📧 hris@company.com</div>
            <div style={{ fontSize:11, opacity:.8 }}>Email support</div>
          </div>
        </div>
      </div>

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setCreate(false)} title="Create Wellness Program"
        footer={<>
          <button className="btn btn-outline" onClick={() => setCreate(false)}>Cancel</button>
          <button className="btn btn-primary" form="wellness-form" type="submit" disabled={submitting}>
            {submitting ? <span className="spinner" style={{ width:14, height:14, borderWidth:2 }} /> : null}
            {' '}Create Program
          </button>
        </>}
      >
        <form id="wellness-form" onSubmit={handleCreate}>
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input className="form-control" value={form.title} onChange={e => setForm(p=>({...p,title:e.target.value}))} required placeholder="e.g. Mindfulness Mondays" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-control form-select" value={form.category} onChange={e => setForm(p=>({...p,category:e.target.value}))}>
                {CATS.map(c => <option key={c} value={c} style={{ textTransform:'capitalize' }}>{CAT_ICON[c]} {c.replace('_',' ')}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Type</label>
              <select className="form-control form-select" value={form.type} onChange={e => setForm(p=>({...p,type:e.target.value}))}>
                {TYPES.map(t => <option key={t} value={t} style={{ textTransform:'capitalize' }}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-control" rows={3} value={form.description} onChange={e => setForm(p=>({...p,description:e.target.value}))} placeholder="What will participants experience?" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Provider</label>
              <input className="form-control" value={form.provider} onChange={e => setForm(p=>({...p,provider:e.target.value}))} placeholder="e.g. Internal / EAP Partner" />
            </div>
            <div className="form-group">
              <label className="form-label">Max Capacity</label>
              <input className="form-control" type="number" min={1} value={form.maxCapacity} onChange={e => setForm(p=>({...p,maxCapacity:Number(e.target.value)}))} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Tags <span style={{ fontWeight:400, color:'var(--text-muted)' }}>(comma-separated)</span></label>
            <input className="form-control" value={tagInput} onChange={e => setTagInput(e.target.value)} placeholder="e.g. stress, mindfulness, team" />
          </div>
        </form>
      </Modal>
    </div>
  );
}