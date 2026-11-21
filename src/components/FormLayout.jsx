/**
 * FormLayout — wrapper split-panel untuk FormSilabus.
 * Kiri: wizard (320px fixed), Kanan: canvas node preview.
 * Tombol Preview: overlay DetailDokumen bisa hide/show.
 */
import React, { useState, useRef } from 'react';

// ── Tooltip komponen ───────────────────────────────────────────────────────────
export function SectionTooltip({ title, children, hint }) {
  const [show, setShow] = useState(false);
  const timer = useRef(null);

  const onEnter = () => {
    timer.current = setTimeout(() => setShow(true), 400);
  };
  const onLeave = () => {
    clearTimeout(timer.current);
    setShow(false);
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
      <div
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
        style={{ cursor: 'default', width: '100%' }}
      >
        {children}
      </div>
      {show && hint && (
        <div style={{
          position: 'absolute', left: '100%', top: 0, zIndex: 9999,
          marginLeft: 10, width: 260, padding: '12px 14px',
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
            <span style={{ fontWeight: 700, fontSize: 15 }}>Pratinjau Dokumen</span>
            <button onClick={onClose} style={closeBtnStyle}>✕</button>
          </div>
          <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px 0' }}>
            Simpan draf terlebih dahulu untuk melihat pratinjau.
          </div>
        </div>
      </div>
    );
  }
  return (
    <div style={overlayStyle}>
      <div style={{ ...panelStyle, width: '90vw', maxWidth: 1100, height: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexShrink: 0 }}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>📄 Pratinjau Dokumen</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <a
              href={`/dokumen/${silabusId}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 12, color: '#1d4ed8', textDecoration: 'none', padding: '5px 12px', border: '1px solid #bfdbfe', borderRadius: 6 }}
            >
              🔗 Buka di tab baru
            </a>
            <button onClick={onClose} style={closeBtnStyle}>✕ Tutup</button>
          </div>
        </div>
        <iframe
          src={`/dokumen/${silabusId}`}
          style={{ flex: 1, border: 'none', borderRadius: 8, background: '#f8fafc' }}
          title="Pratinjau Dokumen"
        />
      </div>
    </div>
  );
}

const overlayStyle = {
  position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)',
  zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
  backdropFilter: 'blur(3px)',
};
const panelStyle = {
  background: 'white', borderRadius: 14, padding: '20px 24px',
  width: '95vw', maxWidth: 600, maxHeight: '90vh', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
};
const closeBtnStyle = {
  background: '#f1f5f9', border: 'none', borderRadius: 6,
  padding: '5px 12px', cursor: 'pointer', fontSize: 12, color: '#475569',
};

// ── Main FormLayout ────────────────────────────────────────────────────────────
export default function FormLayout({ children, canvas, silabusId, canvasProps }) {
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
        position: 'relative',
      }}>
        {/* Header panel */}
        <div style={{
          padding: '12px 16px', borderBottom: '1px solid #e2e8f0',
          background: '#f8fafc', flexShrink: 0,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>📝 Penyusunan Silabus</span>
          <div style={{ flex: 1 }} />
          <button
            onClick={() => setShowPreview(true)}
            style={{
              background: '#1d4ed8', color: 'white', border: 'none',
              borderRadius: 6, padding: '5px 11px', fontSize: 11,
              cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4,
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
              borderRadius: 6, padding: '5px 10px', fontSize: 11,
              cursor: 'pointer', fontWeight: 600,
            }}
          >
            {showCanvas ? '⊡ Sembunyikan Peta' : '⊞ Tampilkan Peta'}
          </button>
        </div>

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
