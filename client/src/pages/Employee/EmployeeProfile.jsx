import { useState, useEffect } from 'react';
import { Pencil, Mail, Phone, MapPin } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getEmployee, getMyProfile, updateEmployee } from '../../services/employeeService';
import { getError } from '../../services/api';
import { useAuth } from '../../context/useAuth';

const DEPTS = ['Engineering','HR','Finance','Marketing','Legal','Other'];

export default function EmployeeProfile() {
  const { id } = useParams();
  const { user, isAdmin } = useAuth();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm]       = useState({});
  const [saving, setSaving]   = useState(false);
  const [loading, setLoading] = useState(true);

  const isSelf = !id || id === user?._id;

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = id ? await getEmployee(id) : await getMyProfile();
        setProfile(data.data);
        const e = data.data;
        setForm({ department: e.department||'', position: e.position||'', phone: e.phone||'', address: e.address||'', dateOfBirth: e.dateOfBirth?.split('T')[0]||'', emergencyContact: e.emergencyContact||{ name:'', phone:'', relationship:'' } });
      } catch(err) { toast.error(getError(err)); }
      finally { setLoading(false); }
    };
    fetch();
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...form};
      if (!payload.dateOfBirth) delete payload.dateOfBirth;
      await updateEmployee(profile._id, payload);
      toast.success('Profile updated!');
      setEditing(false);
    } catch(err) { toast.error(getError(err)); }
    finally { setSaving(false); }
  };

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
  const setEC = k => e => setForm(p => ({ ...p, emergencyContact: { ...p.emergencyContact, [k]: e.target.value } }));

  if (loading) return <div className="spinner-center"><div className="spinner spinner-lg" /></div>;
  if (!profile) return <div className="empty-state"><p>Profile not found.</p></div>;

  const u = profile.user || {};

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{isSelf ? 'My Profile' : `${u.firstName} ${u.lastName}`}</h1>
          <p className="page-subtitle">Employee ID: {profile.employeeId}</p>
        </div>
        {(isSelf || isAdmin) && (
          editing
            ? <div style={{ display:'flex', gap:10 }}>
                <button className="btn btn-outline" onClick={() => setEditing(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? <span className="spinner" style={{width:14,height:14,borderWidth:2}}/> : null} Save Changes
                </button>
              </div>
            : <button className="btn btn-outline" onClick={() => setEditing(true)} style={{ display:'inline-flex', alignItems:'center', gap:7 }}><Pencil size={14} /> Edit Profile</button>
        )}
      </div>

      <div className="profile-layout">
        {/* Avatar card */}
        <div className="card card-body profile-sidebar">
          <div className="avatar avatar-xl profile-avatar">
            {u.firstName?.[0]}{u.lastName?.[0]}
          </div>
          <h3 className="profile-name">{u.firstName} {u.lastName}</h3>
          <p className="profile-position">{profile.position||'No position'}</p>
          <p className="profile-department">{profile.department||'No department'}</p>
          <div className="divider" />
          <div className="profile-stats">
            <div className="flex-between"><span style={{ color:'var(--color-text-muted)' }}>Role</span><span className={`badge badge-${u.role==='admin'?'primary':u.role==='hr'?'info':'neutral'}`} style={{textTransform:'capitalize'}}>{u.role}</span></div>
            <div className="flex-between"><span style={{ color:'var(--color-text-muted)' }}>Status</span><span className={`badge ${profile.status==='active'?'badge-success':'badge-warning'}`} style={{textTransform:'capitalize'}}>{profile.status}</span></div>
            {isAdmin && <div className="flex-between"><span style={{ color:'var(--color-text-muted)' }}>Salary</span><strong>KES {profile.salary?.toLocaleString()||0}</strong></div>}
          </div>
          <div className="divider" />
          <div className="profile-contact">
            <p style={{ display:'flex', alignItems:'center', gap:8 }}><Mail size={14} /> {u.email}</p>
            <p style={{ marginTop:4, display:'flex', alignItems:'center', gap:8 }}><Phone size={14} /> {profile.phone||'—'}</p>
            <p style={{ marginTop:4, display:'flex', alignItems:'center', gap:8 }}><MapPin size={14} /> {profile.address||'—'}</p>
          </div>
          <div className="divider" />
          <div style={{ fontSize:12, color:'var(--color-text-muted)', textAlign:'left' }}>
            <p style={{ fontWeight:700, marginBottom:4 }}>Leave Balance</p>
            {Object.entries(profile.leaveBalance||{}).map(([k,v]) => (
              <div key={k} className="flex-between profile-balance-row">
                <span style={{ textTransform:'capitalize' }}>{k}</span><strong>{v} days</strong>
              </div>
            ))}
          </div>
        </div>

        {/* Edit form / Info */}
        <div className="profile-content">
          <div className="card card-body">
            <h3 className="section-title">Work Information</h3>
            {editing ? (
              <div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Department</label>
                    <select className="form-control form-select" value={form.department} onChange={set('department')}>
                      <option value="">Select…</option>{DEPTS.map(d=><option key={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="form-group"><label className="form-label">Position</label><input className="form-control" value={form.position} onChange={set('position')} /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Phone</label><input className="form-control" value={form.phone} onChange={set('phone')} /></div>
                  <div className="form-group"><label className="form-label">Date of Birth</label><input className="form-control" type="date" value={form.dateOfBirth} onChange={set('dateOfBirth')} /></div>
                </div>
                <div className="form-group"><label className="form-label">Address</label><input className="form-control" value={form.address} onChange={set('address')} /></div>
              </div>
            ) : (
              <div className="profile-grid-3">
                {[['Department', profile.department],['Position', profile.position],['Phone', profile.phone],['Address', profile.address],['Started', profile.startDate ? new Date(profile.startDate).toLocaleDateString('en-KE') : '—'],['DOB', profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString('en-KE') : '—']].map(([l,v])=>(
                  <div key={l}><span className="profile-label">{l}</span><p className="profile-value">{v||'—'}</p></div>
                ))}
              </div>
            )}
          </div>

          <div className="card card-body">
            <h3 className="section-title">Emergency Contact</h3>
            {editing ? (
              <div className="form-row-3">
                <div className="form-group"><label className="form-label">Name</label><input className="form-control" value={form.emergencyContact?.name||''} onChange={setEC('name')} /></div>
                <div className="form-group"><label className="form-label">Phone</label><input className="form-control" value={form.emergencyContact?.phone||''} onChange={setEC('phone')} /></div>
                <div className="form-group"><label className="form-label">Relationship</label><input className="form-control" value={form.emergencyContact?.relationship||''} onChange={setEC('relationship')} /></div>
              </div>
            ) : (
              <div className="profile-grid">
                {[['Name', profile.emergencyContact?.name],['Phone', profile.emergencyContact?.phone],['Relationship', profile.emergencyContact?.relationship]].map(([l,v])=>(
                  <div key={l}><span className="profile-label">{l}</span><p className="profile-value">{v||'—'}</p></div>
                ))}
              </div>
            )}
          </div>

          {isAdmin && (
            <div className="card card-body">
              <h3 className="section-title">Bank & Tax Details</h3>
              <div className="profile-grid">
                {[['Bank', profile.bankDetails?.bankName],['Account', profile.bankDetails?.accountNumber],['KRA PIN', profile.taxPin],['NSSF No.', profile.nssfNumber],['NHIF No.', profile.nhifNumber]].map(([l,v])=>(
                  <div key={l}><span className="profile-label">{l}</span><p className="profile-value">{v||'—'}</p></div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}