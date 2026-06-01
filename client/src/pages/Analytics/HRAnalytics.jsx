import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  BarChart3,
  Users,
  CheckCircle2,
  Plane,
  TrendingDown,
  AlertTriangle,
  PartyPopper,
} from 'lucide-react';
import { getDashboard, getHeadcount, getTurnover } from '../../services/analyticsService';
import { getError } from '../../services/api';

const COLORS = ['#2563eb','#06b6d4','#16a34a','#d97706','#dc2626','#7c3aed'];

export default function HRAnalytics() {
  const [dash, setDash]       = useState(null);
  const [headcount, setHC]    = useState(null);
  const [turnover, setTO]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod]   = useState(() => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}`; });

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const [d, h, t] = await Promise.all([
        getDashboard({ period }),
        getHeadcount(),
        getTurnover()
      ]);

      setDash(d?.data?.data || null);
      setHC(h?.data?.data || null);
      setTO(t?.data?.data || null);

    } catch (err) {
      toast.error(getError(err));

    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <div className="spinner-center"><div className="spinner spinner-lg" /></div>;

  const deptData = headcount?.byDepartment?.map(d => ({ name: d._id||'Other', value: d.count })) || [];

  return (
    <div>
      <div className="page-header">
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10
            }}
          >
            <BarChart3
              size={28}
              color="var(--primary)"
            />

            <h1 className="page-title">
              HR Analytics
            </h1>
          </div>
          <p className="page-subtitle">Real-time workforce intelligence</p>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <label className="form-label" style={{ margin:0 }}>Period:</label>
          <input className="form-control" type="month" value={period} onChange={e => setPeriod(e.target.value)} style={{ width:160 }} />
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid-4" style={{ marginBottom:24 }}>
        {[
          {
            label: 'Total Employees',
            value: headcount?.total,
            icon: <Users size={20} />,
            color: 'var(--primary)',
            bg: 'var(--primary-light)'
          },

          {
            label: 'Active',
            value: headcount?.active,
            icon: <CheckCircle2 size={20} />,
            color: 'var(--success)',
            bg: 'var(--success-light)'
          },

          {
            label: 'On Leave',
            value: headcount?.onLeave,
            icon: <Plane size={20} />,
            color: 'var(--warning)',
            bg: 'var(--warning-light)'
          },

          {
            label: 'Turnover Rate',
            value: turnover?.turnoverRate,
            icon: <TrendingDown size={20} />,
            color: 'var(--danger)',
            bg: 'var(--danger-light)'
          },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div>
                <p style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:6 }}>{s.label}</p>
                <p style={{ fontSize:28, fontWeight:800, color:s.color }}>{s.value ?? '—'}</p>
              </div>
              <div className="stat-icon" style={{ background:s.bg, color:s.color }}>{s.icon}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ marginBottom:20 }}>
        {/* Headcount by Department */}
        <div className="card">
          <div className="card-header"><span className="card-title">Headcount by Department</span></div>
          <div className="card-body">
            {deptData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={deptData} margin={{ top:0, right:0, left:-20, bottom:0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" tick={{ fontSize:11 }} />
                  <YAxis tick={{ fontSize:11 }} />
                  <Tooltip contentStyle={{ borderRadius:8, fontSize:12, border:'1px solid var(--border)' }} />
                  <Bar dataKey="value" fill="var(--primary)" radius={[4,4,0,0]} name="Employees" />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="empty-state" style={{ padding:'20px 0' }}><p>No department data available.</p></div>}
          </div>
        </div>

        {/* Department Pie */}
        <div className="card">
          <div className="card-header"><span className="card-title">Department Distribution</span></div>
          <div className="card-body">
            {deptData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={deptData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                    {deptData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius:8, fontSize:12 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="empty-state" style={{ padding:'20px 0' }}><p>No data yet.</p></div>}
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* Attendance Summary */}
        <div className="card">
          <div className="card-header"><span className="card-title">Attendance — {period}</span></div>
          <div className="card-body">
            {dash?.attendance?.breakdown?.length > 0 ? (
              dash.attendance.breakdown.map(b => (
                <div key={b._id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
                  <span style={{ fontSize:13, textTransform:'capitalize' }}>{b._id||'Unknown'}</span>
                  <div style={{ display:'flex', gap:16, fontSize:13 }}>
                    <span><strong>{b.count}</strong> records</span>
                    {b.avgHours && <span style={{ color:'var(--text-muted)' }}>{Number(b.avgHours).toFixed(1)}h avg</span>}
                  </div>
                </div>
              ))
            ) : <div className="empty-state" style={{ padding:'20px 0' }}><p>No attendance data for this period.</p></div>}
            {dash?.attendance?.lateCount != null && (
              <div style={{ marginTop:12, padding:'8px 12px', background:'var(--warning-light)', borderRadius:8, fontSize:12, color:'var(--warning)' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}
                >
                  <AlertTriangle size={16} />

                  <span>
                    {dash.attendance.lateCount} late arrivals · Avg{' '}
                    {dash.attendance.avgHoursWorked}h/day
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Payroll Summary */}
        <div className="card">
          <div className="card-header"><span className="card-title">Payroll — {period}</span></div>
          <div className="card-body">
            {dash?.payroll?.breakdown?.length > 0 ? (
              dash.payroll.breakdown.map(b => (
                <div key={b._id} style={{ padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:4 }}>
                    <span className="badge badge-neutral" style={{textTransform:'capitalize'}}>{b._id}</span>
                    <span><strong>{b.count}</strong> employees</span>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:4, fontSize:12, color:'var(--text-muted)' }}>
                    <span>Gross: KES {Number(b.totalGross||0).toLocaleString()}</span>
                    <span>Net: KES {Number(b.totalNet||0).toLocaleString()}</span>
                    <span>Avg Net: KES {Number(b.avgNet||0).toLocaleString()}</span>
                    <span>PAYE: KES {Number(b.totalPaye||0).toLocaleString()}</span>
                  </div>
                </div>
              ))
            ) : <div className="empty-state" style={{ padding:'20px 0' }}><p>No payroll data for this period.</p></div>}
          </div>
        </div>

        {/* Engagement */}
        <div className="card">
          <div className="card-header"><span className="card-title">Engagement Score</span></div>
          <div className="card-body" style={{ textAlign:'center', padding:'30px 20px' }}>
            <div style={{ fontSize:64, fontWeight:800, color:'var(--primary)', lineHeight:1 }}>{dash?.engagement?.avgNps || 0}</div>
            <div style={{ fontSize:13, color:'var(--text-muted)', marginTop:8 }}>Average NPS Score (0–10)</div>
            <div style={{ marginTop:16, padding:'10px', background:'var(--surface-2)', borderRadius:8, fontSize:13 }}>
              {dash?.engagement?.totalSurveys || 0} active surveys running
            </div>
          </div>
        </div>

        {/* Turnover */}
        <div className="card">
          <div className="card-header"><span className="card-title">Turnover by Department</span></div>
          <div className="card-body">
            {turnover?.byDepartment?.length > 0
              ? turnover.byDepartment.map(d => (
                  <div key={d._id} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', fontSize:13, borderBottom:'1px solid var(--border)' }}>
                    <span>{d._id||'Unassigned'}</span>
                    <span className="badge badge-danger">{d.count} left</span>
                  </div>
                ))
              : <div className="empty-state" style={{ padding:'20px 0' }}><div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      color: 'var(--success)'
                    }}
                  >
                    <PartyPopper size={18} />

                    <p>No terminations recorded.</p>
                  </div>
                </div>
            }
            <div style={{ marginTop:12, padding:'8px 12px', background:'var(--primary-light)', borderRadius:8, fontSize:12, color:'var(--primary)' }}>
              Overall turnover rate: <strong>{turnover?.turnoverRate || '0%'}</strong> ({turnover?.terminated||0} of {turnover?.total||0} employees)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}