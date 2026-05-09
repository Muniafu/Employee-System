import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { getSurveys, createSurvey, submitResponse, getResults } from '../../services/engagementService';
import { getError } from '../../services/api';
import { useAuth } from '../../context/useAuth';
import Modal from '../../components/Modal';

export default function EngagementSurvey() {
  const { isAdmin, isHR } = useAuth();
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setCreate] = useState(false);
  const [activeSurvey, setActive] = useState(null);
  const [results, setResults]   = useState(null);
  const [submitting, setSub]    = useState(false);
  const [answers, setAnswers]   = useState([]);
  const [nps, setNps]           = useState(7);

  const [form, setForm] = useState({ title:'', type:'pulse', description:'', anonymous:false, questions:[{ text:'', type:'rating', required:true }] });

  const load = async () => {
    setLoading(true);
    try { const { data } = await getSurveys(); setSurveys(data.data); }
    catch(err) { toast.error(getError(err)); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async e => {
    e.preventDefault();
    setSub(true);
    try { await createSurvey(form); toast.success('Survey created!'); setCreate(false); load(); }
    catch(err) { toast.error(getError(err)); }
    finally { setSub(false); }
  };

  const handleSubmit = async () => {
    setSub(true);
    try {
      await submitResponse(activeSurvey._id, { answers, npsScore: nps, anonymous: false });
      toast.success('Response submitted! Thank you 🙏');
      setActive(null);
      load();
    } catch(err) { toast.error(getError(err)); }
    finally { setSub(false); }
  };

  const loadResults = async id => {
    try { const { data } = await getResults(id); setResults(data.data); }
    catch(err) { toast.error(getError(err)); }
  };

  const addQ = () => setForm(p => ({ ...p, questions: [...p.questions, { text:'', type:'rating', required:false }] }));
  const setQ = (i, k, v) => setForm(p => { const qs=[...p.questions]; qs[i]={...qs[i],[k]:v}; return {...p, questions:qs}; });
  const rmQ  = i => setForm(p => ({ ...p, questions: p.questions.filter((_,j)=>j!==i) }));

  const TYPE_COLOR = { pulse:'badge-primary', nps:'badge-info', satisfaction:'badge-success', recognition:'badge-warning', announcement:'badge-neutral' };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Engagement 🧠</h1>
          <p className="page-subtitle">Pulse surveys and team recognition</p>
        </div>
        {(isAdmin || isHR) && <button className="btn btn-primary" onClick={() => setCreate(true)}>+ Create Survey</button>}
      </div>

      {loading ? <div className="spinner-center"><div className="spinner spinner-lg" /></div> : (
        <div className="grid-auto">
          {surveys.map(s => (
            <div key={s._id} className="card card-body" style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <div style={{ display:'flex', justifyContent:'space-between' }}>
                <span className={`badge ${TYPE_COLOR[s.type]||'badge-neutral'}`} style={{textTransform:'capitalize'}}>{s.type}</span>
                <span className={`badge ${s.isActive?'badge-success':'badge-neutral'}`}>{s.isActive?'Active':'Closed'}</span>
              </div>
              <h3 style={{ fontSize:14, fontWeight:700 }}>{s.title}</h3>
              {s.description && <p style={{ fontSize:12, color:'var(--text-muted)' }}>{s.description}</p>}
              <div style={{ fontSize:11, color:'var(--text-muted)', display:'flex', gap:12 }}>
                <span>❓ {s.questions?.length||0} questions</span>
                <span>📬 {s.responses?.length||0} responses</span>
                {s.avgNps > 0 && <span>⭐ NPS: {Number(s.avgNps).toFixed(1)}</span>}
              </div>
              <div style={{ display:'flex', gap:8, marginTop:'auto' }}>
                {s.isActive && (
                  <button className="btn btn-primary btn-sm" style={{ flex:1 }} onClick={() => { setActive(s); setAnswers(s.questions.map(q=>({question:q.text,answer:'',rating:5}))); setNps(7); }}>
                    Respond
                  </button>
                )}
                {(isAdmin||isHR) && (
                  <button className="btn btn-outline btn-sm" style={{ flex:1 }} onClick={() => { setResults(null); loadResults(s._id); }}>
                    Results
                  </button>
                )}
              </div>
            </div>
          ))}
          {surveys.length === 0 && <div className="empty-state card card-body" style={{ gridColumn:'1/-1' }}><div className="empty-icon">🧠</div><h3>No surveys yet</h3></div>}
        </div>
      )}

      {/* Respond Modal */}
      {activeSurvey && (
        <Modal open size="lg" onClose={() => setActive(null)} title={activeSurvey.title}
          footer={<>
            <button className="btn btn-outline" onClick={() => setActive(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? <span className="spinner" style={{width:14,height:14,borderWidth:2}}/> : null} Submit Response
            </button>
          </>}
        >
          {activeSurvey.questions?.map((q, i) => (
            <div key={i} className="form-group">
              <label className="form-label">{q.text} {q.required && <span style={{ color:'var(--danger)' }}>*</span>}</label>
              {q.type === 'rating'
                ? <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <input type="range" min={1} max={10} value={answers[i]?.rating||5} onChange={e=>{ const a=[...answers]; a[i]={...a[i],rating:Number(e.target.value)}; setAnswers(a); }} style={{ flex:1 }} />
                    <span style={{ fontWeight:700, fontSize:18, color:'var(--primary)', width:28 }}>{answers[i]?.rating||5}</span>
                  </div>
                : q.type === 'boolean'
                  ? <div style={{ display:'flex', gap:16 }}>
                      {['Yes','No'].map(v=><label key={v} style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer' }}><input type="radio" name={`q${i}`} checked={answers[i]?.answer===v} onChange={()=>{ const a=[...answers]; a[i]={...a[i],answer:v}; setAnswers(a); }} />{v}</label>)}
                    </div>
                  : <textarea className="form-control" rows={2} value={answers[i]?.answer||''} onChange={e=>{ const a=[...answers]; a[i]={...a[i],answer:e.target.value}; setAnswers(a); }} placeholder="Your answer…" />
              }
            </div>
          ))}
          <div className="form-group">
            <label className="form-label">NPS: How likely are you to recommend this company? (0–10)</label>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <input type="range" min={0} max={10} value={nps} onChange={e=>setNps(Number(e.target.value))} style={{ flex:1 }} />
              <span style={{ fontWeight:800, fontSize:22, color: nps>=9?'var(--success)':nps>=7?'var(--warning)':'var(--danger)', width:28 }}>{nps}</span>
            </div>
          </div>
        </Modal>
      )}

      {/* Results Modal */}
      {results && (
        <Modal open onClose={() => setResults(null)} title={`Results — ${results.title}`}>
          <div style={{ marginBottom:16, display:'flex', gap:20 }}>
            <div style={{ textAlign:'center', flex:1 }}>
              <div style={{ fontSize:40, fontWeight:800, color:'var(--primary)' }}>{results.avgNps||0}</div>
              <div style={{ fontSize:12, color:'var(--text-muted)' }}>Avg NPS</div>
            </div>
            <div style={{ textAlign:'center', flex:1 }}>
              <div style={{ fontSize:40, fontWeight:800, color:'var(--success)' }}>{results.total||0}</div>
              <div style={{ fontSize:12, color:'var(--text-muted)' }}>Responses</div>
            </div>
          </div>
          {Object.entries(results.ratingsByQuestion||{}).map(([q, avg]) => (
            avg && <div key={q} style={{ padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
              <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:4 }}>{q}</div>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div className="progress-bar" style={{ flex:1 }}><div className="progress-fill" style={{ width:`${Number(avg)*10}%` }} /></div>
                <strong style={{ fontSize:14, width:32 }}>{avg}</strong>
              </div>
            </div>
          ))}
        </Modal>
      )}

      {/* Create Survey Modal */}
      <Modal open={showCreate} size="lg" onClose={() => setCreate(false)} title="Create Survey"
        footer={<>
          <button className="btn btn-outline" onClick={() => setCreate(false)}>Cancel</button>
          <button className="btn btn-primary" form="survey-form" type="submit" disabled={submitting}>
            {submitting ? <span className="spinner" style={{width:14,height:14,borderWidth:2}}/> : null} Create
          </button>
        </>}
      >
        <form id="survey-form" onSubmit={handleCreate}>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Title *</label><input className="form-control" value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} required /></div>
            <div className="form-group"><label className="form-label">Type</label>
              <select className="form-control form-select" value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value}))}>
                {['pulse','nps','satisfaction','recognition','announcement'].map(t=><option key={t} value={t} style={{textTransform:'capitalize'}}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group"><label className="form-label">Description</label><textarea className="form-control" rows={2} value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} /></div>
          <div style={{ marginBottom:12 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <label className="form-label" style={{ margin:0 }}>Questions</label>
              <button type="button" className="btn btn-sm btn-outline" onClick={addQ}>+ Add Question</button>
            </div>
            {form.questions.map((q,i) => (
              <div key={i} style={{ display:'flex', gap:8, marginBottom:8, alignItems:'flex-start' }}>
                <input className="form-control" placeholder="Question text…" value={q.text} onChange={e=>setQ(i,'text',e.target.value)} style={{ flex:2 }} />
                <select className="form-control form-select" value={q.type} onChange={e=>setQ(i,'type',e.target.value)} style={{ width:110 }}>
                  {['rating','text','boolean','choice'].map(t=><option key={t} value={t}>{t}</option>)}
                </select>
                {form.questions.length > 1 && <button type="button" className="btn btn-sm btn-ghost" onClick={() => rmQ(i)} style={{ color:'var(--danger)' }}>✕</button>}
              </div>
            ))}
          </div>
        </form>
      </Modal>
    </div>
  );
}