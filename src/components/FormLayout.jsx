/**
 * FormLayout — wrapper split-panel untuk FormSilabus.
 * Kiri: wizard (340px fixed) dengan tab navigasi horizontal.
 * Kanan: canvas node preview live.
 * Tombol Preview: overlay DetailDokumen.
 */
import React, { useState } from 'react';

// ── Tab colors (sesuai slide referensi) ───────────────────────────────────────
const TAB_COLORS = [
  { bg: '#ec4899', light: '#fdf2f8', text: 'white', border: '#f9a8d4' }, // Deskripsi — pink
  { bg: '#14b8a6', light: '#f0fdfa', text: 'white', border: '#99f6e4' }, // CPL — teal
  { bg: '#f97316', light: '#fff7ed', text: 'white', border: '#fdba74' }, // CPMK — orange
  { bg: '#8b5cf6', light: '#f5f3ff', text: 'white', border: '#c4b5fd' }, // Bahan Kajian — violet
  { bg: '#3b82f6', light: '#eff6ff', text: 'white', border: '#93c5fd' }, // SAP — blue
  { bg: '#10b981', light: '#ecfdf5', text: 'white', border: '#6ee7b7' }, // Konfirmasi — green
  { bg: '#6366f1', light: '#eef2ff', text: 'white', border: '#a5b4fc' }, // Extra tab
];

// ── Tooltip komponen ───────────────────────────────────────────────────────────
export function SectionTooltip({ title, children, hint }) {
  const [show, setShow] = useState(false);
  const timer = React.useRef(null);

  const onEnter = () => { timer.current = setTimeout(() => setShow(true), 400); };
  const onLeave = () => { clearTimeout(timer.current); setShow(false); };

  return (
    <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
      <div onMouseEnter={onEnter} onMouseLeave={onLeave} style={{ cursor: 'default', width: '100%' }}>
        {children}
      </div>
      {show && hint && (
        <div style={{
          position: 'absolute', left: 'calc(100% + 10px)', top: 0, zIndex: 9999,
          width: 260, padding: '12px 14px',
          background: 'white', border: '1px solid #e2e8f0',
          borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          pointerEvents: 'none',
        }}>
          <div style={{ fontWeight: 700, fontSize: 12, color: '#1e293b', marginBottom: 8, borderBottom: '1px solid #f1f5f9', paddingBottom: 6 }}>
            💡 {title}
          </div>
          <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.7 }}>{hint}</div>
        </div>
      )}
    </div>
  );
}

// ── Preview overlay ────────────────────────────────────────────────────────────
function PreviewOverlay({ silabusId, onClose }) {
  if (!silabusId) {
    return (
      <div style={overlayStyle}>
        <div style={panelStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981' }} />
              <span style={{ fontWeight: 700, fontSize: 14, color: '#1e293b', marginLeft: 8 }}>Pratinjau Dokumen</span>
            </div>
            <button onClick={onClose} style={closeBtnStyle}>✕</button>
          </div>
          <div style={{ textAlign: 'center', color: '#94a3b8', padding: '48px 0', fontSize: 13 }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📄</div>
            Simpan draf terlebih dahulu untuk melihat pratinjau.
          </div>
        </div>
      </div>
    );
  }
  return (
    <div style={overlayStyle} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ ...panelStyle, width: '90vw', maxWidth: 1100, height: '90vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
        {/* Titlebar */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '12px 20px', borderBottom: '1px solid #e2e8f0', flexShrink: 0,
          background: '#f8fafc',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981' }} />
            <span style={{ fontWeight: 700, fontSize: 13, color: '#1e293b', marginLeft: 10 }}>📄 Pratinjau Dokumen</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <a
              href={`/dokumen/${silabusId}`}
              target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 12, color: '#1d4ed8', textDecoration: 'none', padding: '5px 12px', border: '1px solid #bfdbfe', borderRadius: 6, background: '#eff6ff' }}
            >
              🔗 Tab Baru
            </a>
            <button onClick={onClose} style={closeBtnStyle}>✕ Tutup</button>
          </div>
        </div>
        <iframe
          src={`/dokumen/${silabusId}`}
          style={{ flex: 1, border: 'none', background: '#f8fafc' }}
          title="Pratinjau Dokumen"
        />
      </div>
    </div>
  );
}

const overlayStyle = {
  position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)',
  zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
  backdropFilter: 'blur(4px)',
};
const panelStyle = {
  background: 'white', borderRadius: 14, padding: '20px 24px',
  width: '95vw', maxWidth: 600, maxHeight: '90vh',
  boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
};
const closeBtnStyle = {
  background: '#f1f5f9', border: 'none', borderRadius: 6,
  padding: '5px 12px', cursor: 'pointer', fontSize: 12, color: '#475569',
  fontWeight: 500,
};

// ── Tab Bar ────────────────────────────────────────────────────────────────────
export function TabBar({ tabs, activeTab, onTabChange }) {
  return (
    <div style={{
      display: 'flex', overflowX: 'auto', flexShrink: 0,
      borderBottom: '1px solid #e2e8f0',
      scrollbarWidth: 'none',
      msOverflowStyle: 'none',
    }}>
      {tabs.map((tab, i) => {
        const color = TAB_COLORS[i % TAB_COLORS.length];
        const isActive = activeTab === i;
        return (
          <button
            key={i}
            onClick={() => onTabChange(i)}
            title={tab.label}
            style={{
              flexShrink: 0,
              padding: '8px 12px',
              border: 'none',
              borderBottom: isActive ? `3px solid ${color.bg}` : '3px solid transparent',
              background: isActive ? color.light : 'transparent',
              color: isActive ? color.bg : '#64748b',
              fontWeight: isActive ? 700 : 500,
              fontSize: 11,
              cursor: 'pointer',
              transition: 'all 0.15s',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              minWidth: 52,
              letterSpacing: 0.2,
            }}
          >
            {/* Nomor bulat */}
            <span style={{
              width: 20, height: 20, borderRadius: '50%',
              background: isActive ? color.bg : '#e2e8f0',
              color: isActive ? 'white' : '#94a3b8',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 700,
            }}>{i + 1}</span>
            {/* Label singkat */}
            <span style={{ maxWidth: 56, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 10 }}>
              {tab.short || tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ── Main FormLayout ────────────────────────────────────────────────────────────
export default function FormLayout({ children, silabusId, canvasProps, tabs, activeTab, onTabChange }) {
  const [showPreview, setShowPreview] = useState(false);
  const [showCanvas, setShowCanvas] = useState(true);
  const [KurikulumCanvas, setKurikulumCanvas] = React.useState(null);

  // Lazy load canvas
  React.useEffect(() => {
    import('./KurikulumCanvas').then(m => setKurikulumCanvas(() => m.default));
  }, []);

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 56px)', overflow: 'hidden', background: '#f1f5f9' }}>

      {/* ── Wizard panel kiri ── */}
      <div style={{
        width: 340, flexShrink: 0,
        display: 'flex', flexDirection: 'column',
        background: 'white',
        borderRight: '1px solid #e2e8f0',
        boxShadow: '2px 0 8px rgba(0,0,0,0.06)',
        zIndex: 10,
      }}>
        {/* Header panel */}
        <div style={{
          padding: '10px 14px', borderBottom: '1px solid #e2e8f0',
          background: '#f8fafc', flexShrink: 0,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', flex: 1 }}>📝 Penyusunan Silabus</span>
          <button
            onClick={() => setShowPreview(true)}
            style={{
              background: '#1d4ed8', color: 'white', border: 'none',
              borderRadius: 6, padding: '5px 10px', fontSize: 11,
              cursor: 'pointer', fontWeight: 600,
            }}
          >
            👁 Preview
          </button>
          <button
            onClick={() => setShowCanvas(v => !v)}
            title={showCanvas ? 'Sembunyikan canvas' : 'Tampilkan canvas'}
            style={{
              background: showCanvas ? '#eff6ff' : '#f1f5f9',
              color: showCanvas ? '#1d4ed8' : '#94a3b8',
              border: `1px solid ${showCanvas ? '#bfdbfe' : '#e2e8f0'}`,
              borderRadius: 6, padding: '5px 9px', fontSize: 11,
              cursor: 'pointer', fontWeight: 600,
            }}
          >
            {showCanvas ? '⊡' : '⊞'}
          </button>
        </div>

        {/* Tab bar */}
        {tabs && tabs.length > 0 && (
          <TabBar tabs={tabs} activeTab={activeTab || 0} onTabChange={onTabChange} />
        )}

        {/* Scroll area untuk form */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 0 80px 0' }}>
          {children}
        </div>
      </div>

      {/* ── Canvas kanan ── */}
      {showCanvas && (
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          {/* Label */}
          <div style={{
            position: 'absolute', top: 12, left: 12, zIndex: 5,
            background: 'white', border: '1px solid #e2e8f0',
            borderRadius: 8, padding: '5px 12px', fontSize: 11, color: '#64748b', fontWeight: 600,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}>
            🗺 Peta Kurikulum — Live Preview
          </div>

          {KurikulumCanvas && canvasProps ? (
            <KurikulumCanvas {...canvasProps} />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', fontSize: 13 }}>
              Memuat peta…
            </div>
          )}
        </div>
      )}

      {/* ── Preview overlay ── */}
      {showPreview && (
        <PreviewOverlay silabusId={silabusId} onClose={() => setShowPreview(false)} />
      )}
    </div>
  );
}
