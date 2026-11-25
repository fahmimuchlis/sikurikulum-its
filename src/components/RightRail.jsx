import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Icon from './Icon';

const NAV_ITEMS = [
  { id: 'dashboard',  label: 'Dashboard',    icon: 'dashboard',       path: '/' },
  { id: 'direktori',  label: 'Direktori MK', icon: 'list',            path: '/direktori' },
  { id: 'dokumen',    label: 'Dokumen Saya', icon: 'folder_open',     path: '/dokumen' },
  { id: 'matriks',   label: 'Matriks OBE',  icon: 'grid_view',       path: '/matriks' },
  { id: 'pohon',     label: 'Pohon Kurikulum', icon: 'account_tree',   path: '/pohon' },
  { id: 'admin',     label: 'Master Data',  icon: 'database',         path: '/admin' },
];

const BOTTOM_ITEMS = [
  { id: 'setting',   label: 'Pengaturan',   icon: 'settings',         path: '/setting' },
  { id: 'darkmode',  label: 'Dark Mode',    icon: 'dark_mode',        action: 'darkmode' },
];

export default function RightRail({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const railW = expanded ? 200 : 44;

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const handleNav = (item) => {
    if (item.action === 'darkmode') return; // placeholder
    navigate(item.path);
  };

  const initials = user?.nama
    ? user.nama.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
    : 'U';

  return (
    <>
      {/* Rail */}
      <div style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: railW,
        height: '100vh',
        background: 'var(--color-rail-bg)',
        borderLeft: '1px solid var(--color-rail-border)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        transition: 'width 0.2s ease',
        overflow: 'hidden',
      }}>

        {/* Avatar / User menu trigger */}
        <div style={{ padding: '15px 0 0', width: '100%', display: 'flex', justifyContent: 'center', position: 'relative' }}>
          <button
            onClick={() => setShowUserMenu(v => !v)}
            title={user?.nama || 'Akun'}
            style={{
              width: 28, height: 28,
              borderRadius: '50%',
              background: 'var(--color-primary)',
              color: 'white',
              fontSize: 11,
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {initials}
          </button>
          {expanded && (
            <span style={{
              marginLeft: 10, fontSize: 13, fontWeight: 600,
              color: 'var(--color-gray-700)', whiteSpace: 'nowrap',
              lineHeight: '28px',
            }}>
              {user?.nama || 'Pengguna'}
            </span>
          )}
        </div>

        {/* User dropdown */}
        {showUserMenu && (
          <div style={{
            position: 'absolute',
            top: 50,
            right: 48,
            background: 'white',
            border: '1px solid var(--color-gray-200)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-lg)',
            minWidth: 180,
            zIndex: 200,
            overflow: 'hidden',
          }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-gray-100)' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-gray-900)' }}>
                {user?.nama || 'Pengguna'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-gray-500)', marginTop: 2 }}>
                {user?.email || ''}
              </div>
            </div>
            <button
              onClick={() => { setShowUserMenu(false); onLogout?.(); }}
              style={{
                width: '100%', padding: '10px 16px',
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 13, color: 'var(--color-danger)',
                textAlign: 'left',
              }}
            >
              <Icon name="logout" size={16} />
              Keluar
            </button>
          </div>
        )}

        {/* Divider */}
        <div style={{
          width: '80%', height: 1,
          background: 'var(--color-rail-border)',
          margin: '12px 0 8px',
          flexShrink: 0,
        }} />

        {/* Nav items */}
        <nav style={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV_ITEMS.map(item => {
            const active = isActive(item.path);
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item)}
                title={!expanded ? item.label : undefined}
                style={{
                  position: 'relative',
                  width: '100%',
                  padding: expanded ? '10px 14px' : '10px 0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: expanded ? 'flex-start' : 'center',
                  gap: expanded ? 10 : 0,
                  background: active ? 'rgba(42,100,150,0.1)' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: active ? 'var(--color-primary)' : 'var(--color-gray-500)',
                  transition: 'background 0.15s, color 0.15s',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(42,100,150,0.06)'; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
              >
                {/* Active strip */}
                {active && (
                  <div style={{
                    position: 'absolute',
                    left: 0, top: 4, bottom: 4,
                    width: 3,
                    borderRadius: '0 2px 2px 0',
                    background: 'var(--color-primary)',
                  }} />
                )}
                <Icon name={item.icon} size={20} />
                {expanded && (
                  <span style={{ fontSize: 13, fontWeight: active ? 600 : 400, whiteSpace: 'nowrap' }}>
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom items */}
        <div style={{ width: '100%', paddingBottom: 8 }}>
          {BOTTOM_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => handleNav(item)}
              title={!expanded ? item.label : undefined}
              style={{
                width: '100%',
                padding: expanded ? '10px 14px' : '10px 0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: expanded ? 'flex-start' : 'center',
                gap: expanded ? 10 : 0,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-gray-400)',
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-gray-700)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-gray-400)'; }}
            >
              <Icon name={item.icon} size={20} />
              {expanded && (
                <span style={{ fontSize: 13, whiteSpace: 'nowrap' }}>{item.label}</span>
              )}
            </button>
          ))}

          {/* Expand toggle */}
          <button
            onClick={() => setExpanded(v => !v)}
            title={expanded ? 'Tutup panel' : 'Buka panel'}
            style={{
              width: '100%',
              padding: '10px 0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: expanded ? 'flex-start' : 'center',
              paddingLeft: expanded ? 14 : 0,
              gap: expanded ? 10 : 0,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-gray-400)',
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-gray-700)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-gray-400)'; }}
          >
            <Icon name={expanded ? 'chevron_right' : 'chevron_left'} size={20} />
            {expanded && <span style={{ fontSize: 13 }}>Tutup</span>}
          </button>
        </div>
      </div>

      {/* Click-outside to close user menu */}
      {showUserMenu && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 99 }}
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </>
  );
}
