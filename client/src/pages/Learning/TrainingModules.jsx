import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { getCourses, getMyCourses, createCourse, enroll, updateProgress } from '../../services/learningService';
import { getError } from '../../services/api';
import { useAuth } from '../../context/useAuth';
import Modal from '../../components/Modal';

const CAT_COLOR = { compliance:'badge-danger', technical:'badge-primary', leadership:'badge-info', soft_skills:'badge-success', safety:'badge-warning', other:'badge-neutral' };

export default function TrainingModules() {
  const { isAdmin, isHR } = useAuth();
  const [courses, setCourses]   = useState([]);
  const [myCourses, setMyCourses] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [view, setView]         = useState('browse');
  const [showCreate, setCreate] = useState(false);
  const [submitting, setSub]    = useState(false);
  const [form, setForm]         = useState({ title:'', category:'compliance', duration:60, isMandatory:false, content:'', provider:'Internal', passingScore:80 });

  const load = async () => {
    setLoading(true);
    try {
      const [all, my] = await Promise.all([getCourses(), getMyCourses()]);
      setCourses(all.data.data);
      setMyCourses(my.data.data);
    } catch(err) { toast.error(getError(err)); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleEnroll = async id => {
    try { await enroll(id); toast.success('Enrolled successfully!'); load(); }
    catch(err) { toast.error(getError(err)); }
  };

  const handleProgress = async (id, progress) => {
    try { await updateProgress(id, { progress: Number(progress), score: Number(progress) }); toast.success('Progress updated!'); load(); }
    catch(err) { toast.error(getError(err)); }
  };

  const handleCreate = async e => {
    e.preventDefault();
    setSub(true);
    try { await createCourse(form); toast.success('Course created!'); setCreate(false); load(); }
    catch(err) { toast.error(getError(err)); }
    finally { setSub(false); }
  };

  const isEnrolled = id => myCourses.some(c => c._id === id);
  const myEnrollment = id => myCourses.find(c => c._id === id)?.myEnrollment;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Learning & Development 📚</h1>
          <p className="page-subtitle">{courses.length} courses available</p>
        </div>
        {(isAdmin || isHR) && <button className="btn btn-primary" onClick={() => setCreate(true)}>+ Create Course</button>}
      </div>

      <div className="tabs">
        <button className={`tab ${view==='browse'?'active':''}`} onClick={() => setView('browse')}>Browse Courses</button>
        <button className={`tab ${view==='my'?'active':''}`} onClick={() => setView('my')}>My Learning ({myCourses.length})</button>
      </div>

      {loading ? <div className="spinner-center"><div className="spinner spinner-lg" /></div> : (

        view === 'browse' ? (
          <div className="grid-auto">
            {courses.map(c => {
              const enrolled = isEnrolled(c._id);
              const enr = myEnrollment(c._id);
              return (
                <div key={c._id} className="card card-body" style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                    <span className={`badge ${CAT_COLOR[c.category]||'badge-neutral'}`} style={{textTransform:'capitalize'}}>{c.category}</span>
                    {c.isMandatory && <span className="badge badge-danger">Mandatory</span>}
                  </div>
                  <h3 style={{ fontSize:14, fontWeight:700 }}>{c.title}</h3>
                  <div style={{ fontSize:12, color:'var(--text-muted)', display:'flex', gap:12 }}>
                    <span>⏱ {c.duration}min</span>
                    <span>🏢 {c.provider}</span>
                    <span>🎯 Pass: {c.passingScore}%</span>
                  </div>
                  {enrolled && enr && (
                    <div>
                      <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, marginBottom:4 }}>
                        <span style={{ textTransform:'capitalize', color:'var(--text-muted)' }}>{enr.status}</span>
                        <span>{enr.progress}%</span>
                      </div>
                      <div className="progress-bar"><div className="progress-fill" style={{ width:`${enr.progress}%` }} /></div>
                      {enr.certificate && <div style={{ marginTop:6, fontSize:11, color:'var(--success)' }}>🏆 Certificate: {enr.certificate}</div>}
                    </div>
                  )}
                  <div style={{ marginTop:'auto', display:'flex', gap:8 }}>
                    {!enrolled
                      ? <button className="btn btn-primary btn-sm" style={{ width:'100%' }} onClick={() => handleEnroll(c._id)}>Enroll</button>
                      : enr?.progress < 100
                        ? <button className="btn btn-outline btn-sm" style={{ flex:1 }} onClick={() => { const p = prompt('Update progress (0-100):', enr?.progress||0); if(p) handleProgress(c._id, p); }}>Update Progress</button>
                        : <span className="badge badge-success" style={{ width:'100%', justifyContent:'center' }}>✅ Completed</span>
                    }
                  </div>
                </div>
              );
            })}
            {courses.length === 0 && <div className="empty-state card card-body" style={{ gridColumn:'1/-1' }}><div className="empty-icon">📚</div><h3>No courses yet</h3></div>}
          </div>
        ) : (
          <div className="grid-auto">
            {myCourses.map(c => (
              <div key={c._id} className="card card-body">
                <span className={`badge ${CAT_COLOR[c.category]||'badge-neutral'}`} style={{textTransform:'capitalize', marginBottom:8, display:'inline-block'}}>{c.category}</span>
                <h3 style={{ fontSize:14, fontWeight:700, marginBottom:8 }}>{c.title}</h3>
                <div>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, marginBottom:4 }}>
                    <span style={{ textTransform:'capitalize', color:'var(--text-muted)' }}>{c.myEnrollment?.status}</span>
                    <span>{c.myEnrollment?.progress}%</span>
                  </div>
                  <div className="progress-bar"><div className="progress-fill" style={{ width:`${c.myEnrollment?.progress||0}%` }} /></div>
                </div>
                {c.myEnrollment?.certificate && <div style={{ marginTop:8, fontSize:11, color:'var(--success)', wordBreak:'break-all' }}>🏆 {c.myEnrollment.certificate}</div>}
              </div>
            ))}
            {myCourses.length === 0 && <div className="empty-state card card-body" style={{ gridColumn:'1/-1' }}><div className="empty-icon">📖</div><h3>Enroll in your first course!</h3></div>}
          </div>
        )
      )}

      <Modal open={showCreate} onClose={() => setCreate(false)} title="Create Course"
        footer={<>
          <button className="btn btn-outline" onClick={()=>setCreate(false)}>Cancel</button>
          <button className="btn btn-primary" form="course-form" type="submit" disabled={submitting}>
            {submitting ? <span className="spinner" style={{width:14,height:14,borderWidth:2}}/> : null} Create
          </button>
        </>}
      >
        <form id="course-form" onSubmit={handleCreate}>
          <div className="form-group"><label className="form-label">Title *</label><input className="form-control" value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} required /></div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Category</label>
              <select className="form-control form-select" value={form.category} onChange={e=>setForm(p=>({...p,category:e.target.value}))}>
                {['compliance','technical','leadership','soft_skills','safety','other'].map(c=><option key={c} value={c} style={{textTransform:'capitalize'}}>{c}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">Duration (min)</label><input className="form-control" type="number" min={1} value={form.duration} onChange={e=>setForm(p=>({...p,duration:Number(e.target.value)}))} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Provider</label><input className="form-control" value={form.provider} onChange={e=>setForm(p=>({...p,provider:e.target.value}))} /></div>
            <div className="form-group"><label className="form-label">Passing Score (%)</label><input className="form-control" type="number" min={0} max={100} value={form.passingScore} onChange={e=>setForm(p=>({...p,passingScore:Number(e.target.value)}))} /></div>
          </div>
          <div className="form-group"><label className="form-label">Content URL</label><input className="form-control" type="url" value={form.content} onChange={e=>setForm(p=>({...p,content:e.target.value}))} placeholder="https://…" /></div>
          <div className="form-group">
            <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer' }}>
              <input type="checkbox" checked={form.isMandatory} onChange={e=>setForm(p=>({...p,isMandatory:e.target.checked}))} />
              <span className="form-label" style={{ margin:0 }}>Mark as Mandatory</span>
            </label>
          </div>
        </form>
      </Modal>
    </div>
  );
}