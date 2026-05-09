import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { createPath, getPaths, completeMilestone, flagSuccession } from '../../services/careerService';
import { getError } from '../../services/api';
import { useAuth } from '../../context/useAuth';
import Modal from '../../components/Modal';

const STATUS_COLOR = { active:'badge-success', completed:'badge-primary', paused:'badge-warning', abandoned:'badge-neutral' };
const SKILL_LEVELS = ['beginner','intermediate','advanced','expert'];

export default function CareerPathing() {
  const { isAdmin, isHR } = useAuth();
  const [paths, setPaths]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showCreate, setCreate] = useState(false);
  const [selected, setSelected] = useState(null);
  const [submitting, setSub]    = useState(false);

  const [form, setForm] = useState({
    currentRole: '', targetRole: '', timeline: '12 months', notes: '',
    skills: [{ name:'', level:'beginner', acquired:false }],
    milestones: [{ title:'', description:'', targetDate:'' }],
  });

  const load = async () => {
    setLoading(true);
    try { const { data } = await getPaths(); setPaths(data.data); }
    catch (err) { toast.error(getError(err)); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSub(true);
    try {
      await createPath(form);
      toast.success('Career path created! 🚀');
      setCreate(false);
      resetForm();
      load();
    } catch (err) { toast.error(getError(err)); }
    finally { setSub(false); }
  };

  const handleCompleteMilestone = async (pathId, milestoneId) => {
    try { await completeMilestone(pathId, milestoneId); toast.success('Milestone completed! 🎯'); load(); }
    catch (err) { toast.error(getError(err)); }
  };

  const handleFlagSuccession = async (pathId) => {
    if (!confirm('Flag this employee as a succession candidate?')) return;
    try { await flagSuccession(pathId); toast.success('Flagged as succession candidate ⭐'); load(); }
    catch (err) { toast.error(getError(err)); }
  };

  const resetForm = () => setForm({
    currentRole:'', targetRole:'', timeline:'12 months', notes:'',
    skills:[{ name:'', level:'beginner', acquired:false }],
    milestones:[{ title:'', description:'', targetDate:'' }],
  });

  const addSkill = () => setForm(p => ({ ...p, skills:[...p.skills,{ name:'', level:'beginner', acquired:false }] }));
  const setSkill = (i,k,v) => setForm(p => { const s=[...p.skills]; s[i]={...s[i],[k]:v}; return {...p,skills:s}; });
  const rmSkill  = (i) => setForm(p => ({ ...p, skills:p.skills.filter((_,j)=>j!==i) }));

  const addMilestone = () => setForm(p => ({ ...p, milestones:[...p.milestones,{ title:'', description:'', targetDate:'' }] }));
  const setMilestone = (i,k,v) => setForm(p => { const m=[...p.milestones]; m[i]={...m[i],[k]:v}; return {...p,milestones:m}; });
  const rmMilestone  = (i) => setForm(p => ({ ...p, milestones:p.milestones.filter((_,j)=>j!==i) }));

  const calcProgress = (path) => {
    const total = path.milestones?.length || 0;
    if (!total) return 0;
    const done = path.milestones.filter(m => m.completed).length;
    return Math.round((done / total) * 100);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Career Pathing 🗂️</h1>
          <p className="page-subtitle">Growth plans, skills and succession planning</p>
        </div>
        <button className="btn btn-primary" onClick={() => setCreate(true)}>+ Create Career Path</button>
      </div>

      {loading
        ? <div className="spinner-center"><div className="spinner spinner-lg" /></div>
        : paths.length === 0
          ? (
            <div className="empty-state card card-body">
              <div className="empty-icon">🗂️</div>
              <h3>No career paths yet</h3>
              <p>Create your first career path to start tracking your professional growth.</p>
              <button className="btn btn-primary" style={{ marginTop:16 }} onClick={() => setCreate(true)}>Get Started</button>
            </div>
          )
          : (
            <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
              {paths.map(path => {
                const progress = calcProgress(path);
                const empName = `${path.employee?.user?.firstName||''} ${path.employee?.user?.lastName||''}`.trim();
                return (
                  <div key={path._id} className="card">
                    {/* Path Header */}
                    <div className="card-header">
                      <div style={{ display:'flex', alignItems:'center', gap:12, flex:1 }}>
                        <div className="avatar" style={{ background:'var(--primary-light)', color:'var(--primary)' }}>
                          {path.employee?.user?.firstName?.[0]}{path.employee?.user?.lastName?.[0]}
                        </div>
                        <div>
                          <div style={{ fontWeight:700, fontSize:14 }}>{empName || 'Me'}</div>
                          <div style={{ fontSize:12, color:'var(--text-muted)' }}>
                            {path.currentRole} <span style={{ color:'var(--primary)' }}>→</span> {path.targetRole}
                            <span style={{ marginLeft:8 }}>· {path.timeline}</span>
                          </div>
                        </div>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        {path.successionFlag && <span className="badge badge-warning">⭐ Succession</span>}
                        <span className={`badge ${STATUS_COLOR[path.status]||'badge-neutral'}`} style={{ textTransform:'capitalize' }}>{path.status}</span>
                        {(isAdmin || isHR) && !path.successionFlag && (
                          <button className="btn btn-sm btn-outline" onClick={() => handleFlagSuccession(path._id)} title="Flag as succession candidate">⭐</button>
                        )}
                        <button className="btn btn-sm btn-ghost" onClick={() => setSelected(selected?._id===path._id ? null : path)}>
                          {selected?._id===path._id ? '▲' : '▼'}
                        </button>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div style={{ padding:'0 20px 0' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'var(--text-muted)', marginTop:12, marginBottom:4 }}>
                        <span>Milestones: {path.milestones?.filter(m=>m.completed).length||0}/{path.milestones?.length||0} completed</span>
                        <span style={{ fontWeight:700, color: progress===100?'var(--success)':'var(--primary)' }}>{progress}%</span>
                      </div>
                      <div className="progress-bar" style={{ marginBottom:16 }}>
                        <div className="progress-fill" style={{ width:`${progress}%`, background: progress===100?'var(--success)':'var(--primary)' }} />
                      </div>
                    </div>

                    {/* Expanded detail */}
                    {selected?._id === path._id && (
                      <div style={{ padding:'0 20px 20px' }}>
                        <div className="grid-2" style={{ gap:20 }}>
                          {/* Milestones */}
                          <div>
                            <h4 style={{ fontSize:13, fontWeight:700, marginBottom:12, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'.06em' }}>Milestones</h4>
                            {path.milestones?.length > 0
                              ? path.milestones.map((m, i) => (
                                  <div key={m._id||i} style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
                                    <button
                                      onClick={() => !m.completed && handleCompleteMilestone(path._id, m._id)}
                                      style={{ marginTop:2, width:20, height:20, borderRadius:'50%', border:`2px solid ${m.completed?'var(--success)':'var(--border-2)'}`, background: m.completed?'var(--success)':'transparent', color:'#fff', fontSize:11, display:'grid', placeItems:'center', flexShrink:0, cursor: m.completed?'default':'pointer' }}
                                    >
                                      {m.completed ? '✓' : ''}
                                    </button>
                                    <div style={{ flex:1 }}>
                                      <div style={{ fontSize:13, fontWeight:m.completed?400:600, textDecoration:m.completed?'line-through':'none', color:m.completed?'var(--text-muted)':'var(--text)' }}>{m.title}</div>
                                      {m.description && <div style={{ fontSize:11, color:'var(--text-muted)' }}>{m.description}</div>}
                                      {m.targetDate && <div style={{ fontSize:11, color:'var(--text-muted)' }}>🗓 {new Date(m.targetDate).toLocaleDateString('en-KE')}</div>}
                                      {m.completed && m.completedAt && <div style={{ fontSize:11, color:'var(--success)' }}>✅ Done {new Date(m.completedAt).toLocaleDateString('en-KE')}</div>}
                                    </div>
                                  </div>
                                ))
                              : <p style={{ fontSize:13, color:'var(--text-muted)' }}>No milestones set.</p>
                            }
                          </div>

                          {/* Skills */}
                          <div>
                            <h4 style={{ fontSize:13, fontWeight:700, marginBottom:12, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'.06em' }}>Skills</h4>
                            {path.skills?.length > 0
                              ? path.skills.map((s, i) => (
                                  <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 0', borderBottom:'1px solid var(--border)', fontSize:13 }}>
                                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                                      <span style={{ width:8, height:8, borderRadius:'50%', background: s.acquired?'var(--success)':'var(--border-2)', display:'inline-block', flexShrink:0 }} />
                                      <span style={{ fontWeight:500 }}>{s.name}</span>
                                    </div>
                                    <div style={{ display:'flex', gap:6 }}>
                                      <span className="badge badge-neutral" style={{ textTransform:'capitalize' }}>{s.level}</span>
                                      {s.acquired && <span className="badge badge-success">✓ Acquired</span>}
                                    </div>
                                  </div>
                                ))
                              : <p style={{ fontSize:13, color:'var(--text-muted)' }}>No skills listed.</p>
                            }
                          </div>
                        </div>
                        {path.notes && (
                          <div style={{ marginTop:16, padding:'10px 14px', background:'var(--surface-2)', borderRadius:8, fontSize:13, color:'var(--text-muted)', fontStyle:'italic' }}>
                            "{path.notes}"
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
      }

      {/* Create Modal */}
      <Modal open={showCreate} size="lg" onClose={() => { setCreate(false); resetForm(); }} title="Create Career Path"
        footer={<>
          <button className="btn btn-outline" onClick={() => { setCreate(false); resetForm(); }}>Cancel</button>
          <button className="btn btn-primary" form="career-form" type="submit" disabled={submitting}>
            {submitting ? <span className="spinner" style={{ width:14, height:14, borderWidth:2 }} /> : null}
            {' '}Create Path
          </button>
        </>}
      >
        <form id="career-form" onSubmit={handleCreate}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Current Role *</label>
              <input className="form-control" value={form.currentRole} onChange={e => setForm(p=>({...p,currentRole:e.target.value}))} required placeholder="e.g. Junior Developer" />
            </div>
            <div className="form-group">
              <label className="form-label">Target Role *</label>
              <input className="form-control" value={form.targetRole} onChange={e => setForm(p=>({...p,targetRole:e.target.value}))} required placeholder="e.g. Senior Engineer" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Timeline</label>
            <select className="form-control form-select" value={form.timeline} onChange={e => setForm(p=>({...p,timeline:e.target.value}))}>
              {['6 months','12 months','18 months','24 months','36 months'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>

          {/* Skills */}
          <div style={{ marginBottom:16 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <label className="form-label" style={{ margin:0 }}>Skills to Develop</label>
              <button type="button" className="btn btn-sm btn-outline" onClick={addSkill}>+ Skill</button>
            </div>
            {form.skills.map((s, i) => (
              <div key={i} style={{ display:'flex', gap:8, marginBottom:8, alignItems:'center' }}>
                <input className="form-control" placeholder="Skill name" value={s.name} onChange={e => setSkill(i,'name',e.target.value)} style={{ flex:2 }} />
                <select className="form-control form-select" value={s.level} onChange={e => setSkill(i,'level',e.target.value)} style={{ width:130 }}>
                  {SKILL_LEVELS.map(l => <option key={l} value={l} style={{ textTransform:'capitalize' }}>{l}</option>)}
                </select>
                <label style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, whiteSpace:'nowrap', cursor:'pointer' }}>
                  <input type="checkbox" checked={s.acquired} onChange={e => setSkill(i,'acquired',e.target.checked)} /> Acquired
                </label>
                {form.skills.length > 1 && <button type="button" className="btn btn-sm btn-ghost" onClick={() => rmSkill(i)} style={{ color:'var(--danger)' }}>✕</button>}
              </div>
            ))}
          </div>

          {/* Milestones */}
          <div style={{ marginBottom:16 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <label className="form-label" style={{ margin:0 }}>Milestones</label>
              <button type="button" className="btn btn-sm btn-outline" onClick={addMilestone}>+ Milestone</button>
            </div>
            {form.milestones.map((m, i) => (
              <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 1fr auto auto', gap:8, marginBottom:8, alignItems:'center' }}>
                <input className="form-control" placeholder="Title" value={m.title} onChange={e => setMilestone(i,'title',e.target.value)} />
                <input className="form-control" placeholder="Description" value={m.description} onChange={e => setMilestone(i,'description',e.target.value)} />
                <input className="form-control" type="date" value={m.targetDate} onChange={e => setMilestone(i,'targetDate',e.target.value)} style={{ width:150 }} />
                {form.milestones.length > 1 && <button type="button" className="btn btn-sm btn-ghost" onClick={() => rmMilestone(i)} style={{ color:'var(--danger)' }}>✕</button>}
              </div>
            ))}
          </div>

          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea className="form-control" rows={2} value={form.notes} onChange={e => setForm(p=>({...p,notes:e.target.value}))} placeholder="Any additional context or aspirations…" />
          </div>
        </form>
      </Modal>
    </div>
  );
}