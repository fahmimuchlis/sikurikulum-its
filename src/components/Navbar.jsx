import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Icon from './Icon';

export default function Navbar({ user }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);
  const [searchVal, setSearchVal] = useState('');

  const handleLogout = async () => {
    setLoggingOut(true);
    await supabase.auth.signOut();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const userInitial = user?.email ? user.email[0].toUpperCase() : '?';
  const userName = user?.email?.split('@')[0] || 'Dosen';
  const userRole = user?.email?.endsWith('@its.ac.id') ? 'Dosen ITS' : 'Pengguna';

  return (
    <header style={{
      background: 'white',
      color: '#333',
      padding: '0 16px',
      borderBottom: '1px solid #e0e0e0',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      height: 44,
      display: 'flex',
      alignItems: 'center',
      gap: 4,
    }}>

      {/* ── Logo ── */}
      <Link to="/dashboard" style={{
        display: 'flex', alignItems: 'center', gap: 6,
        textDecoration: 'none', flexShrink: 0, marginRight: 8,
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #e91e8c 0%, #9c27b0 100%)',
          width: 28, height: 28, borderRadius: 6,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 800, fontSize: 11, color: 'white', flexShrink: 0,
          letterSpacing: '-0.5px',
        }}>
          SK
        </div>
      </Link>

      {/* ── Nav links ── */}
      <nav style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
        <NavLink to="/dashboard" active={isActive('/dashboard')} icon="dashboard">
          Dasbor
        </NavLink>
        <NavLink to="/direktori" active={isActive('/direktori')} icon="grid_view">
          Direktori
        </NavLink>
      </nav>

      {/* ── Info versi (tengah) ── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 12, color: '#aaa', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Icon name="info" size={14} style={{ color: '#ccc' }} />
          Versi 01.00 · {new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
        </span>
      </div>

      {/* ── Search ── */}
      <div style={{ position: 'relative', flexShrink: 0, marginRight: 4 }}>
        <Icon name="search" size={16} style={{
          position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
          color: '#aaa', pointerEvents: 'none',
        }} />
        <input
          type="text"
          placeholder="Cari…"
          value={searchVal}
          onChange={e => setSearchVal(e.target.value)}
          style={{
            background: 'white',
            border: '1px solid #e0e0e0',
            borderRadius: 20,
            padding: '5px 14px 5px 30px',
            fontSize: 12, color: '#333', outline: 'none',
            width: 140,
          }}
        />
      </div>

      {/* ── View Node ── */}
      <Link to="/direktori" style={{
        display: 'flex', alignItems: 'center', gap: 5,
        background: 'white', border: '1px solid #e0e0e0',
        color: '#444', borderRadius: 20,
        padding: '5px 14px', fontSize: 12, fontWeight: 500,
        textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0, marginRight: 6,
      }}>
        <Icon name="account_tree" size={15} style={{ color: '#666' }} />
        Peta Node
      </Link>

      {/* ── User pill ── */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 7,
          border: '1px solid #e0e0e0', borderRadius: 20,
          padding: '3px 10px 3px 5px', flexShrink: 0,
          cursor: 'pointer', background: 'white',
        }}
        onClick={handleLogout}
        title={loggingOut ? 'Keluar…' : 'Klik untuk keluar'}
      >
        <div style={{
          width: 26, height: 26, borderRadius: '50%',
          background: 'linear-gradient(135deg, #f48fb1 0%, #ff7043 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: 11, color: 'white', flexShrink: 0,
        }}>
          {userInitial}
        </div>
        <div style={{ lineHeight: 1.2 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#222' }}>{userName}</div>
          <div style={{ fontSize: 10, color: '#999' }}>{userRole}</div>
        </div>
        <Icon name="expand_more" size={16} style={{ color: '#aaa' }} />
      </div>
    </header>
  );
}

function NavLink({ to, active, icon, children }) {
  return (
    <Link
      to={to}
      style={{
        display: 'flex', alignItems: 'center', gap: 5,
        padding: '5px 10px', borderRadius: 6, fontSize: 12,
        color: active ? '#e91e8c' : '#666',
        fontWeight: active ? 600 : 400,
        background: active ? '#fce4ec' : 'transparent',
        transition: 'all 0.15s',
        textDecoration: 'none',
      }}
    >
      <Icon name={icon} size={16} style={{ color: active ? '#e91e8c' : '#888' }} />
      {children}
    </Link>
  );
}
