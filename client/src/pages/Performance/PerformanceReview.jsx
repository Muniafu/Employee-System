import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { createReview, getReviews, submitReview, reviewEmployee } from '../../services/performanceService';
import { getError } from '../../services/api';
import { useAuth } from '../../context/useAuth';
import Modal from '../../components/Modal';
import Table from '../../components/Table';

const STATUS_BADGE = { draft:'badge-neutral', submitted:'badge-warning', reviewed:'badge-primary', acknowledged:'badge-success' };
const STAR = n => '★'.repeat(n) + '☆'.repeat(5-n);

export default function PerformanceReview() {
  const { isAdmin, isHR, isManager } = useAuth();
  const [reviews, setReviews]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showCreate, setCreate] = useState(false);
  const [showReview, setReview] = useState(null);
  const [submitting, setSub]    = useState(false);

  const curQ = (() => { const n = new Date(); return `${n.getFullYear()}-Q${Math.ceil((n.getMonth()+1)/3)}`; })();
  const [form, setForm] = useState({ period: curQ, reviewType:'quarterly', selfRating:4, strengths:'', improvements:'', goals:[] });
  const [revForm, setRevForm] = useState({ managerRating:4, managerComment:'', overallRating:4 });

  const load = async () => {
    setLoading(true);
    try { const { data } = await getReviews(); setReviews(data.data); }
    catch(err) { toast.error(getError(err)); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async e => {
    e.preventDefault();
    setSub(true);
    try {
      await createReview({ ...form, goals: [{ title:'Q Goal', description:'Set your objective', target:'100%', progress:0, status:'not_started' }] });
      toast.success('Performance review created!');
      setCreate(false);
      load();
    } catch(err) { toast.error(getError(err)); }
    finally { setSub(false); }
  };

  const handleSubmit = async id => {
    try { await submitReview(id, { selfRating: 4 }); toast.success('Review submitted!'); load(); }
    catch(err) { toast.error(getError(err)); }
  };

  const handleManagerReview = async () => {
    if (!showReview) return;
    setSub(true);
    try {
      await reviewEmployee(showReview._id, revForm);
      toast.success('Review completed!');
      setReview(null);
      load();
    } catch(err) { toast.error(getError(err)); }
    finally { setSub(false); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Performance 🎯</h1>
          <p className="page-subtitle">Goal tracking and periodic reviews</p>
        </div>
        <button className="btn btn-primary" onClick={() => setCreate(true)}>+ New Review</button>
      </div>

      <div className="card">
        <Table loading={loading} data={reviews} emptyMsg="No performance reviews yet." columns={[
          { label:'Employee', render: r => (
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div className="avatar" style={{ width:28, height:28, fontSize:11 }}>{r.employee?.user?.firstName?.[0]}{r.employee?.user?.lastName?.[0]}</div>
              <div>
                <div style={{ fontWeight:600, fontSize:13 }}>{r.employee?.user?.firstName} {r.employee?.user?.lastName}</div>
                <div style={{ fontSize:11, color:'var(--text-muted)' }}>{r.employee?.department}</div>
              </div>
            </div>
          )},
          { label:'Period', key:'period' },
          { label:'Type', render: r => <span className="badge badge-neutral" style={{textTransform:'capitalize'}}>{r.reviewType}</span> },
          { label:'Self Rating', render: r => r.selfRating ? <span style={{ color:'var(--warning)', fontSize:13 }}>{STAR(r.selfRating)}</span> : '—' },
          { label:'Manager Rating', render: r => r.managerRating ? <span style={{ color:'var(--primary)', fontSize:13 }}>{STAR(r.managerRating)}</span> : '—' },
          { label:'Goals', render: r => `${r.goals?.filter(g=>g.status==='completed').length||0}/${r.goals?.length||0} done` },
          { label:'Status', render: r => <span className={`badge ${STATUS_BADGE[r.status]||'badge-neutral'}`} style={{textTransform:'capitalize'}}>{r.status}</span> },
          { label:'', render: r => (
            <div style={{ display:'flex', gap:6 }}>
              {r.status==='draft' && <button className="btn btn-sm btn-primary" onClick={()=>handleSubmit(r._id)}>Submit</button>}
              {(isAdmin||isHR||isManager) && r.status==='submitted' && <button className="btn btn-sm btn-outline" onClick={()=>{ setReview(r); setRevForm({managerRating:4,managerComment:'',overallRating:4}); }}>Review</button>}
            </div>
          )},
        ]} />
      </div>

      {/* Create Modal */}
      <Modal open={showCreate} onClose={()=>setCreate(false)} title="New Performance Review"
        footer={<>
          <button className="btn btn-outline" onClick={()=>setCreate(false)}>Cancel</button>
          <button className="btn btn-primary" form="perf-form" type="submit" disabled={submitting}>
            {submitting ? <span className="spinner" style={{width:14,height:14,borderWidth:2}}/> : null} Create
          </button>
        </>}
      >
        <form id="perf-form" onSubmit={handleCreate}>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Period *</label><input className="form-control" value={form.period} onChange={e=>setForm(p=>({...p,period:e.target.value}))} placeholder="e.g. 2025-Q3" required /></div>
            <div className="form-group"><label className="form-label">Review Type</label>
              <select className="form-control form-select" value={form.reviewType} onChange={e=>setForm(p=>({...p,reviewType:e.target.value}))}>
                {['quarterly','annual','probation','pip'].map(t=><option key={t} value={t} style={{textTransform:'capitalize'}}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group"><label className="form-label">Self Rating (1–5)</label>
            <input type="range" min={1} max={5} value={form.selfRating} onChange={e=>setForm(p=>({...p,selfRating:Number(e.target.value)}))} style={{ width:'100%' }} />
            <p style={{ textAlign:'center', color:'var(--warning)', fontSize:16 }}>{STAR(form.selfRating)} ({form.selfRating}/5)</p>
          </div>
          <div className="form-group"><label className="form-label">Key Strengths</label><textarea className="form-control" rows={2} value={form.strengths} onChange={e=>setForm(p=>({...p,strengths:e.target.value}))} placeholder="What are you excelling at?" /></div>
          <div className="form-group"><label className="form-label">Areas for Improvement</label><textarea className="form-control" rows={2} value={form.improvements} onChange={e=>setForm(p=>({...p,improvements:e.target.value}))} placeholder="Where can you grow?" /></div>
        </form>
      </Modal>

      {/* Manager Review Modal */}
      {showReview && (
        <Modal open={!!showReview} onClose={()=>setReview(null)} title={`Review — ${showReview.employee?.user?.firstName} ${showReview.employee?.user?.lastName}`}
          footer={<>
            <button className="btn btn-outline" onClick={()=>setReview(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleManagerReview} disabled={submitting}>
              {submitting ? <span className="spinner" style={{width:14,height:14,borderWidth:2}}/> : null} Submit Review
            </button>
          </>}
        >
          <div style={{ marginBottom:16, padding:12, background:'var(--surface-2)', borderRadius:8, fontSize:13 }}>
            <strong>Employee self-assessment:</strong><br/>
            Rating: {STAR(showReview.selfRating||0)}<br/>
            Strengths: {showReview.strengths||'—'}<br/>
            Improvements: {showReview.improvements||'—'}
          </div>
          <div className="form-group"><label className="form-label">Manager Rating (1–5)</label>
            <input type="range" min={1} max={5} value={revForm.managerRating} onChange={e=>setRevForm(p=>({...p,managerRating:Number(e.target.value),overallRating:Number(e.target.value)}))} style={{ width:'100%' }} />
            <p style={{ textAlign:'center', color:'var(--primary)', fontSize:16 }}>{STAR(revForm.managerRating)} ({revForm.managerRating}/5)</p>
          </div>
          <div className="form-group"><label className="form-label">Manager Comment</label><textarea className="form-control" rows={3} value={revForm.managerComment} onChange={e=>setRevForm(p=>({...p,managerComment:e.target.value}))} placeholder="Feedback for the employee…" /></div>
        </Modal>
      )}
    </div>
  );
}