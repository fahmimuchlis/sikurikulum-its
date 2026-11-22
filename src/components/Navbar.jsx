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
      background: '#1a1f2e',
      color: 'white',
      padding: '0 20px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      borderBottom: '1px solid rgba(255,255,255,0.08)',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        height: 52,
        gap: 16,
      }}>

        {/* ── Logo kiri ── */}
        <Link to="/dashboard" style={{
          display: 'flex', alignItems: 'center', gap: 8,
          textDecoration: 'none', flexShrink: 0,
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            width: 32, height: 32, borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: 13, color: 'white',
            flexShrink: 0,
          }}>
            SK
          </div>
          <div style={{ lineHeight: 1.1 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: 'white' }}>SiKurikulum</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>ITS v2.0</div>
          </div>
        </Link>

        {/* ── Nav links ── */}
        <nav style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
          <NavLink to="/dashboard" active={isActive('/dashboard')}>🏠 Dasbor</NavLink>
          <NavLink to="/cpmk"      active={isActive('/cpmk')}>🎯 CPMK</NavLink>
          <NavLink to="/matriks"   active={isActive('/matriks')}>📊 Matriks</NavLink>
          <NavLink to="/direktori" active={isActive('/direktori')}>📚 Direktori</NavLink>
        </nav>

        {/* ── Spacer tengah + info versi ── */}
        <div style={{
          flex: 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 10,
        }}>
          <span style={{
            fontSize: 10, color: 'rgba(255,255,255,0.35)',
            padding: '2px 10px',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 20,
          }}>
            Sistem Penyusunan Kurikulum ITS · 2025
          </span>
        </div>

        {/* ── Search bar ── */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <input
            type="text"
            placeholder="Cari mata kuliah…"
            value={searchVal}
            onChange={e => setSearchVal(e.target.value)}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 20,
              padding: '5px 14px 5px 32px',
              fontSize: 12, color: 'white', outline: 'none',
              width: 180,
            }}
          />
          <span style={{
            position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
            fontSize: 12, color: 'rgba(255,255,255,0.4)',
            pointerEvents: 'none',
          }}>🔍</span>
        </div>

        {/* ── View Node button ── */}
        <Link to="/cpmk" style={{
          background: 'rgba(99,179,237,0.15)',
          border: '1px solid rgba(99,179,237,0.3)',
          color: '#63b3ed',
          borderRadius: 6, padding: '5px 12px',
          fontSize: 11, fontWeight: 600, textDecoration: 'none',
          whiteSpace: 'nowrap', flexShrink: 0,
        }}>
          🗺 View Node
        </Link>

        {/* ── User avatar + name + role + logout ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {/* Avatar */}
          <div style={{
            width: 30, height: 30, borderRadius: '50%',
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: 12, color: 'white', flexShrink: 0,
          }}>
            {userInitial}
          </div>

          {/* Name + role */}
          <div style={{ lineHeight: 1.1 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'white' }}>{userName}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{userRole}</div>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            title="Keluar"
            style={{
              background: 'transparent',
              color: 'rgba(255,255,255,0.4)',
              border: '1px solid rgba(255,255,255,0.1)',
              padding: '4px 10px',
              borderRadius: 6, fontSize: 11,
              cursor: loggingOut ? 'not-allowed' : 'pointer',
              opacity: loggingOut ? 0.5 : 1,
            }}
          >
            {loggingOut ? '…' : '↪'}
          </button>
        </div>

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
        borderRadius: 6, fontSize: 12,
        color: active ? 'white' : 'rgba(255,255,255,0.5)',
        fontWeight: active ? 600 : 400,
        background: active ? 'rgba(255,255,255,0.1)' : 'transparent',
        transition: 'all 0.15s',
        display: 'flex', alignItems: 'center', gap: 5,
        textDecoration: 'none',
      }}
    >
      {children}
    </Link>
  );
}
