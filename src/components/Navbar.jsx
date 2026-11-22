import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

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
      padding: '0 20px',
      boxShadow: 'none',
      borderBottom: '1px solid #e0e0e0',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      height: 44,
      display: 'flex',
      alignItems: 'center',
    }}>
      {/* ── Logo kiri ── */}
      <Link to="/dashboard" style={{
        display: 'flex', alignItems: 'center', gap: 8,
        textDecoration: 'none', flexShrink: 0, marginRight: 16,
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #e91e8c 0%, #9c27b0 100%)',
          width: 28, height: 28, borderRadius: 6,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 800, fontSize: 11, color: 'white', flexShrink: 0,
        }}>
          SK
        </div>
      </Link>

      {/* ── Nav links ── */}
      <nav style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
        <NavLink to="/dashboard" active={isActive('/dashboard')}>Dasbor</NavLink>
        <NavLink to="/direktori" active={isActive('/direktori')}>Direktori</NavLink>
      </nav>

      {/* ── Spacer + info versi (tengah) ── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 13, color: '#777', fontWeight: 400 }}>
          Versi 01.00 · Edit {new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
        </span>
      </div>

      {/* ── Search bar ── */}
      <div style={{ position: 'relative', flexShrink: 0, marginRight: 8 }}>
        <input
          type="text"
          placeholder="Search"
          value={searchVal}
          onChange={e => setSearchVal(e.target.value)}
          style={{
            background: 'white',
            border: '1px solid #d0d0d0',
            borderRadius: 20,
            padding: '5px 14px',
            fontSize: 13, color: '#333', outline: 'none',
            width: 160,
          }}
        />
      </div>

      {/* ── View Node button ── */}
      <Link to="/direktori" style={{
        background: 'white',
        border: '1px solid #c0c0c0',
        color: '#333',
        borderRadius: 20, padding: '5px 16px',
        fontSize: 13, fontWeight: 500, textDecoration: 'none',
        whiteSpace: 'nowrap', flexShrink: 0, marginRight: 10,
      }}>
        View Node
      </Link>

      {/* ── User avatar + nama + peran + dropdown ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        border: '1px solid #e0e0e0', borderRadius: 20,
        padding: '4px 10px 4px 6px', flexShrink: 0,
        cursor: 'pointer',
      }}
        onClick={handleLogout}
        title={loggingOut ? 'Keluar...' : 'Klik untuk keluar'}
      >
        {/* Avatar bulat */}
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: 'linear-gradient(135deg, #f48fb1 0%, #ff7043 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: 12, color: 'white', flexShrink: 0,
        }}>
          {userInitial}
        </div>
        <div style={{ lineHeight: 1.2 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#222' }}>{userName}</div>
          <div style={{ fontSize: 11, color: '#777' }}>{userRole}</div>
        </div>
        <span style={{ fontSize: 11, color: '#555', marginLeft: 2 }}>▾</span>
      </div>
    </header>
  );
}

function NavLink({ to, active, children }) {
  return (
    <Link
      to={to}
      style={{
        padding: '5px 11px',
        borderRadius: 6, fontSize: 13,
        color: active ? '#e91e8c' : '#555',
        fontWeight: active ? 600 : 400,
        background: active ? '#fce4ec' : 'transparent',
        transition: 'all 0.15s',
        textDecoration: 'none',
      }}
    >
      {children}
    </Link>
  );
}
