import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  Clock3,
  Plane,
  Wallet,
  BarChart3,
  Target,
  BookOpen,
  Dumbbell,
  ClipboardList,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/useAuth';
import { getError } from '../../services/api';

export default function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('login');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [regForm, setRegForm] = useState({ firstName: '', lastName: '', email: '', password: '', department: '', position: '', phone: '' });

  const handleLogin = async e => {
    e.preventDefault();
    if (!loginForm.email || !loginForm.password) return toast.error('Email and password required.');
    setLoading(true);
    try {
      const user = await login(loginForm.email, loginForm.password);
      toast.success(`Welcome back, ${user.firstName}!`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(getError(err));
    } finally { setLoading(false); }
  };

  const handleRegister = async e => {
    e.preventDefault();

    if (regForm.password.length < 6) {
      return toast.error(
        'Password must be at least 6 characters.'
      );
    }

    setLoading(true);

    try {

      const response =
        await register(regForm);

      toast.info(
        response.message ||
        'Registration submitted. Await administrator approval.'
      );

      /**
       * Reset form
       */

      setRegForm({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        department: '',
        position: '',
        phone: '',
      });

      /**
       * Return to login tab
       */

      setTab('login');

    } catch (err) {

      toast.error(getError(err));

    } finally {

      setLoading(false);

    }
  };

  const DEPTS = ['Engineering','HR','Finance','Marketing','Operations','Sales','Legal','Other'];

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-card">
          {/* Logo */}
          <div className="auth-brand">
            <div className="auth-logo">E</div>
            <h2 className="auth-heading">EMS Unified HR</h2>
            <p className="auth-subheading">Transactional & Transformational</p>
          </div>

          {/* Tabs */}
          <div className="auth-tabs">
            <button
              className={`auth-tab ${tab === 'login' ? 'active' : ''}`}
              onClick={() => setTab('login')}
            >
              Sign In
            </button>

            <button
              className={`auth-tab ${tab === 'register' ? 'active' : ''}`}
              onClick={() => setTab('register')}
            >
              Register
            </button>
          </div>

          {tab === 'login' ? (
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input className="form-control" type="email" placeholder="you@company.com" value={loginForm.email} onChange={e => setLoginForm(p=>({...p,email:e.target.value}))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <div style={{ position:'relative' }}>
                  <input className="form-control" type={showPass?'text':'password'} placeholder="••••••••" value={loginForm.password} onChange={e => setLoginForm(p=>({...p,password:e.target.value}))} required style={{ paddingRight:40 }} />
                  <button type="button" onClick={() => setShowPass(s=>!s)} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'var(--text-muted)', fontSize:16 }}>
                    {showPass ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                  </button>
                </div>
              </div>
              <button type="submit" className="btn btn-primary btn-lg" style={{ width:'100%', marginTop:4 }} disabled={loading}>
                {loading ? <span className="spinner" style={{ width:16, height:16, borderWidth:2 }} /> : null}
                {loading ? ' Signing in…' : 'Sign In'}
              </button>
              <div
                style={{
                  marginTop: 16,
                  padding: 12,
                  borderRadius: 8,
                  background: 'rgba(59,130,246,.08)',
                  border: '1px solid rgba(59,130,246,.15)',
                  fontSize: 13,
                  lineHeight: 1.6,
                }}
              >
                New employee registrations require administrator approval before access is granted.
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">First Name *</label>
                  <input className="form-control" value={regForm.firstName} onChange={e=>setRegForm(p=>({...p,firstName:e.target.value}))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name *</label>
                  <input className="form-control" value={regForm.lastName} onChange={e=>setRegForm(p=>({...p,lastName:e.target.value}))} required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input className="form-control" type="email" value={regForm.email} onChange={e=>setRegForm(p=>({...p,email:e.target.value}))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Password * <span style={{ fontWeight:400, color:'var(--text-muted)' }}>(min 6 chars)</span></label>
                <input className="form-control" type="password" value={regForm.password} onChange={e=>setRegForm(p=>({...p,password:e.target.value}))} required minLength={6} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <select className="form-control form-select" value={regForm.department} onChange={e=>setRegForm(p=>({...p,department:e.target.value}))}>
                    <option value="">Select…</option>
                    {DEPTS.map(d=><option key={d}>{d}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Position</label>
                  <input className="form-control" placeholder="e.g. Engineer" value={regForm.position} onChange={e=>setRegForm(p=>({...p,position:e.target.value}))} />
                </div>
              </div>
              <button type="submit" className="btn btn-primary btn-lg" style={{ width:'100%' }} disabled={loading}>
                {loading ? <span className="spinner" style={{ width:16, height:16, borderWidth:2 }} /> : null}
                {loading ? ' Creating…' : 'Create Account'}
              </button>
              <div
                style={{
                  marginTop: 16,
                  padding: 12,
                  borderRadius: 8,
                  background: 'rgba(59,130,246,.08)',
                  border: '1px solid rgba(59,130,246,.15)',
                  fontSize: 13,
                  lineHeight: 1.6,
                }}
              >
                New employee registrations require administrator approval before access is granted.
              </div>
            </form>
          )}
        </div>
      </div>
      <div className="auth-right" style={{ display:'flex', flexDirection:'column', gap:24, maxWidth:480 }}>
        <h2 style={{ fontSize:32, fontWeight:800, lineHeight:1.2 }}>Unified HR Management System</h2>
        <p style={{ fontSize:16, opacity:.85, lineHeight:1.7 }}>
          From attendance tracking and payroll to performance reviews and wellness programs — everything your organisation needs in one platform.
        </p>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          {[
            {
              label: 'Attendance',
              icon: Clock3,
            },

            {
              label: 'Leave',
              icon: Plane,
            },

            {
              label: 'Payroll',
              icon: Wallet,
            },

            {
              label: 'Analytics',
              icon: BarChart3,
            },

            {
              label: 'Performance',
              icon: Target,
            },

            {
              label: 'Learning',
              icon: BookOpen,
            },

            {
              label: 'Wellness',
              icon: Dumbbell,
            },

            {
              label: 'Compliance',
              icon: ClipboardList,
            },
          ].map(feature => {
            const Icon = feature.icon;

            return (
              <div
                key={feature.label}
                style={{
                  background:
                    'rgba(255,255,255,.15)',
                  borderRadius: 10,
                  padding: '10px 14px',
                  fontSize: 13,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <Icon size={16} />

                <span>{feature.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}