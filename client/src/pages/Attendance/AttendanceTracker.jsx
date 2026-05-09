import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { clockIn, clockOut, getMyAttendance, getTodayStatus, getAllAttendance } from '../../services/attendanceService';
import { getError } from '../../services/api';
import { useAuth } from '../../context/useAuth';
import Table from '../../components/Table';

const fmt = d => d ? new Date(d).toLocaleTimeString('en-KE',{hour:'2-digit',minute:'2-digit'}) : '—';
const fmtDate = d => d ? new Date(d).toLocaleDateString('en-KE',{day:'2-digit',month:'short',year:'numeric'}) : '—';

export default function AttendanceTracker() {
  const { isAdmin, isHR } = useAuth();
  const [today, setToday] = useState(null);
  const [records, setRecords] = useState([]);
  const [allRecords, setAllRecords] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [note, setNote] = useState('');
  const [view, setView] = useState('my');

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const [todayRes, myRes] = await Promise.all([
        getTodayStatus(),
        getMyAttendance()
      ]);

      setToday(todayRes?.data?.data || null);

      setRecords(myRes?.data?.data || []);

      setSummary(myRes?.data?.summary || {});

      if (isAdmin || isHR) {
        const allRes = await getAllAttendance();

        setAllRecords(allRes?.data?.data || []);
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

  const handleClockIn = async () => {
    setActing(true);
    try {
      await clockIn({ note });
      toast.success('Clocked in successfully!');
      setNote('');
      load();
    } catch(err) { toast.error(getError(err)); }
    finally { setActing(false); }
  };

  const handleClockOut = async () => {
    setActing(true);
    try {
      await clockOut({ note });
      toast.success('Clocked out. Have a great evening!');
      setNote('');
      load();
    } catch(err) { toast.error(getError(err)); }
    finally { setActing(false); }
  };

  const canClockIn  = !today?.clockIn;
  const canClockOut = today?.clockIn && !today?.clockOut;
  const isComplete  = today?.clockIn && today?.clockOut;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Attendance ⏱️</h1>
          <p className="page-subtitle">Track your daily work hours</p>
        </div>
      </div>

      {/* Today's Status Card */}
      <div className="card" style={{ marginBottom:24 }}>
        <div className="card-body">
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:20 }}>
            <div>
              <p style={{ fontSize:12, color:'var(--text-muted)', marginBottom:4 }}>TODAY — {new Date().toLocaleDateString('en-KE',{weekday:'long',day:'numeric',month:'long'})}</p>
              <div style={{ display:'flex', gap:32, flexWrap:'wrap' }}>
                <div><p style={{ fontSize:11, color:'var(--text-muted)' }}>Clock In</p><p style={{ fontSize:20, fontWeight:700, color: today?.clockIn ? 'var(--success)' : 'var(--text-light)' }}>{fmt(today?.clockIn)}</p></div>
                <div><p style={{ fontSize:11, color:'var(--text-muted)' }}>Clock Out</p><p style={{ fontSize:20, fontWeight:700, color: today?.clockOut ? 'var(--primary)' : 'var(--text-light)' }}>{fmt(today?.clockOut)}</p></div>
                <div><p style={{ fontSize:11, color:'var(--text-muted)' }}>Hours</p><p style={{ fontSize:20, fontWeight:700 }}>{today?.hoursWorked || 0}h</p></div>
                <div><p style={{ fontSize:11, color:'var(--text-muted)' }}>Status</p>
                  <span className={`badge ${isComplete?'badge-success':today?.clockIn?'badge-warning':'badge-neutral'}`}>
                    {isComplete ? '✅ Complete' : today?.clockIn ? '🟡 In Progress' : '⬜ Not Started'}
                  </span>
                </div>
              </div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:10, alignItems:'flex-end' }}>
              <input className="form-control" placeholder="Optional note…" value={note} onChange={e=>setNote(e.target.value)} style={{ width:220 }} />
              <div style={{ display:'flex', gap:10 }}>
                <button className="btn btn-success" onClick={handleClockIn} disabled={!canClockIn || acting}>
                  {acting && canClockIn ? <span className="spinner" style={{width:14,height:14,borderWidth:2}} /> : '▶'} Clock In
                </button>
                <button className="btn btn-danger" onClick={handleClockOut} disabled={!canClockOut || acting}>
                  {acting && canClockOut ? <span className="spinner" style={{width:14,height:14,borderWidth:2}} /> : '⏹'} Clock Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid-4" style={{ marginBottom:24 }}>
        <div className="stat-card"><div style={{fontSize:11,fontWeight:700,color:'var(--text-muted)',textTransform:'uppercase',marginBottom:6}}>Days Present</div><div style={{fontSize:24,fontWeight:800,color:'var(--success)'}}>{summary.present||0}</div></div>
        <div className="stat-card"><div style={{fontSize:11,fontWeight:700,color:'var(--text-muted)',textTransform:'uppercase',marginBottom:6}}>Late Arrivals</div><div style={{fontSize:24,fontWeight:800,color:'var(--warning)'}}>{summary.late||0}</div></div>
        <div className="stat-card"><div style={{fontSize:11,fontWeight:700,color:'var(--text-muted)',textTransform:'uppercase',marginBottom:6}}>Total Hours</div><div style={{fontSize:24,fontWeight:800,color:'var(--primary)'}}>{summary.totalHours||0}h</div></div>
        <div className="stat-card"><div style={{fontSize:11,fontWeight:700,color:'var(--text-muted)',textTransform:'uppercase',marginBottom:6}}>Overtime</div><div style={{fontSize:24,fontWeight:800,color:'var(--accent)'}}>{summary.totalOvertime||0}h</div></div>
      </div>

      {/* Records Tabs */}
      {(isAdmin || isHR) && (
        <div className="tabs">
          <button className={`tab ${view==='my'?'active':''}`} onClick={()=>setView('my')}>My Records</button>
          <button className={`tab ${view==='all'?'active':''}`} onClick={()=>setView('all')}>All Employees</button>
        </div>
      )}

      <div className="card">
        <div className="card-header"><span className="card-title">{view==='my'?'My Attendance History':'All Attendance Records'}</span></div>
        <Table loading={loading} data={view==='my'?records:allRecords} columns={
          view==='my'
            ? [
                { label:'Date', render: r => fmtDate(r.date) },
                { label:'Clock In', render: r => fmt(r.clockIn) },
                { label:'Clock Out', render: r => fmt(r.clockOut) },
                { label:'Hours', render: r => r.hoursWorked ? `${r.hoursWorked}h` : '—' },
                { label:'Status', render: r => <span className={`badge ${r.status==='present'?'badge-success':r.status==='late'?'badge-warning':'badge-danger'}`}>{r.status}</span> },
                { label:'Late', render: r => r.isLate ? <span className="badge badge-warning">Late</span> : '—' },
                { label:'Overtime', render: r => r.overtime>0 ? `+${r.overtime}h` : '—' },
              ]
            : [
                { label:'Employee', render: r => `${r.employee?.user?.firstName||''} ${r.employee?.user?.lastName||''}` },
                { label:'Dept', render: r => r.employee?.department||'—' },
                { label:'Date', render: r => fmtDate(r.date) },
                { label:'In', render: r => fmt(r.clockIn) },
                { label:'Out', render: r => fmt(r.clockOut) },
                { label:'Hours', render: r => r.hoursWorked ? `${r.hoursWorked}h` : '—' },
                { label:'Status', render: r => <span className={`badge ${r.status==='present'?'badge-success':'badge-warning'}`}>{r.status}</span> },
              ]
        } emptyMsg="No attendance records found." />
      </div>
    </div>
  );
}