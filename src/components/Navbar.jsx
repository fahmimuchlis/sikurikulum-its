import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function Navbar({ user }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await supabase.auth.signOut();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header style={{
      background: 'var(--color-primary)',
      color: 'white',
      padding: '0 24px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        height: 60,
        gap: 32,
      }}>
        {/* Logo */}
        <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            background: 'white',
            color: 'var(--color-primary)',
            width: 36,
            height: 36,
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: 16,
            flexShrink: 0,
          }}>
            SK
          </div>
          <div style={{ lineHeight: 1.2 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>SiKurikulum</div>
            <div style={{ fontSize: 11, opacity: 0.75 }}>Arsitektur ITS</div>
          </div>
        </Link>

        {/* Navigasi tengah */}
        <nav style={{ display: 'flex', gap: 4, flex: 1 }}>
          <NavLink to="/dashboard" active={isActive('/dashboard')}>
            🏠 Dasbor Saya
          </NavLink>
          <NavLink to="/cpmk" active={isActive('/cpmk')}>
            🎯 CPMK Generator
          </NavLink>
          <NavLink to="/direktori" active={isActive('/direktori')}>
            📚 Direktori
          </NavLink>
        </nav>

        {/* User info & logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 13, opacity: 0.85 }}>
            {user?.email?.split('@')[0]}
          </span>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            style={{
              background: 'rgba(255,255,255,0.15)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.3)',
              padding: '6px 14px',
              borderRadius: 6,
              fontSize: 13,
              cursor: loggingOut ? 'not-allowed' : 'pointer',
              opacity: loggingOut ? 0.6 : 1,
            }}
          >
            {loggingOut ? 'Keluar...' : 'Keluar'}
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
        padding: '6px 14px',
        borderRadius: 6,
        fontSize: 14,
        color: 'white',
        fontWeight: active ? 600 : 400,
        background: active ? 'rgba(255,255,255,0.2)' : 'transparent',
        transition: 'background 0.15s',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}
    >
      {children}
    </Link>
  );
}
