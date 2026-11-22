/**
 * AppShell — Layout tanpa header global.
 * Hanya menampilkan floating AccountPill di pojok kanan atas.
 * Navigasi (Dashboard, Direktori, Keluar) ada di dalam dropdown akun.
 */
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Icon from './Icon';

// ── Account Pill + Dropdown ───────────────────────────────────────────────────
function AccountPill({ user }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const ref = useRef(null);

  const userInitial = user?.email ? user.email[0].toUpperCase() : '?';
  const userName = user?.email?.split('@')[0] || 'Dosen';
  const userRole = user?.email?.endsWith('@its.ac.id') ? 'Dosen ITS' : 'Pengguna';

  // Tutup dropdown saat klik luar
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    await supabase.auth.signOut();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { path: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
    { path: '/direktori', icon: 'grid_view', label: 'Direktori' },
  ];

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Pill trigger */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'white',
          border: '1px solid #e8e8e8',
          borderRadius: 24,
          padding: '5px 12px 5px 6px',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          transition: 'box-shadow 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)'}
        onMouseLeave={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'}
      >
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: 'linear-gradient(135deg, #f48fb1 0%, #ff7043 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: 12, color: 'white', flexShrink: 0,
        }}>
          {userInitial}
        </div>
        <div style={{ lineHeight: 1.25, textAlign: 'left' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#1a1a1a', whiteSpace: 'nowrap' }}>{userName}</div>
          <div style={{ fontSize: 10, color: '#999' }}>{userRole}</div>
        </div>
        <Icon name="expand_more" size={16} style={{ color: '#aaa', transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />
      </button>

      {/* Dropdown menu */}
      {open && (
        <div style={{
          position: 'absolute', right: 0, top: 'calc(100% + 8px)',
          background: 'white',
          border: '1px solid #efefef',
          borderRadius: 16,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          minWidth: 180,
          overflow: 'hidden',
          zIndex: 1000,
        }}>
          {/* User info header */}
          <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid #f5f5f5' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#1a1a1a' }}>{userName}</div>
            <div style={{ fontSize: 11, color: '#aaa', marginTop: 1 }}>{user?.email}</div>
          </div>

          {/* Nav items */}
          <div style={{ padding: '6px 6px' }}>
            {navItems.map(({ path, icon, label }) => (
              <button
                key={path}
                onClick={() => { navigate(path); setOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  width: '100%',
                  padding: '9px 12px',
                  border: 'none',
                  borderRadius: 10,
                  background: isActive(path) ? '#fce4ec' : 'transparent',
                  color: isActive(path) ? '#e91e8c' : '#444',
                  fontWeight: isActive(path) ? 600 : 400,
                  fontSize: 13, cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.12s',
                }}
                onMouseEnter={e => { if (!isActive(path)) e.currentTarget.style.background = '#f5f5f5'; }}
                onMouseLeave={e => { if (!isActive(path)) e.currentTarget.style.background = 'transparent'; }}
              >
                <Icon name={icon} size={16} style={{ color: isActive(path) ? '#e91e8c' : '#888' }} />
                {label}
              </button>
            ))}
          </div>

          {/* Divider + Keluar */}
          <div style={{ padding: '6px 6px', borderTop: '1px solid #f5f5f5' }}>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                width: '100%',
                padding: '9px 12px',
                border: 'none',
                borderRadius: 10,
                background: 'transparent',
                color: '#e53935',
                fontSize: 13, cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.12s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#ffeaea'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <Icon name="logout" size={16} style={{ color: '#e53935' }} />
              {loggingOut ? 'Keluar…' : 'Keluar'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Shell wrapper ─────────────────────────────────────────────────────────────
export default function AppShell({ user, children, topRight }) {
  return (
    <div style={{ minHeight: '100vh', background: '#f7f7f5', position: 'relative' }}>
      {/* Floating top-right: account pill + optional extra controls */}
      <div style={{
        position: 'fixed', top: 14, right: 16, zIndex: 200,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        {topRight}
        <AccountPill user={user} />
      </div>

      {/* Page content */}
      {children}
    </div>
  );
}

// ── Re-export AccountPill standalone jika diperlukan ─────────────────────────
export { AccountPill };
