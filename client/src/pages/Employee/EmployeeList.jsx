import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getEmployees, deactivateEmployee } from '../../services/employeeService';
import { registerAdmin } from '../../services/adminService';
import { getError } from '../../services/api';
import { useAuth } from '../../context/useAuth';
import Modal from '../../components/Modal';
import Table from '../../components/Table';

const DEPTS = ['Engineering','HR','Finance','Marketing','Operations','Sales','Legal','Other'];
const ROLES = ['employee','manager','hr','admin'];

export default function EmployeeList() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [showAdd, setShowAdd]     = useState(false);
  const [adding, setAdding]       = useState(false);
  const [form, setForm]           = useState({ firstName:'', lastName:'', email:'', password:'Admin@1234', role:'employee', department:'', position:'', phone:'' });

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const { data } = await getEmployees({
        search: search || undefined,
        department: deptFilter || undefined
      });

      setEmployees(data?.data || []);

    } catch (err) {
      toast.error(getError(err));

    } finally {
      setLoading(false);
    }
  }, [search, deptFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDeactivate = async id => {
    if (!confirm('Deactivate this employee?')) return;
    try { await deactivateEmployee(id); toast.success('Employee deactivated.'); load(); }
    catch(err) { toast.error(getError(err)); }
  };

  const handleAdd = async e => {
    e.preventDefault();
    setAdding(true);
    try {
      await registerAdmin(form);
      toast.success('Employee created!');
      setShowAdd(false);
      setForm({ firstName:'', lastName:'', email:'', password:'Admin@1234', role:'employee', department:'', position:'', phone:'' });
      load();
    } catch(err) { toast.error(getError(err)); }
    finally { setAdding(false); }
  };

  const roleColor = { superuser:'badge-danger', admin:'badge-primary', hr:'badge-info', manager:'badge-success', employee:'badge-neutral' };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Employees 👥</h1>
          <p className="page-subtitle">{employees.length} total team members</p>
        </div>
        {isAdmin && <button className="btn btn-primary" onClick={()=>setShowAdd(true)}>+ Add Employee</button>}
      </div>

      <div style={{ display:'flex', gap:12, marginBottom:16, flexWrap:'wrap' }}>
        <div className="search-wrap" style={{ flex:1, minWidth:200 }}>
          <span className="search-icon">🔍</span>
          <input className="form-control" placeholder="Search by name or email…" value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <select className="form-control form-select" style={{ width:180 }} value={deptFilter} onChange={e=>setDeptFilter(e.target.value)}>
          <option value="">All Departments</option>
          {DEPTS.map(d=><option key={d}>{d}</option>)}
        </select>
      </div>

      <div className="card">
        <Table loading={loading} data={employees} emptyMsg="No employees found." columns={[
          { label:'Employee', render: e => (
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div className="avatar">{e.user?.firstName?.[0]}{e.user?.lastName?.[0]}</div>
              <div>
                <div style={{ fontWeight:600, fontSize:13 }}>{e.user?.firstName} {e.user?.lastName}</div>
                <div style={{ fontSize:11, color:'var(--text-muted)' }}>{e.user?.email}</div>
              </div>
            </div>
          )},
          { label:'Employee ID', render: e => <code style={{ fontSize:12, color:'var(--text-muted)' }}>{e.employeeId}</code> },
          { label:'Department', key:'department' },
          { label:'Position', key:'position' },
          { label:'Role', render: e => <span className={`badge ${roleColor[e.user?.role]||'badge-neutral'}`} style={{textTransform:'capitalize'}}>{e.user?.role}</span> },
          { label:'Status', render: e => <span className={`badge ${e.status==='active'?'badge-success':e.status==='on_leave'?'badge-warning':'badge-danger'}`} style={{textTransform:'capitalize'}}>{e.status}</span> },
          { label:'Start Date', render: e => new Date(e.startDate||e.createdAt).toLocaleDateString('en-KE',{month:'short',year:'numeric'}) },
          { label:'', render: e => (
            <div style={{ display:'flex', gap:6 }}>
              <button className="btn btn-sm btn-outline" onClick={()=>navigate(`/employees/${e._id}`)}>View</button>
              {isAdmin && e.status==='active' && <button className="btn btn-sm btn-danger" style={{ background:'none', color:'var(--danger)', border:'1px solid var(--danger)' }} onClick={()=>handleDeactivate(e._id)}>Deactivate</button>}
            </div>
          )},
        ]} />
      </div>

      <Modal open={showAdd} onClose={()=>setShowAdd(false)} title="Add Employee"
        footer={<>
          <button className="btn btn-outline" onClick={()=>setShowAdd(false)}>Cancel</button>
          <button className="btn btn-primary" form="add-emp-form" type="submit" disabled={adding}>
            {adding ? <span className="spinner" style={{width:14,height:14,borderWidth:2}}/> : null} Add Employee
          </button>
        </>}
      >
        <form id="add-emp-form" onSubmit={handleAdd}>
          <div className="form-row">
            <div className="form-group"><label className="form-label">First Name *</label><input className="form-control" value={form.firstName} onChange={e=>setForm(p=>({...p,firstName:e.target.value}))} required /></div>
            <div className="form-group"><label className="form-label">Last Name *</label><input className="form-control" value={form.lastName} onChange={e=>setForm(p=>({...p,lastName:e.target.value}))} required /></div>
          </div>
          <div className="form-group"><label className="form-label">Email *</label><input className="form-control" type="email" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} required /></div>
          <div className="form-group"><label className="form-label">Password *</label><input className="form-control" type="password" value={form.password} onChange={e=>setForm(p=>({...p,password:e.target.value}))} required minLength={6} /></div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Department</label>
              <select className="form-control form-select" value={form.department} onChange={e=>setForm(p=>({...p,department:e.target.value}))}>
                <option value="">Select…</option>{DEPTS.map(d=><option key={d}>{d}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">Role</label>
              <select className="form-control form-select" value={form.role} onChange={e=>setForm(p=>({...p,role:e.target.value}))}>
                {ROLES.map(r=><option key={r} value={r} style={{textTransform:'capitalize'}}>{r}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Position</label><input className="form-control" value={form.position} onChange={e=>setForm(p=>({...p,position:e.target.value}))} /></div>
            <div className="form-group"><label className="form-label">Phone</label><input className="form-control" value={form.phone} onChange={e=>setForm(p=>({...p,phone:e.target.value}))} /></div>
          </div>
        </form>
      </Modal>
    </div>
  );
}