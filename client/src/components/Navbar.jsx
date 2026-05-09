import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { useTheme } from '../context/useTheme';
import api from '../services/api';

export default function Navbar({ onMenuClick }) {
  const { user } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [notifCount, setNotifCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    api.get('/notifications?unread=true')
      .then(r => setNotifCount(r.data.unreadCount || 0))
      .catch(() => {});
  }, [user]);

  const roleColor = { superuser:'var(--danger)', admin:'var(--primary)', hr:'var(--info)', manager:'var(--success)', employee:'var(--text-muted)' };

  return (
    <header className="topbar">
      <button className="btn btn-ghost btn-icon" onClick={onMenuClick} title="Toggle menu">
        ☰
      </button>

      <div style={{ flex:1 }} />

      <button className="btn btn-ghost btn-icon" onClick={toggle} title="Toggle theme">
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>

      <button className="btn btn-ghost btn-icon" style={{ position:'relative' }} onClick={() => navigate('/notifications')} title="Notifications">
        🔔
        {notifCount > 0 && (
          <span style={{ position:'absolute', top:2, right:2, background:'var(--danger)', color:'#fff', borderRadius:'50%', width:16, height:16, fontSize:9, fontWeight:800, display:'grid', placeItems:'center' }}>
            {notifCount > 9 ? '9+' : notifCount}
          </span>
        )}
      </button>

      <div style={{ display:'flex', alignItems:'center', gap:10, paddingLeft:12, borderLeft:'1px solid var(--border)' }}>
        <div className="avatar">{user?.firstName?.[0]}{user?.lastName?.[0]}</div>
        <div style={{ lineHeight:1.3 }}>
          <div style={{ fontSize:13, fontWeight:600 }}>{user?.firstName} {user?.lastName}</div>
          <div style={{ fontSize:11, color: roleColor[user?.role] || 'var(--text-muted)', fontWeight:700, textTransform:'capitalize' }}>{user?.role}</div>
        </div>
      </div>
    </header>
  );
}