import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { getMyOnboarding, getAllOnboarding, initiate, completeTask } from '../../services/onboardingService';
import { getEmployees } from '../../services/employeeService';
import { getError } from '../../services/api';
import { useAuth } from '../../context/useAuth';
import Modal from '../../components/Modal';

const PHASE_STEPS = ['pre_boarding','first_day','first_week','first_month','completed'];
const PHASE_LABEL = { pre_boarding:'Pre-Boarding', first_day:'First Day', first_week:'First Week', first_month:'First Month', completed:'Completed' };
const CAT_ICON = { documentation:'📄', it_setup:'💻', training:'📚', meeting:'🤝', policy:'📋', other:'📌' };

export default function OnboardingForm() {
  const { isAdmin, isHR } = useAuth();
  const [myOnboarding, setMyOnboarding] = useState(null);
  const [allOnboarding, setAll]         = useState([]);
  const [employees, setEmployees]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [view, setView]                 = useState(isAdmin || isHR ? 'all' : 'mine');
  const [showInitiate, setInitiate]     = useState(false);
  const [submitting, setSub]            = useState(false);
  const [form, setForm]                 = useState({ employeeId:'', startDate:'' });

  const load = useCallback(async () => {
    setLoading(true);

    try {
      if (isAdmin || isHR) {
        const [allRes, empRes] = await Promise.all([
          getAllOnboarding(),
          getEmployees(),
        ]);

        setAll(allRes.data.data);
        setEmployees(empRes.data.data);
      }

      try {
        const myRes = await getMyOnboarding();
        setMyOnboarding(myRes.data.data);
      } catch {
        // Employee may not yet have onboarding assigned
        console.warn('No onboarding record found.');
      }

    } catch (err) {
      toast.error(getError(err));
    } finally {
      setLoading(false);
    }
  }, [isAdmin, isHR]);

  useEffect(() => {
    load();
  }, [load]);

  const handleInitiate = async (e) => {
    e.preventDefault();
    setSub(true);
    try {
      await initiate(form);
      toast.success('Onboarding initiated successfully! 🚀');
      setInitiate(false);
      setForm({ employeeId:'', startDate:'' });
      load();
    } catch (err) { toast.error(getError(err)); }
    finally { setSub(false); }
  };

  const handleCompleteTask = async (taskId) => {
    try {
      await completeTask(taskId);
      toast.success('Task marked complete! ✅');
      load();
    } catch (err) { toast.error(getError(err)); }
  };

  const phaseIndex = (phase) => PHASE_STEPS.indexOf(phase);

  const TaskItem = ({ task, canComplete }) => (
    <div style={{
      display:'flex', alignItems:'flex-start', gap:12, padding:'12px 0',
      borderBottom:'1px solid var(--border)', opacity: task.completed ? .7 : 1,
    }}>
      <button
        onClick={() => canComplete && !task.completed && handleCompleteTask(task._id)}
        style={{
          marginTop:2, width:22, height:22, borderRadius:6,
          border:`2px solid ${task.completed ? 'var(--success)' : task.required ? 'var(--primary)' : 'var(--border-2)'}`,
          background: task.completed ? 'var(--success)' : 'transparent',
          color:'#fff', fontSize:12, display:'grid', placeItems:'center',
          flexShrink:0, cursor: canComplete && !task.completed ? 'pointer' : 'default',
          transition:'all .15s',
        }}
      >
        {task.completed ? '✓' : ''}
      </button>
      <div style={{ flex:1 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8 }}>
          <div>
            <span style={{ fontSize:13, fontWeight: task.completed ? 400 : 600, textDecoration: task.completed ? 'line-through' : 'none', color: task.completed ? 'var(--text-muted)' : 'var(--text)' }}>
              {CAT_ICON[task.category]||'📌'} {task.title}
            </span>
            {task.description && <p style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>{task.description}</p>}
          </div>
          <div style={{ display:'flex', gap:6, flexShrink:0 }}>
            {task.required && <span className="badge badge-danger" style={{ fontSize:10 }}>Required</span>}
            <span className="badge badge-neutral" style={{ fontSize:10, textTransform:'capitalize' }}>{task.assignedTo?.replace('_',' ')}</span>
          </div>
        </div>
        {task.completed && task.completedAt && (
          <p style={{ fontSize:11, color:'var(--success)', marginTop:4 }}>✅ Done {new Date(task.completedAt).toLocaleDateString('en-KE')}</p>
        )}
      </div>
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Onboarding 🚀</h1>
          <p className="page-subtitle">New employee onboarding checklist and tracking</p>
        </div>
        {(isAdmin || isHR) && (
          <button className="btn btn-primary" onClick={() => setInitiate(true)}>+ Initiate Onboarding</button>
        )}
      </div>

      {(isAdmin || isHR) && (
        <div className="tabs">
          <button className={`tab ${view==='all'?'active':''}`} onClick={() => setView('all')}>All Onboarding ({allOnboarding.length})</button>
          <button className={`tab ${view==='mine'?'active':''}`} onClick={() => setView('mine')}>My Onboarding</button>
        </div>
      )}

      {loading
        ? <div className="spinner-center"><div className="spinner spinner-lg" /></div>
        : (
          <>
            {/* My onboarding */}
            {(view === 'mine' || (!isAdmin && !isHR)) && (
              myOnboarding
                ? (
                  <div>
                    {/* Phase stepper */}
                    <div className="card card-body" style={{ marginBottom:20 }}>
                      <h3 style={{ fontSize:14, fontWeight:700, marginBottom:16 }}>Your Onboarding Journey</h3>
                      <div style={{ display:'flex', alignItems:'center', overflowX:'auto', gap:0 }}>
                        {PHASE_STEPS.map((phase, i) => {
                          const current = phaseIndex(myOnboarding.phase);
                          const isDone  = i < current;
                          const isNow   = i === current;
                          return (
                            <div key={phase} style={{ display:'flex', alignItems:'center', flex: i < PHASE_STEPS.length-1 ? 1 : 'none' }}>
                              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, minWidth:90 }}>
                                <div style={{ width:32, height:32, borderRadius:'50%', display:'grid', placeItems:'center', fontWeight:700, fontSize:13,
                                  background: isDone ? 'var(--success)' : isNow ? 'var(--primary)' : 'var(--surface-2)',
                                  color: isDone || isNow ? '#fff' : 'var(--text-muted)',
                                  border: `2px solid ${isDone ? 'var(--success)' : isNow ? 'var(--primary)' : 'var(--border-2)'}`,
                                }}>
                                  {isDone ? '✓' : i+1}
                                </div>
                                <div style={{ fontSize:10, fontWeight:600, color: isNow ? 'var(--primary)' : 'var(--text-muted)', textAlign:'center', whiteSpace:'nowrap' }}>
                                  {PHASE_LABEL[phase]}
                                </div>
                              </div>
                              {i < PHASE_STEPS.length-1 && (
                                <div style={{ flex:1, height:2, background: isDone ? 'var(--success)' : 'var(--border)', margin:'0 4px', marginBottom:20 }} />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="card card-body" style={{ marginBottom:20 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                        <span style={{ fontSize:14, fontWeight:700 }}>Overall Progress</span>
                        <span style={{ fontSize:20, fontWeight:800, color: myOnboarding.progress===100 ? 'var(--success)' : 'var(--primary)' }}>
                          {myOnboarding.progress}%
                        </span>
                      </div>
                      <div className="progress-bar" style={{ height:10 }}>
                        <div className="progress-fill" style={{ width:`${myOnboarding.progress}%`, background: myOnboarding.progress===100 ? 'var(--success)' : 'var(--primary)' }} />
                      </div>
                      <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'var(--text-muted)', marginTop:8 }}>
                        <span>{myOnboarding.tasks?.filter(t=>t.completed).length||0} of {myOnboarding.tasks?.length||0} tasks done</span>
                        <span>Started {new Date(myOnboarding.startDate).toLocaleDateString('en-KE')}</span>
                      </div>
                    </div>

                    {/* Tasks */}
                    <div className="card">
                      <div className="card-header"><span className="card-title">Onboarding Checklist</span></div>
                      <div className="card-body" style={{ padding:'0 20px' }}>
                        {myOnboarding.tasks?.map(task => (
                          <TaskItem key={task._id} task={task} canComplete={true} />
                        ))}
                      </div>
                    </div>
                  </div>
                )
                : (
                  <div className="empty-state card card-body">
                    <div className="empty-icon">🚀</div>
                    <h3>No onboarding record</h3>
                    <p>Your HR team will set up your onboarding checklist. Check back soon!</p>
                  </div>
                )
            )}

            {/* All onboarding — admin view */}
            {view === 'all' && (isAdmin || isHR) && (
              allOnboarding.length === 0
                ? (
                  <div className="empty-state card card-body">
                    <div className="empty-icon">🚀</div>
                    <h3>No onboarding records</h3>
                    <p>Click "Initiate Onboarding" to start a new employee's journey.</p>
                  </div>
                )
                : (
                  <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                    {allOnboarding.map(ob => {
                      const empName = `${ob.employee?.user?.firstName||''} ${ob.employee?.user?.lastName||''}`.trim();
                      const done = ob.tasks?.filter(t=>t.completed).length || 0;
                      const total = ob.tasks?.length || 0;
                      return (
                        <div key={ob._id} className="card card-body">
                          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                              <div className="avatar avatar-lg">{ob.employee?.user?.firstName?.[0]}{ob.employee?.user?.lastName?.[0]}</div>
                              <div>
                                <div style={{ fontWeight:700, fontSize:15 }}>{empName}</div>
                                <div style={{ fontSize:12, color:'var(--text-muted)' }}>
                                  {ob.employee?.department} · Started {new Date(ob.startDate).toLocaleDateString('en-KE')}
                                </div>
                              </div>
                            </div>
                            <div style={{ display:'flex', alignItems:'center', gap:16 }}>
                              <div style={{ textAlign:'center' }}>
                                <div style={{ fontSize:20, fontWeight:800, color: ob.progress===100?'var(--success)':'var(--primary)' }}>{ob.progress}%</div>
                                <div style={{ fontSize:11, color:'var(--text-muted)' }}>{done}/{total} tasks</div>
                              </div>
                              <span className={`badge ${ob.phase==='completed'?'badge-success':ob.phase==='first_day'?'badge-warning':'badge-primary'}`} style={{ textTransform:'capitalize' }}>
                                {PHASE_LABEL[ob.phase]||ob.phase}
                              </span>
                            </div>
                          </div>
                          <div className="progress-bar" style={{ marginTop:12 }}>
                            <div className="progress-fill" style={{ width:`${ob.progress}%`, background: ob.progress===100?'var(--success)':'var(--primary)' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
            )}
          </>
        )
      }

      {/* Initiate Modal */}
      <Modal open={showInitiate} onClose={() => setInitiate(false)} title="Initiate Onboarding"
        footer={<>
          <button className="btn btn-outline" onClick={() => setInitiate(false)}>Cancel</button>
          <button className="btn btn-primary" form="onboard-form" type="submit" disabled={submitting}>
            {submitting ? <span className="spinner" style={{ width:14, height:14, borderWidth:2 }} /> : '🚀'}
            {' '}Initiate
          </button>
        </>}
      >
        <form id="onboard-form" onSubmit={handleInitiate}>
          <div className="form-group">
            <label className="form-label">Employee *</label>
            <select className="form-control form-select" value={form.employeeId} onChange={e => setForm(p=>({...p,employeeId:e.target.value}))} required>
              <option value="">Select new employee…</option>
              {employees.map(e => (
                <option key={e._id} value={e._id}>
                  {e.user?.firstName} {e.user?.lastName} — {e.department||'No dept'}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Start Date *</label>
            <input className="form-control" type="date" value={form.startDate} onChange={e => setForm(p=>({...p,startDate:e.target.value}))} required />
          </div>
          <div className="alert alert-warning" style={{ marginTop:8 }}>
            📋 A default onboarding checklist with 7 standard tasks will be created automatically.
          </div>
        </form>
      </Modal>
    </div>
  );
}